import { Listing } from '@/data/mockListings';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Bed, Bath, MapPin, Clock, Dog, WashingMachine, Building, Check, X } from 'lucide-react';

interface CompareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listings: Listing[];
}

export const CompareModal = ({ open, onOpenChange, listings }: CompareModalProps) => {
  const formatPrice = (price: number, type: 'rent' | 'buy') => {
    if (type === 'rent') {
      return `$${price.toLocaleString()}/mo`;
    }
    return `$${(price / 1000).toFixed(0)}K`;
  };

  const topListings = listings.slice(0, 3);

  const compareRows = [
    {
      label: 'Price',
      getValue: (l: Listing) => formatPrice(l.price, l.type),
    },
    {
      label: 'Bedrooms',
      getValue: (l: Listing) => l.beds.toString(),
    },
    {
      label: 'Bathrooms',
      getValue: (l: Listing) => l.baths.toString(),
    },
    {
      label: 'Neighborhood',
      getValue: (l: Listing) => l.neighborhood,
    },
    {
      label: 'Commute',
      getValue: (l: Listing) => `${l.commuteMins} min`,
    },
    {
      label: 'Square Feet',
      getValue: (l: Listing) => `${l.sqft} sqft`,
    },
    {
      label: 'Match Score',
      getValue: (l: Listing) => `${l.matchScore}%`,
      highlight: true,
    },
  ];

  const featureRows = [
    { label: 'Pets Allowed', key: 'pets' as const, icon: Dog },
    { label: 'In-unit Laundry', key: 'laundry' as const, icon: WashingMachine },
    { label: 'Elevator', key: 'elevator' as const, icon: Building },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Compare Top Picks</DialogTitle>
        </DialogHeader>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="pb-4 text-left text-sm font-medium text-muted-foreground">
                  Property
                </th>
                {topListings.map((listing, i) => (
                  <th key={listing.id} className="pb-4 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="relative h-24 w-32 overflow-hidden rounded-xl">
                        <img
                          src={`https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=300&h=200&fit=crop&q=80&sig=${listing.id}`}
                          alt={listing.title}
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                          {i + 1}
                        </div>
                      </div>
                      <span className="text-sm font-semibold">{listing.title}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {compareRows.map((row) => (
                <tr key={row.label}>
                  <td className="py-3 text-sm text-muted-foreground">{row.label}</td>
                  {topListings.map((listing) => (
                    <td
                      key={listing.id}
                      className={`py-3 text-center text-sm font-medium ${
                        row.highlight ? 'text-primary' : ''
                      }`}
                    >
                      {row.getValue(listing)}
                    </td>
                  ))}
                </tr>
              ))}

              {/* Features section */}
              <tr>
                <td colSpan={topListings.length + 1} className="pt-4">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Features
                  </span>
                </td>
              </tr>
              {featureRows.map((row) => (
                <tr key={row.key}>
                  <td className="py-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-2">
                      <row.icon className="h-4 w-4" />
                      {row.label}
                    </span>
                  </td>
                  {topListings.map((listing) => (
                    <td key={listing.id} className="py-3 text-center">
                      {listing.features[row.key] ? (
                        <Check className="mx-auto h-5 w-5 text-success" />
                      ) : (
                        <X className="mx-auto h-5 w-5 text-muted-foreground/50" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}

              {/* Why this matches */}
              <tr>
                <td className="py-4 text-sm text-muted-foreground align-top">
                  Why it matches
                </td>
                {topListings.map((listing) => (
                  <td key={listing.id} className="py-4 text-center">
                    <p className="text-xs text-muted-foreground">{listing.why}</p>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
};
