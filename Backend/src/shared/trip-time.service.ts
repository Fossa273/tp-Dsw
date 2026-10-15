export function computeArrival(departureMinutes: number, durationMinutes: number) {
  const totalMinutes = departureMinutes + durationMinutes;
  const minutesInDay = 24 * 60;
  const arrivalMinutes = ((totalMinutes % minutesInDay) + minutesInDay) % minutesInDay;
  return {
    arrivalTime: `${String(Math.floor(arrivalMinutes / 60)).padStart(2, '0')}:${String(arrivalMinutes % 60).padStart(2, '0')}`,
    arrivesNextDay: Math.floor(totalMinutes / minutesInDay) > 0,
  };
}

export function computeArrivalDate(
  departureDate: Date,
  durationMinutes: number
): Date {
  return new Date(departureDate.getTime() + durationMinutes * 60_000);
}
