'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Check, 
  X, 
  Loader2, 
  Crown, 
  Zap, 
  TrendingUp,
  AlertCircle,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  billing_period: string;
  features: any;
  limits: any;
  is_active: boolean;
  sort_order: number;
}

interface CurrentSubscription {
  id: string;
  subscription_plan_id: string;
  status: string;
  name: string;
  slug: string;
  price: number;
  billing_period: string;
  features: any;
  limits: any;
}

export default function SubscriptionPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [changing, setChanging] = useState<string | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<CurrentSubscription | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch plans and current subscription in parallel
      const [plansResponse, subscriptionResponse] = await Promise.all([
        apiClient.getSubscriptionPlans(),
        apiClient.getCurrentSubscription()
      ]);

      if (plansResponse.success && plansResponse.data.plans) {
        setPlans(plansResponse.data.plans.filter((p: any) => p.is_active));
      }

      if (subscriptionResponse.success && subscriptionResponse.data.subscription) {
        setCurrentSubscription(subscriptionResponse.data.subscription);
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load subscription information',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePlanSelect = (plan: SubscriptionPlan) => {
    if (currentSubscription && plan.id === currentSubscription.subscription_plan_id) {
      toast({
        title: 'Already subscribed',
        description: `You are already on the ${plan.name} plan`,
      });
      return;
    }

    setSelectedPlan(plan);
    setShowConfirmDialog(true);
  };

  const handleConfirmChange = async () => {
    if (!selectedPlan) return;

    const isUpgrade = !currentSubscription || selectedPlan.price > currentSubscription.price;
    const changeType = isUpgrade ? 'upgrade' : 'downgrade';

    try {
      setChanging(selectedPlan.id);
      
      const response = await apiClient.changeSubscription(selectedPlan.id);

      if (response.success) {
        toast({
          title: `Successfully ${changeType}d!`,
          description: `You are now on the ${selectedPlan.name} plan`,
        });

        // Refresh data
        await fetchData();
        setShowConfirmDialog(false);
        setSelectedPlan(null);

        // Reload the page to refresh subscription context
        window.location.reload();
      } else {
        throw new Error(response.message || `Failed to ${changeType} subscription`);
      }
    } catch (error: any) {
      console.error('Error changing subscription:', error);
      toast({
        title: 'Error',
        description: error.message || `Failed to ${changeType} subscription`,
        variant: 'destructive'
      });
    } finally {
      setChanging(null);
    }
  };

  const getPlanIcon = (slug: string) => {
    switch (slug) {
      case 'free':
        return <Zap className="w-6 h-6" />;
      case 'pro':
        return <TrendingUp className="w-6 h-6" />;
      case 'enterprise':
        return <Crown className="w-6 h-6" />;
      default:
        return <Sparkles className="w-6 h-6" />;
    }
  };

  const getPlanColor = (slug: string) => {
    switch (slug) {
      case 'free':
        return 'from-gray-500 to-gray-600';
      case 'pro':
        return 'from-emerald-500 to-emerald-600';
      case 'enterprise':
        return 'from-purple-500 to-purple-600';
      default:
        return 'from-blue-500 to-blue-600';
    }
  };

  const isCurrentPlan = (planId: string) => {
    return currentSubscription?.subscription_plan_id === planId;
  };

  const canChangeTo = (plan: SubscriptionPlan) => {
    if (!currentSubscription) return true;
    return plan.id !== currentSubscription.subscription_plan_id;
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          <span className="ml-2 text-neutral-600">Loading subscription plans...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-3">
          Choose Your Plan
        </h1>
        <p className="text-base sm:text-lg text-neutral-600">
          Unlock powerful features to grow your restaurant business
        </p>
      </div>

      {/* Current Plan Alert */}
      {currentSubscription && (
        <Alert className="max-w-3xl mx-auto border-emerald-200 bg-emerald-50">
          <Check className="h-4 w-4 text-emerald-600" />
          <AlertDescription className="text-emerald-800">
            You are currently on the <strong>{currentSubscription.name}</strong> plan
          </AlertDescription>
        </Alert>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
        {plans.map((plan) => {
          const isCurrent = isCurrentPlan(plan.id);
          const isPopular = plan.slug === 'pro';

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="relative"
            >
              {isPopular && (
                <div className="absolute -top-4 left-0 right-0 flex justify-center z-10">
                  <Badge className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-1 shadow-lg">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}

              <Card className={`h-full border-2 transition-all duration-300 hover:shadow-xl ${
                isCurrent 
                  ? 'border-emerald-500 shadow-lg' 
                  : isPopular 
                  ? 'border-emerald-200' 
                  : 'border-neutral-200'
              } ${isPopular ? 'scale-105' : ''}`}>
                <CardHeader className="text-center pb-4">
                  <div className={`w-14 h-14 rounded-full bg-gradient-to-r ${getPlanColor(plan.slug)} flex items-center justify-center mx-auto mb-4 text-white shadow-lg`}>
                    {getPlanIcon(plan.slug)}
                  </div>
                  
                  <CardTitle className="text-2xl font-bold text-neutral-900">
                    {plan.name}
                  </CardTitle>
                  
                  {isCurrent && (
                    <Badge variant="outline" className="border-emerald-500 text-emerald-700 mt-2">
                      Current Plan
                    </Badge>
                  )}

                  <div className="mt-4">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-bold text-neutral-900">
                        ${plan.price}
                      </span>
                      <span className="text-neutral-600">/{plan.billing_period}</span>
                    </div>
                  </div>

                  <CardDescription className="mt-2 min-h-[3rem]">
                    {plan.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Features List */}
                  <div className="space-y-2 min-h-[200px]">
                    {Object.entries(plan.features || {}).map(([key, value]: [string, any]) => {
                      const isIncluded = value === true || value === 'true' || value === 1;
                      
                      return (
                        <div key={key} className="flex items-start gap-2">
                          {isIncluded ? (
                            <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                          ) : (
                            <X className="w-5 h-5 text-neutral-400 flex-shrink-0 mt-0.5" />
                          )}
                          <span className={`text-sm ${isIncluded ? 'text-neutral-900' : 'text-neutral-400'}`}>
                            {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        </div>
                      );
                    })}

                    {/* Limits */}
                    {plan.limits && (
                      <>
                        <div className="flex items-start gap-2">
                          <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-neutral-900">
                            {plan.limits.max_locations === -1 ? 'Unlimited' : plan.limits.max_locations} Location{plan.limits.max_locations !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-neutral-900">
                            {plan.limits.max_menus_per_location === -1 ? 'Unlimited' : plan.limits.max_menus_per_location} Menu{plan.limits.max_menus_per_location !== 1 ? 's' : ''} per location
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-neutral-900">
                            {plan.limits.max_menu_items_per_menu === -1 ? 'Unlimited' : plan.limits.max_menu_items_per_menu} Item{plan.limits.max_menu_items_per_menu !== 1 ? 's' : ''} per menu
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* CTA Button */}
                  <Button
                    onClick={() => handlePlanSelect(plan)}
                    disabled={isCurrent || changing === plan.id}
                    className={`w-full ${
                      isCurrent
                        ? 'bg-neutral-300 text-neutral-600 cursor-not-allowed'
                        : `bg-gradient-to-r ${getPlanColor(plan.slug)} hover:opacity-90 text-white shadow-lg`
                    }`}
                  >
                    {changing === plan.id ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : isCurrent ? (
                      'Current Plan'
                    ) : (
                      <>
                        {currentSubscription && plan.price > currentSubscription.price ? 'Upgrade' : currentSubscription ? 'Downgrade' : 'Get Started'}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && selectedPlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4"
          >
            <div className="text-center">
              <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${getPlanColor(selectedPlan.slug)} flex items-center justify-center mx-auto mb-4 text-white`}>
                {getPlanIcon(selectedPlan.slug)}
              </div>
              
              <h3 className="text-2xl font-bold text-neutral-900 mb-2">
                {currentSubscription && selectedPlan.price > currentSubscription.price ? 'Upgrade' : 'Change'} to {selectedPlan.name}?
              </h3>
              
              <p className="text-neutral-600">
                {currentSubscription ? (
                  <>
                    You're about to change from the <strong>{currentSubscription.name}</strong> plan to the <strong>{selectedPlan.name}</strong> plan.
                  </>
                ) : (
                  <>
                    You're about to subscribe to the <strong>{selectedPlan.name}</strong> plan.
                  </>
                )}
              </p>

              {selectedPlan.price > 0 && (
                <div className="mt-4 p-4 bg-neutral-50 rounded-lg">
                  <div className="text-center">
                    <p className="text-sm text-neutral-600 mb-1">New billing amount</p>
                    <p className="text-3xl font-bold text-neutral-900">
                      ${selectedPlan.price}
                      <span className="text-sm text-neutral-600 font-normal">/{selectedPlan.billing_period}</span>
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowConfirmDialog(false);
                  setSelectedPlan(null);
                }}
                disabled={changing !== null}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmChange}
                disabled={changing !== null}
                className={`flex-1 bg-gradient-to-r ${getPlanColor(selectedPlan.slug)} hover:opacity-90 text-white`}
              >
                {changing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Confirm'
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* FAQ or Additional Info */}
      <div className="max-w-3xl mx-auto mt-12 text-center">
        <Card className="border-neutral-200">
          <CardContent className="pt-6">
            <AlertCircle className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">
              Need Help Choosing?
            </h3>
            <p className="text-neutral-600 mb-4">
              Not sure which plan is right for you? Our team is here to help you find the perfect fit for your business needs.
            </p>
            <Button variant="outline" className="border-emerald-500 text-emerald-700 hover:bg-emerald-50">
              Contact Support
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
