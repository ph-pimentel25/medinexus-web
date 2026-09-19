import {test} from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
function load(file){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,URL,AbortSignal,fetch:()=>{throw new Error("Unexpected network request");},process:{env:{}}});return exports;}
const geo=load("src/app/lib/geolocation.ts");
test("all 27 Brazilian states resolve to valid UF",()=>{assert.equal(Object.keys(geo.BRAZIL_STATES).length,27);for(const [state,uf]of Object.entries(geo.BRAZIL_STATES)){assert.equal(geo.parseBrazilAddress({address:{state,country_code:"br"}}).state,uf);assert.equal(geo.parseBrazilAddress({address:{"ISO3166-2-lvl4":`BR-${uf}`}}).state,uf);}assert.equal(geo.parseBrazilAddress({address:{state:"Unknown"}}).state,"");});
test("foreign GPS location does not become a Brazilian address",()=>{assert.throws(()=>geo.parseBrazilAddress({address:{country_code:"us",state:"Alabama"}}));});
test("directions encode full addresses and preserve chosen origin",()=>{const {directionsLinks}=load("src/app/lib/directions.ts");const urls=directionsLinks("Rua A & B, 42, São Paulo","Rua C, 90");assert.equal(new URL(urls.google).searchParams.get("destination"),"Rua A & B, 42, São Paulo");assert.equal(new URL(urls.google).searchParams.get("origin"),"Rua C, 90");assert.equal(new URL(urls.apple).searchParams.get("saddr"),"Rua C, 90");assert.equal(new URL(directionsLinks("Rua A").google).searchParams.has("origin"),false);});
test("WhatsApp only accepts complete Brazilian phone numbers",()=>{const {normalizeBrazilPhone}=load("src/app/lib/notification-delivery.ts");assert.equal(normalizeBrazilPhone("(21) 99999-9999"),"+5521999999999");assert.equal(normalizeBrazilPhone("+55 21 99999-9999"),"+5521999999999");assert.equal(normalizeBrazilPhone("1234"),null);});
test("booking request notification never claims the appointment was confirmed",()=>{const {notificationText}=load("src/app/lib/notification-delivery.ts");assert.match(notificationText("requested",null,"https://app.example"),/Aguarde a confirmação/);assert.match(notificationText("confirmed",null,"https://app.example"),/foi confirmada/);});
