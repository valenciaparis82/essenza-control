import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateMonthlyBreakEven } from '../src/break-even.js';

function sale(id, date, revenue, cost) {
  return {
    id,
    date,
    productId: `product-${id}`,
    units: 1,
    unitSalePrice: revenue,
    unitCost: cost,
  };
}

function expense(id, date, amount, type) {
  return {
    id,
    date,
    category: type === 'fixed' ? 'Alquiler' : 'Comisiones',
    description: `Gasto ${id}`,
    amount,
    type,
  };
}

test('calcula el ejemplo de referencia sin redondear valores intermedios', () => {
  const result = calculateMonthlyBreakEven(
    [sale('sale-1', '2026-10-05', 2500, 750)],
    [
      expense('expense-1', '2026-10-05', 125, 'variable'),
      expense('expense-2', '2026-10-05', 2000, 'fixed'),
    ],
    '2026-10',
  );

  assert.equal(result.revenue, 2500);
  assert.equal(result.productCost, 750);
  assert.equal(result.variableExpenses, 125);
  assert.equal(result.contributionMargin, 1625);
  assert.equal(result.contributionMarginPercent, 65);
  assert.equal(result.fixedExpenses, 2000);
  assert.equal(result.breakEvenRevenue, 2000 / 0.65);
  assert.equal(result.difference, 2500 - (2000 / 0.65));
  assert.ok(Math.abs(result.attainmentPercent - 81.25) < Number.EPSILON * 100);
  assert.equal(result.status, 'below');
});

test('usa meses naturales y no mezcla años ni meses contiguos', () => {
  const result = calculateMonthlyBreakEven(
    [
      sale('dec', '2026-12-31', 100, 20),
      sale('jan', '2027-01-01', 200, 50),
      sale('feb', '2027-02-01', 300, 60),
    ],
    [
      expense('dec', '2026-12-31', 10, 'fixed'),
      expense('jan-fixed', '2027-01-31', 75, 'fixed'),
      expense('jan-variable', '2027-01-01', 25, 'variable'),
      expense('feb', '2027-02-01', 20, 'variable'),
    ],
    '2027-01',
  );

  assert.equal(result.revenue, 200);
  assert.equal(result.productCost, 50);
  assert.equal(result.variableExpenses, 25);
  assert.equal(result.fixedExpenses, 75);
});

test('usa importes históricos aunque la referencia del producto no exista', () => {
  const historicalSale = sale('missing', '2026-10-05', 10, 4);
  historicalSale.productId = 'producto-eliminado';
  const result = calculateMonthlyBreakEven(
    [historicalSale],
    [expense('fixed', '2026-10-05', 3, 'fixed')],
    '2026-10',
  );

  assert.equal(result.revenue, 10);
  assert.equal(result.productCost, 4);
  assert.equal(result.breakEvenRevenue, 5);
  assert.equal(result.status, 'exceeded');
});

test('distingue equilibrio no alcanzado, exacto y superado', () => {
  const fixed = [expense('fixed', '2026-10-05', 50, 'fixed')];
  const below = calculateMonthlyBreakEven([sale('below', '2026-10-05', 80, 40)], fixed, '2026-10');
  const reached = calculateMonthlyBreakEven([sale('reached', '2026-10-05', 100, 50)], fixed, '2026-10');
  const exceeded = calculateMonthlyBreakEven([sale('over', '2026-10-05', 120, 60)], fixed, '2026-10');

  assert.equal(below.status, 'below');
  assert.equal(below.difference, -20);
  assert.equal(reached.status, 'reached');
  assert.equal(reached.difference, 0);
  assert.equal(reached.attainmentPercent, 100);
  assert.equal(exceeded.status, 'exceeded');
  assert.equal(exceeded.difference, 20);
});

test('trata por separado contribuciones positivas, cero y negativas', () => {
  const positive = calculateMonthlyBreakEven(
    [sale('positive', '2026-10-05', 100, 60)],
    [expense('variable', '2026-10-05', 10, 'variable')],
    '2026-10',
  );
  const zero = calculateMonthlyBreakEven(
    [sale('zero', '2026-10-05', 100, 60)],
    [expense('variable', '2026-10-05', 40, 'variable')],
    '2026-10',
  );
  const negative = calculateMonthlyBreakEven(
    [sale('negative', '2026-10-05', 100, 90)],
    [expense('variable', '2026-10-05', 20, 'variable')],
    '2026-10',
  );

  assert.equal(positive.contributionMarginPercent, 30);
  assert.equal(positive.breakEvenRevenue, 0);
  assert.equal(positive.attainmentPercent, null);
  assert.equal(zero.reason, 'non-positive-contribution');
  assert.equal(zero.breakEvenRevenue, null);
  assert.equal(negative.reason, 'negative-contribution');
  assert.equal(negative.breakEvenRevenue, null);
});

test('trata meses vacíos, solo con gastos y sin gastos fijos', () => {
  const empty = calculateMonthlyBreakEven([], [], '2026-10');
  const expensesOnly = calculateMonthlyBreakEven(
    [],
    [
      expense('fixed', '2026-10-05', 100, 'fixed'),
      expense('variable', '2026-10-05', 20, 'variable'),
    ],
    '2026-10',
  );
  const noFixedExpenses = calculateMonthlyBreakEven(
    [sale('sale', '2026-10-05', 100, 25)],
    [expense('variable', '2026-10-05', 5, 'variable')],
    '2026-10',
  );

  assert.equal(empty.reason, 'no-revenue');
  assert.equal(empty.fixedExpenses, 0);
  assert.equal(expensesOnly.reason, 'no-revenue');
  assert.equal(expensesOnly.fixedExpenses, 100);
  assert.equal(expensesOnly.variableExpenses, 20);
  assert.equal(noFixedExpenses.breakEvenRevenue, 0);
  assert.equal(noFixedExpenses.status, 'exceeded');
  assert.equal(noFixedExpenses.attainmentPercent, null);
});

test('rechaza meses, colecciones, registros y acumulaciones inválidos', () => {
  assert.match(calculateMonthlyBreakEven([], [], '2026-13').error, /mes válido/);
  assert.match(calculateMonthlyBreakEven(null, [], '2026-10').error, /formato válido/);
  assert.match(
    calculateMonthlyBreakEven([{ ...sale('bad', '2026-10-05', 10, 2), units: 0 }], [], '2026-10').error,
    /venta inválida/,
  );
  assert.match(
    calculateMonthlyBreakEven([], [{ ...expense('bad', '2026-10-05', 2, 'fixed'), type: 'monthly' }], '2026-10').error,
    /gasto inválido/,
  );
  assert.match(
    calculateMonthlyBreakEven([
      sale('huge-1', '2026-10-05', Number.MAX_VALUE, 0),
      sale('huge-2', '2026-10-05', Number.MAX_VALUE, 0),
    ], [], '2026-10').error,
    /demasiado grandes/,
  );
});

test('no modifica las colecciones recibidas', () => {
  const sales = [sale('sale', '2026-10-05', 100, 25)];
  const expenses = [expense('fixed', '2026-10-05', 25, 'fixed')];
  const snapshot = JSON.stringify({ sales, expenses });
  calculateMonthlyBreakEven(sales, expenses, '2026-10');
  assert.equal(JSON.stringify({ sales, expenses }), snapshot);
});
