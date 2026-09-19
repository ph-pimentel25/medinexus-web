"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {supabase} from "../lib/supabase";
type Entry={id:string;date:string;doctor_name:string;ai_summaries:{id:string;summary:string}[];legacy_prescriptions:{title:string;content:string;guidance:string}[];notes:{subjective:string;objective:string;assessment:string;plan:string;summary:string}[];documents:{id:string;title:string;type:string;text:string}[]};
export default function AuthorizedClinicalHistory({patientId}:{patientId:string}){
 const [entries,setEntries]=useState<Entry[]>([]);const [message,setMessage]=useState("");const [loaded,setLoaded]=useState(false);
 useEffect(()=>{
  let alive=true;
  void(async()=>{
   const permission=await supabase.rpc("has_clinical_history_access",{p_patient:patientId});
   if(!alive)return;
   setEntries([]);setMessage("");
   if(permission.error){setMessage("Não foi possível verificar a autorização do histórico. Tente novamente.");setLoaded(true);return;}
   if(permission.data!==true){setMessage("O paciente precisa autorizar o compartilhamento no seu histórico clínico. Sem autorização, consulte apenas os registros dos seus próprios atendimentos.");setLoaded(true);return;}
   const result=await supabase.rpc("read_authorized_clinical_history",{p_patient_id:patientId});
   if(!alive)return;
   setLoaded(true);
   if(result.error)setMessage("Não foi possível consultar o histórico. A autorização pode ter expirado ou sido revogada. Atualize a página e tente novamente.");
   else setEntries(result.data||[]);
  })();
  return()=>{alive=false;};
 },[patientId]);
 return <section className="mn-panel mb-6"><h2 className="text-xl font-semibold">Histórico compartilhado pelo paciente</h2>{!loaded&&<p className="mt-3 text-sm">Verificando autorização…</p>}{message&&<p className="mt-3 text-sm">{message}</p>}{loaded&&!message&&!entries.length&&<p className="mt-3 text-sm">Nenhuma consulta concluída disponível.</p>}{entries.map(entry=><article key={entry.id} className="mt-5 border-t border-mn-border pt-4"><h3 className="font-semibold">{new Date(entry.date).toLocaleDateString("pt-BR")} · {entry.doctor_name}</h3>{entry.ai_summaries.length?entry.ai_summaries.slice(0,1).map(s=><div key={s.id}><p className="mt-2 text-xs font-semibold text-mn-purple">Resumo da IA · conferido pelo médico</p><p className="mt-2 whitespace-pre-wrap text-sm">{s.summary}</p></div>):<p className="mt-2 text-sm">Sem resumo de IA liberado.</p>}<details className="mt-3"><summary className="cursor-pointer font-semibold text-mn-teal">Abrir registros originais desta consulta</summary>{entry.notes.map((note,index)=><div key={index} className="mt-3 space-y-2 whitespace-pre-wrap text-sm"><p className="font-semibold">Registrado pelo médico</p>{Object.entries(note).filter(([,value])=>value).map(([key,value])=><p key={key}><strong>{{subjective:"Relato",objective:"Achados",assessment:"Avaliação",plan:"Plano",summary:"Resumo médico"}[key]||key}: </strong>{value}</p>)}</div>)}{entry.legacy_prescriptions?.map((p,index)=><div key={index} className="mt-4 whitespace-pre-wrap text-sm"><p className="font-semibold">{p.title||"Receita anterior"} · registro legado</p><p>{p.content}</p><p>{p.guidance}</p><p className="text-xs">Este registro não comprova assinatura certificada.</p></div>)}{entry.documents.map(doc=><div key={doc.id} className="mt-4 whitespace-pre-wrap text-sm"><p className="font-semibold">{doc.title}</p><p>{doc.text}</p><Link className="mt-2 inline-block underline" href={`/documentos-medicos/${doc.id}`}>Abrir documento emitido</Link></div>)}</details></article>)}</section>;
}
