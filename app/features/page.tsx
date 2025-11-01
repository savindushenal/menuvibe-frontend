'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/contexts/subscription-context';
import { FeatureComparison } from '@/components/subscription/feature-comparison';
import { 
  MultiLocationCard,
  AdvancedAnalyticsCard,
  PhotoUploadsCard,
  CustomQRCard,
  UnlimitedLocationsCard
} from '@/components/subscription/locked-feature-cards';
import { FeatureLock } from '@/components/subscription/feature-lock';
import { 
  Crown, 
  Zap, 
  Star, 
  TrendingUp,
  Users,
  MapPin,
  BarChart3,
  Camera
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function FeaturesPage() {
  const { currentPlan, subscription } = useSubscription();

  const getCurrentPlanFeatures = () => {
    if (!subscription?.plan) {
      return {
        locations: 1,
        menus: 1,
        items: 10,
        features: ['Basic menu management', 'QR code generation', 'Basic analytics']
      };
    }

    return {
      locations: subscription.plan.limits.max_locations === -1 ? 'Unlimited' : subscription.plan.limits.max_locations,
      menus: subscription.plan.limits.max_menus === -1 ? 'Unlimited' : subscription.plan.limits.max_menus,
      items: subscription.plan.limits.max_menu_items === -1 ? 'Unlimited' : subscription.plan.limits.max_menu_items,
      features: subscription.plan.features
    };
  };

  const planFeatures = getCurrentPlanFeatures();

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Features & Upgrade Options</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Discover what's available in your current plan and see what features you can unlock 
          by upgrading to higher-tier plans.
        </p>
        <div className="flex items-center justify-center gap-2">
          <span className="text-sm text-muted-foreground">Current plan:</span>
          <Badge variant="outline" className="text-base px-3 py-1">
            {currentPlan}
          </Badge>
        </div>
      </div>

      {/* Current Plan Summary */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-blue-600" />
            Your Current Plan: {currentPlan}
          </CardTitle>
          <CardDescription>
            What you have access to right now
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-white rounded-lg border">
              <MapPin className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">{planFeatures.locations}</div>
              <div className="text-sm text-muted-foreground">Locations</div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg border">
              <BarChart3 className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">{planFeatures.menus}</div>
              <div className="text-sm text-muted-foreground">Menus per Location</div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg border">
              <Camera className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">{planFeatures.items}</div>
              <div className="text-sm text-muted-foreground">Items per Menu</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Locked Features for Current Plan */}
      {currentPlan === 'Free' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-4">🔒 Features You're Missing</h2>
            <p className="text-muted-foreground mb-6">
              Upgrade to unlock these powerful features and grow your business
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <MultiLocationCard />
            <PhotoUploadsCard />
            <CustomQRCard />
            <AdvancedAnalyticsCard />
          </div>
        </div>
      )}

      {currentPlan === 'Pro' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-4">🚀 Unlock Enterprise Features</h2>
            <p className="text-muted-foreground mb-6">
              Take your restaurant to the next level with Enterprise features
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <AdvancedAnalyticsCard />
            <UnlimitedLocationsCard />
          </div>
        </div>
      )}

      {currentPlan === 'Enterprise' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-4">👑 Custom Enterprise Options</h2>
            <p className="text-muted-foreground mb-6">
              Perfect for large restaurant chains and franchises
            </p>
          </div>
          
          <UnlimitedLocationsCard />
        </div>
      )}

      {/* Detailed Feature Comparison */}
      <FeatureComparison />

      {/* Usage Examples with Locks */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">See Features in Action</h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Analytics Preview */}
          <FeatureLock feature="Advanced Analytics" requiredPlan="enterprise">
            <Card>
              <CardHeader>
                <CardTitle>Analytics Dashboard</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Total Orders</span>
                    <span className="font-bold">1,234</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Revenue</span>
                    <span className="font-bold">$12,450</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Popular Items</span>
                    <span className="font-bold">Burger</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </FeatureLock>

          {/* Multiple Locations Preview */}
          <FeatureLock feature="Multiple Locations" requiredPlan="pro">
            <Card>
              <CardHeader>
                <CardTitle>Location Manager</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="p-2 bg-green-50 border border-green-200 rounded">
                    <div className="font-medium">Main Street Location</div>
                    <div className="text-sm text-muted-foreground">Active • 45 items</div>
                  </div>
                  <div className="p-2 bg-blue-50 border border-blue-200 rounded">
                    <div className="font-medium">Downtown Branch</div>
                    <div className="text-sm text-muted-foreground">Active • 32 items</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </FeatureLock>

          {/* API Access Preview */}
          <FeatureLock feature="API Access" requiredPlan="enterprise">
            <Card>
              <CardHeader>
                <CardTitle>API Integration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-mono text-sm bg-gray-100 p-3 rounded">
                  <div>GET /api/menus</div>
                  <div>POST /api/menu-items</div>
                  <div>GET /api/analytics</div>
                </div>
              </CardContent>
            </Card>
          </FeatureLock>
        </div>
      </div>

      {/* Call to Action */}
      <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
        <CardContent className="text-center p-8">
          <Crown className="w-16 h-16 mx-auto mb-4 opacity-90" />
          <h3 className="text-2xl font-bold mb-2">Ready to Upgrade?</h3>
          <p className="text-purple-100 mb-6 max-w-md mx-auto">
            Unlock all features and take your restaurant business to the next level
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100">
              <Zap className="w-4 h-4 mr-2" />
              View Pricing Plans
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
              Start Free Trial
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}