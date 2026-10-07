import { calculateMonthlyBreakEven } from './break-even.js';
import { createProductComparisonRows } from './product-comparison.js';
import { calculateOperatingResults } from './results.js';

const textCollator = new Intl.Collator('es-ES', { sensitivity: 'base', numeric: true });

function compareProducts(first, second) {
  const nameComparison = textCollator.compare(first.product.name, second.product.name);
  return nameComparison || textCollator.compare(first.product.id, second.product.id);
}

function getBestProduct(rows, indicator) {
  const calculableRows = rows.filter((row) => row.calculable);
  if (!calculableRows.length) return null;

  return [...calculableRows].sort((first, second) => {
    const difference = second.indicators[indicator] - first.indicators[indicator];
    return difference || compareProducts(first, second);
  })[0];
}

function getMostSoldProduct(sales, products, month) {
  const soldUnitsByProduct = new Map();
  for (const sale of sales) {
    if (!sale.date.startsWith(`${month}-`)) continue;
    const units = (soldUnitsByProduct.get(sale.productId) ?? 0) + sale.units;
    if (!Number.isSafeInteger(units)) {
      return { error: 'Las unidades vendidas del mes son demasiado grandes para calcularlas.' };
    }
    soldUnitsByProduct.set(sale.productId, units);
  }
  if (!soldUnitsByProduct.size) return { product: null };

  const productById = new Map(products.map((product) => [product.id, product]));
  const candidates = [...soldUnitsByProduct].map(([productId, units]) => {
    const product = productById.get(productId);
    return {
      id: productId,
      name: product?.name ?? 'Producto no disponible',
      archived: product?.archived === true,
      missing: !product,
      units,
    };
  });
  candidates.sort((first, second) => second.units - first.units
    || textCollator.compare(first.name, second.name)
    || textCollator.compare(first.id, second.id));
  return { product: candidates[0] };
}

export function createDashboardSummary({ ingredients, products, sales, expenses, today }) {
  if (typeof today !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(today)) {
    return { error: 'No se puede determinar la fecha actual del dashboard.' };
  }
  const month = today.slice(0, 7);
  const todayResults = calculateOperatingResults(sales, expenses, { period: 'day', value: today });
  const monthResults = calculateOperatingResults(sales, expenses, { period: 'month', value: month });
  const breakEven = calculateMonthlyBreakEven(sales, expenses, month);
  if (todayResults.error || monthResults.error || breakEven.error) {
    return {
      error: todayResults.error || monthResults.error || breakEven.error,
      month,
    };
  }
  if (!Array.isArray(products) || !Array.isArray(ingredients)) {
    return { error: 'Los productos o los ingredientes no tienen un formato válido.', month };
  }

  const currentProductRows = createProductComparisonRows(products, ingredients);
  const highestFoodCost = getBestProduct(currentProductRows, 'foodCostPercent');
  const mostSoldProduct = getMostSoldProduct(sales, products, month);
  if (mostSoldProduct.error) return { error: mostSoldProduct.error, month };

  return {
    today,
    month,
    todayResults,
    monthResults,
    breakEven,
    currentProducts: {
      bestMarginPercent: getBestProduct(currentProductRows, 'marginPercent'),
      highestFoodCost,
      highestMarginAmount: getBestProduct(currentProductRows, 'marginAmount'),
      activeCalculableCount: currentProductRows.filter((row) => row.calculable).length,
    },
    mostSoldProduct: mostSoldProduct.product,
  };
}
