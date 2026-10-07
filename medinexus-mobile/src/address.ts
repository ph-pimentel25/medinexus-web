export const BRAZIL_STATES: Record<string, string> = {
  Acre: "AC", Alagoas: "AL", Amapá: "AP", Amazonas: "AM", Bahia: "BA", Ceará: "CE", "Distrito Federal": "DF", "Espírito Santo": "ES", Goiás: "GO", Maranhão: "MA", "Mato Grosso": "MT", "Mato Grosso do Sul": "MS", "Minas Gerais": "MG", Pará: "PA", Paraíba: "PB", Paraná: "PR", Pernambuco: "PE", Piauí: "PI", "Rio de Janeiro": "RJ", "Rio Grande do Norte": "RN", "Rio Grande do Sul": "RS", Rondônia: "RO", Roraima: "RR", "Santa Catarina": "SC", "São Paulo": "SP", Sergipe: "SE", Tocantins: "TO",
};

export function brazilState(value: string | null | undefined): string {
  const text = (value || "").replace(/^BR-/i, "").trim();
  return Object.values(BRAZIL_STATES).includes(text.toUpperCase()) ? text.toUpperCase() : BRAZIL_STATES[text] || "";
}
export function validBirthDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + "T12:00:00Z");
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value && value <= new Date().toISOString().slice(0, 10);
}
export function validCpf(value: string): boolean {
  const cpf = value.replace(/\D/g, "");
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  for (let count = 9; count < 11; count++) {
    let sum = 0;
    for (let i = 0; i < count; i++) sum += Number(cpf[i]) * (count + 1 - i);
    const digit = (sum * 10) % 11 % 10;
    if (digit !== Number(cpf[count])) return false;
  }
  return true;
}

export function routeUrls(destination: string, origin = "") {
  const target = encodeURIComponent(destination), source = encodeURIComponent(origin);
  return {
    google: `https://www.google.com/maps/dir/?api=1&destination=${target}${origin ? `&origin=${source}` : ""}`,
    apple: `https://maps.apple.com/?daddr=${target}${origin ? `&saddr=${source}` : ""}`,
    waze: `https://waze.com/ul?q=${target}&navigate=yes`,
  };
}

export function formatCpf(raw: string): string {
  const digits = (raw || "").replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export function formatPhone(raw: string): string {
  let digits = (raw || "").replace(/\D/g, "");
  // Se começou com 55 e tem mais de 11 dígitos, remove o DDI 55 do Brasil
  if (digits.startsWith("55") && digits.length > 11) {
    digits = digits.slice(2);
  }
  digits = digits.slice(0, 11);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export const TIME_SLOTS_15MIN: string[] = (() => {
  const slots: string[] = [];
  for (let h = 0; h < 24; h++) {
    const hh = String(h).padStart(2, "0");
    for (const m of [0, 15, 30, 45]) {
      const mm = String(m).padStart(2, "0");
      slots.push(`${hh}:${mm}`);
    }
  }
  return slots;
})();
