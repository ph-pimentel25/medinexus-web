import fs from "node:fs";
import assert from "node:assert/strict";
import {chromium} from "playwright";
const origin=process.env.TEST_BASE_URL||"http://localhost:3100";
const binaries=[process.env.LOCALAPPDATA+"/ms-playwright/chromium-1228/chrome-win64/chrome.exe","C:/Program Files/Google/Chrome/Application/chrome.exe","C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"];
const browser=await chromium.launch({headless:true,executablePath:binaries.find(p=>fs.existsSync(p))});
fs.mkdirSync("artifacts/new-journeys",{recursive:true});
const uid="00000000-0000-4000-8000-000000000001",did="00000000-0000-4000-8000-000000000002",cid="00000000-0000-4000-8000-000000000003",docid="00000000-0000-4000-8000-000000000004";
const user={id:uid,email:"teste@example.test",app_metadata:{provider:"email",providers:["email"]},user_metadata:{full_name:"Pessoa de Teste"},aud:"authenticated",created_at:new Date().toISOString()};
const clinic={id:cid,trade_name:"Clínica de Demonstração",address_city:"Rio de Janeiro",address_state:"RJ",address_street:"Rua de Teste",address_number:"100",address_neighborhood:"Centro",is_active:true};
const doctor={id:did,user_id:uid,name:"Dra. Exemplo",crm:"12345",crm_state:"RJ",clinic_id:cid,is_active:true};
const profile={id:uid,full_name:"Pessoa de Teste",role:"patient",address_city:"Rio de Janeiro",address_state:"RJ",address_street:"Rua Origem",address_number:"20",profile_completed:true};
const medical={id:docid,status:"draft",signature_status:"pending",document_type:"exam_request",created_at:new Date().toISOString(),plain_text:Array.from({length:70},(_,i)=>`Item ${i+1}: conteúdo de demonstração para verificar paginação e integridade da impressão.`).join("\n"),validation_token:"demo-token",identity_snapshot:{patient:{full_name:"Paciente de Demonstração",birth_date:"1990-01-01"},doctor,clinic}};
const capturedBookings=[];
try{
for(const role of ["patient","doctor"]){
 const context=await browser.newContext({viewport:{width:390,height:844}});
 const session={access_token:"mock.access.token",refresh_token:"mock-refresh",token_type:"bearer",expires_at:Math.floor(Date.now()/1000)+3600,expires_in:3600,user};
 const storageKey="sb-"+new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split(".")[0]+"-auth-token";
 await context.addInitScript(({key,session})=>localStorage.setItem(key,JSON.stringify(session)),{key:storageKey,session});
 await context.route("**/auth/v1/**",r=>r.fulfill({json:user}));
 await context.route("**/rest/v1/**",async r=>{
  const url=new URL(r.request().url()),table=url.pathname.split("/").at(-1);let data=[];
  if(table==="match_patient_availability")data=[{doctor_id:did,doctor_name:doctor.name,photo_path:null,crm:doctor.crm,crm_state:'RJ',clinic_id:cid,clinic_name:clinic.trade_name,city:'Rio de Janeiro',state:'RJ',distance_km:4,start_at:new Date(Date.now()+86400000).toISOString(),duration_minutes:30,match_kind:'nearby',appointment_mode:'private',coverage:'not_applicable',private_price_cents:15000}];
  if(table==="patient_search_preferences")data=[{id:'search-test',accepts_private_consultation:false}];
  if(table==="request_matched_appointment"){capturedBookings.push(r.request().postDataJSON());return r.fulfill({json:'appointment-test'});}
  if(table==="read_own_consultation_note")return r.fulfill({json:null});
  if(table==="has_clinical_history_access")return r.fulfill({json:false});
  if(table==="profiles")data=[{...profile,role}];
  if(table==="doctors")data=role==="doctor"||!url.searchParams.has("user_id")?[doctor]:[];
  if(table==="clinics")data=url.searchParams.has("id")?[clinic]:[];
  if(table==="patients")data=[{id:uid,full_name:role==="doctor"?"Paciente de Demonstração":"Pessoa de Teste"}];
  if(table==="specialties")data=[{id:"spec-1",name:"Cardiologia"},{id:"spec-2",name:"Dermatologia"}];
  if(table==="doctor_specialties")data=[{specialty_id:"spec-1"}];
  if(table==="medical_documents"){
   if((url.searchParams.get("select")||"").includes("patients"))return r.fulfill({status:400,json:{code:"PGRST200",message:"No relationship between medical_documents and patients"}});
   data=[{...medical,patient_id:uid}];
  }
  if(table==="care_reviews")data=[{id:"review-1",target_kind:"doctor",rating:5,comment:"Atendimento de teste",anonymous:true,appointments:{doctors:doctor,clinics:clinic}}];
  if(table==="appointments")data=[{id:"appointment-1",patient_id:uid,doctor_id:did,clinic_id:cid,status:"confirmed",patient_confirmation_status:"confirmed",confirmed_start_at:new Date(Date.now()+86400000).toISOString(),doctors:doctor,clinics:clinic,patients:{full_name:"Pessoa de Teste"}}];
  if(table==="patient_preferences")data=[{whatsapp_consent:false,email_consent:false}];
  const single=(r.request().headers().accept||"").includes("vnd.pgrst.object");
  await r.fulfill({json:single?(data[0]||null):data});
 });
 const page=await context.newPage();const errors=[];page.on("pageerror",e=>errors.push(e.message));
 const routes=role==="patient"?["/descobrir","/solicitacoes","/perfil","/historico-clinico","/profissionais","/avaliacoes",`/documentos-medicos/${docid}`]:["/medico/perfil","/documentos-medicos"];
 for(const route of routes){await page.goto(origin+route,{waitUntil:"networkidle",timeout:60000});await page.waitForTimeout(300);assert.equal(new URL(page.url()).pathname,route);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,route+" has horizontal overflow");if(route==="/solicitacoes"){await page.getByRole("button",{name:"Como chegar"}).click();await page.getByRole("link",{name:"Google Maps"}).waitFor();assert.match(await page.getByRole("link",{name:"Google Maps"}).getAttribute("href"),/origin=Rua/);}await page.screenshot({path:`artifacts/new-journeys/${role}-${route.replaceAll("/","-")}.png`,fullPage:true});console.log("PASS",role,route);}
 if(role==="patient"){await page.emulateMedia({media:"print"});const pdf=await page.pdf({path:"artifacts/new-journeys/document-multipage.pdf",preferCSSPageSize:true});assert.ok((pdf.toString("latin1").match(/\/Type\s*\/Page\b/g)||[]).length>=2,"Long document must not be clipped to one page");console.log("PASS multipage document PDF");}
 if(role==="patient") {
  Object.assign(medical,{document_type:"prescription",plain_text:"Medicamento de teste",content:{medication_name:"Medicamento de teste",medication_use:"Conforme orientação registrada",dosage:"500 mg",route:"Oral",duration:"3 dias",quantity:"1 caixa",notes:"Orientações de demonstração."}});
  await page.reload({waitUntil:"networkidle"});
  await page.getByRole("heading",{name:"Medicamento de teste",exact:true}).waitFor();
  const pdf=await page.pdf({path:"artifacts/new-journeys/document-singlepage.pdf",preferCSSPageSize:true});
  assert.equal((pdf.toString("latin1").match(/\/Type\s*\/Page\b/g)||[]).length,1,"Short mobile prescription must fit a single A4 page");
  assert.equal(await page.locator(".medical-document").getByText(/afastamento/i).count(),0);
  console.log("PASS single-page mobile prescription PDF");
  await page.emulateMedia({media:"screen"});await page.goto(origin+"/avaliacoes",{waitUntil:"networkidle"});
  await page.getByText("Médico: Dra. Exemplo",{exact:true}).waitFor();await page.getByText("Clínica: Clínica de Demonstração",{exact:true}).waitFor();
  console.log("PASS own reviews identify doctor and clinic");
  await page.goto(origin+"/resultados?searchId=search-test",{waitUntil:'networkidle'});
  await page.getByText(/Não há horários disponíveis exatamente/).waitFor();
  const book=page.getByRole('button',{name:'Solicitar este horário'});assert.equal(await book.isDisabled(),true);
  await page.getByRole('checkbox',{name:/Posso comparecer/}).check();assert.equal(await book.isDisabled(),true);
  await page.getByRole('checkbox',{name:/Meu plano não consta/}).check();assert.equal(await book.isEnabled(),true);
  await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
  await page.screenshot({path:'artifacts/new-journeys/availability-alternative.png',fullPage:true});
  await book.click();await page.waitForURL('**/solicitacoes');assert.equal(capturedBookings.length,1);assert.equal(capturedBookings[0].p_accept_nearby,true);assert.equal(capturedBookings[0].p_accept_private,true);
  console.log('PASS nearby/private fallback requires both explicit acceptances');
  await page.goto(origin+'/recuperar-conta',{waitUntil:'networkidle'});await page.getByRole('button',{name:'Enviar link de recuperação'}).waitFor();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  console.log('PASS account recovery mobile layout');
  await page.goto(origin+'/profissionais',{waitUntil:'networkidle'});
  await page.getByRole('button',{name:'Perfil, planos, disponibilidade e avaliações'}).click();
  await page.getByText('Planos cadastrados:',{exact:true}).waitFor();
  console.log('PASS registered network exposes plan and availability details');
  await page.goto(origin+'/historico-clinico',{waitUntil:'networkidle'});
  await page.getByRole('heading',{name:'Quem pode consultar meu histórico'}).waitFor();
  console.log('PASS patient history exposes access and AI controls');
}
if(role==="doctor"){await page.getByRole("heading",{name:"Documentos emitidos",exact:true}).waitFor();await page.getByText("Paciente de Demonstração",{exact:true}).waitFor();await page.getByLabel("Paciente",{exact:true}).fill("Demonstração");await page.waitForTimeout(700);await page.getByText("Paciente de Demonstração",{exact:true}).waitFor();console.log("PASS doctor issued documents and patient filter without foreign key");await page.goto(origin+'/medico/consultas/appointment-1',{waitUntil:'networkidle'});await page.getByRole('heading',{name:'Histórico compartilhado pelo paciente'}).waitFor();await page.getByPlaceholder('Notas privadas do médico').waitFor();console.log('PASS doctor visit with separate private-note access');}
assert.deepEqual(errors,[]);await context.close();
}
}finally{await browser.close();}
