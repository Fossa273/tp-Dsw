export function calculateFuelCost(
  distanceKm: number,
  litrosPorKm: number,
  pricePerLiter: number
): number {
  return distanceKm * litrosPorKm * pricePerLiter;
}
