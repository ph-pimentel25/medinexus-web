import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import ts from 'typescript';
function load(file,imports={}){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:n=>imports[n],Date,console});return exports;}
const cnpj=load('src/app/lib/cnpj.ts'),password=load('src/app/lib/password-policy.ts');
test('CNPJ checksum, normalization and mask reject malformed/repeated digits',()=>{
 for(const v of ['11222333000181','11.222.333/0001-81','04.252.011/0001-10'])assert.equal(cnpj.isValidCnpj(v),true,v);
 for(const v of ['', '11222333000180','00000000000000','11111111111111','123','x11222333000181'])assert.equal(cnpj.isValidCnpj(v),false,v);
 assert.equal(cnpj.formatCnpj('11222333000181'),'11.222.333/0001-81');assert.equal(cnpj.normalizeCnpj('11.222.333/0001-81'),'11222333000181');
});
test('new passwords accept exactly 8 chars; existing login policy is unchanged',()=>{assert.equal(password.isValidNewPassword('1234567'),false);assert.equal(password.isValidNewPassword('12345678'),true);assert.equal(password.MIN_PASSWORD_LENGTH,8);});
test('recovery requires a recovery event and the same live session; normal auth, expiry, logout cannot authorize it',()=>{
 const r=load('src/app/lib/recovery-session.ts');const session={access_token:'token',user:{id:'u1'},expires_at:10000};
 r.observeRecoveryEvent('INITIAL_SESSION',session,1000);assert.equal(r.canResetPassword(session,1001),false);
 r.observeRecoveryEvent('SIGNED_IN',session,1000);assert.equal(r.canResetPassword(session,1001),false);
 r.observeRecoveryEvent('PASSWORD_RECOVERY',session,1000);assert.equal(r.canResetPassword(session,1001),true);
 assert.equal(r.canResetPassword({...session,user:{id:'u2'}},1001),false);
 assert.equal(r.canResetPassword({...session,access_token:'another'},1001),false);
 assert.equal(r.canResetPassword(session,1000+15*60_000),false);
 r.observeRecoveryEvent('TOKEN_REFRESHED',{...session,access_token:'new'},1002);assert.equal(r.canResetPassword({...session,access_token:'new'},1003),true);
 r.observeRecoveryEvent('SIGNED_OUT',null,1004);assert.equal(r.canResetPassword(session,1005),false);
});
for(const original of ['patient','doctor','clinic'])for(const target of ['patient','doctor','clinic'])test(`registration ${original} cannot become ${target} or rewrite completed accounts`,async()=>{
 let writes=0;
 const registration=load('src/app/lib/registration.ts',{'./supabase':{supabase:{from(){writes++;throw new Error('Unexpected write');}}},'./auth':{resolveUserRole:async()=>({role:original,id:'u1',registrationComplete:true})},'./cnpj':cnpj});
 const promise=registration.completeRegistration({id:'u1'}, {accountType:target,fullName:'Test'});
 if(original===target)await promise;else await assert.rejects(promise,/tipo/);
 assert.equal(writes,0);
});
