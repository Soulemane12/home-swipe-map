import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { SwipeDeck } from '@/components/listing/SwipeDeck';
import { ListingCard } from '@/components/listing/ListingCard';
import { Button } from '@/components/ui/button';
import { useListingState } from '@/hooks/useListingState';
import { useRemoteListings } from '@/hooks/useRemoteListings';
import { useFilters } from '@/context/FilterContext';
import { rentcastToListing } from '@/lib/mapToListing';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SkeletonSwipeDeck, SkeletonCard, StaleIndicator } from '@/components/ui/skeleton-card';
import { Map, Bookmark, RotateCcw, CheckCircle2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SwipePage = () => {
  const navigate = useNavigate();
  const { filters, toRemoteFilters } = useFilters();
  const remoteFilters = toRemoteFilters();

  const {
    currentIndex,
    isComplete,
    totalCount,
    liked,
    shortlistListings,
    like,
    pass,
    reset,
    hasListings,
    setListings,
    allListings,
    applyCommuteAddress,
    clearAllAndBlockRemote,
  } = useListingState();

  // Check if storage was cleared (listings should stay empty)
  const isCleared = typeof window !== 'undefined' && localStorage.getItem('swipehouse-cleared') === 'true';

  const { data, error, loading, stale, refreshing } = useRemoteListings(remoteFilters, 400);

  useEffect(() => {
    // Don't load listings if storage was cleared
    if (isCleared || !data) return;

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
  }, [data, setListings, filters.mode, isCleared]);

  useEffect(() => {
    if (!filters.commuteAddress || allListings.length === 0) return;
    applyCommuteAddress(filters.commuteAddress, filters.commuteMode);
  }, [filters.commuteAddress, filters.commuteMode, allListings, applyCommuteAddress]);

  const handleClearStorage = () => {
    clearAllAndBlockRemote();
  };

  const progressPercent = totalCount > 0
    ? Math.min((currentIndex / totalCount) * 100, 100)
    : 0;

  return (
    <AppShell>
      <div className="flex min-h-[calc(100vh-4rem)] flex-col 2xl:flex-row">
        {/* Main Swipe Area */}
        <div className="flex flex-1 flex-col items-center px-4 py-6">
          {/* Progress */}
          <motion.div
            className="mb-6 w-full max-w-[82vw] sm:max-w-2xl lg:max-w-3xl"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-3 overflow-hidden"
                >
                  <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    Failed to load RentCast listings. {error}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mb-2 flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">
                  {currentIndex} / {totalCount} reviewed
                </span>
                {(stale || refreshing) && hasListings && (
                  <StaleIndicator refreshing={refreshing} />
                )}
              </div>
              <motion.span
                className="font-medium text-primary"
                key={liked.length}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
              >
                {liked.length} saved
              </motion.span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-secondary">
              <motion.div
                className="h-full bg-gradient-to-r from-primary to-primary/80"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            </div>
          </motion.div>

          {/* Swipe Area or Completion State */}
          {loading && !hasListings ? (
            <motion.div
              className="flex flex-1 flex-col items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <SkeletonSwipeDeck />
              <motion.p
                className="mt-6 text-sm text-muted-foreground"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                Finding listings near you...
              </motion.p>
            </motion.div>
          ) : !hasListings ? (
            <motion.div
              className="flex flex-1 flex-col items-center justify-center text-center"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', damping: 20 }}
            >
              <motion.div
                className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 15, delay: 0.1 }}
              >
                <Bookmark className="h-10 w-10 text-muted-foreground" />
              </motion.div>
              <h2 className="mb-2 font-serif text-3xl font-medium">No listings yet</h2>
              <p className="mb-6 max-w-sm text-muted-foreground">
                Add your own listing data to start swiping and building your shortlist.
              </p>
              <motion.div
                className="flex flex-wrap justify-center gap-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Button variant="outline" onClick={reset}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset State
                </Button>
              </motion.div>
            </motion.div>
          ) : isComplete ? (
            <motion.div
              className="flex flex-1 flex-col items-center justify-center text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {/* Celebration particles */}
              <div className="relative">
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute"
                    initial={{
                      x: 0,
                      y: 0,
                      opacity: 1,
                      scale: 0,
                    }}
                    animate={{
                      x: Math.cos((i / 6) * Math.PI * 2) * 60,
                      y: Math.sin((i / 6) * Math.PI * 2) * 60,
                      opacity: [1, 1, 0],
                      scale: [0, 1, 0.5],
                    }}
                    transition={{
                      duration: 1,
                      delay: 0.3 + i * 0.1,
                      ease: 'easeOut',
                    }}
                  >
                    <Sparkles className="h-4 w-4 text-primary" />
                  </motion.div>
                ))}
                <motion.div
                  className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-success/10"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', damping: 12, delay: 0.1 }}
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <CheckCircle2 className="h-10 w-10 text-success" />
                  </motion.div>
                </motion.div>
              </div>
              <motion.h2
                className="mb-2 font-serif text-3xl font-medium"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                All done!
              </motion.h2>
              <motion.p
                className="mb-6 max-w-sm text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                You've reviewed all {totalCount} listings.
                {liked.length > 0
                  ? ` You saved ${liked.length} favorites.`
                  : ' Try broadening your search criteria.'}
              </motion.p>
              <motion.div
                className="flex flex-wrap justify-center gap-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Button onClick={() => navigate('/map')} className="gap-2">
                  <Map className="h-4 w-4" />
                  View Map & Shortlist
                </Button>
                <Button variant="outline" onClick={reset} className="gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Start Over
                </Button>
              </motion.div>
            </motion.div>
          ) : (
            <SwipeDeck
              listings={allListings}
              currentIndex={currentIndex}
              onLike={like}
              onPass={pass}
            />
          )}

          {/* Quick Actions */}
          {!isComplete && (
            <div className="mt-6 flex gap-3 flex-wrap justify-center">
              <Button variant="outline" size="sm" onClick={() => navigate('/map')}>
                <Map className="mr-2 h-4 w-4" />
                Skip to Map
              </Button>
              <Button variant="outline" size="sm" onClick={handleClearStorage}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Clear storage
              </Button>
            </div>
          )}
        </div>

        {/* Saved Sidebar */}
        <motion.div
          className="w-full border-t border-border bg-card 2xl:w-72 2xl:border-l 2xl:border-t-0"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between border-b border-border p-4">
            <h3 className="flex items-center gap-2 font-semibold">
              <Bookmark className="h-4 w-4 text-primary" />
              Your Saved
            </h3>
            <motion.span
              className="rounded-full bg-primary/10 px-2 py-0.5 text-sm font-medium text-primary"
              key={liked.length}
              initial={{ scale: 1.3 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 15 }}
            >
              {liked.length}
            </motion.span>
          </div>

          <AnimatePresence mode="wait">
            {shortlistListings.length === 0 ? (
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
                <p className="text-sm text-muted-foreground">
                  Swipe right or tap the heart to save listings you love
                </p>
              </motion.div>
            ) : (
              <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <ScrollArea className="h-[300px] lg:h-[calc(100vh-12rem)]">
                  <div className="space-y-3 p-4">
                    <AnimatePresence>
                      {shortlistListings.map((listing, i) => (
                        <motion.div
                          key={listing.id}
                          layout
                          initial={{ opacity: 0, x: 30, scale: 0.9 }}
                          animate={{ opacity: 1, x: 0, scale: 1 }}
                          exit={{ opacity: 0, x: -30, scale: 0.9 }}
                          transition={{ type: 'spring', damping: 20, delay: i * 0.03 }}
                          className="cursor-pointer rounded-xl transition-shadow hover:shadow-md"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            navigate('/map');
                          }}
                        >
                          <ListingCard listing={listing} variant="compact" />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </ScrollArea>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </AppShell>
  );
};

export default SwipePage;
