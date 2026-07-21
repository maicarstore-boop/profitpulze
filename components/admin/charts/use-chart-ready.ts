"use client";

import { useEffect, useState } from "react";

/**
 * Recharts' ResponsiveContainer measures its parent via ResizeObserver on mount.
 * When several charts mount at once inside a CSS grid (e.g. the Analytics page),
 * the grid's track sizes haven't always settled yet, so the first measurement can
 * be wrong and never gets corrected. Delaying the chart's first paint by a frame
 * ensures the grid has already resolved its layout before Recharts measures it.
 */
export function useChartReady() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return ready;
}
