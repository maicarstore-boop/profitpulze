export interface Candle {
  time: number; // unix seconds
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface VolumeBar {
  time: number;
  value: number;
  color: string;
}

export const TIMEFRAMES = ["15m", "1H", "4H", "1D", "1W"] as const;
export type Timeframe = (typeof TIMEFRAMES)[number];

const INTERVAL_SECONDS: Record<Timeframe, number> = {
  "15m": 15 * 60,
  "1H": 60 * 60,
  "4H": 4 * 60 * 60,
  "1D": 24 * 60 * 60,
  "1W": 7 * 24 * 60 * 60,
};

export function intervalSecondsFor(timeframe: Timeframe) {
  return INTERVAL_SECONDS[timeframe];
}

export function generateCandles(basePrice: number, timeframe: Timeframe, count = 150): Candle[] {
  const interval = INTERVAL_SECONDS[timeframe];
  const volatility = basePrice * 0.008;
  const now = Math.floor(Date.now() / 1000 / interval) * interval;

  const candles: Candle[] = [];
  let prevClose = basePrice * (1 - (Math.random() - 0.5) * 0.06);

  for (let i = count - 1; i >= 0; i--) {
    const time = now - i * interval;
    const open = prevClose;
    const drift = (Math.random() - 0.5) * volatility;
    const close = Math.max(open + drift, basePrice * 0.01);
    const wick = Math.random() * volatility * 0.6;
    const high = Math.max(open, close) + wick;
    const low = Math.max(Math.min(open, close) - wick, 0);

    candles.push({
      time,
      open: Number(open.toFixed(8)),
      high: Number(high.toFixed(8)),
      low: Number(low.toFixed(8)),
      close: Number(close.toFixed(8)),
    });
    prevClose = close;
  }

  return candles;
}

export function volumeFromCandles(candles: Candle[], baseVolume: number): VolumeBar[] {
  return candles.map((candle) => ({
    time: candle.time,
    value: Number((Math.random() * baseVolume + baseVolume * 0.2).toFixed(4)),
    color: candle.close >= candle.open ? "rgba(14, 203, 129, 0.5)" : "rgba(246, 70, 93, 0.5)",
  }));
}

export function nextCandleTick(candle: Candle, basePrice: number): Candle {
  const volatility = basePrice * 0.0015;
  const drift = (Math.random() - 0.5) * volatility;
  const close = Math.max(candle.close + drift, basePrice * 0.01);
  return {
    ...candle,
    close: Number(close.toFixed(8)),
    high: Number(Math.max(candle.high, close).toFixed(8)),
    low: Number(Math.min(candle.low, close).toFixed(8)),
  };
}
