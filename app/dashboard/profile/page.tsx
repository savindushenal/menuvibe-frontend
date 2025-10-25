'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, Save, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function RestaurantProfilePage() {
  const { toast } = useToast();
  const [logo, setLogo] = useState<string | null>(null);
  const [profile, setProfile] = useState({
    name: 'The Gourmet Kitchen',
    phone: '+1 (555) 123-4567',
    email: 'info@gourmetkitchen.com',
    address: '123 Main Street, City, State 12345',
    website: 'https://gourmetkitchen.com',
    description: 'Fine dining experience with fresh, locally-sourced ingredients.',
    primaryColor: '#10b981',
    secondaryColor: '#3b82f6',
  });

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    toast({
      title: 'Profile updated',
      description: 'Your restaurant profile has been saved successfully.',
    });
  };

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">Restaurant Profile</h1>
        <p className="text-neutral-600 mt-1">Manage your restaurant branding and information</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border-neutral-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-neutral-900">Logo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative w-full aspect-square bg-neutral-100 rounded-xl flex items-center justify-center overflow-hidden border-2 border-dashed border-neutral-300 hover:border-emerald-500 transition-colors">
                {logo ? (
                  <img src={logo} alt="Restaurant logo" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-16 h-16 text-neutral-300" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
              <Button variant="outline" className="w-full border-neutral-300">
                <Upload className="w-4 h-4 mr-2" />
                Upload Logo
              </Button>
            </CardContent>
          </Card>

          <Card className="border-neutral-200 mt-6">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-neutral-900">
                Brand Colors
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="primary-color">Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="primary-color"
                    type="color"
                    value={profile.primaryColor}
                    onChange={(e) =>
                      setProfile({ ...profile, primaryColor: e.target.value })
                    }
                    className="w-20 h-12 cursor-pointer"
                  />
                  <Input
                    value={profile.primaryColor}
                    onChange={(e) =>
                      setProfile({ ...profile, primaryColor: e.target.value })
                    }
                    className="flex-1 h-12"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondary-color">Secondary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="secondary-color"
                    type="color"
                    value={profile.secondaryColor}
                    onChange={(e) =>
                      setProfile({ ...profile, secondaryColor: e.target.value })
                    }
                    className="w-20 h-12 cursor-pointer"
                  />
                  <Input
                    value={profile.secondaryColor}
                    onChange={(e) =>
                      setProfile({ ...profile, secondaryColor: e.target.value })
                    }
                    className="flex-1 h-12"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="lg:col-span-2"
        >
          <Card className="border-neutral-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-neutral-900">
                Restaurant Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Restaurant Name</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="border-neutral-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="border-neutral-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="border-neutral-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={profile.website}
                    onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                    className="border-neutral-300"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={profile.address}
                  onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                  className="border-neutral-300"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={profile.description}
                  onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                  className="border-neutral-300 min-h-[120px]"
                  placeholder="Tell customers about your restaurant..."
                />
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t border-neutral-200">
                <Button variant="outline" className="border-neutral-300">
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/30"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
