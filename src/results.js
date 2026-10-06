import { isValidCalendarDate, isValidCalendarMonth } from './date-utils.js';
import { calculateSaleTotals, getSaleValidationError } from './sales.js';
import { getExpenseValidationError } from './expenses.js';

function matchesPeriod(date, period, value) {
  return period === 'day' ? date === value : date.startsWith(`${value}-`);
}

export function calculateOperatingResults(sales, expenses, { period, value }) {
  if (!Array.isArray(sales) || !Array.isArray(expenses)) {
    return { error: 'Las ventas o los gastos no tienen un formato válido.' };
  }
  if (period !== 'day' && period !== 'month') {
    return { error: 'Selecciona un tipo de periodo válido.' };
  }
  const periodIsValid = period === 'day'
    ? isValidCalendarDate(value)
    : isValidCalendarMonth(value);
  if (!periodIsValid) {
    return { error: period === 'day' ? 'Selecciona un día válido.' : 'Selecciona un mes válido.' };
  }

  let revenue = 0;
  let productCost = 0;
  let operatingExpenses = 0;
  let saleCount = 0;
  let expenseCount = 0;

  for (const sale of sales) {
    const validationError = getSaleValidationError(sale);
    const totals = validationError ? null : calculateSaleTotals(sale);
    if (validationError || totals.error) {
      return { error: 'No se pueden calcular los resultados porque hay una venta inválida.' };
    }
    if (!matchesPeriod(sale.date, period, value)) continue;
    revenue += totals.revenue;
    productCost += totals.totalCost;
    saleCount += 1;
    if (![revenue, productCost].every(Number.isFinite)) {
      return { error: 'Los resultados del periodo son demasiado grandes para calcularlos.' };
    }
  }

  for (const expense of expenses) {
    if (getExpenseValidationError(expense)) {
      return { error: 'No se pueden calcular los resultados porque hay un gasto inválido.' };
    }
    if (!matchesPeriod(expense.date, period, value)) continue;
    operatingExpenses += expense.amount;
    expenseCount += 1;
    if (!Number.isFinite(operatingExpenses)) {
      return { error: 'Los resultados del periodo son demasiado grandes para calcularlos.' };
    }
  }

  const grossMargin = revenue - productCost;
  const operatingResult = grossMargin - operatingExpenses;
  if (![grossMargin, operatingResult].every(Number.isFinite)) {
    return { error: 'Los resultados del periodo son demasiado grandes para calcularlos.' };
  }

  return {
    revenue,
    productCost,
    grossMargin,
    operatingExpenses,
    operatingResult,
    saleCount,
    expenseCount,
  };
}
