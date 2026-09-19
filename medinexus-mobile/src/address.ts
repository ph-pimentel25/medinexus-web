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
