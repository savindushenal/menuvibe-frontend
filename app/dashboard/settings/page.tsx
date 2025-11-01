'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Lock, CreditCard, Users, Bell, Shield, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api';

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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [settings, setSettings] = useState<SettingsData | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getSettings();
      
      if (response.success && response.data) {
        setSettings(response.data);
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
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">Settings</h1>
        <p className="text-neutral-600 mt-1">
          Manage your account, subscription, and preferences
        </p>
      </div>

      <Tabs defaultValue="account" className="space-y-6">
        <TabsList className="bg-white border border-neutral-200 p-1">
          <TabsTrigger value="account" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
            <User className="w-4 h-4 mr-2" />
            Account
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
            <Shield className="w-4 h-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="subscription" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
            <CreditCard className="w-4 h-4 mr-2" />
            Subscription
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
                <div className="flex justify-end pt-4 border-t border-neutral-200">
                  <Button
                    onClick={handleSaveAccount}
                    disabled={saving === 'account'}
                    className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/30"
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
                    <div className="flex items-center justify-between">
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
                    <div className="flex items-center justify-between">
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
                    <div className="flex items-center justify-between">
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
                    <div className="flex items-center justify-between">
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
                    <div className="flex items-center justify-between">
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
                    <div className="flex items-center justify-between">
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
                    <div className="flex items-center justify-between">
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
                    <div className="flex items-center justify-between">
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

                <div className="flex justify-end pt-4 border-t border-neutral-200">
                  <Button
                    onClick={handleSaveNotifications}
                    disabled={saving === 'notifications'}
                    className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/30"
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
                  <div className="flex items-center justify-between">
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
                  
                  <div className="flex items-center justify-between">
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
                      className="border-neutral-300 w-32"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-neutral-200">
                  <Button
                    onClick={handleSaveSecurity}
                    disabled={saving === 'security'}
                    className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/30"
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
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-neutral-800">Current Plan</h3>
                    <p className="text-sm text-neutral-600">Free Plan</p>
                  </div>
                  <Badge variant="outline" className="border-emerald-300 text-emerald-700">
                    Active
                  </Badge>
                </div>
                <div className="pt-4 border-t border-neutral-200">
                  <p className="text-neutral-600">
                    Upgrade to a premium plan to unlock more features and remove limitations.
                  </p>
                  <Button variant="outline" className="mt-3">
                    View Plans
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}