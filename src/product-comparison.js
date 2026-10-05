import { calculateProductIndicators, classifyFoodCost } from './calculations.js';

export const comparisonSortFields = Object.freeze([
  'product',
  'category',
  'cost',
  'price',
  'marginAmount',
  'marginPercent',
  'foodCost',
  'status',
]);

const textCollator = new Intl.Collator('es-ES', { sensitivity: 'base', numeric: true });
const statusOrder = Object.freeze({ green: 1, amber: 2, red: 3 });

export function createProductComparisonRows(products, ingredients) {
  return products
    .filter((product) => product.archived !== true)
    .map((product) => {
      const indicators = calculateProductIndicators(product, ingredients);
      if (indicators.error) {
        return { product, calculable: false, error: indicators.error };
      }

      const status = classifyFoodCost(indicators.foodCostPercent);
      return {
        product,
        calculable: true,
        indicators,
        status,
      };
    });
}

function getSortValue(row, sortBy) {
  const values = {
    product: row.product.name,
    category: row.product.category,
    cost: row.indicators.totalCost,
    price: row.product.salePrice,
    marginAmount: row.indicators.marginAmount,
    marginPercent: row.indicators.marginPercent,
    foodCost: row.indicators.foodCostPercent,
    status: statusOrder[row.status.key],
  };
  return values[sortBy];
}

export function filterAndSortProductComparisonRows(rows, {
  category = 'all',
  sortBy = 'foodCost',
  direction = 'desc',
} = {}) {
  const validSortBy = comparisonSortFields.includes(sortBy) ? sortBy : 'foodCost';
  const directionFactor = direction === 'asc' ? 1 : -1;
  const filteredRows = category === 'all'
    ? [...rows]
    : rows.filter((row) => row.product.category === category);

  return filteredRows.sort((first, second) => {
    // Los productos no calculables permanecen al final en cualquier dirección.
    if (first.calculable !== second.calculable) return first.calculable ? -1 : 1;

    if (first.calculable) {
      const firstValue = getSortValue(first, validSortBy);
      const secondValue = getSortValue(second, validSortBy);
      const comparison = typeof firstValue === 'string'
        ? textCollator.compare(firstValue, secondValue)
        : firstValue - secondValue;
      if (comparison !== 0) return comparison * directionFactor;
    }

    const nameComparison = textCollator.compare(first.product.name, second.product.name);
    if (nameComparison !== 0) return nameComparison;
    return textCollator.compare(first.product.id, second.product.id);
  });
}
