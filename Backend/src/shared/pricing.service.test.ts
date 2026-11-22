import { describe, expect, it } from 'vitest';
import { calculateFuelCost } from './pricing.service.js';

describe('calculateFuelCost', () => {
  it('calcula el costo total segun distancia, consumo y precio', () => {
    expect(calculateFuelCost(300, 0.25, 1200)).toBe(90000);
  });

  it('devuelve cero cuando no hay distancia o consumo', () => {
    expect(calculateFuelCost(0, 0.25, 1200)).toBe(0);
    expect(calculateFuelCost(300, 0, 1200)).toBe(0);
  });
});
