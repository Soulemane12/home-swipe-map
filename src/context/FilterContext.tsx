import { createContext, useContext, useState, ReactNode } from 'react';
import { RemoteFilters } from '@/lib/listingsRemote';

export interface UserFilters {
  mode: 'rent' | 'buy';
  budgetMin: string;
  budgetMax: string;
  beds: string;
  baths: string;
  city: string;
  state: string;
  petsAllowed: boolean;
  inUnitLaundry: boolean;
  hasElevator: boolean;
  noWalkup: boolean;
  commuteAddress: string;
  commuteMax: number;
  commuteMode: 'driving' | 'walking' | 'cycling' | 'transit';
}

const DEFAULT_USER_FILTERS: UserFilters = {
  mode: 'rent',
  budgetMin: '1500',
  budgetMax: '4000',
  beds: '1',
  baths: '1',
  city: 'New York',
  state: 'NY',
  petsAllowed: false,
  inUnitLaundry: false,
  hasElevator: false,
  noWalkup: false,
  commuteAddress: '',
  commuteMax: 30,
  commuteMode: 'driving',
};

interface FilterContextType {
  filters: UserFilters;
  setFilters: (filters: UserFilters) => void;
  updateFilter: <K extends keyof UserFilters>(key: K, value: UserFilters[K]) => void;
  resetFilters: () => void;
  toRemoteFilters: () => RemoteFilters;
}

const FilterContext = createContext<FilterContextType | null>(null);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<UserFilters>(DEFAULT_USER_FILTERS);

  const updateFilter = <K extends keyof UserFilters>(key: K, value: UserFilters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters(DEFAULT_USER_FILTERS);
  };

  const toRemoteFilters = (): RemoteFilters => {
    // Use NYC center coordinates with radius to cover all 5 boroughs
    // instead of city name which RentCast interprets as Manhattan only
    return {
      mode: filters.mode,
      latitude: '40.7128',
      longitude: '-74.0060',
      radius: '15',  // 15 miles covers all 5 boroughs
      price: `${filters.budgetMin || '0'}-${filters.budgetMax || '100000'}`,
      bedrooms: filters.beds === 'studio' ? '0-0' : filters.beds === '4' ? '4-10' : `${filters.beds}-${filters.beds}`,
      bathrooms: filters.baths === '2.5' ? '2-10' : `${filters.baths}-${filters.baths}`,
      limit: 30,
    };
  };

  return (
    <FilterContext.Provider value={{ filters, setFilters, updateFilter, resetFilters, toRemoteFilters }}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters() {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
}
