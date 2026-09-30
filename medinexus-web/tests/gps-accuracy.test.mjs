import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const exports={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/app/lib/geolocation.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,setTimeout,clearTimeout});
test('rejects coarse GPS fixes instead of labeling them precise',()=>{
 assert.throws(()=>exports.assertUsableGps({latitude:-22.9,longitude:-43.1,accuracy:3500}),/não foi utilizada/);
 assert.doesNotThrow(()=>exports.assertUsableGps({latitude:-22.9,longitude:-43.1,accuracy:20}));
});
test('uses a refined GPS fix and stops watching after success',async()=>{
 const cleared=[];
 const result=await exports.captureBestLocation({watchPosition(success){success({coords:{latitude:-23,longitude:-44,accuracy:5000}});success({coords:{latitude:-22.9,longitude:-43.1,accuracy:15}});return 7;},clearWatch(id){cleared.push(id);}});
 assert.equal(result.accuracy,15);assert.ok(cleared.includes(7));
});
test('permission denied stops the GPS watch and reports the address alternative',async()=>{
 const cleared=[];
 await assert.rejects(exports.captureBestLocation({watchPosition(_,error){error({code:1});return 8;},clearWatch(id){cleared.push(id);}}),/endereço/);
 assert.ok(cleared.includes(8));
});
