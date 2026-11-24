import { useState, useEffect, useCallback } from "react";
import { cpApi, type CP } from "../api";

/**
 * Fetches all CPs from the backend and keeps them in sync.
 * Returns the list, a loading flag, and a refresh function.
 */
export function useCPs() {
  const [cps, setCps] = useState<CP[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const list = await cpApi.getAll();
      setCps(list);
    } catch {
      // If backend is unreachable, silently fall back to an empty list
      setCps([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { cps, loading, refresh };
}
