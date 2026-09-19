import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function load(file,env={},fetch=()=>{throw new Error('Unexpected network');}){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/app/lib/'+file+'.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,process:{env},fetch,URL,AbortSignal});return exports;}
test('payment adapter refuses disabled/live keys, uses cents and hosted sandbox without clinical/card data',async()=>{
 for(const env of [{},{PAYMENTS_ENABLED:'true',PAYMENT_ENVIRONMENT:'production',ASAAS_API_KEY:'$aact_prod_example'},{PAYMENTS_ENABLED:'true',PAYMENT_ENVIRONMENT:'sandbox',ASAAS_API_KEY:'$aact_prod_example'}])assert.throws(()=>load('payment-provider',env).paymentProvider());
 let sent;const env={PAYMENTS_ENABLED:'true',PAYMENT_ENVIRONMENT:'sandbox',ASAAS_API_KEY:'$aact_hmlg_example'};
 const provider=load('payment-provider',env,async(url,options)=>{assert.equal(url,'https://api-sandbox.asaas.com/v3/checkouts');sent=JSON.parse(options.body);return {ok:true,json:async()=>({id:'checkout-test',link:'https://sandbox.asaas.com/checkoutSession/show?id=checkout-test'})};}).paymentProvider();
 const input={reference:'opaque-reference',grossCents:12345,method:'pix',appUrl:'https://app.example'};
 const result=await provider.createCheckout(input);assert.equal(sent.items[0].value,123.45);assert.equal(sent.billingTypes[0],'PIX');assert.equal(sent.splits,undefined);assert.equal(sent.customerData,undefined);assert.equal(sent.callback.successUrl,'https://app.example/consultas');assert.match(result.url,/sandbox/);
 await assert.rejects(provider.createCheckout({...input,grossCents:1.5}));
 const malicious=load('payment-provider',env,async()=>({ok:true,json:async()=>({id:'test',link:'https://evil.test'})})).paymentProvider();await assert.rejects(malicious.createCheckout(input));
});
test('clinical AI is opt-in, refuses partial output and sends store:false',async()=>{
 await assert.rejects(load('clinical-summary-provider').generateClinicalSummary({notes:[],documents:[]}));
 const env={CLINICAL_AI_ENABLED:'true',OPENAI_API_KEY:'test',OPENAI_CLINICAL_MODEL:'test-model'};let sent;
 const provider=load('clinical-summary-provider',env,async(url,options)=>{sent=JSON.parse(options.body);return {ok:true,json:async()=>({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify({summary:'Resumo conferível'})}]}]})};});
 assert.equal((await provider.generateClinicalSummary({notes:[{summary:'Original'}],documents:[]})).summary,'Resumo conferível');assert.equal(sent.store,false);assert.equal(sent.text.format.strict,true);
 await assert.rejects(provider.generateClinicalSummary({notes:['a'.repeat(60001)],documents:[]}));
 const incomplete=load('clinical-summary-provider',env,async()=>({ok:true,json:async()=>({status:'incomplete',output:[]})}));await assert.rejects(incomplete.generateClinicalSummary({notes:[],documents:[]}));
});
test('signature intent binds doctor, hash and explicit recent action; expiration or revocation blocks signing',()=>{
 const api=load('certified-signature-provider');const now=Date.now();const auth={provider:'test',reference:'authorization',doctorId:'doctor',certificateFingerprint:'fingerprint',expiresAt:new Date(now+60000).toISOString(),revokedAt:null};const intent={doctorId:'doctor',documentId:'doc',pdfSha256:'a'.repeat(64),confirmedAt:new Date(now).toISOString(),authorizationReference:'authorization'};
 api.validateSigningIntent(intent,auth,now);
 for(const change of [{doctorId:'other'},{authorizationReference:'other'},{confirmedAt:new Date(now-600000).toISOString()},{pdfSha256:'not-a-hash'}])assert.throws(()=>api.validateSigningIntent({...intent,...change},auth,now));
 assert.throws(()=>api.validateSigningIntent(intent,{...auth,expiresAt:new Date(now-1).toISOString()},now));assert.throws(()=>api.validateSigningIntent(intent,{...auth,revokedAt:new Date(now).toISOString()},now));assert.throws(()=>api.certifiedSignatureProvider());
});
