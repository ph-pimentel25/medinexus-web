"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function AppointmentPayment({appointmentId}:{appointmentId:string}) {
  const [busy,setBusy]=useState(false);const [message,setMessage]=useState("");
  const [quote,setQuote]=useState<{gross_cents:number;status:string}|null>(null);
  const [sandbox,setSandbox]=useState(false);
  useEffect(()=>{let alive=true;void fetch('/api/payments/checkout').then(r=>r.json()).then(data=>{if(alive)setSandbox(data.available===true&&data.environment==='sandbox');}).catch(()=>{});return()=>{alive=false;};},[]);
  async function checkout(method:'pix'|'card'){
    setBusy(true);setMessage('');try{const {data:{session}}=await supabase.auth.getSession();const result=await fetch('/api/payments/checkout',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${session?.access_token}`},body:JSON.stringify({appointmentId,method})});const data=await result.json();if(!result.ok)throw new Error(data.error);const target=new URL(data.url);if(target.protocol!=='https:'||target.hostname!=='sandbox.asaas.com')throw new Error('Link inválido');window.location.assign(target.href);}catch(e){setMessage(e instanceof Error?e.message:'Checkout indisponível.');}finally{setBusy(false);}
  }
  async function prepare(cash=false){
    setBusy(true);setMessage("");
    try {
      const result=await supabase.rpc("prepare_appointment_payment",{p_appointment_id:appointmentId,p_method:cash?"cash":null});
      if(result.error)throw result.error;
      const row=Array.isArray(result.data)?result.data[0]:result.data;
      if(!row)throw new Error();setQuote(row);
      if(cash)setMessage("Pagamento em dinheiro registrado para o atendimento. Ainda não consta como pago.");
    }catch{setMessage("Não foi possível preparar o pagamento. Confira se a consulta particular está confirmada e tente novamente.");}
    finally{setBusy(false);}
  }
  return <div className="mt-4 rounded-2xl border border-mn-border bg-mn-sand p-4">
    <h3 className="text-sm font-semibold">Pagamento da consulta particular</h3>
    {!quote?<button disabled={busy} className="mn-button-secondary mt-3" onClick={()=>void prepare()}>Consultar pagamento</button>:<><p className="my-3 font-semibold">{(quote.gross_cents/100).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}</p>{quote.status==="quoted"?<button disabled={busy} className="mn-button-secondary" onClick={()=>void prepare(true)}>Pagar presencialmente em dinheiro</button>:<p className="text-sm">{quote.status==="cash_due"?"Dinheiro · pagamento presencial pendente":`Situação: ${quote.status}`}</p>}<p className="mt-3 text-xs">PIX e cartão estarão disponíveis após a ativação do serviço de pagamentos. O acesso ao aplicativo é gratuito.</p></>}
    {quote?.status==='quoted'&&sandbox&&<div className="mt-3 space-y-2"><p className="text-sm font-semibold">Ambiente de testes · não quita a consulta real. Use somente dados fictícios de homologação.</p><div className="flex flex-wrap gap-2"><button className="mn-button-secondary" disabled={busy} onClick={()=>void checkout('pix')}>Testar PIX</button><button className="mn-button-secondary" disabled={busy} onClick={()=>void checkout('card')}>Testar cartão</button></div></div>}
    {message&&<p className="mt-3 text-sm" role="status">{message}</p>}
  </div>;
}
