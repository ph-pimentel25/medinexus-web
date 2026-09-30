export type GeocodeResult = {
  latitude: number | null;
  longitude: number | null;
  precision?: "address" | "street" | "approximate";
};

export type AddressParams = {
  zipcode?: string | null;
  street?: string | null;
  number?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
};

export function hasCoordinates(value: GeocodeResult) {
  return value.latitude !== null && value.longitude !== null && Number.isFinite(value.latitude) && Number.isFinite(value.longitude) && Math.abs(value.latitude) <= 90 && Math.abs(value.longitude) <= 180;
}

export function sameAddress(a: AddressParams, b: AddressParams) {
  return (["zipcode", "street", "number", "neighborhood", "city", "state"] as const).every(key => clean(a[key]).toLocaleLowerCase("pt-BR") === clean(b[key]).toLocaleLowerCase("pt-BR"));
}

// Saving contact/plan details must not replace a GPS fix with a street centroid.
export async function coordinatesForProfileSave(address: AddressParams, previous: AddressParams, saved: GeocodeResult, device: GeocodeResult): Promise<GeocodeResult> {
  if (hasCoordinates(device)) return device;
  if (sameAddress(address, previous) && hasCoordinates(saved)) return saved;
  if (!clean(address.street)) return { latitude: null, longitude: null };
  const result = await geocodeBrazilAddress(address);
  return result.precision === "approximate" ? { latitude: null, longitude: null } : result;
}

function clean(value?: string | null) {
  return String(value || "").trim();
}

function onlyDigits(value?: string | null) {
  return String(value || "").replace(/\D/g, "");
}

function buildQuery(parts: Array<string | null | undefined>) {
  return parts
    .map((item) => clean(item))
    .filter(Boolean)
    .join(", ");
}

async function tryNominatim(query: string, requireStreet: boolean, expected: AddressParams): Promise<GeocodeResult> {
  if (!query.trim()) {
    return {
      latitude: null,
      longitude: null,
    };
  }

  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");

    url.searchParams.set("format", "json");
    url.searchParams.set("q", query);
    url.searchParams.set("limit", "1");
    url.searchParams.set("countrycodes", "br");
    url.searchParams.set("addressdetails", "1");

    const response = await fetch(url.toString(), { signal: AbortSignal.timeout(8000) });

    if (!response.ok) {
      return {
        latitude: null,
        longitude: null,
      };
    }

    const data = await response.json();
    const first = Array.isArray(data) ? data[0] : null;

    const returnedState = first?.address?.["ISO3166-2-lvl4"]?.replace(/^BR-/, "");
    if ((returnedState && returnedState !== clean(expected.state).toUpperCase()) || (first?.address?.country_code && first.address.country_code !== "br") || (requireStreet && !first?.address?.road && !first?.address?.pedestrian && !first?.address?.street)) return { latitude: null, longitude: null };
    const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
    const cities = [first?.address?.city, first?.address?.town, first?.address?.municipality, first?.address?.village].filter(Boolean) as string[];
    if (cities.length && !cities.some(city => normalize(city) === normalize(clean(expected.city)))) return { latitude: null, longitude: null };
    if (expected.number && first?.address?.house_number && normalize(first.address.house_number) !== normalize(clean(expected.number))) return { latitude: null, longitude: null };

    if (!first?.lat || !first?.lon || !Number.isFinite(Number(first.lat)) || !Number.isFinite(Number(first.lon)) || Math.abs(Number(first.lat)) > 90 || Math.abs(Number(first.lon)) > 180 || (requireStreet && first.addresstype && ["city", "town", "village", "municipality", "state", "postcode", "suburb", "neighbourhood"].includes(first.addresstype))) {
      return {
        latitude: null,
        longitude: null,
      };
    }

    return {
      latitude: Number(first.lat),
      longitude: Number(first.lon),
      precision: first.address?.house_number ? "address" : first.address?.road ? "street" : "approximate",
    };
  } catch {
    return {
      latitude: null,
      longitude: null,
    };
  }
}

export async function geocodeBrazilAddress(
  params: AddressParams
): Promise<GeocodeResult> {
  const zipcode = onlyDigits(params.zipcode);
  const street = clean(params.street);
  const number = clean(params.number);
  const neighborhood = clean(params.neighborhood);
  const city = clean(params.city);
  const state = clean(params.state).toUpperCase();

  if (!city || !state) return { latitude: null, longitude: null };

  // One explicit lookup: never silently replace an unknown street with a city center.
  const query = buildQuery([street, number, neighborhood, city, state, zipcode, "Brasil"]);
  const result = await tryNominatim(query, Boolean(street), params);
  if (result.latitude !== null && result.longitude !== null) return result;

  return {
    latitude: null,
    longitude: null,
  };
}



// Refresh even an unchanged address to repair coordinates saved by older forms.
// A failed lookup may preserve coordinates only if the address did not change.
export async function refreshAddressCoordinates(
  address: AddressParams,
  previousAddress: AddressParams,
  previousCoordinates: GeocodeResult
): Promise<GeocodeResult> {
  const coordinates = await geocodeBrazilAddress(address);
  if (coordinates.latitude !== null && coordinates.longitude !== null) return coordinates;

  const fields: (keyof AddressParams)[] = ["zipcode", "street", "number", "neighborhood", "city", "state"];
  const unchanged = fields.every(field =>
    clean(address[field]).toLocaleLowerCase("pt-BR") === clean(previousAddress[field]).toLocaleLowerCase("pt-BR")
  );
  return unchanged ? previousCoordinates : { latitude: null, longitude: null };
}
