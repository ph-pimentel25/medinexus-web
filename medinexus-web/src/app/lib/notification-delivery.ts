export type MessageKind = "requested" | "confirmed" | "reminder";
export function normalizeBrazilPhone(raw: string) {
  let digits=raw.replace(/\D/g, ""); if (digits.length===10 || digits.length===11) digits="55"+digits;
  return /^55[1-9][0-9]{9,10}$/.test(digits) ? "+"+digits : null;
}
export function notificationText(kind: MessageKind, date: string | null, appUrl: string) {
  const when=date ? new Date(date).toLocaleString("pt-BR",{timeZone:"America/Sao_Paulo",dateStyle:"short",timeStyle:"short"}) : "a definir";
  const heading=kind==="requested" ? "Recebemos sua solicitação de consulta. Aguarde a confirmação do atendimento." : kind==="confirmed" ? "Sua consulta foi confirmada." : "Lembrete da sua consulta confirmada.";
  return `${heading} Horário: ${when} (horário de Brasília). Confira os detalhes e sua presença em ${appUrl}/solicitacoes`;
}
export async function deliverMessage(input: { channel: "email" | "whatsapp"; kind: MessageKind; recipient: string; date: string | null; id: string }) {
  const appUrl=process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, ""); if (!appUrl || !appUrl.startsWith("https://")) return {status:"failed",detail:"URL HTTPS do aplicativo não configurada."};
  let response: Response;
  try {
    if(input.channel==="email") {
      if(!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) return {status:"queued",detail:"E-mail aguarda configuração."};
      response=await fetch("https://api.resend.com/emails",{method:"POST",signal:AbortSignal.timeout(12000),headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,"Content-Type":"application/json","Idempotency-Key":input.id},body:JSON.stringify({from:process.env.RESEND_FROM_EMAIL,to:[input.recipient],subject:input.kind==="reminder"?"Lembrete de consulta · MediNexus":input.kind==="confirmed"?"Consulta confirmada · MediNexus":"Solicitação recebida · MediNexus",text:notificationText(input.kind,input.date,appUrl)})});
    } else {
      const {TWILIO_ACCOUNT_SID:sid,TWILIO_AUTH_TOKEN:token,TWILIO_WHATSAPP_FROM:from}=process.env;
      const template=process.env[`TWILIO_TEMPLATE_${input.kind.toUpperCase()}`];
      if(!sid || !token || !from || !template) return {status:"queued",detail:"WhatsApp aguarda configuração de remetente e modelo aprovado."};
      const to=normalizeBrazilPhone(input.recipient);if(!to)return {status:"failed",detail:"Telefone inválido para WhatsApp."};
      const date=input.date?new Date(input.date).toLocaleString("pt-BR",{timeZone:"America/Sao_Paulo"}):"a definir";
      response=await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,{method:"POST",signal:AbortSignal.timeout(12000),headers:{Authorization:`Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({From:from,To:`whatsapp:${to}`,ContentSid:template,ContentVariables:JSON.stringify({"1":date,"2":`${appUrl}/solicitacoes`})})});
    }
  } catch { return {status:"unknown",detail:"Resultado do envio desconhecido. Conferir no provedor antes de reenviar."}; }
  if(!response.ok)return {status:response.status===429?"queued":"failed",detail:`Provedor recusou o envio (HTTP ${response.status}).`};
  const data=await response.json().catch(()=>({}));return {status:"accepted",provider_id:String(data.sid||data.id||""),detail:"Aceito pelo provedor; entrega ao destinatário ainda não confirmada."};
}
