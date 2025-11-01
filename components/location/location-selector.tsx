'use client';

import { useState } from 'react';
import { ChevronDown, MapPin, Plus, Check } from 'lucide-react';
import { useLocation } from '@/contexts/location-context';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { AddLocationForm } from './add-location-form';
import { UpgradePrompt } from '@/components/subscription/upgrade-prompt';

export function LocationSelector() {
  const {
    locations,
    currentLocation,
    switchLocation,
    canAddLocation,
    remainingQuota,
    maxLocations,
  } = useLocation();
  
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const handleAddLocation = () => {
    if (canAddLocation) {
      setShowAddLocation(true);
    } else {
      setShowUpgrade(true);
    }
  };

  if (!currentLocation || locations.length === 0) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <MapPin className="h-4 w-4" />
        <span>No locations</span>
      </div>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center space-x-2 text-left">
            <MapPin className="h-4 w-4" />
            <div className="flex flex-col">
              <span className="font-medium">{currentLocation.name}</span>
              <span className="text-xs text-gray-500">
                {currentLocation.city}, {currentLocation.state}
              </span>
            </div>
            <ChevronDown className="h-4 w-4" />
            {currentLocation.is_default && (
              <Badge variant="secondary" className="ml-2 text-xs">
                Default
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="start" className="w-64">
          <div className="px-2 py-1.5 text-xs font-medium text-gray-500">
            Select Location ({locations.length}/{maxLocations === -1 ? '∞' : maxLocations})
          </div>
          
          {locations.map((location) => (
            <DropdownMenuItem
              key={location.id}
              onClick={() => switchLocation(location.id)}
              className="flex items-center justify-between"
            >
              <div className="flex flex-col">
                <span className="font-medium">{location.name}</span>
                <span className="text-xs text-gray-500">
                  {location.city}, {location.state}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                {location.is_default && (
                  <Badge variant="outline" className="text-xs">
                    Default
                  </Badge>
                )}
                {currentLocation?.id === location.id && (
                  <Check className="h-4 w-4 text-green-600" />
                )}
              </div>
            </DropdownMenuItem>
          ))}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={handleAddLocation}>
            <Plus className="h-4 w-4 mr-2" />
            Add Location
            {!canAddLocation && (
              <Badge variant="secondary" className="ml-auto text-xs">
                Upgrade Required
              </Badge>
            )}
          </DropdownMenuItem>
          
          {maxLocations !== -1 && (
            <div className="px-2 py-1.5 text-xs text-gray-500">
              {remainingQuota > 0 
                ? `${remainingQuota} location${remainingQuota !== 1 ? 's' : ''} remaining`
                : 'Location limit reached'
              }
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Add Location Dialog */}
      <Dialog open={showAddLocation} onOpenChange={setShowAddLocation}>
        <DialogContent className="max-w-2xl">
          <AddLocationForm onSuccess={() => setShowAddLocation(false)} />
        </DialogContent>
      </Dialog>

      {/* Upgrade Dialog */}
      <UpgradePrompt
        feature="locations"
        currentPlan="Free"
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
      />
    </>
  );
}