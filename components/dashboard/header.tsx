'use client';

import { Bell, Search, User, LogOut, MapPin, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/auth-context';
import { useLocation } from '@/contexts/location-context';
import { Badge } from '@/components/ui/badge';

export function DashboardHeader() {
  const { user, logout } = useAuth();
  const { locations, currentLocation, switchLocation } = useLocation();

  const handleLogout = async () => {
    await logout();
  };

  const handleLocationChange = (locationId: string) => {
    switchLocation(locationId);
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="bg-white border-b border-neutral-200 px-8 py-4 flex-shrink-0 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 max-w-xl flex items-center gap-4">
          {/* Location Selector */}
          {locations.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 min-w-[200px] justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-500" />
                    <span className="truncate">{currentLocation?.name || 'Select Location'}</span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-neutral-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[250px]">
                {locations.map((location) => (
                  <DropdownMenuItem
                    key={location.id}
                    onClick={() => handleLocationChange(location.id)}
                    className={currentLocation?.id === location.id ? 'bg-emerald-50' : ''}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{location.name}</span>
                      </div>
                      {location.is_default && (
                        <Badge variant="secondary" className="text-xs">Default</Badge>
                      )}
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <Input
              placeholder="Search menu items, categories..."
              className="pl-10 bg-neutral-50 border-neutral-200 focus:bg-white"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5 text-neutral-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full"></span>
            </Button>
          </motion.div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-neutral-50 cursor-pointer transition-colors"
              >
                <Avatar className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-emerald-600">
                  <AvatarFallback className="text-white font-semibold">
                    {user ? getUserInitials(user.name) : <User className="w-5 h-5" />}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block">
                  <p className="text-sm font-semibold text-neutral-900">{user?.name || 'User'}</p>
                  <p className="text-xs text-neutral-500">Restaurant Owner</p>
                </div>
              </motion.div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
