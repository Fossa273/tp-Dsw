const FUEL_API_URL = 'https://naftas.com.ar/api/fuel?city=CAPITAL%20FEDERAL';
const CACHE_DURATION_MS = 5 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 10_000;

type FuelApiResponse = {
  'CAPITAL FEDERAL'?: {
    empresas?: {
      YPF?: {
        SUPER?: {
          precio?: number;
        };
      };
    };
  };
};

let cachedPrice: number | undefined;
let cachedAt = 0;
let pendingRequest: Promise<number> | undefined;

async function fetchYpfSuperPrice(): Promise<number> {
  const response = await fetch(FUEL_API_URL, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`La API de combustibles respondio con HTTP ${response.status}`);
  }

  const data = (await response.json()) as FuelApiResponse;
  const price = data?.['CAPITAL FEDERAL']?.empresas?.YPF?.SUPER?.precio;
  if (typeof price !== 'number' || !Number.isFinite(price) || price <= 0) {
    throw new Error('La API de combustibles no devolvio un precio valido para YPF SUPER');
  }

  return price;
}

export function getYpfSuperPricePerLiter(): Promise<number> {
  if (cachedPrice !== undefined && Date.now() - cachedAt < CACHE_DURATION_MS) {
    return Promise.resolve(cachedPrice);
  }
  if (pendingRequest) return pendingRequest;

  pendingRequest = fetchYpfSuperPrice()
    .then((price) => {
      cachedPrice = price;
      cachedAt = Date.now();
      return price;
    })
    .finally(() => {
      pendingRequest = undefined;
    });
  return pendingRequest;
}
