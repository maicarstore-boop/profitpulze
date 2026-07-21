"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  ColorType,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";
import { FiBarChart2 } from "react-icons/fi";
import {
  generateCandles,
  volumeFromCandles,
  nextCandleTick,
  TIMEFRAMES,
  type Timeframe,
  type Candle,
} from "@/lib/candles";
import { formatPrice } from "@/lib/market-data";
import { cn } from "@/lib/utils";

function readThemeColors() {
  const styles = getComputedStyle(document.documentElement);
  const read = (name: string) => styles.getPropertyValue(name).trim();
  return {
    background: read("--card") || "#181a20",
    text: read("--muted-foreground") || "#848e9c",
    grid: read("--border") || "#2b3139",
    success: read("--success") || "#0ecb81",
    danger: read("--danger") || "#f6465d",
  };
}

export function CandlestickChart({
  symbol,
  price,
  positive,
}: {
  symbol: string;
  price: number;
  positive: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const lastCandleRef = useRef<Candle | null>(null);
  const priceRef = useRef(price);
  const { resolvedTheme } = useTheme();
  const [timeframe, setTimeframe] = useState<Timeframe>("1D");
  const [ohlc, setOhlc] = useState<Candle | null>(null);

  priceRef.current = price;

  // Create the chart once on mount.
  useEffect(() => {
    if (!containerRef.current) return;

    const colors = readThemeColors();
    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: colors.text,
        fontSize: 11,
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { visible: false },
      },
      rightPriceScale: { borderColor: colors.grid },
      timeScale: { borderColor: colors.grid, timeVisible: true, secondsVisible: false },
      crosshair: { mode: 0 },
      autoSize: true,
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: colors.success,
      downColor: colors.danger,
      borderVisible: false,
      wickUpColor: colors.success,
      wickDownColor: colors.danger,
      priceFormat: { type: "price", precision: price >= 1 ? 2 : 8, minMove: price >= 1 ? 0.01 : 0.00000001 },
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
    });
    volumeSeries.priceScale().applyOptions({ scaleMargins: { top: 0.85, bottom: 0 } });
    candleSeries.priceScale().applyOptions({ scaleMargins: { top: 0.08, bottom: 0.2 } });

    chart.subscribeCrosshairMove((param) => {
      const point = param.seriesData.get(candleSeries) as Candle | undefined;
      setOhlc(point ?? lastCandleRef.current);
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    return () => {
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-theme the chart when the color theme changes.
  useEffect(() => {
    if (!chartRef.current) return;
    const colors = readThemeColors();
    chartRef.current.applyOptions({
      layout: { textColor: colors.text },
      rightPriceScale: { borderColor: colors.grid },
      timeScale: { borderColor: colors.grid },
    });
    candleSeriesRef.current?.applyOptions({
      upColor: colors.success,
      downColor: colors.danger,
      wickUpColor: colors.success,
      wickDownColor: colors.danger,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedTheme]);

  // (Re)generate the candle history whenever the symbol or timeframe changes.
  useEffect(() => {
    if (!candleSeriesRef.current || !volumeSeriesRef.current) return;

    const candles = generateCandles(priceRef.current, timeframe);
    const volume = volumeFromCandles(candles, priceRef.current > 1000 ? 40 : priceRef.current > 10 ? 800 : 500_000);

    candleSeriesRef.current.setData(candles as unknown as { time: UTCTimestamp; open: number; high: number; low: number; close: number }[]);
    volumeSeriesRef.current.setData(volume as unknown as { time: UTCTimestamp; value: number; color: string }[]);

    lastCandleRef.current = candles.at(-1) ?? null;
    setOhlc(lastCandleRef.current);

    // The flex/grid layout can still be settling its final width on first
    // paint, so fitContent() called synchronously here can compute a range
    // against a stale (too-narrow) container size. Deferring by a frame (and
    // once more shortly after, as a safety net for slower layouts) ensures
    // it runs against the real, final size.
    const raf = requestAnimationFrame(() => chartRef.current?.timeScale().fitContent());
    const timeout = setTimeout(() => chartRef.current?.timeScale().fitContent(), 150);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, timeframe]);

  // Simulate live intra-candle price movement.
  useEffect(() => {
    const interval = setInterval(() => {
      if (!lastCandleRef.current || !candleSeriesRef.current || !volumeSeriesRef.current) return;
      const updated = nextCandleTick(lastCandleRef.current, priceRef.current);
      lastCandleRef.current = updated;
      candleSeriesRef.current.update(updated as unknown as { time: UTCTimestamp; open: number; high: number; low: number; close: number });
      volumeSeriesRef.current.update({
        time: updated.time as UTCTimestamp,
        value: Math.random() * (priceRef.current > 1000 ? 40 : priceRef.current > 10 ? 800 : 500_000),
        color: updated.close >= updated.open ? "rgba(14, 203, 129, 0.5)" : "rgba(246, 70, 93, 0.5)",
      });
      setOhlc(updated);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="rounded-2xl border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <FiBarChart2 className="h-3.5 w-3.5" />
            {symbol}/USDT
          </span>
          {ohlc && (
            <span className={cn("font-mono", positive ? "text-success" : "text-danger")}>
              O <span className="text-foreground">{formatPrice(ohlc.open)}</span> H{" "}
              <span className="text-foreground">{formatPrice(ohlc.high)}</span> L{" "}
              <span className="text-foreground">{formatPrice(ohlc.low)}</span> C{" "}
              <span className="text-foreground">{formatPrice(ohlc.close)}</span>
            </span>
          )}
        </div>
        <div className="flex gap-1">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={cn(
                "rounded-md px-2 py-1 text-xs font-medium transition-colors",
                tf === timeframe ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
              )}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>
      <div ref={containerRef} className="h-[420px]" />
    </div>
  );
}
