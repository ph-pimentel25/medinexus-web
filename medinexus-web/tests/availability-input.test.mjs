import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const exports={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/app/lib/availability-input.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports});
const now=new Date('2026-09-29T02:00:00Z'); // Still Monday in Brasilia.
const windows=[{weekday:'1',startTime:'09:00',endTime:'12:00'}];
const check=(start,end,w=windows)=>exports.availabilityInputError(start,end,w,now);
test('availability dates follow Brasilia, not UTC or browser timezone',()=>{
 assert.equal(exports.brazilToday(now),'2026-09-28');
 assert.equal(check('2026-09-28','2026-09-28'),null);
});
test('rejects selected weekdays absent from the requested dates before writing a search',()=>{
 assert.match(check('2026-09-29','2026-09-29'),/dias da semana/);
 assert.equal(check('2026-09-29','2026-10-05'),null);
});
test('rejects reversed, past, impossible and excessively long periods',()=>{
 for(const [start,end] of [['2026-09-30','2026-09-29'],['2026-09-27','2026-09-28'],['2026-02-30','2026-03-01'],['2026-09-28','2027-04-01']]) assert.ok(check(start,end));
});
test('no invalid time window is silently dropped',()=>{
 assert.ok(check('','',[...windows,{weekday:'2',startTime:'12:00',endTime:'09:00'}]));
 assert.ok(check('','',[{weekday:'7',startTime:'09:00',endTime:'12:00'}]));
 assert.equal(check('',''),null);
});
