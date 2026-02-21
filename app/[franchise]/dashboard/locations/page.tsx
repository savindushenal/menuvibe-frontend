'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Plus, Clock } from 'lucide-react';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';

interface Location {
  id: number;
  name: string;
  address: string;
  phone: string;
  is_active: boolean;
  menus: Array<{ id: number; name: string }>;
}

export default function FranchiseLocationsPage() {
  const params = useParams();
  const router = useRouter();
  const franchiseSlug = params?.franchise as string;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/franchise/${franchiseSlug}/locations`);
        
        if (response.data.success) {
          setLocations(response.data.data || []);
        }
      } catch (err: any) {
        console.error('Failed to fetch locations:', err);
        setError(err.response?.data?.message || 'Failed to load locations');
      } finally {
        setLoading(false);
      }
    };

    if (franchiseSlug) {
      fetchLocations();
    }
  }, [franchiseSlug]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <p className="text-red-600">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Locations</h1>
          <p className="text-neutral-600">Manage your franchise locations</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Location
        </Button>
      </div>

      {/* Locations Grid */}
      {locations.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <MapPin className="w-12 h-12 mx-auto text-neutral-400 mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 mb-2">No locations yet</h3>
            <p className="text-neutral-600 mb-4">Get started by adding your first location</p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Location
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {locations.map((location) => (
            <Card key={location.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{location.name}</CardTitle>
                    <CardDescription className="mt-1">{location.address}</CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.push(`/franchise/${franchiseSlug}/dashboard/locations/${location.id}`)}
                    title="Manage menu schedules"
                  >
                    <Clock className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-600">
                    {location.menus?.length || 0} menu{(location.menus?.length || 0) !== 1 ? 's' : ''}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    location.is_active 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : 'bg-neutral-100 text-neutral-600'
                  }`}>
                    {location.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
