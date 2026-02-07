'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, X, Lock, Zap, Crown, Star } from 'lucide-react';
import { useSubscription } from '@/contexts/subscription-context';
import { FeatureLock } from './feature-lock';

interface Feature {
  name: string;
  description: string;
  free: boolean;
  pro: boolean;
  enterprise: boolean;
  custom: boolean;
  icon?: React.ReactNode;
}

const features: Feature[] = [
  {
    name: 'Single Location',
    description: 'Manage one restaurant location',
    free: true,
    pro: true,
    enterprise: true,
    custom: true,
  },
  {
    name: 'Multiple Locations (up to 5)',
    description: 'Manage multiple restaurant locations',
    free: false,
    pro: true,
    enterprise: true,
    custom: true,
    icon: <Lock className="w-4 h-4" />
  },
  {
    name: 'Multiple Locations (up to 5)',
    description: 'Manage up to 5 restaurant locations',
    free: false,
    pro: false,
    enterprise: true,
    custom: true,
    icon: <Lock className="w-4 h-4" />
  },
  {
    name: 'Unlimited Locations',
    description: 'Manage unlimited restaurant locations',
    free: false,
    pro: false,
    enterprise: false,
    custom: true,
    icon: <Lock className="w-4 h-4" />
  },
  {
    name: 'Basic Menu Management',
    description: 'Create and edit menus and items',
    free: true,
    pro: true,
    enterprise: true,
    custom: true,
  },
  {
    name: 'Photo Uploads',
    description: 'Add photos to menu items',
    free: false,
    pro: true,
    enterprise: true,
    custom: true,
    icon: <Lock className="w-4 h-4" />
  },
  {
    name: 'Custom QR Codes',
    description: 'Branded QR codes for menus',
    free: false,
    pro: true,
    enterprise: true,
    custom: true,
    icon: <Lock className="w-4 h-4" />
  },
  {
    name: 'Basic Analytics',
    description: 'View basic menu performance',
    free: true,
    pro: true,
    enterprise: true,
    custom: true,
  },
  {
    name: 'Advanced Analytics',
    description: 'Detailed insights and reporting',
    free: false,
    pro: false,
    enterprise: true,
    custom: true,
    icon: <Lock className="w-4 h-4" />
  },
  {
    name: 'API Access',
    description: 'Integrate with external systems',
    free: false,
    pro: false,
    enterprise: true,
    custom: true,
    icon: <Lock className="w-4 h-4" />
  },
  {
    name: 'Priority Support',
    description: 'Faster response times',
    free: false,
    pro: true,
    enterprise: true,
    custom: true,
    icon: <Lock className="w-4 h-4" />
  },
  {
    name: 'Dedicated Support',
    description: 'Personal account manager',
    free: false,
    pro: false,
    enterprise: true,
    custom: true,
    icon: <Lock className="w-4 h-4" />
  },
  {
    name: 'White Label Branding',
    description: 'Remove MenuVire branding',
    free: false,
    pro: false,
    enterprise: false,
    custom: true,
    icon: <Lock className="w-4 h-4" />
  },
  {
    name: 'Custom Integrations',
    description: 'Tailored API integrations',
    free: false,
    pro: false,
    enterprise: false,
    custom: true,
    icon: <Lock className="w-4 h-4" />
  },
];

