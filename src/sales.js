import { getLocalDateString, isValidCalendarDate } from './date-utils.js';

export { getLocalDateString, isValidCalendarDate } from './date-utils.js';

export function getSaleValidationError(sale, { today = null } = {}) {
  if (!sale || typeof sale !== 'object' || Array.isArray(sale)) return 'La venta no es válida.';
  if (typeof sale.id !== 'string' || !sale.id.trim()) return 'La venta no tiene un identificador válido.';
  if (!isValidCalendarDate(sale.date)) return 'Selecciona una fecha válida.';
  if (today !== null && sale.date > today) return 'No puedes registrar una venta con fecha futura.';
  if (typeof sale.productId !== 'string' || !sale.productId.trim()) return 'Selecciona un producto válido.';
  if (!Number.isSafeInteger(sale.units) || sale.units <= 0) return 'Las unidades vendidas deben ser un número entero mayor que cero.';
  if (!Number.isFinite(sale.unitSalePrice) || sale.unitSalePrice <= 0) return 'El precio histórico debe ser un importe válido mayor que cero.';
  if (!Number.isFinite(sale.unitCost) || sale.unitCost < 0) return 'El coste histórico debe ser un importe válido igual o mayor que cero.';
  return null;
}

export function calculateSaleTotals(sale) {
  const error = getSaleValidationError(sale);
  if (error) return { error };

  const revenue = sale.unitSalePrice * sale.units;
  const totalCost = sale.unitCost * sale.units;
  const grossMargin = (sale.unitSalePrice - sale.unitCost) * sale.units;
  if (![revenue, totalCost, grossMargin].every(Number.isFinite)) {
    return { error: 'Los valores de la venta son demasiado grandes para calcularlos.' };
  }
  return { revenue, totalCost, grossMargin };
}

export function summarizeSalesByDate(sales, date) {
  const records = sales.filter((sale) => sale.date === date);
  let units = 0;
  let revenue = 0;
  let totalCost = 0;
  let grossMargin = 0;

  for (const sale of records) {
    const totals = calculateSaleTotals(sale);
    if (totals.error) return { error: totals.error, records: [] };
    units += sale.units;
    revenue += totals.revenue;
    totalCost += totals.totalCost;
    grossMargin += totals.grossMargin;
  }
  if (!Number.isSafeInteger(units) || ![revenue, totalCost, grossMargin].every(Number.isFinite)) {
    return { error: 'El resumen diario es demasiado grande para calcularlo.', records: [] };
  }
  return { records, units, revenue, totalCost, grossMargin };
}
