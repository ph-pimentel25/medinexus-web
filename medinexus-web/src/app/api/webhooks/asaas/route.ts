import {timingSafeEqual} from "node:crypto";
import {createClient} from "@supabase/supabase-js";
export async function POST(request:Request){
 const secret=process.env.ASAAS_WEBHOOK_TOKEN,received=request.headers.get("asaas-access-token")||"";
 if(!secret||secret.length<32||Buffer.byteLength(secret)!==Buffer.byteLength(received)||!timingSafeEqual(Buffer.from(secret),Buffer.from(received)))return Response.json({error:"Unauthorized"},{status:401});
 if(process.env.PAYMENT_ENVIRONMENT!=="sandbox")return Response.json({error:"Sandbox only"},{status:503});
 const raw=await request.text();if(raw.length>65536)return Response.json({error:"Payload too large"},{status:413});
 let data;try{data=JSON.parse(raw);}catch{return Response.json({error:"Invalid JSON"},{status:400});}
 if(!data||typeof data.id!=="string"||data.id.length>200||typeof data.checkout?.id!=="string"||!Array.isArray(data.checkout?.items))return Response.json({error:"Invalid event"},{status:400});
 if(!['CHECKOUT_CREATED','CHECKOUT_PAID','CHECKOUT_CANCELED','CHECKOUT_EXPIRED'].includes(data.event))return Response.json({ignored:true});
 let cents=0;for(const item of data.checkout.items){if(typeof item.value!=="number"||!Number.isFinite(item.value)||item.value<0||!Number.isSafeInteger(item.quantity)||item.quantity<1)return Response.json({error:"Invalid amount"},{status:400});cents+=Math.round(item.value*100)*item.quantity;}
 if(!Number.isSafeInteger(cents)||cents<=0)return Response.json({error:"Invalid total"},{status:400});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!url||!key)return Response.json({error:"Unavailable"},{status:503});
 const admin=createClient(url,key,{auth:{persistSession:false}});const result=await admin.rpc("apply_sandbox_checkout_event",{p_event_id:data.id,p_reference:data.checkout.id,p_event:data.event,p_gross_cents:cents});
 if(result.error)return Response.json({error:"Event not reconciled; retry required"},{status:503});
 return Response.json({received:true});
}
