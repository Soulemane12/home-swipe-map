import { Listing } from '@/data/mockListings';
import { Bed, Bath, MapPin, Clock, Dog, WashingMachine, Building, ArrowUp, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ListingCardProps {
  listing: Listing;
  variant?: 'swipe' | 'list' | 'compact';
  showMatch?: boolean;
  rank?: number;
  isSaved?: boolean;
  onSaveToggle?: () => void;
  className?: string;
}

export const ListingCard = ({
  listing,
  variant = 'swipe',
  showMatch = true,
  rank,
  className,
}: ListingCardProps) => {
  const formatPrice = (price: number, type: 'rent' | 'buy') => {
    if (type === 'rent') {
      return `$${price.toLocaleString()}/mo`;
    }
    // Format sale prices: under 1M show as K, 1M+ show as M
    if (price >= 1000000) {
      const millions = price / 1000000;
      return `$${millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)}M`;
    }
    return `$${(price / 1000).toFixed(0)}K`;
  };

  const displayTitle = listing.title || listing.address;
  const displayNeighborhood = listing.neighborhood;
  const imageUrl = listing.images?.[0];
  const descriptionText = listing.description || "Listing details not provided.";

  const features = [
    { key: 'pets', label: 'Pets OK', icon: Dog, enabled: listing.features.pets },
    { key: 'laundry', label: 'Laundry', icon: WashingMachine, enabled: listing.features.laundry },
    { key: 'elevator', label: 'Elevator', icon: Building, enabled: listing.features.elevator },
    { key: 'walkup', label: 'Walk-up', icon: ArrowUp, enabled: !listing.features.walkup },
  ].filter(f => f.enabled);

  if (variant === 'compact') {
    return (
      <div className={cn('flex gap-3 rounded-xl bg-card p-3 card-shadow', className)}>
        <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={displayTitle}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
              No photo
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col justify-between">
          <div>
            <p className="font-semibold text-foreground">
              {formatPrice(listing.price, listing.type)}
            </p>
            <p className="text-sm text-muted-foreground">
              {listing.beds}bd • {listing.baths}ba • {displayNeighborhood}
            </p>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {listing.commuteMins} min
            </div>
            {listing.externalUrl && (
              <a
                href={listing.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="ghost" size="sm" className="h-6 px-2">
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div className={cn('overflow-hidden rounded-2xl bg-card card-shadow transition-all hover:card-shadow-hover', className)}>
        <div className="relative h-40 bg-muted">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={displayTitle}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
              No photo available
            </div>
          )}
          {rank && (
            <div className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">
              {rank}
            </div>
          )}
          {showMatch && (
            <div className="absolute right-3 top-3 rounded-full bg-card/90 px-3 py-1 text-sm font-semibold backdrop-blur">
              {listing.matchScore}% match
            </div>
          )}
        </div>
        <div className="p-4">
          <div className="mb-2 flex items-start justify-between">
            <div>
              <p className="text-xl font-bold text-foreground">
                {formatPrice(listing.price, listing.type)}
              </p>
              <p className="text-sm text-muted-foreground">{displayTitle}</p>
            </div>
          </div>
          <div className="mb-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Bed className="h-4 w-4" /> {listing.beds}
            </span>
            <span className="flex items-center gap-1">
              <Bath className="h-4 w-4" /> {listing.baths}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" /> {displayNeighborhood}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" /> {listing.commuteMins} min
            </span>
          </div>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {features.slice(0, 3).map(f => (
              <Badge key={f.key} variant="secondary" className="text-xs">
                <f.icon className="mr-1 h-3 w-3" />
                {f.label}
              </Badge>
            ))}
          </div>
          <div className="rounded-lg bg-secondary/50 p-3">
            <p className="text-xs font-medium text-muted-foreground">Why this matches you</p>
            <p className="text-sm text-foreground">{listing.why}</p>
          </div>
          {listing.externalUrl && (
            <a
              href={listing.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 block"
            >
              <Button variant="outline" size="sm" className="w-full">
                <ExternalLink className="mr-2 h-4 w-4" />
                View Listing
              </Button>
            </a>
          )}
        </div>
      </div>
    );
  }

  // Swipe variant (default)
  return (
    <div className={cn('flex h-full flex-col overflow-hidden rounded-2xl bg-card', className)}>
      <div className="relative flex-1 bg-muted">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={displayTitle}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-base font-medium text-muted-foreground/80">
            Photo not available
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {showMatch && (
          <div className="absolute right-4 top-4 rounded-full bg-card/90 px-4 py-1.5 text-sm font-bold backdrop-blur">
            {listing.matchScore}% match
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-5 text-primary-foreground">
          <p className="mb-1 text-3xl font-bold">
            {formatPrice(listing.price, listing.type)}
          </p>
          <p className="mb-3 text-lg font-medium opacity-90">{displayTitle}</p>
          
          <div className="flex flex-wrap items-center gap-4 text-sm opacity-90">
            <span className="flex items-center gap-1">
              <Bed className="h-4 w-4" /> {listing.beds} bed
            </span>
            <span className="flex items-center gap-1">
              <Bath className="h-4 w-4" /> {listing.baths} bath
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" /> {displayNeighborhood}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" /> {listing.commuteMins} min commute
            </span>
          </div>
        </div>
      </div>

      <div className="border-t border-border bg-card p-4">
        <div className="mb-3 flex flex-wrap gap-2">
          {features.map(f => (
            <Badge key={f.key} variant="secondary">
              <f.icon className="mr-1.5 h-3.5 w-3.5" />
              {f.label}
            </Badge>
          ))}
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {descriptionText}
        </p>
        {listing.externalUrl && (
          <a
            href={listing.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 block"
          >
            <Button variant="outline" size="sm" className="w-full">
              <ExternalLink className="mr-2 h-4 w-4" />
              View Listing
            </Button>
          </a>
        )}
      </div>
    </div>
  );
};
