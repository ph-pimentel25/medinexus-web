import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function load(source, imports) {
  const code = ts.transpileModule(fs.readFileSync(source, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, require: name => imports[name], console });
  return exports;
}
const auth = load("src/app/lib/auth.ts", { "./supabase": { supabase: {} } });
const navigation = load("src/app/lib/navigation.ts", { "./auth": auth });
const user = { id: "user-1", email: "demo@example.test", user_metadata: {} };
function client(rows = {}, failedTable = "") {
  return { from(table) {
    const result = { data: rows[table] ?? (table === "clinic_members" ? [] : null), error: table === failedTable ? { message: "RLS failed" } : null };
    const query = { select: () => query, eq: () => query, or: () => query, order: () => query, limit: () => query, maybeSingle: async () => result, then: (resolve, reject) => Promise.resolve(result).then(resolve, reject) };
    return query;
  } };
}
test("direct doctor works without clinic membership or RPC", async () => {
  const result = await auth.resolveUserRole(user, client({ doctors: { id: "d1", name: "Médico", clinic_id: null } }));
  assert.equal(result.role, "doctor"); assert.equal(result.id, "d1");
});
test("clinic doctor is never classified as clinic staff", async () => {
  const result = await auth.resolveUserRole(user, client({ clinic_members: [{ member_role: "doctor", role: "owner", doctor_id: "d2", clinic_id: "c1" }] }));
  assert.equal(result.role, "doctor"); assert.equal(result.id, "d2");
});
test("legacy member role is supported", async () => {
  const result = await auth.resolveUserRole(user, client({ clinic_members: [{ role: "doctor", doctor_id: "d2", clinic_id: "c1" }] }));
  assert.equal(result.role, "doctor");
});
test("clinic owner does not need a membership to reach settings", async () => {
  const result = await auth.resolveUserRole(user, client({ clinics: { id: "c1", trade_name: "Clínica" } }));
  assert.equal(result.role, "clinic"); assert.equal(result.memberRole, "owner");
});
test("multiple clinic memberships select a deterministic valid admin relationship", async () => {
  const result = await auth.resolveUserRole(user, client({ clinic_members: [{ clinic_id: "a", member_role: "viewer" }, { clinic_id: "b", member_role: "admin" }] }));
  assert.equal(result.id, "b"); assert.equal(result.role, "clinic");
});
test("lookup errors do not downgrade a professional to patient", async () => {
  await assert.rejects(auth.resolveUserRole(user, client({}, "doctors")), /perfil/);
});
test("failed optional lookup does not override proven doctor relationship", async () => {
  const result = await auth.resolveUserRole(user, client({ doctors: { id: "d1" } }, "clinics"));
  assert.equal(result.role, "doctor");
});
test("patient has a stable user id", async () => {
  const result = await auth.resolveUserRole(user, client({ profiles: { role: "patient", full_name: "Paciente" } }));
  assert.equal(result.role, "patient"); assert.equal(result.id, user.id);
});
test("incomplete clinic stays incomplete rather than becoming patient", async () => {
  const result = await auth.resolveUserRole(user, client({ profiles: { role: "clinic_admin" } }));
  assert.equal(result.role, "clinic"); assert.equal(result.id, null);
});
test("self-declared metadata does not grant professional access", async () => {
  const result = await auth.resolveUserRole({ ...user, user_metadata: { role: "doctor" } }, client());
  assert.equal(result.role, "doctor"); assert.equal(result.id, null);
});
for (const [role, dashboard, profile] of [
  ["doctor", "/medico/dashboard", "/medico/perfil"],
  ["clinic", "/clinica/dashboard", "/clinica/configuracoes"],
  ["patient", "/dashboard", "/perfil"],
  ["public", "/login", "/login"],
]) test(role + " has consistent dashboard and profile destinations", () => {
  assert.equal(auth.getRoleDashboardPath(role), dashboard);
  assert.equal(auth.getRoleProfilePath(role), profile);
  if (role !== "public") {
    const links = navigation.getNavigation(role);
    assert.equal(links[0].href, dashboard);
    assert.equal(links.at(-1).href, profile);
    for (const { href } of links) assert.ok(fs.existsSync("src/app" + href + "/page.tsx"), "Missing route " + href);
  }
});
test("public clinic listing is not confused with the clinic portal", () => {
  assert.equal(navigation.isActivePath("/clinicas", "/clinica"), false);
});
