import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const code = ts.transpileModule(fs.readFileSync("src/app/lib/telemedicine-access.ts", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const mod = {};
vm.runInNewContext(code, { exports: mod, Date });

const start = new Date("2026-10-10T14:00:00Z");
const appt = {
  status: "confirmed",
  confirmed_start_at: start.toISOString(),
  confirmed_end_at: new Date(start.getTime() + 30 * 60000).toISOString(),
};

test("sala só abre 15 min antes", () => {
  assert.equal(mod.checkJoinWindow(appt, new Date("2026-10-10T13:40:00Z")).reason, "too_early");
  assert.equal(mod.checkJoinWindow(appt, new Date("2026-10-10T13:46:00Z")).ok, true);
});

test("sala fecha 60 min após o fim", () => {
  assert.equal(mod.checkJoinWindow(appt, new Date("2026-10-10T15:20:00Z")).ok, true);
  assert.equal(mod.checkJoinWindow(appt, new Date("2026-10-10T15:31:00Z")).reason, "too_late");
});

test("exige consulta confirmada e com horário", () => {
  assert.equal(mod.checkJoinWindow({ ...appt, status: "pending" }, start).reason, "not_confirmed");
  assert.equal(mod.checkJoinWindow({ ...appt, confirmed_start_at: null }, start).reason, "no_schedule");
});

test("nome da sala é derivado do id da consulta", () => {
  assert.equal(mod.roomNameFor("abc"), "mn-abc");
});
