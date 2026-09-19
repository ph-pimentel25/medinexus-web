export function directionsLinks(destination: string, origin = "") {
  const google = new URL("https://www.google.com/maps/dir/");
  google.searchParams.set("api", "1"); google.searchParams.set("destination", destination); google.searchParams.set("travelmode", "driving");
  if (origin) google.searchParams.set("origin", origin);
  const apple = new URL("https://maps.apple.com/"); apple.searchParams.set("daddr", destination); apple.searchParams.set("dirflg", "d");
  if (origin) apple.searchParams.set("saddr", origin);
  const waze = new URL("https://waze.com/ul"); waze.searchParams.set("q", destination); waze.searchParams.set("navigate", "yes");
  return { google: google.toString(), apple: apple.toString(), waze: waze.toString() };
}
export function addressText(row: Record<string, unknown> | null) {
  if (!row) return "";
  return [row.address_street, row.address_number, row.address_neighborhood, row.address_city || row.city, row.address_state || row.state, row.address_zipcode].filter(Boolean).join(", ");
}
