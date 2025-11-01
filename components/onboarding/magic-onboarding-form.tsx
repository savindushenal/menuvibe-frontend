'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Progress } from '@/components/ui/progress'; // Temporarily disabled for build
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { apiClient } from '@/lib/api';
import { 
  ChevronRight, 
  ChevronLeft, 
  Building2, 
  MapPin, 
  Phone, 
  Clock, 
  Users, 
  Check,
  Sparkles,
  Store,
  Utensils
} from 'lucide-react';

// Simple progress bar replacement
const Progress = ({ value, className }: { value: number; className?: string }) => (
  <div className={`h-2 bg-gray-200 rounded-full overflow-hidden ${className || ''}`}>
    <div 
      className="h-full bg-primary transition-all duration-300"
      style={{ width: `${value}%` }}
    />
  </div>
);

interface OnboardingData {
  business_name: string;
  business_type: string;
  description: string;
  phone: string;
  email: string;
  website: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  cuisine_type: string;
  seating_capacity: number | '';
  services: string[];
  operating_hours: any;
}

interface MagicOnboardingFormProps {
  onComplete: () => void;
  isSubmitting: boolean;
}

const businessTypes = [
  { value: 'restaurant', label: 'Restaurant', icon: Utensils },
  { value: 'cafe', label: 'Café', icon: Store },
  { value: 'food_truck', label: 'Food Truck', icon: Building2 },
  { value: 'bakery', label: 'Bakery', icon: Store },
  { value: 'bar', label: 'Bar/Pub', icon: Building2 },
  { value: 'fast_food', label: 'Fast Food', icon: Utensils },
];

const cuisineTypes = [
  'Italian', 'Chinese', 'Mexican', 'Indian', 'Japanese', 'Thai', 
  'French', 'American', 'Mediterranean', 'Korean', 'Vietnamese', 'Other'
];

const serviceOptions = [
  { id: 'dine_in', label: 'Dine In' },
  { id: 'takeout', label: 'Takeout' },
  { id: 'delivery', label: 'Delivery' },
  { id: 'catering', label: 'Catering' },
];

