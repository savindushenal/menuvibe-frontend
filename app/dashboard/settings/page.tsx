'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Lock, CreditCard, Users, Bell, Shield, Save, Loader2, MapPin, Plus, Trash2, Star, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api';
import { useLocation } from '@/contexts/location-context';
import { useAuth } from '@/contexts/auth-context';

interface SettingsData {
  account: {
    name: string;
    email: string;
    phone: string;
  };
  notifications: {
    email_notifications: boolean;
    push_notifications: boolean;
    sms_notifications: boolean;
    marketing_emails: boolean;
    order_updates: boolean;
    menu_updates: boolean;
    customer_feedback_notifications: boolean;
    inventory_alerts: boolean;
    daily_reports: boolean;
    weekly_reports: boolean;
    monthly_reports: boolean;
  };
  security: {
    two_factor_enabled: boolean;
    session_timeout: number;
    login_alerts: boolean;
    password_expiry_days: number | null;
  };
  privacy: {
    profile_visibility: string;
    show_online_status: boolean;
    allow_search_engines: boolean;
    data_collection: boolean;
    analytics_tracking: boolean;
  };
  display: {
    theme: string;
    language: string;
    timezone: string;
    date_format: string;
    time_format: string;
    items_per_page: number;
  };
  business: {
    business_hours_display: boolean;
    auto_accept_orders: boolean;
    order_confirmation_required: boolean;
    menu_availability_alerts: boolean;
  };
}

