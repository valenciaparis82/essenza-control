import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BACKUP_FORMAT_VERSION,
  createBackupDocument,
  parseBackupText,
  replaceStoredData,
} from '../src/backup.js';

const ingredients = [
  { id: 'bacon', name: 'Bacon', price: 8, quantity: 1, unit: 'kg' },
];
const products = [{
  id: 'bocadillo',
  name: 'Bocadillo de bacon',
  category: 'Bocadillos',
  salePrice: 5,
  recipe: [{ ingredientId: 'bacon', quantity: 30 }],
}];
const sales = [{
  id: 'venta-1',
  date: '2026-10-05',
  productId: 'bocadillo',
  units: 2,
  unitSalePrice: 5,
  unitCost: 0.24,
}];

function createStorage(initial = {}, failOnSetCall = null) {
  const values = new Map(Object.entries(initial));
  let setCalls = 0;
  return {
    getItem: (key) => values.has(key) ? values.get(key) : null,
    setItem(key, value) {
      setCalls += 1;
      if (setCalls === failOnSetCall) throw new Error('Fallo simulado');
      values.set(key, String(value));
    },
    removeItem: (key) => values.delete(key),
  };
}

const keys = {
  ingredients: 'essenza.ingredients',
  products: 'essenza.products',
  sales: 'essenza.sales',
};

test('crea y vuelve a leer una copia formato 2 con ventas históricas', () => {
  const document = createBackupDocument(ingredients, products, sales, new Date('2026-10-05T12:00:00.000Z'));
  const parsed = parseBackupText(JSON.stringify(document));
  assert.equal(document.formatVersion, BACKUP_FORMAT_VERSION);
  assert.equal(document.exportedAt, '2026-10-05T12:00:00.000Z');
  assert.deepEqual(parsed.data, { ingredients, products, sales });
  assert.equal(parsed.summary.sales, 1);
  assert.equal(parsed.summary.clearsSales, false);
  assert.equal(Object.hasOwn(document.data.ingredients[0], 'unitCost'), false);
});

test('importa formato 1 y prepara las ventas como lista vacía', () => {
  const legacy = {
    application: 'essenza-control',
    formatVersion: 1,
    exportedAt: '2026-10-05T12:00:00.000Z',
    data: { ingredients, products },
  };
  const parsed = parseBackupText(JSON.stringify(legacy));
  assert.deepEqual(parsed.data, { ingredients, products, sales: [] });
  assert.equal(parsed.summary.formatVersion, 1);
  assert.equal(parsed.summary.clearsSales, true);
});

test('rechaza JSON dañado, otra aplicación, versión desconocida y campos extra', () => {
  assert.throws(() => parseBackupText('{mal'), /JSON válido/);
  const valid = createBackupDocument(ingredients, products, sales);
  assert.throws(() => parseBackupText(JSON.stringify({ ...valid, application: 'otra' })), /no pertenece/);
  assert.throws(() => parseBackupText(JSON.stringify({ ...valid, formatVersion: 3 })), /no es compatible/);
  assert.throws(() => parseBackupText(JSON.stringify({ ...valid, exportedAt: '2026-10-05' })), /fecha de exportación/);
  assert.throws(() => parseBackupText(JSON.stringify({ ...valid, unexpected: true })), /estructura exacta/);
});

