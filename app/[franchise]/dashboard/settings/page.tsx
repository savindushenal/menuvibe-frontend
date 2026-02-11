'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Building2, 
  Palette, 
  Settings2, 
  Save, 
  Loader2, 
  Upload,
  Globe,
  Phone,
  Mail,
  MapPin,
  Clock,
  Bell,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

interface FranchiseSettings {
  id: number;
  name: string;
  slug: string;
  description: string;
  logo_url: string | null;
  website: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  timezone: string;
  currency: string;
  primary_color: string;
  secondary_color: string;
  is_active: boolean;
  settings: {
    allow_branch_customization: boolean;
    require_menu_approval: boolean;
    auto_sync_pricing: boolean;
    notification_email: string;
    business_hours: {
      monday: { open: string; close: string; closed: boolean };
      tuesday: { open: string; close: string; closed: boolean };
      wednesday: { open: string; close: string; closed: boolean };
      thursday: { open: string; close: string; closed: boolean };
      friday: { open: string; close: string; closed: boolean };
      saturday: { open: string; close: string; closed: boolean };
      sunday: { open: string; close: string; closed: boolean };
    };
  };
}

const TIMEZONES = [
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'Eastern Time (US)' },
  { value: 'America/Chicago', label: 'Central Time (US)' },
  { value: 'America/Denver', label: 'Mountain Time (US)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US)' },
  { value: 'Europe/London', label: 'London' },
  { value: 'Europe/Paris', label: 'Paris' },
  { value: 'Asia/Dubai', label: 'Dubai' },
  { value: 'Asia/Singapore', label: 'Singapore' },
  { value: 'Asia/Tokyo', label: 'Tokyo' },
  { value: 'Australia/Sydney', label: 'Sydney' },
];

const CURRENCIES = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'AED', label: 'AED (د.إ)' },
  { value: 'SAR', label: 'SAR (﷼)' },
  { value: 'INR', label: 'INR (₹)' },
  { value: 'LKR', label: 'LKR (Rs)' },
  { value: 'AUD', label: 'AUD (A$)' },
  { value: 'CAD', label: 'CAD (C$)' },
  { value: 'JPY', label: 'JPY (¥)' },
];

// Franchise-specific custom templates
const CUSTOM_TEMPLATES: Record<string, { value: string; label: string; description: string; icon: string }[]> = {
  'isso': [
    { 
      value: 'isso', 
      label: 'Isso Seafood', 
      description: 'Custom branded template with seafood theme',
      icon: '🦐'
    },
  ],
  'barista': [
    { 
      value: 'barista', 
      label: 'Barista Style', 
      description: 'Coffee shop template with hero banner and quick ordering',
      icon: '☕'
    },
  ],
};

const BASE_TEMPLATE_OPTIONS = [
  { 
    value: 'premium', 
    label: 'Premium', 
    description: 'Full-featured with animations and modern design',
    icon: '✨'
  },
  { 
    value: 'classic', 
    label: 'Classic', 
    description: 'Simple and clean list-based menu layout',
    icon: '📋'
  },
  { 
    value: 'minimal', 
    label: 'Minimal', 
    description: 'Modern card-based design with quick add',
    icon: '🎯'
  },
];

const DEFAULT_BUSINESS_HOURS = {
  monday: { open: '09:00', close: '22:00', closed: false },
  tuesday: { open: '09:00', close: '22:00', closed: false },
  wednesday: { open: '09:00', close: '22:00', closed: false },
  thursday: { open: '09:00', close: '22:00', closed: false },
  friday: { open: '09:00', close: '22:00', closed: false },
  saturday: { open: '09:00', close: '22:00', closed: false },
  sunday: { open: '09:00', close: '22:00', closed: true },
};

