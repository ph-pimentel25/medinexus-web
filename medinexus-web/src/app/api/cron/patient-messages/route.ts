import { createClient } from "@supabase/supabase-js";
import { deliverMessage } from "../../../lib/notification-delivery";
export const maxDuration=60;
export async function GET(request:Request){
 if(!process.env.CRON_SECRET || request.headers.get("authorization")!==`Bearer ${process.env.CRON_SECRET}`)return Response.json({error:"Unauthorized"},{status:401});
 const {NEXT_PUBLIC_SUPABASE_URL:url,SUPABASE_SERVICE_ROLE_KEY:key}=process.env;
 if(!url||!key)return Response.json({error:"Serviço não configurado"},{status:503});
 const admin=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const claimed=await admin.rpc("claim_appointment_messages");if(claimed.error)return Response.json({error:"Fila indisponível"},{status:503});
 const counts:Record<string,number>={};
 await Promise.all((claimed.data||[]).map(async (job:{id:string;appointment_id:string;channel:"email"|"whatsapp";kind:"requested"|"confirmed"|"reminder";scheduled_start:string|null;attempts:number})=>{
  const {data:a,error}=await admin.from("appointments").select("status,patient_id,confirmed_start_at,requested_start_at").eq("id",job.appointment_id).maybeSingle();
  let result:{status:string;detail:string;provider_id?:string};
  if(error)result={status:"failed",detail:"Falha ao consultar agendamento."};
  else if(!a || !["pending","confirmed"].includes(a.status) || job.kind!=="requested" && a.status!=="confirmed" || job.scheduled_start!== (a.confirmed_start_at||a.requested_start_at) || a.confirmed_start_at && new Date(a.confirmed_start_at).getTime()<=Date.now())result={status:"skipped",detail:"Agendamento cancelado, alterado ou passado."};
  else {
   const [patient,prefs]=await Promise.all([admin.from("patients").select("email,phone").eq("id",a.patient_id).maybeSingle(),admin.from("patient_preferences").select("whatsapp_consent,email_consent").eq("patient_id",a.patient_id).maybeSingle()]);
   if(patient.error||prefs.error)result={status:"failed",detail:"Falha ao consultar preferências."};
   else if(!prefs.data?.[job.channel==="email"?"email_consent":"whatsapp_consent"])result={status:"skipped",detail:"Canal não autorizado pelo paciente."};
   else {const recipient=job.channel==="email"?patient.data?.email:patient.data?.phone;result=recipient?await deliverMessage({channel:job.channel,kind:job.kind,recipient,date:a.confirmed_start_at||a.requested_start_at,id:job.id}):{status:"skipped",detail:"Contato não cadastrado."};}
  }
  counts[result.status]=(counts[result.status]||0)+1;
  const saved=await admin.from("appointment_outbox").update({...result,...(result.status==="queued"?{available_at:new Date(Date.now()+3600000).toISOString(),attempts:job.attempts-1}:{}),updated_at:new Date().toISOString()}).eq("id",job.id).eq("status","processing");
  if(saved.error)counts.persistenceErrors=(counts.persistenceErrors||0)+1;
 }));
 return Response.json({ok:!counts.persistenceErrors,counts});
}
