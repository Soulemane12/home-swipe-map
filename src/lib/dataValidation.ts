import { Listing } from "@/data/mockListings";

export type DataQuality = "high" | "medium" | "low" | "suspect";

export interface ValidationResult {
  valid: boolean;
  quality: DataQuality;
  issues: string[];
}

// Price bounds for outlier detection
const PRICE_BOUNDS = {
  rent: { min: 500, max: 25000 },
  buy: { min: 50000, max: 50000000 },
};

// Coordinate validation
export function isValidCoordinate(lat: number, lng: number): boolean {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    isFinite(lat) &&
    isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180 &&
    // NYC bounding box (loose)
    lat >= 40.4 &&
    lat <= 41.0 &&
    lng >= -74.3 &&
    lng <= -73.6
  );
}

// Price validation and outlier detection
export function validatePrice(
  price: number,
  mode: "rent" | "buy"
): { valid: boolean; outlier: boolean } {
  const bounds = PRICE_BOUNDS[mode];
  if (typeof price !== "number" || !isFinite(price) || price <= 0) {
    return { valid: false, outlier: false };
  }
  const outlier = price < bounds.min || price > bounds.max;
  return { valid: true, outlier };
}

// Parse price from various formats
export function parsePrice(value: any): number | null {
  if (typeof value === "number" && isFinite(value) && value > 0) {
    return value;
  }
  if (typeof value === "string") {
    const cleaned = value.replace(/[$,\s]/g, "");
    const parsed = parseFloat(cleaned);
    if (isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return null;
}

// Generate dedupe key from listing
export function getDedupeKey(listing: {
  lat: number;
  lng: number;
  price: number;
  address?: string;
}): string {
  // Round coordinates to ~10m precision for fuzzy matching
  const latRound = Math.round(listing.lat * 10000) / 10000;
  const lngRound = Math.round(listing.lng * 10000) / 10000;
  const priceRound = Math.round(listing.price / 50) * 50; // Round to nearest $50

  const addressNorm = (listing.address || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 20);

  return `${latRound}|${lngRound}|${priceRound}|${addressNorm}`;
}

// Deduplicate listings by location + price
export function deduplicateListings<T extends { lat: number; lng: number; price: number; address?: string }>(
  listings: T[]
): T[] {
  const seen = new Map<string, T>();

  for (const listing of listings) {
    const key = getDedupeKey(listing);
    if (!seen.has(key)) {
      seen.set(key, listing);
    }
  }

  return Array.from(seen.values());
}

// Validate a single listing and assign quality score
export function validateListing(
  listing: Partial<Listing>,
  mode: "rent" | "buy"
): ValidationResult {
  const issues: string[] = [];

  // Required fields
  if (!listing.id) issues.push("missing_id");
  if (!listing.title && !listing.address) issues.push("missing_title");

  // Coordinate validation
  if (!isValidCoordinate(listing.lat || 0, listing.lng || 0)) {
    issues.push("invalid_coordinates");
  }

  // Price validation
  const priceCheck = validatePrice(listing.price || 0, mode);
  if (!priceCheck.valid) {
    issues.push("invalid_price");
  } else if (priceCheck.outlier) {
    issues.push("price_outlier");
  }

  // Beds/baths sanity
  if (
    typeof listing.beds === "number" &&
    (listing.beds < 0 || listing.beds > 20)
  ) {
    issues.push("suspicious_beds");
  }
  if (
    typeof listing.baths === "number" &&
    (listing.baths < 0 || listing.baths > 15)
  ) {
    issues.push("suspicious_baths");
  }

  // Determine quality tier
  let quality: DataQuality;
  if (issues.length === 0) {
    quality = "high";
  } else if (
    issues.some((i) =>
      ["invalid_coordinates", "invalid_price", "missing_id"].includes(i)
    )
  ) {
    quality = "suspect";
  } else if (issues.some((i) => i.includes("outlier"))) {
    quality = "medium";
  } else {
    quality = "low";
  }

  const valid = !issues.some((i) =>
    ["invalid_coordinates", "invalid_price", "missing_id"].includes(i)
  );

  return { valid, quality, issues };
}

// Filter and validate listings batch
export function validateAndFilterListings(
  listings: Partial<Listing>[],
  mode: "rent" | "buy"
): {
  valid: Listing[];
  rejected: { listing: Partial<Listing>; reason: string }[];
  stats: {
    total: number;
    valid: number;
    rejected: number;
    highQuality: number;
    mediumQuality: number;
    lowQuality: number;
    dedupedCount: number;
  };
} {
  const validated: Listing[] = [];
  const rejected: { listing: Partial<Listing>; reason: string }[] = [];
  const qualityCounts = { high: 0, medium: 0, low: 0, suspect: 0 };

  for (const listing of listings) {
    const result = validateListing(listing, mode);

    if (result.valid) {
      // Add quality field to listing
      validated.push({
        ...listing,
        dataQuality: result.quality,
      } as Listing & { dataQuality: DataQuality });
      qualityCounts[result.quality]++;
    } else {
      rejected.push({
        listing,
        reason: result.issues.join(", "),
      });
    }
  }

  // Deduplicate
  const deduped = deduplicateListings(validated);
  const dedupedCount = validated.length - deduped.length;

  return {
    valid: deduped,
    rejected,
    stats: {
      total: listings.length,
      valid: deduped.length,
      rejected: rejected.length,
      highQuality: qualityCounts.high,
      mediumQuality: qualityCounts.medium,
      lowQuality: qualityCounts.low,
      dedupedCount,
    },
  };
}

// Local filtering for quota protection (filter big fetch locally)
export function filterListingsLocally(
  listings: Listing[],
  filters: {
    priceMin?: number;
    priceMax?: number;
    bedsMin?: number;
    bedsMax?: number;
    bathsMin?: number;
    bathsMax?: number;
    petsRequired?: boolean;
    laundryRequired?: boolean;
    elevatorRequired?: boolean;
    noWalkup?: boolean;
  }
): Listing[] {
  return listings.filter((l) => {
    if (filters.priceMin && l.price < filters.priceMin) return false;
    if (filters.priceMax && l.price > filters.priceMax) return false;
    if (filters.bedsMin && l.beds < filters.bedsMin) return false;
    if (filters.bedsMax && l.beds > filters.bedsMax) return false;
    if (filters.bathsMin && l.baths < filters.bathsMin) return false;
    if (filters.bathsMax && l.baths > filters.bathsMax) return false;
    if (filters.petsRequired && !l.features?.pets) return false;
    if (filters.laundryRequired && !l.features?.laundry) return false;
    if (filters.elevatorRequired && !l.features?.elevator) return false;
    if (filters.noWalkup && l.features?.walkup) return false;
    return true;
  });
}
