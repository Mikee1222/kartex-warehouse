"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { formatRelativeTimeEl } from "@/lib/format/relative-time";

const REFRESH_MS = 60_000;

export function useAutoRefresh(
  loadFn: () => void | Promise<void>,
  options?: { intervalMs?: number; initialLoad?: boolean },
) {
  const intervalMs = options?.intervalMs ?? REFRESH_MS;
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const loadRef = useRef(loadFn);
  loadRef.current = loadFn;

  const refresh = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      await loadRef.current();
      setLastUpdated(new Date());
    } finally {
      if (!silent) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (options?.initialLoad !== false) {
      void refresh(true);
    }
    const id = setInterval(() => void refresh(true), intervalMs);
    return () => clearInterval(id);
  }, [refresh, intervalMs, options?.initialLoad]);

  const lastUpdatedLabel = lastUpdated
    ? formatRelativeTimeEl(lastUpdated.toISOString())
    : "—";

  return { lastUpdated, lastUpdatedLabel, refreshing, refresh };
}
