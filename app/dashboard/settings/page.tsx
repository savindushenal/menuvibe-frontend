'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Lock, CreditCard, Users, Bell, Shield, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export default function SettingsPage() {
  const { toast } = useToast();
  const [accountData, setAccountData] = useState({
    name: 'John Doe',
    email: 'john@restaurant.com',
    phone: '+1 (555) 123-4567',
  });

  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    weekly: false,
    marketing: false,
  });

  const handleSaveAccount = () => {
    toast({
      title: 'Account updated',
      description: 'Your account information has been saved.',
    });
  };

  const handleSaveNotifications = () => {
    toast({
      title: 'Preferences saved',
      description: 'Your notification preferences have been updated.',
    });
  };

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
          <TabsTrigger value="security" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
            <Shield className="w-4 h-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="subscription" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
            <CreditCard className="w-4 h-4 mr-2" />
            Subscription
          </TabsTrigger>
          <TabsTrigger value="team" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
            <Users className="w-4 h-4 mr-2" />
            Team
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
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
                <CardTitle className="text-lg font-semibold text-neutral-900">
                  Account Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={accountData.name}
                      onChange={(e) =>
                        setAccountData({ ...accountData, name: e.target.value })
                      }
                      className="border-neutral-300"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={accountData.phone}
                      onChange={(e) =>
                        setAccountData({ ...accountData, phone: e.target.value })
                      }
                      className="border-neutral-300"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={accountData.email}
                    onChange={(e) =>
                      setAccountData({ ...accountData, email: e.target.value })
                    }
                    className="border-neutral-300"
                  />
                </div>
                <div className="flex justify-end pt-4 border-t border-neutral-200">
                  <Button
                    onClick={handleSaveAccount}
                    className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/30"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
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
                <CardTitle className="text-lg font-semibold text-neutral-900">
                  Change Password
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input
                    id="current-password"
                    type="password"
                    className="border-neutral-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    className="border-neutral-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    className="border-neutral-300"
                  />
                </div>
                <div className="flex justify-end pt-4 border-t border-neutral-200">
                  <Button className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/30">
                    <Lock className="w-4 h-4 mr-2" />
                    Update Password
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
                <CardTitle className="text-lg font-semibold text-neutral-900">
                  Current Plan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-6 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl border border-emerald-200">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-2xl font-bold text-neutral-900">Professional Plan</h3>
                      <Badge className="bg-emerald-500">Active</Badge>
                    </div>
                    <p className="text-neutral-600">Billed monthly</p>
                  </div>
                  <div className="text-right">
                    <p className="text-4xl font-bold text-emerald-600">$49</p>
                    <p className="text-sm text-neutral-600">/month</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-neutral-900">Plan Features</h4>
                  <ul className="space-y-2">
                    {[
                      'Unlimited menu items',
                      'QR code generation',
                      'Advanced analytics',
                      'Team collaboration',
                      'Priority support',
                    ].map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-neutral-600">
                        <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
                        </div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex gap-4 pt-4 border-t border-neutral-200">
                  <Button variant="outline" className="flex-1 border-neutral-300">
                    Change Plan
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                  >
                    Cancel Subscription
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="team">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-neutral-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-neutral-900">
                    Team Members
                  </CardTitle>
                  <Button className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white">
                    Invite Member
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: 'John Doe', email: 'john@restaurant.com', role: 'Owner' },
                    { name: 'Jane Smith', email: 'jane@restaurant.com', role: 'Admin' },
                    { name: 'Mike Johnson', email: 'mike@restaurant.com', role: 'Staff' },
                  ].map((member, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-neutral-900">{member.name}</p>
                          <p className="text-sm text-neutral-500">{member.email}</p>
                        </div>
                      </div>
                      <Badge variant="outline">{member.role}</Badge>
                    </div>
                  ))}
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
                <CardTitle className="text-lg font-semibold text-neutral-900">
                  Notification Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                    <div>
                      <p className="font-medium text-neutral-900">Email Notifications</p>
                      <p className="text-sm text-neutral-500">
                        Receive updates via email
                      </p>
                    </div>
                    <Switch
                      checked={notifications.email}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, email: checked })
                      }
                      className="data-[state=checked]:bg-emerald-500"
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                    <div>
                      <p className="font-medium text-neutral-900">Push Notifications</p>
                      <p className="text-sm text-neutral-500">
                        Receive push notifications
                      </p>
                    </div>
                    <Switch
                      checked={notifications.push}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, push: checked })
                      }
                      className="data-[state=checked]:bg-emerald-500"
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                    <div>
                      <p className="font-medium text-neutral-900">Weekly Reports</p>
                      <p className="text-sm text-neutral-500">
                        Get weekly analytics summaries
                      </p>
                    </div>
                    <Switch
                      checked={notifications.weekly}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, weekly: checked })
                      }
                      className="data-[state=checked]:bg-emerald-500"
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                    <div>
                      <p className="font-medium text-neutral-900">Marketing Emails</p>
                      <p className="text-sm text-neutral-500">
                        Receive tips and product updates
                      </p>
                    </div>
                    <Switch
                      checked={notifications.marketing}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, marketing: checked })
                      }
                      className="data-[state=checked]:bg-emerald-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-4 border-t border-neutral-200">
                  <Button
                    onClick={handleSaveNotifications}
                    className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/30"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Preferences
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
