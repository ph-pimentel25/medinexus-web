import {createClient} from "@supabase/supabase-js";
import {createHash,timingSafeEqual} from "node:crypto";
import {generateClinicalSummary} from "../../../lib/clinical-summary-provider";
export const maxDuration=60;
export async function GET(request:Request){
 const secret=process.env.CRON_SECRET;const received=request.headers.get("authorization")||"";const expected=`Bearer ${secret}`;
 if(!secret||Buffer.byteLength(received)!==Buffer.byteLength(expected)||!timingSafeEqual(Buffer.from(received),Buffer.from(expected)))return Response.json({error:"Unauthorized"},{status:401});
 if(process.env.CLINICAL_AI_ENABLED!=="true"||!process.env.OPENAI_API_KEY||!process.env.OPENAI_CLINICAL_MODEL)return Response.json({error:"Resumo clínico com IA não ativado"},{status:503});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return Response.json({error:"Serviço não configurado"},{status:503});
 const admin=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const claimed=await admin.rpc("claim_clinical_summary_job");if(claimed.error)return Response.json({error:"Fila indisponível"},{status:503});
 const job=claimed.data?.[0];if(!job)return Response.json({processed:0});
 try{
  const a=await admin.from("appointments").select("patient_id,doctor_id,status").eq("id",job.appointment_id).single();if(a.error||a.data.status!=="completed")throw new Error();
  const [notes,documents,prescriptions,prefs]=await Promise.all([
   admin.from("consultation_notes").select("subjective,objective,assessment,plan,summary").eq("appointment_id",job.appointment_id),
   admin.from("medical_documents").select("document_type,status,content,plain_text").eq("appointment_id",job.appointment_id).neq("status","cancelled"),
   admin.from("prescriptions").select("document_type,content,guidance").eq("appointment_id",job.appointment_id),
   admin.from("patient_preferences").select("clinical_ai_consent").eq("patient_id",a.data.patient_id).single()
  ]);
  if(notes.error||documents.error||prescriptions.error||prefs.error||!prefs.data.clinical_ai_consent)throw new Error();
  const source={notes:notes.data||[],documents:[...(documents.data||[]),...(prescriptions.data||[]).map(p=>({...p,status:"legacy_uncertified"}))]};if(!source.notes.length&&!source.documents.length)throw new Error();
  const hash=createHash("sha256").update(JSON.stringify(source)).digest("hex");
  const generated=await generateClinicalSummary(source);
  const currentConsent=await admin.from("patient_preferences").select("clinical_ai_consent").eq("patient_id",a.data.patient_id).single();
  if(currentConsent.error||!currentConsent.data.clinical_ai_consent)throw new Error();
  const saved=await admin.from("clinical_ai_summaries").upsert({appointment_id:job.appointment_id,patient_id:a.data.patient_id,doctor_id:a.data.doctor_id,source_hash:hash,source_revision:job.source_revision,...generated},{onConflict:"appointment_id,source_hash",ignoreDuplicates:true});if(saved.error)throw new Error();
  const synced=await admin.from("clinical_ai_summaries").update({source_revision:job.source_revision}).eq("appointment_id",job.appointment_id).eq("source_hash",hash);if(synced.error)throw new Error();
  const done=await admin.from("clinical_summary_jobs").update({status:"done",updated_at:new Date().toISOString()}).eq("appointment_id",job.appointment_id).eq("source_revision",job.source_revision);if(done.error)throw new Error();
  const changed=await admin.from("clinical_summary_jobs").update({status:"queued",updated_at:new Date().toISOString()}).eq("appointment_id",job.appointment_id).eq("status","processing").neq("source_revision",job.source_revision);if(changed.error)throw new Error();
  return Response.json({processed:1,reviewRequired:true});
 }catch{
  await admin.from("clinical_summary_jobs").update({status:"failed",updated_at:new Date().toISOString()}).eq("appointment_id",job.appointment_id);
  return Response.json({error:"Não foi possível gerar o resumo. Registros médicos preservados."},{status:502});
 }
}
