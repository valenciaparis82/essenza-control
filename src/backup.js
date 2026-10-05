import { validateDataSet } from './data-validation.js';

export const BACKUP_APPLICATION = 'essenza-control';
export const BACKUP_FORMAT_VERSION = 1;

function hasExactKeys(value, expectedKeys) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const keys = Object.keys(value);
  return keys.length === expectedKeys.length
    && expectedKeys.every((key) => Object.hasOwn(value, key));
}

function canonicalIngredient(ingredient) {
  return {
    id: ingredient.id,
    name: ingredient.name,
    price: ingredient.price,
    quantity: ingredient.quantity,
    unit: ingredient.unit,
    ...(ingredient.archived === undefined ? {} : { archived: ingredient.archived }),
  };
}

function canonicalProduct(product) {
  return {
    id: product.id,
    name: product.name,
    category: product.category,
    salePrice: product.salePrice,
    recipe: product.recipe.map((line) => ({
      ingredientId: line.ingredientId,
      quantity: line.quantity,
    })),
    ...(product.archived === undefined ? {} : { archived: product.archived }),
  };
}

export function createBackupDocument(ingredients, products, exportedAt = new Date()) {
  validateDataSet({ ingredients, products });
  const document = {
    application: BACKUP_APPLICATION,
    formatVersion: BACKUP_FORMAT_VERSION,
    exportedAt: exportedAt.toISOString(),
    data: {
      ingredients: ingredients.map(canonicalIngredient),
      products: products.map(canonicalProduct),
    },
  };
  validateBackupDocument(document);
  return document;
}

export function validateBackupDocument(document) {
  if (!hasExactKeys(document, ['application', 'formatVersion', 'exportedAt', 'data'])) {
    throw new Error('El archivo no tiene la estructura exacta de una copia de Essenza Control.');
  }
  if (document.application !== BACKUP_APPLICATION) {
    throw new Error('El archivo no pertenece a Essenza Control.');
  }
  if (document.formatVersion !== BACKUP_FORMAT_VERSION) {
    throw new Error(`La versión de la copia no es compatible. Esta aplicación admite la versión ${BACKUP_FORMAT_VERSION}.`);
  }
  const exportedAt = typeof document.exportedAt === 'string'
    ? new Date(document.exportedAt)
    : null;
  if (!exportedAt || Number.isNaN(exportedAt.getTime())
    || exportedAt.toISOString() !== document.exportedAt) {
    throw new Error('La fecha de exportación de la copia no es válida.');
  }
  validateDataSet(document.data, { strict: true });
  return document;
}

export function parseBackupText(text) {
  let document;
  try {
    document = JSON.parse(text);
  } catch {
    throw new Error('El archivo no contiene un JSON válido.');
  }
  validateBackupDocument(document);
  const ingredientIds = new Set(document.data.ingredients.map((ingredient) => ingredient.id));
  const productsWithMissingIngredients = document.data.products.filter((product) => (
    product.recipe.some((line) => !ingredientIds.has(line.ingredientId))
  )).length;

  return {
    document,
    data: document.data,
    summary: {
      ingredients: document.data.ingredients.length,
      archivedIngredients: document.data.ingredients.filter((item) => item.archived === true).length,
      products: document.data.products.length,
      archivedProducts: document.data.products.filter((item) => item.archived === true).length,
      productsWithMissingIngredients,
    },
  };
}

function restoreRawValue(storage, key, value) {
  if (value === null) storage.removeItem(key);
  else storage.setItem(key, value);
}

export function replaceStoredData(storage, keys, data, expectedRawValues) {
  validateDataSet(data, { strict: true });
  const currentIngredients = storage.getItem(keys.ingredients);
  const currentProducts = storage.getItem(keys.products);
  if (currentIngredients !== expectedRawValues.ingredients
    || currentProducts !== expectedRawValues.products) {
    throw new Error('Los datos actuales han cambiado desde que seleccionaste la copia. Vuelve a elegir el archivo para evitar sobrescribir esos cambios.');
  }

  const serializedIngredients = JSON.stringify(data.ingredients);
  const serializedProducts = JSON.stringify(data.products);
  try {
    storage.setItem(keys.ingredients, serializedIngredients);
    storage.setItem(keys.products, serializedProducts);
    if (storage.getItem(keys.ingredients) !== serializedIngredients
      || storage.getItem(keys.products) !== serializedProducts) {
      throw new Error('No se pudo comprobar la escritura completa.');
    }
  } catch {
    let rollbackFailed = false;
    try {
      restoreRawValue(storage, keys.ingredients, currentIngredients);
      restoreRawValue(storage, keys.products, currentProducts);
    } catch {
      rollbackFailed = true;
    }
    if (rollbackFailed) {
      throw new Error('Falló la restauración y el navegador tampoco permitió recuperar automáticamente los datos anteriores. No recargues la página y exporta los datos disponibles si es posible.');
    }
    throw new Error('No se pudo guardar la copia. Se han conservado los datos anteriores.');
  }
}
