"use client";
import { useState } from "react";
import { lookupZipcode, reverseGeocode } from "../lib/geolocation";
export default function AddressLookup({ onAddress }: { onAddress: (address: { street: string; neighborhood: string; city: string; state: string; zipcode: string; number?: string }) => void }) {
  const [zip, setZip] = useState(""); const [busy, setBusy] = useState(false); const [message, setMessage] = useState("");
  async function byZip() { setBusy(true); try { onAddress(await lookupZipcode(zip)); setMessage("Endereço preenchido. Confira o número e complemento."); } catch(e) { setMessage(e instanceof Error ? e.message : "Consulta indisponível."); } finally { setBusy(false); } }
  function gps() {
    if (!navigator.geolocation) { setMessage("GPS indisponível neste dispositivo."); return; }
    setBusy(true); navigator.geolocation.getCurrentPosition(async p => { try { const a = await reverseGeocode(p.coords.latitude,p.coords.longitude); onAddress({...a,zipcode:a.postalCode}); setMessage(`Precisão do GPS: aproximadamente ${Math.round(p.coords.accuracy)} m. Confira os campos antes de salvar.`); } catch(e) { setMessage(e instanceof Error ? e.message : "Não foi possível identificar o endereço."); } finally { setBusy(false); } },() => { setBusy(false); setMessage("Localização não autorizada ou indisponível. Use o CEP."); },{enableHighAccuracy:true,timeout:15000,maximumAge:0});
  }
  return <div className="rounded-2xl border border-mn-border bg-mn-sage-light/25 p-4"><p className="mb-3 text-sm font-semibold">Preencher endereço</p><div className="flex flex-wrap gap-2"><input className="mn-input max-w-44" aria-label="CEP para buscar endereço" inputMode="numeric" autoComplete="postal-code" maxLength={9} value={zip} onChange={e=>setZip(e.target.value)} placeholder="00000-000"/><button type="button" disabled={busy} className="mn-button-secondary" onClick={()=>void byZip()}>Buscar CEP</button><button type="button" disabled={busy} className="mn-button-secondary" onClick={gps}>Usar localização</button></div>{busy && <p role="status" className="mt-2 text-sm">Localizando…</p>}{message && <p role="status" className="mt-2 text-sm">{message}</p>}<p className="mt-2 text-xs text-slate-500">Endereços: ViaCEP e OpenStreetMap. O GPS identifica o local atual, que pode ser diferente do endereço de atendimento.</p></div>;
}
