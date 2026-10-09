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
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return `${day}/${month}/${d.getFullYear()} ${time}`;
}

export function formatDateOnly(value) {
  if (!value) return '-';
  const d = new Date(`${value}T12:00:00`);
  if (Number.isNaN(d.getTime())) return '-';
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}
