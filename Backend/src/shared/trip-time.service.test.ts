import { describe, expect, it } from 'vitest';
import { computeArrival, computeArrivalDate } from './trip-time.service.js';

describe('computeArrival', () => {
  it('calcula la hora de llegada dentro del mismo dia', () => {
    expect(computeArrival(8 * 60 + 30, 90)).toEqual({
      arrivalTime: '10:00',
      arrivesNextDay: false,
    });
  });

  it('indica cuando el viaje llega al dia siguiente', () => {
    expect(computeArrival(23 * 60 + 30, 90)).toEqual({
      arrivalTime: '01:00',
      arrivesNextDay: true,
    });
  });
});

describe('computeArrivalDate', () => {
  it('suma la duracion a la fecha de salida', () => {
    const departure = new Date('2026-11-22T23:30:00.000Z');

    expect(computeArrivalDate(departure, 90).toISOString()).toBe(
      '2026-11-23T01:00:00.000Z'
    );
  });
});
