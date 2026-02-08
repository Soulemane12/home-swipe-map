import { Listing } from '@/data/mockListings';
import { ListingCard } from '@/components/listing/ListingCard';
import { Button } from '@/components/ui/button';
import { Bookmark, BookmarkX, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ShortlistPanelProps {
  listings: Listing[];
  savedIds: string[];
  selectedListing: Listing | null;
  onSelectListing: (listing: Listing | null) => void;
  onToggleSave: (id: string) => void;
}

export const ShortlistPanel = ({
  listings,
  savedIds,
  selectedListing,
  onSelectListing,
  onToggleSave,
}: ShortlistPanelProps) => {
  if (listings.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Bookmark className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mb-2 text-lg font-semibold">No listings available</h3>
        <p className="text-sm text-muted-foreground">
          Add listing data to see your shortlist here.
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 p-4">
        {listings.map((listing, index) => (
          <div
            key={listing.id}
            className={`relative cursor-pointer transition-all duration-200 ${
              selectedListing?.id === listing.id
                ? 'ring-2 ring-primary ring-offset-2 rounded-2xl'
                : ''
            }`}
            onClick={() => onSelectListing(listing)}
          >
            <ListingCard
              listing={listing}
              variant="list"
              rank={index + 1}
              showMatch
            />
            <Button
              variant={savedIds.includes(listing.id) ? 'default' : 'outline'}
              size="sm"
              className="absolute right-6 top-6"
              onClick={(e) => {
                e.stopPropagation();
                onToggleSave(listing.id);
              }}
            >
              {savedIds.includes(listing.id) ? (
                <>
                  <Bookmark className="h-4 w-4 fill-current" />
                  Saved
                </>
              ) : (
                <>
                  <Bookmark className="h-4 w-4" />
                  Save
                </>
              )}
            </Button>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};
