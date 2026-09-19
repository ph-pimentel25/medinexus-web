"use client";
import Link from "next/link";
import { useState } from "react";
import { Search, ArrowUpRight } from "lucide-react";
import { useAuth } from "./auth-provider";
import { getSidebarNavigation } from "../lib/navigation";
const normalized = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
export default function WorkspaceSearch() {
  const { access } = useAuth();
  const [query, setQuery] = useState(""), [open, setOpen] = useState(false);
  const items = getSidebarNavigation(access.role).filter(item => normalized(item.label).includes(normalized(query)));
  return <div className="mn-workspace-search" onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false); }}>
    <Search size={16} aria-hidden="true" />
    <input aria-label="Buscar página no aplicativo" aria-controls="workspace-search-results" value={query}
      placeholder="Buscar no aplicativo..." onChange={e => { setQuery(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)}
      onKeyDown={e => { if (e.key === "Escape") setOpen(false); }} />
    {open && <div id="workspace-search-results" className="mn-search-results">
      <p className="mn-eyebrow px-3 pt-2">Acesso rápido</p>
      {items.map(item => <Link key={item.href} href={item.href} onClick={() => { setOpen(false); setQuery(""); }}><span>{item.label}</span><ArrowUpRight size={14} /></Link>)}
      {!items.length && <p className="px-3 py-4 text-sm text-mn-graphite/70">Nenhuma página encontrada.</p>}
    </div>}
  </div>;
}
