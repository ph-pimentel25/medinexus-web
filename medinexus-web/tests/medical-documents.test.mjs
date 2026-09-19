import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const exports={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/app/lib/medical-document-utils.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports});
test('structured prescription starts with drug and does not duplicate fields or include leave days',()=>{
 const document={document_type:'prescription',days_off:3,content:{medication_name:'Medicamento de teste',medication_use:'Posologia de teste',dosage:'500 mg',route:'Oral',duration:'3 dias',quantity:'1 caixa',notes:'Orientação de teste',days_off:3}};
 const items=exports.getPrescriptionItems(document);
 assert.equal(items[0].name,'Medicamento de teste');assert.equal(items[0].details[0],'Posologia: Posologia de teste');
 assert.equal(items[0].details.length,5);assert.equal(exports.getMainText(document),'Orientação de teste');
 assert.equal(exports.getDetailSections(document).length,0);
 assert.equal(document.days_off,3,'Rendering must not mutate existing medical records');
});
test('leave remains exclusive to medical certificates and plain text is preserved',()=>{
 const document={document_type:'medical_certificate',days_off:3,plain_text:'Texto original',content:{notes:'Observações'}};
 assert.equal(exports.getMainText(document),'Texto original');
 assert.ok(exports.getDetailSections(document).some(section=>section.title==='Dias de afastamento'&&section.value==='3 dias'));
 assert.equal(exports.getPrescriptionItems(document).length,0);
});

import {PGlite} from '@electric-sql/pglite';
test('database forbids leave on prescriptions and derives medication-first text',async()=>{
 const db=new PGlite();try{
 await db.exec('create table medical_documents(document_type text,content jsonb,days_off integer,plain_text text,purpose text);');
 await db.exec(fs.readFileSync('supabase/migrations/20260917020000_document_content.sql','utf8'));
 const content={medication_name:'Medicamento de teste',medication_use:'Posologia de teste',dosage:'500 mg',route:'Oral',duration:'3 dias',quantity:'1 caixa'};
 await assert.rejects(db.query("insert into medical_documents(document_type,content,days_off) values('prescription',$1,3)",[content]));
 await assert.rejects(db.query("insert into medical_documents(document_type,content) values('prescription',$1)",[{...content,days_off:3}]));
 await assert.rejects(db.query("insert into medical_documents(document_type,content) values('prescription',$1)",[{medications:[{...content,leave_days:3}]}]));
 await assert.rejects(db.query("insert into medical_documents(document_type,content) values('prescription',$1)",[{medication_name:''}]));
 await assert.rejects(db.query("insert into medical_documents(document_type,content) values('prescription',$1)",[{medications:{}}]));
 const result=(await db.query("insert into medical_documents(document_type,content,plain_text,purpose) values('prescription',$1,'Texto do cliente descartado','Outro') returning *",[content])).rows[0];
 assert.ok(result.plain_text.startsWith('Medicamento de teste\nPosologia: Posologia de teste\nDosagem: 500 mg'));
 assert.equal(result.purpose,null);assert.equal(result.days_off,null);
 await db.query("insert into medical_documents(document_type,content,days_off) values('medical_certificate',$1,3)",[{days_off:3}]);
 }finally{await db.close();}
});
