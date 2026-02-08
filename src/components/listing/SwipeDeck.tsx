import { useState } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Listing } from '@/data/mockListings';
import { ListingCard } from './ListingCard';
import { Button } from '@/components/ui/button';
import { X, Heart } from 'lucide-react';

interface SwipeDeckProps {
  listings: Listing[];
  currentIndex: number;
  onLike: (id: string) => void;
  onPass: (id: string) => void;
}

export const SwipeDeck = ({
  listings,
  currentIndex,
  onLike,
  onPass,
}: SwipeDeckProps) => {
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | null>(null);
  
  const currentListing = listings[currentIndex];
  const nextListing = listings[currentIndex + 1];

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 0, 300], [-15, 0, 15]);
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const passOpacity = useTransform(x, [-100, 0], [1, 0]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    const threshold = 100;
    
    if (info.offset.x > threshold) {
      setExitDirection('right');
      setTimeout(() => {
        onLike(currentListing.id);
        setExitDirection(null);
      }, 200);
    } else if (info.offset.x < -threshold) {
      setExitDirection('left');
      setTimeout(() => {
        onPass(currentListing.id);
        setExitDirection(null);
      }, 200);
    }
  };

  const handleButtonLike = () => {
    setExitDirection('right');
    setTimeout(() => {
      onLike(currentListing.id);
      setExitDirection(null);
    }, 200);
  };

  const handleButtonPass = () => {
    setExitDirection('left');
    setTimeout(() => {
      onPass(currentListing.id);
      setExitDirection(null);
    }, 200);
  };

  if (!currentListing) {
    return null;
  }

  return (
    <div className="flex w-full flex-col items-center">
      {/* Card Stack */}
      <div className="relative w-full max-w-[82vw] sm:max-w-2xl lg:max-w-3xl aspect-[3/4] sm:aspect-[4/3] max-h-[70vh]">
        {/* Next card (behind) */}
        {nextListing && (
          <div className="absolute inset-0 scale-[0.95] opacity-50">
            <div className="h-full overflow-hidden rounded-2xl bg-card card-shadow">
              <ListingCard listing={nextListing} variant="swipe" />
            </div>
          </div>
        )}

        {/* Current card */}
        <motion.div
          key={currentListing.id}
          className="absolute inset-0 cursor-grab active:cursor-grabbing"
          style={{ x, rotate }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.9}
          onDragEnd={handleDragEnd}
          animate={
            exitDirection === 'left'
              ? { x: -500, rotate: -20, opacity: 0 }
              : exitDirection === 'right'
              ? { x: 500, rotate: 20, opacity: 0 }
              : { x: 0, rotate: 0 }
          }
          transition={{ type: 'spring', damping: 20, stiffness: 200 }}
        >
          {/* Like indicator */}
          <motion.div
            className="pointer-events-none absolute left-6 top-6 z-10 rounded-lg border-4 border-success bg-success/20 px-4 py-2 text-2xl font-bold text-success"
            style={{ opacity: likeOpacity, rotate: -15 }}
          >
            LIKE
          </motion.div>

          {/* Pass indicator */}
          <motion.div
            className="pointer-events-none absolute right-6 top-6 z-10 rounded-lg border-4 border-destructive bg-destructive/20 px-4 py-2 text-2xl font-bold text-destructive"
            style={{ opacity: passOpacity, rotate: 15 }}
          >
            PASS
          </motion.div>

          <div className="h-full overflow-hidden rounded-2xl elevated-shadow">
            <ListingCard listing={currentListing} variant="swipe" />
          </div>
        </motion.div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex items-center gap-6">
        <Button
          variant="swipe-pass"
          size="icon-lg"
          onClick={handleButtonPass}
          className="transition-transform hover:scale-110"
        >
          <X className="h-7 w-7" />
        </Button>

        <Button
          variant="swipe-like"
          size="icon-lg"
          onClick={handleButtonLike}
          className="transition-transform hover:scale-110"
        >
          <Heart className="h-7 w-7" />
        </Button>
      </div>
    </div>
  );
};
