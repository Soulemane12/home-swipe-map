export type DataQuality = 'high' | 'medium' | 'low' | 'suspect';

export interface Listing {
  id: string;
  address?: string;
  title: string;
  price: number;
  beds: number;
  baths: number;
  neighborhood: string;
  lat: number;
  lng: number;
  commuteMins: number;
  features: {
    pets: boolean;
    laundry: boolean;
    elevator: boolean;
    walkup: boolean;
  };
  images: string[];
  description: string;
  matchScore: number;
  why: string;
  sqft: number;
  type: 'rent' | 'buy';
  externalUrl?: string;
  agentUrl?: string;
  officeUrl?: string;
  source?: 'rentcast';
  dataQuality?: DataQuality;
}

// Placeholder arrays – supply your own listings and neighborhood options.
export const initialListings: Listing[] = [];

export const neighborhoodOptions: { value: string; label: string }[] = [];
