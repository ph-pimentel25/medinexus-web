import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
const code = ts.transpileModule(fs.readFileSync("src/app/api/discovery/route.ts", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
function route(authenticated = true) {
  const exports = {};
  const client = { auth: { getUser: async () => ({ data: { user: authenticated ? { id: "patient-test" } : null } }) }, from() { throw new Error("Invalid request reached database"); } };
  vm.runInNewContext(code, { exports, Response, process: { env: { NEXT_PUBLIC_SUPABASE_URL: "https://example.test", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "public-test" } }, require: () => ({ createClient: () => client }) });
  return exports.POST;
}
for (const [label, body] of [
  ["null JSON", "null"], ["array JSON", "[]"], ["malformed JSON", "{"],
  ["blank specialty", JSON.stringify({ query: "   ", city: "Rio de Janeiro" })],
  ["blank city", JSON.stringify({ query: "Cardiologia", city: "  " })],
]) test("discovery rejects " + label + " without querying providers", async () => {
  const result = await route()(new Request("https://example.test/api/discovery", { method: "POST", headers: { Authorization: "Bearer test" }, body }));
  assert.equal(result.status, 400);
});
test("expired session cannot access discovery", async () => {
  const result = await route(false)(new Request("https://example.test/api/discovery", { method: "POST", headers: { Authorization: "Bearer test" }, body: JSON.stringify({ query: "Cardiologia", city: "Rio de Janeiro" }) }));
  assert.equal(result.status, 401);
});
