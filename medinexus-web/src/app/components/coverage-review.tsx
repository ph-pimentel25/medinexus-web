"use client";
import {useState} from "react";
import {supabase} from "../lib/supabase";
export default function CoverageReview({appointmentId,status,snapshot,onUpdated}:{appointmentId:string;status:string;snapshot:{operator?:string;plan?:string}|null;onUpdated:()=>void}){
 const [busy,setBusy]=useState(false);const [error,setError]=useState("");
 async function review(accepted:boolean){setBusy(true);setError("");const result=await supabase.rpc("resolve_appointment_coverage",{p_appointment_id:appointmentId,p_accepted:accepted});if(result.error)setError(result.error.message);else onUpdated();setBusy(false);}
 if(!["confirmation_required","accepted","rejected"].includes(status))return null;
 return <section className="mt-4 rounded-2xl border border-mn-border bg-mn-sand p-4"><h3 className="text-sm font-semibold">Convênio informado manualmente</h3><p className="mt-2 text-sm">{[snapshot?.operator,snapshot?.plan].filter(Boolean).join(" · ")||"Consultar cadastro do paciente"}</p><p className="mt-2 text-sm">{status==="accepted"?"Aceitação confirmada pela equipe":status==="rejected"?"Plano não aceito pela equipe":"Verifique a aceitação deste plano antes de confirmar a consulta."}</p><div className="mt-3 flex flex-wrap gap-3"><button type="button" disabled={busy} className="mn-button-secondary" onClick={()=>void review(true)}>Confirmar que aceitamos</button><button type="button" disabled={busy} className="mn-button-secondary" onClick={()=>void review(false)}>Não aceitamos</button></div>{error&&<p role="alert" className="mt-3 text-sm">{error}</p>}</section>;
}
