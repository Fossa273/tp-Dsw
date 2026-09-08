import 'dotenv/config';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const OSRM_URL = 'https://router.project-osrm.org/route/v1/driving';
const USER_AGENT = process.env.OSM_USER_AGENT || 'tp-dsw-rutabus/1.0';
let lastNominatimRequestAt = 0;

// Fixed average speed used to derive travel time from distance (km/h).
export const REFERENCE_SPEED_KMH = 90;

// Geocoding: given a locality name, returns the distinct Argentine provinces
// where OpenStreetMap finds it through Nominatim.
//   - { status: 'not_found' }  : no results
//   - { status: 'ambiguous', provinces: [...] } : found in multiple provinces
//   - { status: 'ok', province: 'Buenos Aires' } : single province
export type GeocodeResult =
  | { status: 'not_found' }
  | { status: 'ambiguous'; provinces: string[] }
  | { status: 'ok'; province: string };

async function getJson(url: URL): Promise<any> {
  const response = await fetch(url, {
    headers: { Accept: 'application/json', 'User-Agent': USER_AGENT },
  });
  if (!response.ok) {
    throw new Error(`OpenStreetMap respondio con HTTP ${response.status}`);
  }
  return response.json();
}

async function getNominatimJson(url: URL): Promise<any> {
  const waitMs = Math.max(0, 1000 - (Date.now() - lastNominatimRequestAt));
  if (waitMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }
  lastNominatimRequestAt = Date.now();
  return getJson(url);
}

// Normalizes accents and case so "Córdoba" and "CORDOBA" compare equal.
function normalizeName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

// Verifies in which province(s) OpenStreetMap places a locality name.
export async function geocodeName(name: string): Promise<GeocodeResult> {
  const url = new URL(NOMINATIM_URL);
  url.searchParams.set('q', `${name}, Argentina`);
  url.searchParams.set('countrycodes', 'ar');
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('limit', '10');

  const results = await getNominatimJson(url);
  if (!Array.isArray(results) || results.length === 0) {
    return { status: 'not_found' };
  }

  const provinces = new Set<string>();
  for (const result of results) {
    const province = result?.address?.state;
    if (typeof province === 'string' && province.trim()) {
      provinces.add(province.trim());
    }
  }

  if (provinces.size === 0) {
    return { status: 'not_found' };
  }
  const list = [...provinces];
  if (list.length === 1) {
    return { status: 'ok', province: list[0] };
  }
  return { status: 'ambiguous', provinces: list };
}

// Road distance (km) between two localities using OSRM and Nominatim.
export async function getDistanceKm(
  originLabel: string,
  destinationLabel: string
): Promise<number> {
  const origin = await geocodeCoordinates(originLabel);
  const destination = await geocodeCoordinates(destinationLabel);
  const routeUrl = new URL(`${OSRM_URL}/${origin.lon},${origin.lat};${destination.lon},${destination.lat}`);
  routeUrl.searchParams.set('overview', 'false');
  const data = await getJson(routeUrl);
  const distance = data?.routes?.[0]?.distance;
  if (data?.code !== 'Ok' || typeof distance !== 'number') {
    throw new Error('OpenStreetMap no pudo calcular la distancia entre las localidades');
  }

  return Math.max(1, Math.round(distance / 1000));
}

async function geocodeCoordinates(label: string): Promise<{ lat: string; lon: string }> {
  const url = new URL(NOMINATIM_URL);
  url.searchParams.set('q', label);
  url.searchParams.set('countrycodes', 'ar');
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('limit', '1');
  const results = await getNominatimJson(url);
  const result = results?.[0];
  if (!result?.lat || !result?.lon) {
    throw new Error(`OpenStreetMap no encontro la localidad "${label}"`);
  }
  return { lat: result.lat, lon: result.lon };
}

// Travel time in minutes for a given distance at the reference speed.
export function durationFromDistance(distanceKm: number): number {
  return Math.max(1, Math.round((distanceKm / REFERENCE_SPEED_KMH) * 60));
}

// Normalized comparison helper exported so controllers can check whether the
// province resolved by OpenStreetMap matches the stored province name.
export { normalizeName };