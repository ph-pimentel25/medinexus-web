export type GeocodeResult = {
  latitude: number | null;
  longitude: number | null;
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

async function tryNominatim(query: string): Promise<GeocodeResult> {
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

    const response = await fetch(url.toString());

    if (!response.ok) {
      return {
        latitude: null,
        longitude: null,
      };
    }

    const data = await response.json();
    const first = Array.isArray(data) ? data[0] : null;

    if (!first?.lat || !first?.lon) {
      return {
        latitude: null,
        longitude: null,
      };
    }

    return {
      latitude: Number(first.lat),
      longitude: Number(first.lon),
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

  const attempts = [
    buildQuery([street, number, neighborhood, city, state, zipcode, "Brasil"]),
    buildQuery([street, neighborhood, city, state, zipcode, "Brasil"]),
    buildQuery([street, city, state, "Brasil"]),
    buildQuery([zipcode, city, state, "Brasil"]),
    buildQuery([neighborhood, city, state, "Brasil"]),
    buildQuery([city, state, "Brasil"]),
  ].filter(Boolean);

  const uniqueAttempts = Array.from(new Set(attempts));

  for (const query of uniqueAttempts) {
    const result = await tryNominatim(query);

    if (result.latitude !== null && result.longitude !== null) {
      return result;
    }
  }

  return {
    latitude: null,
    longitude: null,
  };
}