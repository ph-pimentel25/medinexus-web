// Local browser regression; all Auth/REST calls are fixtures, never live writes.
import fs from 'node:fs';import assert from 'node:assert/strict';import {chromium} from 'playwright';
const origin=process.env.TEST_BASE_URL||'http://localhost:3104';
const binary=['C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(fs.existsSync);
const browser=await chromium.launch({headless:true,executablePath:binary});
const uid='00000000-0000-4000-8000-000000000001',did='00000000-0000-4000-8000-000000000002',cid='00000000-0000-4000-8000-000000000003';
const token=[{alg:'HS256',typ:'JWT'},{sub:uid,aud:'authenticated',role:'authenticated',exp:Math.floor(Date.now()/1000)+3600,iat:Math.floor(Date.now()/1000)},'test-signature'].map(x=>Buffer.from(typeof x==='string'?x:JSON.stringify(x)).toString('base64url')).join('.');
async function fixture(role='patient',complete=true,loggedIn=true){
 const user={id:uid,email:'test@example.test',aud:'authenticated',created_at:new Date().toISOString(),app_metadata:{provider:'email'},user_metadata:{role:role==='clinic'?'clinic_admin':role,full_name:'Pessoa de Teste'}};
 const session={access_token:token,refresh_token:'fixture-refresh',expires_at:Math.floor(Date.now()/1000)+3600,expires_in:3600,token_type:'bearer',user};
 const writes=[];
 const rows={profiles:{id:uid,full_name:'Pessoa de Teste',role:user.user_metadata.role,profile_completed:true},account_registration_locks:{account_type:role},
  patients:complete&&role==='patient'?{id:uid,full_name:'Pessoa de Teste'}:null,
  doctors:complete&&role==='doctor'?{id:did,user_id:uid,name:'Dr. Exemplo',is_active:true,verification_status:'pending'}:null,
  clinics:complete&&role==='clinic'?{id:cid,user_id:uid,trade_name:'Clínica Exemplo',is_active:true,verification_status:'pending',cnpj:'11222333000181'}:null,
  specialties:[{id:did,name:'Cardiologia'}],clinic_members:[]};
 const context=await browser.newContext({viewport:{width:390,height:844}});
 if(loggedIn){const key='sb-'+new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split('.')[0]+'-auth-token';await context.addInitScript(({key,session})=>localStorage.setItem(key,JSON.stringify(session)),{key,session});}
 await context.route('**/auth/v1/**',async route=>{
  const req=route.request(),url=new URL(req.url());
  if(req.method()!=='GET')writes.push({url:url.pathname,body:req.postDataJSON()});
  if(url.pathname.endsWith('/logout'))return route.fulfill({status:204});
  if(url.pathname.endsWith('/recover'))return route.fulfill({json:{}});
  if(url.pathname.endsWith('/token'))return route.fulfill({json:session});
  if(url.pathname.endsWith('/signup'))return route.fulfill({json:{user,session:null}});
  return route.fulfill({json:user});
 });
 await context.route('**/rest/v1/**',async route=>{
  const req=route.request(),url=new URL(req.url()),table=url.pathname.split('/').at(-1);
  let data=rows[table]??[];
  if(req.method()!=='GET'){
   const body=req.postDataJSON();writes.push({table,body});
   if(table==='set_doctor_specialties')return route.fulfill({json:null});
   rows[table]=Array.isArray(body)?body[0]:{id:uid,...body};data=rows[table];
  }
  if(table==='doctors'&&url.searchParams.get('user_id')==='is.null')data=[];
  const single=(req.headers().accept||'').includes('vnd.pgrst.object');
  return route.fulfill({json:single?(Array.isArray(data)?data[0]||null:data):(Array.isArray(data)?data:data?[data]:[])});
 });
 // Tests cannot accidentally call external geocoders or providers.
 await context.route('**/api/**',r=>r.fulfill({json:{available:false,environment:'sandbox'}}));
 const page=await context.newPage();const failures=[];
 page.on('pageerror',e=>failures.push(e.message));
 page.on('console',m=>{if(/violates.*Content Security Policy|Refused to (?:connect|execute|load)/i.test(m.text()))failures.push(m.text());});
 return {context,page,writes,rows,user,failures};
}
try{
 for(const role of (process.env.RECOVERY_ONLY?[]:['patient','doctor','clinic'])){
  const f=await fixture(role,true,false);
  await f.page.goto(origin+'/login',{waitUntil:'networkidle'});
  await f.page.locator('input[type="email"]').fill('test@example.test');
  await f.page.locator('input[type="password"]').fill('123456');
  await f.page.getByRole('button',{name:'Entrar na plataforma',exact:true}).click();
  await f.page.waitForURL(origin+(role==='patient'?'/dashboard':role==='doctor'?'/medico/dashboard':'/clinica/dashboard'));
  assert.ok(f.writes.some(w=>w.url?.endsWith('/token')),'Existing shorter password can log in');
  f.writes.length=0;
  for(const route of ['/cadastro','/medico/cadastro','/clinica/cadastro']){
   await f.page.goto(origin+route,{waitUntil:'networkidle'});
   await f.page.getByRole('heading',{name:'Sua conta já está cadastrada'}).waitFor();
   assert.equal(await f.page.locator('form').count(),0);
  }
  assert.equal(f.writes.length,0);
  const profile=role==='patient'?'/perfil':role==='doctor'?'/medico/perfil':'/clinica/configuracoes';
  const dashboard=role==='patient'?'/dashboard':`/${role==='doctor'?'medico':'clinica'}/dashboard`;
  for(const route of [dashboard,profile]){await f.page.goto(origin+route,{waitUntil:'networkidle'});assert.equal(new URL(f.page.url()).pathname,route);}
  if(role!=='patient')await f.page.getByText(/Seu cadastro está com verificação pendente/).waitFor();
  if(role==='clinic')assert.equal(await f.page.getByLabel(/^CNPJ/).inputValue(),'11.222.333/0001-81');
  await f.page.goto(origin+'/recuperar-conta?update=1',{waitUntil:'networkidle'});
  assert.equal(await f.page.locator('.mn-workspace').count(),0);
  assert.equal(await f.page.getByRole('button',{name:'Salvar nova senha'}).isDisabled(),true);
  assert.deepEqual(f.failures,[]);await f.context.close();console.log('PASS completed account, workspace and ordinary-session recovery guard:',role);
 }
 for(const role of (process.env.RECOVERY_ONLY?[]:['patient','doctor','clinic'])){
  const f=await fixture(role,false);
  await f.page.goto(origin+'/cadastro?complete=1',{waitUntil:'networkidle'});
  for(const [kind,label] of [['patient','Paciente'],['doctor','Médico'],['clinic','Clínica']])assert.equal(await f.page.getByRole('button',{name:new RegExp('^'+label+' ')}).count(),kind===role?1:0);
  await f.page.getByPlaceholder(role==='clinic'?'Nome do responsável':'Seu nome',{exact:true}).fill('Pessoa de Teste');
  if(role==='doctor'){await f.page.getByLabel('Cardiologia',{exact:true}).check();await f.page.getByPlaceholder('123456',{exact:true}).fill('123456');}
  if(role==='clinic'){
   await f.page.getByPlaceholder('Ex.: Clínica Vida',{exact:true}).fill('Clínica Exemplo');await f.page.getByPlaceholder('Rio de Janeiro',{exact:true}).fill('Rio de Janeiro');
   await f.page.getByLabel(/^CNPJ/).fill('00000000000000');await f.page.getByRole('button',{name:'Concluir cadastro',exact:true}).click();
   await f.page.getByRole('alert').filter({hasText:'CNPJ válido'}).waitFor();assert.equal(f.writes.length,0);
   await f.page.getByLabel(/^CNPJ/).fill('11222333000181');assert.equal(await f.page.getByLabel(/^CNPJ/).inputValue(),'11.222.333/0001-81');
  }
  await f.page.getByRole('button',{name:'Concluir cadastro',exact:true}).click();
  const target=role==='patient'?'/dashboard':role==='doctor'?'/medico/perfil':'/clinica/dashboard';
  await f.page.waitForURL(origin+target);
  assert.ok(f.writes.some(w=>w.table===(role==='patient'?'patients':role==='doctor'?'doctors':'clinics')));
  if(role==='clinic')assert.equal(f.writes.find(w=>w.table==='clinics').body.cnpj,'11222333000181');
  assert.deepEqual(f.failures,[]);await f.context.close();console.log('PASS email-confirmed completion with locked type:',role);
 }
 for(const role of (process.env.RECOVERY_ONLY?[]:['patient','doctor','clinic'])){
  const f=await fixture(role,false,false);
  await f.page.goto(origin+(role==='patient'?'/cadastro':role==='doctor'?'/medico/cadastro':'/clinica/cadastro'),{waitUntil:'networkidle'});
  await f.page.getByPlaceholder(role==='clinic'?'Nome do responsável':'Seu nome',{exact:true}).fill('Pessoa de Teste');
  await f.page.getByPlaceholder('voce@email.com').fill('test@example.test');
  await f.page.locator('input[type="password"]').fill('abcdefgh');
  if(role==='doctor'){await f.page.getByLabel('Cardiologia',{exact:true}).check();await f.page.getByPlaceholder('123456',{exact:true}).fill('123456');}
  if(role==='clinic'){await f.page.getByPlaceholder('Ex.: Clínica Vida',{exact:true}).fill('Clínica Exemplo');await f.page.getByPlaceholder('Rio de Janeiro',{exact:true}).fill('Rio de Janeiro');await f.page.getByLabel(/^CNPJ/).fill('11222333000181');}
  await f.page.getByRole('button',{name:'Criar conta',exact:true}).click();await f.page.getByText(/Confira seu e-mail para confirmar a conta/).waitFor();
  assert.equal(f.writes.find(w=>w.url?.endsWith('/signup')).body.data.medinexus_registration.accountType,role);
  assert.equal(f.writes.filter(w=>w.table).length,0,'Unconfirmed signup does not write application tables');
  assert.deepEqual(f.failures,[]);await f.context.close();console.log('PASS new signup and email-confirmation boundary:',role);
 }
 const f=await fixture('patient',false,false);
 await f.page.goto(origin+'/cadastro',{waitUntil:'networkidle'});assert.equal(await f.page.locator('input[autocomplete="new-password"]').getAttribute('minlength'),'8');
 await f.page.goto(origin+'/recuperar-conta',{waitUntil:'networkidle'});await f.page.getByLabel('E-mail da conta').fill('absent@example.test');await f.page.getByRole('button',{name:'Enviar link de recuperação'}).click();await f.page.getByText(/Se existir uma conta/).waitFor();
 await f.page.goto(origin+'/recuperar-conta?update=1#error=access_denied&error_code=otp_expired',{waitUntil:'networkidle'});assert.equal(await f.page.getByRole('button',{name:'Salvar nova senha'}).isDisabled(),true);
 const fragment=new URLSearchParams({access_token:token,refresh_token:'fixture-refresh',expires_in:'3600',expires_at:String(Math.floor(Date.now()/1000)+3600),token_type:'bearer',type:'recovery'});
 await f.page.goto(origin+'/recuperar-conta?update=1#'+fragment,{waitUntil:'networkidle'});
 await f.page.getByRole('button',{name:'Salvar nova senha'}).waitFor();assert.equal(await f.page.getByRole('button',{name:'Salvar nova senha'}).isEnabled(),true);
 await f.page.getByLabel('Nova senha',{exact:true}).fill('abcdefgh');await f.page.getByLabel('Repita a nova senha',{exact:true}).fill('abcdefgh');await f.page.getByRole('button',{name:'Salvar nova senha'}).click();await f.page.getByText('Senha atualizada. Entre novamente com sua nova senha.').waitFor();
 assert.equal(f.writes.filter(w=>w.body?.password==='abcdefgh').length,1);
 assert.deepEqual(f.failures,[]);await f.context.close();console.log('PASS recovery event, expired link, neutral email response and 8-character password');
 const response=await fetch(origin+'/recuperar-conta');
 for(const header of ['content-security-policy','x-content-type-options','referrer-policy','permissions-policy','x-frame-options'])assert.ok(response.headers.get(header),header);
 assert.match(response.headers.get('content-security-policy'),/frame-ancestors 'none'/);console.log('PASS production security headers');
}finally{await browser.close();}
