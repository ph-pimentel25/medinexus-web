import fs from "node:fs";
import assert from "node:assert/strict";
import {chromium} from "playwright";
const findings=[];
let checks=0;
const origin=process.env.TEST_BASE_URL||"http://localhost:3100";
const binaries=[process.env.LOCALAPPDATA+"/ms-playwright/chromium-1228/chrome-win64/chrome.exe","C:/Program Files/Google/Chrome/Application/chrome.exe","C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"];
const browser=await chromium.launch({headless:true,executablePath:binaries.find(p=>fs.existsSync(p))});
fs.mkdirSync("artifacts/interface",{recursive:true});
const uid="00000000-0000-4000-8000-000000000001",did="00000000-0000-4000-8000-000000000002",cid="00000000-0000-4000-8000-000000000003",docid="00000000-0000-4000-8000-000000000004";
const user={id:uid,email:"teste@example.test",app_metadata:{provider:"email",providers:["email"]},user_metadata:{full_name:"Pessoa de Teste"},aud:"authenticated",created_at:new Date().toISOString()};
const clinic={id:cid,trade_name:"Clínica de Demonstração",address_city:"Rio de Janeiro",address_state:"RJ",address_street:"Rua de Teste",address_number:"100",address_neighborhood:"Centro",is_active:true};
const doctor={id:did,user_id:uid,name:"Dra. Exemplo",crm:"12345",crm_state:"RJ",clinic_id:cid,is_active:true};
const profile={id:uid,full_name:"Pessoa de Teste",role:"patient",address_city:"Rio de Janeiro",address_state:"RJ",address_street:"Rua Origem",address_number:"20",profile_completed:true};
const medical={id:docid,status:"draft",signature_status:"pending",document_type:"exam_request",created_at:new Date().toISOString(),plain_text:Array.from({length:70},(_,i)=>`Item ${i+1}: conteúdo de demonstração para verificar paginação e integridade da impressão.`).join("\n"),validation_token:"demo-token",identity_snapshot:{patient:{full_name:"Paciente de Demonstração",birth_date:"1990-01-01"},doctor,clinic}};
try{
for(const role of ["patient","doctor","clinic","public"]){
 const context=await browser.newContext({viewport:{width:Number(process.env.TEST_WIDTH||1440),height:960}});
 const session={access_token:"mock.access.token",refresh_token:"mock-refresh",token_type:"bearer",expires_at:Math.floor(Date.now()/1000)+3600,expires_in:3600,user};
 const storageKey="sb-"+new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split(".")[0]+"-auth-token";
 if(role!=="public")await context.addInitScript(({key,session})=>localStorage.setItem(key,JSON.stringify(session)),{key:storageKey,session});
 await context.route("**/auth/v1/**",r=>r.fulfill({json:user}));
 await context.route("**/rest/v1/**",async r=>{
  const url=new URL(r.request().url()),table=url.pathname.split("/").at(-1);let data=[];
  if(table==="profiles")data=[{...profile,role}];
  if(table==="doctors")data=url.searchParams.has("user_id")?(role==="doctor"?[doctor]:[]):[doctor];
  if(table==="clinics")data=url.searchParams.has("or")?(role==="clinic"?[clinic]:[]):[clinic];
  if(table==="clinic_members")data=role==="clinic"?[{id:"member-1",user_id:uid,clinic_id:cid,member_role:"owner",role:"owner"}]:[];
  if(table==="patients")data=[{id:uid,full_name:"Pessoa de Teste"}];
  if(table==="health_plans")data=[{id:"plan-1",name:"Plano de demonstração",is_active:true}];
  if(table==="read_care_reviews")data=[{id:"review-1",rating:5,comment:"Atendimento de demonstração.",author_name:"Avaliação anônima",created_at:new Date().toISOString()}];
  if(table==="specialties")data=[{id:"spec-1",name:"Cardiologia"},{id:"spec-2",name:"Dermatologia"}];
  if(table==="doctor_specialties")data=[{specialty_id:"spec-1"}];
  if(table==="medical_documents")data=[medical];
  if(table==="appointments")data=[{id:"appointment-1",patient_id:uid,doctor_id:did,clinic_id:cid,status:"confirmed",patient_confirmation_status:"confirmed",confirmed_start_at:new Date(Date.now()+86400000).toISOString(),doctors:doctor,clinics:clinic,patients:{full_name:"Pessoa de Teste"}}];
  if(table==="patient_preferences")data=[{whatsapp_consent:false,email_consent:false}];
  const single=(r.request().headers().accept||"").includes("vnd.pgrst.object");
  await r.fulfill({json:single?(data[0]||null):data});
 });
 const page=await context.newPage();const errors=[];page.on("pageerror",e=>errors.push(e.message));
 const routes=role==="public"?["/","/sobre","/especialidades","/clinicas",`/clinicas/${cid}`,"/profissionais","/pacotes","/login","/cadastro","/medico/cadastro","/clinica/cadastro",`/validar-documentos/${docid}`]:role==="patient"?["/dashboard","/descobrir","/busca","/resultados","/solicitacoes","/consultas","/perfil","/avaliacoes","/documentos","/documentos-medicos","/historico-clinico","/notificacoes",`/consultas/${docid}/confirmar`,`/documentos-medicos/${docid}`]:role==="doctor"?["/medico/dashboard","/medico/perfil","/medico/solicitacoes","/medico/consultas","/medico/disponibilidade",`/medico/consultas/${docid}`,`/medico/consultas/${docid}/documentos`,`/medico/receituarios/${docid}`,"/avaliacoes","/documentos-medicos"]:["/clinica/dashboard","/clinica/configuracoes","/clinica/medicos","/clinica/medicos/novo",`/clinica/medicos/${did}`,"/clinica/solicitacoes","/clinica/publico","/clinica/planos","/avaliacoes"];
 for(const route of process.env.NAV_ONLY ? routes.slice(0,1) : routes){
   const previousErrors=errors.length;
   try {
     await page.goto(origin+route,{waitUntil:"networkidle",timeout:60000});await page.waitForTimeout(400);
     if(route.endsWith("/dashboard"))await page.locator(".mn-metric-value[aria-label='Carregando']").first().waitFor({state:"hidden",timeout:15000});
     await page.addStyleTag({content:"nextjs-portal{display:none}"});
     const overflow=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth+1,elements:[...document.querySelectorAll("body *")].filter(el=>el.getBoundingClientRect().right>innerWidth+1&&getComputedStyle(el).position!=="fixed").slice(0,5).map(el=>el.tagName+"."+el.className)}));
     if(overflow.overflow)findings.push({type:"overflow",role,route,elements:overflow.elements});
     if(errors.length>previousErrors)findings.push({type:"javascript",role,route,errors:errors.slice(previousErrors)});
     const current=new URL(page.url()).pathname;if(current!==route&&current!==({"/consultas":"/solicitacoes","/medico/consultas":"/medico/solicitacoes"})[route])findings.push({type:"redirect",role,route,current});
     await page.screenshot({path:`artifacts/interface/${process.env.TEST_WIDTH||1440}-${role}-${route.replaceAll("/","-")}.png`,fullPage:true});
     checks++; console.log("CHECK",role,route);
     if(route===routes[0]&&role!=="public"){
       const destination=role==="clinic"?{label:"Convênios",href:"/clinica/planos"}:role==="doctor"?{label:"Documentos",href:"/documentos-medicos"}:{label:"Perfil",href:"/perfil"};
       if(Number(process.env.TEST_WIDTH||1440)<1024){
         await page.getByRole("button",{name:"Abrir menu",exact:true}).click();
         await page.locator("#mobile-menu").getByRole("link",{name:destination.label,exact:true}).click();
         await page.waitForURL(origin+destination.href);
         assert.equal(await page.locator("#mobile-menu").count(),0,"Menu should close after navigation");
       }else{
         await page.getByRole("textbox",{name:"Buscar página no aplicativo"}).fill(destination.label);
         await page.locator("#workspace-search-results").getByRole("link",{name:destination.label,exact:true}).click();
         await page.waitForURL(origin+destination.href);
         assert.equal(await page.locator(".mn-sidebar-links a[aria-current='page']").getAttribute("href"),destination.href);
       }
       console.log("NAVIGATION_PASS",role,destination.href);
     }
   }catch(e){findings.push({type:"navigation",role,route,error:e.message});}
 }
 console.log("ROLE_ERRORS",role,errors.length);await context.close();
}
}finally{await browser.close();}

fs.writeFileSync(`artifacts/interface/report-${process.env.TEST_WIDTH||1440}${process.env.NAV_ONLY?"-navigation":""}.json`,JSON.stringify({checks,findings},null,2));
console.log(JSON.stringify({checks,findings}));
if(findings.length)process.exitCode=1;
