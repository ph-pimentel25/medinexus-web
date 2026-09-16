"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  Calendar, 
  FileText, 
  User 
} from "lucide-react";

const navItems = [
  { label: "Início", href: "/dashboard", icon: Home },
  { label: "Consultas", href: "/consultas", icon: Calendar },
  { label: "Documentos", href: "/documentos", icon: FileText },
  { label: "Perfil", href: "/perfil", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  if (
    !pathname ||
    pathname === "/login" || 
    pathname === "/cadastro" || 
    pathname.startsWith("/validar-documentos")
  ) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-mn-border px-4 py-2 lg:hidden shadow-[0_-4px_16px_rgba(46,57,63,0.04)]">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center min-w-[64px] min-h-[48px] transition-colors ${
                isActive
                  ? "text-mn-teal font-semibold"
                  : "text-mn-graphite/40 hover:text-mn-graphite"
              }`}
            >
              <Icon className="w-5 h-5 mb-1" strokeWidth={isActive ? 2.2 : 1.8} />
              <span className="text-[11px] tracking-tight">{item.label}</span>
              {isActive && (
                <span className="w-1.5 h-1.5 bg-mn-teal rounded-full mt-0.5" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}