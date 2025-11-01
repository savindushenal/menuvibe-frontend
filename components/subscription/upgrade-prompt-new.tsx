'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  billing_period: string;
  features: string[];
  limits: {
    max_locations: number;
    max_menus_per_location: number;
    max_menu_items_per_menu: number;
  };
  is_custom: boolean;
  formatted_price: string;
}

interface UpgradePromptProps {
  feature: string;
  currentPlan: string;
  onClose: () => void;
}

export function UpgradePrompt({ feature, currentPlan, onClose }: UpgradePromptProps) {
  const [selectedPlan, setSelectedPlan] = useState<string>('pro');
  const [isLoading, setIsLoading] = useState(false);

  // Mock subscription plans - in real app, fetch from API
  const plans: SubscriptionPlan[] = [
    {
      id: 'pro',
      name: 'Pro',
      price: 29,
      billing_period: 'monthly',
      features: [
        'Up to 3 locations',
        'Up to 5 menus per location',
        'Up to 50 menu items per menu',
        'Photo uploads',
        'Custom QR codes',
        'Real-time analytics',
        'Priority support'
      ],
      limits: {
        max_locations: 3,
        max_menus_per_location: 5,
        max_menu_items_per_menu: 50
      },
      is_custom: false,
      formatted_price: '$29/month'
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 99,
      billing_period: 'monthly',
      features: [
        'Up to 5 locations',
        'Unlimited menus per location',
        'Unlimited menu items',
        'Everything in Pro',
        'Advanced analytics',
        'API access',
        'Dedicated support'
      ],
      limits: {
        max_locations: 5,
        max_menus_per_location: -1,
        max_menu_items_per_menu: -1
      },
      is_custom: false,
      formatted_price: '$99/month'
    },
    {
      id: 'custom-enterprise',
      name: 'Custom Enterprise',
      price: 0,
      billing_period: 'custom',
      features: [
        'Unlimited locations',
        'Unlimited menus and items',
        'White-label branding',
        'Dedicated account manager',
        'Custom integrations',
        'SLA guarantee',
        'Custom training'
      ],
      limits: {
        max_locations: -1,
        max_menus_per_location: -1,
        max_menu_items_per_menu: -1
      },
      is_custom: true,
      formatted_price: 'Custom Pricing'
    }
  ];

  const handleUpgrade = async (planId: string) => {
    setIsLoading(true);
    try {
      if (planId === 'custom-enterprise') {
        // For custom plans, redirect to contact form or sales
        window.open('mailto:sales@menuvibe.com?subject=Custom Enterprise Plan Inquiry', '_blank');
      } else {
        // Handle standard plan upgrade
        console.log('Upgrading to plan:', planId);
        // TODO: Implement actual upgrade logic
      }
    } catch (error) {
      console.error('Upgrade failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getFeatureMessage = () => {
    switch (feature) {
      case 'locations':
        return 'You\'ve reached your location limit. Upgrade to add more locations for your business.';
      case 'menus':
        return 'You\'ve reached your menu limit for this location. Upgrade to add more menus.';
      case 'menu_items':
        return 'You\'ve reached your menu item limit. Upgrade to add more items to your menus.';
      default:
        return 'Upgrade your plan to unlock this feature.';
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Upgrade Required</DialogTitle>
        <DialogDescription>
          {getFeatureMessage()}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 mt-6">
        <div className="text-sm text-gray-600 mb-4">
          Current plan: <Badge variant="outline">{currentPlan}</Badge>
        </div>

        <div className="grid gap-4">
          {plans.map((plan) => (
            <Card 
              key={plan.id}
              className={`cursor-pointer transition-colors ${
                selectedPlan === plan.id 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'hover:border-gray-300'
              }`}
              onClick={() => setSelectedPlan(plan.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <CardDescription className="text-xl font-semibold text-gray-900">
                      {plan.formatted_price}
                    </CardDescription>
                  </div>
                  {selectedPlan === plan.id && (
                    <Check className="h-5 w-5 text-blue-600" />
                  )}
                  {plan.is_custom && (
                    <Badge variant="secondary" className="ml-2">
                      Custom
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                    <div>
                      <span className="font-medium">Locations: </span>
                      {plan.limits.max_locations === -1 ? 'Unlimited' : plan.limits.max_locations}
                    </div>
                    <div>
                      <span className="font-medium">Menus: </span>
                      {plan.limits.max_menus_per_location === -1 ? 'Unlimited' : `${plan.limits.max_menus_per_location}/location`}
                    </div>
                    <div>
                      <span className="font-medium">Items: </span>
                      {plan.limits.max_menu_items_per_menu === -1 ? 'Unlimited' : `${plan.limits.max_menu_items_per_menu}/menu`}
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <div className="text-sm font-medium mb-2">Key Features:</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-sm text-gray-600">
                      {plan.features.slice(0, 4).map((feature, index) => (
                        <div key={index} className="flex items-center">
                          <Check className="h-3 w-3 text-green-500 mr-1 flex-shrink-0" />
                          {feature}
                        </div>
                      ))}
                    </div>
                    {plan.features.length > 4 && (
                      <div className="text-sm text-gray-500 mt-1">
                        +{plan.features.length - 4} more features
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Contact for Custom Plans */}
        {plans.find(p => p.id === selectedPlan)?.is_custom && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900">Need a Custom Solution?</h4>
            <p className="text-sm text-blue-700 mt-1">
              Perfect for restaurant chains with 100+ locations. Get custom pricing, 
              dedicated support, and tailored features for your business.
            </p>
            <div className="mt-2 text-sm text-blue-600">
              ✓ Volume discounts • ✓ Flexible billing • ✓ Custom integrations
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={() => handleUpgrade(selectedPlan)}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 
             plans.find(p => p.id === selectedPlan)?.is_custom ? 'Contact Sales' : 'Upgrade Now'
            }
          </Button>
        </div>
      </div>
    </>
  );
}