'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Crown, Zap } from 'lucide-react';
import {
  Dialog,
  DialogContent,
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
  popular?: boolean;
  current?: boolean;
}

interface UpgradePromptProps {
  feature: string;
  currentPlan: string;
  onClose: () => void;
  isOpen: boolean;
  message?: string;
}

export function UpgradePrompt({ 
  feature, 
  currentPlan, 
  onClose, 
  isOpen,
  message = `You've reached the limit for ${feature}s on your current plan.`
}: UpgradePromptProps) {
  const [selectedPlan, setSelectedPlan] = useState<string>('pro');
  const [isLoading, setIsLoading] = useState(false);

  // Subscription plans with multi-location support
  const plans: SubscriptionPlan[] = [
    {
      id: 'pro',
      name: 'Pro',
      price: 29,
      billing_period: 'monthly',
      features: [
        'Up to 5 locations',
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
      formatted_price: '$29/month',
      popular: true,
      current: currentPlan === 'pro'
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
      formatted_price: '$99/month',
      popular: false,
      current: currentPlan === 'enterprise'
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
        'Custom training',
        'Volume pricing'
      ],
      limits: {
        max_locations: -1,
        max_menus_per_location: -1,
        max_menu_items_per_menu: -1
      },
      is_custom: true,
      formatted_price: 'Contact us',
      popular: false,
      current: currentPlan === 'custom-enterprise'
    }
  ];

  const handleUpgrade = async (planId: string) => {
    setIsLoading(true);
    try {
      const plan = plans.find(p => p.id === planId);
      
      if (plan?.is_custom) {
        // Handle custom enterprise plan - open contact form or redirect
        console.log('Opening custom enterprise contact form');
        // TODO: Implement custom enterprise contact logic
      } else {
        // Handle standard plan upgrade
        console.log(`Upgrading to ${planId}`);
        // TODO: Implement Stripe or payment processor integration
      }
      
      // Close dialog after successful action
      onClose();
    } catch (error) {
      console.error('Upgrade error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContactEnterprise = () => {
    // Open contact form or redirect to sales page
    console.log('Contact enterprise sales');
    // TODO: Implement enterprise contact logic
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3">
              <Crown className="w-6 h-6 text-yellow-500" />
              Upgrade Required
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription>
            Choose a plan that fits your business needs
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Upgrade Message */}
          <div className="text-center space-y-2">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-amber-800 font-medium">{message}</p>
              <p className="text-amber-600 text-sm mt-1">
                Upgrade your plan to continue adding {feature}s and unlock more features.
              </p>
            </div>
          </div>

          {/* Pricing Plans */}
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan, index) => (
              <div key={plan.id} className="relative">
                <Card className={`relative h-full transition-all duration-200 hover:shadow-lg ${
                  plan.popular ? 'border-emerald-500 shadow-lg ring-2 ring-emerald-500/20' : ''
                } ${
                  plan.current ? 'border-blue-500 ring-2 ring-blue-500/20' : ''
                }`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-emerald-500 text-white px-3 py-1">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  
                  {plan.current && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-blue-500 text-white px-3 py-1">
                        Current Plan
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="text-center">
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <div className="space-y-1">
                      <div className="flex items-end justify-center gap-1">
                        {plan.is_custom ? (
                          <span className="text-2xl font-bold text-emerald-600">
                            {plan.formatted_price}
                          </span>
                        ) : (
                          <>
                            <span className="text-4xl font-bold">${plan.price}</span>
                            <span className="text-sm text-muted-foreground">/{plan.billing_period}</span>
                          </>
                        )}
                      </div>
                      {plan.is_custom && (
                        <p className="text-sm text-muted-foreground">
                          Custom pricing for 100+ locations
                        </p>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <ul className="space-y-2">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      className={`w-full ${
                        plan.current
                          ? 'bg-gray-100 text-gray-600 cursor-not-allowed'
                          : plan.is_custom
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : plan.popular
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-gray-900 hover:bg-gray-800 text-white'
                      }`}
                      onClick={() => {
                        if (plan.current) return;
                        if (plan.is_custom) {
                          handleContactEnterprise();
                        } else {
                          handleUpgrade(plan.id);
                        }
                      }}
                      disabled={plan.current || isLoading}
                    >
                      {plan.current ? (
                        'Current Plan'
                      ) : plan.is_custom ? (
                        'Contact Sales'
                      ) : (
                        <>
                          <Zap className="w-4 h-4 mr-2" />
                          Upgrade to {plan.name}
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>

          {/* Features Comparison */}
          <div className="mt-8 space-y-4">
            <h3 className="text-lg font-semibold text-center">Plan Comparison</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-200 rounded-lg">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 p-3 text-left">Feature</th>
                    <th className="border border-gray-200 p-3 text-center">Pro</th>
                    <th className="border border-gray-200 p-3 text-center">Enterprise</th>
                    <th className="border border-gray-200 p-3 text-center">Custom Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-200 p-3 font-medium">Max Locations</td>
                    <td className="border border-gray-200 p-3 text-center">3</td>
                    <td className="border border-gray-200 p-3 text-center">5</td>
                    <td className="border border-gray-200 p-3 text-center">Unlimited</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-200 p-3 font-medium">Menus per Location</td>
                    <td className="border border-gray-200 p-3 text-center">5</td>
                    <td className="border border-gray-200 p-3 text-center">Unlimited</td>
                    <td className="border border-gray-200 p-3 text-center">Unlimited</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 p-3 font-medium">Menu Items per Menu</td>
                    <td className="border border-gray-200 p-3 text-center">50</td>
                    <td className="border border-gray-200 p-3 text-center">Unlimited</td>
                    <td className="border border-gray-200 p-3 text-center">Unlimited</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-200 p-3 font-medium">Support</td>
                    <td className="border border-gray-200 p-3 text-center">Priority</td>
                    <td className="border border-gray-200 p-3 text-center">Dedicated</td>
                    <td className="border border-gray-200 p-3 text-center">Account Manager</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 p-3 font-medium">API Access</td>
                    <td className="border border-gray-200 p-3 text-center">
                      <X className="w-4 h-4 text-red-500 mx-auto" />
                    </td>
                    <td className="border border-gray-200 p-3 text-center">
                      <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                    </td>
                    <td className="border border-gray-200 p-3 text-center">
                      <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-muted-foreground space-y-2">
            <p>All plans include 14-day free trial • No setup fees • Cancel anytime</p>
            <p className="text-xs">
              Need more than 100 locations? Our Custom Enterprise plan offers unlimited 
              locations with volume discounts and dedicated support.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}