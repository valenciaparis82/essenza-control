import { isValidCalendarDate } from './date-utils.js';

export const EXPENSE_TYPES = Object.freeze(['fixed', 'variable']);

export const SUGGESTED_EXPENSE_CATEGORIES = Object.freeze([
  'Alquiler',
  'Luz',
  'Agua',
  'Gestoría',
  'Seguridad Social / autónomos',
  'Comisiones',
  'Mantenimiento',
  'Compras generales (no ingredientes de recetas)',
  'Limpieza',
  'Marketing',
  'Otros',
]);

const expenseTypeSet = new Set(EXPENSE_TYPES);
const textCollator = new Intl.Collator('es-ES', { sensitivity: 'base', numeric: true });

export function getExpenseValidationError(expense, { today = null } = {}) {
  if (!expense || typeof expense !== 'object' || Array.isArray(expense)) return 'El gasto no es válido.';
  if (typeof expense.id !== 'string' || !expense.id.trim()) return 'El gasto no tiene un identificador válido.';
  if (!isValidCalendarDate(expense.date)) return 'Selecciona una fecha válida.';
  if (today !== null && expense.date > today) return 'No puedes registrar un gasto con fecha futura.';
  if (typeof expense.category !== 'string' || !expense.category.trim()) return 'Introduce una categoría.';
  if (typeof expense.description !== 'string' || !expense.description.trim()) return 'Introduce un concepto o descripción.';
  if (!Number.isFinite(expense.amount) || expense.amount <= 0) return 'El importe debe ser un número válido mayor que cero.';
  if (!expenseTypeSet.has(expense.type)) return 'Selecciona si el gasto es fijo o variable.';
  return null;
}

export function summarizeExpensesByDate(expenses, date) {
  if (!Array.isArray(expenses) || !isValidCalendarDate(date)) {
    return { error: 'No se puede preparar el resumen para esta fecha.', records: [] };
  }
  const records = expenses.filter((expense) => expense.date === date);
  let totalAmount = 0;
  for (const expense of records) {
    const error = getExpenseValidationError(expense);
    if (error) return { error, records: [] };
    totalAmount += expense.amount;
  }
  if (!Number.isFinite(totalAmount)) {
    return { error: 'El total diario es demasiado grande para calcularlo.', records: [] };
  }
  return { records, count: records.length, totalAmount };
}

export function sortExpenses(expenses, { sortBy = 'amount', direction = 'desc' } = {}) {
  const validSorts = new Set(['amount', 'category', 'description', 'type']);
  if (!Array.isArray(expenses) || !validSorts.has(sortBy) || !['asc', 'desc'].includes(direction)) {
    throw new Error('La ordenación de gastos no es válida.');
  }
  const typeOrder = { fixed: 0, variable: 1 };
  const factor = direction === 'asc' ? 1 : -1;
  return [...expenses].sort((first, second) => {
    let comparison;
    if (sortBy === 'amount') comparison = first.amount - second.amount;
    else if (sortBy === 'type') comparison = typeOrder[first.type] - typeOrder[second.type];
    else comparison = textCollator.compare(first[sortBy], second[sortBy]);
    if (comparison !== 0) return comparison * factor;
    const categoryComparison = textCollator.compare(first.category, second.category);
    if (categoryComparison !== 0) return categoryComparison;
    const descriptionComparison = textCollator.compare(first.description, second.description);
    if (descriptionComparison !== 0) return descriptionComparison;
    return textCollator.compare(first.id, second.id);
  });
}
