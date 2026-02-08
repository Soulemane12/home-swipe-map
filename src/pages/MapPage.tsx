import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { MapPanel } from '@/components/map/MapPanel';
import { CompareModal } from '@/components/compare/CompareModal';
import { ListingCard } from '@/components/listing/ListingCard';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useListingState } from '@/hooks/useListingState';
import { Listing } from '@/data/mockListings';
import { useFilters } from '@/context/FilterContext';
import { useRemoteListings } from '@/hooks/useRemoteListings';
import { rentcastToListing } from '@/lib/mapToListing';
import {
  X,
  SlidersHorizontal,
  GitCompare,
  Dog,
  WashingMachine,
  Building,
  ChevronUp,
  ChevronDown,
  List,
  Bookmark,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SkeletonCard, StaleIndicator } from '@/components/ui/skeleton-card';
import type { PaddingOptions } from 'mapbox-gl';

const MapPage = () => {
  const { filters, toRemoteFilters, updateFilter } = useFilters();
  const remoteFilters = toRemoteFilters();

  const {
    shortlistListings,
    liked,
    selectedListing,
    setSelectedListing,
    allListings,
    setListings,
    applyCommuteAddress,
  } = useListingState();

  const { data, error: remoteError, loading: remoteLoading, stale, refreshing } = useRemoteListings(remoteFilters, 400);

  useEffect(() => {
    if (!data) return;
    const rawArray = Array.isArray(data)
      ? data
      : Array.isArray((data as any)?.listings)
      ? (data as any).listings
      : [];

    if (rawArray.length === 0) return;

    const mapped = rawArray
      .map((item: any) => rentcastToListing(item, filters.mode))
      .filter((l) => l.id && l.lat && l.lng);

    if (mapped.length > 0) {
      setListings(mapped);
    }
  }, [data, setListings, filters.mode]);

  useEffect(() => {
    if (!filters.commuteAddress || allListings.length === 0) return;
    applyCommuteAddress(filters.commuteAddress, filters.commuteMode);
  }, [filters.commuteAddress, filters.commuteMode, allListings, applyCommuteAddress]);

  const [compareOpen, setCompareOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  const [panelExpanded, setPanelExpanded] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [commuteMax, setCommuteMax] = useState([60]);
  const [sortBy, setSortBy] = useState('match');
  const [filterPets, setFilterPets] = useState(false);
  const [filterLaundry, setFilterLaundry] = useState(false);
  const [filterElevator, setFilterElevator] = useState(false);
  const [mapPadding, setMapPadding] = useState<Partial<PaddingOptions>>({ right: 0, bottom: 0 });

  const sidePanelRef = useRef<HTMLDivElement | null>(null);
  const bottomSheetRef = useRef<HTMLDivElement | null>(null);

  const updateMapPadding = useCallback(() => {
    if (typeof window === 'undefined') return;

    const isDesktop = window.matchMedia('(min-width: 1024px)').matches;
    let right = 0;
    let bottom = 0;

    if (isDesktop && panelOpen && sidePanelRef.current) {
      const rect = sidePanelRef.current.getBoundingClientRect();
      right = Math.max(0, Math.round(window.innerWidth - rect.left));
    }

    if (!isDesktop && bottomSheetRef.current) {
      const rect = bottomSheetRef.current.getBoundingClientRect();
      bottom = Math.max(0, Math.round(window.innerHeight - rect.top));
    }

    setMapPadding((prev) => {
      if (prev.right === right && prev.bottom === bottom) return prev;
      return { right, bottom };
    });
  }, [panelOpen]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    const handleQueryChange = () => updateMapPadding();

    updateMapPadding();

    const roSide = sidePanelRef.current ? new ResizeObserver(updateMapPadding) : null;
    const roBottom = bottomSheetRef.current ? new ResizeObserver(updateMapPadding) : null;

    if (roSide && sidePanelRef.current) roSide.observe(sidePanelRef.current);
    if (roBottom && bottomSheetRef.current) roBottom.observe(bottomSheetRef.current);

    window.addEventListener('resize', updateMapPadding);
    mediaQuery.addEventListener('change', handleQueryChange);

    return () => {
      roSide?.disconnect();
      roBottom?.disconnect();
      window.removeEventListener('resize', updateMapPadding);
      mediaQuery.removeEventListener('change', handleQueryChange);
    };
  }, [updateMapPadding]);

  useEffect(() => {
    updateMapPadding();
  }, [panelExpanded, filtersOpen, updateMapPadding]);

  const displayListings = useMemo(() => {
    let filtered = shortlistListings;

    if (filterPets) {
      filtered = filtered.filter(l => l.features.pets);
    }
    if (filterLaundry) {
      filtered = filtered.filter(l => l.features.laundry);
    }
    if (filterElevator) {
      filtered = filtered.filter(l => l.features.elevator);
    }

    filtered = filtered.filter(l => l.commuteMins <= commuteMax[0]);

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'commute':
          return a.commuteMins - b.commuteMins;
        case 'match':
        default:
          return b.matchScore - a.matchScore;
      }
    });
  }, [shortlistListings, filterPets, filterLaundry, filterElevator, commuteMax, sortBy]);

  return (
    <AppShell>
      <AnimatePresence>
        {remoteError && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute left-4 right-4 top-4 z-30 lg:left-auto lg:right-[420px] lg:w-80"
          >
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive backdrop-blur-sm">
              Failed to load RentCast listings. {remoteError}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="relative h-[calc(100vh-4rem)] w-full overflow-hidden">
        {/* Full Screen Map */}
        <div className="absolute inset-0">
          <MapPanel
            listings={shortlistListings}
            savedIds={liked}
            selectedListing={selectedListing}
            onSelectListing={setSelectedListing}
            uiPadding={mapPadding}
          />
        </div>

        {/* Toggle Button (visible when panel is closed) */}
        <AnimatePresence>
          {!panelOpen && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute right-4 top-4 z-20"
            >
              <Button
                onClick={() => setPanelOpen(true)}
                className="gap-2 shadow-lg"
              >
                <List className="h-4 w-4" />
                Shortlist ({displayListings.length})
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Overlay Panel - Desktop */}
        <AnimatePresence>
          {panelOpen && (
            <motion.div
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute right-4 top-4 bottom-4 z-20 hidden w-[400px] flex-col overflow-hidden rounded-2xl bg-card/95 backdrop-blur-lg elevated-shadow lg:flex"
              ref={sidePanelRef}
            >
              {/* Panel Header */}
              <div className="flex items-center justify-between border-b border-border p-4">
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={refreshing ? { rotate: 360 } : {}}
                    transition={{ repeat: refreshing ? Infinity : 0, duration: 1, ease: 'linear' }}
                  >
                    <Bookmark className="h-5 w-5 text-primary" />
                  </motion.div>
                  <h2 className="font-serif text-xl font-medium">
                    Your Shortlist
                  </h2>
                  <motion.span
                    className="rounded-full bg-primary/10 px-2 py-0.5 text-sm font-medium text-primary"
                    key={displayListings.length}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                  >
                    {displayListings.length}
                  </motion.span>
                  {(stale || refreshing) && shortlistListings.length > 0 && (
                    <StaleIndicator refreshing={refreshing} />
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setPanelOpen(false)}
                  className="hover:bg-muted"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Actions Bar */}
              <div className="flex items-center gap-2 border-b border-border p-3">
                <Button
                  variant={filtersOpen ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFiltersOpen(!filtersOpen)}
                  className="flex-1"
                >
                  <SlidersHorizontal className="mr-2 h-4 w-4" />
                  Filters
                </Button>
                <Button
                  size="sm"
                  onClick={() => setCompareOpen(true)}
                  disabled={displayListings.length < 2}
                  className="flex-1"
                >
                  <GitCompare className="mr-2 h-4 w-4" />
                  Compare
                </Button>
              </div>

              {/* Expandable Filters */}
              <AnimatePresence>
                {filtersOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-b border-border"
                  >
                    <div className="space-y-4 p-4">
                      <div className="flex items-center gap-3">
                        <Label className="w-16 shrink-0 text-sm">Sort</Label>
                        <Select value={sortBy} onValueChange={setSortBy}>
                          <SelectTrigger className="flex-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="match">Best match</SelectItem>
                            <SelectItem value="price-low">Lowest price</SelectItem>
                            <SelectItem value="price-high">Highest price</SelectItem>
                            <SelectItem value="commute">Shortest commute</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Max commute</Label>
                          <span className="text-sm font-medium text-primary">{commuteMax[0]} min</span>
                        </div>
                        <Slider
                          value={commuteMax}
                          onValueChange={setCommuteMax}
                          min={10}
                          max={60}
                          step={5}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Commute mode</Label>
                        <Select
                          value={filters.commuteMode}
                          onValueChange={(v) =>
                            updateFilter('commuteMode', v as 'driving' | 'walking' | 'cycling' | 'transit')
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="driving">Driving</SelectItem>
                            <SelectItem value="transit">Transit (best available)</SelectItem>
                            <SelectItem value="cycling">Bike</SelectItem>
                            <SelectItem value="walking">Walk</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <div className="flex items-center gap-2">
                          <Switch
                            id="filter-pets"
                            checked={filterPets}
                            onCheckedChange={setFilterPets}
                          />
                          <Label htmlFor="filter-pets" className="flex items-center gap-1 text-sm">
                            <Dog className="h-4 w-4" /> Pets
                          </Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            id="filter-laundry"
                            checked={filterLaundry}
                            onCheckedChange={setFilterLaundry}
                          />
                          <Label htmlFor="filter-laundry" className="flex items-center gap-1 text-sm">
                            <WashingMachine className="h-4 w-4" /> Laundry
                          </Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            id="filter-elevator"
                            checked={filterElevator}
                            onCheckedChange={setFilterElevator}
                          />
                          <Label htmlFor="filter-elevator" className="flex items-center gap-1 text-sm">
                            <Building className="h-4 w-4" /> Elevator
                          </Label>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Listings */}
              <ScrollArea className="flex-1">
                <AnimatePresence mode="wait">
                  {remoteLoading && shortlistListings.length === 0 ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-3 p-4"
                    >
                      {[...Array(4)].map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                        >
                          <SkeletonCard variant="list" />
                        </motion.div>
                      ))}
                    </motion.div>
                  ) : displayListings.length === 0 ? (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center p-8 text-center"
                    >
                      <motion.div
                        animate={{ y: [0, -5, 0] }}
                        transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                      >
                        <Bookmark className="mb-3 h-10 w-10 text-muted-foreground/50" />
                      </motion.div>
                      <p className="font-medium">No listings available</p>
                      <p className="text-sm text-muted-foreground">
                        Swipe right on listings to add them to your shortlist.
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="list"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-3 p-4"
                    >
                      <AnimatePresence>
                        {displayListings.map((listing, index) => (
                          <motion.div
                            key={listing.id}
                            layout
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9, x: -20 }}
                            transition={{ type: 'spring', damping: 20, delay: index * 0.03 }}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            className={`relative cursor-pointer rounded-xl transition-shadow ${
                              selectedListing?.id === listing.id
                                ? 'ring-2 ring-primary ring-offset-2 shadow-lg'
                                : 'hover:shadow-md'
                            }`}
                            onClick={() => setSelectedListing(listing)}
                          >
                            <ListingCard
                              listing={listing}
                              variant="list"
                              rank={index + 1}
                              showMatch
                            />
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </AnimatePresence>
              </ScrollArea>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Bottom Sheet */}
        <div className="absolute inset-x-0 bottom-0 z-20 lg:hidden">
          <motion.div
            className="rounded-t-3xl bg-card/95 backdrop-blur-lg elevated-shadow"
            animate={{ height: panelExpanded ? '70vh' : '180px' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            ref={bottomSheetRef}
          >
            {/* Handle */}
            <button
              onClick={() => setPanelExpanded(!panelExpanded)}
              className="flex w-full flex-col items-center pb-2 pt-3"
            >
              <div className="h-1 w-12 rounded-full bg-border" />
              <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                {panelExpanded ? (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Collapse
                  </>
                ) : (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    {displayListings.length} listings
                  </>
                )}
              </div>
            </button>

            {/* Mobile Content */}
            <div className="flex h-full flex-col overflow-hidden">
              {/* Quick Actions */}
              <div className="flex items-center gap-2 border-b border-border px-4 pb-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFiltersOpen(!filtersOpen)}
                  className="flex-1"
                >
                  <SlidersHorizontal className="mr-2 h-4 w-4" />
                  Filters
                </Button>
                <Button
                  size="sm"
                  onClick={() => setCompareOpen(true)}
                  disabled={displayListings.length < 2}
                  className="flex-1"
                >
                  <GitCompare className="mr-2 h-4 w-4" />
                  Compare
                </Button>
              </div>

              {/* Scrollable List */}
              <ScrollArea className="flex-1 px-4 py-3">
                {displayListings.length === 0 ? (
                  <div className="py-4 text-center text-sm text-muted-foreground">
                    No listings available yet. Add your data to populate the map.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {displayListings.map((listing, index) => (
                      <div
                        key={listing.id}
                        className={`cursor-pointer rounded-xl transition-all ${
                          selectedListing?.id === listing.id
                            ? 'ring-2 ring-primary'
                            : ''
                        }`}
                        onClick={() => {
                          setSelectedListing(listing);
                          setPanelExpanded(false);
                        }}
                      >
                        <ListingCard listing={listing} variant="compact" />
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </motion.div>
        </div>

        {/* Selected Listing Popup (for map pin clicks) */}
        <AnimatePresence>
          {selectedListing && (
            <motion.div
              className="absolute left-4 top-4 z-10 w-80 lg:left-4 lg:top-4"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="relative rounded-2xl bg-card elevated-shadow">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute -right-2 -top-2 z-10 h-8 w-8 rounded-full bg-card shadow-md"
                  onClick={() => setSelectedListing(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
                <ListingCard listing={selectedListing} variant="compact" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Compare Modal */}
      <CompareModal
        open={compareOpen}
        onOpenChange={setCompareOpen}
        listings={displayListings}
      />
    </AppShell>
  );
};

export default MapPage;
