import {timingSafeEqual} from "node:crypto";
import {createClient} from "@supabase/supabase-js";

function clean(v?: string) { return typeof v === "string" ? v.trim().replace(/^["']|["']$/g, "").trim() : ""; }

export async function POST(request:Request){
 const secret=clean(process.env.ASAAS_WEBHOOK_TOKEN),received=(request.headers.get("asaas-access-token")||"").trim();
 if(!secret||secret.length<32||Buffer.byteLength(secret)!==Buffer.byteLength(received)||!timingSafeEqual(Buffer.from(secret),Buffer.from(received))){
  console.error("Asaas webhook 401 unauthorized");
  return Response.json({error:"Unauthorized"},{status:401});
 }
 const envMode=clean(process.env.PAYMENT_ENVIRONMENT);
 if(envMode!=="sandbox"){
  console.error("Asaas webhook 503 wrong env:", envMode);
  return Response.json({error:"Sandbox only"},{status:503});
 }
 const raw=await request.text();if(raw.length>65536)return Response.json({error:"Payload too large"},{status:413});
 let data:any;try{data=JSON.parse(raw);}catch{return Response.json({error:"Invalid JSON"},{status:400});}
 if(!data||typeof data.id!=="string"||data.id.length>200)return Response.json({error:"Invalid event"},{status:400});
 if(!['CHECKOUT_CREATED','CHECKOUT_PAID','CHECKOUT_CANCELED','CHECKOUT_EXPIRED'].includes(data.event))return Response.json({ignored:true});
 const checkoutRef=data.checkout?.id||data.checkoutId;
 if(typeof checkoutRef!=="string"||!checkoutRef)return Response.json({error:"Missing checkout id"},{status:400});
 let cents=0;
 if(Array.isArray(data.checkout?.items)&&data.checkout.items.length>0){
  for(const item of data.checkout.items){
   if(typeof item.value==="number"&&Number.isFinite(item.value)&&item.value>=0){
    const qty=Number.isSafeInteger(item.quantity)&&item.quantity>0?item.quantity:1;
    cents+=Math.round(item.value*100)*qty;
   }
  }
 }
 if(cents<=0){
  const val=typeof data.checkout?.value==="number"?data.checkout.value:typeof data.checkout?.totalValue==="number"?data.checkout.totalValue:typeof data.payment?.value==="number"?data.payment.value:0;
  cents=Math.round(val*100);
 }
 if(!Number.isSafeInteger(cents)||cents<=0){
  console.error("Asaas webhook invalid amount");
  return Response.json({error:"Invalid total"},{status:400});
 }
 const url=clean(process.env.NEXT_PUBLIC_SUPABASE_URL)||process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=clean(process.env.SUPABASE_SERVICE_ROLE_KEY)||process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return Response.json({error:"Unavailable"},{status:503});
 const admin=createClient(url,key,{auth:{persistSession:false}});
 const result=await admin.rpc("apply_sandbox_checkout_event",{p_event_id:data.id,p_reference:checkoutRef,p_event:data.event,p_gross_cents:cents});
 if(result.error){
  console.error("apply_sandbox_checkout_event error:", result.error.code);
  return Response.json({error:"Event not reconciled; retry required"},{status:503});
 }
 return Response.json({received:true});
}


