"use client";

import { useEffect, useRef, useState } from "react";
import { coins as FALLBACK_COINS, type Coin } from "@/lib/market-data";

const REFRESH_MS = 60_000;
const JITTER_MS = 2_500;

/**
 * Real market data fetched from /api/markets (CoinGecko-backed), refreshed
 * every 60s. Starts from the small curated fallback list so the first paint
 * is deterministic (SSR-safe) and never blank while the fetch is in flight.
 * A light client-side jitter runs between refreshes so prices still feel
 * "live" second-to-second rather than only updating once a minute.
 */
export function useCoins(limit = 100): Coin[] {
  const [coins, setCoins] = useState<Coin[]>(() => FALLBACK_COINS.slice(0, limit));
  const limitRef = useRef(limit);
  limitRef.current = limit;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`/api/markets?limit=${limitRef.current}`);
        const data = await res.json();
        if (!cancelled && Array.isArray(data.coins) && data.coins.length > 0) {
          setCoins(data.coins);
        }
      } catch {
        // Keep whatever data we already have (fallback or last good fetch).
      }
    }

    load();
    const refresh = setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(refresh);
    };
  }, [limit]);

  useEffect(() => {
    const jitter = setInterval(() => {
      setCoins((prev) =>
        prev.map((coin) => {
          const drift = (Math.random() - 0.5) * coin.price * 0.003;
          const nextPrice = Math.max(coin.price + drift, 0);
          const nextSparkline = [...coin.sparkline.slice(1), Number(nextPrice.toFixed(8))];
          const changeDelta = coin.price ? (drift / coin.price) * 100 : 0;
          return {
            ...coin,
            price: nextPrice,
            change24h: Number((coin.change24h + changeDelta).toFixed(2)),
            sparkline: nextSparkline,
          };
        })
      );
    }, JITTER_MS);

    return () => clearInterval(jitter);
  }, []);

  return coins;
}
