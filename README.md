# AI Day Trading Assistant

A lightweight **decision-support tool** for intraday NIFTY / Bank NIFTY options. It analyzes 3-minute candles and returns a short signal:

**CE / PE / WAIT — ATM strike — spot stop — quick targets — confidence**

It is designed for local use or deployment on a small server.

> Important: this project does **not** execute real-money trades. It is analysis/paper-trading support only. No strategy can guarantee profit.

## What it uses

- EMA 9 / EMA 21 trend
- RSI 14 momentum
- VWAP
- ATR 14 volatility
- 10-candle breakout / breakdown
- candle body strength
- volume confirmation when volume is available
- risk guardrails: max risk per trade, max daily loss, max trades/day

The LLM/AI layer should explain signals, but the actual trade trigger should remain deterministic and testable.

## Run locally

~~~bash
git clone https://github.com/RupeshBorkar1986/testProject.git
cd testProject
cp .env.example .env
npm install
npm test
npm start
~~~

Open:

~~~text
http://localhost:3000
~~~

Paste at least 25 three-minute candles into the dashboard and press **Analyze**.

## API

### Health

~~~bash
curl http://localhost:3000/api/health
~~~

### Analyze a candle batch

~~~bash
curl -X POST http://localhost:3000/api/analyze \
  -H "content-type: application/json" \
  -d '{
    "symbol":"NIFTY",
    "capital":100000,
    "dailyPnl":0,
    "tradesToday":0,
    "optionPremium":120,
    "candles":[
      {"ts":"2026-10-06T09:15:00+05:30","open":22500,"high":22510,"low":22495,"close":22508,"volume":10000}
    ]
  }'
~~~

You need at least 25 candles; the single candle above only shows the payload format.

### Stream/store candles

Push one candle at a time:

~~~bash
curl -X POST http://localhost:3000/api/candles \
  -H "content-type: application/json" \
  -d '{"symbol":"NIFTY","candle":{"ts":"...","open":1,"high":2,"low":1,"close":2,"volume":100}}'
~~~

Then request the latest signal:

~~~bash
curl http://localhost:3000/api/signal/NIFTY
~~~

## Server / Docker

~~~bash
docker build -t ai-day-trading-assistant .
docker run --rm -p 3000:3000 --env-file .env ai-day-trading-assistant
~~~

For an internet-facing server, set a strong `API_KEY` in `.env` and send it as `x-api-key`.

## Recommended next steps

1. Add a **read-only broker market-data adapter** (Zerodha Kite / Upstox / Angel One, depending on your account).
2. Pull live NIFTY, Bank NIFTY, stock and option-chain data.
3. Add option Greeks, IV, OI change, bid/ask spread and liquidity filters.
4. Add backtesting and a trade journal before changing strategy rules.
5. Add Telegram/WhatsApp/push alerts.
6. Add an AI explanation layer that turns the deterministic output into:
   - BUY CE / BUY PE / WAIT
   - entry
   - stop
   - target
   - reason
7. Keep live order placement behind **manual confirmation** and hard risk limits.

## Risk defaults

- Max risk per trade: **0.5% of capital**
- Max daily loss: **2% of capital**
- Max trades/day: **5**
- No averaging losing options
- Use broker-side stop losses
- Stop trading after the daily-loss limit

Edit these in `.env`.

## Disclaimer

Educational and decision-support software only. Derivatives can lose capital rapidly. Backtest and paper trade first; verify exchange lot sizes, expiry conventions and broker rules before using any signal.
