export type GeocodeResult = {
  latitude: number | null;
  longitude: number | null;
  precision?: "address" | "street" | "approximate";
};

type AddressParams = {
  zipcode?: string | null;
  street?: string | null;
  number?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
};

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

async function tryNominatim(query: string, requireStreet: boolean): Promise<GeocodeResult> {
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
  const result = await tryNominatim(query, Boolean(street));
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
