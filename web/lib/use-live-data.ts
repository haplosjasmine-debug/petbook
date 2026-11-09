"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useLiveData<T>(url: string, initial: T, interval = 4_000) {
  const [data, setData] = useState(initial);
  const [live, setLive] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const mounted = useRef(true);

  const load = useCallback(
    async (manual = false) => {
      if (manual) setRefreshing(true);
      try {
        const response = await fetch(url, { cache: "no-store" });
        if (!response.ok) throw new Error("Unable to load live data.");
        const next = (await response.json()) as T;
        if (!mounted.current) return;
        setData(next);
        setLive(true);
        setLastUpdated(new Date());
      } catch {
        if (mounted.current) setLive(false);
      } finally {
        if (manual && mounted.current) setRefreshing(false);
      }
    },
    [url]
  );

  useEffect(() => {
    mounted.current = true;
    void load();
    const timer = window.setInterval(() => void load(), interval);
    return () => {
      mounted.current = false;
      window.clearInterval(timer);
    };
  }, [interval, load]);

  const refresh = useCallback(() => void load(true), [load]);

  return { data, live, refreshing, lastUpdated, refresh };
}
