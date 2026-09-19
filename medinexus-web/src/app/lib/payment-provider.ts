export type CheckoutInput={reference:string;grossCents:number;method:"pix"|"card";appUrl:string};
export interface PaymentProvider {createCheckout(input:CheckoutInput):Promise<{id:string;url:string}>}
export function sandboxPaymentsConfigured(){return process.env.PAYMENTS_ENABLED==="true"&&process.env.PAYMENT_ENVIRONMENT==="sandbox"&&process.env.ASAAS_API_KEY?.startsWith("$aact_hmlg_")===true;}
/** Real provider protocol; only the provider's sandbox is allowed in this release. */
export function paymentProvider():PaymentProvider{
 if(!sandboxPaymentsConfigured())throw new Error("payment_sandbox_unconfigured");
 return {async createCheckout(input){
  if(!Number.isSafeInteger(input.grossCents)||input.grossCents<=0||input.grossCents>100000000||!['pix','card'].includes(input.method))throw new Error("invalid_checkout");
  const origin=new URL(input.appUrl);if(origin.protocol!=="https:"||origin.username||origin.password)throw new Error("invalid_callback_origin");
  const callback=new URL("/consultas",origin).href;
  const response=await fetch("https://api-sandbox.asaas.com/v3/checkouts",{method:"POST",signal:AbortSignal.timeout(20000),headers:{"Content-Type":"application/json","User-Agent":"MediNexus",access_token:process.env.ASAAS_API_KEY!},body:JSON.stringify({billingTypes:[input.method==='pix'?'PIX':'CREDIT_CARD'],chargeTypes:['DETACHED'],minutesToExpire:30,externalReference:input.reference,callback:{successUrl:callback,cancelUrl:callback,expiredUrl:callback},items:[{name:"Consulta particular — TESTE SEM COBRANÇA REAL",quantity:1,value:input.grossCents/100}]})});
  if(!response.ok)throw new Error("payment_provider_rejected");const data=await response.json();
  if(typeof data.id!=="string"||!data.id||data.id.length>150)throw new Error("invalid_checkout_response");
  const link=new URL(data.link||`https://sandbox.asaas.com/checkoutSession/show?id=${encodeURIComponent(data.id)}`);
  if(link.protocol!=="https:"||link.hostname!=="sandbox.asaas.com"||link.username||link.password||link.port)throw new Error("invalid_checkout_link");
  return {id:data.id,url:link.href};
 }};
}
