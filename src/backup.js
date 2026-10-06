import {
  validateDataSet,
  validateIngredients,
  validateProducts,
  validateSales,
} from './data-validation.js';

export const BACKUP_APPLICATION = 'essenza-control';
export const BACKUP_FORMAT_VERSION = 3;
const FIRST_BACKUP_FORMAT_VERSION = 1;
const SALES_BACKUP_FORMAT_VERSION = 2;

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

function canonicalSale(sale) {
  return {
    id: sale.id,
    date: sale.date,
    productId: sale.productId,
    units: sale.units,
    unitSalePrice: sale.unitSalePrice,
    unitCost: sale.unitCost,
  };
}

function canonicalExpense(expense) {
  return {
    id: expense.id,
    date: expense.date,
    category: expense.category,
    description: expense.description,
    amount: expense.amount,
    type: expense.type,
  };
}

export function createBackupDocument(ingredients, products, sales, expenses, exportedAt = new Date()) {
  validateDataSet({ ingredients, products, sales, expenses });
  const document = {
    application: BACKUP_APPLICATION,
    formatVersion: BACKUP_FORMAT_VERSION,
    exportedAt: exportedAt.toISOString(),
    data: {
      ingredients: ingredients.map(canonicalIngredient),
      products: products.map(canonicalProduct),
      sales: sales.map(canonicalSale),
      expenses: expenses.map(canonicalExpense),
    },
  };
  validateBackupDocument(document);
  return document;
}

function validateExportDate(exportedAtValue) {
  const exportedAt = typeof exportedAtValue === 'string' ? new Date(exportedAtValue) : null;
  if (!exportedAt || Number.isNaN(exportedAt.getTime())
    || exportedAt.toISOString() !== exportedAtValue) {
    throw new Error('La fecha de exportación de la copia no es válida.');
  }
}

export function validateBackupDocument(document) {
  if (!hasExactKeys(document, ['application', 'formatVersion', 'exportedAt', 'data'])) {
    throw new Error('El archivo no tiene la estructura exacta de una copia de Essenza Control.');
  }
  if (document.application !== BACKUP_APPLICATION) {
    throw new Error('El archivo no pertenece a Essenza Control.');
  }
  if (![FIRST_BACKUP_FORMAT_VERSION, SALES_BACKUP_FORMAT_VERSION, BACKUP_FORMAT_VERSION].includes(document.formatVersion)) {
    throw new Error(`La versión de la copia no es compatible. Esta aplicación admite las versiones ${FIRST_BACKUP_FORMAT_VERSION}, ${SALES_BACKUP_FORMAT_VERSION} y ${BACKUP_FORMAT_VERSION}.`);
  }
  validateExportDate(document.exportedAt);

  if (document.formatVersion === FIRST_BACKUP_FORMAT_VERSION) {
    if (!hasExactKeys(document.data, ['ingredients', 'products'])) {
      throw new Error('La estructura de datos de la copia no es válida.');
    }
    validateIngredients(document.data.ingredients, { strict: true });
    validateProducts(document.data.products, { strict: true });
  } else if (document.formatVersion === SALES_BACKUP_FORMAT_VERSION) {
    if (!hasExactKeys(document.data, ['ingredients', 'products', 'sales'])) {
      throw new Error('La estructura de datos de la copia no es válida.');
    }
    validateIngredients(document.data.ingredients, { strict: true });
    validateProducts(document.data.products, { strict: true });
    validateSales(document.data.sales, { strict: true });
  } else {
    validateDataSet(document.data, { strict: true });
  }
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
  const hasSales = document.formatVersion >= SALES_BACKUP_FORMAT_VERSION;
  const hasExpenses = document.formatVersion >= BACKUP_FORMAT_VERSION;
  const data = {
    ingredients: document.data.ingredients,
    products: document.data.products,
    sales: hasSales ? document.data.sales : [],
    expenses: hasExpenses ? document.data.expenses : [],
  };
  const ingredientIds = new Set(data.ingredients.map((ingredient) => ingredient.id));
  const productIds = new Set(data.products.map((product) => product.id));
  const productsWithMissingIngredients = data.products.filter((product) => (
    product.recipe.some((line) => !ingredientIds.has(line.ingredientId))
  )).length;
  const salesWithMissingProducts = data.sales.filter((sale) => !productIds.has(sale.productId)).length;

  return {
    document,
    data,
    summary: {
      formatVersion: document.formatVersion,
      ingredients: data.ingredients.length,
      archivedIngredients: data.ingredients.filter((item) => item.archived === true).length,
      products: data.products.length,
      archivedProducts: data.products.filter((item) => item.archived === true).length,
      productsWithMissingIngredients,
      sales: data.sales.length,
      salesWithMissingProducts,
      expenses: data.expenses.length,
      clearsSales: !hasSales,
      clearsExpenses: !hasExpenses,
    },
  };
}

function restoreRawValue(storage, key, value) {
  if (value === null) storage.removeItem(key);
  else storage.setItem(key, value);
}

export function replaceStoredData(storage, keys, data, expectedRawValues) {
  validateDataSet(data, { strict: true });
  const names = ['ingredients', 'products', 'sales', 'expenses'];
  const currentValues = Object.fromEntries(names.map((name) => [name, storage.getItem(keys[name])]));
  if (names.some((name) => currentValues[name] !== expectedRawValues[name])) {
    throw new Error('Los datos actuales han cambiado desde que seleccionaste la copia. Vuelve a elegir el archivo para evitar sobrescribir esos cambios.');
  }

  const serializedValues = Object.fromEntries(names.map((name) => [name, JSON.stringify(data[name])]));
  try {
    for (const name of names) storage.setItem(keys[name], serializedValues[name]);
    if (names.some((name) => storage.getItem(keys[name]) !== serializedValues[name])) {
      throw new Error('No se pudo comprobar la escritura completa.');
    }
  } catch {
    let rollbackFailed = false;
    for (const name of names) {
      try {
        restoreRawValue(storage, keys[name], currentValues[name]);
      } catch {
        rollbackFailed = true;
      }
    }
    if (rollbackFailed) {
      throw new Error('Falló la restauración y el navegador tampoco permitió recuperar automáticamente los datos anteriores. No recargues la página y exporta los datos disponibles si es posible.');
    }
    throw new Error('No se pudo guardar la copia. Se han conservado los datos anteriores.');
  }
}
