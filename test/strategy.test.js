import test from "node:test";
import assert from "node:assert/strict";
import { analyzeMarket } from "../src/strategy.js";

function candles(direction = 1) {
  const out = [];
  let p = 22500;
  for (let i = 0; i < 35; i++) {
    const open = p;
    const close = p + direction * (3 + (i % 3));
    out.push({
      ts: new Date(2026, 9, 6, 9, 15 + i * 3).toISOString(),
      open,
      high: Math.max(open, close) + 2,
      low: Math.min(open, close) - 2,
      close,
      volume: 1000 + i * 20
    });
    p = close;
  }
  return out;
}

test("returns a directional signal for a strong trend", () => {
  const bull = analyzeMarket(candles(1));
  const bear = analyzeMarket(candles(-1));
  assert.equal(bull.action, "CE");
  assert.equal(bear.action, "PE");
});
