'use client';

import { ReactNode, useState } from 'react';
import { Lock, X, Crown, Zap, Star, ArrowRight, AlertTriangle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSubscription } from '@/contexts/subscription-context';

interface FeatureBlockerProps {
  feature: string;
  requiredPlan: 'pro' | 'enterprise' | 'custom-enterprise';
  children?: ReactNode;
  style?: 'overlay' | 'card' | 'banner' | 'toast' | 'modal';
  title?: string;
  description?: string;
  benefits?: string[];
  showDemo?: boolean;
  dismissible?: boolean;
  className?: string;
  onUpgrade?: () => void;
  onDismiss?: () => void;
}

const planConfig = {
  pro: {
    name: 'Pro',
    price: '$29/month',
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-600',
    icon: Zap
  },
  enterprise: {
    name: 'Enterprise', 
    price: '$99/month',
    color: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-600',
    icon: Crown
  },
  'custom-enterprise': {
    name: 'Custom Enterprise',
    price: 'Contact Sales',
    color: 'from-emerald-500 to-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    textColor: 'text-emerald-600',
    icon: Star
  }
};

export function FeatureBlocker({ 
  feature, 
  requiredPlan, 
  children, 
  style = 'overlay',
  title,
  description,
  benefits = [],
  showDemo = true,
  dismissible = false,
  className = '',
  onUpgrade,
  onDismiss
}: FeatureBlockerProps) {
  const { currentPlan, canAccessFeature, showUpgradePrompt } = useSubscription();
  const [isDismissed, setIsDismissed] = useState(false);
  const plan = planConfig[requiredPlan];
  const Icon = plan.icon;

  // If user has access, render children normally
  if (canAccessFeature(feature)) {
    return <>{children}</>;
  }

  // If dismissed and dismissible, render children
  if (isDismissed && dismissible) {
    return <>{children}</>;
  }

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      showUpgradePrompt(feature);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    if (onDismiss) {
      onDismiss();
    }
  };

  // Toast style - small notification
  if (style === 'toast') {
    return (
      <div className={className}>
        <Alert className={`${plan.borderColor} ${plan.bgColor} mb-4`}>
          <Lock className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              <strong>{feature}</strong> requires {plan.name} plan
            </span>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleUpgrade} className={`${plan.textColor}`} variant="outline">
                Upgrade
              </Button>
              {dismissible && (
                <Button size="sm" variant="ghost" onClick={handleDismiss}>
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </AlertDescription>
        </Alert>
        {children}
      </div>
    );
  }

  // Banner style - prominent header notice
  if (style === 'banner') {
    return (
      <div className={className}>
        <div className={`mb-6 p-4 rounded-lg border-2 ${plan.borderColor} ${plan.bgColor}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full bg-gradient-to-r ${plan.color} text-white`}>
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">
                  {title || `${feature} - ${plan.name} Feature`}
                </h3>
                <p className="text-gray-600">
                  {description || `This feature requires a ${plan.name} subscription to access`}
                </p>
                {benefits.length > 0 && (
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    {benefits.slice(0, 3).map((benefit, index) => (
                      <span key={index} className="flex items-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1" />
                        {benefit}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`${plan.textColor} border-current`}>
                {plan.price}
              </Badge>
              <Button 
                onClick={handleUpgrade}
                className={`bg-gradient-to-r ${plan.color} text-white hover:opacity-90`}
              >
                Upgrade Now
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
              {dismissible && (
                <Button size="sm" variant="ghost" onClick={handleDismiss}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
        
        {/* Show blurred preview if showDemo is true */}
        {showDemo && children && (
          <div className="opacity-50 pointer-events-none">
            {children}
          </div>
        )}
      </div>
    );
  }

  // Card style - replaces content entirely
  if (style === 'card') {
    return (
      <div className={className}>
        <Card className={`${plan.borderColor} ${plan.bgColor} text-center`}>
          <CardHeader className="pb-4">
            <div className="flex justify-center mb-4">
              <div className={`p-4 rounded-full bg-gradient-to-r ${plan.color} text-white`}>
                <Icon className="w-8 h-8" />
              </div>
            </div>
            <CardTitle className="text-xl">
              {title || `${feature} Available in ${plan.name}`}
            </CardTitle>
            <CardDescription className="text-base">
              {description || `Unlock ${feature.toLowerCase()} and more advanced features`}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {benefits.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-700">What you'll unlock:</h4>
                <div className="grid grid-cols-1 gap-2">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center text-sm text-gray-600">
                      <div className="w-2 h-2 rounded-full bg-green-500 mr-3" />
                      {benefit}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="space-y-3">
              <Badge variant="outline" className={`${plan.textColor} border-current text-base px-3 py-1`}>
                {plan.name} Plan - {plan.price}
              </Badge>
              
              <Button 
                onClick={handleUpgrade}
                className={`w-full bg-gradient-to-r ${plan.color} text-white hover:opacity-90 py-3`}
                size="lg"
              >
                Upgrade to {plan.name}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Modal style - overlay with backdrop
  if (style === 'modal') {
    return (
      <div className={className}>
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-full bg-gradient-to-r ${plan.color} text-white`}>
                    <Lock className="w-6 h-6" />
                  </div>
                  <div>
                    <CardTitle>{title || `${feature} Locked`}</CardTitle>
                    <CardDescription>
                      {description || `Requires ${plan.name} subscription`}
                    </CardDescription>
                  </div>
                </div>
                <Button size="sm" variant="ghost" onClick={handleDismiss}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {benefits.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Included with {plan.name}:</h4>
                  <ul className="space-y-1">
                    {benefits.map((benefit, index) => (
                      <li key={index} className="flex items-center text-sm text-gray-600">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleUpgrade}
                  className={`flex-1 bg-gradient-to-r ${plan.color} text-white hover:opacity-90`}
                >
                  Upgrade to {plan.name}
                </Button>
                <Button variant="outline" onClick={handleDismiss}>
                  Maybe Later
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Default overlay style
  return (
    <div className={`relative ${className}`}>
      {/* Blurred content preview */}
      {showDemo && children && (
        <div className="opacity-30 pointer-events-none blur-sm select-none">
          {children}
        </div>
      )}
      
      {/* Lock overlay */}
      <div className={`${showDemo ? 'absolute inset-0' : ''} 
        flex items-center justify-center bg-gradient-to-br from-white/95 to-gray-50/95 
        backdrop-blur-sm border-2 border-dashed ${plan.borderColor} rounded-lg p-8`}>
        
        <div className="text-center space-y-4 max-w-sm">
          {dismissible && (
            <div className="absolute top-2 right-2">
              <Button size="sm" variant="ghost" onClick={handleDismiss}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          <div className="flex justify-center">
            <div className={`p-4 rounded-full bg-gradient-to-r ${plan.color} text-white`}>
              <Lock className="w-8 h-8" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900 text-lg">
              {title || `${feature} Locked`}
            </h3>
            <p className="text-gray-600">
              {description || `This feature is available with ${plan.name} plan`}
            </p>
          </div>
          
          <Badge variant="outline" className={`${plan.textColor} border-current`}>
            {plan.name} - {plan.price}
          </Badge>
          
          {benefits.length > 0 && (
            <div className="space-y-1 text-sm text-gray-500">
              {benefits.slice(0, 3).map((benefit, index) => (
                <div key={index} className="flex items-center justify-center">
                  <div className="w-1 h-1 rounded-full bg-green-500 mr-2" />
                  {benefit}
                </div>
              ))}
            </div>
          )}
          
          <Button 
            onClick={handleUpgrade}
            className={`bg-gradient-to-r ${plan.color} text-white hover:opacity-90`}
          >
            Unlock {feature}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}