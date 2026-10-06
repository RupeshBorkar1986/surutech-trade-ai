# SuruTech Trade AI

A local-first **intraday market-analysis and paper-trading assistant** for NIFTY / Bank NIFTY.

It produces short decision-support output such as:

**CE / PE / WAIT — ATM strike reference — spot stop — quick targets — confidence**

> This project is for analysis, alerts, paper trading, and risk management. It does not place real-money orders automatically and cannot guarantee profit.

## Current capabilities

- 3-minute candle analysis
- EMA 9 / EMA 21
- RSI 14
- VWAP
- ATR 14
- breakout / breakdown detection
- candle-strength checks
- volume confirmation when data is available
- max-risk-per-trade guardrail
- max-daily-loss guardrail
- max-trades-per-day guardrail
- local web dashboard
- Docker support

## Run locally

~~~bash
git clone https://github.com/RupeshBorkar1986/surutech-trade-ai.git
cd surutech-trade-ai
cp .env.example .env
npm install
npm test
npm start
~~~

Open:

~~~text
http://localhost:3000
~~~

## Zerodha credentials

The existing `API_KEY` variable protects SuruTech Trade AI's own local API. It is **not** the Zerodha API key.

Put your Zerodha Kite Connect credentials only in your local `.env` file:

~~~env
KITE_API_KEY=your_zerodha_api_key
KITE_API_SECRET=your_zerodha_api_secret
KITE_REDIRECT_URL=http://localhost:3000/auth/zerodha/callback
KITE_ACCESS_TOKEN=
~~~

Do not commit your real Zerodha API key, API secret, request token, access token, password, PIN, OTP, cookies, or session data to GitHub.

## Tomorrow's test plan

1. Start the local server before market open.
2. Use paper / observation mode first.
3. Compare CE / PE / WAIT output with the live NIFTY chart.
4. Record false breakouts, entry timing, stop distance, and target behavior.
5. Do not rely on a signal without your own confirmation.
6. Stop testing if the daily-risk limit is reached.

## Roadmap

- Chrome companion extension for Zerodha Kite page monitoring
- local 3-minute candle builder from observed market values
- position / LTP / P&L guidance
- alerts for support, resistance, stop and profit protection
- official Kite Connect login + live market-data integration
- trade journal and backtesting

## Security

Never put Zerodha password, PIN, OTP, cookies, session tokens, or API secret into the browser extension or commit them to GitHub.

## Disclaimer

Educational and decision-support software only. Derivatives can lose capital rapidly. Paper trade and validate the strategy before using real money.
