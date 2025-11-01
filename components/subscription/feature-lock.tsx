'use client';

import { ReactNode } from 'react';
import { Lock, Crown, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/contexts/subscription-context';

interface FeatureLockProps {
  feature: string;
  requiredPlan: 'pro' | 'enterprise' | 'custom-enterprise';
  children?: ReactNode;
  showPreview?: boolean;
  className?: string;
}

const planDetails = {
  pro: {
    name: 'Pro',
    price: '$29/month',
    color: 'bg-blue-500',
    icon: Zap
  },
  enterprise: {
    name: 'Enterprise', 
    price: '$99/month',
    color: 'bg-purple-500',
    icon: Crown
  },
  'custom-enterprise': {
    name: 'Custom Enterprise',
    price: 'Contact Sales',
    color: 'bg-emerald-500',
    icon: Crown
  }
};

export function FeatureLock({ 
  feature, 
  requiredPlan, 
  children, 
  showPreview = true,
  className = ''
}: FeatureLockProps) {
  const { currentPlan, canAccessFeature } = useSubscription();
  const plan = planDetails[requiredPlan];
  const Icon = plan.icon;

  // If user has access, render children normally
  if (canAccessFeature(feature)) {
    return <>{children}</>;
  }

  return (
    <div className={`relative ${className}`}>
      {/* Locked Overlay */}
      <div className="relative">
        {showPreview && children && (
          <div className="opacity-30 pointer-events-none blur-sm">
            {children}
          </div>
        )}
        
        {/* Lock Overlay */}
        <div className={`${showPreview ? 'absolute inset-0' : ''} 
          flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 
          border-2 border-dashed border-gray-300 rounded-lg p-6`}>
          
          <Card className="max-w-md text-center shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-center mb-3">
                <div className={`p-3 rounded-full ${plan.color} text-white`}>
                  <Lock className="w-6 h-6" />
                </div>
              </div>
              <CardTitle className="text-lg">
                {feature} Locked
              </CardTitle>
              <CardDescription>
                Upgrade to {plan.name} to unlock this feature
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center gap-2">
                <Icon className="w-5 h-5 text-gray-600" />
                <Badge variant="outline" className="text-sm">
                  {plan.name} - {plan.price}
                </Badge>
              </div>
              
              <div className="text-sm text-gray-600">
                Current plan: <Badge variant="secondary">{currentPlan}</Badge>
              </div>
              
              <Button 
                className={`w-full ${plan.color} hover:opacity-90 text-white`}
                onClick={() => {
                  // TODO: Open upgrade modal
                  console.log(`Upgrade to ${plan.name} for ${feature}`);
                }}
              >
                <Icon className="w-4 h-4 mr-2" />
                Upgrade to {plan.name}
              </Button>
              
              <p className="text-xs text-gray-500">
                14-day free trial • Cancel anytime
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Quick wrapper for specific features
export function LocationLock({ children, className }: { children?: ReactNode, className?: string }) {
  return (
    <FeatureLock 
      feature="Multiple Locations" 
      requiredPlan="pro" 
      className={className}
    >
      {children}
    </FeatureLock>
  );
}

export function AnalyticsLock({ children, className }: { children?: ReactNode, className?: string }) {
  return (
    <FeatureLock 
      feature="Advanced Analytics" 
      requiredPlan="enterprise" 
      className={className}
    >
      {children}
    </FeatureLock>
  );
}

export function APILock({ children, className }: { children?: ReactNode, className?: string }) {
  return (
    <FeatureLock 
      feature="API Access" 
      requiredPlan="enterprise" 
      className={className}
    >
      {children}
    </FeatureLock>
  );
}

export function CustomBrandingLock({ children, className }: { children?: ReactNode, className?: string }) {
  return (
    <FeatureLock 
      feature="Custom Branding" 
      requiredPlan="custom-enterprise" 
      className={className}
    >
      {children}
    </FeatureLock>
  );
}