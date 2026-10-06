import { ema, rsi, atr, vwap, average } from "./indicators.js";

const round = (n, d = 2) => Number(n.toFixed(d));

function validateCandles(candles) {
  if (!Array.isArray(candles) || candles.length < 25) {
    throw new Error("At least 25 candles are required.");
  }
  for (const c of candles) {
    for (const k of ["open", "high", "low", "close"]) {
      if (!Number.isFinite(Number(c[k]))) throw new Error(`Invalid candle field: ${k}`);
    }
  }
}

function nearestStrike(spot, step) {
  return Math.round(spot / step) * step;
}

export function analyzeMarket(candles, {
  strikeStep = 50,
  symbol = "NIFTY"
} = {}) {
  validateCandles(candles);

  const closes = candles.map(c => Number(c.close));
  const volumes = candles.map(c => Number(c.volume || 0));
  const ema9s = ema(closes, 9);
  const ema21s = ema(closes, 21);

  const last = candles.at(-1);
  const prev = candles.at(-2);
  const spot = Number(last.close);
  const ema9 = ema9s.at(-1);
  const ema21 = ema21s.at(-1);
  const currentRsi = rsi(closes, 14);
  const currentAtr = atr(candles, 14) || Math.max(spot * 0.0015, 1);
  const currentVwap = vwap(candles);

  const lookback = candles.slice(-11, -1);
  const recentHigh = Math.max(...lookback.map(c => Number(c.high)));
  const recentLow = Math.min(...lookback.map(c => Number(c.low)));

  const avgVolume = average(volumes.slice(-11, -1).filter(v => v > 0));
  const volumeRatio = avgVolume > 0 ? Number(last.volume || 0) / avgVolume : 1;

  const range = Math.max(Number(last.high) - Number(last.low), 0.01);
  const body = Math.abs(Number(last.close) - Number(last.open));
  const bodyRatio = body / range;

  let callScore = 0;
  let putScore = 0;
  const reasons = [];

  if (spot > ema9 && ema9 > ema21) {
    callScore += 2;
    reasons.push("Bullish EMA alignment");
  }
  if (spot < ema9 && ema9 < ema21) {
    putScore += 2;
    reasons.push("Bearish EMA alignment");
  }

  if (currentRsi != null && currentRsi >= 55) callScore += 1;
  if (currentRsi != null && currentRsi <= 45) putScore += 1;

  if (spot > currentVwap) callScore += 1;
  if (spot < currentVwap) putScore += 1;

  if (spot > recentHigh) {
    callScore += volumeRatio >= 1.1 ? 2 : 1;
    reasons.push("Breakout above recent high");
  }
  if (spot < recentLow) {
    putScore += volumeRatio >= 1.1 ? 2 : 1;
    reasons.push("Breakdown below recent low");
  }

  if (last.close > last.open && bodyRatio >= 0.6 && last.close > prev.close) callScore += 1;
  if (last.close < last.open && bodyRatio >= 0.6 && last.close < prev.close) putScore += 1;

  const margin = Math.abs(callScore - putScore);
  let action = "WAIT";
  if (callScore >= 4 && callScore > putScore && margin >= 2) action = "CE";
  if (putScore >= 4 && putScore > callScore && margin >= 2) action = "PE";

  const maxScore = Math.max(callScore, putScore);
  const confidence = Math.min(95, 50 + maxScore * 7 + margin * 3);

  let stopSpot = null;
  let targets = [];
  if (action === "CE") {
    stopSpot = Math.min(spot - currentAtr * 0.8, recentLow);
    targets = [spot + currentAtr * 0.8, spot + currentAtr * 1.5];
  } else if (action === "PE") {
    stopSpot = Math.max(spot + currentAtr * 0.8, recentHigh);
    targets = [spot - currentAtr * 0.8, spot - currentAtr * 1.5];
  }

  const strike = nearestStrike(spot, Number(strikeStep));

  return {
    symbol,
    timeframe: "3m",
    action,
    option: action === "WAIT" ? null : `${strike} ${action}`,
    strike: action === "WAIT" ? null : strike,
    spot: round(spot),
    confidence: Math.round(confidence),
    scores: { call: callScore, put: putScore },
    levels: {
      recentHigh: round(recentHigh),
      recentLow: round(recentLow),
      vwap: round(currentVwap),
      ema9: round(ema9),
      ema21: round(ema21),
      rsi14: currentRsi == null ? null : round(currentRsi),
      atr14: round(currentAtr)
    },
    tradePlan: action === "WAIT" ? null : {
      entrySpot: round(spot),
      stopSpot: round(stopSpot),
      targets: targets.map(v => round(v))
    },
    reasons,
    note: "Decision support only. Use manual confirmation and broker-side stop loss."
  };
}
