import type { Listing, DataQuality } from "@/data/mockListings";
import { isValidCoordinate, validatePrice } from "./dataValidation";

const toNumber = (v: any) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};


const seededRandom = (seed: string) => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
  }
  const x = Math.sin(h) * 10000;
  return x - Math.floor(x);
};

// Assess data quality based on completeness and validity
function assessQuality(x: any, lat: number, lng: number, price: number, mode: "rent" | "buy"): DataQuality {
  const issues: string[] = [];

  // Coordinate validation
  if (!isValidCoordinate(lat, lng)) {
    return "suspect";
  }

  // Price validation
  const priceCheck = validatePrice(price, mode);
  if (!priceCheck.valid) return "suspect";
  if (priceCheck.outlier) issues.push("price_outlier");

  // Missing important fields
  if (!x.formattedAddress && !x.addressLine1) issues.push("no_address");
  if (!x.bedrooms && !x.beds) issues.push("no_beds");
  if (!x.photos || x.photos.length === 0) issues.push("no_photos");
  if (!x.squareFootage) issues.push("no_sqft");

  if (issues.length === 0) return "high";
  if (issues.length <= 2) return "medium";
  return "low";
}

export function rentcastToListing(x: any, mode: "rent" | "buy"): Listing & {
  externalUrl: string;
  agentUrl?: string;
  officeUrl?: string;
  source: "rentcast";
} {
  const lat = toNumber(x.latitude);
  const lng = toNumber(x.longitude);
  const price = toNumber(x.price ?? x.rent ?? 0);

  const address =
    x.formattedAddress ||
    [x.addressLine1, x.city, x.state, x.zipCode].filter(Boolean).join(", ").trim();

  const neighborhood = x.neighborhood || x.subdivision || x.city || x.county;

  const title =
    x.listingTitle ||
    x.propertyDescription ||
    (address && `${mode === "buy" ? "For Sale" : "For Rent"} · ${address}`);

  const description = x.publicRemarks || x.description || x.propertyDescription;

  const externalUrl = address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}`;

  const seed = String(x.id ?? address ?? `${lat}-${lng}-${mode}`);
  const fallbackPhoto = `https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&h=800&fit=crop&q=80&sig=${Math.abs(Math.round(seededRandom(seed) * 100000))}`;
  const photo = Array.isArray(x.photos) && x.photos.length > 0 ? x.photos[0] : fallbackPhoto;

  const matchScore = Math.min(99, Math.max(50, Math.round(60 + seededRandom(seed) * 30)));
  const why = `Based on your filters in ${neighborhood}`;

  const dataQuality = assessQuality(x, lat, lng, price, mode);

  return {
    id: String(x.id ?? `${lat}-${lng}-${mode}-${Math.random().toString(16).slice(2)}`),
    address,
    title,
    price,
    beds: toNumber(x.bedrooms ?? x.beds),
    baths: toNumber(x.bathrooms ?? x.baths),
    neighborhood,
    lat,
    lng,
    commuteMins: 0, // Will be populated by applyCommuteAddress when user enters address
    features: {
      pets: Boolean(x.petsAllowed),
      laundry: Boolean(x.hasWasherDryer || x.hasLaundry),
      elevator: Boolean(x.hasElevator),
      walkup: !Boolean(x.hasElevator),
    },
    images: photo ? [photo] : [],
    description,
    matchScore,
    why,
    sqft: toNumber(x.squareFootage ?? x.lotSize),
    type: mode === "buy" ? "buy" : "rent",
    externalUrl,
    agentUrl: x.listingAgent?.website || x.listingAgent?.email,
    officeUrl: x.listingOffice?.website,
    source: "rentcast",
    dataQuality,
  };
}
