'use client';

import { ReactNode } from 'react';
import { Lock, Crown, Zap, ArrowRight, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/contexts/subscription-context';

interface InlineFeatureBlockProps {
  feature: string;
  requiredPlan: 'pro' | 'enterprise' | 'custom-enterprise';
  children?: ReactNode;
  blockType?: 'overlay' | 'replace' | 'banner';
  title?: string;
  description?: string;
  benefits?: string[];
  showPreview?: boolean;
  className?: string;
  onUpgradeClick?: () => void;
}

const planDetails = {
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

export function InlineFeatureBlock({ 
  feature, 
  requiredPlan, 
  children, 
  blockType = 'overlay',
  title,
  description,
  benefits = [],
  showPreview = true,
  className = '',
  onUpgradeClick
}: InlineFeatureBlockProps) {
  const { currentPlan, canAccessFeature, showUpgradePrompt } = useSubscription();
  const plan = planDetails[requiredPlan];
  const Icon = plan.icon;

  // If user has access, render children normally
  if (canAccessFeature(feature)) {
    return <>{children}</>;
  }

  const handleUpgradeClick = () => {
    if (onUpgradeClick) {
      onUpgradeClick();
    } else {
      showUpgradePrompt(feature);
    }
  };

  // Banner type - shows a notice banner above content
  if (blockType === 'banner') {
    return (
      <div className={className}>
        <div className={`mb-4 p-4 rounded-lg border ${plan.borderColor} ${plan.bgColor}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full bg-gradient-to-r ${plan.color} text-white`}>
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">
                  {title || `${feature} Requires ${plan.name}`}
                </h4>
                <p className="text-sm text-gray-600">
                  {description || `Upgrade to unlock ${feature.toLowerCase()} functionality`}
                </p>
              </div>
            </div>
            <Button 
              onClick={handleUpgradeClick}
              className={`bg-gradient-to-r ${plan.color} text-white hover:opacity-90`}
              size="sm"
            >
              Upgrade Now
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
        {children}
      </div>
    );
  }

  // Replace type - completely replaces content with upgrade card
  if (blockType === 'replace') {
    return (
      <div className={className}>
        <Card className={`${plan.borderColor} ${plan.bgColor}`}>
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-3">
              <div className={`p-4 rounded-full bg-gradient-to-r ${plan.color} text-white`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
            <CardTitle className="text-xl">
              {title || `Unlock ${feature}`}
            </CardTitle>
            <CardDescription>
              {description || `${feature} is available with ${plan.name} plan`}
            </CardDescription>
            <Badge variant="outline" className={`${plan.textColor} border-current w-fit mx-auto`}>
              {plan.name} - {plan.price}
            </Badge>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {benefits.length > 0 && (
              <div className="space-y-2">
                <h5 className="font-medium text-sm text-gray-700">What you'll get:</h5>
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
            
            <Button 
              onClick={handleUpgradeClick}
              className={`w-full bg-gradient-to-r ${plan.color} text-white hover:opacity-90`}
            >
              Upgrade to {plan.name}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Overlay type (default) - shows preview with overlay
  return (
    <div className={`relative ${className}`}>
      {/* Blurred Preview */}
      {showPreview && children && (
        <div className="opacity-40 pointer-events-none blur-sm select-none">
          {children}
        </div>
      )}
      
      {/* Lock Overlay */}
      <div className={`${showPreview ? 'absolute inset-0' : ''} 
        flex items-center justify-center bg-gradient-to-br from-white/95 to-gray-50/95 
        backdrop-blur-sm border-2 border-dashed ${plan.borderColor} rounded-lg p-6`}>
        
        <div className="text-center space-y-4 max-w-sm">
          <div className="flex justify-center">
            <div className={`p-3 rounded-full bg-gradient-to-r ${plan.color} text-white`}>
              <Lock className="w-6 h-6" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900">
              {title || `${feature} Locked`}
            </h3>
            <p className="text-sm text-gray-600">
              {description || `Upgrade to ${plan.name} to access ${feature.toLowerCase()}`}
            </p>
          </div>
          
          <div className="flex items-center justify-center gap-2">
            <Icon className="w-4 h-4 text-gray-500" />
            <Badge variant="outline" className={`${plan.textColor} border-current`}>
              {plan.name} - {plan.price}
            </Badge>
          </div>
          
          {benefits.length > 0 && (
            <div className="space-y-1 text-xs text-gray-500">
              {benefits.slice(0, 3).map((benefit, index) => (
                <div key={index} className="flex items-center justify-center">
                  <div className="w-1 h-1 rounded-full bg-green-500 mr-1" />
                  {benefit}
                </div>
              ))}
            </div>
          )}
          
          <Button 
            onClick={handleUpgradeClick}
            className={`bg-gradient-to-r ${plan.color} text-white hover:opacity-90`}
            size="sm"
          >
            Unlock Now
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Preset components for common blocking scenarios
export function LocationBlock({ children, className, type = 'overlay' }: { 
  children?: ReactNode, 
  className?: string,
  type?: 'overlay' | 'replace' | 'banner'
}) {
  return (
    <InlineFeatureBlock 
      feature="Multiple Locations" 
      requiredPlan="pro"
      blockType={type}
      title="Multiple Locations Locked"
      description="Manage multiple restaurant locations with Pro plan"
      benefits={[
        "Up to 5 locations",
        "Separate menus per location",
        "Location-specific analytics",
        "Centralized management"
      ]}
      className={className}
    >
      {children}
    </InlineFeatureBlock>
  );
}

export function AnalyticsBlock({ children, className, type = 'overlay' }: { 
  children?: ReactNode, 
  className?: string,
  type?: 'overlay' | 'replace' | 'banner'
}) {
  return (
    <InlineFeatureBlock 
      feature="Advanced Analytics" 
      requiredPlan="enterprise"
      blockType={type}
      title="Advanced Analytics Locked"
      description="Get detailed insights with Enterprise plan"
      benefits={[
        "Real-time analytics",
        "Custom reports",
        "Performance insights",
        "Export capabilities"
      ]}
      className={className}
    >
      {children}
    </InlineFeatureBlock>
  );
}

export function PhotoUploadBlock({ children, className, type = 'overlay' }: { 
  children?: ReactNode, 
  className?: string,
  type?: 'overlay' | 'replace' | 'banner'
}) {
  return (
    <InlineFeatureBlock 
      feature="Photo Uploads" 
      requiredPlan="pro"
      blockType={type}
      title="Photo Uploads Locked"
      description="Add beautiful photos to your menu items"
      benefits={[
        "High-quality photo uploads",
        "Multiple photos per item",
        "Image optimization",
        "Better customer engagement"
      ]}
      className={className}
    >
      {children}
    </InlineFeatureBlock>
  );
}

export function CustomBrandingBlock({ children, className, type = 'overlay' }: { 
  children?: ReactNode, 
  className?: string,
  type?: 'overlay' | 'replace' | 'banner'
}) {
  return (
    <InlineFeatureBlock 
      feature="Custom Branding" 
      requiredPlan="custom-enterprise"
      blockType={type}
      title="Custom Branding Locked"
      description="Full white-label solution for your brand"
      benefits={[
        "Remove MenuVibe branding",
        "Custom colors & logos",
        "Custom domain",
        "White-label solution"
      ]}
      className={className}
    >
      {children}
    </InlineFeatureBlock>
  );
}