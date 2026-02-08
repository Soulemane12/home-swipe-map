import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { Listing } from "@/data/mockListings";
import { AlertCircle } from "lucide-react";

interface MapPanelProps {
  listings: Listing[];
  savedIds: string[];
  selectedListing: Listing | null;
  onSelectListing: (listing: Listing | null) => void;
  uiPadding?: { right?: number; bottom?: number };
}

const validateCoords = (lat: number, lng: number) => {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180
  );
};

export const MapPanel = ({
  listings,
  savedIds,
  selectedListing,
  onSelectListing,
  uiPadding = { right: 0, bottom: 0 },
}: MapPanelProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const didFitBoundsRef = useRef(false);
  const roRef = useRef<ResizeObserver | null>(null);
  
  // Use ref to avoid stale closure issues with onSelectListing
  const onSelectListingRef = useRef(onSelectListing);
  onSelectListingRef.current = onSelectListing;

  const [mapError, setMapError] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const token = import.meta.env.VITE_MAPBOX_TOKEN;

  const rightPadding = uiPadding.right ?? 0;
  const bottomPadding = uiPadding.bottom ?? 0;

  // Filter listings to only those with valid coordinates
  const validListings = useMemo(() => {
    return listings.filter((l) => {
      const lat = typeof l.lat === "number" ? l.lat : NaN;
      const lng = typeof l.lng === "number" ? l.lng : NaN;
      return validateCoords(lat, lng);
    }) as (Listing & { lat: number; lng: number })[];
  }, [listings]);

  // Init map once
  useEffect(() => {
    if (!mapContainer.current) return;

    if (!token) {
      setMapError("Mapbox token missing. Set VITE_MAPBOX_TOKEN in .env.local");
      return;
    }

    if (mapRef.current) return;

    try {
      mapboxgl.accessToken = token;

      const map = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/light-v11",
        center: [-74.006, 40.7128],
        zoom: 11,
      });

      map.addControl(new mapboxgl.NavigationControl(), "top-right");

      map.on("error", () => {
        setMapError("Map failed to load. Check token/network.");
      });

      map.on("load", () => {
        setMapLoaded(true);
      });

      mapRef.current = map;

      // ResizeObserver fixes centering during panel animations
      roRef.current = new ResizeObserver(() => {
        requestAnimationFrame(() => map.resize());
      });
      roRef.current.observe(mapContainer.current);
    } catch {
      setMapError("Failed to initialize map. Check Mapbox token.");
    }

    return () => {
      roRef.current?.disconnect();
      roRef.current = null;

      markersRef.current.forEach((m) => m.remove());
      markersRef.current.clear();

      mapRef.current?.remove();
      mapRef.current = null;

      didFitBoundsRef.current = false;
      setMapLoaded(false);
    };
  }, [token]);

  // Fly to listing with proper padding
  const flyToListing = useCallback((lat: number, lng: number) => {
    const map = mapRef.current;
    if (!map) return;

    const currentZoom = map.getZoom();
    const targetZoom = Math.max(currentZoom, 15);

    // Use padding in easeTo - this tells Mapbox to center the point
    // in the visible area (accounting for UI overlays)
    map.easeTo({
      center: [lng, lat],
      zoom: targetZoom,
      duration: 500,
      essential: true,
      padding: {
        top: 60,
        left: 60,
        right: rightPadding + 60,
        bottom: bottomPadding + 60
      }
    });
  }, [rightPadding, bottomPadding]);

  // Render markers when listings/savedIds change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const ids = new Set(validListings.map((l) => l.id));

    // Remove markers that are no longer in the list
    markersRef.current.forEach((marker, id) => {
      if (!ids.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    });

    // Add/update markers
    validListings.forEach((listing) => {
      const isSaved = savedIds.includes(listing.id);

      // Remove existing marker to recreate with updated state
      const existing = markersRef.current.get(listing.id);
      if (existing) {
        existing.remove();
        markersRef.current.delete(listing.id);
      }

      const el = document.createElement("div");
      el.style.cursor = "pointer";

      const priceLabel =
        listing.price >= 1000
          ? `$${(listing.price / 1000).toFixed(listing.price % 1000 === 0 ? 0 : 1)}K`
          : `$${listing.price}`;

      el.innerHTML = `
        <div style="
          background: ${isSaved ? "hsl(8 85% 62%)" : "white"};
          color: ${isSaved ? "white" : "hsl(220 15% 15%)"};
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          box-shadow: 0 2px 6px rgba(0,0,0,0.12);
          border: 2px solid ${isSaved ? "hsl(8 85% 52%)" : "hsl(220 15% 90%)"};
          white-space: nowrap;
          transform-origin: center bottom;
        ">${priceLabel}</div>
      `;

      el.addEventListener("mouseenter", () => {
        const inner = el.firstElementChild as HTMLElement | null;
        if (inner) inner.style.transform = "scale(1.1)";
      });
      el.addEventListener("mouseleave", () => {
        const inner = el.firstElementChild as HTMLElement | null;
        if (inner) inner.style.transform = "scale(1)";
      });

      el.addEventListener("click", (e) => {
        e.stopPropagation();
        // Use ref to get latest callback
        onSelectListingRef.current(listing);
      });

      const marker = new mapboxgl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([listing.lng, listing.lat])
        .addTo(map);

      markersRef.current.set(listing.id, marker);
    });

    // Fit bounds once on initial load
    if (!didFitBoundsRef.current && validListings.length > 0 && !selectedListing) {
      const bounds = new mapboxgl.LngLatBounds();
      validListings.forEach((l) => bounds.extend([l.lng, l.lat]));
      map.fitBounds(bounds, {
        padding: { right: rightPadding + 60, top: 60, left: 60, bottom: bottomPadding + 60 },
        maxZoom: 14,
        duration: 0
      });
      didFitBoundsRef.current = true;
    }
  }, [validListings, savedIds, mapLoaded, rightPadding, bottomPadding, selectedListing]);

  // Style selected marker + fly when selection changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    // Update marker styles
    markersRef.current.forEach((marker, id) => {
      const el = marker.getElement();
      const inner = el.firstElementChild as HTMLElement | null;
      if (!inner) return;

      const isSelected = selectedListing?.id === id;
      const isSaved = savedIds.includes(id);

      inner.style.border = `2px solid ${
        isSelected ? "hsl(221 83% 53%)" : isSaved ? "hsl(8 85% 52%)" : "hsl(220 15% 90%)"
      }`;
      inner.style.transform = isSelected ? "scale(1.08)" : "scale(1)";
      
      // Bring selected marker to front
      if (isSelected) {
        el.style.zIndex = "1000";
      } else {
        el.style.zIndex = "";
      }
    });

    // Fly to selected listing
    if (selectedListing) {
      const lat = selectedListing.lat;
      const lng = selectedListing.lng;

      if (validateCoords(lat, lng)) {
        flyToListing(lat, lng);
      }
    }
  }, [selectedListing, savedIds, mapLoaded, flyToListing]);

  if (mapError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 rounded-2xl bg-muted p-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <div>
          <h3 className="mb-2 text-lg font-semibold">Map Unavailable</h3>
          <p className="text-sm text-muted-foreground">{mapError}</p>
        </div>
        <code className="rounded-lg bg-secondary px-3 py-2 text-xs">
          VITE_MAPBOX_TOKEN=your_token_here
        </code>
      </div>
    );
  }

  return <div ref={mapContainer} className="h-full w-full rounded-2xl overflow-hidden" />;
};