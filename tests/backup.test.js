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

const keys = { ingredients: 'essenza.ingredients', products: 'essenza.products' };

test('crea y vuelve a leer una copia versionada sin guardar datos derivados', () => {
  const document = createBackupDocument(ingredients, products, new Date('2026-10-05T12:00:00.000Z'));
  const parsed = parseBackupText(JSON.stringify(document));
  assert.equal(document.formatVersion, BACKUP_FORMAT_VERSION);
  assert.equal(document.exportedAt, '2026-10-05T12:00:00.000Z');
  assert.deepEqual(parsed.data, { ingredients, products });
  assert.equal(parsed.summary.productsWithMissingIngredients, 0);
  assert.equal(Object.hasOwn(document.data.ingredients[0], 'unitCost'), false);
});

test('rechaza JSON dañado, otra aplicación, otra versión y campos desconocidos', () => {
  assert.throws(() => parseBackupText('{mal'), /JSON válido/);
  const valid = createBackupDocument(ingredients, products);
  assert.throws(() => parseBackupText(JSON.stringify({ ...valid, application: 'otra' })), /no pertenece/);
  assert.throws(() => parseBackupText(JSON.stringify({ ...valid, formatVersion: 2 })), /no es compatible/);
  assert.throws(() => parseBackupText(JSON.stringify({ ...valid, exportedAt: '2026-10-05' })), /fecha de exportación/);
  assert.throws(() => parseBackupText(JSON.stringify({ ...valid, unexpected: true })), /estructura exacta/);
});

test('rechaza registros duplicados, campos inválidos y recetas inválidas', () => {
  const valid = createBackupDocument(ingredients, products);
  const duplicate = structuredClone(valid);
  duplicate.data.ingredients.push({ ...duplicate.data.ingredients[0], id: 'otro', name: ' BACON ' });
  assert.throws(() => parseBackupText(JSON.stringify(duplicate)), /ingrediente inválido o duplicado/);

  const invalidRecipe = structuredClone(valid);
  invalidRecipe.data.products[0].recipe[0].quantity = 0;
  assert.throws(() => parseBackupText(JSON.stringify(invalidRecipe)), /producto inválido o duplicado/);
});

test('acepta una copia vacía', () => {
  const parsed = parseBackupText(JSON.stringify(createBackupDocument([], [])));
  assert.deepEqual(parsed.summary, {
    ingredients: 0,
    archivedIngredients: 0,
    products: 0,
    archivedProducts: 0,
    productsWithMissingIngredients: 0,
  });
});

test('acepta referencias inexistentes y las cuenta como advertencia', () => {
  const orphanProduct = [{
    ...products[0],
    recipe: [{ ingredientId: 'missing', quantity: 30 }],
  }];
  const parsed = parseBackupText(JSON.stringify(createBackupDocument(ingredients, orphanProduct)));
  assert.equal(parsed.summary.productsWithMissingIngredients, 1);
});

test('reemplaza ambos conjuntos aunque los valores anteriores estén dañados', () => {
  const storage = createStorage({
    [keys.ingredients]: '{dañado',
    [keys.products]: 'null',
  });
  replaceStoredData(storage, keys, { ingredients, products }, {
    ingredients: '{dañado', products: 'null',
  });
  assert.deepEqual(JSON.parse(storage.getItem(keys.ingredients)), ingredients);
  assert.deepEqual(JSON.parse(storage.getItem(keys.products)), products);
});

test('no escribe si los datos cambian antes de restaurar', () => {
  const oldIngredients = JSON.stringify([]);
  const oldProducts = JSON.stringify([]);
  const storage = createStorage({
    [keys.ingredients]: JSON.stringify(ingredients),
    [keys.products]: oldProducts,
  });
  assert.throws(() => replaceStoredData(storage, keys, { ingredients, products }, {
    ingredients: oldIngredients, products: oldProducts,
  }), /han cambiado/);
  assert.equal(storage.getItem(keys.products), oldProducts);
});

test('revierte la primera escritura si falla la segunda', () => {
  const oldIngredients = JSON.stringify([{ legacy: 'ingredientes' }]);
  const oldProducts = JSON.stringify([{ legacy: 'productos' }]);
  const storage = createStorage({
    [keys.ingredients]: oldIngredients,
    [keys.products]: oldProducts,
  }, 2);
  assert.throws(() => replaceStoredData(storage, keys, { ingredients, products }, {
    ingredients: oldIngredients, products: oldProducts,
  }), /conservado los datos anteriores/);
  assert.equal(storage.getItem(keys.ingredients), oldIngredients);
  assert.equal(storage.getItem(keys.products), oldProducts);
});
