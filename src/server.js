import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";
import { analyzeMarket } from "./strategy.js";
import { evaluateRisk } from "./risk.js";

const app = express();
const port = Number(process.env.PORT || 3000);
const apiKey = process.env.API_KEY || "";
const store = new Map();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json({ limit: "1mb" }));

function requireApiKey(req, res, next) {
  if (!apiKey) return next();
  if (req.get("x-api-key") !== apiKey) return res.status(401).json({ error: "Unauthorized" });
  next();
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, mode: "analysis-only", liveTrading: false });
});

app.get("/api/config", (_req, res) => {
  res.json({
    defaultSymbol: process.env.DEFAULT_SYMBOL || "NIFTY",
    strikeStep: Number(process.env.STRIKE_STEP || 50),
    lotSize: Number(process.env.LOT_SIZE || 65),
    liveTrading: false
  });
});

app.use("/api", requireApiKey);

app.post("/api/candles", (req, res) => {
  const { symbol = "NIFTY", candle } = req.body || {};
  if (!candle) return res.status(400).json({ error: "candle is required" });
  const list = store.get(symbol) || [];
  list.push(candle);
  store.set(symbol, list.slice(-500));
  res.json({ ok: true, symbol, count: store.get(symbol).length });
});

app.post("/api/candles/batch", (req, res) => {
  const { symbol = "NIFTY", candles } = req.body || {};
  if (!Array.isArray(candles)) return res.status(400).json({ error: "candles[] is required" });
  store.set(symbol, candles.slice(-500));
  res.json({ ok: true, symbol, count: store.get(symbol).length });
});

app.post("/api/analyze", (req, res) => {
  try {
    const {
      symbol = "NIFTY",
      candles,
      capital = 100000,
      dailyPnl = 0,
      tradesToday = 0,
      optionPremium
    } = req.body || {};

    const data = Array.isArray(candles) ? candles : (store.get(symbol) || []);
    const signal = analyzeMarket(data, {
      symbol,
      strikeStep: Number(process.env.STRIKE_STEP || 50)
    });

    const risk = evaluateRisk({
      capital,
      dailyPnl,
      tradesToday,
      optionPremium,
      lotSize: Number(process.env.LOT_SIZE || 65),
      maxRiskPct: Number(process.env.MAX_RISK_PCT || 0.005),
      maxDailyLossPct: Number(process.env.MAX_DAILY_LOSS_PCT || 0.02),
      maxTradesPerDay: Number(process.env.MAX_TRADES_PER_DAY || 5)
    });

    if (!risk.allowed) signal.action = "WAIT";

    res.json({ signal, risk });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get("/api/signal/:symbol", (req, res) => {
  try {
    const symbol = req.params.symbol;
    const candles = store.get(symbol) || [];
    const signal = analyzeMarket(candles, {
      symbol,
      strikeStep: Number(process.env.STRIKE_STEP || 50)
    });
    res.json(signal);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.static(path.join(__dirname, "..", "public")));

app.listen(port, () => {
  console.log(`AI Day Trading Assistant running on http://localhost:${port}`);
  console.log("Mode: analysis-only / paper-trading support. No live order execution.");
});
