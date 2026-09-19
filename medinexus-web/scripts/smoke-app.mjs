import fs from "node:fs";
import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";

const readOnly = process.env.SMOKE_READ_ONLY === "1";
const origin = process.env.TEST_BASE_URL || "http://localhost:3000";
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const binaries = [
  process.env.LOCALAPPDATA + "/ms-playwright/chromium-1228/chrome-win64/chrome.exe",
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
];
const browser = await chromium.launch({ headless: true, executablePath: binaries.find(p => fs.existsSync(p)) });
fs.mkdirSync("artifacts", { recursive: true });
const groups = {
  public: ["/", "/login", "/cadastro", "/medico/cadastro", "/clinica/cadastro", "/clinicas", "/profissionais", "/especialidades", "/pacotes", "/sobre"],
  medico: ["/medico/dashboard", "/medico/perfil", "/medico/disponibilidade", "/medico/solicitacoes", "/notificacoes", "/dashboard", "/perfil"],
  clinica: ["/clinica/dashboard", "/clinica/configuracoes", "/clinica/medicos", "/clinica/medicos/novo", "/clinica/planos", "/clinica/publico", "/clinica/solicitacoes", "/dashboard", "/perfil"],
  paciente: ["/dashboard", "/perfil", "/busca", "/solicitacoes", "/documentos", "/documentos-medicos", "/historico-clinico", "/notificacoes"],
};
const flow = fs.existsSync("artifacts/demo-flow.json") ? JSON.parse(fs.readFileSync("artifacts/demo-flow.json", "utf8")) : null;
if (flow) {
  groups.public.push("/clinicas/" + flow.clinicId, "/validar-documentos/" + flow.documentId + "?token=" + flow.validationToken);
  groups.medico.push("/medico/consultas/" + flow.appointmentId, "/medico/consultas/" + flow.appointmentId + "/documentos", "/medico/receituarios/" + flow.appointmentId);
  groups.clinica.push("/clinica/medicos/" + flow.doctorId);
  groups.paciente.push("/resultados?searchId=" + flow.searchId, "/consultas/" + flow.appointmentId + "/confirmar", "/documentos-medicos/" + flow.documentId);
}
groups.medico.push("/avaliacoes", "/documentos-medicos");
groups.clinica.push("/avaliacoes");
groups.paciente.push("/avaliacoes", "/descobrir");
const report = [];
try {
  for (const [role, routes] of Object.entries(groups)) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, deviceScaleFactor: 1, timezoneId: "America/Sao_Paulo" });
    if (role !== "public") {
      const link = await admin.auth.admin.generateLink({ type: "magiclink", email: role + "@medinexus.com" });
      if (link.error) throw link.error;
      const auth = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false } });
      const verified = await auth.auth.verifyOtp({ token_hash: link.data.properties.hashed_token, type: "magiclink" });
      if (verified.error) throw verified.error;
      const key = "sb-" + new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split(".")[0] + "-auth-token";
      await context.addInitScript(({ key, session }) => localStorage.setItem(key, JSON.stringify(session)), { key, session: verified.data.session });
    }
    const page = await context.newPage();
    let errors = [], failedRequests = [];
    page.on("pageerror", e => errors.push(e.message));
    page.on("response", async r => {
      if (r.status() >= 400 && (r.url().includes("/rest/v1/") || r.url().startsWith(origin))) {
        failedRequests.push({ path: new URL(r.url()).pathname, status: r.status(), detail: r.url().includes("/rest/v1/") ? (await r.text().catch(() => "")).slice(0,260) : "" });
      }
    });
    for (const route of routes) {
      errors = []; failedRequests = [];
      await page.goto(origin + route, { waitUntil: "networkidle", timeout: 60000 });
      await page.waitForTimeout(500);
      if (route.endsWith("dashboard")) await page.locator(".mn-metric-value[aria-label='Carregando']").first().waitFor({state:"hidden", timeout:15000});
      const body = await page.locator("body").innerText();
      const pathname = new URL(route, origin).pathname;
      const expectedPath = pathname === "/dashboard" && role !== "paciente" && role !== "public" ? "/" + role + "/dashboard"
        : pathname === "/perfil" && role === "medico" ? "/medico/perfil"
        : pathname === "/perfil" && role === "clinica" ? "/clinica/configuracoes" : pathname;
      const result = {
        role, route, finalPath: new URL(page.url()).pathname, correctDestination: new URL(page.url()).pathname === expectedPath, errors: [...errors], failedRequests: [...failedRequests],
        alerts: await page.locator('[role="alert"]').allTextContents(),
        visibleErrors: body.split("\n").filter(x => /^erro ao|^não foi possível|^documento não encontrado|^consulta não encontrada|error:/i.test(x)),
        overflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      };
      if (route.endsWith("dashboard") || route === "/") {
        await page.screenshot({ path: "artifacts/" + role + "-mobile.png", fullPage: true });
        await page.getByRole("button", { name: "Abrir menu", exact: true }).click();
        result.mobileMenu = await page.locator("#mobile-menu").isVisible();
        await page.getByRole("button", { name: "Fechar menu", exact: true }).click();
      }
      if (!readOnly && (route === "/medico/perfil" || route === "/clinica/configuracoes")) {
        const save = page.getByRole("button", { name: /salvar/i }).first();
        await save.click();
        await page.waitForTimeout(1000);
        result.savedProfile = /sucesso/i.test(await page.locator("body").innerText());
      }
      if (route.endsWith("dashboard")) {
        await page.setViewportSize({ width: 1366, height: 900 });
        result.desktopOverflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
        await page.screenshot({ path: "artifacts/" + role + "-desktop.png", fullPage: true });
        await page.setViewportSize({ width: 390, height: 844 });
      }
      report.push(result);
      console.log(JSON.stringify({role:result.role,route:pathname,correctDestination:result.correctDestination,errors:result.errors,failedRequests:result.failedRequests.map(({path,status})=>({path,status})),overflow:result.overflow,desktopOverflow:result.desktopOverflow,visibleErrorCount:result.visibleErrors.length}));
    }
    await context.close();
  }
} finally {
  fs.writeFileSync(readOnly ? "artifacts/smoke-production-readonly.json" : "artifacts/smoke-report.json", JSON.stringify(report, null, 2));
  await browser.close();
}
if (report.some(r => r.errors.length || r.failedRequests.length || r.visibleErrors.length || r.overflow || r.desktopOverflow || r.savedProfile === false || r.correctDestination === false || r.mobileMenu === false)) process.exitCode = 1;
