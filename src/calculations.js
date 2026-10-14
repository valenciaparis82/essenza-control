// Las recetas trabajan siempre con una unidad base. Así se pueden sumar costes
// de kg y g (o de l y ml) sin mezclar magnitudes incompatibles.
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
  // El semáforo es solo una orientación operativa. Recibe el valor completo,
  // sin redondearlo antes, para no cambiar de color por la forma de mostrarlo.
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
  // Convertimos primero la compra a su unidad interna y después dividimos el
  // precio. Esto conserva precisión en ingredientes usados en poca cantidad.
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
  // Estos indicadores se derivan de la receta y de los precios actuales.
  // No se guardan: al cambiar un ingrediente deben recalcularse solos.
  if (!product || !Number.isFinite(product.salePrice) || product.salePrice <= 0) {
    return { error: 'Introduce un precio de venta válido, mayor que cero.' };
  }
  if (!Array.isArray(product.recipe) || product.recipe.length === 0) {
    return { error: 'Añade al menos un ingrediente a la receta.' };
  }

  // El mapa permite localizar cada ingrediente por su ID. La receta guarda
  // referencias, no una copia del precio del ingrediente.
  const ingredientMap = new Map(ingredients.map((ingredient) => [ingredient.id, ingredient]));
  const usedIngredientIds = new Set();
  const lines = [];
  let totalCost = 0;

  // Recorremos cada línea validando también que un ingrediente no se repita.
  // Una receta duplicada daría un coste engañoso para una unidad vendida.
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
  // Aplicamos las fórmulas con los valores completos; el redondeo se hace solo
  // al mostrar el resultado en la interfaz.
  const marginAmount = product.salePrice - totalCost;
  const marginPercent = (marginAmount / product.salePrice) * 100;
  const foodCostPercent = (totalCost / product.salePrice) * 100;
  return { lines, totalCost, marginAmount, marginPercent, foodCostPercent };
}
