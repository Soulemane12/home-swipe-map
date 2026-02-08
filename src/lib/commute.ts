import type { Listing } from "@/data/mockListings";

const COMMUTE_CACHE_KEY = "swipehouse-commute-cache";
const MATRIX_CHUNK_SIZE = 25; // Mapbox Matrix limit per request

export type CommuteMode = "driving" | "walking" | "cycling" | "transit";

const PROFILE_MAP: Record<CommuteMode, string> = {
  driving: "mapbox/driving",
  walking: "mapbox/walking",
  cycling: "mapbox/cycling",
  // Mapbox Matrix has no transit profile; driving is the closest approximation
  transit: "mapbox/driving",
};

type CommuteCacheEntry = {
  address: string;
  idsHash: string;
  profile: CommuteMode;
  durations: Record<string, number>;
  timestamp: number;
};

type LatLng = { lat: number; lng: number };

const isBrowser = typeof window !== "undefined";

export const listingIdsHash = (listings: Listing[]) =>
  listings.map((l) => l.id).join("|");

const loadCache = (address: string, idsHash: string, profile: CommuteMode) => {
  if (!isBrowser) return null;
  try {
    const raw = localStorage.getItem(COMMUTE_CACHE_KEY);
    if (!raw) return null;
    const parsed: CommuteCacheEntry = JSON.parse(raw);
    if (
      parsed.address === address &&
      parsed.idsHash === idsHash &&
      parsed.profile === profile
    ) {
      return parsed.durations;
    }
  } catch {
    return null;
  }
  return null;
};

const saveCache = (
  address: string,
  idsHash: string,
  profile: CommuteMode,
  durations: Record<string, number>
) => {
  if (!isBrowser) return;
  try {
    const payload: CommuteCacheEntry = {
      address,
      idsHash,
      profile,
      durations,
      timestamp: Date.now(),
    };
    localStorage.setItem(COMMUTE_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // ignore storage failures
  }
};

const geocodeAddress = async (
  address: string,
  token: string
): Promise<LatLng | null> => {
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
    address
  )}.json?limit=1&access_token=${token}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    const center = json?.features?.[0]?.center;
    if (!Array.isArray(center) || center.length < 2) return null;
    const [lng, lat] = center;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
  } catch {
    return null;
  }
};

const chunk = <T,>(arr: T[], size: number) => {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
};

const fetchMatrixDurations = async (
  origins: (Listing & { lat: number; lng: number })[],
  dest: LatLng,
  token: string,
  profile: CommuteMode
): Promise<Record<string, number>> => {
  const durations: Record<string, number> = {};
  const originChunks = chunk(origins, MATRIX_CHUNK_SIZE);
  const profilePath = PROFILE_MAP[profile] || PROFILE_MAP.driving;

  for (const originChunk of originChunks) {
    const coords = [
      ...originChunk.map((o) => `${o.lng},${o.lat}`),
      `${dest.lng},${dest.lat}`,
    ].join(";");

    const sources = originChunk.map((_, idx) => idx).join(";");
    const destIndex = originChunk.length; // destination is last coordinate

    const url = `https://api.mapbox.com/directions-matrix/v1/${profilePath}/${coords}?sources=${sources}&destinations=${destIndex}&annotations=duration&access_token=${token}`;

    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const json = await res.json();
      const matrix: number[][] | undefined = json?.durations;
      if (!Array.isArray(matrix)) continue;

      originChunk.forEach((origin, idx) => {
        const seconds = matrix?.[idx]?.[0];
        if (Number.isFinite(seconds)) {
          durations[origin.id] = Math.max(1, Math.round(seconds / 60));
        }
      });
    } catch {
      continue;
    }
  }

  return durations;
};

export const getCommuteDurations = async (
  address: string,
  listings: Listing[],
  token: string,
  profile: CommuteMode
): Promise<Record<string, number> | null> => {
  const trimmed = address.trim();
  if (!trimmed || !token || listings.length === 0) return null;

  const idsHash = listingIdsHash(listings);
  const cached = loadCache(trimmed, idsHash, profile);
  if (cached) return cached;

  const validOrigins = listings.filter(
    (l): l is Listing & { lat: number; lng: number } =>
      Number.isFinite(l.lat) && Number.isFinite(l.lng)
  );
  if (validOrigins.length === 0) return null;

  const destination = await geocodeAddress(trimmed, token);
  if (!destination) return null;

  const durations = await fetchMatrixDurations(
    validOrigins,
    destination,
    token,
    profile
  );
  if (Object.keys(durations).length > 0) {
    saveCache(trimmed, idsHash, profile, durations);
    return durations;
  }

  return null;
};
