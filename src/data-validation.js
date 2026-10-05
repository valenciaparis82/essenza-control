import { calculateIngredientCost } from './calculations.js';

export const PRODUCT_CATEGORIES = Object.freeze([
  'Bocadillos',
  'Hamburguesas',
  'Tapas',
  'Tostadas',
  'Bebidas',
  'Bolleria',
  'Otros',
]);

const productCategorySet = new Set(PRODUCT_CATEGORIES);

export function normalizeName(name) {
  return name.trim().toLocaleLowerCase('es-ES');
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function hasOnlyKeys(value, requiredKeys, optionalKeys = []) {
  const allowedKeys = new Set([...requiredKeys, ...optionalKeys]);
  const keys = Object.keys(value);
  return requiredKeys.every((key) => Object.hasOwn(value, key))
    && keys.every((key) => allowedKeys.has(key));
}

export function validateIngredients(ingredients, { strict = false } = {}) {
  if (!Array.isArray(ingredients)) throw new Error('La lista de ingredientes no es válida.');
  const ids = new Set();
  const names = new Set();

  for (const ingredient of ingredients) {
    const archivedIsValid = ingredient?.archived === undefined
      || typeof ingredient.archived === 'boolean';
    const keysAreValid = !strict || (isPlainObject(ingredient)
      && hasOnlyKeys(ingredient, ['id', 'name', 'price', 'quantity', 'unit'], ['archived']));
    if (!isPlainObject(ingredient) || !keysAreValid
      || typeof ingredient.id !== 'string' || !ingredient.id.trim()
      || typeof ingredient.name !== 'string' || !ingredient.name.trim()
      || typeof ingredient.unit !== 'string' || !archivedIsValid
      || calculateIngredientCost(ingredient).error
      || ids.has(ingredient.id) || names.has(normalizeName(ingredient.name))) {
      throw new Error('La copia contiene un ingrediente inválido o duplicado.');
    }
    ids.add(ingredient.id);
    names.add(normalizeName(ingredient.name));
  }
  return ingredients;
}

export function validateProducts(products, { strict = false } = {}) {
  if (!Array.isArray(products)) throw new Error('La lista de productos no es válida.');
  const ids = new Set();
  const names = new Set();

  for (const product of products) {
    const archivedIsValid = product?.archived === undefined
      || typeof product.archived === 'boolean';
    const productKeysAreValid = !strict || (isPlainObject(product)
      && hasOnlyKeys(product, ['id', 'name', 'category', 'salePrice', 'recipe'], ['archived']));
    const recipeIsValid = Array.isArray(product?.recipe) && product.recipe.length > 0
      && product.recipe.every((line) => isPlainObject(line)
        && (!strict || hasOnlyKeys(line, ['ingredientId', 'quantity']))
        && typeof line.ingredientId === 'string' && line.ingredientId.trim()
        && Number.isFinite(line.quantity) && line.quantity > 0)
      && new Set(product.recipe.map((line) => line.ingredientId)).size === product.recipe.length;

    if (!isPlainObject(product) || !productKeysAreValid
      || typeof product.id !== 'string' || !product.id.trim()
      || typeof product.name !== 'string' || !product.name.trim()
      || !productCategorySet.has(product.category) || !archivedIsValid
      || !Number.isFinite(product.salePrice) || product.salePrice <= 0
      || !recipeIsValid || ids.has(product.id) || names.has(normalizeName(product.name))) {
      throw new Error('La copia contiene un producto inválido o duplicado.');
    }
    ids.add(product.id);
    names.add(normalizeName(product.name));
  }
  return products;
}

export function validateDataSet(data, { strict = false } = {}) {
  if (!isPlainObject(data)
    || (strict && !hasOnlyKeys(data, ['ingredients', 'products']))) {
    throw new Error('La estructura de datos de la copia no es válida.');
  }
  validateIngredients(data.ingredients, { strict });
  validateProducts(data.products, { strict });
  return data;
}
