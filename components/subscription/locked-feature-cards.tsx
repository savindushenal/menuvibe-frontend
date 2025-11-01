'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  BarChart3, 
  Zap, 
  Crown, 
  Camera, 
  QrCode, 
  Star,
  Lock,
  ArrowRight
} from 'lucide-react';

interface LockedFeatureCardProps {
  feature: string;
  description: string;
  requiredPlan: 'pro' | 'enterprise' | 'custom-enterprise';
  benefits: string[];
  icon?: React.ReactNode;
  className?: string;
}

const planDetails = {
  pro: {
    name: 'Pro',
    price: '$29/month',
    color: 'from-blue-500 to-blue-600',
    textColor: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  enterprise: {
    name: 'Enterprise',
    price: '$99/month', 
    color: 'from-purple-500 to-purple-600',
    textColor: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200'
  },
  'custom-enterprise': {
    name: 'Custom Enterprise',
    price: 'Contact Sales',
    color: 'from-emerald-500 to-emerald-600',
    textColor: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200'
  }
};

export function LockedFeatureCard({
  feature,
  description,
  requiredPlan,
  benefits,
  icon,
  className = ''
}: LockedFeatureCardProps) {
  const plan = planDetails[requiredPlan];

  return (
    <Card className={`${plan.borderColor} ${plan.bgColor} ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-full bg-gradient-to-r ${plan.color} text-white`}>
              {icon || <Lock className="w-5 h-5" />}
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                {feature}
                <Badge variant="outline" className={`${plan.textColor} border-current`}>
                  {plan.name}
                </Badge>
              </CardTitle>
              <CardDescription className="mt-1">
                {description}
              </CardDescription>
            </div>
          </div>
          <Lock className={`w-5 h-5 ${plan.textColor}`} />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {benefits.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">What you'll get:</h4>
            <ul className="space-y-1">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <Star className={`w-4 h-4 mt-0.5 ${plan.textColor} flex-shrink-0`} />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="text-sm text-muted-foreground">
            Starting at <span className="font-semibold">{plan.price}</span>
          </div>
          <Button className={`bg-gradient-to-r ${plan.color} hover:opacity-90 text-white`}>
            {requiredPlan === 'custom-enterprise' ? 'Contact Sales' : `Upgrade to ${plan.name}`}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Pre-configured locked feature cards
export function MultiLocationCard({ className }: { className?: string }) {
  return (
    <LockedFeatureCard
      feature="Multiple Locations"
      description="Manage multiple restaurant locations from one dashboard"
      requiredPlan="pro"
      benefits={[
        "Up to 3 locations (Pro) or 5 locations (Enterprise)",
        "Centralized menu management across locations",
        "Location-specific QR codes and analytics",
        "Easy location switching interface"
      ]}
      icon={<MapPin className="w-5 h-5" />}
      className={className}
    />
  );
}

export function AdvancedAnalyticsCard({ className }: { className?: string }) {
  return (
    <LockedFeatureCard
      feature="Advanced Analytics"
      description="Get detailed insights into your menu performance"
      requiredPlan="enterprise"
      benefits={[
        "Detailed item performance tracking",
        "Customer behavior insights",
        "Revenue analytics by location",
        "Export reports and data"
      ]}
      icon={<BarChart3 className="w-5 h-5" />}
      className={className}
    />
  );
}

export function PhotoUploadsCard({ className }: { className?: string }) {
  return (
    <LockedFeatureCard
      feature="Photo Uploads"
      description="Add beautiful photos to your menu items"
      requiredPlan="pro"
      benefits={[
        "Upload high-quality item photos",
        "Automatic image optimization",
        "Mobile-friendly photo display",
        "Increase customer engagement"
      ]}
      icon={<Camera className="w-5 h-5" />}
      className={className}
    />
  );
}

export function CustomQRCard({ className }: { className?: string }) {
  return (
    <LockedFeatureCard
      feature="Custom QR Codes"
      description="Create branded QR codes for your menus"
      requiredPlan="pro"
      benefits={[
        "Branded QR codes with your logo",
        "Custom colors and styling",
        "High-resolution downloads",
        "Professional appearance"
      ]}
      icon={<QrCode className="w-5 h-5" />}
      className={className}
    />
  );
}

export function UnlimitedLocationsCard({ className }: { className?: string }) {
  return (
    <LockedFeatureCard
      feature="Unlimited Locations"
      description="Perfect for large restaurant chains and franchises"
      requiredPlan="custom-enterprise"
      benefits={[
        "Unlimited restaurant locations",
        "Volume pricing discounts",
        "Dedicated account manager",
        "Custom integrations and features",
        "SLA guarantees"
      ]}
      icon={<Crown className="w-5 h-5" />}
      className={className}
    />
  );
}