"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { getUserRole, publicRole, type RoleInfo } from "../lib/auth";
import { supabase } from "../lib/supabase";

type AuthState = { access: RoleInfo; loading: boolean; error: string; refresh: () => Promise<void> };
const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [access, setAccess] = useState(publicRole);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const generation = useRef(0);
  const refresh = useCallback(async () => {
    const request = ++generation.current;
    setLoading(true);
    setError("");
    try {
      const result = await getUserRole();
      if (request === generation.current) setAccess(result);
    } catch (cause) {
      if (request === generation.current) {
        setAccess(publicRole);
        setError(cause instanceof Error ? cause.message : "Não foi possível carregar sua conta.");
      }
    } finally {
      if (request === generation.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    let timer = setTimeout(() => void refresh(), 0);
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      clearTimeout(timer);
      // Schedule outside the auth callback to avoid re-entering Supabase's session lock.
      if (event === "SIGNED_OUT") {
        ++generation.current;
        setAccess(publicRole);
        setError("");
        setLoading(false);
      } else {
        timer = setTimeout(() => void refresh(), 0);
      }
    });
    return () => {
      clearTimeout(timer);
      ++generation.current;
      subscription.unsubscribe();
    };
  }, [refresh]);

  return <AuthContext.Provider value={{ access, loading, error, refresh }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth requires AuthProvider");
  return context;
}
