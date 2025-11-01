'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Eye, 
  Scan, 
  TrendingUp, 
  Users, 
  ArrowUp, 
  ArrowDown, 
  MapPin, 
  Plus,
  BarChart3,
  Camera,
  Settings
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProtectedRoute } from '@/components/protected-route';
import { FeatureBlocker } from '@/components/subscription/feature-blocker';
import { LocationBlock, AnalyticsBlock, PhotoUploadBlock } from '@/components/subscription/inline-feature-block';
import { useSubscription } from '@/contexts/subscription-context';

export const dynamic = 'force-dynamic';

const stats = [
  {
    title: 'Total Menu Views',
    value: '12,456',
    change: '+12.5%',
    trend: 'up',
    icon: Eye,
    color: 'emerald',
  },
  {
    title: 'QR Code Scans',
    value: '3,842',
    change: '+8.2%',
    trend: 'up',
    icon: Scan,
    color: 'blue',
  },
  {
    title: 'Popular Items',
    value: '24',
    change: '+3',
    trend: 'up',
    icon: TrendingUp,
    color: 'orange',
  },
  {
    title: 'Active Customers',
    value: '1,234',
    change: '-2.4%',
    trend: 'down',
    icon: Users,
    color: 'purple',
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

function DashboardWithBlocks() {
  const { currentPlan, canAccessFeature, subscription } = useSubscription();
  const [showLocationModal, setShowLocationModal] = useState(false);

  const getCurrentPlanInfo = () => {
    if (!subscription?.plan) {
      return { name: 'Free', locations: 1, menus: 1, items: 10 };
    }
    
    return {
      name: subscription.plan.name,
      locations: subscription.plan.limits.max_locations === -1 ? 'Unlimited' : subscription.plan.limits.max_locations,
      menus: subscription.plan.limits.max_menus === -1 ? 'Unlimited' : subscription.plan.limits.max_menus,
      items: subscription.plan.limits.max_menu_items === -1 ? 'Unlimited' : subscription.plan.limits.max_menu_items,
    };
  };

  const planInfo = getCurrentPlanInfo();

  return (
    <ProtectedRoute>
      <div className="space-y-8">
        {/* Header with Plan Info */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back! Here's what's happening with your restaurant.
            </p>
          </div>
          <div className="flex items-center gap-2 mt-4 sm:mt-0">
            <Badge variant="outline" className="text-sm">
              {planInfo.name} Plan
            </Badge>
            <span className="text-sm text-gray-500">
              {planInfo.locations} {typeof planInfo.locations === 'number' && planInfo.locations === 1 ? 'location' : 'locations'}
            </span>
          </div>
        </div>

        {/* Upgrade Banner for Free Users */}
        {currentPlan === 'Free' && (
          <FeatureBlocker
            feature="Upgrade Available"
            requiredPlan="pro"
            style="banner"
            title="Unlock More Features"
            description="Get more locations, advanced analytics, and premium features with Pro"
            benefits={["Multiple locations", "Photo uploads", "Priority support"]}
            dismissible={true}
          />
        )}

        {/* Stats Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        >
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            const isAdvancedStat = index > 1; // Mock some stats as advanced features
            
            if (isAdvancedStat && !canAccessFeature('Advanced Analytics')) {
              return (
                <motion.div key={stat.title} variants={item}>
                  <FeatureBlocker
                    feature="Advanced Analytics"
                    requiredPlan="enterprise"
                    style="overlay"
                    title="Advanced Stats"
                    description="Get detailed insights with Enterprise"
                    benefits={["Real-time data", "Custom reports", "Export options"]}
                    showDemo={true}
                  >
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                          {stat.title}
                        </CardTitle>
                        <Icon className={`h-4 w-4 text-${stat.color}-600`} />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stat.value}</div>
                        <div className="flex items-center text-xs text-muted-foreground">
                          {stat.trend === 'up' ? (
                            <ArrowUp className="mr-1 h-3 w-3 text-emerald-600" />
                          ) : (
                            <ArrowDown className="mr-1 h-3 w-3 text-red-600" />
                          )}
                          {stat.change} from last month
                        </div>
                      </CardContent>
                    </Card>
                  </FeatureBlocker>
                </motion.div>
              );
            }

            return (
              <motion.div key={stat.title} variants={item}>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {stat.title}
                    </CardTitle>
                    <Icon className={`h-4 w-4 text-${stat.color}-600`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="flex items-center text-xs text-muted-foreground">
                      {stat.trend === 'up' ? (
                        <ArrowUp className="mr-1 h-3 w-3 text-emerald-600" />
                      ) : (
                        <ArrowDown className="mr-1 h-3 w-3 text-red-600" />
                      )}
                      {stat.change} from last month
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Quick Actions Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Locations Management */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Locations
            </h3>
            
            {canAccessFeature('Multiple Locations') ? (
              <Card>
                <CardHeader>
                  <CardTitle>Manage Locations</CardTitle>
                  <CardDescription>Add and manage multiple restaurant locations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 border rounded-lg">
                      <h4 className="font-medium">Main Location</h4>
                      <p className="text-sm text-gray-600">Downtown Restaurant</p>
                    </div>
                    <Button className="w-full" onClick={() => setShowLocationModal(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Location
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <LocationBlock type="replace" />
            )}
          </div>

          {/* Analytics Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Analytics
            </h3>
            
            <AnalyticsBlock type="replace" />
          </div>

          {/* Photo Management */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Photos
            </h3>
            
            <PhotoUploadBlock type="replace" />
          </div>
        </div>

        {/* Recent Activity Section */}
        <motion.div variants={item}>
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest updates from your restaurant
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">Menu updated</p>
                    <p className="text-xs text-gray-600">Added 3 new items to Appetizers</p>
                  </div>
                  <span className="text-xs text-gray-500">2 hours ago</span>
                </div>
                
                <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">QR code scanned</p>
                    <p className="text-xs text-gray-600">Customer viewed your menu</p>
                  </div>
                  <span className="text-xs text-gray-500">5 hours ago</span>
                </div>

                {/* Show blocked advanced activity for non-enterprise users */}
                {!canAccessFeature('Advanced Analytics') && (
                  <FeatureBlocker
                    feature="Advanced Analytics"
                    requiredPlan="enterprise"
                    style="banner"
                    title="Get More Detailed Activity"
                    description="See customer behavior, peak hours, and detailed analytics"
                    benefits={["Real-time customer tracking", "Detailed reports", "Export data"]}
                    dismissible={true}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Modal for adding location (when user tries to add but reaches limit) */}
        {showLocationModal && !canAccessFeature('Multiple Locations') && (
          <FeatureBlocker
            feature="Multiple Locations"
            requiredPlan="pro"
            style="modal"
            title="Add More Locations"
            description="Expand your business with multiple restaurant locations"
            benefits={[
              "Manage up to 3 locations",
              "Individual menus per location", 
              "Location-specific analytics",
              "Centralized dashboard"
            ]}
            onDismiss={() => setShowLocationModal(false)}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}

export default DashboardWithBlocks;