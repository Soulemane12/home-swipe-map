export type Mode = "rent" | "buy";

export type RemoteFilters = {
  mode: Mode;
  city?: string;
  state?: string;
  latitude?: string;
  longitude?: string;
  radius?: string;
  price?: string;
  bedrooms?: string;
  bathrooms?: string;
  limit?: number;
  offset?: number;
};

export const DEFAULT_REMOTE_FILTERS: RemoteFilters = {
  mode: "rent",
  latitude: "40.7128",  // NYC center
  longitude: "-74.0060",
  radius: "15",  // 15 miles covers all 5 boroughs
  price: "2200-5200",
  bedrooms: "1-3",
  bathrooms: "1-2",
  limit: 50, // Fetch more, filter locally for quota protection
};

// Cache configuration
const CACHE_KEY = "remote_listings_cache_v2";
const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours - quota protection
const STALE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days - stale but usable
const BG_REFRESH_MS = 30 * 60 * 1000; // 30 min background refresh threshold

type CacheEntry = {
  t: number; // timestamp
  data: any;
  refreshing?: boolean;
};
type CacheMap = Record<string, CacheEntry>;

// Sorted params for stable cache keys
export function stableKey(f: RemoteFilters): string {
  const ordered = Object.keys(f)
    .sort()
    .reduce<Record<string, unknown>>((acc, key) => {
      const val = f[key as keyof RemoteFilters];
      if (val !== undefined && val !== null && val !== "") acc[key] = val;
      return acc;
    }, {});
  return JSON.stringify(ordered);
}

function loadCache(): CacheMap {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveCache(m: CacheMap) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(m));
  } catch {
    // Storage quota exceeded - clear old entries
    const keys = Object.keys(m).sort((a, b) => (m[a].t || 0) - (m[b].t || 0));
    if (keys.length > 1) {
      delete m[keys[0]];
      saveCache(m);
    }
  }
}

// Background refresh without blocking UI
async function backgroundRefresh(
  filters: RemoteFilters,
  key: string,
  cache: CacheMap
) {
  if (cache[key]?.refreshing) return; // Already refreshing

  cache[key] = { ...cache[key], refreshing: true };
  saveCache(cache);

  try {
    const data = await fetchFromAPI(filters);
    cache[key] = { t: Date.now(), data, refreshing: false };
    saveCache(cache);

    // Dispatch event for listeners
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("listings-refreshed", { detail: { key, data } })
      );
    }
  } catch {
    cache[key] = { ...cache[key], refreshing: false };
    saveCache(cache);
  }
}

async function fetchFromAPI(
  filters: RemoteFilters,
  signal?: AbortSignal
): Promise<any> {
  const envBase =
    typeof import.meta !== "undefined"
      ? (import.meta as any).env?.VITE_RENTCAST_PROXY_URL
      : null;

  const origin =
    envBase ||
    (typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : "http://localhost:5173");

  const url = new URL("/api/listings", origin);
  Object.entries(filters).forEach(([k, v]) => {
    if (v == null || v === "") return;
    url.searchParams.set(k, String(v));
  });

  const r = await fetch(url.toString(), { signal });
  if (!r.ok) {
    throw new Error(`Remote listings failed (${r.status})`);
  }
  return r.json();
}

export type FetchResult = {
  data: any;
  fromCache: boolean;
  stale: boolean;
  refreshing: boolean;
};

/**
 * Stale-While-Revalidate fetch strategy:
 * 1. Return cached data immediately if available (even if stale)
 * 2. Trigger background refresh if data is older than BG_REFRESH_MS
 * 3. Only block on network if no cache exists
 */
export async function fetchRemoteListings(
  filters: RemoteFilters,
  signal?: AbortSignal
): Promise<FetchResult> {
  const key = stableKey(filters);
  const cache = loadCache();
  const hit = cache[key];
  const now = Date.now();

  // Fresh cache - return immediately
  if (hit && now - hit.t < TTL_MS) {
    // Schedule background refresh if approaching staleness
    if (now - hit.t > BG_REFRESH_MS && !hit.refreshing) {
      backgroundRefresh(filters, key, cache);
    }
    return { data: hit.data, fromCache: true, stale: false, refreshing: false };
  }

  // Stale cache - return immediately but refresh in background
  if (hit && now - hit.t < STALE_TTL_MS) {
    backgroundRefresh(filters, key, cache);
    return {
      data: hit.data,
      fromCache: true,
      stale: true,
      refreshing: true,
    };
  }

  // No usable cache - must fetch
  try {
    const data = await fetchFromAPI(filters, signal);
    cache[key] = { t: now, data, refreshing: false };
    saveCache(cache);
    return { data, fromCache: false, stale: false, refreshing: false };
  } catch (e) {
    // If fetch fails but we have ancient cache, use it
    if (hit) {
      return {
        data: hit.data,
        fromCache: true,
        stale: true,
        refreshing: false,
      };
    }
    throw e;
  }
}

// Clear cache (for debugging/reset)
export function clearListingsCache() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(CACHE_KEY);
  }
}

// Get cache stats
export function getCacheStats(): {
  entries: number;
  oldestAge: number;
  totalSize: number;
} {
  const cache = loadCache();
  const entries = Object.keys(cache).length;
  const ages = Object.values(cache).map((e) => Date.now() - e.t);
  const oldestAge = ages.length ? Math.max(...ages) : 0;
  const totalSize = JSON.stringify(cache).length;
  return { entries, oldestAge, totalSize };
}
