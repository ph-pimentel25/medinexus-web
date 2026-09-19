"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";

export default function DoctorSignature({ doctorId }: { doctorId: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const hasInk = useRef(false);
  const [authorized, setAuthorized] = useState(false);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    let alive = true;
    void supabase.from("doctor_signatures").select("image_data, authorized_at").eq("doctor_id", doctorId).maybeSingle().then(({ data, error }) => {
      if (!alive) return;
      if (error) { setMessage("Não foi possível carregar sua assinatura. Tente novamente em instantes."); return; }
      if (data) {
        setAuthorized(Boolean(data.authorized_at)); setSaved(Boolean(data.authorized_at));
        const image = new window.Image();
        image.onload = () => { if (alive) { canvas.current?.getContext("2d")?.drawImage(image, 0, 0, 720, 200); hasInk.current = true; } };
        image.src = data.image_data;
      }
    });
    return () => { alive = false; };
  }, [doctorId]);
  function clear() { canvas.current?.getContext("2d")?.clearRect(0, 0, 720, 200); hasInk.current = false; setSaved(false); setAuthorized(false); }
  async function save() {
    if (!authorized || !hasInk.current || !canvas.current) { setMessage("Desenhe sua assinatura e autorize o uso antes de salvar."); return; }
    setBusy(true);
    const { error } = await supabase.rpc("authorize_doctor_signature", { p_doctor_id: doctorId, p_image: canvas.current.toDataURL("image/png") });
    setMessage(error ? "Não foi possível salvar a assinatura: " + error.message : "Assinatura autorizada. Novos documentos preparados por você receberão esta imagem. A certificação digital é uma etapa separada.");
    setSaved(!error); setBusy(false);
  }
  async function revoke() {
    setBusy(true);
    const { error } = await supabase.from("doctor_signatures").delete().eq("doctor_id", doctorId);
    if (!error) clear();
    setMessage(error ? "Não foi possível revogar a assinatura." : "Autorização revogada para futuras emissões. Documentos anteriores permanecem preservados."); setBusy(false);
  }
  return <section className="mn-panel space-y-4">
    <div><p className="mn-eyebrow">Documentos</p><h2 className="text-2xl font-semibold">Sua assinatura</h2><p className="mt-2 text-sm text-slate-600">Assine com o dedo, caneta ou mouse. A imagem será incluída nos documentos preparados por você. A emissão final exige também a certificação digital.</p></div>
    <canvas ref={canvas} width={720} height={200} aria-label="Área para desenhar sua assinatura" className="w-full touch-none rounded-xl border border-dashed border-slate-400 bg-white"
      onPointerDown={e => { if (busy) return; const ctx = canvas.current?.getContext("2d"); if (!ctx) return; e.currentTarget.setPointerCapture(e.pointerId); const r = e.currentTarget.getBoundingClientRect(); ctx.beginPath(); ctx.moveTo((e.clientX-r.left)*720/r.width, (e.clientY-r.top)*200/r.height); ctx.lineWidth = 2.4; ctx.lineCap = "round"; ctx.strokeStyle = "#142d3b"; drawing.current = true; setSaved(false); }}
      onPointerMove={e => { if (!drawing.current) return; const r = e.currentTarget.getBoundingClientRect(); const ctx = canvas.current?.getContext("2d"); ctx?.lineTo((e.clientX-r.left)*720/r.width, (e.clientY-r.top)*200/r.height); ctx?.stroke(); hasInk.current = true; }}
      onPointerUp={() => { drawing.current = false; }} onPointerCancel={() => { drawing.current = false; }} />
    <label className="flex items-start gap-3 text-sm"><input type="checkbox" checked={authorized} onChange={e => { setAuthorized(e.target.checked); setSaved(false); }} />Autorizo a inclusão desta assinatura nos documentos que eu emitir pela MediNexus.</label>
    <p className="text-xs text-slate-500">Imagem de assinatura autorizada. Não substitui assinatura digital com certificado ICP-Brasil.</p>
    <div className="flex flex-wrap gap-3"><button type="button" className="mn-button" disabled={busy || saved} onClick={() => void save()}>{busy ? "Salvando…" : saved ? "Assinatura autorizada" : "Salvar e autorizar"}</button><button type="button" className="mn-button-secondary" disabled={busy} onClick={clear}>Desenhar novamente</button><button type="button" className="mn-button-secondary" disabled={busy} onClick={() => void revoke()}>Revogar autorização</button></div>
    {message && <p role="status" className="text-sm">{message}</p>}
  </section>;
}
