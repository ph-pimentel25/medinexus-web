import { createClient } from "@supabase/supabase-js";
const normalize=(s:string)=>s.normalize("NFD").replace(/\p{Diacritic}/gu,"").toLowerCase();
export async function POST(request:Request){
 const token=request.headers.get("authorization")?.replace(/^Bearer /,"");
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!token||!url||!key)return Response.json({error:"Entre para pesquisar."},{status:401});
 const db=createClient(url,key,{global:{headers:{Authorization:`Bearer ${token}`}},auth:{persistSession:false}});
 const {data:{user}}=await db.auth.getUser(token);if(!user)return Response.json({error:"Sessão expirada."},{status:401});
 let body;try{body=await request.json();}catch{return Response.json({error:"Busca inválida."},{status:400});}
 if(!body||typeof body!=="object"||Array.isArray(body)||typeof body.query!=="string"||body.query.trim().length<2||body.query.length>180||typeof body.city!=="string"||body.city.trim().length<2||body.city.length>100)return Response.json({error:"Informe especialidade e cidade."},{status:400});
 const query=body.query.trim(),city=body.city.trim();
 const specialties=await db.from("specialties").select("id,name");if(specialties.error)return Response.json({error:"Catálogo indisponível."},{status:503});
 let selected=specialties.data?.find(s=>normalize(query).includes(normalize(s.name))||normalize(s.name).includes(normalize(query)));
 let aiUsed=false;const notices:string[]=[];
 // Limit costly searches using an atomic per-user database quota before any paid API call.
 if(body.useAI===true && process.env.OPENAI_API_KEY && process.env.OPENAI_SEARCH_MODEL){
  const quota=await db.rpc("consume_discovery_quota");if(quota.error||quota.data!==true)return Response.json({error:"Limite de buscas atingido. Tente novamente em alguns minutos."},{status:429});
  try{
   const ai=await fetch("https://api.openai.com/v1/responses",{method:"POST",signal:AbortSignal.timeout(12000),headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`,"Content-Type":"application/json"},body:JSON.stringify({model:process.env.OPENAI_SEARCH_MODEL,store:false,max_output_tokens:200,instructions:"Classifique somente o nome de especialidade solicitado. Não diagnostique sintomas e não recomende tratamento. Retorne um id do catálogo, ou vazio quando não houver especialidade explícita. Catálogo: "+JSON.stringify(specialties.data),input:query,text:{format:{type:"json_schema",name:"specialty_search",strict:true,schema:{type:"object",properties:{specialty_id:{type:"string",enum:["",...(specialties.data||[]).map(s=>s.id)]}},required:["specialty_id"],additionalProperties:false}}}})});
   if(!ai.ok)throw new Error();const data=await ai.json();const text=(data.output||[]).flatMap((x:{content?:{type:string;text?:string}[]})=>x.content||[]).find((x:{type:string})=>x.type==="output_text")?.text;
   const parsed=JSON.parse(text||"{}");selected=specialties.data?.find(s=>s.id===parsed.specialty_id)||selected;aiUsed=true;
  }catch{notices.push("A interpretação com IA está indisponível. Exibindo a busca convencional.");}
 } else if(body.useAI===true)notices.push("A interpretação com IA ainda não foi ativada.");
 const literal=(value:string)=>value.replace(/[\\%_]/g," ").trim();
 const projection="id,name,photo_path,crm,crm_state,clinic_id,address_street,address_number,address_city,address_state,clinics(id,trade_name,address_street,address_number,address_city,address_state),doctor_specialties!inner(specialty_id,specialties(name))";
 let localQuery=db.from("doctors").select(projection.replace("clinics(","clinics!inner(")).eq("is_active",true).not("photo_path","is",null).ilike("clinics.address_city",`%${literal(city)}%`);
 let officeQuery=db.from("doctors").select(projection).eq("is_active",true).not("photo_path","is",null).is("clinic_id",null).ilike("address_city",`%${literal(city)}%`);
 localQuery=selected?localQuery.eq("doctor_specialties.specialty_id",selected.id):localQuery.ilike("name",`%${literal(query)}%`);
 officeQuery=selected?officeQuery.eq("doctor_specialties.specialty_id",selected.id):officeQuery.ilike("name",`%${literal(query)}%`);
 const [local,offices]=await Promise.all([localQuery.limit(30),officeQuery.limit(30)]);
 if(local.error||offices.error)return Response.json({error:"Não foi possível consultar profissionais."},{status:503});
 type LocalDoctor={id:string;name:string;photo_path:string;crm:string;crm_state:string;clinic_id:string|null;address_street:string;address_number:string;address_city:string;address_state:string;clinics:{trade_name:string;address_street:string;address_number:string;address_city:string;address_state:string}|{trade_name:string;address_street:string;address_number:string;address_city:string;address_state:string}[]|null;doctor_specialties:{specialty_id:string}[]};
 const doctors=[...(local.data||[]),...(offices.data||[])] as unknown as LocalDoctor[];
 const registered=doctors.filter(d=>{const clinic=Array.isArray(d.clinics)?d.clinics[0]:d.clinics;return normalize((clinic?.address_city||d.address_city)||"").includes(normalize(city))&&(selected?(d.doctor_specialties||[]).some(s=>s.specialty_id===selected.id):normalize(d.name||"").includes(normalize(query)));}).slice(0,60).map(d=>{const clinic=Array.isArray(d.clinics)?d.clinics[0]:d.clinics;return {id:d.id,name:d.name,photoPath:d.photo_path,crm:`${d.crm||""}/${d.crm_state||""}`,clinicId:d.clinic_id,clinicName:clinic?.trade_name||"Consultório autônomo",address:[clinic?.address_street||d.address_street,clinic?.address_number||d.address_number,clinic?.address_city||d.address_city,clinic?.address_state||d.address_state].filter(Boolean).join(", "),specialtyId:selected?.id||null};});
 let external: {id:string;name:string;address:string;phone:string;mapsUrl:string;website:string;attributions:unknown[]}[]=[];
 if(body.includeExternal===true && process.env.GOOGLE_PLACES_API_KEY){
  const quota=await db.rpc("consume_discovery_quota");if(quota.error||quota.data!==true)notices.push("Busca externa temporariamente limitada.");
  else try{
   const response=await fetch("https://places.googleapis.com/v1/places:searchText",{method:"POST",signal:AbortSignal.timeout(10000),headers:{"Content-Type":"application/json","X-Goog-Api-Key":process.env.GOOGLE_PLACES_API_KEY,"X-Goog-FieldMask":"places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.googleMapsUri,places.websiteUri,places.attributions"},body:JSON.stringify({textQuery:`${selected?.name||query} médico em ${city}, Brasil`,languageCode:"pt-BR",regionCode:"BR",pageSize:10})});
   if(!response.ok)throw new Error();const data=await response.json();external=(data.places||[]).map((p:{id:string;displayName?:{text:string};formattedAddress?:string;nationalPhoneNumber?:string;googleMapsUri?:string;websiteUri?:string;attributions?:unknown[]})=>({id:p.id,name:p.displayName?.text||"Profissional",address:p.formattedAddress||"",phone:p.nationalPhoneNumber||"",mapsUrl:p.googleMapsUri||"",website:p.websiteUri||"",attributions:p.attributions||[]}));
  }catch{notices.push("A busca externa está indisponível. Os profissionais cadastrados continuam disponíveis.");}
 }else if(body.includeExternal===true)notices.push("Os contatos externos estarão disponíveis após ativar o serviço de mapas.");
 return Response.json({registered,external,aiUsed,notices,specialty:selected?.name||null},{headers:{"Cache-Control":"no-store"}});
}
