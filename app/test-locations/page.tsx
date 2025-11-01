'use client';

import { useLocation } from '@/contexts/location-context';
import { LocationSelector } from '@/components/location/location-selector';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Building, BarChart3 } from 'lucide-react';

export default function LocationTestPage() {
  const { 
    locations, 
    currentLocation, 
    isLoading, 
    error,
    canAddLocation,
    remainingQuota,
    maxLocations 
  } = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading locations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Multi-Location Test</h1>
        <p className="text-gray-600">Testing the location management system</p>
      </div>

      {/* Location Selector Test */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="h-5 w-5 mr-2" />
            Location Selector
          </CardTitle>
          <CardDescription>
            Test the location selector component
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LocationSelector />
        </CardContent>
      </Card>

      {/* Current Location Info */}
      {currentLocation && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building className="h-5 w-5 mr-2" />
              Current Location Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Name</p>
                <p className="font-semibold">{currentLocation.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Address</p>
                <p>{currentLocation.address_line_1}</p>
                <p>{currentLocation.city}, {currentLocation.state} {currentLocation.postal_code}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Status</p>
                <div className="flex items-center space-x-2">
                  <Badge variant={currentLocation.is_active ? "default" : "secondary"}>
                    {currentLocation.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  {currentLocation.is_default && (
                    <Badge variant="outline">Default</Badge>
                  )}
                </div>
              </div>
              {currentLocation.cuisine_type && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Cuisine Type</p>
                  <p>{currentLocation.cuisine_type}</p>
                </div>
              )}
              {currentLocation.seating_capacity && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Seating Capacity</p>
                  <p>{currentLocation.seating_capacity} seats</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-500">Menus</p>
                <p>{currentLocation.menus?.length || 0} menus</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subscription Info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Subscription Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Locations</p>
              <p className="text-2xl font-bold">{locations.length}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Max Locations</p>
              <p className="text-2xl font-bold">{maxLocations === -1 ? '∞' : maxLocations}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Remaining Quota</p>
              <p className="text-2xl font-bold">{remainingQuota === -1 ? '∞' : remainingQuota}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Can Add Location</p>
              <Badge variant={canAddLocation ? "default" : "destructive"}>
                {canAddLocation ? 'Yes' : 'No'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* All Locations List */}
      <Card>
        <CardHeader>
          <CardTitle>All Locations ({locations.length})</CardTitle>
          <CardDescription>
            Complete list of all locations for this account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {locations.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No locations found</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {locations.map((location) => (
                <div 
                  key={location.id}
                  className={`p-4 border rounded-lg ${
                    currentLocation?.id === location.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold">{location.name}</h3>
                    <div className="flex space-x-1">
                      {location.is_default && (
                        <Badge variant="outline" className="text-xs">Default</Badge>
                      )}
                      {currentLocation?.id === location.id && (
                        <Badge variant="default" className="text-xs">Current</Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {location.city}, {location.state}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{location.menus?.length || 0} menus</span>
                    <span className={location.is_active ? 'text-green-600' : 'text-gray-400'}>
                      {location.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}