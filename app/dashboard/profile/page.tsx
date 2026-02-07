'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Loader2, 
  Building, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  FileText, 
  Upload, 
  Save, 
  Edit3, 
  X,
  Image as ImageIcon 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';

interface BusinessProfile {
  id: number;
  business_name: string;
  business_type: string;
  description: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string | null;
  cuisine_type: string | null;
  seating_capacity: number | null;
  operating_hours: any;
  services: string[] | null;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  social_media: any;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export default function RestaurantProfilePage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [logo, setLogo] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoError, setLogoError] = useState(false);
  
  // Form state for editing
  const [formData, setFormData] = useState({
    business_name: '',
    description: '',
    phone: '',
    email: '',
    website: '',
    primaryColor: '#10b981',
    secondaryColor: '#3b82f6',
  });

  useEffect(() => {
    fetchBusinessProfile();
  }, []);

  const fetchBusinessProfile = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getBusinessProfile();
      
      // Defensive check for response structure
      if (!response || !response.data) {
        console.warn('Invalid response structure:', response);
        setLoading(false);
        return;
      }
      
      if (response.success && response.data) {
        const profile = response.data.business_profile;
        
        // Check if profile exists
        if (!profile) {
          console.warn('No business profile found');
          setLoading(false);
          return;
        }
        
        setBusinessProfile(profile);
        
        // Initialize form data with safe fallbacks
        setFormData({
          business_name: profile?.business_name || '',
          description: profile?.description || '',
          phone: profile?.phone || '',
          email: profile?.email || '',
          website: profile?.website || '',
          primaryColor: profile?.primary_color || '#10b981',
          secondaryColor: profile?.secondary_color || '#3b82f6',
        });
        
        if (profile?.logo_url) {
          console.log('Loading logo from URL:', profile.logo_url);
          setLogo(profile.logo_url);
          setLogoError(false);
        }
      }
    } catch (error) {
      console.error('Error fetching business profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to load business profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('Logo file selected:', file.name, file.type, file.size);
      setLogoFile(file);
      setLogoError(false);
      const reader = new FileReader();
      reader.onloadend = () => {
        console.log('Logo preview created');
        setLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!businessProfile) return;
    
    try {
      setSaving(true);
      
      // Create FormData to handle both text data and file upload
      const formDataToSend = new FormData();
      formDataToSend.append('business_name', formData.business_name);
      if (formData.description) formDataToSend.append('description', formData.description);
      if (formData.phone) formDataToSend.append('phone', formData.phone);
      if (formData.email) formDataToSend.append('email', formData.email);
      if (formData.website) formDataToSend.append('website', formData.website);
      if (formData.primaryColor) formDataToSend.append('primary_color', formData.primaryColor);
      if (formData.secondaryColor) formDataToSend.append('secondary_color', formData.secondaryColor);
      
      // Add logo file if selected
      if (logoFile) {
        formDataToSend.append('logo', logoFile);
      }
      
      // Call API to update business profile
      const response = await apiClient.updateBusinessProfile(formDataToSend);
      
      if (response.success && response.data) {
        // Update local state with fresh data from API
        const updatedProfile = response.data.business_profile || response.data;
        setBusinessProfile(updatedProfile);
        
        // Update logo URL if changed
        if (updatedProfile.logo_url) {
          console.log('Logo saved, new URL:', updatedProfile.logo_url);
          setLogo(updatedProfile.logo_url);
        }
        
        setIsEditing(false);
        setLogoFile(null);
        
        toast({
          title: 'Profile updated',
          description: 'Your business profile has been saved successfully.',
        });
      } else {
        throw new Error(response.message || 'Failed to update profile');
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (businessProfile) {
      setFormData({
        business_name: businessProfile.business_name || '',
        description: businessProfile.description || '',
        phone: businessProfile.phone || '',
        email: businessProfile.email || '',
        website: businessProfile.website || '',
        primaryColor: businessProfile.primary_color || '#10b981',
        secondaryColor: businessProfile.secondary_color || '#3b82f6',
      });
      setLogo(businessProfile.logo_url);
      setLogoFile(null);
    }
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          <span className="ml-2 text-neutral-600">Loading profile...</span>
        </div>
      </div>
    );
  }

  if (!businessProfile) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <Building className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-neutral-900 mb-2">No Business Profile Found</h2>
          <p className="text-neutral-600">Please complete your onboarding to view your profile.</p>
        </div>
      </div>
    );
  }

  const fullAddress = `${businessProfile?.address_line_1 || ''}${businessProfile?.address_line_2 ? ', ' + businessProfile.address_line_2 : ''}, ${businessProfile?.city || ''}, ${businessProfile?.state || ''} ${businessProfile?.postal_code || ''}`;

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Business Profile</h1>
          <p className="text-neutral-600 mt-1">Manage your restaurant information and branding</p>
        </div>
        
        {!isEditing ? (
          <Button 
            onClick={() => setIsEditing(true)}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Edit3 className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleCancel}
              disabled={saving}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Logo and Brand Colors */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border-neutral-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-neutral-900">Logo & Branding</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo Upload */}
              <div>
                <Label className="text-sm font-medium text-neutral-900 mb-3 block">Restaurant Logo</Label>
                <div className="relative w-full aspect-square bg-neutral-100 rounded-xl flex items-center justify-center overflow-hidden border-2 border-dashed border-neutral-300 hover:border-emerald-500 transition-colors">
                  {logo && !logoError ? (
                    <img 
                      src={logo} 
                      alt="Restaurant logo" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const logoType = logo.startsWith('data:') ? 'base64 data URL' : logo;
                        console.error('Failed to load logo:', logoType);
                        setLogoError(true);
                      }}
                      onLoad={() => {
                        const logoType = logo.startsWith('data:') ? 'base64 data URL' : logo;
                        console.log('Logo loaded successfully:', logoType);
                      }}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center">
                      <ImageIcon className="w-16 h-16 text-neutral-300" />
                      {logoError && (
                        <p className="text-xs text-red-500 mt-2">Failed to load logo</p>
                      )}
                    </div>
                  )}
                  {isEditing && (
                    <input
                      id="logo-upload-input"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  )}
                </div>
                {isEditing && (
                  <Button 
                    type="button"
                    variant="outline" 
                    className="w-full mt-3 border-neutral-300"
                    onClick={() => document.getElementById('logo-upload-input')?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Logo
                  </Button>
                )}
              </div>

              {/* Brand Colors */}
              <div className="space-y-4">
                <Label className="text-sm font-medium text-neutral-900">Brand Colors</Label>
                
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="primary-color" className="text-xs text-neutral-600">Primary Color</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="primary-color"
                        type="color"
                        value={formData.primaryColor}
                        onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                        disabled={!isEditing}
                        className="w-16 h-10 cursor-pointer disabled:cursor-default"
                      />
                      <Input
                        value={formData.primaryColor}
                        onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                        disabled={!isEditing}
                        className="flex-1 h-10"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="secondary-color" className="text-xs text-neutral-600">Secondary Color</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="secondary-color"
                        type="color"
                        value={formData.secondaryColor}
                        onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                        disabled={!isEditing}
                        className="w-16 h-10 cursor-pointer disabled:cursor-default"
                      />
                      <Input
                        value={formData.secondaryColor}
                        onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                        disabled={!isEditing}
                        className="flex-1 h-10"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Business Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="lg:col-span-2"
        >
          <Card className="border-neutral-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-neutral-900 flex items-center">
                <Building className="w-5 h-5 mr-2 text-emerald-600" />
                Business Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {isEditing ? (
                <>
                  {/* Editable Form */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="business_name">Business Name *</Label>
                      <Input
                        id="business_name"
                        value={formData.business_name}
                        onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="h-11"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="h-11"
                        placeholder="info@restaurant.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        className="h-11"
                        placeholder="https://restaurant.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="min-h-[100px]"
                      placeholder="Describe your restaurant, cuisine, and what makes it special..."
                    />
                  </div>
                </>
              ) : (
                <>
                  {/* Display Mode */}
                  <div>
                    <h2 className="text-2xl font-bold text-neutral-900">{businessProfile.business_name}</h2>
                    <Badge variant="secondary" className="mt-2 capitalize">
                      {businessProfile.business_type}
                    </Badge>
                  </div>

                  {businessProfile.description && (
                    <div className="flex items-start space-x-3">
                      <FileText className="w-5 h-5 text-neutral-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-neutral-900">Description</p>
                        <p className="text-neutral-600">{businessProfile.description}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start space-x-3">
                    <MapPin className="w-5 h-5 text-neutral-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-neutral-900">Address</p>
                      <p className="text-neutral-600">{fullAddress}</p>
                    </div>
                  </div>

                  {businessProfile.phone && (
                    <div className="flex items-center space-x-3">
                      <Phone className="w-5 h-5 text-neutral-400" />
                      <div>
                        <p className="text-sm font-medium text-neutral-900">Phone</p>
                        <p className="text-neutral-600">{businessProfile.phone}</p>
                      </div>
                    </div>
                  )}

                  {businessProfile.email && (
                    <div className="flex items-center space-x-3">
                      <Mail className="w-5 h-5 text-neutral-400" />
                      <div>
                        <p className="text-sm font-medium text-neutral-900">Email</p>
                        <p className="text-neutral-600">{businessProfile.email}</p>
                      </div>
                    </div>
                  )}

                  {businessProfile.website && (
                    <div className="flex items-center space-x-3">
                      <Globe className="w-5 h-5 text-neutral-400" />
                      <div>
                        <p className="text-sm font-medium text-neutral-900">Website</p>
                        <a 
                          href={businessProfile.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-emerald-600 hover:text-emerald-700 transition-colors"
                        >
                          {businessProfile.website}
                        </a>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Additional Details Card */}
          {!isEditing && (
            <Card className="border-neutral-200 mt-6">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-neutral-900">
                  Additional Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-neutral-600">Cuisine Type</p>
                    <p className="text-neutral-900">{businessProfile.cuisine_type || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-600">Seating Capacity</p>
                    <p className="text-neutral-900">{businessProfile.seating_capacity || 'Not specified'}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-neutral-600">Services</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {businessProfile.services?.length ? (
                      businessProfile.services.map((service, index) => (
                        <Badge key={index} variant="outline" className="capitalize">
                          {service.replace('_', ' ')}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-neutral-400 text-sm">No services specified</p>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-neutral-600">Onboarding Status</p>
                  <div className="flex items-center mt-2">
                    <div className={`w-2 h-2 rounded-full mr-2 ${businessProfile.onboarding_completed ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                    <span className="text-neutral-900">
                      {businessProfile.onboarding_completed ? 'Completed' : 'In Progress'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
}
