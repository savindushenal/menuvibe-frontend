'use client';

import { motion } from 'framer-motion';
import { Crown, Package, MapPin, Image, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
// import { Progress } from '@/components/ui/progress'; // Temporarily disabled for build
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/contexts/subscription-context';

// Simple progress bar replacement
const Progress = ({ value, className }: { value: number; className?: string }) => (
  <div className={`h-2 bg-gray-200 rounded-full overflow-hidden ${className || ''}`}>
    <div 
      className="h-full bg-primary transition-all duration-300"
      style={{ width: `${value}%` }}
    />
  </div>
);

interface SubscriptionStatusBarProps {
  onUpgradeClick: () => void;
}

export function SubscriptionStatusBar({ onUpgradeClick }: SubscriptionStatusBarProps) {
  const { subscription, loading } = useSubscription();

  if (loading || !subscription) {
    return null;
  }

  const { plan, usage, limits } = subscription;

  const getProgressPercentage = (current: number, max: number): number => {
    if (max === -1) return 0; // Unlimited
    return Math.min((current / max) * 100, 100);
  };

  const getProgressColor = (percentage: number): string => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-emerald-500';
  };

  const isNearLimit = (current: number, max: number): boolean => {
    if (max === -1) return false;
    return (current / max) >= 0.8;
  };

  const menuProgress = getProgressPercentage(usage.menus_count, limits.max_menus);
  const itemProgress = getProgressPercentage(usage.menu_items_count, limits.max_menu_items);
  const locationProgress = getProgressPercentage(usage.locations_count, limits.max_locations);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <Card className="border-l-4 border-l-emerald-500">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-emerald-600" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{plan?.name} Plan</span>
                    <Badge variant="outline" className="text-xs">
                      {plan?.formatted_price}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {plan?.description}
                  </p>
                </div>
              </div>

              {/* Usage Statistics */}
              <div className="flex items-center gap-6">
                {/* Menus */}
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-gray-500" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {usage.menus_count}
                        {limits.max_menus === -1 ? '' : `/${limits.max_menus}`} Menus
                      </span>
                      {isNearLimit(usage.menus_count, limits.max_menus) && (
                        <Badge variant="destructive" className="text-xs">
                          Near Limit
                        </Badge>
                      )}
                    </div>
                    {limits.max_menus !== -1 && (
                      <Progress
                        value={menuProgress}
                        className="w-20 h-1 mt-1"
                        // className={`w-20 h-1 mt-1 ${getProgressColor(menuProgress)}`}
                      />
                    )}
                  </div>
                </div>

                {/* Menu Items */}
                <div className="flex items-center gap-2">
                  <Image className="w-4 h-4 text-gray-500" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {usage.menu_items_count}
                        {limits.max_menu_items === -1 ? '' : `/${limits.max_menu_items}`} Items
                      </span>
                      {isNearLimit(usage.menu_items_count, limits.max_menu_items) && (
                        <Badge variant="destructive" className="text-xs">
                          Near Limit
                        </Badge>
                      )}
                    </div>
                    {limits.max_menu_items !== -1 && (
                      <Progress
                        value={itemProgress}
                        className="w-20 h-1 mt-1"
                      />
                    )}
                  </div>
                </div>

                {/* Locations */}
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {usage.locations_count}
                        {limits.max_locations === -1 ? '' : `/${limits.max_locations}`} Locations
                      </span>
                      {isNearLimit(usage.locations_count, limits.max_locations) && (
                        <Badge variant="destructive" className="text-xs">
                          Near Limit
                        </Badge>
                      )}
                    </div>
                    {limits.max_locations !== -1 && (
                      <Progress
                        value={locationProgress}
                        className="w-20 h-1 mt-1"
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {plan?.slug === 'free' && (
                <Button
                  onClick={onUpgradeClick}
                  size="sm"
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Upgrade Plan
                </Button>
              )}
              
              {plan?.slug !== 'free' && (
                <Button
                  onClick={onUpgradeClick}
                  variant="outline"
                  size="sm"
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Manage Plan
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}