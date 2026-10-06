import { calculateOperatingResults } from './results.js';

export function calculateMonthlyBreakEven(sales, expenses, month) {
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
  const contributionMargin = revenue - productCost - variableExpenses;

  if (!Number.isFinite(contributionMargin)) {
    return { error: 'El punto de equilibrio es demasiado grande para calcularlo.' };
  }

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