export default function SettingsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [settings, setSettings] = useState<SettingsData | null>(null);

  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [user]);

  const fetchSettings = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const response = await apiClient.getSettings();
      
      if (response.success && response.data) {
        // Map API response to SettingsData structure
        const apiSettings = response.data.settings || {};
        
        setSettings({
          account: {
            name: user.name || '',
            email: user.email || '',
            phone: ''
          },
          notifications: {
            email_notifications: apiSettings.email_notifications || false,
            push_notifications: apiSettings.notifications_enabled || false,
            sms_notifications: false,
            marketing_emails: false,
            order_updates: true,
            menu_updates: true,
            customer_feedback_notifications: true,
            inventory_alerts: true,
            daily_reports: false,
            weekly_reports: false,
            monthly_reports: false
          },
          security: {
            two_factor_enabled: false,
            session_timeout: 30,
            login_alerts: true,
            password_expiry_days: null
          },
          privacy: {
            profile_visibility: 'private',
            show_online_status: false,
            allow_search_engines: false,
            data_collection: true,
            analytics_tracking: true
          },
          display: {
            theme: apiSettings.theme || 'light',
            language: apiSettings.language || 'en',
            timezone: 'UTC',
            date_format: 'MM/DD/YYYY',
            time_format: '12h',
            items_per_page: 20
          },
          business: {
            business_hours_display: true,
            auto_accept_orders: false,
            order_confirmation_required: true,
            menu_availability_alerts: true
          }
        });
      } else {
        throw new Error(response.message || 'Failed to fetch settings');
      }
    } catch (error: any) {
      console.error('Error fetching settings:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAccount = async () => {
    if (!settings) return;
    
    try {
      setSaving('account');
      const response = await apiClient.updateAccountSettings(settings.account);
      
      if (response.success) {
        toast({
          title: 'Account updated',
          description: 'Your account information has been saved.',
        });
      } else {
        throw new Error(response.message || 'Failed to update account');
      }
    } catch (error: any) {
      console.error('Error updating account:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update account. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(null);
    }
  };

  const handleSaveNotifications = async () => {
    if (!settings) return;
    
    try {
      setSaving('notifications');
      const response = await apiClient.updateNotificationSettings(settings.notifications);
      
      if (response.success) {
        toast({
          title: 'Preferences saved',
          description: 'Your notification preferences have been updated.',
        });
      } else {
        throw new Error(response.message || 'Failed to update notifications');
      }
    } catch (error: any) {
      console.error('Error updating notifications:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update notifications. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(null);
    }
  };

  const handleSaveSecurity = async () => {
    if (!settings) return;
    
    try {
      setSaving('security');
      const response = await apiClient.updateSecuritySettings(settings.security);
      
      if (response.success) {
        toast({
          title: 'Security updated',
          description: 'Your security settings have been saved.',
        });
      } else {
        throw new Error(response.message || 'Failed to update security');
      }
    } catch (error: any) {
      console.error('Error updating security:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update security settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(null);
    }
  };

  const updateAccountField = (field: keyof SettingsData['account'], value: string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      account: {
        ...settings.account,
        [field]: value,
      },
    });
  };

  const updateNotificationField = (field: keyof SettingsData['notifications'], value: boolean) => {
    if (!settings) return;
    setSettings({
      ...settings,
      notifications: {
        ...settings.notifications,
        [field]: value,
      },
    });
  };

  const updateSecurityField = (field: keyof SettingsData['security'], value: boolean | number | null) => {
    if (!settings) return;
    setSettings({
      ...settings,
      security: {
        ...settings.security,
        [field]: value,
      },
    });
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          <span className="ml-2 text-neutral-600">Loading settings...</span>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <p className="text-neutral-600">Failed to load settings. Please refresh the page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 lg:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">Settings</h1>
        <p className="text-sm sm:text-base text-neutral-600 mt-1">
          Manage your account, subscription, and preferences
        </p>
      </div>

      <Tabs defaultValue="account" className="space-y-4 sm:space-y-6">
        <TabsList className="bg-white border border-neutral-200 p-1 w-full overflow-x-auto flex-nowrap justify-start sm:justify-center">
          <TabsTrigger value="account" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white whitespace-nowrap text-xs sm:text-sm">
            <User className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Account</span>
            <span className="sm:hidden">Acct</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white whitespace-nowrap text-xs sm:text-sm">
            <Bell className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Notifications</span>
            <span className="sm:hidden">Notif</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white whitespace-nowrap text-xs sm:text-sm">
            <Shield className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Security</span>
            <span className="sm:hidden">Sec</span>
          </TabsTrigger>
          <TabsTrigger value="ordering" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white whitespace-nowrap text-xs sm:text-sm">
            <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Ordering</span>
            <span className="sm:hidden">Order</span>
          </TabsTrigger>
          <TabsTrigger value="subscription" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white whitespace-nowrap text-xs sm:text-sm">
            <CreditCard className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Subscription</span>
            <span className="sm:hidden">Sub</span>
          </TabsTrigger>
          <TabsTrigger value="locations" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white whitespace-nowrap text-xs sm:text-sm">
            <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Locations</span>
            <span className="sm:hidden">Loc</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="account">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-neutral-200">
              <CardHeader>
                <CardTitle className="text-xl text-neutral-900">Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={settings.account.name}
                      onChange={(e) => updateAccountField('name', e.target.value)}
                      className="border-neutral-300"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={settings.account.phone || ''}
                      onChange={(e) => updateAccountField('phone', e.target.value)}
                      className="border-neutral-300"
                      placeholder="e.g., +1 (555) 123-4567"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.account.email}
                    onChange={(e) => updateAccountField('email', e.target.value)}
                    className="border-neutral-300"
                  />
                </div>
                <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t border-neutral-200">
                  <Button
                    onClick={handleSaveAccount}
                    disabled={saving === 'account'}
                    className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/30 w-full sm:w-auto"
                  >
                    {saving === 'account' ? (
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
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="notifications">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-neutral-200">
              <CardHeader>
                <CardTitle className="text-xl text-neutral-900">Notification Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-neutral-800">General Notifications</h3>
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <Label htmlFor="email-notifications">Email Notifications</Label>
                        <p className="text-sm text-neutral-600">Receive notifications via email</p>
                      </div>
                      <Switch
                        id="email-notifications"
                        checked={settings.notifications.email_notifications}
                        onCheckedChange={(checked) => updateNotificationField('email_notifications', checked)}
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <Label htmlFor="push-notifications">Push Notifications</Label>
                        <p className="text-sm text-neutral-600">Receive browser push notifications</p>
                      </div>
                      <Switch
                        id="push-notifications"
                        checked={settings.notifications.push_notifications}
                        onCheckedChange={(checked) => updateNotificationField('push_notifications', checked)}
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <Label htmlFor="sms-notifications">SMS Notifications</Label>
                        <p className="text-sm text-neutral-600">Receive notifications via text message</p>
                      </div>
                      <Switch
                        id="sms-notifications"
                        checked={settings.notifications.sms_notifications}
                        onCheckedChange={(checked) => updateNotificationField('sms_notifications', checked)}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-neutral-800">Business Notifications</h3>
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <Label htmlFor="order-updates">Order Updates</Label>
                        <p className="text-sm text-neutral-600">Get notified about new orders</p>
                      </div>
                      <Switch
                        id="order-updates"
                        checked={settings.notifications.order_updates}
                        onCheckedChange={(checked) => updateNotificationField('order_updates', checked)}
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <Label htmlFor="customer-feedback">Customer Feedback</Label>
                        <p className="text-sm text-neutral-600">Get notified about customer reviews and feedback</p>
                      </div>
                      <Switch
                        id="customer-feedback"
                        checked={settings.notifications.customer_feedback_notifications}
                        onCheckedChange={(checked) => updateNotificationField('customer_feedback_notifications', checked)}
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <Label htmlFor="inventory-alerts">Inventory Alerts</Label>
                        <p className="text-sm text-neutral-600">Get notified about low inventory</p>
                      </div>
                      <Switch
                        id="inventory-alerts"
                        checked={settings.notifications.inventory_alerts}
                        onCheckedChange={(checked) => updateNotificationField('inventory_alerts', checked)}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-neutral-800">Reports & Marketing</h3>
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <Label htmlFor="weekly-reports">Weekly Reports</Label>
                        <p className="text-sm text-neutral-600">Receive weekly business performance reports</p>
                      </div>
                      <Switch
                        id="weekly-reports"
                        checked={settings.notifications.weekly_reports}
                        onCheckedChange={(checked) => updateNotificationField('weekly_reports', checked)}
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <Label htmlFor="marketing-emails">Marketing Emails</Label>
                        <p className="text-sm text-neutral-600">Receive promotional emails and updates</p>
                      </div>
                      <Switch
                        id="marketing-emails"
                        checked={settings.notifications.marketing_emails}
                        onCheckedChange={(checked) => updateNotificationField('marketing_emails', checked)}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t border-neutral-200">
                  <Button
                    onClick={handleSaveNotifications}
                    disabled={saving === 'notifications'}
                    className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/30 w-full sm:w-auto"
                  >
                    {saving === 'notifications' ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Preferences
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="security">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-neutral-200">
              <CardHeader>
                <CardTitle className="text-xl text-neutral-900">Security Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <Label htmlFor="two-factor">Two-Factor Authentication</Label>
                      <p className="text-sm text-neutral-600">Add an extra layer of security to your account</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="two-factor"
                        checked={settings.security.two_factor_enabled}
                        onCheckedChange={(checked) => updateSecurityField('two_factor_enabled', checked)}
                      />
                      {settings.security.two_factor_enabled && (
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                          Enabled
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <Label htmlFor="login-alerts">Login Alerts</Label>
                      <p className="text-sm text-neutral-600">Get notified when someone logs into your account</p>
                    </div>
                    <Switch
                      id="login-alerts"
                      checked={settings.security.login_alerts}
                      onCheckedChange={(checked) => updateSecurityField('login_alerts', checked)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                    <p className="text-sm text-neutral-600">Automatically log out after period of inactivity</p>
                    <Input
                      id="session-timeout"
                      type="number"
                      min="5"
                      max="1440"
                      value={settings.security.session_timeout}
                      onChange={(e) => updateSecurityField('session_timeout', parseInt(e.target.value))}
                      className="border-neutral-300 w-full sm:w-32"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t border-neutral-200">
                  <Button
                    onClick={handleSaveSecurity}
                    disabled={saving === 'security'}
                    className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/30 w-full sm:w-auto"
                  >
                    {saving === 'security' ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Security Settings
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="ordering">
          <OrderingSettings />
        </TabsContent>

        <TabsContent value="subscription">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-neutral-200">
              <CardHeader>
                <CardTitle className="text-xl text-neutral-900">Subscription & Billing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-neutral-800">Current Plan</h3>
                    <p className="text-sm text-neutral-600">Manage your subscription and view billing</p>
                  </div>
                  <Badge variant="outline" className="border-emerald-300 text-emerald-700">
                    Active
                  </Badge>
                </div>
                <div className="pt-4 border-t border-neutral-200">
                  <p className="text-neutral-600 mb-4">
                    View all available plans, upgrade or downgrade your subscription, and manage billing preferences.
                  </p>
                  <Button 
                    onClick={() => window.location.href = '/dashboard/subscription'}
                    className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/30 w-full sm:w-auto"
                  >
                    Manage Subscription
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="locations">
          <LocationsManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function LocationsManagement() {
  const { locations, isLoading: locationsLoading, refreshLocations, addLocation, updateLocation, deleteLocation, setAsDefault } = useLocation();
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
    phone: '',
    email: ''
  });

  // Show loading state while locations are being fetched
  if (locationsLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              <span className="ml-2 text-neutral-600">Loading locations...</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  const handleAddLocation = async () => {
    if (!formData.name || !formData.address_line_1 || !formData.city || !formData.state || !formData.postal_code || !formData.country) {
      toast({
        title: 'Validation Error',
        description: 'Name, address, city, state, postal code, and country are required',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      await addLocation({
        name: formData.name,
        address_line_1: formData.address_line_1,
        address_line_2: formData.address_line_2,
        city: formData.city,
        state: formData.state,
        postal_code: formData.postal_code,
        country: formData.country,
        phone: formData.phone,
        email: formData.email,
        is_active: true,
        is_default: false
      });
      toast({
        title: 'Success',
        description: 'Location added successfully'
      });
      setIsAdding(false);
      setFormData({ 
        name: '', 
        address_line_1: '', 
        address_line_2: '', 
        city: '', 
        state: '', 
        postal_code: '', 
        country: '', 
        phone: '', 
        email: '' 
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add location',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateLocation = async (id: string) => {
    setLoading(true);
    try {
      await updateLocation(id, {
        name: formData.name,
        address_line_1: formData.address_line_1,
        address_line_2: formData.address_line_2,
        city: formData.city,
        state: formData.state,
        postal_code: formData.postal_code,
        country: formData.country,
        phone: formData.phone,
        email: formData.email
      });
      toast({
        title: 'Success',
        description: 'Location updated successfully'
      });
      setEditingId(null);
      setFormData({ 
        name: '', 
        address_line_1: '', 
        address_line_2: '', 
        city: '', 
        state: '', 
        postal_code: '', 
        country: '', 
        phone: '', 
        email: '' 
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update location',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLocation = async (id: string) => {
    if (!confirm('Are you sure you want to delete this location?')) return;

    setLoading(true);
    try {
      await deleteLocation(id);
      toast({
        title: 'Success',
        description: 'Location deleted successfully'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete location',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    setLoading(true);
    try {
      await setAsDefault(id);
      toast({
        title: 'Success',
        description: 'Default location updated'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to set default location',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (location: any) => {
    setEditingId(location.id);
    setFormData({
      name: location.name,
      address_line_1: location.address_line_1,
      address_line_2: location.address_line_2 || '',
      city: location.city,
      state: location.state,
      postal_code: location.postal_code,
      country: location.country,
      phone: location.phone || '',
      email: location.email || ''
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsAdding(false);
    setFormData({ 
      name: '', 
      address_line_1: '', 
      address_line_2: '', 
      city: '', 
      state: '', 
      postal_code: '', 
      country: '', 
      phone: '', 
      email: '' 
    });
  };

  const formatAddress = (location: any) => {
    const parts = [
      location.address_line_1,
      location.address_line_2,
      location.city,
      location.state,
      location.postal_code,
      location.country
    ].filter(Boolean);
    return parts.join(', ');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle>Manage Locations</CardTitle>
          <Button
            onClick={() => setIsAdding(true)}
            disabled={isAdding}
            className="bg-emerald-500 hover:bg-emerald-600 w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Location
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {isAdding && (
            <Card className="border-emerald-200 bg-emerald-50/50">
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Location Name *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Downtown Branch"
                    />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+1 234 567 8900"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Address Line 1 *</Label>
                    <Input
                      value={formData.address_line_1}
                      onChange={(e) => setFormData({ ...formData, address_line_1: e.target.value })}
                      placeholder="123 Main St"
                    />
                  </div>
                  <div>
                    <Label>Address Line 2</Label>
                    <Input
                      value={formData.address_line_2}
                      onChange={(e) => setFormData({ ...formData, address_line_2: e.target.value })}
                      placeholder="Suite 100"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>City *</Label>
                    <Input
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="New York"
                    />
                  </div>
                  <div>
                    <Label>State *</Label>
                    <Input
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      placeholder="NY"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Postal Code *</Label>
                    <Input
                      value={formData.postal_code}
                      onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                      placeholder="10001"
                    />
                  </div>
                  <div>
                    <Label>Country *</Label>
                    <Input
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      placeholder="USA"
                    />
                  </div>
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="location@restaurant.com"
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-2 justify-end">
                  <Button variant="outline" onClick={cancelEdit} disabled={loading} className="w-full sm:w-auto">
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddLocation}
                    disabled={loading}
                    className="bg-emerald-500 hover:bg-emerald-600 w-full sm:w-auto"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Location'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {Array.isArray(locations) && locations.map((location) => (
            <Card key={location.id} className={location.is_default ? 'border-emerald-500' : ''}>
              <CardContent className="pt-6">{editingId === location.id ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label>Location Name *</Label>
                        <Input
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Phone</Label>
                        <Input
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label>Address Line 1 *</Label>
                        <Input
                          value={formData.address_line_1}
                          onChange={(e) => setFormData({ ...formData, address_line_1: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Address Line 2</Label>
                        <Input
                          value={formData.address_line_2}
                          onChange={(e) => setFormData({ ...formData, address_line_2: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label>City *</Label>
                        <Input
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>State *</Label>
                        <Input
                          value={formData.state}
                          onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label>Postal Code *</Label>
                        <Input
                          value={formData.postal_code}
                          onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Country *</Label>
                        <Input
                          value={formData.country}
                          onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 justify-end">
                      <Button variant="outline" onClick={cancelEdit} disabled={loading} className="w-full sm:w-auto">
                        Cancel
                      </Button>
                      <Button
                        onClick={() => handleUpdateLocation(location.id)}
                        disabled={loading}
                        className="bg-emerald-500 hover:bg-emerald-600 w-full sm:w-auto"
                      >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-base sm:text-lg">{location.name}</h3>
                        {location.is_default && (
                          <Badge className="bg-emerald-500">
                            <Star className="w-3 h-3 mr-1" />
                            Default
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-neutral-600 flex items-start sm:items-center gap-2">
                        <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5 sm:mt-0" />
                        <span className="break-words">{formatAddress(location)}</span>
                      </p>
                      {location.phone && (
                        <p className="text-xs sm:text-sm text-neutral-600">{location.phone}</p>
                      )}
                      {location.email && (
                        <p className="text-xs sm:text-sm text-neutral-600 break-all">{location.email}</p>
                      )}
                    </div>
                    <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full sm:w-auto">
                      {!location.is_default && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetDefault(location.id)}
                          disabled={loading}
                          className="flex-1 sm:flex-none"
                        >
                          Set Default
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startEdit(location)}
                        disabled={loading}
                        className="flex-1 sm:flex-none"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteLocation(location.id)}
                        disabled={loading || location.is_default}
                        className="text-red-600 hover:text-red-700 flex-1 sm:flex-none"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {Array.isArray(locations) && locations.length === 0 && !isAdding && (
            <div className="text-center py-12 text-neutral-500">
              <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No locations added yet</p>
              <p className="text-sm">Click "Add Location" to create your first location</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function OrderingSettings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    ordering: {
      enabled: true,
      requiresApproval: false
    },
    loyalty: {
      enabled: false,
      required: false,
      label: 'Loyalty Number',
      placeholder: 'Enter your loyalty number',
      helpText: ''
    }
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/settings/ordering');
      const data = await response.json();
      if (data.success && data.settings) {
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load settings',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/settings/ordering', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Success',
          description: 'Settings saved successfully'
        });
      } else {
        toast({
          title: 'Error',
          description: data.message || 'Failed to save settings',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              <span className="ml-2 text-neutral-600">Loading settings...</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-neutral-200">
        <CardHeader>
          <CardTitle className="text-xl text-neutral-900">Ordering & Loyalty Settings</CardTitle>
          <p className="text-sm text-neutral-600 mt-2">Configure how customers can order from your menu</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Ordering Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <ShoppingCart className="w-5 h-5 text-emerald-600" />
              <h3 className="font-semibold text-neutral-900">Online Ordering</h3>
            </div>
            
            <div className="space-y-3 ml-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-neutral-50 rounded-lg">
                <div>
                  <Label htmlFor="ordering-enabled">Enable Online Ordering</Label>
                  <p className="text-sm text-neutral-600">Allow customers to place orders directly from the menu</p>
                </div>
                <Switch
                  id="ordering-enabled"
                  checked={settings.ordering.enabled}
                  onCheckedChange={(checked) => setSettings(prev => ({
                    ...prev,
                    ordering: { ...prev.ordering, enabled: checked }
                  }))}
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-neutral-50 rounded-lg">
                <div>
                  <Label htmlFor="requires-approval">Require Order Approval</Label>
                  <p className="text-sm text-neutral-600">Orders need manual confirmation before processing</p>
                </div>
                <Switch
                  id="requires-approval"
                  checked={settings.ordering.requiresApproval}
                  onCheckedChange={(checked) => setSettings(prev => ({
                    ...prev,
                    ordering: { ...prev.ordering, requiresApproval: checked }
                  }))}
                  disabled={!settings.ordering.enabled}
                />
              </div>
            </div>
          </div>

          {/* Loyalty Program Settings */}
          <div className="space-y-4 pt-4 border-t border-neutral-200">
            <div className="flex items-center gap-3">
              <Star className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-neutral-900">Loyalty Program</h3>
              <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-xs">
                Enterprise
              </Badge>
            </div>
            
            <div className="space-y-4 ml-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-neutral-50 rounded-lg">
                <div>
                  <Label htmlFor="loyalty-enabled">Enable Loyalty Program</Label>
                  <p className="text-sm text-neutral-600">Track customer loyalty numbers with orders</p>
                </div>
                <Switch
                  id="loyalty-enabled"
                  checked={settings.loyalty.enabled}
                  onCheckedChange={(checked) => setSettings(prev => ({
                    ...prev,
                    loyalty: { ...prev.loyalty, enabled: checked }
                  }))}
                />
              </div>

              {settings.loyalty.enabled && (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-neutral-50 rounded-lg">
                    <div>
                      <Label htmlFor="loyalty-required">Require Loyalty Number</Label>
                      <p className="text-sm text-neutral-600">Customers must provide loyalty number to place orders</p>
                    </div>
                    <Switch
                      id="loyalty-required"
                      checked={settings.loyalty.required}
                      onCheckedChange={(checked) => setSettings(prev => ({
                        ...prev,
                        loyalty: { ...prev.loyalty, required: checked }
                      }))}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 p-4 bg-white rounded-lg border border-neutral-200">
                    <div>
                      <Label htmlFor="loyalty-label">Field Label</Label>
                      <Input
                        id="loyalty-label"
                        value={settings.loyalty.label}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          loyalty: { ...prev.loyalty, label: e.target.value }
                        }))}
                        placeholder="Loyalty Number"
                        className="mt-2"
                      />
                      <p className="text-xs text-neutral-500 mt-1">
                        Examples: "Member Number", "Rewards Card", "Loyalty ID"
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="loyalty-placeholder">Placeholder Text</Label>
                      <Input
                        id="loyalty-placeholder"
                        value={settings.loyalty.placeholder}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          loyalty: { ...prev.loyalty, placeholder: e.target.value }
                        }))}
                        placeholder="Enter your loyalty number"
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="loyalty-help">Help Text (Optional)</Label>
                      <Input
                        id="loyalty-help"
                        value={settings.loyalty.helpText}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          loyalty: { ...prev.loyalty, helpText: e.target.value }
                        }))}
                        placeholder="e.g., Earn 10 points for every $1 spent"
                        className="mt-2"
                      />
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <h4 className="text-sm font-semibold text-blue-900 mb-3">Preview</h4>
                    <div className="bg-white rounded-lg p-4">
                      <Label className="flex items-center gap-2 mb-2">
                        <Star className="w-4 h-4 text-purple-600" />
                        {settings.loyalty.label} {settings.loyalty.required && <span className="text-red-500">*</span>}
                      </Label>
                      <Input
                        placeholder={settings.loyalty.placeholder}
                        disabled
                        className="bg-gray-50"
                      />
                      {settings.loyalty.helpText && (
                        <p className="text-xs text-neutral-600 mt-2">{settings.loyalty.helpText}</p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t border-neutral-200">
            <Button
              onClick={saveSettings}
              disabled={saving}
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/30 w-full sm:w-auto"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">💡 How This Works</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Online Ordering</strong>: Requires Pro or Enterprise subscription</li>
              <li>• <strong>Loyalty Program</strong>: Enterprise feature for tracking customer rewards</li>
              <li>• Settings apply to all menus at this location</li>
              <li>• Changes take effect immediately for new orders</li>
            </ul>
          </div>

          {/* Custom Order Form Link */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h4 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                  🎨 Custom Order Form Fields
                  <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-xs">
                    Pro+
                  </Badge>
                </h4>
                <p className="text-sm text-purple-800 mb-3">
                  Add custom fields to your order form for POS integration, delivery addresses, room numbers, employee IDs, and more.
                </p>
                <ul className="text-xs text-purple-700 space-y-1 mb-3">
                  <li>• Add text fields, dropdowns, radio buttons, and text areas</li>
                  <li>• Perfect for hotels, corporate cafeterias, and delivery services</li>
                  <li>• Integrate with your existing POS or booking system</li>
                </ul>
              </div>
              <Button
                onClick={() => window.location.href = '/dashboard/settings/order-form'}
                className="bg-purple-600 hover:bg-purple-700 text-white whitespace-nowrap"
              >
                Customize Form →
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
