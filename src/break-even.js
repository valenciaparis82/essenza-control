import { calculateOperatingResults } from './results.js';

export function calculateMonthlyBreakEven(sales, expenses, month) {
  // Reutilizamos Resultados para no duplicar las fórmulas de ventas y gastos.
  // El equilibrio es mensual y se calcula solo con lo ya registrado.
  const monthlyResults = calculateOperatingResults(sales, expenses, {
    period: 'month',
    value: month,
  });
  if (monthlyResults.error) return { error: monthlyResults.error };

  const {
    revenue,
    productCost,
    fixedExpenses,
    variableExpenses,
    saleCount,
    expenseCount,
  } = monthlyResults;
  // El margen de contribución es lo disponible para cubrir gastos fijos tras
  // descontar el coste vendido y los gastos variables.
  const contributionMargin = revenue - productCost - variableExpenses;

  if (!Number.isFinite(contributionMargin)) {
    return { error: 'El punto de equilibrio es demasiado grande para calcularlo.' };
  }

  // Devolvemos una estructura completa incluso cuando no hay cálculo posible.
  // Así la interfaz puede explicar el motivo sin inventar cifras.
  const baseResult = {
    revenue,
    productCost,
    variableExpenses,
    contributionMargin,
    contributionMarginPercent: null,
    fixedExpenses,
    breakEvenRevenue: null,
    actualRevenue: revenue,
    difference: null,
    attainmentPercent: null,
    status: 'not-calculable',
    reason: revenue === 0 ? 'no-revenue' : null,
    saleCount,
    expenseCount,
  };

  // Sin ingresos no existe un porcentaje de contribución fiable que permita
  // estimar la facturación necesaria para el equilibrio.
  if (revenue === 0) return baseResult;

  const contributionMarginPercent = contributionMargin / revenue;
  if (!Number.isFinite(contributionMarginPercent)) {
    return { error: 'El porcentaje de margen de contribución no se puede calcular.' };
  }
  baseResult.contributionMarginPercent = contributionMarginPercent * 100;

  if (contributionMarginPercent <= 0) {
    return {
      ...baseResult,
      reason: contributionMarginPercent === 0
        ? 'non-positive-contribution'
        : 'negative-contribution',
    };
  }

  // Facturación necesaria = gastos fijos / margen de contribución decimal.
  const breakEvenRevenue = fixedExpenses / contributionMarginPercent;
  const difference = revenue - breakEvenRevenue;
  if (![breakEvenRevenue, difference].every(Number.isFinite)) {
    return { error: 'El punto de equilibrio es demasiado grande para calcularlo.' };
  }

  if (breakEvenRevenue === 0) {
    return {
      ...baseResult,
      contributionMarginPercent: contributionMarginPercent * 100,
      breakEvenRevenue,
      difference,
      status: difference > 0 ? 'exceeded' : 'reached',
      reason: null,
    };
  }

  const attainmentPercent = (revenue / breakEvenRevenue) * 100;
  if (!Number.isFinite(attainmentPercent)) {
    return { error: 'El porcentaje alcanzado es demasiado grande para calcularlo.' };
  }

  return {
    ...baseResult,
    contributionMarginPercent: contributionMarginPercent * 100,
    breakEvenRevenue,
    difference,
    attainmentPercent,
    status: difference < 0 ? 'below' : difference > 0 ? 'exceeded' : 'reached',
    reason: null,
  };
}