test('rechaza registros duplicados, ventas inválidas y recetas inválidas', () => {
  const valid = createBackupDocument(ingredients, products, sales);
  const duplicate = structuredClone(valid);
  duplicate.data.ingredients.push({ ...duplicate.data.ingredients[0], id: 'otro', name: ' BACON ' });
  assert.throws(() => parseBackupText(JSON.stringify(duplicate)), /ingrediente inválido o duplicado/);

  const invalidRecipe = structuredClone(valid);
  invalidRecipe.data.products[0].recipe[0].quantity = 0;
  assert.throws(() => parseBackupText(JSON.stringify(invalidRecipe)), /producto inválido o duplicado/);

  const invalidSale = structuredClone(valid);
  invalidSale.data.sales[0].units = 1.5;
  assert.throws(() => parseBackupText(JSON.stringify(invalidSale)), /venta inválida o duplicada/);

  const futureSale = structuredClone(valid);
  futureSale.data.sales[0].date = '2999-01-01';
  assert.throws(() => parseBackupText(JSON.stringify(futureSale)), /venta inválida o duplicada/);

  const overflowingSale = structuredClone(valid);
  overflowingSale.data.sales[0].units = 2;
  overflowingSale.data.sales[0].unitSalePrice = Number.MAX_VALUE;
  assert.throws(() => parseBackupText(JSON.stringify(overflowingSale)), /venta inválida o duplicada/);
});

test('acepta una copia vacía', () => {
  const parsed = parseBackupText(JSON.stringify(createBackupDocument([], [], [])));
  assert.equal(parsed.summary.ingredients, 0);
  assert.equal(parsed.summary.products, 0);
  assert.equal(parsed.summary.sales, 0);
});

test('cuenta referencias inexistentes de productos y ventas como advertencias', () => {
  const orphanProduct = [{
    ...products[0],
    recipe: [{ ingredientId: 'missing', quantity: 30 }],
  }];
  const orphanSale = [{ ...sales[0], productId: 'missing' }];
  const parsed = parseBackupText(JSON.stringify(createBackupDocument(ingredients, orphanProduct, orphanSale)));
  assert.equal(parsed.summary.productsWithMissingIngredients, 1);
  assert.equal(parsed.summary.salesWithMissingProducts, 1);
});

test('reemplaza los tres conjuntos aunque los anteriores estén dañados', () => {
  const storage = createStorage({
    [keys.ingredients]: '{dañado',
    [keys.products]: 'null',
    [keys.sales]: 'también dañado',
  });
  replaceStoredData(storage, keys, { ingredients, products, sales }, {
    ingredients: '{dañado', products: 'null', sales: 'también dañado',
  });
  assert.deepEqual(JSON.parse(storage.getItem(keys.ingredients)), ingredients);
  assert.deepEqual(JSON.parse(storage.getItem(keys.products)), products);
  assert.deepEqual(JSON.parse(storage.getItem(keys.sales)), sales);
});

test('no escribe si los datos cambian antes de restaurar', () => {
  const empty = JSON.stringify([]);
  const storage = createStorage({
    [keys.ingredients]: JSON.stringify(ingredients),
    [keys.products]: empty,
    [keys.sales]: empty,
  });
  assert.throws(() => replaceStoredData(storage, keys, { ingredients, products, sales }, {
    ingredients: empty, products: empty, sales: empty,
  }), /han cambiado/);
  assert.equal(storage.getItem(keys.products), empty);
  assert.equal(storage.getItem(keys.sales), empty);
});

test('revierte las escrituras si falla cualquiera de las tres', () => {
  for (const failedCall of [1, 2, 3]) {
    const oldIngredients = JSON.stringify([{ legacy: 'ingredientes' }]);
    const oldProducts = JSON.stringify([{ legacy: 'productos' }]);
    const oldSales = JSON.stringify([{ legacy: 'ventas' }]);
    const storage = createStorage({
      [keys.ingredients]: oldIngredients,
      [keys.products]: oldProducts,
      [keys.sales]: oldSales,
    }, failedCall);
    assert.throws(() => replaceStoredData(storage, keys, { ingredients, products, sales }, {
      ingredients: oldIngredients, products: oldProducts, sales: oldSales,
    }), /conservado los datos anteriores/);
    assert.equal(storage.getItem(keys.ingredients), oldIngredients);
    assert.equal(storage.getItem(keys.products), oldProducts);
    assert.equal(storage.getItem(keys.sales), oldSales);
  }
});
