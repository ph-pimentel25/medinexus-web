import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function loadGeocoder(fetch) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync("src/app/lib/geocode.ts", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports, URL, AbortSignal, fetch });
  return exports;
}
const previous = { city: "São Paulo", state: "SP", neighborhood: "Centro" };
const address = { city: "Rio de Janeiro", state: "RJ", neighborhood: "Botafogo" };
const oldCoordinates = { latitude: -23.5505, longitude: -46.6333 };
const failed = async () => ({ ok: false });

test("changing clinic address replaces coordinates used by distance search", async () => {
  const { refreshAddressCoordinates } = loadGeocoder(async () => ({ ok: true, json: async () => [{ lat: "-22.95", lon: "-43.18" }] }));
  const result = await refreshAddressCoordinates(address, previous, oldCoordinates);
  assert.equal(result.latitude, -22.95);
  assert.equal(result.longitude, -43.18);
});

test("changed address cannot keep the previous city coordinates when lookup fails", async () => {
  const result = await loadGeocoder(failed).refreshAddressCoordinates(address, previous, oldCoordinates);
  assert.equal(result.latitude, null);
  assert.equal(result.longitude, null);
});

test("saving an unchanged address preserves coordinates during a geocoder outage", async () => {
  const result = await loadGeocoder(failed).refreshAddressCoordinates({ ...previous, city: " São Paulo ", state: "sp" }, previous, oldCoordinates);
  assert.equal(result.latitude, oldCoordinates.latitude);
  assert.equal(result.longitude, oldCoordinates.longitude);
});

test("saving an unchanged address repairs stale coordinates from the old clinic form", async () => {
  const result = await loadGeocoder(async () => ({ ok: true, json: async () => [{ lat: "-22.95", lon: "-43.18" }] })).refreshAddressCoordinates(address, address, oldCoordinates);
  assert.equal(result.latitude, -22.95);
});

test("incomplete address never geocodes the whole country", async () => {
  const result = await loadGeocoder(() => { throw new Error("Must not request a location"); }).geocodeBrazilAddress({});
  assert.equal(result.latitude, null);
});

test("unknown street never falls back to a city center", async () => {
 const queries=[];
 const result=await loadGeocoder(async url=>{queries.push(new URL(url).searchParams.get("q"));return {ok:true,json:async()=>[{lat:"-22.9",lon:"-43.1",addresstype:"city"}]};}).geocodeBrazilAddress({...address,street:"Rua fictícia",number:"20"});
 assert.equal(result.latitude,null);assert.equal(queries.length,1);assert.ok(queries[0].includes("Rua fictícia"));
});
test("invalid coordinates from upstream never enter a patient profile", async()=>{
 const result=await loadGeocoder(async()=>({ok:true,json:async()=>[{lat:"not-a-number",lon:"-43.1"}]})).geocodeBrazilAddress(address);
 assert.equal(result.latitude,null);
});
