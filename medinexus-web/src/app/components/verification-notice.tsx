"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
export default function VerificationNotice({area,id}:{area:"doctor"|"clinic";id:string}) {
  const [status,setStatus]=useState<string|null>(null);
  useEffect(()=>{let alive=true;void supabase.from(area==="doctor"?"doctors":"clinics").select("verification_status").eq("id",id).maybeSingle().then(({data,error})=>{if(alive)setStatus(error?"unavailable":data?.verification_status||null);});return()=>{alive=false;};},[area,id]);
  if(!status||status==="verified")return null;
  const message=status==="pending"?"Seu cadastro está com verificação pendente. Os dados profissionais ainda precisam ser analisados pela equipe MediNexus.":status==="rejected"?"A verificação do seu cadastro foi recusada. Entre em contato com a equipe MediNexus para revisar os dados.":status==="suspended"?"A verificação do seu cadastro está suspensa. Entre em contato com a equipe MediNexus.":"Não foi possível consultar a situação de verificação do cadastro.";
  return <aside className="app-shell pt-4" role="status"><p className="rounded-xl border border-mn-border bg-mn-sand p-4 text-sm text-mn-teal">{message}</p></aside>;
}
