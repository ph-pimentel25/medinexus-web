"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function SpecialtyPicker({ value, onChange }: { value: string[]; onChange: (ids: string[]) => void }) {
  const [items, setItems] = useState<{ id: string; name: string }[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let alive = true;
    void supabase.from("specialties").select("id, name").order("name").then(({ data, error }) => {
      if (!alive) return;
      setItems(data || []); setLoading(false);
      if (error) setError("Não foi possível carregar as especialidades. Recarregue a página.");
    });
    return () => { alive = false; };
  }, []);
  const normalize = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
  const filtered = items.filter(item => normalize(item.name).includes(normalize(query)));
  return <fieldset className="space-y-3">
    <legend className="text-sm font-semibold">Especialidades médicas</legend>
    <input aria-label="Filtrar especialidades" className="mn-input" placeholder="Digite para encontrar uma especialidade" value={query} onChange={e => setQuery(e.target.value)} />
    {loading && <p role="status" className="text-sm text-slate-500">Carregando especialidades…</p>}
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    <div className="grid max-h-56 gap-2 overflow-y-auto sm:grid-cols-2">
      {filtered.map(item => <label key={item.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm ${value.includes(item.id) ? "border-mn-teal bg-mn-teal-light/40" : "border-mn-border bg-white"}`}>
        <input type="checkbox" checked={value.includes(item.id)} onChange={e => onChange(e.target.checked ? [...value, item.id] : value.filter(id => id !== item.id))} />{item.name}
      </label>)}
    </div>
    {!loading && !error && !filtered.length && <p className="text-sm text-slate-500">Nenhuma especialidade encontrada.</p>}
    <p className="text-xs text-slate-500">{value.length} selecionada(s). Escolha as especialidades em que você atua.</p>
  </fieldset>;
}
