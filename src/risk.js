export function evaluateRisk({
  capital,
  dailyPnl = 0,
  tradesToday = 0,
  maxRiskPct = 0.005,
  maxDailyLossPct = 0.02,
  maxTradesPerDay = 5,
  optionPremium,
  lotSize = 65,
  premiumStopPct = 0.2
}) {
  const cap = Number(capital || 0);
  if (!(cap > 0)) {
    return { allowed: false, reason: "Capital must be greater than zero." };
  }

  const maxDailyLoss = cap * maxDailyLossPct;
  if (Number(dailyPnl) <= -maxDailyLoss) {
    return { allowed: false, reason: "Daily loss limit reached.", maxDailyLoss };
  }

  if (Number(tradesToday) >= maxTradesPerDay) {
    return { allowed: false, reason: "Maximum trades for the day reached." };
  }

  const maxRisk = cap * maxRiskPct;
  let suggestedQty = null;

  if (Number(optionPremium) > 0) {
    const riskPerUnit = Number(optionPremium) * premiumStopPct;
    const rawUnits = Math.floor(maxRisk / riskPerUnit);
    const lots = Math.max(0, Math.floor(rawUnits / lotSize));
    suggestedQty = lots * lotSize;
  }

  return {
    allowed: true,
    maxRisk: Number(maxRisk.toFixed(2)),
    maxDailyLoss: Number(maxDailyLoss.toFixed(2)),
    suggestedQty,
    note: suggestedQty === 0 ? "Risk budget is too small for one lot at the supplied premium." : undefined
  };
}
