export function getLocalDateString(date = new Date()) {
  // No usamos toISOString porque trabaja en UTC y, cerca de medianoche,
  // podría devolver un día distinto al que ve la persona en su zona horaria.
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isValidCalendarDate(value) {
  // El formato por sí solo no basta: 2026-02-31 tiene la forma correcta,
  // pero no existe. UTC evita que el huso horario altere esta comprobación.
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

export function isValidCalendarMonth(value) {
  // Esta validación se usa en consultas mensuales, donde no hace falta día.
  if (typeof value !== 'string' || !/^\d{4}-\d{2}$/.test(value)) return false;
  const [year, month] = value.split('-').map(Number);
  return Number.isInteger(year) && year >= 1 && month >= 1 && month <= 12;
}
