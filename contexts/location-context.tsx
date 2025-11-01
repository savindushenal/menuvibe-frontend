'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Location } from '@/lib/types';
import { apiClient } from '@/lib/api';
import { useAuth } from './auth-context';

// Type for creating a new location (excludes server-generated fields)
export type CreateLocationData = {
  name: string;
  description?: string;
  phone?: string;
  email?: string;
  website?: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  cuisine_type?: string;
  seating_capacity?: number;
  operating_hours?: any;
  services?: string[];
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  social_media?: any;
  latitude?: number;
  longitude?: number;
  is_active: boolean;
  is_default: boolean;
};

interface LocationContextType {
  locations: Location[];
  currentLocation: Location | null;
  defaultLocation: Location | null;
  isLoading: boolean;
  error: string | null;
  switchLocation: (locationId: string) => void;
  refreshLocations: () => Promise<void>;
  addLocation: (location: CreateLocationData) => Promise<Location>;
  updateLocation: (locationId: string, updates: Partial<Location>) => Promise<Location>;
  deleteLocation: (locationId: string) => Promise<void>;
  setAsDefault: (locationId: string) => Promise<void>;
  canAddLocation: boolean;
  remainingQuota: number;
  maxLocations: number;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

interface LocationProviderProps {
  children: ReactNode;
}

export function LocationProvider({ children }: LocationProviderProps) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [locations, setLocations] = useState<Location[]>([]);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [defaultLocation, setDefaultLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canAddLocation, setCanAddLocation] = useState(false);
  const [remainingQuota, setRemainingQuota] = useState(0);
  const [maxLocations, setMaxLocations] = useState(1);

  // Load locations only when authenticated and auth is stable
  useEffect(() => {
    if (!authLoading) {
      if (isAuthenticated) {
        refreshLocations();
      } else {
        // Clear locations when not authenticated
        setLocations([]);
        setCurrentLocation(null);
        setDefaultLocation(null);
        setIsLoading(false);
      }
    }
  }, [isAuthenticated, authLoading]);

  // Set current location when locations are loaded
  useEffect(() => {
    if (locations.length > 0 && !currentLocation) {
      const saved = localStorage.getItem('currentLocationId');
      const defaultLoc = locations.find(loc => loc.is_default);
      const savedLoc = saved ? locations.find(loc => loc.id === saved) : null;
      
      const locationToSet = savedLoc || defaultLoc || locations[0];
      setCurrentLocation(locationToSet);
      
      if (defaultLoc) {
        setDefaultLocation(defaultLoc);
      }
    }
  }, [locations, currentLocation]);

  // Save current location to localStorage
  useEffect(() => {
    if (currentLocation) {
      localStorage.setItem('currentLocationId', currentLocation.id);
    }
  }, [currentLocation]);

  const refreshLocations = async () => {
    // Don't attempt to load locations if not authenticated
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiClient.getLocations();
      
      if (response.success) {
        setLocations(response.data);
        setCanAddLocation(response.meta?.can_add_location || false);
        setRemainingQuota(response.meta?.remaining_quota || 0);
        setMaxLocations(response.meta?.max_locations || 1);
      } else {
        throw new Error(response.message || 'Failed to load locations');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load locations';
      setError(message);
      console.error('Failed to load locations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const switchLocation = (locationId: string) => {
    const location = locations.find(loc => loc.id === locationId);
    if (location) {
      setCurrentLocation(location);
    }
  };

  const addLocation = async (locationData: CreateLocationData): Promise<Location> => {
    try {
      const response = await apiClient.createLocation(locationData);
      
      if (response.success) {
        await refreshLocations();
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to create location');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create location';
      throw new Error(message);
    }
  };

  const updateLocation = async (locationId: string, updates: Partial<Location>): Promise<Location> => {
    try {
      const response = await apiClient.updateLocation(Number(locationId), updates);
      
      if (response.success) {
        await refreshLocations();
        
        // Update current location if it was the one being updated
        if (currentLocation?.id === locationId) {
          setCurrentLocation(response.data);
        }
        
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to update location');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update location';
      throw new Error(message);
    }
  };

  const deleteLocation = async (locationId: string): Promise<void> => {
    try {
      const response = await apiClient.deleteLocation(Number(locationId));
      
      if (response.success) {
        // If deleting current location, switch to another one
        if (currentLocation?.id === locationId) {
          const remaining = locations.filter(loc => loc.id !== locationId);
          if (remaining.length > 0) {
            setCurrentLocation(remaining[0]);
          }
        }
        
        await refreshLocations();
      } else {
        throw new Error(response.message || 'Failed to delete location');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete location';
      throw new Error(message);
    }
  };

  const setAsDefault = async (locationId: string): Promise<void> => {
    try {
      const response = await apiClient.setDefaultLocation(Number(locationId));
      
      if (response.success) {
        await refreshLocations();
        const newDefault = locations.find(loc => loc.id === locationId);
        if (newDefault) {
          setDefaultLocation(newDefault);
        }
      } else {
        throw new Error(response.message || 'Failed to set default location');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to set default location';
      throw new Error(message);
    }
  };

  const value: LocationContextType = {
    locations,
    currentLocation,
    defaultLocation,
    isLoading,
    error,
    switchLocation,
    refreshLocations,
    addLocation,
    updateLocation,
    deleteLocation,
    setAsDefault,
    canAddLocation,
    remainingQuota,
    maxLocations,
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}

export default LocationContext;