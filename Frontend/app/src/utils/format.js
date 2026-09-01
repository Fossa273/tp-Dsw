const DAY_NAMES = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miercoles',
  'Jueves',
  'Viernes',
  'Sabado',
];

export function dayOfWeekName(day) {
  return DAY_NAMES[day] ?? '-';
}

export function localityLabel(locality) {
  if (!locality) return '-';
  const name = locality.name ?? '';
  const abbr = locality.province?.abbreviation;
  return abbr ? `${name} (${abbr})` : name;
}