export function FeatureComparison() {
  const { currentPlan, canAccessFeature } = useSubscription();

  const getPlanAccess = (feature: Feature) => {
    const currentPlanSlug = currentPlan.toLowerCase();
    
    switch (currentPlanSlug) {
      case 'free':
        return feature.free;
      case 'pro':
        return feature.pro;
      case 'enterprise':
        return feature.enterprise;
      case 'custom-enterprise':
        return feature.custom;
      default:
        return feature.free;
    }
  };

  const getUpgradeButtonText = (feature: Feature) => {
    if (feature.pro && !feature.free) return 'Upgrade to Pro';
    if (feature.enterprise && !feature.pro) return 'Upgrade to Enterprise';
    if (feature.custom && !feature.enterprise) return 'Contact Sales';
    return 'Upgrade';
  };

  const getRequiredPlan = (feature: Feature): 'pro' | 'enterprise' | 'custom-enterprise' => {
    if (feature.pro && !feature.free) return 'pro';
    if (feature.enterprise && !feature.pro) return 'enterprise';
    if (feature.custom && !feature.enterprise) return 'custom-enterprise';
    return 'pro';
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Features Available to You</h2>
        <p className="text-muted-foreground">
          Current plan: <Badge variant="outline">{currentPlan}</Badge>
        </p>
      </div>

      <div className="grid gap-4">
        {features.map((feature, index) => {
          const hasAccess = getPlanAccess(feature);
          const requiredPlan = getRequiredPlan(feature);
          
          return (
            <Card key={index} className={`transition-all ${
              hasAccess ? 'border-green-200 bg-green-50/50' : 'border-gray-200 bg-gray-50/50'
            }`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {hasAccess ? (
                      <div className="p-2 bg-green-100 rounded-full">
                        <Check className="w-4 h-4 text-green-600" />
                      </div>
                    ) : (
                      <div className="p-2 bg-gray-100 rounded-full">
                        <Lock className="w-4 h-4 text-gray-600" />
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-lg">{feature.name}</CardTitle>
                      <CardDescription>{feature.description}</CardDescription>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {hasAccess ? (
                      <Badge variant="default" className="bg-green-600">
                        <Check className="w-3 h-3 mr-1" />
                        Available
                      </Badge>
                    ) : (
                      <>
                        <Badge variant="outline" className="text-gray-600">
                          <Lock className="w-3 h-3 mr-1" />
                          Locked
                        </Badge>
                        <Button size="sm" variant="outline">
                          {getUpgradeButtonText(feature)}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              {!hasAccess && (
                <CardContent className="pt-0">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-amber-800">
                      <Star className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        Unlock with {getUpgradeButtonText(feature).replace('Upgrade to ', '').replace('Contact ', '')}
                      </span>
                    </div>
                    <p className="text-sm text-amber-700 mt-1">
                      This feature is available in higher-tier plans. Upgrade to get access immediately.
                    </p>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Plan Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle>Plan Comparison</CardTitle>
          <CardDescription>
            See what's included in each plan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">Feature</th>
                  <th className="text-center p-3 font-medium">Free</th>
                  <th className="text-center p-3 font-medium">Pro</th>
                  <th className="text-center p-3 font-medium">Enterprise</th>
                  <th className="text-center p-3 font-medium">Custom</th>
                </tr>
              </thead>
              <tbody>
                {features.slice(0, 8).map((feature, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-3 font-medium">{feature.name}</td>
                    <td className="text-center p-3">
                      {feature.free ? (
                        <Check className="w-4 h-4 text-green-600 mx-auto" />
                      ) : (
                        <X className="w-4 h-4 text-gray-400 mx-auto" />
                      )}
                    </td>
                    <td className="text-center p-3">
                      {feature.pro ? (
                        <Check className="w-4 h-4 text-green-600 mx-auto" />
                      ) : (
                        <X className="w-4 h-4 text-gray-400 mx-auto" />
                      )}
                    </td>
                    <td className="text-center p-3">
                      {feature.enterprise ? (
                        <Check className="w-4 h-4 text-green-600 mx-auto" />
                      ) : (
                        <X className="w-4 h-4 text-gray-400 mx-auto" />
                      )}
                    </td>
                    <td className="text-center p-3">
                      {feature.custom ? (
                        <Check className="w-4 h-4 text-green-600 mx-auto" />
                      ) : (
                        <X className="w-4 h-4 text-gray-400 mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Call to Action */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="text-center p-6">
          <Crown className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Ready to Unlock More Features?</h3>
          <p className="text-muted-foreground mb-4">
            Upgrade your plan to access advanced features and grow your business
          </p>
          <div className="flex gap-3 justify-center">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Zap className="w-4 h-4 mr-2" />
              Upgrade to Pro
            </Button>
            <Button variant="outline">
              <Crown className="w-4 h-4 mr-2" />
              View All Plans
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}