import fs from "node:fs";
import crypto from "node:crypto";
import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";

const origin = process.env.TEST_BASE_URL || "http://localhost:3000";
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const check = (result, label) => { if (result.error) throw new Error(label + ": " + result.error.message); return result.data; };
const executablePath = [
  process.env.LOCALAPPDATA + "/ms-playwright/chromium-1228/chrome-win64/chrome.exe",
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
].find(p => fs.existsSync(p));
const browser = await chromium.launch({ headless: true, executablePath });
const report = [];
try {
  for (const role of ["patient", "doctor", "clinic"]) {
    const email = "qa+" + role + "-" + crypto.randomUUID() + "@example.com";
    const password = crypto.randomBytes(24).toString("base64url") + "9aA!";
    const roleName = role === "clinic" ? "clinic_admin" : role;
    const draft = {
      version: 1, accountType: role, fullName: "TESTE TEMPORARIO " + role,
      crm: "999987", crmState: "SP", clinicTradeName: "TESTE TEMPORARIO",
      clinicCity: "Sao Paulo", clinicState: "SP", clinicNeighborhood: "Centro",
    };
    // Confirm only the test account; no email is sent. The app completes all
    // public-table writes using the normal password-authenticated browser.
    const created = check(await admin.auth.admin.createUser({
      email, password, email_confirm: true,
      user_metadata: { full_name: draft.fullName, role: roleName, medinexus_registration: draft },
    }), "create temporary identity");
    const userId = created.user.id;
    let context;
    try {
      context = await browser.newContext({ viewport: { width: 390, height: 844 } });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", error => errors.push(error.message));
      await page.goto(origin + "/login", { waitUntil: "networkidle" });
      await page.locator('input[type="email"]').fill(email);
      await page.locator('input[type="password"]').fill(password);
      await page.getByRole("button", { name: "Entrar na plataforma", exact: true }).click();
      const destination = role === "patient" ? "/dashboard" : role === "doctor" ? "/medico/dashboard" : "/clinica/dashboard";
      try {
        await page.waitForURL(origin + destination, { timeout: 20000 });
      } catch {
        const messages = (await page.locator("body").innerText()).split("\n").filter(t => /erro|error|permiss|violat|could not|failed|imposs|poss.vel/i.test(t));
        throw new Error("registration destination failed: " + JSON.stringify(messages));
      }
      await page.waitForLoadState("networkidle");
      const profile = check(await admin.from("profiles").select("role").eq("id", userId).single(), "profile");
      if (profile.role !== roleName) throw new Error("Incorrect profile role: " + profile.role);
      const table = role === "patient" ? "patients" : role === "doctor" ? "doctors" : "clinics";
      const record = check(await admin.from(table).select("id").eq("id", userId).single(), table);
      if (role === "clinic") {
        const member = check(await admin.from("clinic_members").select("member_role").eq("user_id", userId).eq("clinic_id", record.id).single(), "membership");
        if (member.member_role !== "owner") throw new Error("Missing clinic owner membership");
      }
      if (errors.length) throw new Error(JSON.stringify(errors));
      report.push({ role, passwordLogin: true, registrationCompleted: true, destination, profileRole: profile.role });
      console.log(JSON.stringify(report.at(-1)));
    } catch (error) {
      report.push({ role, error: error.message });
      console.error(JSON.stringify(report.at(-1)));
      process.exitCode = 1;
    } finally {
      if (context) await context.close();
      // Delete exclusively the identity just created and its known records.
      const identity = check(await admin.auth.admin.getUserById(userId), "verify test identity");
      if (identity.user.email !== email || !email.startsWith("qa+")) throw new Error("Test cleanup identity mismatch");
      for (const [table, column] of [["clinic_members","user_id"],["doctors","id"],["clinics","id"],["patients","id"],["profiles","id"]]) {
        check(await admin.from(table).delete().eq(column, userId), "cleanup " + table);
      }
      check(await admin.auth.admin.deleteUser(userId), "cleanup temporary identity");
      console.log(JSON.stringify({ role, temporaryAccountRemoved: true }));
    }
  }
} finally {
  fs.mkdirSync("artifacts", { recursive: true });
  fs.writeFileSync("artifacts/registration-report.json", JSON.stringify(report, null, 2));
  await browser.close();
}
