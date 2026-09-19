"use client";
import {useState} from "react";
export type CatalogPlan={id:string;name:string|null;operator_name:string|null;catalog_scope?:string|null};
type Value={default_health_plan_id:string;health_plan_operator:string;health_plan_product_name:string};
const commonOperators=["Amil","Bradesco Saúde","Hapvida","Porto Saúde","SulAmérica Saúde","Unimed"];
export default function HealthPlanPicker({plans,value,onChange}:{plans:CatalogPlan[];value:Value;onChange:(value:Value)=>void}){
 const [manualOperator,setManualOperator]=useState(false);
 const operators=[...new Set([...commonOperators,...plans.map(p=>p.operator_name).filter((x):x is string=>!!x)])].sort((a,b)=>a.localeCompare(b,"pt-BR"));
 const operator=value.health_plan_operator;
 const otherOperator=manualOperator||!!operator&&!operators.includes(operator);
 const choices=plans.filter(p=>p.operator_name===operator);
 const selected=plans.find(p=>p.id===value.default_health_plan_id);
 return <div className="md:col-span-2 grid gap-5 md:grid-cols-2">
  <label className="text-sm font-semibold">Operadora *<select required className="app-input mt-2" value={otherOperator?"__other":operator} onChange={e=>{const other=e.target.value==="__other";setManualOperator(other);onChange({default_health_plan_id:"",health_plan_operator:other?"":e.target.value,health_plan_product_name:""});}}><option value="">Selecione a operadora</option>{operators.map(o=><option key={o}>{o}</option>)}<option value="__other">Outra operadora</option></select></label>
  {otherOperator&&<label className="text-sm font-semibold">Nome da operadora *<input required maxLength={120} className="app-input mt-2" value={operator} onChange={e=>onChange({...value,default_health_plan_id:"",health_plan_operator:e.target.value})}/></label>}
  <label className="text-sm font-semibold">Plano / categoria *<select disabled={!operator} className="app-input mt-2" value={value.default_health_plan_id||"__other"} onChange={e=>{const plan=plans.find(p=>p.id===e.target.value);onChange({...value,default_health_plan_id:plan?.id||"",health_plan_product_name:plan?.name||""});}}>{choices.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}<option value="__other">Outro — informar exatamente como na carteirinha</option></select></label>
  {!value.default_health_plan_id&&<label className="text-sm font-semibold">Nome exato do plano *<input required maxLength={160} className="app-input mt-2" placeholder="Copie o nome da sua carteirinha" value={value.health_plan_product_name} onChange={e=>onChange({...value,health_plan_product_name:e.target.value})}/></label>}
  <p className="md:col-span-2 text-sm text-mn-graphite/70">{value.default_health_plan_id?`Compatibilidade pelo plano selecionado e aceitação cadastrada pela clínica. ${selected?.catalog_scope||"Confira região e categoria na carteirinha."}`:"Plano manual: confirmação necessária pela clínica. Nenhuma aceitação será presumida pelo nome."} {operator==="Unimed"&&"Informe também a cooperativa/região: os contratos não são iguais em todas as Unimeds."}</p>
 </div>;
}
