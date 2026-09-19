import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
function load(path) {
  const code = ts.transpileModule(fs.readFileSync(path, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports });
  return exports;
}
const { loadAccount } = load("src/account.ts");
const { brazilState, validBirthDate, validCpf, routeUrls, BRAZIL_STATES } = load("src/address.ts");
const user = { id: "patient-one", email: "patient@example.test", user_metadata: { full_name: "Paciente de teste", role: "patient" } };
function database(initial = {}, failed = "") {
  const rows = { ...initial }, writes = [];
  return { writes, from(table) {
    let payload;
    const execute = () => {
      if (table === failed) return { data: null, error: { message: "Failed" } };
      if (payload) { writes.push({ table, payload }); rows[table] ||= payload; }
      return { data: rows[table] || (table === "clinic_members" ? [] : null), error: null };
    };
    const query = { select: () => query, eq: () => query, or: () => query, order: () => query, limit: () => query,
      upsert: data => { payload = data; return query; }, maybeSingle: async () => execute(), then: (resolve, reject) => Promise.resolve(execute()).then(resolve, reject) };
    return query;
  } };
}
test("email-confirmed signup resumes once without overwriting an existing patient", async () => {
  const db = database();
  const account = await loadAccount(user, db);
  assert.equal(account.newPatient, true); assert.equal(account.role, "patient");
  assert.equal(db.writes.length, 2);
  await loadAccount(user, db); assert.equal(db.writes.length, 2);
});
test("interrupted signup creates only the missing patient record", async () => {
  const db = database({ profiles: { full_name: "Nome já editado", role: "patient" } });
  assert.equal((await loadAccount(user, db)).newPatient, true);
  assert.equal(db.writes.length, 1); assert.equal(db.writes[0].table, "patients");
  assert.equal(db.writes[0].payload.full_name, "Nome já editado");
});
test("existing patient details are never reset on login", async () => {
  const db = database({ profiles: { full_name: "Nome atualizado", role: "patient" }, patients: { id: user.id } });
  assert.equal((await loadAccount(user, db)).name, "Nome atualizado"); assert.equal(db.writes.length, 0);
});
for (const [label, rows, role] of [
  ["autonomous physician", { doctors: { id: "doctor-one" } }, "doctor"],
  ["legacy physician membership", { clinic_members: [{ role: "doctor", doctor_id: "doctor-one" }] }, "doctor"],
  ["clinic owner without membership", { clinics: { id: "clinic-one" } }, "clinic"],
  ["clinic administrator", { clinic_members: [{ member_role: "admin", clinic_id: "clinic-one" }] }, "clinic"],
  ["incomplete clinic registration", { profiles: { role: "clinic_admin" } }, "clinic"],
]) test(label + " is never converted to a patient", async () => {
  const db = database(rows); assert.equal((await loadAccount(user, db)).role, role); assert.equal(db.writes.length, 0);
});
test("doctor relationship takes precedence over clinic ownership", async () => {
  const db = database({ doctors: { id: "doctor-one" }, clinics: { id: "clinic-one" } });
  assert.equal((await loadAccount(user, db)).role, "doctor");
});
test("professional lookup failure prevents patient bootstrap", async () => {
  const db = database({}, "doctors"); await assert.rejects(loadAccount(user, db), /verificar/); assert.equal(db.writes.length, 0);
});
test("partial registration error remains recoverable without role replacement", async () => {
  const db = database({}, "patients"); await assert.rejects(loadAccount(user, db), /paciente/); assert.equal(db.writes.length, 0);
});
test("all Brazilian states and ISO state codes map correctly", () => {
  assert.equal(Object.keys(BRAZIL_STATES).length, 27);
  assert.equal(brazilState("Rio de Janeiro"), "RJ"); assert.equal(brazilState("BR-SP"), "SP");
  assert.equal(brazilState("California"), ""); assert.equal(brazilState(null), "");
});
test("invalid CPF and impossible birth dates are rejected", () => {
  assert.equal(validCpf("111.111.111-11"), false); assert.equal(validCpf("529.982.247-25"), true);
  assert.equal(validCpf("529.982.247-26"), false);
  assert.equal(validBirthDate("2000-02-29"), true); assert.equal(validBirthDate("2001-02-29"), false);
  assert.equal(validBirthDate("2999-01-01"), false); assert.equal(validBirthDate("29/02/2000"), false);
});
test("directions preserve residence origin while Waze uses current position", () => {
  const links = routeUrls("Rua A & B, 12, São Paulo", "Rua de casa, 8");
  assert.equal(new URL(links.google).searchParams.get("origin"), "Rua de casa, 8");
  assert.equal(new URL(links.apple).searchParams.get("daddr"), "Rua A & B, 12, São Paulo");
  assert.equal(new URL(links.waze).searchParams.has("origin"), false);
  assert.equal(new URL(routeUrls("Clínica").google).searchParams.has("origin"), false);
});
