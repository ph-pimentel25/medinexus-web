"use client";
import {useState} from "react";
import {supabase} from "../lib/supabase";
import {Reviews} from "./reviews";
type Label={name:string;operator_name:string};
const one=<T,>(value:T|T[]|null)=>Array.isArray(value)?value[0]:value;
export default function DoctorNetworkDetails({doctorId,clinicId}:{doctorId:string;clinicId:string|null}){
 const [opened,setOpened]=useState(false),[loaded,setLoaded]=useState(false),[message,setMessage]=useState("");
 const [specialties,setSpecialties]=useState<string[]>([]),[plans,setPlans]=useState<Label[]>([]),[windows,setWindows]=useState<{weekday:number;day_of_week:number;start_time:string;end_time:string}[]>([]),[privatePrice,setPrivatePrice]=useState<number|null>(null);
 async function load(){setOpened(v=>!v);if(loaded)return;setMessage("Carregando informações…");
  const [s,d,c,h,w]=await Promise.all([supabase.from("doctor_specialties").select("specialties(name)").eq("doctor_id",doctorId),supabase.from("doctors").select("accepts_private_consultation,private_price_cents").eq("id",doctorId).single(),clinicId?supabase.from("clinics").select("accepts_private_consultation,base_private_price_cents").eq("id",clinicId).single():Promise.resolve({data:null,error:null}),supabase.from(clinicId?"clinic_health_plans":"doctor_health_plans").select("health_plan_id,health_plans(name,operator_name)").eq(clinicId?"clinic_id":"doctor_id",clinicId||doctorId),supabase.from("doctor_availability").select("weekday,day_of_week,start_time,end_time").eq("doctor_id",doctorId).eq("is_active",true)]);
  if(s.error||d.error||c.error||h.error||w.error){setMessage("Não foi possível carregar os detalhes. Tente novamente.");return;}
  let accepted=h.data||[];
  if(clinicId){const restrictions=await supabase.from("doctor_health_plans").select("health_plan_id").eq("doctor_id",doctorId);if(restrictions.error){setMessage("Não foi possível conferir os convênios do médico.");return;}if(restrictions.data.length)accepted=accepted.filter(p=>restrictions.data.some(r=>r.health_plan_id===p.health_plan_id));}
  setSpecialties((s.data||[]).map(r=>one(r.specialties)?.name||""));setPlans(accepted.map(r=>one(r.health_plans)).filter((r):r is Label=>!!r));setWindows(w.data||[]);
  setPrivatePrice(d.data.accepts_private_consultation&&(!clinicId||c.data?.accepts_private_consultation)?(d.data.private_price_cents??c.data?.base_private_price_cents??0):null);setLoaded(true);setMessage("");
 }
 return <div className="mt-5"><button className="mn-button-secondary" aria-expanded={opened} onClick={()=>void load()}>{opened?"Fechar detalhes":"Perfil, planos, disponibilidade e avaliações"}</button>{opened&&<div className="mt-4 space-y-3 text-sm">{message&&<p role="status">{message}</p>}{loaded&&<><p><strong>Especialidades:</strong> {specialties.join(", ")||"Não informadas"}</p><p><strong>Particular:</strong> {privatePrice===null?"Não oferecido":privatePrice===0?"Valor a confirmar":(privatePrice/100).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}</p><p><strong>Planos cadastrados:</strong> {plans.map(p=>[p.operator_name,p.name].filter(Boolean).join(" · ")).join("; ")||"Nenhum informado"}</p><p className="text-xs">A compatibilidade é conferida com o plano do seu perfil. Planos informados manualmente exigem confirmação.</p><div><strong>Períodos de atendimento:</strong>{windows.length?windows.map((w,i)=><p key={i}>{["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"][w.weekday??w.day_of_week]} · {w.start_time.slice(0,5)}–{w.end_time.slice(0,5)}</p>):<p>Agenda ainda não informada.</p>}<p className="mt-1 text-xs">São os períodos de trabalho; horários livres são calculados na busca por disponibilidade.</p></div><Reviews kind="doctor" targetId={doctorId}/></>}</div>}</div>;
}
