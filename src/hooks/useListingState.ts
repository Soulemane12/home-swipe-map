import { useState, useEffect, useCallback, useRef } from 'react';
import { Listing, initialListings } from '@/data/mockListings';
import { getCommuteDurations, listingIdsHash, type CommuteMode } from '@/lib/commute';

interface ListingState {
  currentIndex: number;
  liked: string[];
  passed: string[];
}

const STORAGE_KEY = 'swipehouse-state';

const getInitialState = (): ListingState => {
  if (typeof window === 'undefined') {
    return { currentIndex: 0, liked: [], passed: [] };
  }

  // Check if we're in a force-clear scenario
  if (sessionStorage.getItem('force-clear') === 'true') {
    sessionStorage.removeItem('force-clear');
    localStorage.removeItem(STORAGE_KEY);
    return { currentIndex: 0, liked: [], passed: [] };
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      // Migrate old saved data to liked if needed
      if (parsed.saved && Array.isArray(parsed.saved)) {
        const combined = [...new Set([...parsed.liked, ...parsed.saved])];
        return { currentIndex: parsed.currentIndex, liked: combined, passed: parsed.passed };
      }
      return { currentIndex: parsed.currentIndex || 0, liked: parsed.liked || [], passed: parsed.passed || [] };
    } catch {
      return { currentIndex: 0, liked: [], passed: [] };
    }
  }
  return { currentIndex: 0, liked: [], passed: [] };
};

export const useListingState = () => {
  const [state, setState] = useState<ListingState>(getInitialState);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);

  // Check if we're in a cleared state - if so, start with empty listings
  const isCleared = typeof window !== 'undefined' && localStorage.getItem('swipehouse-cleared') === 'true';
  const [listings, setListingsState] = useState<Listing[]>(isCleared ? [] : initialListings);
  const lastCommuteKeyRef = useRef<string | null>(null);
  const [remoteBlocked, setRemoteBlocked] = useState(isCleared);

  const totalCount = listings.length;
  const hasListings = totalCount > 0;

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const currentListing = hasListings ? listings[state.currentIndex] || null : null;
  const remainingCount = hasListings
    ? Math.max(listings.length - state.currentIndex, 0)
    : 0;
  const isComplete = hasListings ? state.currentIndex >= listings.length : false;

  // Ensure index never exceeds available listings
  useEffect(() => {
    if (!hasListings && state.currentIndex === 0) return;
    if (state.currentIndex > listings.length) {
      setState((prev) => ({ ...prev, currentIndex: listings.length }));
    }
  }, [hasListings, listings.length, state.currentIndex]);

  const like = useCallback((id: string) => {
    if (!hasListings) return;
    setState(prev => ({
      ...prev,
      currentIndex: prev.currentIndex + 1,
      liked: [...prev.liked, id],
    }));
  }, [hasListings]);

  const pass = useCallback((id: string) => {
    if (!hasListings) return;
    setState(prev => ({
      ...prev,
      currentIndex: prev.currentIndex + 1,
      passed: [...prev.passed, id],
    }));
  }, [hasListings]);

  const reset = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('swipehouse-cleared');
    setState({ currentIndex: 0, liked: [], passed: [] });
    setSelectedListing(null);
    setListingsState([]);
    lastCommuteKeyRef.current = null;
    setRemoteBlocked(false);
  }, []);

  const getListing = useCallback((id: string): Listing | undefined => {
    return listings.find(l => l.id === id);
  }, [listings]);

  const replaceListings = useCallback((next: Listing[]) => {
    if (remoteBlocked) return;

    // Clear the cleared flag when new listings are loaded
    localStorage.removeItem('swipehouse-cleared');

    setListingsState((prev) => {
      const sameIds =
        prev.length === next.length &&
        prev.every((p, idx) => p.id === next[idx]?.id);

      if (sameIds) return prev;

      const idSet = new Set(next.map((l) => l.id));

      setState((prevState) => ({
        currentIndex: 0,
        liked: prevState.liked.filter((id) => idSet.has(id)),
        passed: prevState.passed.filter((id) => idSet.has(id)),
      }));
      setSelectedListing(null);
      lastCommuteKeyRef.current = null;
      return next;
    });
  }, [remoteBlocked]);

  const applyCommuteAddress = useCallback(
    async (address: string, mode: CommuteMode) => {
      const token = import.meta.env.VITE_MAPBOX_TOKEN;
      const trimmed = address.trim();

      if (!trimmed || !token || listings.length === 0 || remoteBlocked) return;

      const idsHash = listingIdsHash(listings);
      const cacheKey = `${trimmed}|${idsHash}|${mode}`;
      if (lastCommuteKeyRef.current === cacheKey) return;

      const applyDurations = (durations: Record<string, number>) => {
        setListingsState((prev) =>
          prev.map((l) =>
            durations[l.id] ? { ...l, commuteMins: durations[l.id] } : l
          )
        );
        lastCommuteKeyRef.current = cacheKey;
      };

      let durations: Record<string, number> | null = null;
      try {
        durations = await getCommuteDurations(trimmed, listings, token, mode);
      } catch {
        durations = null;
      }

      if (durations && Object.keys(durations).length > 0) {
        applyDurations(durations);
      }
    },
    [listings]
  );

  const shortlistListings = state.liked
    .map(id => listings.find(l => l.id === id))
    .filter((l): l is Listing => !!l);

  return {
    currentIndex: state.currentIndex,
    currentListing,
    remainingCount,
    isComplete,
    totalCount,
    hasListings,
    liked: state.liked,
    passed: state.passed,
    shortlistListings,
    like,
    pass,
    reset,
    getListing,
    selectedListing,
    setSelectedListing,
    allListings: listings,
    setListings: replaceListings,
    applyCommuteAddress,
    clearAllAndBlockRemote: useCallback(() => {
      localStorage.clear();
      // Set cleared flag AFTER clearing, so it persists
      localStorage.setItem('swipehouse-cleared', 'true');
      setRemoteBlocked(true);
      setState({ currentIndex: 0, liked: [], passed: [] });
      setSelectedListing(null);
      setListingsState([]);
      lastCommuteKeyRef.current = null;
    }, []),
  };
};
