import { useEffect, useRef, useState, useCallback } from "react";
import {
  fetchRemoteListings,
  stableKey,
  type RemoteFilters,
  type FetchResult,
} from "@/lib/listingsRemote";

export interface RemoteListingsState {
  data: any;
  error: string | null;
  loading: boolean;
  fromCache: boolean;
  stale: boolean;
  refreshing: boolean;
}

export function useRemoteListings(
  filters: RemoteFilters,
  debounceMs = 350
): RemoteListingsState {
  const [state, setState] = useState<RemoteListingsState>({
    data: null,
    error: null,
    loading: false,
    fromCache: false,
    stale: false,
    refreshing: false,
  });

  const abortRef = useRef<AbortController | null>(null);
  const filterKey = stableKey(filters);

  // Listen for background refresh events
  const handleRefresh = useCallback(
    (event: CustomEvent<{ key: string; data: any }>) => {
      if (event.detail.key === filterKey) {
        setState((prev) => ({
          ...prev,
          data: event.detail.data,
          stale: false,
          refreshing: false,
          fromCache: true,
        }));
      }
    },
    [filterKey]
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.addEventListener(
        "listings-refreshed",
        handleRefresh as EventListener
      );
      return () => {
        window.removeEventListener(
          "listings-refreshed",
          handleRefresh as EventListener
        );
      };
    }
  }, [handleRefresh]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      // Abort previous request
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;

      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const result: FetchResult = await fetchRemoteListings(
          filters,
          ac.signal
        );

        setState({
          data: result.data,
          error: null,
          loading: false,
          fromCache: result.fromCache,
          stale: result.stale,
          refreshing: result.refreshing,
        });
      } catch (e) {
        const message = String(e);
        // Ignore abort errors
        if (!message.includes("AbortError") && !message.includes("abort")) {
          setState((prev) => ({
            ...prev,
            error: message,
            loading: false,
          }));
        }
      }
    }, debounceMs);

    return () => {
      clearTimeout(timer);
      abortRef.current?.abort();
    };
  }, [filterKey, debounceMs]);

  return state;
}
