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

export function formatDate(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
