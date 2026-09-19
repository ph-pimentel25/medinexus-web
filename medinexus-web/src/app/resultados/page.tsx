"use client";
import Link from "next/link";
import {Suspense,useEffect,useState} from "react";
import {useRouter,useSearchParams} from "next/navigation";
import Alert from "../components/alert";
import DoctorAvatar from "../components/doctor-avatar";
import {supabase} from "../lib/supabase";

type Candidate={doctor_id:string;doctor_name:string;photo_path:string;crm:string;crm_state:string;clinic_id:string|null;clinic_name:string;city:string|null;state:string|null;neighborhood:string|null;distance_km:number|null;start_at:string;end_at:string;duration_minutes:number;match_kind:"exact"|"nearby";difference_minutes:number;appointment_mode:"private"|"health_plan";coverage:string;private_price_cents:number|null};
function dateTime(value:string){return new Date(value).toLocaleString("pt-BR",{dateStyle:"short",timeStyle:"short",timeZone:"America/Sao_Paulo"});}
function Results(){
 const router=useRouter();const params=useSearchParams();const searchId=params.get("searchId");
 const [rows,setRows]=useState<Candidate[]>([]);const [loading,setLoading]=useState(true);const [error,setError]=useState("");
 const [requesting,setRequesting]=useState("");const [privateSearch,setPrivateSearch]=useState(false);const [reload,setReload]=useState(0);
 const [accepted,setAccepted]=useState<Record<string,{nearby?:boolean;private?:boolean}>>({});
 useEffect(()=>{let alive=true;void(async()=>{
  setLoading(true);setError("");setAccepted({});
  try{
   if(!searchId)throw new Error("Busca não encontrada. Informe sua disponibilidade novamente.");
   const {data:{user}}=await supabase.auth.getUser();if(!user)throw new Error("Entre na sua conta para consultar horários.");
   const [matches,pref]=await Promise.all([supabase.rpc("match_patient_availability",{p_search_id:searchId}),supabase.from("patient_search_preferences").select("accepts_private_consultation").eq("id",searchId).eq("patient_id",user.id).single()]);
   if(matches.error||pref.error)throw new Error(matches.error?.message||"Não foi possível carregar esta busca.");
   if(alive){setRows(matches.data||[]);setPrivateSearch(pref.data.accepts_private_consultation===true);}
  }catch(cause){if(alive){setRows([]);setError(cause instanceof Error?cause.message:"Não foi possível consultar horários.");}}
  finally{if(alive)setLoading(false);}
 })();return()=>{alive=false;};},[searchId,reload]);
 async function book(row:Candidate){
  setRequesting(row.doctor_id);setError("");
  try{
   const result=await supabase.rpc("request_matched_appointment",{p_search_id:searchId,p_doctor_id:row.doctor_id,p_start_at:row.start_at,p_accept_nearby:accepted[row.doctor_id]?.nearby===true,p_accept_private:accepted[row.doctor_id]?.private===true});
   if(result.error)throw new Error(result.error.message);router.push("/solicitacoes");
  }catch(cause){setError(cause instanceof Error?cause.message:"Não foi possível reservar. Atualize os horários.");}
  finally{setRequesting("");}
 }
 const exact=rows.filter(row=>row.match_kind==="exact").length;
 return <main className="app-shell space-y-6 py-10"><header className="flex flex-wrap justify-between gap-4"><div><p className="mn-eyebrow">Sua disponibilidade em primeiro lugar</p><h1 className="app-section-title">Atendimento que cabe na sua agenda</h1><p className="app-section-subtitle">Os melhores encaixes aparecem primeiro. Horários exibidos no fuso de Brasília.</p></div><Link className="mn-button-secondary" href="/busca">Alterar disponibilidade</Link></header>
 {error&&<Alert variant="error">{error}</Alert>}
 {loading?<p role="status">Consultando disponibilidade dos profissionais…</p>:<>
 {!!rows.length&&!exact&&<Alert variant="info">Não há horários disponíveis exatamente no período informado. Estas são as opções mais próximas, incluindo até sete dias antes ou depois. Confirme se pode comparecer antes de solicitar.</Alert>}
 {!rows.length&&!error&&<section className="mn-panel"><h2 className="text-xl font-semibold">Nenhum horário encontrado</h2><p className="mt-3 text-sm">Não encontramos encaixes nem alternativas próximas com esses filtros. Amplie o período ou o raio de busca.</p><Link href="/busca" className="mn-button mt-4">Ajustar disponibilidade</Link></section>}
 {rows.map((row,index)=>{const needsPrivate=row.appointment_mode==="private"&&!privateSearch;const needsNearby=row.match_kind==="nearby";const approval=accepted[row.doctor_id]||{};return <article key={row.doctor_id} className="mn-panel">
 <div className="flex flex-wrap items-start justify-between gap-5"><div className="flex items-center gap-4"><DoctorAvatar path={row.photo_path} name={row.doctor_name}/><div><p className="mn-eyebrow">{index===0?"Melhor encaixe · ":""}{needsNearby?"Horário alternativo":"Dentro da sua disponibilidade"}</p><h2 className="mt-1 text-xl font-semibold">{row.doctor_name}</h2><p className="mt-1 text-sm">CRM {row.crm}/{row.crm_state}</p></div></div><span className="rounded-full bg-mn-sage-light px-3 py-2 text-xs font-semibold">{row.appointment_mode==="private"?"Consulta particular":row.coverage==="confirmation_required"?"Convênio · confirmação necessária":"Plano cadastrado aceito"}</span></div>
 <div className="mt-5 grid gap-4 sm:grid-cols-3"><div><p className="text-xs text-mn-graphite/60">Local</p><p className="font-semibold">{row.clinic_name}</p><p className="text-sm">{[row.neighborhood,row.city,row.state].filter(Boolean).join(" · ")}</p>{row.distance_km!==null&&<p className="text-sm">{row.distance_km.toFixed(1)} km em linha reta</p>}</div><div><p className="text-xs text-mn-graphite/60">Horário sugerido</p><p className="font-semibold">{dateTime(row.start_at)}</p><p className="text-sm">{row.duration_minutes} minutos</p></div><div><p className="text-xs text-mn-graphite/60">Atendimento</p><p className="font-semibold">{row.appointment_mode==="private"?(row.private_price_cents!=null?(row.private_price_cents/100).toLocaleString("pt-BR",{style:"currency",currency:"BRL"}):"Valor a confirmar"):"Pelo convênio"}</p>{row.coverage==="confirmation_required"&&<p className="text-sm">A equipe precisa verificar o plano informado manualmente antes de confirmar a consulta.</p>}</div></div>
 {(needsNearby||needsPrivate)&&<div className="mt-5 space-y-3 rounded-2xl bg-mn-sand p-4">{needsNearby&&<label className="flex items-start gap-3 text-sm"><input type="checkbox" checked={approval.nearby===true} onChange={e=>setAccepted(old=>({...old,[row.doctor_id]:{...old[row.doctor_id],nearby:e.target.checked}}))}/>Posso comparecer em {dateTime(row.start_at)}, fora da disponibilidade que informei.</label>}{needsPrivate&&<label className="flex items-start gap-3 text-sm"><input type="checkbox" checked={approval.private===true} onChange={e=>setAccepted(old=>({...old,[row.doctor_id]:{...old[row.doctor_id],private:e.target.checked}}))}/>Meu plano não consta como aceito. Quero solicitar esta consulta como particular.</label>}</div>}
 <div className="mt-5 flex flex-wrap gap-3"><button className="mn-button" disabled={!!requesting||(needsNearby&&!approval.nearby)||(needsPrivate&&!approval.private)} onClick={()=>void book(row)}>{requesting===row.doctor_id?"Solicitando…":"Solicitar este horário"}</button>{row.clinic_id&&<Link className="mn-button-secondary" href={`/clinicas/${row.clinic_id}`}>Conhecer a clínica</Link>}</div>
 </article>;})}<button className="mn-button-secondary" onClick={()=>setReload(n=>n+1)} disabled={!!requesting}>Atualizar horários</button></>}
 </main>;
}
export default function ResultsPage(){return <Suspense fallback={<p className="p-8">Carregando busca…</p>}><Results/></Suspense>;}
