// Local production build only. Auth, database, GPS, CEP and geocoding are fixtures.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const origin=process.env.TEST_BASE_URL||'http://localhost:3104';
assert.equal(new URL(origin).hostname,'localhost');
const browser=await chromium.launch({headless:true,executablePath:['C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(fs.existsSync)});
const uid='00000000-0000-4000-8000-000000000001';
const user={id:uid,email:'test@example.test',aud:'authenticated',app_metadata:{provider:'email'},user_metadata:{role:'patient'}};
const profile={id:uid,role:'patient',full_name:'Paciente Teste',phone:'21999999999',cpf:'52998224725',email:user.email,profile_completed:true,data_usage_consent:true,address_street:'Rua Original',address_number:'10',address_neighborhood:'Centro',address_city:'Rio de Janeiro',address_state:'RJ',address_country:'Brasil',address_zipcode:'20000000',latitude:-22.9,longitude:-43.1};
const patient={id:uid,birth_date:'1990-01-01',accepts_private_consultation:true};
const writes=[];let geocodes=0,cepRequests=0;
try {
 const context=await browser.newContext({viewport:{width:390,height:844}});
 const session={access_token:'mock.access.token',refresh_token:'mock',expires_at:Math.floor(Date.now()/1000)+3600,expires_in:3600,token_type:'bearer',user};
 await context.addInitScript(({key,session})=>{
  localStorage.setItem(key,JSON.stringify(session));
  Object.defineProperty(navigator,'geolocation',{configurable:true,value:{watchPosition(success){setTimeout(()=>success({coords:{latitude:-22.901,longitude:-43.101,accuracy:15}}),10);return 1;},clearWatch(){}}});
 },{key:'sb-'+new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split('.')[0]+'-auth-token',session});
 await context.route('**/auth/v1/**',r=>r.fulfill({json:user}));
 await context.route('**/rest/v1/**',r=>{
  const req=r.request(),table=new URL(req.url()).pathname.split('/').at(-1);
  if(req.method()!=='GET')writes.push({table,body:req.postDataJSON()});
  const rows={profiles:[profile],patients:[patient],account_registration_locks:[{account_type:'patient'}],specialties:[{id:uid,name:'Cardiologia'}],patient_preferences:[{email_consent:false,whatsapp_consent:false}]}[table]||[];
  return r.fulfill({json:(req.headers().accept||'').includes('vnd.pgrst.object')?(rows[0]||null):rows});
 });
 await context.route('**/nominatim.openstreetmap.org/**',r=>{
  geocodes++;
  return r.fulfill({json:{address:{road:'Rua GPS',house_number:'30',suburb:'Centro',city:'Rio de Janeiro',state:'Rio de Janeiro',postcode:'20000001',country_code:'br'}}});
 });
 await context.route('**/viacep.com.br/**',r=>{cepRequests++;return r.fulfill({json:{logradouro:'Rua CEP',localidade:'Rio de Janeiro',uf:'RJ'}});});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(origin+'/dashboard',{waitUntil:'networkidle'});
 assert.equal(await page.getByRole('link',{name:'Encontrar atendimento',exact:true}).getAttribute('href'),'/busca');
 await page.getByRole('link',{name:'Encontrar atendimento',exact:true}).click();
 await page.getByRole('heading',{name:'Quando você pode ir à consulta?'}).waitFor();
 await page.getByText('Origem da busca',{exact:true}).waitFor();
 assert.match(await page.getByRole('link',{name:'Conferir ponto no mapa'}).getAttribute('href'),/-22.9,-43.1/);
 // A far-future date paired with the wrong weekday must fail before any database insert.
 const future=new Date(Date.now()+7*86400000).toISOString().slice(0,10);
 await page.getByLabel('Data inicial preferida').fill(future);await page.getByLabel('Data final preferida').fill(future);
 await page.locator('select').first().selectOption(uid);
 const wrongDay=String((new Date(future+'T12:00:00Z').getUTCDay()+1)%7);
 await page.locator('select').last().selectOption(wrongDay);
 await page.getByRole('button',{name:'Buscar opções',exact:true}).click();
 await page.getByText(/Os dias da semana escolhidos não ocorrem/).waitFor();
 assert.equal(writes.length,0);
 console.log('PASS dashboard primary action, search origin and invalid availability without writes');
 await page.goto(origin+'/perfil',{waitUntil:'networkidle'});
 assert.equal(await page.locator('[name="address_street"]').inputValue(),'Rua Original');
 assert.equal(cepRequests,0,'Loading a saved ZIP must not overwrite the address or GPS');
 await page.getByRole('button',{name:'Usar minha localização atual',exact:true}).click();
 await page.getByText('Confira antes de usar esta localização',{exact:true}).waitFor();
 assert.equal(await page.locator('[name="address_street"]').inputValue(),'Rua Original');
 await page.getByRole('button',{name:'Descartar',exact:true}).click();
 assert.equal(await page.locator('[name="address_street"]').inputValue(),'Rua Original');
 await page.getByRole('button',{name:'Usar minha localização atual',exact:true}).click();
 await page.getByRole('button',{name:'Confirmar este ponto',exact:true}).click();
 assert.equal(await page.locator('[name="address_street"]').inputValue(),'Rua GPS');
 assert.equal(await page.locator('[name="address_zipcode"]').inputValue(),'20000001');
 await page.locator('[name="phone"]').fill('21988888888');
 await page.locator('button[type="submit"]').click();
 await page.getByText('Perfil atualizado com sucesso.',{exact:true}).waitFor();
 const saved=writes.findLast(w=>w.table==='profiles');assert.ok(saved);
 assert.equal(saved.body.latitude,-22.901);assert.equal(saved.body.longitude,-43.101);
 assert.equal(geocodes,2,'Saving must not replace confirmed GPS with another geocode');
 assert.equal(cepRequests,0,'GPS ZIP must not launch a second lookup');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 assert.deepEqual(errors,[]);
 fs.mkdirSync('artifacts/location-journey',{recursive:true});await page.screenshot({path:'artifacts/location-journey/profile-mobile.png',fullPage:true});
 console.log('PASS GPS preview/discard/confirm, no automatic CEP overwrite, saved point preserved, mobile layout');
 await context.close();
} finally {await browser.close();}
