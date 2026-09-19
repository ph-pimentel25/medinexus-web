export type ParsedAddress = { street: string; number: string; neighborhood: string; city: string; state: string; postalCode: string; formatted: string };
export const BRAZIL_STATES: Record<string, string> = {
  Acre: "AC", Alagoas: "AL", Amapá: "AP", Amazonas: "AM", Bahia: "BA", Ceará: "CE", "Distrito Federal": "DF", "Espírito Santo": "ES", Goiás: "GO", Maranhão: "MA", "Mato Grosso": "MT", "Mato Grosso do Sul": "MS", "Minas Gerais": "MG", Pará: "PA", Paraíba: "PB", Paraná: "PR", Pernambuco: "PE", Piauí: "PI", "Rio de Janeiro": "RJ", "Rio Grande do Norte": "RN", "Rio Grande do Sul": "RS", Rondônia: "RO", Roraima: "RR", "Santa Catarina": "SC", "São Paulo": "SP", Sergipe: "SE", Tocantins: "TO",
};
export function parseBrazilAddress(data: { address?: Record<string,string>; display_name?: string }): ParsedAddress {
  const a = data.address || {};
  if (a.country_code && a.country_code !== "br") throw new Error("Selecione um endereço no Brasil.");
  const iso = a["ISO3166-2-lvl4"] || a.state_code || "";
  const candidate = iso.replace(/^BR-/, "").toUpperCase();
  const state = Object.values(BRAZIL_STATES).includes(candidate) ? candidate : BRAZIL_STATES[a.state] || "";
  return { street: a.road || a.street || a.pedestrian || "", number: a.house_number || "", neighborhood: a.suburb || a.neighbourhood || a.city_district || a.quarter || "", city: a.city || a.town || a.municipality || a.village || "", state, postalCode: (a.postcode || "").replace(/\D/g, ""), formatted: data.display_name || "" };
}
export async function reverseGeocode(lat: number, lon: number): Promise<ParsedAddress> {
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat)>90 || Math.abs(lon)>180) throw new Error("Coordenadas inválidas.");
  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&addressdetails=1&accept-language=pt-BR&zoom=18`, { signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error("Não foi possível identificar o endereço. Você pode preenchê-lo manualmente.");
  return parseBrazilAddress(await response.json());
}
export async function lookupZipcode(zip: string) {
  const digits = zip.replace(/\D/g, "");
  if (digits.length !== 8) throw new Error("Informe os 8 dígitos do CEP.");
  const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`, { signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error("Consulta de CEP indisponível.");
  const data = await response.json();
  if (data.erro) throw new Error("CEP não encontrado. Confira o número ou preencha manualmente.");
  return { street: String(data.logradouro || ""), neighborhood: String(data.bairro || ""), city: String(data.localidade || ""), state: String(data.uf || ""), zipcode: digits };
}
