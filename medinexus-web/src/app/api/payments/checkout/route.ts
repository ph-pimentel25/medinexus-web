import {createClient} from "@supabase/supabase-js";
import {paymentProvider,sandboxPaymentsConfigured} from "../../../lib/payment-provider";
export function GET(){return Response.json({available:sandboxPaymentsConfigured(),environment:"sandbox"},{headers:{"Cache-Control":"no-store"}});}
export async function POST(request:Request){
 if(!sandboxPaymentsConfigured())return Response.json({error:"Pagamentos online ainda não ativados."},{status:503});
 const token=request.headers.get("authorization")?.replace(/^Bearer /,"");const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,service=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!token||!url||!key||!service)return Response.json({error:"Sessão ou serviço indisponível."},{status:401});
 const client=createClient(url,key,{global:{headers:{Authorization:`Bearer ${token}`}},auth:{persistSession:false}}),admin=createClient(url,service,{auth:{persistSession:false}});
 const {data:{user}}=await client.auth.getUser(token);if(!user)return Response.json({error:"Entre na sua conta."},{status:401});
 let body;try{body=await request.json();}catch{return Response.json({error:"Pedido inválido."},{status:400});}
 if(!body||typeof body.appointmentId!=="string"||!['pix','card'].includes(body.method))return Response.json({error:"Pedido inválido."},{status:400});
 const quote=await client.rpc("prepare_appointment_payment",{p_appointment_id:body.appointmentId});const q=Array.isArray(quote.data)?quote.data[0]:quote.data;
 if(quote.error||!q||q.patient_id!==user.id||q.status!=="quoted"||q.commission_cents!==0)return Response.json({error:"A consulta precisa estar confirmada, com valor definido e sem outro pagamento em andamento."},{status:409});
 const reserved=await admin.from("appointment_checkout_sessions").insert({quote_id:q.id,method:body.method,gross_cents:q.gross_cents}).select("id").single();
 if(reserved.error){const existing=await client.from("appointment_checkout_sessions").select("status,checkout_url").eq("quote_id",q.id).maybeSingle();if(existing.data?.status==='pending'&&existing.data.checkout_url)return Response.json({url:existing.data.checkout_url,environment:"sandbox"});return Response.json({error:"Já existe um teste para esta consulta. Confira o resultado antes de repetir."},{status:409});}
 try{const checkout=await paymentProvider().createCheckout({reference:reserved.data.id,grossCents:q.gross_cents,method:body.method,appUrl:process.env.NEXT_PUBLIC_APP_URL||""});const saved=await admin.from("appointment_checkout_sessions").update({provider_reference:checkout.id,checkout_url:checkout.url,status:"pending"}).eq("id",reserved.data.id);if(saved.error)throw new Error();return Response.json({url:checkout.url,environment:"sandbox"});}
 catch{await admin.from("appointment_checkout_sessions").update({status:"unknown"}).eq("id",reserved.data.id);return Response.json({error:"Resultado do teste incerto. Confira o Asaas antes de tentar novamente."},{status:502});}
}
