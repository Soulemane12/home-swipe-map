import { motion } from 'framer-motion';

const shimmer = {
  initial: { x: '-100%' },
  animate: { x: '100%' },
};

export function SkeletonCard({ variant = 'full' }: { variant?: 'full' | 'compact' | 'list' }) {
  const isCompact = variant === 'compact';
  const isList = variant === 'list';

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-card border border-border ${
      isCompact ? 'p-3' : isList ? 'p-4' : 'p-0'
    }`}>
      {/* Shimmer overlay */}
      <motion.div
        className="absolute inset-0 z-10 bg-gradient-to-r from-transparent via-white/10 to-transparent"
        variants={shimmer}
        initial="initial"
        animate="animate"
        transition={{
          repeat: Infinity,
          duration: 1.5,
          ease: 'linear',
        }}
      />

      {variant === 'full' ? (
        <>
          {/* Image skeleton */}
          <div className="aspect-[4/3] w-full bg-muted animate-pulse" />

          {/* Content skeleton */}
          <div className="p-4 space-y-3">
            {/* Title */}
            <div className="h-6 w-3/4 rounded bg-muted animate-pulse" />

            {/* Price and location */}
            <div className="flex items-center gap-2">
              <div className="h-8 w-24 rounded bg-muted animate-pulse" />
              <div className="h-4 w-32 rounded bg-muted animate-pulse" />
            </div>

            {/* Features */}
            <div className="flex gap-2">
              <div className="h-6 w-16 rounded-full bg-muted animate-pulse" />
              <div className="h-6 w-16 rounded-full bg-muted animate-pulse" />
              <div className="h-6 w-20 rounded-full bg-muted animate-pulse" />
            </div>

            {/* Match score */}
            <div className="flex items-center justify-between pt-2">
              <div className="h-4 w-24 rounded bg-muted animate-pulse" />
              <div className="h-8 w-20 rounded-full bg-muted animate-pulse" />
            </div>
          </div>
        </>
      ) : isCompact ? (
        <div className="flex gap-3">
          {/* Small image */}
          <div className="h-16 w-16 shrink-0 rounded-lg bg-muted animate-pulse" />

          {/* Content */}
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
            <div className="h-5 w-20 rounded bg-muted animate-pulse" />
            <div className="h-3 w-24 rounded bg-muted animate-pulse" />
          </div>
        </div>
      ) : (
        <div className="flex gap-4">
          {/* List image */}
          <div className="h-24 w-24 shrink-0 rounded-xl bg-muted animate-pulse" />

          {/* Content */}
          <div className="flex-1 space-y-2">
            <div className="h-5 w-3/4 rounded bg-muted animate-pulse" />
            <div className="h-6 w-24 rounded bg-muted animate-pulse" />
            <div className="flex gap-2">
              <div className="h-5 w-14 rounded-full bg-muted animate-pulse" />
              <div className="h-5 w-14 rounded-full bg-muted animate-pulse" />
            </div>
            <div className="h-4 w-32 rounded bg-muted animate-pulse" />
          </div>
        </div>
      )}
    </div>
  );
}

export function SkeletonSwipeDeck() {
  return (
    <div className="relative w-full max-w-[82vw] sm:max-w-2xl lg:max-w-3xl aspect-[3/4] sm:aspect-[4/3] max-h-[70vh]">
      {/* Background cards */}
      {[2, 1].map((i) => (
        <motion.div
          key={i}
          className="absolute inset-0 rounded-3xl bg-card border border-border overflow-hidden"
          style={{
            scale: 1 - i * 0.05,
            y: i * 8,
            zIndex: -i,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: i * 0.1 }}
        >
          <div className="aspect-[4/3] w-full bg-muted" />
        </motion.div>
      ))}

      {/* Main card */}
      <motion.div
        className="relative h-full w-full rounded-3xl bg-card border border-border overflow-hidden"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 20 }}
      >
        <SkeletonCard variant="full" />

        {/* Action buttons skeleton */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4">
          <div className="h-14 w-14 rounded-full bg-muted animate-pulse" />
          <div className="h-14 w-14 rounded-full bg-muted animate-pulse" />
        </div>
      </motion.div>
    </div>
  );
}

export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <motion.div
      className={`${sizeClasses[size]} rounded-full border-2 border-primary border-t-transparent`}
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
    />
  );
}

export function StaleIndicator({ refreshing = false }: { refreshing?: boolean }) {
  return (
    <motion.div
      className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-600 dark:text-amber-400"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      {refreshing ? (
        <>
          <LoadingSpinner size="sm" />
          <span>Updating...</span>
        </>
      ) : (
        <>
          <motion.div
            className="h-2 w-2 rounded-full bg-amber-500"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          />
          <span>Cached data</span>
        </>
      )}
    </motion.div>
  );
}
