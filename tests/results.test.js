import test from 'node:test';
import assert from 'node:assert/strict';
import { isValidCalendarMonth } from '../src/date-utils.js';
import { calculateOperatingResults } from '../src/results.js';

const sales = [
  { id: 'sale-1', date: '2026-12-31', productId: 'missing-product', units: 2, unitSalePrice: 5, unitCost: 1.25 },
  { id: 'sale-2', date: '2027-01-01', productId: 'product-2', units: 3, unitSalePrice: 4, unitCost: 1 },
  { id: 'sale-3', date: '2027-01-31', productId: 'product-3', units: 1, unitSalePrice: 2, unitCost: 3 },
  { id: 'sale-4', date: '2027-02-01', productId: 'product-4', units: 1, unitSalePrice: 20, unitCost: 5 },
];

const expenses = [
  { id: 'expense-1', date: '2026-12-31', category: 'Luz', description: 'Factura', amount: 3, type: 'variable' },
  { id: 'expense-2', date: '2027-01-01', category: 'Alquiler', description: 'Alquiler', amount: 5, type: 'fixed' },
  { id: 'expense-3', date: '2027-01-31', category: 'Limpieza', description: 'Material', amount: 2, type: 'variable' },
  { id: 'expense-4', date: '2027-02-01', category: 'Agua', description: 'Factura', amount: 4, type: 'variable' },
];

test('calcula un día combinando ventas históricas y gastos sin depender del producto', () => {
  assert.deepEqual(calculateOperatingResults(sales, expenses, { period: 'day', value: '2026-12-31' }), {
    revenue: 10,
    productCost: 2.5,
    grossMargin: 7.5,
    operatingExpenses: 3,
    fixedExpenses: 0,
    variableExpenses: 3,
    operatingResult: 4.5,
    saleCount: 1,
    expenseCount: 1,
  });
});

test('calcula ventas sin gastos y gastos sin ventas', () => {
  const salesOnly = calculateOperatingResults(sales, [], { period: 'day', value: '2027-02-01' });
  assert.equal(salesOnly.operatingResult, 15);
  assert.equal(salesOnly.operatingExpenses, 0);

  const expensesOnly = calculateOperatingResults([], expenses, { period: 'day', value: '2027-02-01' });
  assert.equal(expensesOnly.revenue, 0);
  assert.equal(expensesOnly.grossMargin, 0);
  assert.equal(expensesOnly.operatingResult, -4);
});

test('devuelve ceros para un periodo vacío', () => {
  const result = calculateOperatingResults(sales, expenses, { period: 'day', value: '2026-10-01' });
  assert.deepEqual(result, {
    revenue: 0,
    productCost: 0,
    grossMargin: 0,
    operatingExpenses: 0,
    fixedExpenses: 0,
    variableExpenses: 0,
    operatingResult: 0,
    saleCount: 0,
    expenseCount: 0,
  });
});

test('calcula un mes natural sin incluir los meses contiguos ni mezclar años', () => {
  const result = calculateOperatingResults(sales, expenses, { period: 'month', value: '2027-01' });
  assert.equal(result.revenue, 14);
  assert.equal(result.productCost, 6);
  assert.equal(result.grossMargin, 8);
  assert.equal(result.operatingExpenses, 7);
  assert.equal(result.fixedExpenses, 5);
  assert.equal(result.variableExpenses, 2);
  assert.equal(result.operatingResult, 1);
  assert.equal(result.saleCount, 2);
  assert.equal(result.expenseCount, 2);
});

test('permite margen bruto y resultado operativo negativos', () => {
  const grossLoss = calculateOperatingResults([sales[2]], [], { period: 'day', value: '2027-01-31' });
  assert.equal(grossLoss.grossMargin, -1);
  assert.equal(grossLoss.operatingResult, -1);

  const operatingLoss = calculateOperatingResults(
    [sales[1]],
    [{ ...expenses[1], amount: 15 }],
    { period: 'day', value: '2027-01-01' },
  );
  assert.equal(operatingLoss.grossMargin, 9);
  assert.equal(operatingLoss.operatingResult, -6);
});

test('valida meses naturales y rechaza periodos inválidos', () => {
  assert.equal(isValidCalendarMonth('2024-02'), true);
  assert.equal(isValidCalendarMonth('2024-00'), false);
  assert.equal(isValidCalendarMonth('2024-13'), false);
  assert.match(calculateOperatingResults([], [], { period: 'week', value: '2027-01' }).error, /tipo de periodo/);
  assert.match(calculateOperatingResults([], [], { period: 'month', value: '2027-13' }).error, /mes válido/);
});

test('rechaza registros inválidos y acumulaciones no finitas', () => {
  assert.match(calculateOperatingResults([{ ...sales[0], units: 0 }], [], { period: 'day', value: '2026-12-31' }).error, /venta inválida/);
  assert.match(calculateOperatingResults([], [{ ...expenses[0], amount: 0 }], { period: 'day', value: '2026-12-31' }).error, /gasto inválido/);

  const hugeSales = [
    { ...sales[0], id: 'huge-1', units: 1, unitSalePrice: Number.MAX_VALUE, unitCost: 0 },
    { ...sales[0], id: 'huge-2', units: 1, unitSalePrice: Number.MAX_VALUE, unitCost: 0 },
  ];
  assert.match(calculateOperatingResults(hugeSales, [], { period: 'day', value: '2026-12-31' }).error, /demasiado grandes/);
});
