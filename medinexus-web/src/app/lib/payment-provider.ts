function clean(v?: string) { return typeof v === "string" ? v.trim().replace(/^["']|["']$/g, "").trim() : ""; }
export type CheckoutInput={reference:string;grossCents:number;method:"pix"|"card";appUrl:string};
export interface PaymentProvider {createCheckout(input:CheckoutInput):Promise<{id:string;url:string}>}
export function sandboxPaymentsConfigured(){
 const enabled=clean(process.env.PAYMENTS_ENABLED),env=clean(process.env.PAYMENT_ENVIRONMENT),key=clean(process.env.ASAAS_API_KEY);
 return enabled==="true"&&env==="sandbox"&&key.startsWith("$aact_hmlg_");
}
/** Real provider protocol; only the provider's sandbox is allowed in this release. */
export function paymentProvider():PaymentProvider{
 if(!sandboxPaymentsConfigured())throw new Error("payment_sandbox_unconfigured");
 const apiKey=clean(process.env.ASAAS_API_KEY);
 return {async createCheckout(input){
  if(!Number.isSafeInteger(input.grossCents)||input.grossCents<=0||input.grossCents>100000000||!['pix','card'].includes(input.method))throw new Error("invalid_checkout");
  const origin=new URL(input.appUrl);if(origin.protocol!=="https:"||origin.username||origin.password)throw new Error("invalid_callback_origin");
  const callback=new URL("/consultas",origin).href;
  const response=await fetch("https://api-sandbox.asaas.com/v3/checkouts",{method:"POST",signal:AbortSignal.timeout(20000),headers:{"Content-Type":"application/json","User-Agent":"MediNexus",access_token:apiKey},body:JSON.stringify({billingTypes:[input.method==='pix'?'PIX':'CREDIT_CARD'],chargeTypes:['DETACHED'],minutesToExpire:30,externalReference:input.reference,callback:{successUrl:callback,cancelUrl:callback,expiredUrl:callback},items:[{name:"Consulta particular (teste)",quantity:1,value:input.grossCents/100}]})});
  if(!response.ok){const errBody=await response.text().catch(()=>"");throw new Error(`payment_provider_rejected: ${response.status} ${errBody}`);}
  const data=await response.json();
  if(typeof data.id!=="string"||!data.id||data.id.length>150)throw new Error("invalid_checkout_response");
  const link=new URL(data.link||`https://sandbox.asaas.com/checkoutSession/show?id=${encodeURIComponent(data.id)}`);
  if(link.protocol!=="https:"||(!['sandbox.asaas.com','asaas.com'].includes(link.hostname))||link.username||link.password||link.port)throw new Error(`invalid_checkout_link: ${link.hostname}`);
  return {id:data.id,url:link.href};
 }};
}