export default function FranchiseSettingsPage() {
  const params = useParams();
  const franchiseSlug = params.franchise as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  
  // Get template options for this franchise (custom template + base templates)
  const TEMPLATE_OPTIONS = [
    ...(CUSTOM_TEMPLATES[franchiseSlug] || []),
    ...BASE_TEMPLATE_OPTIONS,
  ];
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    website: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postal_code: '',
    timezone: 'UTC',
    currency: 'USD',
    primary_color: '#10b981',
    secondary_color: '#059669',
    template_type: 'premium',
    allow_branch_customization: true,
    require_menu_approval: false,
    auto_sync_pricing: true,
    notification_email: '',
    business_hours: DEFAULT_BUSINESS_HOURS,
  });

  // Fetch settings from API
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/franchise/${franchiseSlug}/settings`);
        
        if (response.data.success && response.data.data) {
          const data = response.data.data;
          const settings = data.settings || {};
          const designTokens = data.design_tokens || {};
          const brandColors = designTokens.colors || {};
          
          setFormData({
            name: data.name || '',
            description: data.description || '',
            website: data.website || '',
            email: data.email || '',
            phone: data.phone || '',
            address: settings.address || data.address || '',
            city: settings.city || data.city || '',
            state: settings.state || data.state || '',
            country: settings.country || data.country || '',
            postal_code: settings.postal_code || data.postal_code || '',
            timezone: settings.timezone || data.timezone || 'UTC',
            currency: settings.currency || data.currency || 'USD',
            // Use design_tokens colors (from onboarding) if available, otherwise fallback to column values
            primary_color: brandColors.primary || data.primary_color || '#10b981',
            secondary_color: brandColors.secondary || data.secondary_color || '#059669',
            template_type: data.template_type || CUSTOM_TEMPLATES[franchiseSlug]?.[0]?.value || 'premium',
            allow_branch_customization: settings.allow_branch_customization ?? true,
            require_menu_approval: settings.require_menu_approval ?? false,
            auto_sync_pricing: settings.auto_sync_pricing ?? true,
            notification_email: settings.notification_email || '',
            business_hours: settings.business_hours || DEFAULT_BUSINESS_HOURS,
          });
        }
      } catch (err: any) {
        console.error('Failed to fetch settings:', err);
        toast.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };
    
    if (franchiseSlug) {
      fetchSettings();
    }
  }, [franchiseSlug]);

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const payload = {
        name: formData.name,
        description: formData.description,
        website: formData.website,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        postal_code: formData.postal_code,
        timezone: formData.timezone,
        currency: formData.currency,
        primary_color: formData.primary_color,
        secondary_color: formData.secondary_color,
        template_type: formData.template_type,
        settings: {
          allow_branch_customization: formData.allow_branch_customization,
          require_menu_approval: formData.require_menu_approval,
          auto_sync_pricing: formData.auto_sync_pricing,
          notification_email: formData.notification_email,
          business_hours: formData.business_hours,
        }
      };

      const response = await api.put(`/franchise/${franchiseSlug}/settings`, payload);
      
      if (response.data.success) {
        toast.success('Settings saved successfully');
        
        // Reload settings to show updated data
        const refreshResponse = await api.get(`/franchise/${franchiseSlug}/settings`);
        if (refreshResponse.data.success && refreshResponse.data.data) {
          const data = refreshResponse.data.data;
          const settings = data.settings || {};
          const designTokens = data.design_tokens || {};
          const brandColors = designTokens.colors || {};
          
          setFormData({
            name: data.name || '',
            description: data.description || '',
            website: data.website || '',
            email: data.email || '',
            phone: data.phone || '',
            address: settings.address || data.address || '',
            city: settings.city || data.city || '',
            state: settings.state || data.state || '',
            country: settings.country || data.country || '',
            postal_code: settings.postal_code || data.postal_code || '',
            timezone: settings.timezone || data.timezone || 'UTC',
            currency: settings.currency || data.currency || 'USD',
            primary_color: brandColors.primary || data.primary_color || '#10b981',
            secondary_color: brandColors.secondary || data.secondary_color || '#059669',
            template_type: data.template_type || CUSTOM_TEMPLATES[franchiseSlug]?.[0]?.value || 'premium',
            allow_branch_customization: settings.allow_branch_customization ?? true,
            require_menu_approval: settings.require_menu_approval ?? false,
            auto_sync_pricing: settings.auto_sync_pricing ?? true,
            notification_email: settings.notification_email || '',
            business_hours: settings.business_hours || DEFAULT_BUSINESS_HOURS,
          });
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const updateBusinessHours = (day: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      business_hours: {
        ...prev.business_hours,
        [day]: {
          ...prev.business_hours[day as keyof typeof prev.business_hours],
          [field]: value
        }
      }
    }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Franchise Settings</h1>
          <p className="text-neutral-600">Manage your franchise configuration and preferences</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save Changes
        </Button>
      </div>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            <span className="hidden sm:inline">General</span>
          </TabsTrigger>
          <TabsTrigger value="branding" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            <span className="hidden sm:inline">Branding</span>
          </TabsTrigger>
          <TabsTrigger value="operations" className="flex items-center gap-2">
            <Settings2 className="w-4 h-4" />
            <span className="hidden sm:inline">Operations</span>
          </TabsTrigger>
          <TabsTrigger value="hours" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span className="hidden sm:inline">Hours</span>
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Franchise Information</CardTitle>
              <CardDescription>Basic information about your franchise</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Franchise Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter franchise name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <Input
                      id="website"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      placeholder="https://example.com"
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of your franchise"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="contact@franchise.com"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+1 234 567 8900"
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Address</CardTitle>
              <CardDescription>Headquarters location</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Street Address</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="123 Main Street"
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="City"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State/Province</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="State"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder="Country"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postal_code">Postal Code</Label>
                  <Input
                    id="postal_code"
                    value={formData.postal_code}
                    onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                    placeholder="12345"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Regional Settings</CardTitle>
              <CardDescription>Timezone and currency preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Select 
                    value={formData.timezone} 
                    onValueChange={(v) => setFormData({ ...formData, timezone: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select 
                    value={formData.currency} 
                    onValueChange={(v) => setFormData({ ...formData, currency: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((cur) => (
                        <SelectItem key={cur.value} value={cur.value}>{cur.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branding Settings */}
        <TabsContent value="branding" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Brand Colors</CardTitle>
              <CardDescription>Customize your franchise colors</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primary_color">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primary_color"
                      type="color"
                      value={formData.primary_color}
                      onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                      className="w-16 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={formData.primary_color}
                      onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                      placeholder="#10b981"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondary_color">Secondary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondary_color"
                      type="color"
                      value={formData.secondary_color}
                      onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                      className="w-16 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={formData.secondary_color}
                      onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                      placeholder="#059669"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              {/* Color Preview */}
              <div className="mt-6">
                <Label className="mb-2 block">Preview</Label>
                <div className="p-4 rounded-lg border bg-white">
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-12 h-12 rounded-lg shadow-md"
                      style={{ backgroundColor: formData.primary_color }}
                    />
                    <div 
                      className="w-12 h-12 rounded-lg shadow-md"
                      style={{ backgroundColor: formData.secondary_color }}
                    />
                    <div className="flex-1">
                      <Button 
                        size="sm" 
                        style={{ backgroundColor: formData.primary_color }}
                        className="mr-2"
                      >
                        Primary Button
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        style={{ borderColor: formData.primary_color, color: formData.primary_color }}
                      >
                        Secondary Button
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Menu Template Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Menu Template</CardTitle>
              <CardDescription>Choose how your menu looks to customers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {TEMPLATE_OPTIONS.map((template) => (
                  <div
                    key={template.value}
                    onClick={() => setFormData({ ...formData, template_type: template.value })}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      formData.template_type === template.value
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                        : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{template.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{template.label}</h4>
                          {formData.template_type === template.value && (
                            <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-neutral-500 mt-1">
                          {template.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-neutral-400 mt-4">
                Templates define the look and feel of your customer-facing menu. 
                Changes will apply to all branches.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Operations Settings */}
        <TabsContent value="operations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Branch Management</CardTitle>
              <CardDescription>Configure how branches operate</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Allow Branch Customization</Label>
                  <p className="text-sm text-neutral-500">
                    Allow branches to customize their menu items and prices
                  </p>
                </div>
                <Switch
                  checked={formData.allow_branch_customization}
                  onCheckedChange={(checked) => setFormData({ ...formData, allow_branch_customization: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Require Menu Approval</Label>
                  <p className="text-sm text-neutral-500">
                    Branch menu changes require approval from franchise admin
                  </p>
                </div>
                <Switch
                  checked={formData.require_menu_approval}
                  onCheckedChange={(checked) => setFormData({ ...formData, require_menu_approval: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-Sync Pricing</Label>
                  <p className="text-sm text-neutral-500">
                    Automatically sync master menu pricing to all branches
                  </p>
                </div>
                <Switch
                  checked={formData.auto_sync_pricing}
                  onCheckedChange={(checked) => setFormData({ ...formData, auto_sync_pricing: checked })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Configure notification preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="notification_email">Notification Email</Label>
                <div className="relative">
                  <Bell className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <Input
                    id="notification_email"
                    type="email"
                    value={formData.notification_email}
                    onChange={(e) => setFormData({ ...formData, notification_email: e.target.value })}
                    placeholder="notifications@franchise.com"
                    className="pl-10"
                  />
                </div>
                <p className="text-sm text-neutral-500">
                  Email address for system notifications and alerts
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Business Hours */}
        <TabsContent value="hours" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Default Business Hours</CardTitle>
              <CardDescription>Set default operating hours for all branches</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(formData.business_hours).map(([day, hours]) => (
                <div key={day} className="flex items-center gap-4 py-2 border-b last:border-0">
                  <div className="w-28">
                    <span className="font-medium capitalize">{day}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={!hours.closed}
                      onCheckedChange={(checked) => updateBusinessHours(day, 'closed', !checked)}
                    />
                    <span className="text-sm text-neutral-500 w-14">
                      {hours.closed ? 'Closed' : 'Open'}
                    </span>
                  </div>
                  {!hours.closed && (
                    <>
                      <div className="flex items-center gap-2">
                        <Input
                          type="time"
                          value={hours.open}
                          onChange={(e) => updateBusinessHours(day, 'open', e.target.value)}
                          className="w-32"
                        />
                        <span className="text-neutral-500">to</span>
                        <Input
                          type="time"
                          value={hours.close}
                          onChange={(e) => updateBusinessHours(day, 'close', e.target.value)}
                          className="w-32"
                        />
                      </div>
                    </>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
