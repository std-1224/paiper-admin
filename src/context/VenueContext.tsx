"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface VenueInfo {
  id?: string;
  name: string;
  description: string;
  open_time: string;
  closing_time: string;
  max_capacity: number;
  created_at?: string;
  updated_at?: string;
}

interface VenueContextType {
  venue: VenueInfo | null;
  isLoading: boolean;
  error: string | null;
  fetchVenue: () => Promise<void>;
  updateVenue: (venueData: Partial<VenueInfo>) => Promise<any>;
  refreshVenue: () => Promise<void>;
}

const VenueContext = createContext<VenueContextType | undefined>(undefined);

interface VenueProviderProps {
  children: ReactNode;
}

export function VenueProvider({ children }: VenueProviderProps) {
  const [venue, setVenue] = useState<VenueInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVenue = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/venue');
      
      if (!response.ok) {
        throw new Error('Failed to fetch venue information');
      }

      const venueData = await response.json();
      setVenue(venueData); // Can be null if no venue exists
    } catch (err) {
      console.error('Error fetching venue:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch venue information');
    } finally {
      setIsLoading(false);
    }
  };

  const updateVenue = async (venueData: Partial<VenueInfo>) => {
    try {
      setError(null);
      
      const response = await fetch('/api/venue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(venueData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update venue information');
      }

      const result = await response.json();
      
      // Update the venue state immediately
      setVenue(result.venue);
      
      return result;
    } catch (err) {
      console.error('Error updating venue:', err);
      setError(err instanceof Error ? err.message : 'Failed to update venue information');
      throw err;
    }
  };

  const refreshVenue = async () => {
    await fetchVenue();
  };

  useEffect(() => {
    fetchVenue();
  }, []);

  const value: VenueContextType = {
    venue,
    isLoading,
    error,
    fetchVenue,
    updateVenue,
    refreshVenue,
  };

  return (
    <VenueContext.Provider value={value}>
      {children}
    </VenueContext.Provider>
  );
}

export function useVenue() {
  const context = useContext(VenueContext);
  if (context === undefined) {
    throw new Error('useVenue must be used within a VenueProvider');
  }
  return context;
}