export function MagicOnboardingForm({ onComplete, isSubmitting }: MagicOnboardingFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [formData, setFormData] = useState<OnboardingData>({
    business_name: '',
    business_type: '',
    description: '',
    phone: '',
    email: '',
    website: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'US',
    cuisine_type: '',
    seating_capacity: '',
    services: [],
    operating_hours: {},
  });

  const totalSteps = 4;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const updateFormData = (field: keyof OnboardingData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      setErrors({}); // Clear previous errors
      
      // Clean the form data before sending
      const cleanedData = {
        ...formData,
        // Convert empty string to null for optional fields
        seating_capacity: formData.seating_capacity === '' ? null : formData.seating_capacity,
        description: formData.description === '' ? null : formData.description,
        phone: formData.phone === '' ? null : formData.phone,
        email: formData.email === '' ? null : formData.email,
        website: formData.website === '' ? null : formData.website,
        address_line_2: formData.address_line_2 === '' ? null : formData.address_line_2,
        cuisine_type: formData.cuisine_type === '' ? null : formData.cuisine_type,
        country: formData.country === '' ? null : formData.country,
        // Ensure services is always an array
        services: Array.isArray(formData.services) ? formData.services : [],
      };

      console.log('Submitting business profile data:', cleanedData);
      
      // Check if business profile already exists
      let response;
      try {
        const existingProfile = await apiClient.getBusinessProfile();
        if (existingProfile.success) {
          // Business profile exists, use update
          console.log('Business profile exists, updating...');
          // Convert to FormData for update API
          const formDataForUpdate = new FormData();
          Object.entries(cleanedData).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
              if (Array.isArray(value)) {
                formDataForUpdate.append(key, JSON.stringify(value));
              } else {
                formDataForUpdate.append(key, value.toString());
              }
            }
          });
          response = await apiClient.updateBusinessProfile(formDataForUpdate);
        } else {
          // Business profile doesn't exist, create new one
          console.log('Business profile does not exist, creating...');
          response = await apiClient.createBusinessProfile(cleanedData);
        }
      } catch (error: any) {
        // If we get a 409 Conflict, it means business profile exists - try update
        if (error.message?.includes('409') || error.message?.includes('already exists')) {
          console.log('Got 409 conflict, trying update instead...');
          const formDataForUpdate = new FormData();
          Object.entries(cleanedData).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
              if (Array.isArray(value)) {
                formDataForUpdate.append(key, JSON.stringify(value));
              } else {
                formDataForUpdate.append(key, value.toString());
              }
            }
          });
          response = await apiClient.updateBusinessProfile(formDataForUpdate);
        } else {
          // Business profile doesn't exist (404 error), create new one
          console.log('Business profile does not exist, creating...');
          response = await apiClient.createBusinessProfile(cleanedData);
        }
      }
      
      if (response?.success) {
        onComplete();
      }
    } catch (error: any) {
      console.error('Error creating business profile:', error);
      
      // Handle validation errors
      if (error.message?.includes('Validation failed') && error.response?.errors) {
        setErrors(error.response.errors);
      }
    }
  };

  const toggleService = (serviceId: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(serviceId)
        ? prev.services.filter(s => s !== serviceId)
        : [...prev.services, serviceId]
    }));
  };

  const steps = [
    {
      title: "Tell us about your business",
      icon: Building2,
      content: (
        <div className="space-y-6">
          <div>
            <Label htmlFor="business_name" className="text-base font-medium">
              What's the name of your business? *
            </Label>
            <Input
              id="business_name"
              value={formData.business_name}
              onChange={(e) => updateFormData('business_name', e.target.value)}
              placeholder="e.g., Tony's Italian Restaurant"
              className="mt-2 text-lg h-12"
            />
          </div>

          <div>
            <Label className="text-base font-medium">What type of business is it? *</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
              {businessTypes.map((type) => {
                const IconComponent = type.icon;
                return (
                  <motion.div
                    key={type.value}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card 
                      className={`cursor-pointer transition-all ${
                        formData.business_type === type.value 
                          ? 'ring-2 ring-blue-500 bg-blue-50' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => updateFormData('business_type', type.value)}
                    >
                      <CardContent className="p-4 text-center">
                        <IconComponent className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                        <p className="font-medium">{type.label}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <div>
            <Label htmlFor="description" className="text-base font-medium">
              Describe your business (optional)
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => updateFormData('description', e.target.value)}
              placeholder="Tell us what makes your business special..."
              className="mt-2"
              rows={3}
            />
          </div>
        </div>
      )
    },
    {
      title: "Where are you located?",
      icon: MapPin,
      content: (
        <div className="space-y-6">
          <div>
            <Label htmlFor="address_line_1" className="text-base font-medium">
              Street Address *
            </Label>
            <Input
              id="address_line_1"
              value={formData.address_line_1}
              onChange={(e) => updateFormData('address_line_1', e.target.value)}
              placeholder="123 Main Street"
              className="mt-2 h-12"
            />
          </div>

          <div>
            <Label htmlFor="address_line_2" className="text-base font-medium">
              Apartment, suite, etc. (optional)
            </Label>
            <Input
              id="address_line_2"
              value={formData.address_line_2}
              onChange={(e) => updateFormData('address_line_2', e.target.value)}
              placeholder="Suite 100"
              className="mt-2 h-12"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="city" className="text-base font-medium">City *</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => updateFormData('city', e.target.value)}
                placeholder="New York"
                className="mt-2 h-12"
              />
            </div>
            <div>
              <Label htmlFor="state" className="text-base font-medium">State *</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => updateFormData('state', e.target.value)}
                placeholder="NY"
                className="mt-2 h-12"
              />
            </div>
            <div>
              <Label htmlFor="postal_code" className="text-base font-medium">ZIP Code *</Label>
              <Input
                id="postal_code"
                value={formData.postal_code}
                onChange={(e) => updateFormData('postal_code', e.target.value)}
                placeholder="10001"
                className="mt-2 h-12"
              />
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Contact & Details",
      icon: Phone,
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone" className="text-base font-medium">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => updateFormData('phone', e.target.value)}
                placeholder="(555) 123-4567"
                className="mt-2 h-12"
              />
            </div>
            <div>
              <Label htmlFor="email" className="text-base font-medium">Business Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateFormData('email', e.target.value)}
                placeholder="contact@restaurant.com"
                className="mt-2 h-12"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="website" className="text-base font-medium">Website</Label>
            <Input
              id="website"
              value={formData.website}
              onChange={(e) => updateFormData('website', e.target.value)}
              placeholder="https://www.yourrestaurant.com"
              className="mt-2 h-12"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cuisine_type" className="text-base font-medium">Cuisine Type</Label>
              <Select value={formData.cuisine_type} onValueChange={(value) => updateFormData('cuisine_type', value)}>
                <SelectTrigger className="mt-2 h-12">
                  <SelectValue placeholder="Select cuisine type" />
                </SelectTrigger>
                <SelectContent>
                  {cuisineTypes.map((cuisine) => (
                    <SelectItem key={cuisine} value={cuisine.toLowerCase()}>
                      {cuisine}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="seating_capacity" className="text-base font-medium">Seating Capacity</Label>
              <Input
                id="seating_capacity"
                type="number"
                value={formData.seating_capacity}
                onChange={(e) => updateFormData('seating_capacity', e.target.value ? parseInt(e.target.value) : '')}
                placeholder="50"
                className="mt-2 h-12"
              />
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Services & Final Details",
      icon: Users,
      content: (
        <div className="space-y-6">
          <div>
            <Label className="text-base font-medium">What services do you offer?</Label>
            <div className="grid grid-cols-2 gap-3 mt-3">
              {serviceOptions.map((service) => (
                <motion.div
                  key={service.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card 
                    className={`cursor-pointer transition-all ${
                      formData.services.includes(service.id)
                        ? 'ring-2 ring-blue-500 bg-blue-50' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => toggleService(service.id)}
                  >
                    <CardContent className="p-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <Checkbox 
                          checked={formData.services.includes(service.id)}
                        />
                        <span className="font-medium">{service.label}</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Sparkles className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-green-800">Almost Done!</h3>
            </div>
            <p className="text-green-700 mb-4">
              You're all set! Click "Complete Setup" to finish your onboarding and start using MenuVibe.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{formData.business_name || 'Your Business'}</Badge>
              <Badge variant="secondary">{formData.business_type || 'Business Type'}</Badge>
              <Badge variant="secondary">{formData.city || 'Location'}</Badge>
              {formData.services.length > 0 && (
                <Badge variant="secondary">{formData.services.length} Service{formData.services.length > 1 ? 's' : ''}</Badge>
              )}
            </div>
          </div>
        </div>
      )
    },
  ];

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-2xl">
      <CardHeader className="pb-6">
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="text-2xl flex items-center space-x-2">
            <Sparkles className="w-6 h-6 text-blue-600" />
            <span>Business Setup</span>
          </CardTitle>
          <Badge variant="outline" className="text-sm">
            Step {currentStep + 1} of {totalSteps}
          </Badge>
        </div>
        <Progress value={progress} className="h-2" />
      </CardHeader>

      <CardContent className="pb-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="min-h-[400px]"
          >
            <div className="mb-6">
              <div className="flex items-center space-x-3 mb-4">
                {React.createElement(steps[currentStep].icon, { 
                  className: "w-8 h-8 text-blue-600" 
                })}
                <h2 className="text-xl font-semibold">{steps[currentStep].title}</h2>
              </div>
            </div>
            
            {steps[currentStep].content}
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-between items-center mt-8 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="flex items-center space-x-2"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </Button>

          {currentStep === totalSteps - 1 ? (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.business_name || !formData.business_type}
              className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Setting up...' : 'Complete Setup'}</span>
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleNext}
              disabled={currentStep === 0 && (!formData.business_name || !formData.business_type)}
              className="flex items-center space-x-2"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}