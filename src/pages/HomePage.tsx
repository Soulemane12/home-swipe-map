import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import heroImage from '@/assets/hero-apartment.jpg';
import { neighborhoodOptions } from '@/data/mockListings';
import { useFilters } from '@/context/FilterContext';
import { useListingState } from '@/hooks/useListingState';
import { Home, ArrowRight, Sparkles, MapPin, Clock, Dog, WashingMachine, Building, ArrowUp, X } from 'lucide-react';
import { motion } from 'framer-motion';

const HomePage = () => {
  const navigate = useNavigate();
  const { filters, updateFilter, resetFilters } = useFilters();
  const { clearAllAndBlockRemote } = useListingState();

  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<string[]>([]);

  const toggleNeighborhood = (value: string) => {
    setSelectedNeighborhoods(prev =>
      prev.includes(value)
        ? prev.filter(n => n !== value)
        : [...prev, value]
    );
  };

  const handleClearStorage = () => {
    // Reset filters to defaults
    resetFilters();
    // Clear all state and listings, block remote fetch
    clearAllAndBlockRemote();
    // Reload to ensure clean state
    window.location.href = '/';
  };

  const handleStartSwiping = () => {
    navigate('/swipe');
  };

  return (
    <AppShell>
      <div className="relative min-h-[calc(100vh-4rem)]">
        {/* Hero Background */}
        <div className="absolute inset-0 z-0">
          <img 
            src={heroImage} 
            alt="" 
            className="h-full w-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/90 to-background" />
        </div>

        <div className="relative z-10 py-8 md:py-16">
          <div className="container mx-auto px-4">
            {/* Hero Section */}
            <motion.div
            className="mb-12 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              <Sparkles className="h-4 w-4" />
              Find your perfect home with a swipe
            </div>
            <h1 className="mb-4 font-serif text-4xl font-medium tracking-tight md:text-5xl lg:text-6xl">
              Home hunting,
              <br />
              <span className="text-gradient">reimagined.</span>
            </h1>
            <p className="mx-auto max-w-xl text-lg text-muted-foreground">
              Swipe through curated listings matched to your preferences. 
              No endless scrolling—just homes you'll actually love.
            </p>
          </motion.div>

          {/* Search Form */}
          <motion.div
            className="mx-auto max-w-2xl rounded-3xl bg-card p-6 md:p-8 card-shadow"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="mb-8">
              <h2 className="mb-2 font-serif text-2xl font-medium">Set your preferences</h2>
              <p className="text-sm text-muted-foreground">We'll match you with listings that fit</p>
            </div>

            <div className="space-y-6">
              {/* Listing Type */}
              <div className="space-y-2">
                <Label>I'm looking to</Label>
                <Select value={filters.mode} onValueChange={(v) => updateFilter('mode', v as 'rent' | 'buy')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rent">Rent</SelectItem>
                    <SelectItem value="buy">Buy</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Budget */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Budget Min</Label>
                  <Input
                    type="number"
                    placeholder={filters.mode === 'rent' ? '$1,500' : '$300,000'}
                    value={filters.budgetMin}
                    onChange={(e) => updateFilter('budgetMin', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Budget Max</Label>
                  <Input
                    type="number"
                    placeholder={filters.mode === 'rent' ? '$4,000' : '$800,000'}
                    value={filters.budgetMax}
                    onChange={(e) => updateFilter('budgetMax', e.target.value)}
                  />
                </div>
              </div>

              {/* Beds & Baths */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Bedrooms</Label>
                  <Select value={filters.beds} onValueChange={(v) => updateFilter('beds', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="studio">Studio</SelectItem>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="4">4+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Bathrooms</Label>
                  <Select value={filters.baths} onValueChange={(v) => updateFilter('baths', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="1.5">1.5</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="2.5">2.5+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Neighborhoods */}
              <div className="space-y-2">
                <Label>Preferred Neighborhoods</Label>
                <div className="flex flex-wrap gap-2">
                  {neighborhoodOptions.slice(0, 8).map((n) => (
                    <Badge
                      key={n.value}
                      variant={selectedNeighborhoods.includes(n.value) ? 'default' : 'outline'}
                      className="cursor-pointer transition-all hover:scale-105"
                      onClick={() => toggleNeighborhood(n.value)}
                    >
                      {selectedNeighborhoods.includes(n.value) && (
                        <X className="mr-1 h-3 w-3" />
                      )}
                      {n.label}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Commute */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    Commute to
                  </Label>
                  <Input
                    placeholder="Enter work address"
                    value={filters.commuteAddress}
                    onChange={(e) => updateFilter('commuteAddress', e.target.value)}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Commute mode</Label>
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
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        Max commute time
                      </Label>
                      <span className="text-sm font-medium text-primary">{filters.commuteMax} min</span>
                    </div>
                    <Slider
                      value={[filters.commuteMax]}
                      onValueChange={(v) => updateFilter('commuteMax', v[0])}
                      min={10}
                      max={90}
                      step={5}
                      className="py-2"
                    />
                  </div>
                </div>
              </div>

              {/* Feature Toggles */}
              <div className="space-y-4 rounded-xl bg-secondary/50 p-4">
                <p className="text-sm font-medium">Must-have features</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2 text-sm">
                      <Dog className="h-4 w-4" />
                      Pets allowed
                    </Label>
                    <Switch checked={filters.petsAllowed} onCheckedChange={(v) => updateFilter('petsAllowed', v)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2 text-sm">
                      <WashingMachine className="h-4 w-4" />
                      In-unit laundry
                    </Label>
                    <Switch checked={filters.inUnitLaundry} onCheckedChange={(v) => updateFilter('inUnitLaundry', v)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2 text-sm">
                      <Building className="h-4 w-4" />
                      Elevator
                    </Label>
                    <Switch checked={filters.hasElevator} onCheckedChange={(v) => updateFilter('hasElevator', v)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2 text-sm">
                      <ArrowUp className="h-4 w-4" />
                      No walk-up
                    </Label>
                    <Switch checked={filters.noWalkup} onCheckedChange={(v) => updateFilter('noWalkup', v)} />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                variant="hero"
                size="xl"
                className="w-full"
                onClick={handleStartSwiping}
              >
                Start Swiping
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-3"
                onClick={handleClearStorage}
              >
                Clear storage
              </Button>
            </div>
          </motion.div>

            {/* Stats */}
            <motion.div
              className="mt-12 flex flex-wrap justify-center gap-8 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <div>
                <p className="text-3xl font-bold text-primary">50+</p>
                <p className="text-sm text-muted-foreground">Curated listings</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-primary">15</p>
                <p className="text-sm text-muted-foreground">Neighborhoods</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-primary">2 min</p>
                <p className="text-sm text-muted-foreground">Avg. decision time</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default HomePage;
