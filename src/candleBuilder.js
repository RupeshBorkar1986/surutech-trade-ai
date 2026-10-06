const DEFAULT_INTERVAL_MS = 3 * 60 * 1000;

function asTime(value) {
  if (value instanceof Date) return value.getTime();
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed.getTime() : Date.now();
}

export class CandleBuilder {
  constructor({ intervalMs = DEFAULT_INTERVAL_MS, limit = 600 } = {}) {
    this.intervalMs = intervalMs;
    this.limit = limit;
    this.closed = [];
    this.current = null;
  }

  seed(candles = []) {
    this.closed = candles.map(c => ({
      ts: c.ts || c.date,
      open: Number(c.open),
      high: Number(c.high),
      low: Number(c.low),
      close: Number(c.close),
      volume: Number(c.volume || 0)
    })).filter(c => [c.open,c.high,c.low,c.close].every(Number.isFinite)).slice(-this.limit);
    this.current = null;
  }

  addTick(price, timestamp = new Date()) {
    const p = Number(price);
    if (!Number.isFinite(p)) return null;
    const ms = asTime(timestamp);
    const start = Math.floor(ms / this.intervalMs) * this.intervalMs;

    if (!this.current || this.current.start !== start) {
      let closed = null;
      if (this.current) {
        closed = {
          ts: new Date(this.current.start).toISOString(),
          open: this.current.open,
          high: this.current.high,
          low: this.current.low,
          close: this.current.close,
          volume: 0
        };
        this.closed.push(closed);
        this.closed = this.closed.slice(-this.limit);
      }
      this.current = { start, open:p, high:p, low:p, close:p };
      return closed;
    }

    this.current.high = Math.max(this.current.high, p);
    this.current.low = Math.min(this.current.low, p);
    this.current.close = p;
    return null;
  }

  getCandles(includeCurrent = true) {
    const rows = [...this.closed];
    if (includeCurrent && this.current) {
      rows.push({
        ts:new Date(this.current.start).toISOString(),
        open:this.current.open,
        high:this.current.high,
        low:this.current.low,
        close:this.current.close,
        volume:0
      });
    }
    return rows.slice(-this.limit);
  }
}
