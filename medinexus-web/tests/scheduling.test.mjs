import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
const exports = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync("src/app/lib/scheduling.ts", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports, Date });
const slot = exports.findSuggestedSlot;
const base = {
  doctorId: "doctor", durationMinutes: 30, appointments: [],
  preferredStartDate: "2026-09-17", preferredEndDate: "2026-09-17", now: new Date("2026-09-17T09:10:00"),
  windows: [{ weekday: 4, start_time: "08:00", end_time: "17:00" }],
  availability: [{ doctor_id: "doctor", weekday: 4, day_of_week: 4, start_time: "09:00", end_time: "12:00", is_active: true }],
};
test("suggestions exclude times already in the past", () => {
  const result=slot(base);assert.equal(new Date(result.startAt).getHours(),9);assert.equal(new Date(result.startAt).getMinutes(),30);
});
test("no availability means no suggested appointment", () => assert.equal(slot({...base,availability:[]}).startAt,null));
test("inactive doctor hours are ignored", () => assert.equal(slot({...base,availability:base.availability.map(x=>({...x,is_active:false}))}).startAt,null));
test("patient and doctor must have intersecting hours", () => assert.equal(slot({...base,windows:[{weekday:4,start_time:"13:00",end_time:"17:00"}]}).startAt,null));
test("appointment must fit completely within the doctor's interval", () => assert.equal(slot({...base,availability:base.availability.map(x=>({...x,start_time:"09:15",end_time:"09:35"}))}).startAt,null));
test("occupied slot is skipped but an adjacent slot is valid", () => {
 const appointment={doctor_id:"doctor",status:"confirmed",confirmed_start_at:new Date("2026-09-17T09:30:00").toISOString(),confirmed_end_at:new Date("2026-09-17T10:00:00").toISOString(),requested_start_at:null,requested_end_at:null};
 const result=slot({...base,appointments:[appointment]});assert.equal(new Date(result.startAt).getHours(),10);assert.equal(new Date(result.startAt).getMinutes(),0);
});
test("cancelled appointments do not block the schedule", () => {
 const result=slot({...base,appointments:[{doctor_id:"doctor",status:"cancelled",requested_start_at:new Date("2026-09-17T09:30:00").toISOString(),requested_end_at:new Date("2026-09-17T10:30:00").toISOString(),confirmed_start_at:null,confirmed_end_at:null}]});
 assert.equal(new Date(result.startAt).getHours(),9);
});
test("zero duration cannot enter an infinite slot loop", () => assert.equal(slot({...base,durationMinutes:0}).startAt,null));
