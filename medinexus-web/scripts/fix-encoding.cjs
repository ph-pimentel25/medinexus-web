const fs = require("fs");
const path = require("path");

const root = path.join(process.cwd(), "src");

const fixes = {
  "OlÃ¡": "Olá",
  "olÃ¡": "olá",

  "InÃ­cio": "Início",
  "inÃ­cio": "início",

  "ClÃ­nicas": "Clínicas",
  "clÃ­nicas": "clínicas",
  "ClÃ­nica": "Clínica",
  "clÃ­nica": "clínica",

  "MÃ©dico": "Médico",
  "mÃ©dico": "médico",
  "MÃ©dica": "Médica",
  "mÃ©dica": "médica",
  "MÃ©dicos": "Médicos",
  "mÃ©dicos": "médicos",

  "Ãrea": "Área",
  "Ã¡rea": "área",

  "PrÃ³ximas": "Próximas",
  "prÃ³ximas": "próximas",
  "PrÃ³ximos": "Próximos",
  "prÃ³ximos": "próximos",

  "AÃ§Ãµes": "Ações",
  "aÃ§Ãµes": "ações",

  "rÃ¡pidas": "rápidas",
  "RÃ¡pidas": "Rápidas",

  "SolicitaÃ§Ãµes": "Solicitações",
  "solicitaÃ§Ãµes": "solicitações",
  "solicitaÃ§Ã£o": "solicitação",
  "SolicitaÃ§Ã£o": "Solicitação",

  "NotificaÃ§Ãµes": "Notificações",
  "notificaÃ§Ãµes": "notificações",
  "notificaÃ§Ã£o": "notificação",
  "NotificaÃ§Ã£o": "Notificação",

  "Ãšltimos": "Últimos",
  "Ãºltimos": "últimos",

  "concluÃ­das": "concluídas",
  "ConcluÃ­das": "Concluídas",
  "concluÃ­da": "concluída",
  "ConcluÃ­da": "Concluída",

  "nÃ£o": "não",
  "NÃ£o": "Não",

  "VocÃª": "Você",
  "vocÃª": "você",

  "atualizaÃ§Ã£o": "atualização",
  "AtualizaÃ§Ã£o": "Atualização",
  "atualizaÃ§Ãµes": "atualizações",
  "AtualizaÃ§Ãµes": "Atualizações",

  "confirmaÃ§Ã£o": "confirmação",
  "ConfirmaÃ§Ã£o": "Confirmação",
  "confirmaÃ§Ãµes": "confirmações",
  "ConfirmaÃ§Ãµes": "Confirmações",

  "presenÃ§a": "presença",
  "PresenÃ§a": "Presença",

  "Ã©": "é",
  "Ã‰": "É",
  "Ã¡": "á",
  "Ã": "Á",
  "Ã­": "í",
  "Ã": "Í",
  "Ã³": "ó",
  "Ã“": "Ó",
  "Ãº": "ú",
  "Ãš": "Ú",
  "Ã¢": "â",
  "Ãª": "ê",
  "Ã´": "ô",
  "Ã£": "ã",
  "Ãµ": "õ",
  "Ã§": "ç",
  "Ã‡": "Ç",

  "ðŸ””": "🔔",
  "ðŸ”•": "🔔",
};

const extensions = new Set([".tsx", ".ts", ".css", ".js", ".jsx"]);

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }

    if (!extensions.has(path.extname(entry.name))) continue;

    let content = fs.readFileSync(fullPath, "utf8");
    let changed = false;

    for (const [bad, good] of Object.entries(fixes)) {
      if (content.includes(bad)) {
        content = content.split(bad).join(good);
        changed = true;
      }
    }

    if (changed) {
      fs.writeFileSync(fullPath, content, "utf8");
      console.log(`Corrigido: ${fullPath}`);
    }
  }
}

walk(root);

console.log("Correção de acentos finalizada.");