export const ADMIN_EMAIL = 'admin@rutabus.com';

export const VALID_STATES = ['pending', 'confirmed', 'cancelled'] as const;

export const FUEL_PRICE_PER_KM = Number(process.env.FUEL_PRICE_PER_KM ?? 100);
export const OPERATING_COST_MULTIPLIER = 1.4;
export const MAX_BOOKING_ADVANCE_MONTHS = 1;

export const PORT = Number(process.env.PORT ?? 3000);
