'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Eye,
  Save,
  RefreshCw,
  QrCode,
  DollarSign,
  Package,
  AlertCircle,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface MenuItem {
  id: number;
  name: string;
  description: string | null;
  price: number;
  is_available: boolean;
  category_id: number;
  master_item_id?: number;
  has_override?: boolean;
  original_price?: number;
}

interface Category {
  id: number;
  name: string;
  items: MenuItem[];
}

interface Menu {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  location: {
    id: number;
    name: string;
    branch_code: string;
    branch_id?: number | null;
  };
  categories: Category[];
}

export default function BranchMenuEditPage() {
  const params = useParams();
  const router = useRouter();
  const franchiseSlug = params?.franchise as string;
  const menuId = params?.menuId as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [menu, setMenu] = useState<Menu | null>(null);
  const [changes, setChanges] = useState<Map<number, { price?: number; is_available?: boolean }>>(new Map());
  const [qrDialog, setQrDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchMenu();
  }, [menuId, franchiseSlug]);

  const fetchMenu = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/franchise/${franchiseSlug}/menus/${menuId}`);
      
      if (response.data.success) {
        setMenu(response.data.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch menu:', err);
      toast.error(err.response?.data?.message || 'Failed to load menu');
    } finally {
      setLoading(false);
    }
  };

  const handlePriceChange = (itemId: number, price: string) => {
    const numPrice = parseFloat(price) || 0;
    setChanges(prev => {
      const newChanges = new Map(prev);
      const existing = newChanges.get(itemId) || {};
      newChanges.set(itemId, { ...existing, price: numPrice });
      return newChanges;
    });
  };

  const handleAvailabilityChange = (itemId: number, available: boolean) => {
    setChanges(prev => {
      const newChanges = new Map(prev);
      const existing = newChanges.get(itemId) || {};
      newChanges.set(itemId, { ...existing, is_available: available });
      return newChanges;
    });
  };

  const handleSaveChanges = async () => {
    if (changes.size === 0) {
      toast.info('No changes to save');
      return;
    }

    try {
      setSaving(true);
      const updates = Array.from(changes.entries()).map(([itemId, change]) => ({
        item_id: itemId,
        ...change,
      }));

      const response = await api.post(
        `/franchise/${franchiseSlug}/menus/${menuId}/bulk-update`,
        { updates }
      );

      if (response.data.success) {
        toast.success('Changes saved successfully');
        setChanges(new Map());
        fetchMenu();
      }
    } catch (err: any) {
      console.error('Failed to save changes:', err);
      toast.error(err.response?.data?.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleResetItem = (itemId: number) => {
    setChanges(prev => {
      const newChanges = new Map(prev);
      newChanges.delete(itemId);
      return newChanges;
    });
  };

  const getItemPrice = (item: MenuItem) => {
    const change = changes.get(item.id);
    return change?.price !== undefined ? change.price : item.price;
  };

  const getItemAvailability = (item: MenuItem) => {
    const change = changes.get(item.id);
    return change?.is_available !== undefined ? change.is_available : item.is_available;
  };

  const hasChanges = (itemId: number) => {
    return changes.has(itemId);
  };

  const filteredCategories = menu?.categories?.filter(cat =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.items.some(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  if (!menu) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-red-900 mb-2">Menu Not Found</h3>
            <p className="text-red-600 mb-4">
              This menu hasn't been synced to the branch location yet. 
              Please sync your Master Menu to create branch menus first.
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => router.back()}>
                Go Back
              </Button>
              <Button onClick={() => router.push(`/${franchiseSlug}/dashboard/menus/master`)}>
                Go to Master Menu
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/${franchiseSlug}/dashboard/menus`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-neutral-900">{menu.name}</h1>
              <Badge variant={menu.is_active ? 'default' : 'secondary'}>
                {menu.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <p className="text-neutral-600 text-sm">
              {menu.location.name} • Branch Location Menu
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {changes.size > 0 && (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              {changes.size} unsaved change{changes.size !== 1 ? 's' : ''}
            </Badge>
          )}
          <Button variant="outline" onClick={() => router.push(`/${franchiseSlug}/dashboard/tables-qr`)}>
            <QrCode className="h-4 w-4 mr-2" />
            QR Codes
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(`/${franchiseSlug}/menu/${menu.location.id}`)}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button onClick={handleSaveChanges} disabled={saving || changes.size === 0}>
            <Save className={`h-4 w-4 mr-2 ${saving ? 'animate-spin' : ''}`} />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Info Banner */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700">
            <strong>Branch Menu Customization:</strong> Adjust prices and availability for this location. 
            Changes are saved as overrides and won't affect other branches or the master menu.
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <Input
        placeholder="Search items..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="max-w-md"
      />

      {/* Categories & Items */}
      <div className="space-y-6">
        {filteredCategories.map((category) => (
          <Card key={category.id}>
            <CardHeader>
              <CardTitle className="text-lg">{category.name}</CardTitle>
              <CardDescription>{category.items.length} items</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {category.items.map((item) => {
                  const currentPrice = getItemPrice(item);
                  const currentAvailability = getItemAvailability(item);
                  const isChanged = hasChanges(item.id);

                  return (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between p-4 rounded-lg border ${
                        isChanged ? 'border-amber-300 bg-amber-50' : 'border-neutral-200 bg-white'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{item.name}</h4>
                          {item.has_override && (
                            <Badge variant="secondary" className="text-xs">
                              <Package className="h-3 w-3 mr-1" />
                              Custom
                            </Badge>
                          )}
                          {isChanged && (
                            <Badge variant="outline" className="text-xs bg-amber-100 border-amber-300 text-amber-700">
                              <Clock className="h-3 w-3 mr-1" />
                              Unsaved
                            </Badge>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-sm text-neutral-600 mt-1">{item.description}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-4">
                        {/* Price Input */}
                        <div className="w-32">
                          <Label className="text-xs text-neutral-500">Price</Label>
                          <div className="relative">
                            <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-neutral-400" />
                            <Input
                              type="number"
                              step="0.01"
                              value={currentPrice}
                              onChange={(e) => handlePriceChange(item.id, e.target.value)}
                              className="pl-7"
                            />
                          </div>
                          {item.original_price && currentPrice !== item.original_price && (
                            <p className="text-xs text-neutral-500 mt-1">
                              Master: ${item.original_price.toFixed(2)}
                            </p>
                          )}
                        </div>

                        {/* Availability Switch */}
                        <div className="flex flex-col items-center gap-1">
                          <Label className="text-xs text-neutral-500">Available</Label>
                          <Switch
                            checked={currentAvailability}
                            onCheckedChange={(checked) => handleAvailabilityChange(item.id, checked)}
                          />
                        </div>

                        {/* Reset Button */}
                        {isChanged && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleResetItem(item.id)}
                          >
                            <RefreshCw className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* QR Code Dialog */}
      <Dialog open={qrDialog} onOpenChange={setQrDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>QR Codes for {menu.location.name}</DialogTitle>
            <DialogDescription>
              Manage QR codes for this branch location
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-neutral-600 mb-4">
              Generate and manage QR codes for tables at {menu.location.name}.
            </p>
            <Button 
              onClick={() => {
                setQrDialog(false);
                router.push(`/${franchiseSlug}/dashboard`);
              }}
              className="w-full"
            >
              Go to Branch Dashboard
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
