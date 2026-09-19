import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";
const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
const admin=createClient(url,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});
const check=(r,label)=>{if(r.error)throw new Error(label+": "+r.error.message);return r.data};
async function login(role){
  const link=check(await admin.auth.admin.generateLink({type:"magiclink",email:role+"@medinexus.com"}),"session");
  const db=createClient(url,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false}});
  const data=check(await db.auth.verifyOtp({type:"magiclink",token_hash:link.properties.hashed_token}),"verify");
  return {db,user:data.user};
}
const patient=await login("paciente"),doctor=await login("medico"),clinic=await login("clinica");
const professional=check(await doctor.db.from("doctors").select("id,clinic_id,name,crm,crm_state").eq("user_id",doctor.user.id).single(),"doctor");
const specialty=check(await doctor.db.from("doctor_specialties").select("specialty_id").eq("doctor_id",professional.id).limit(1).single(),"specialty");
const marker="DEMONSTRAÇÃO MEDINEXUS — dados fictícios";
let appointment=check(await patient.db.from("appointments").select("id,status").eq("patient_id",patient.user.id).eq("notes",marker).limit(1).maybeSingle(),"existing demo");
let search=check(await patient.db.from("patient_search_preferences").select("id").eq("patient_id",patient.user.id).eq("notes",marker).limit(1).maybeSingle(),"existing search");
const start=new Date();start.setDate(start.getDate()+1);start.setHours(10,0,0,0);while([0,6].includes(start.getDay()))start.setDate(start.getDate()+1);
const end=new Date(start.getTime()+30*60000);
if(!search){
search=check(await patient.db.from("patient_search_preferences").insert({
 patient_id:patient.user.id,specialty_id:specialty.specialty_id,preferred_clinic_id:professional.clinic_id,
 max_radius_km:999,accepts_private_consultation:true,notes:marker,
 preferred_start_date:start.toISOString().slice(0,10),
}).select("id").single(),"patient creates search");
check(await patient.db.from("patient_search_time_windows").insert([1,2,3,4,5].map(weekday=>({
 search_preference_id:search.id,weekday,start_time:"08:00",end_time:"18:00",
}))),"search windows");
}
if(!appointment){
appointment=check(await patient.db.from("appointments").insert({
 patient_id:patient.user.id,doctor_id:professional.id,clinic_id:professional.clinic_id,
 specialty_id:specialty.specialty_id,requested_start_at:start.toISOString(),requested_end_at:end.toISOString(),
 status:"pending",patient_confirmation_status:"not_requested",appointment_mode:"private",notes:marker,appointment_duration_minutes:30,short_notice:true,
}).select("id,status").single(),"patient requests appointment");
console.log("PASS patient created request");
}
if(appointment.status==="pending"){
check(await doctor.db.rpc("confirm_my_doctor_appointment",{p_appointment_id:appointment.id}),"doctor confirms");
appointment=check(await doctor.db.from("appointments").select("id,status").eq("id",appointment.id).single(),"confirmed appointment");
console.log("PASS doctor confirmed request");
}
check(await clinic.db.from("appointments").select("id").eq("id",appointment.id).single(),"clinic sees appointment");
if(appointment.status==="confirmed"){
check(await patient.db.from("appointments").update({patient_confirmation_status:"confirmed",patient_confirmed_at:new Date().toISOString()}).eq("id",appointment.id).select("id").single(),"patient confirms attendance");
console.log("PASS patient confirmed attendance");
}
let document=check(await doctor.db.from("medical_documents").select("id,validation_token").eq("appointment_id",appointment.id).eq("title","Resumo de demonstração").maybeSingle(),"existing document");
if(!document){
document=check(await doctor.db.from("medical_documents").insert({
 document_type:"clinical_summary",status:"issued",patient_id:patient.user.id,doctor_id:professional.id,clinic_id:professional.clinic_id,
 appointment_id:appointment.id,title:"Resumo de demonstração",content:{text:marker+". Exemplo da integração entre consulta, histórico e documentos."},
 plain_text:marker+". Exemplo da integração entre consulta, histórico e documentos.",released_to_patient:true,released_at:new Date().toISOString(),
 issued_at:new Date().toISOString(),doctor_name:professional.name,doctor_crm:professional.crm,doctor_crm_state:professional.crm_state,
 clinic_name:"Clínica Horizonte · Demonstração",created_by:doctor.user.id,
}).select("id,validation_token").single(),"doctor issues demo summary");
}
check(await patient.db.from("medical_documents").select("id").eq("id",document.id).single(),"patient reads issued document");
console.log("PASS doctor issued document and patient can read it");
if(appointment.status!=="completed"){
check(await doctor.db.from("appointments").update({status:"completed",started_at:new Date().toISOString(),finished_at:new Date().toISOString()}).eq("id",appointment.id).select("id").single(),"doctor completes");
}
const outsider=createClient(url,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false}});
const privateRows=check(await outsider.from("medical_documents").select("id").eq("id",document.id),"anonymous access check");
if(privateRows.length)throw new Error("Anonymous user can read a private medical document.");
console.log("PASS unauthenticated requests cannot read the private document");
fs.mkdirSync("artifacts",{recursive:true});
fs.writeFileSync("artifacts/demo-flow.json",JSON.stringify({appointmentId:appointment.id,documentId:document.id,validationToken:document.validation_token,searchId:search.id,doctorId:professional.id,clinicId:professional.clinic_id},null,2));
console.log("Demo journey completed. One finished fictional appointment remains for history/document presentation.");
