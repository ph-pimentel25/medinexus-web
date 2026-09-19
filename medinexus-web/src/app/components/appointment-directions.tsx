"use client";
import { useState } from "react";
import { MapPin, Navigation } from "lucide-react";
import { supabase } from "../lib/supabase";
import { addressText, directionsLinks } from "../lib/directions";

export default function AppointmentDirections({ clinicId, doctorId }: { clinicId: string | null; doctorId: string | null }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [destination, setDestination] = useState("");
  const [origin, setOrigin] = useState("");
  const [current, setCurrent] = useState(false);
  const [error, setError] = useState("");
  async function load() {
    setOpen(!open); if (open || destination) return;
    setBusy(true); setError("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Entre novamente para consultar seu trajeto.");
      const [place, profile] = await Promise.all([
        supabase.from(clinicId ? "clinics" : "doctors").select("*").eq("id", clinicId || doctorId || "").maybeSingle(),
        supabase.from("profiles").select("address_street,address_number,address_neighborhood,address_city,address_state,address_zipcode").eq("id", user.id).maybeSingle(),
      ]);
      if (place.error || profile.error) throw new Error("Não foi possível carregar os endereços.");
      if (!place.data?.address_street || !(place.data.address_city || place.data.city)) throw new Error("O consultório ainda não informou um endereço completo. Confirme o local com a clínica.");
      setDestination(addressText(place.data)); setOrigin(profile.data?.address_street ? addressText(profile.data) : "");
    } catch (e) { setError(e instanceof Error ? e.message : "Não foi possível carregar o trajeto."); }
    finally { setBusy(false); }
  }
  const links = directionsLinks(destination, current ? "" : origin);
  return <div className="w-full">
    <button type="button" className="mn-button-secondary" aria-expanded={open} onClick={() => void load()}><MapPin size={16} />Como chegar</button>
    {open && <div className="mt-3 rounded-2xl border border-mn-border bg-white p-4">
      {busy && <p role="status">Carregando endereço?</p>}{error && <p role="alert" className="text-sm text-amber-800">{error}</p>}
      {destination && <><p className="text-sm font-semibold">{destination}</p><label className="my-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={current || !origin} disabled={!origin} onChange={e => setCurrent(e.target.checked)} />Sair da localização atual</label>
        {!current && origin && <p className="mb-3 text-xs text-slate-500">Partida: {origin}</p>}
        <div className="flex flex-wrap gap-2"><a className="mn-button" href={links.google} target="_blank" rel="noopener noreferrer"><Navigation size={16} />Google Maps</a><a className="mn-button-secondary" href={links.waze} target="_blank" rel="noopener noreferrer">Waze</a><a className="mn-button-secondary" href={links.apple} target="_blank" rel="noopener noreferrer">Mapas da Apple</a></div>
        <p className="mt-3 text-xs text-slate-500">O Waze utiliza sua localização atual. Confira o destino no aplicativo escolhido.</p></>}
    </div>}
  </div>;
}
