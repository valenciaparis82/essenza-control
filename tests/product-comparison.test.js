import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createProductComparisonRows,
  filterAndSortProductComparisonRows,
} from '../src/product-comparison.js';

const ingredients = [
  { id: 'main', name: 'Ingrediente', price: 1, quantity: 1, unit: 'unit' },
  { id: 'archived', name: 'Ingrediente archivado', price: 0.3, quantity: 1, unit: 'unit', archived: true },
];

function product(id, name, category, salePrice, ingredientId = 'main') {
  return { id, name, category, salePrice, recipe: [{ ingredientId, quantity: 1 }] };
}

test('excluye productos archivados y conserva recetas con ingredientes archivados', () => {
  const rows = createProductComparisonRows([
    product('active', 'Activo', 'Tapas', 1, 'archived'),
    { ...product('archived-product', 'Archivado', 'Tapas', 2), archived: true },
  ], ingredients);

  assert.equal(rows.length, 1);
  assert.equal(rows[0].product.id, 'active');
  assert.equal(rows[0].calculable, true);
  assert.equal(rows[0].indicators.totalCost, 0.3);
});

test('ordena inicialmente el food cost de mayor a menor sin redondear', () => {
  const rows = createProductComparisonRows([
    product('lower', 'Menor', 'Tapas', 3.33333334),
    product('higher', 'Mayor', 'Tapas', 3.33333333),
  ], ingredients);
  const sorted = filterAndSortProductComparisonRows(rows);

  assert.deepEqual(sorted.map((row) => row.product.id), ['higher', 'lower']);
});

test('filtra una sola categoría y ordena campos numéricos en ambas direcciones', () => {
  const rows = createProductComparisonRows([
    product('cheap', 'Barato', 'Tapas', 2),
    product('expensive', 'Caro', 'Tapas', 5),
    product('drink', 'Bebida', 'Bebidas', 3),
  ], ingredients);

  const ascending = filterAndSortProductComparisonRows(rows, {
    category: 'Tapas', sortBy: 'price', direction: 'asc',
  });
  const descending = filterAndSortProductComparisonRows(rows, {
    category: 'Tapas', sortBy: 'price', direction: 'desc',
  });

  assert.deepEqual(ascending.map((row) => row.product.id), ['cheap', 'expensive']);
  assert.deepEqual(descending.map((row) => row.product.id), ['expensive', 'cheap']);
});

test('permite ordenar por texto y usa el nombre para resolver empates', () => {
  const rows = createProductComparisonRows([
    product('z', 'Zumo', 'Bebidas', 2),
    product('a', 'Agua', 'Bebidas', 2),
    product('t', 'Tapa', 'Tapas', 2),
  ], ingredients);
  const sorted = filterAndSortProductComparisonRows(rows, {
    sortBy: 'category', direction: 'asc',
  });

  assert.deepEqual(sorted.map((row) => row.product.name), ['Agua', 'Zumo', 'Tapa']);
});

test('ordena el semáforo por gravedad', () => {
  const rows = createProductComparisonRows([
    product('green', 'Verde', 'Tapas', 4),
    product('amber', 'Ámbar', 'Tapas', 3),
    product('red', 'Rojo', 'Tapas', 2),
  ], ingredients);
  const sorted = filterAndSortProductComparisonRows(rows, {
    sortBy: 'status', direction: 'desc',
  });

  assert.deepEqual(sorted.map((row) => row.status.key), ['red', 'amber', 'green']);
});

test('mantiene los productos no calculables visibles y siempre al final', () => {
  const rows = createProductComparisonRows([
    product('missing', 'Sin ingrediente', 'Tapas', 2, 'missing'),
    product('valid', 'Calculable', 'Tapas', 2),
  ], ingredients);

  for (const direction of ['asc', 'desc']) {
    const sorted = filterAndSortProductComparisonRows(rows, { sortBy: 'foodCost', direction });
    assert.deepEqual(sorted.map((row) => row.product.id), ['valid', 'missing']);
    assert.equal(sorted[1].calculable, false);
  }
});
