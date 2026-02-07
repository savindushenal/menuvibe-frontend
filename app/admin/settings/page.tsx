'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Settings,
  Shield,
  CreditCard,
  Mail,
  Globe,
  Save,
  RefreshCw,
} from 'lucide-react';
import { Label } from '@/components/ui/label';

interface PlatformSetting {
  id: number;
  key: string;
  value: string;
  type: string;
  group: string;
  description: string;
  is_public: boolean;
}

interface GroupedSettings {
  [group: string]: PlatformSetting[];
}

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<GroupedSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});

  const fetchSettings = async () => {
    try {
      const response = await apiClient.getAdminSettings();
      if (response.success) {
        setSettings(response.data as GroupedSettings);
        // Initialize edited values
        const initialValues: Record<string, string> = {};
        Object.values(response.data as GroupedSettings)
          .flat()
          .forEach((setting: PlatformSetting) => {
            initialValues[setting.key] = setting.value;
          });
        setEditedValues(initialValues);
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to load settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleValueChange = (key: string, value: string) => {
    setEditedValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async (key: string) => {
    setSaving(true);
    try {
      const response = await apiClient.updateAdminSetting(key, { value: editedValues[key] });
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Setting saved successfully',
        });
        fetchSettings();
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to save setting',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const settingsToUpdate = Object.entries(editedValues).reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {} as Record<string, any>);

      const response = await apiClient.updateAdminSettingsBulk({ settings: settingsToUpdate });

      if (response.success) {
        toast({
          title: 'Success',
          description: response.message,
        });
        fetchSettings();
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const getGroupIcon = (group: string) => {
    switch (group) {
      case 'general':
        return <Globe className="h-4 w-4" />;
      case 'security':
        return <Shield className="h-4 w-4" />;
      case 'billing':
        return <CreditCard className="h-4 w-4" />;
      case 'email':
        return <Mail className="h-4 w-4" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  const renderSettingInput = (setting: PlatformSetting) => {
    const value = editedValues[setting.key] ?? setting.value;

    switch (setting.type) {
      case 'boolean':
        return (
          <div className="flex items-center gap-3">
            <Switch
              checked={value === 'true'}
              onCheckedChange={(checked) =>
                handleValueChange(setting.key, checked ? 'true' : 'false')
              }
            />
            <span className="text-sm text-muted-foreground">
              {value === 'true' ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        );
      case 'integer':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleValueChange(setting.key, e.target.value)}
            className="max-w-[200px]"
          />
        );
      default:
        return (
          <Input
            value={value}
            onChange={(e) => handleValueChange(setting.key, e.target.value)}
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  const groups = Object.keys(settings);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Platform Settings</h1>
          <p className="text-muted-foreground">Configure global platform settings</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchSettings}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleSaveAll} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            Save All
          </Button>
        </div>
      </div>

      <Tabs defaultValue={groups[0] || 'general'}>
        <TabsList>
          {groups.map((group) => (
            <TabsTrigger key={group} value={group} className="capitalize">
              {getGroupIcon(group)}
              <span className="ml-2">{group}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {groups.map((group) => (
          <TabsContent key={group} value={group} className="space-y-4 mt-6">
            {settings[group]?.map((setting) => (
              <Card key={setting.key}>
                <CardContent className="pt-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Label className="font-medium">
                          {setting.key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                        </Label>
                        {setting.is_public && (
                          <Badge variant="outline" className="text-xs">
                            Public
                          </Badge>
                        )}
                      </div>
                      {setting.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {setting.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {renderSettingInput(setting)}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSave(setting.key)}
                        disabled={saving}
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
