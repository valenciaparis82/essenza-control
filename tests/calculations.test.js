import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateIngredientCost,
  calculateProductIndicators,
  classifyFoodCost,
  foodCostThresholds,
} from '../src/calculations.js';

const bacon = { id: 'bacon', name: 'Bacon', price: 8, quantity: 1, unit: 'kg' };
const bread = { id: 'bread', name: 'Pan', price: 3, quantity: 6, unit: 'unit' };
const approximatelyEqual = (actual, expected) => Math.abs(actual - expected) < 1e-12;

test('calcula el coste del ingrediente sin redondear', () => {
  const result = calculateIngredientCost(bacon);
  assert.equal(result.unitCost, 0.008);
  assert.equal(result.baseUnit, 'g');
});

test('calcula receta e indicadores operativos', () => {
  const product = {
    salePrice: 5,
    recipe: [
      { ingredientId: 'bacon', quantity: 30 },
      { ingredientId: 'bread', quantity: 1 },
    ],
  };
  const result = calculateProductIndicators(product, [bacon, bread]);
  assert.equal(result.lines[0].lineCost, 0.24);
  assert.equal(result.lines[1].lineCost, 0.5);
  assert.equal(result.totalCost, 0.74);
  assert.equal(result.marginAmount, 4.26);
  assert.equal(result.marginPercent, 85.2);
  assert.ok(approximatelyEqual(result.foodCostPercent, 14.8));
});

test('permite margen negativo y food cost superior al cien por cien', () => {
  const result = calculateProductIndicators({
    salePrice: 0.2,
    recipe: [{ ingredientId: 'bread', quantity: 1 }],
  }, [bread]);
  assert.equal(result.marginAmount, -0.3);
  assert.equal(result.foodCostPercent, 250);
});

test('un ingrediente archivado sigue calculando recetas existentes', () => {
  const result = calculateProductIndicators({
    salePrice: 2,
    recipe: [{ ingredientId: 'bacon', quantity: 20 }],
  }, [{ ...bacon, archived: true }]);
  assert.equal(result.totalCost, 0.16);
});

test('rechaza recetas vacías, repetidas, incompletas y precios no positivos', () => {
  assert.ok(calculateProductIndicators({ salePrice: 2, recipe: [] }, [bacon]).error);
  assert.ok(calculateProductIndicators({ salePrice: 0, recipe: [{ ingredientId: 'bacon', quantity: 1 }] }, [bacon]).error);
  assert.ok(calculateProductIndicators({
    salePrice: 2,
    recipe: [
      { ingredientId: 'bacon', quantity: 1 },
      { ingredientId: 'bacon', quantity: 2 },
    ],
  }, [bacon]).error);
  assert.ok(calculateProductIndicators({
    salePrice: 2,
    recipe: [{ ingredientId: 'missing', quantity: 1 }],
  }, [bacon]).error);
});

test('clasifica los límites exactos del semáforo de food cost', () => {
  assert.deepEqual(foodCostThresholds, { greenMax: 30, amberMax: 35 });
  assert.equal(classifyFoodCost(0).key, 'green');
  assert.equal(classifyFoodCost(30).key, 'green');
  assert.equal(classifyFoodCost(30.0000001).key, 'amber');
  assert.equal(classifyFoodCost(35).key, 'amber');
  assert.equal(classifyFoodCost(35.0000001).key, 'red');
  assert.equal(classifyFoodCost(250).key, 'red');
});

test('rechaza porcentajes no finitos o negativos en el semáforo', () => {
  assert.ok(classifyFoodCost(Number.NaN).error);
  assert.ok(classifyFoodCost(Number.POSITIVE_INFINITY).error);
  assert.ok(classifyFoodCost(-0.01).error);
});
