import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateSaleTotals,
  getSaleValidationError,
  isValidCalendarDate,
  summarizeSalesByDate,
} from '../src/sales.js';

const sale = {
  id: 'sale-1',
  date: '2026-10-05',
  productId: 'product-1',
  units: 3,
  unitSalePrice: 5,
  unitCost: 1.25,
};

test('calcula ingresos, coste y margen histórico sin redondear', () => {
  assert.deepEqual(calculateSaleTotals(sale), {
    revenue: 15,
    totalCost: 3.75,
    grossMargin: 11.25,
  });
});

test('permite coste cero y margen negativo', () => {
  assert.equal(calculateSaleTotals({ ...sale, unitCost: 0 }).grossMargin, 15);
  assert.equal(calculateSaleTotals({ ...sale, unitCost: 6 }).grossMargin, -3);
});

test('resume varias ventas independientes del mismo producto y día', () => {
  const result = summarizeSalesByDate([
    sale,
    { ...sale, id: 'sale-2', units: 2, unitSalePrice: 6, unitCost: 2 },
    { ...sale, id: 'sale-3', date: '2026-10-04', units: 10 },
  ], '2026-10-05');
  assert.equal(result.records.length, 2);
  assert.equal(result.units, 5);
  assert.equal(result.revenue, 27);
  assert.equal(result.totalCost, 7.75);
  assert.equal(result.grossMargin, 19.25);
});

test('valida fechas civiles y rechaza fechas futuras', () => {
  assert.equal(isValidCalendarDate('2024-02-29'), true);
  assert.equal(isValidCalendarDate('2025-02-29'), false);
  assert.match(getSaleValidationError(sale, { today: '2026-10-04' }), /futura/);
});

test('rechaza unidades no enteras, cero e importes históricos inválidos', () => {
  assert.match(getSaleValidationError({ ...sale, units: 1.5 }), /entero/);
  assert.match(getSaleValidationError({ ...sale, units: 0 }), /entero/);
  assert.match(getSaleValidationError({ ...sale, unitSalePrice: 0 }), /precio histórico/);
  assert.match(getSaleValidationError({ ...sale, unitCost: -1 }), /coste histórico/);
});
