export type ParsedAddress = {
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  postalCode: string;
  formatted: string;
};

export async function reverseGeocode(lat: number, lon: number): Promise<ParsedAddress> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`;

  const response = await fetch(url, {
    headers: {
      "Accept-Language": "pt-BR,pt;q=0.9",
      "User-Agent": "MediNexus-HealthPlatform/1.0",
    },
  });

  if (!response.ok) {
    throw new Error("Não foi possível resolver o endereço via GPS.");
  }

  const data = await response.json();
  const addr = data.address || {};

  // Mapeamento resiliente para o formato de endereços no Brasil
  const street = addr.road || addr.street || "";
  const neighborhood = addr.suburb || addr.neighbourhood || addr.city_district || addr.quarter || "";
  const city = addr.city || addr.town || addr.municipality || addr.village || addr.county || "";
  const state = addr.state_code || (addr.state ? getUFCode(addr.state) : "");
  const postalCode = addr.postcode ? addr.postcode.replace(/\D/g, "") : "";

  return {
    street,
    neighborhood,
    city,
    state,
    postalCode,
    formatted: data.display_name || "",
  };
}

function getUFCode(stateName: string): string {
  const ufs: Record<string, string> = {
    "Rio de Janeiro": "RJ",
    "São Paulo": "SP",
    "Minas Gerais": "MG",
    "Espírito Santo": "ES",
    "Bahia": "BA",
    "Paraná": "PR",
    "Santa Catarina": "SC",
    "Rio Grande do Sul": "RS",
  };
  return ufs[stateName] || stateName.substring(0, 2).toUpperCase();
}