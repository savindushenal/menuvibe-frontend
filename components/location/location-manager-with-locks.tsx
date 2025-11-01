'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Plus, 
  Lock, 
  Crown, 
  Settings,
  MoreVertical,
  Eye
} from 'lucide-react';
import { useLocation } from '@/contexts/location-context';
import { useSubscription } from '@/contexts/subscription-context';
import { MultiLocationCard } from '@/components/subscription/locked-feature-cards';

export function LocationManagerWithLocks() {
  const { locations, currentLocation } = useLocation();
  const { currentPlan, canAccessFeature } = useSubscription();
  
  // Mock additional locations that would be available with upgrades
  const mockLocations = [
    { id: 'mock-1', name: 'Downtown Branch', address: '123 Main St', status: 'coming-soon' },
    { id: 'mock-2', name: 'Mall Location', address: '456 Shopping Center', status: 'coming-soon' },
    { id: 'mock-3', name: 'Airport Terminal', address: '789 Airport Way', status: 'coming-soon' },
    { id: 'mock-4', name: 'University Campus', address: '321 College Ave', status: 'coming-soon' },
    { id: 'mock-5', name: 'Business District', address: '654 Corporate Blvd', status: 'coming-soon' },
  ];

  const getMaxLocations = () => {
    switch (currentPlan.toLowerCase()) {
      case 'free': return 1;
      case 'pro': return 3;
      case 'enterprise': return 5;
      case 'custom-enterprise': return -1; // unlimited
      default: return 1;
    }
  };

  const maxLocations = getMaxLocations();
  const currentLocationsCount = locations.length;
  const canAddMore = canAccessFeature('Multiple Locations') && (maxLocations === -1 || currentLocationsCount < maxLocations);

  const getVisibleMockLocations = () => {
    if (maxLocations === -1) return mockLocations; // Show all for unlimited
    const availableSlots = Math.max(0, maxLocations - currentLocationsCount);
    return mockLocations.slice(0, Math.max(0, availableSlots));
  };

  const visibleMockLocations = getVisibleMockLocations();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Location Manager</h2>
          <p className="text-muted-foreground">
            Manage your restaurant locations ({currentLocationsCount}/{maxLocations === -1 ? '∞' : maxLocations} used)
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline">{currentPlan}</Badge>
          {!canAccessFeature('Multiple Locations') && (
            <Button variant="outline" size="sm">
              <Crown className="w-4 h-4 mr-2" />
              Upgrade for More Locations
            </Button>
          )}
        </div>
      </div>

      {/* Current Locations */}
      <div className="space-y-4">
        <h3 className="font-semibold">Active Locations</h3>
        <div className="grid gap-4">
          {locations.map((location) => (
            <Card key={location.id} className={`${
              currentLocation?.id === location.id ? 'border-blue-500 bg-blue-50' : ''
            }`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-full">
                      <MapPin className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{location.name}</CardTitle>
                      <CardDescription>
                        {location.address_line_1}, {location.city}
                      </CardDescription>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {currentLocation?.id === location.id && (
                      <Badge variant="default">Current</Badge>
                    )}
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>

      {/* Available Slots (Locked/Preview) */}
      {!canAccessFeature('Multiple Locations') && (
        <div className="space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Lock className="w-4 h-4 text-gray-500" />
            Unlock More Locations
          </h3>
          <MultiLocationCard />
        </div>
      )}

      {/* Preview of Additional Locations */}
      {canAccessFeature('Multiple Locations') && visibleMockLocations.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold">Available Location Slots</h3>
          <div className="grid gap-4">
            {visibleMockLocations.map((location) => (
              <Card key={location.id} className="border-dashed border-gray-300 bg-gray-50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 rounded-full">
                        <Plus className="w-4 h-4 text-gray-500" />
                      </div>
                      <div>
                        <CardTitle className="text-lg text-gray-600">Add New Location</CardTitle>
                        <CardDescription>
                          Set up another restaurant location
                        </CardDescription>
                      </div>
                    </div>
                    
                    <Button variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Location
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Upgrade Needed */}
      {maxLocations !== -1 && currentLocationsCount >= maxLocations && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-6 text-center">
            <Lock className="w-12 h-12 text-amber-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Location Limit Reached</h3>
            <p className="text-muted-foreground mb-4">
              You've reached the maximum number of locations for your {currentPlan} plan.
              Upgrade to add more locations.
            </p>
            <div className="flex gap-2 justify-center">
              <Button className="bg-amber-600 hover:bg-amber-700">
                <Crown className="w-4 h-4 mr-2" />
                Upgrade Plan
              </Button>
              <Button variant="outline">
                <Eye className="w-4 h-4 mr-2" />
                View Features
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Custom Enterprise CTA */}
      {currentPlan !== 'Custom Enterprise' && (
        <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Crown className="w-12 h-12 text-emerald-600" />
              <div className="flex-1">
                <h3 className="font-semibold">Need 100+ Locations?</h3>
                <p className="text-sm text-muted-foreground">
                  Our Custom Enterprise plan offers unlimited locations with volume pricing, 
                  dedicated support, and custom integrations.
                </p>
              </div>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                Contact Sales
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}