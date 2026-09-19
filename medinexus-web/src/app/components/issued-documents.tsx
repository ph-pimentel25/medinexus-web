"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { getDocumentType } from "../lib/medical-document-utils";

type Row = { id:string; patient_id:string; title:string|null; document_type:string; status:string; created_at:string; issued_at:string|null; patients?:{full_name:string}|null; identity_snapshot?:{patient?:{full_name?:string}}|null };
const PAGE_SIZE=30;
export default function IssuedDocuments({doctorId}:{doctorId:string}) {
  const [period,setPeriod]=useState("month"); const [date,setDate]=useState(()=>new Date().toLocaleDateString("en-CA"));
  const [patient,setPatient]=useState(""); const [kind,setKind]=useState(""); const [page,setPage]=useState(0);
  const [rows,setRows]=useState<Row[]>([]); const [busy,setBusy]=useState(true); const [error,setError]=useState(""); const [more,setMore]=useState(false);
  useEffect(()=>{
    let alive=true;
    const timer=setTimeout(()=>{void (async()=>{
      setBusy(true);setError("");
      // The existing documents table has no PostgREST relationship to patients.
      // Resolve names separately, with the same authenticated RLS permissions.
      let query=supabase.from("medical_documents").select("id,patient_id,title,document_type,status,created_at,issued_at,identity_snapshot").eq("doctor_id",doctorId);
      if(kind)query=query.eq("document_type",kind);
      if(patient.trim()){
        const matches=await supabase.from("patients").select("id").ilike("full_name",`%${patient.trim().replace(/[\\%_]/g," ")}%`).limit(201);
        if(!alive)return;
        if(matches.error||(matches.data?.length||0)>200){setRows([]);setMore(false);setError(matches.error?"Não foi possível buscar o paciente.":"Informe um nome mais específico para filtrar os documentos.");setBusy(false);return;}
        if(!matches.data?.length){setRows([]);setMore(false);setBusy(false);return;}
        query=query.in("patient_id",matches.data.map(p=>p.id));
      }
      if(period!=="all"&&date){
        const start=new Date(`${date}T00:00:00`); const end=new Date(start);
        if(period==="week"){start.setDate(start.getDate()-((start.getDay()+6)%7));end.setTime(start.getTime());end.setDate(end.getDate()+7);}
        else if(period==="month"){start.setDate(1);end.setTime(start.getTime());end.setMonth(end.getMonth()+1);}
        else end.setDate(end.getDate()+1);
        query=query.gte("created_at",start.toISOString()).lt("created_at",end.toISOString());
      }
      const result=await query.order("created_at",{ascending:false}).range(page*PAGE_SIZE,(page+1)*PAGE_SIZE);
      if(!alive)return;
      if(result.error){setRows([]);setError("Não foi possível carregar os documentos emitidos. Tente novamente.");}
      else {
        const documents=(result.data||[]).slice(0,PAGE_SIZE) as Row[];
        const ids=[...new Set(documents.map(d=>d.patient_id))];
        const names=ids.length?await supabase.from("patients").select("id,full_name").in("id",ids):{data:[],error:null};
        if(!alive)return;
        if(names.error)setError("Os documentos foram carregados, mas não foi possível atualizar os nomes dos pacientes.");
        setRows(documents.map(d=>({...d,patients:{full_name:names.data?.find(p=>p.id===d.patient_id)?.full_name||d.identity_snapshot?.patient?.full_name||"Paciente"}})));
        setMore((result.data||[]).length>PAGE_SIZE);
      }
      setBusy(false);
    })();},250);
    return ()=>{alive=false;clearTimeout(timer);};
  },[doctorId,period,date,patient,kind,page]);
  return <main className="app-shell space-y-6 py-10">
    <header><p className="mn-eyebrow">Área médica</p><h1 className="app-section-title">Documentos emitidos</h1><p className="app-section-subtitle">Receitas, atestados e solicitações produzidos para seus pacientes. Rascunhos aparecem identificados e aguardam certificação.</p></header>
    <section className="mn-panel grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Filtrar documentos">
      <label className="text-sm font-semibold">Período<select className="app-input mt-2" value={period} onChange={e=>{setPeriod(e.target.value);setPage(0);}}><option value="day">Dia</option><option value="week">Semana</option><option value="month">Mês</option><option value="all">Todo o período</option></select></label>
      <label className="text-sm font-semibold">Data de referência<input type="date" className="app-input mt-2" disabled={period==="all"} value={date} onChange={e=>{setDate(e.target.value);setPage(0);}}/></label>
      <label className="text-sm font-semibold">Paciente<input className="app-input mt-2" placeholder="Nome do paciente" value={patient} onChange={e=>{setPatient(e.target.value);setPage(0);}}/></label>
      <label className="text-sm font-semibold">Tipo<select className="app-input mt-2" value={kind} onChange={e=>{setKind(e.target.value);setPage(0);}}><option value="">Todos</option>{["prescription","exam_request","medical_certificate","attendance_declaration","clinical_summary"].map(type=><option key={type} value={type}>{type==="clinical_summary"?"Resumo clínico":getDocumentType({document_type:type})}</option>)}</select></label>
    </section>
    {error&&<p role="alert">{error}</p>}
    {busy?<p role="status">Carregando documentos…</p>:<section className="mn-panel divide-y divide-mn-border">{!rows.length&&!error&&<p>Nenhum documento encontrado nesse período.</p>}{rows.map(row=>{const p=Array.isArray(row.patients)?row.patients[0]:row.patients;return <article key={row.id} className="flex flex-wrap items-center justify-between gap-4 py-4"><div><p className="font-semibold">{p?.full_name||"Paciente"}</p><p className="text-sm">{row.title||getDocumentType(row)}</p><p className="mt-1 text-xs text-mn-graphite/70">{new Date(row.created_at).toLocaleString("pt-BR")} · {row.status==="issued"?"Emitido":row.status==="cancelled"?"Cancelado":"Rascunho · certificação pendente"}</p></div><Link className="mn-button-secondary" href={`/documentos-medicos/${row.id}`}>Abrir documento</Link></article>;})}</section>}
    <nav className="flex items-center gap-4" aria-label="Páginas de documentos"><button className="mn-button-secondary" disabled={!page||busy} onClick={()=>setPage(p=>p-1)}>Anterior</button><span className="text-sm">Página {page+1}</span><button className="mn-button-secondary" disabled={!more||busy} onClick={()=>setPage(p=>p+1)}>Próxima</button></nav>
    <Link className="mn-button" href="/medico/consultas">Produzir documento em uma consulta</Link>
  </main>;
}
