import test from 'node:test';
import assert from 'node:assert/strict';
import { createDashboardSummary } from '../src/dashboard.js';

const ingredients = [{ id: 'ingredient', name: 'Base', price: 1, quantity: 1, unit: 'unit' }];
const products = [
  { id: 'a', name: 'Alfa', category: 'Tapas', salePrice: 4, recipe: [{ ingredientId: 'ingredient', quantity: 1 }] },
  { id: 'b', name: 'Beta', category: 'Tapas', salePrice: 2, recipe: [{ ingredientId: 'ingredient', quantity: 1 }] },
  { id: 'archived', name: 'Archivo', category: 'Tapas', salePrice: 10, recipe: [{ ingredientId: 'ingredient', quantity: 1 }], archived: true },
];

function sale(id, date, productId, units, price = 4, cost = 1) {
  return { id, date, productId, units, unitSalePrice: price, unitCost: cost };
}

function expense(id, date, amount, type = 'fixed') {
  return { id, date, category: 'Otros', description: id, amount, type };
}

test('compone hoy, mes natural y equilibrio reutilizando los resultados históricos', () => {
  const summary = createDashboardSummary({
    ingredients,
    products,
    sales: [sale('today', '2026-10-07', 'a', 2), sale('other-month', '2026-09-30', 'a', 1)],
    expenses: [expense('fixed', '2026-10-07', 2), expense('variable', '2026-10-07', 1, 'variable')],
    today: '2026-10-07',
  });

  assert.equal(summary.todayResults.revenue, 8);
  assert.equal(summary.monthResults.productCost, 2);
  assert.equal(summary.monthResults.operatingResult, 3);
  assert.equal(summary.breakEven.breakEvenRevenue, 3.2);
  assert.equal(summary.breakEven.status, 'exceeded');
});

test('selecciona indicadores actuales solo entre productos activos y calculables', () => {
  const summary = createDashboardSummary({
    ingredients,
    products: [...products, { id: 'missing', name: 'No calculable', category: 'Tapas', salePrice: 8, recipe: [{ ingredientId: 'missing', quantity: 1 }] }],
    sales: [], expenses: [], today: '2026-10-07',
  });

  assert.equal(summary.currentProducts.activeCalculableCount, 2);
  assert.equal(summary.currentProducts.bestMarginPercent.product.id, 'a');
  assert.equal(summary.currentProducts.highestFoodCost.product.id, 'b');
  assert.equal(summary.currentProducts.highestMarginAmount.product.id, 'a');
});

test('obtiene el producto más vendido histórico, incluso archivado o inexistente', () => {
  const archived = createDashboardSummary({
    ingredients, products,
    sales: [sale('one', '2026-10-01', 'archived', 5), sale('two', '2026-10-02', 'a', 3)],
    expenses: [], today: '2026-10-07',
  });
  assert.equal(archived.mostSoldProduct.name, 'Archivo');
  assert.equal(archived.mostSoldProduct.archived, true);

  const missing = createDashboardSummary({
    ingredients, products,
    sales: [sale('missing', '2026-10-01', 'gone', 5)], expenses: [], today: '2026-10-07',
  });
  assert.equal(missing.mostSoldProduct.name, 'Producto no disponible');
  assert.equal(missing.mostSoldProduct.missing, true);
});

test('desempata producto más vendido por nombre y después por ID', () => {
  const summary = createDashboardSummary({
    ingredients, products,
    sales: [sale('one', '2026-10-01', 'b', 2), sale('two', '2026-10-01', 'a', 2)],
    expenses: [], today: '2026-10-07',
  });
  assert.equal(summary.mostSoldProduct.id, 'a');
});

test('no ofrece valores parciales ante datos históricos inválidos', () => {
  const summary = createDashboardSummary({
    ingredients, products,
    sales: [{ ...sale('bad', '2026-10-07', 'a', 0) }], expenses: [], today: '2026-10-07',
  });
  assert.match(summary.error, /venta inválida/);
});

test('conserva resultados operativos positivos, cero y negativos', () => {
  const positive = createDashboardSummary({
    ingredients, products, sales: [sale('positive', '2026-10-07', 'a', 1)], expenses: [], today: '2026-10-07',
  });
  const zero = createDashboardSummary({
    ingredients, products, sales: [sale('zero', '2026-10-07', 'a', 1)], expenses: [expense('zero-expense', '2026-10-07', 3)], today: '2026-10-07',
  });
  const negative = createDashboardSummary({
    ingredients, products, sales: [], expenses: [expense('negative', '2026-10-07', 3)], today: '2026-10-07',
  });
  assert.equal(positive.todayResults.operatingResult, 3);
  assert.equal(zero.todayResults.operatingResult, 0);
  assert.equal(negative.todayResults.operatingResult, -3);
});

test('expone equilibrio pendiente, alcanzado, superado y no calculable', () => {
  const options = { ingredients, products, today: '2026-10-07' };
  const below = createDashboardSummary({
    ...options, sales: [sale('below', '2026-10-07', 'a', 1)], expenses: [expense('below-fixed', '2026-10-07', 6)],
  });
  const reached = createDashboardSummary({
    ...options, sales: [sale('reached', '2026-10-07', 'a', 2)], expenses: [expense('reached-fixed', '2026-10-07', 6)],
  });
  const exceeded = createDashboardSummary({
    ...options, sales: [sale('exceeded', '2026-10-07', 'a', 3)], expenses: [expense('exceeded-fixed', '2026-10-07', 6)],
  });
  const notCalculable = createDashboardSummary({ ...options, sales: [], expenses: [] });
  assert.equal(below.breakEven.status, 'below');
  assert.equal(reached.breakEven.status, 'reached');
  assert.equal(exceeded.breakEven.status, 'exceeded');
  assert.equal(notCalculable.breakEven.status, 'not-calculable');
});

test('mantiene las métricas históricas al cambiar costes o precios actuales', () => {
  const sales = [sale('historic', '2026-10-07', 'a', 2, 5, 1)];
  const first = createDashboardSummary({ ingredients, products, sales, expenses: [], today: '2026-10-07' });
  const changed = createDashboardSummary({
    ingredients: [{ ...ingredients[0], price: 4 }],
    products: [{ ...products[0], salePrice: 12 }, products[1]],
    sales, expenses: [], today: '2026-10-07',
  });
  assert.equal(first.monthResults.revenue, changed.monthResults.revenue);
  assert.equal(first.monthResults.productCost, changed.monthResults.productCost);
  assert.notEqual(
    first.currentProducts.bestMarginPercent.indicators.marginPercent,
    changed.currentProducts.bestMarginPercent.indicators.marginPercent,
  );
});
