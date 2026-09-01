import 'dotenv/config';
import { request } from 'node:https';

const API_KEY = process.env.GOOGLE_MAPS_API_KEY || '';

// Fixed average speed used to derive travel time from distance (km/h).
export const REFERENCE_SPEED_KMH = 90;

// Geocoding: given a locality name, returns the distinct Argentine provinces
// where Google Maps finds it.
//   - { status: 'not_found' }  : no results
//   - { status: 'ambiguous', provinces: [...] } : found in multiple provinces
//   - { status: 'ok', province: 'Buenos Aires' } : single province
export type GeocodeResult =
  | { status: 'not_found' }
  | { status: 'ambiguous'; provinces: string[] }
  | { status: 'ok'; province: string };

function httpsGetJson(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    request(url, { method: 'GET' }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch {
          reject(new Error('Respuesta invalida de Google Maps'));
        }
      });
    })
      .on('error', reject)
      .end();
  });
}

function isProvinceComponent(component: any): boolean {
  const types: string[] = Array.isArray(component?.types) ? component.types : [];
  return types.includes('administrative_area_level_1');
}

// Normalizes accents and case so "Córdoba" and "CORDOBA" compare equal.
function normalizeName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function getApiKeyConfigured(): boolean {
  return API_KEY.length > 0;
}

// Verifies in which province(s) Google Maps places a locality name.
export async function geocodeName(name: string): Promise<GeocodeResult> {
  if (!getApiKeyConfigured()) {
    throw new Error(
      'No se configuro la API key de Google Maps (GOOGLE_MAPS_API_KEY)'
    );
  }

  const address = encodeURIComponent(`${name}, Argentina`);
  const url =
    `https://maps.googleapis.com/maps/api/geocode/json?` +
    `address=${address}&components=country:AR&key=${API_KEY}`;

  const data = await httpsGetJson(url);
  if (data?.status !== 'OK' || !Array.isArray(data.results)) {
    return { status: 'not_found' };
  }

  const provinces = new Set<string>();
  for (const result of data.results) {
    const comp = (result?.address_components || []).find(isProvinceComponent);
    if (comp?.long_name) {
      provinces.add(comp.long_name);
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

// Road distance (km) between two localities using the Distance Matrix API.
export async function getDistanceKm(
  originLabel: string,
  destinationLabel: string
): Promise<number> {
  if (!getApiKeyConfigured()) {
    throw new Error(
      'No se configuro la API key de Google Maps (GOOGLE_MAPS_API_KEY)'
    );
  }

  const origins = encodeURIComponent(`${originLabel}`);
  const destinations = encodeURIComponent(`${destinationLabel}`);
  const url =
    `https://maps.googleapis.com/maps/api/distancematrix/json?` +
    `origins=${origins}&destinations=${destinations}&units=metric&key=${API_KEY}`;

  const data = await httpsGetJson(url);
  const element = data?.rows?.[0]?.elements?.[0];
  if (data?.status !== 'OK' || element?.status !== 'OK' || !element.distance) {
    throw new Error(
      'No se pudo calcular la distancia entre las localidades con Google Maps'
    );
  }

  // distance.value is in meters
  return Math.max(1, Math.round(element.distance.value / 1000));
}

// Travel time in minutes for a given distance at the reference speed.
export function durationFromDistance(distanceKm: number): number {
  return Math.max(1, Math.round((distanceKm / REFERENCE_SPEED_KMH) * 60));
}

// Normalized comparison helper exported so controllers can check whether the
// province resolved by Google matches the stored province name.
export { normalizeName };