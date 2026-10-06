import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getExpenseValidationError,
  sortExpenses,
  summarizeExpensesByDate,
} from '../src/expenses.js';

const expense = {
  id: 'expense-1',
  date: '2026-10-05',
  category: 'Alquiler',
  description: 'Alquiler del local',
  amount: 850.125,
  type: 'fixed',
};

test('valida un gasto real sin redondear su importe', () => {
  assert.equal(getExpenseValidationError(expense, { today: '2026-10-05' }), null);
  assert.equal(expense.amount, 850.125);
});

test('rechaza fechas inválidas o futuras, textos vacíos, importes y tipos inválidos', () => {
  assert.match(getExpenseValidationError({ ...expense, date: '2026-02-30' }), /fecha válida/);
  assert.match(getExpenseValidationError(expense, { today: '2026-10-04' }), /futura/);
  assert.match(getExpenseValidationError({ ...expense, category: '  ' }), /categoría/);
  assert.match(getExpenseValidationError({ ...expense, description: '' }), /concepto/);
  assert.match(getExpenseValidationError({ ...expense, amount: 0 }), /mayor que cero/);
  assert.match(getExpenseValidationError({ ...expense, amount: Number.POSITIVE_INFINITY }), /mayor que cero/);
  assert.match(getExpenseValidationError({ ...expense, type: 'monthly' }), /fijo o variable/);
});

test('resume solo los gastos de la fecha sin redondear', () => {
  const result = summarizeExpensesByDate([
    expense,
    { ...expense, id: 'expense-2', amount: 10.375, type: 'variable' },
    { ...expense, id: 'expense-3', date: '2026-10-04', amount: 20 },
  ], '2026-10-05');
  assert.equal(result.count, 2);
  assert.equal(result.totalAmount, 860.5);
  assert.equal(result.records.length, 2);
});

test('detecta un total diario no finito', () => {
  const first = { ...expense, amount: Number.MAX_VALUE };
  const second = { ...expense, id: 'expense-2', amount: Number.MAX_VALUE };
  assert.match(summarizeExpensesByDate([first, second], expense.date).error, /demasiado grande/);
});

test('ordena sin modificar la colección original', () => {
  const records = [
    { ...expense, id: 'b', category: 'Luz', description: 'Factura', amount: 20, type: 'variable' },
    { ...expense, id: 'a', category: 'Agua', description: 'Recibo', amount: 50, type: 'fixed' },
  ];
  assert.deepEqual(sortExpenses(records).map((item) => item.id), ['a', 'b']);
  assert.deepEqual(sortExpenses(records, { sortBy: 'category', direction: 'asc' }).map((item) => item.id), ['a', 'b']);
  assert.deepEqual(sortExpenses(records, { sortBy: 'type', direction: 'asc' }).map((item) => item.id), ['a', 'b']);
  assert.deepEqual(records.map((item) => item.id), ['b', 'a']);
});
