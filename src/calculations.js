export const purchaseUnits = {
  kg: { factor: 1000, base: 'g', type: 'mass' },
  g: { factor: 1, base: 'g', type: 'mass' },
  l: { factor: 1000, base: 'ml', type: 'volume' },
  ml: { factor: 1, base: 'ml', type: 'volume' },
  unit: { factor: 1, base: 'unidad', type: 'count' },
};

// Estos límites están centralizados para poder hacerlos configurables más adelante.
export const foodCostThresholds = Object.freeze({
  greenMax: 30,
  amberMax: 35,
});

export function classifyFoodCost(foodCostPercent) {
  if (!Number.isFinite(foodCostPercent) || foodCostPercent < 0) {
    return { error: 'El food cost debe ser un porcentaje válido, igual o mayor que cero.' };
  }
  if (foodCostPercent <= foodCostThresholds.greenMax) {
    return {
      key: 'green',
      label: 'Verde',
      description: `Dentro del objetivo (hasta ${foodCostThresholds.greenMax} %).`,
    };
  }
  if (foodCostPercent <= foodCostThresholds.amberMax) {
    return {
      key: 'amber',
      label: 'Ámbar',
      description: `Conviene revisarlo (más de ${foodCostThresholds.greenMax} % y hasta ${foodCostThresholds.amberMax} %).`,
    };
  }
  return {
    key: 'red',
    label: 'Rojo',
    description: `Food cost elevado (más de ${foodCostThresholds.amberMax} %).`,
  };
}

export function calculateIngredientCost({ name, price, quantity, unit }) {
  if (typeof name !== 'string' || !name.trim()) {
    return { error: 'Introduce el nombre del ingrediente.' };
  }
  if (!Number.isFinite(price) || price < 0) {
    return { error: 'Introduce un precio válido, igual o mayor que cero.' };
  }
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return { error: 'Introduce una cantidad válida, mayor que cero.' };
  }
  const conversion = Object.hasOwn(purchaseUnits, unit) ? purchaseUnits[unit] : null;
  if (!conversion) {
    return { error: 'Selecciona una unidad de compra válida.' };
  }

  const baseQuantity = quantity * conversion.factor;
  const unitCost = price / baseQuantity;
  if (!Number.isFinite(baseQuantity) || !Number.isFinite(unitCost) || (price > 0 && unitCost === 0)) {
    return { error: 'Estos valores son demasiado extremos para calcular un coste fiable.' };
  }
  return { baseQuantity, unitCost, baseUnit: conversion.base };
}

export function calculateProductIndicators(product, ingredients) {
  if (!product || !Number.isFinite(product.salePrice) || product.salePrice <= 0) {
    return { error: 'Introduce un precio de venta válido, mayor que cero.' };
  }
  if (!Array.isArray(product.recipe) || product.recipe.length === 0) {
    return { error: 'Añade al menos un ingrediente a la receta.' };
  }

  const ingredientMap = new Map(ingredients.map((ingredient) => [ingredient.id, ingredient]));
  const usedIngredientIds = new Set();
  const lines = [];
  let totalCost = 0;

  for (const recipeLine of product.recipe) {
    if (!recipeLine || typeof recipeLine.ingredientId !== 'string' || !recipeLine.ingredientId
      || !Number.isFinite(recipeLine.quantity) || recipeLine.quantity <= 0) {
      return { error: 'La receta contiene una cantidad o un ingrediente inválido.' };
    }
    if (usedIngredientIds.has(recipeLine.ingredientId)) {
      return { error: 'No puedes repetir un ingrediente dentro de la receta.' };
    }
    usedIngredientIds.add(recipeLine.ingredientId);

    const ingredient = ingredientMap.get(recipeLine.ingredientId);
    if (!ingredient) {
      return { error: 'La receta contiene un ingrediente que ya no está disponible.' };
    }
    const ingredientCost = calculateIngredientCost(ingredient);
    if (ingredientCost.error) {
      return { error: `No se puede calcular el coste de ${ingredient.name}.` };
    }
    const lineCost = ingredientCost.unitCost * recipeLine.quantity;
    if (!Number.isFinite(lineCost) || (ingredientCost.unitCost > 0 && lineCost === 0)) {
      return { error: 'La receta contiene valores demasiado extremos para calcular un coste fiable.' };
    }
    totalCost += lineCost;
    lines.push({
      ingredient,
      quantity: recipeLine.quantity,
      baseUnit: ingredientCost.baseUnit,
      lineCost,
    });
  }

  if (!Number.isFinite(totalCost)) {
    return { error: 'El coste total es demasiado grande para calcularlo.' };
  }
  const marginAmount = product.salePrice - totalCost;
  const marginPercent = (marginAmount / product.salePrice) * 100;
  const foodCostPercent = (totalCost / product.salePrice) * 100;
  return { lines, totalCost, marginAmount, marginPercent, foodCostPercent };
}
