'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  QrCode,
  DollarSign,
  Package,
  AlertCircle,
  Clock,
  Plus,
  Edit3,
  MoreVertical,
  ChevronDown,
  ChevronRight,
  Check,
  X,
} from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { MenuItemForm } from '@/components/menu/menu-item-form';
import { ItemVariantsForm, ItemVariant } from '@/components/menu/item-variants-form';
import { ItemCustomizationsForm } from '@/components/menu/item-customizations-form';
import { CustomizationSection } from '@/lib/types';

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
  variations?: ItemVariant[] | null;
  customizations?: CustomizationSection[] | null;
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
  const [isItemFormOpen, setIsItemFormOpen] = useState(false);
  const [addItemLoading, setAddItemLoading] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());

  // Variants / customizations dialogs
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [variantsDialogOpen, setVariantsDialogOpen] = useState(false);
  const [customizationsDialogOpen, setCustomizationsDialogOpen] = useState(false);
  const [editingVariants, setEditingVariants] = useState<ItemVariant[]>([]);
  const [editingCustomizations, setEditingCustomizations] = useState<CustomizationSection[]>([]);
  const [savingVariants, setSavingVariants] = useState(false);

  // Inline price edit dialog
  const [editPriceDialog, setEditPriceDialog] = useState<{ open: boolean; item: MenuItem | null }>({ open: false, item: null });
  const [editPriceValue, setEditPriceValue] = useState('');

  const fetchMenu = useCallback(async () => {
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
  }, [franchiseSlug, menuId]);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  // Expand all categories on load
  useEffect(() => {
    if (menu) {
      setExpandedCategories(new Set(menu.categories.map(c => c.id)));
    }
  }, [menu?.id]);

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

  const toggleCategory = (categoryId: number) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
      return next;
    });
  };

  // Hide/show ALL items in a category
  const handleHideCategory = (category: Category, hide: boolean) => {
    setChanges(prev => {
      const newChanges = new Map(prev);
      (category.items || []).forEach(item => {
        const existing = newChanges.get(item.id) || {};
        newChanges.set(item.id, { ...existing, is_available: !hide });
      });
      return newChanges;
    });
  };

  // True if ALL current items in a category are marked unavailable (either overridden or base)
  const isCategoryHidden = (category: Category) => {
    const items = category.items || [];
    if (items.length === 0) return false;
    return items.every(item => {
      const change = changes.get(item.id);
      const avail = change?.is_available !== undefined ? change.is_available : item.is_available;
      return !avail;
    });
  };

  // Open inline price edit dialog
  const openEditPrice = (item: MenuItem) => {
    const currentPrice = changes.get(item.id)?.price ?? item.price;
    setEditPriceValue(String(currentPrice));
    setEditPriceDialog({ open: true, item });
  };

  const handleConfirmEditPrice = () => {
    if (!editPriceDialog.item) return;
    const num = parseFloat(editPriceValue);
    if (isNaN(num) || num < 0) { toast.error('Enter a valid price'); return; }
    setChanges(prev => {
      const newChanges = new Map(prev);
      const existing = newChanges.get(editPriceDialog.item!.id) || {};
      newChanges.set(editPriceDialog.item!.id, { ...existing, price: num });
      return newChanges;
    });
    setEditPriceDialog({ open: false, item: null });
  };

  const handleResetItem = (itemId: number) => {
    setChanges(prev => {
      const newChanges = new Map(prev);
      newChanges.delete(itemId);
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
        
        // Update local state instead of refetching
        setMenu(prevMenu => {
          if (!prevMenu) return prevMenu;
          return {
            ...prevMenu,
            categories: prevMenu.categories.map(cat => ({
              ...cat,
              items: (cat.items || []).map(item => {
                const change = changes.get(item.id);
                if (change) {
                  return {
                    ...item,
                    ...(change.price !== undefined && { price: change.price }),
                    ...(change.is_available !== undefined && { is_available: change.is_available })
                  };
                }
                return item;
              })
            }))
          };
        });
        
        setChanges(new Map());
      }
    } catch (err: any) {
      console.error('Failed to save changes:', err);
      toast.error(err.response?.data?.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const openVariantsDialog = useCallback((item: MenuItem) => {
    setEditingItemId(item.id);
    setEditingVariants((item.variations as ItemVariant[]) || []);
    setVariantsDialogOpen(true);
  }, []);

  const handleVariantsChange = useCallback((newVariants: ItemVariant[]) => {
    setEditingVariants(newVariants);
  }, []);

  const openCustomizationsDialog = useCallback((item: MenuItem) => {
    setEditingItemId(item.id);
    setEditingCustomizations((item.customizations as CustomizationSection[]) || []);
    setCustomizationsDialogOpen(true);
  }, []);

  const handleCustomizationsChange = useCallback((newSections: CustomizationSection[]) => {
    setEditingCustomizations(newSections);
  }, []);

  const handleSaveVariants = async () => {
    if (!menu || editingItemId === null) return;
    try {
      setSavingVariants(true);
      const response = await api.put(`/menus/${menu.id}/items/${editingItemId}`, { variations: editingVariants });
      if (response.data.success) {
        toast.success('Size variants updated');
        
        // Update local state instead of refetching
        setMenu(prevMenu => {
          if (!prevMenu) return prevMenu;
          return {
            ...prevMenu,
            categories: prevMenu.categories.map(cat => ({
              ...cat,
              items: (cat.items || []).map(item => 
                item.id === editingItemId 
                  ? { ...item, variations: editingVariants }
                  : item
              )
            }))
          };
        });
        
        setVariantsDialogOpen(false);
        setEditingItemId(null);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update variants');
    } finally {
      setSavingVariants(false);
    }
  };

  const handleSaveCustomizations = async () => {
    if (!menu || editingItemId === null) return;
    try {
      setSavingVariants(true);
      const response = await api.put(`/menus/${menu.id}/items/${editingItemId}`, { customizations: editingCustomizations });
      if (response.data.success) {
        toast.success('Customizations updated');
        
        // Update local state instead of refetching
        setMenu(prevMenu => {
          if (!prevMenu) return prevMenu;
          return {
            ...prevMenu,
            categories: prevMenu.categories.map(cat => ({
              ...cat,
              items: (cat.items || []).map(item => 
                item.id === editingItemId 
                  ? { ...item, customizations: editingCustomizations }
                  : item
              )
            }))
          };
        });
        
        setCustomizationsDialogOpen(false);
        setEditingItemId(null);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update customizations');
    } finally {
      setSavingVariants(false);
    }
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

  const handleAddItem = async (data: any, image?: File) => {
    if (!menu) return;

    try {
      setAddItemLoading(true);
      const formData = new FormData();
      
      // Add all fields to FormData
      Object.keys(data).forEach(key => {
        if (data[key] !== undefined && data[key] !== null) {
          if (typeof data[key] === 'object') {
            formData.append(key, JSON.stringify(data[key]));
          } else {
            formData.append(key, data[key]);
          }
        }
      });

      if (image) {
        formData.append('image', image);
      }

      const response = await api.post(
        `/menus/${menu.id}/items`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );

      if (response.data.success) {
        toast.success('Item added successfully');
        setIsItemFormOpen(false);
        fetchMenu();
      }
    } catch (err: any) {
      console.error('Failed to add item:', err);
      toast.error(err.response?.data?.message || 'Failed to add item');
    } finally {
      setAddItemLoading(false);
    }
  };

  const filteredCategories = menu?.categories?.filter(cat =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (cat.items || []).some(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
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
        <div className="flex items-center gap-2 flex-wrap">
          {changes.size > 0 && (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              {changes.size} unsaved change{changes.size !== 1 ? 's' : ''}
            </Badge>
          )}
          <Button
            variant="outline"
            onClick={() => router.push(`/${franchiseSlug}/dashboard/tables-qr`)}
          >
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
            <strong>Branch Menu Customization:</strong> Hide/show categories and items, override prices, or manage sizes and customizations for this location only. Changes don't affect the master menu.
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <Input
        placeholder="Search categories or items..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="max-w-md"
      />

      {/* Categories & Items */}
      <div className="space-y-3">
        {filteredCategories.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-neutral-500">
              {searchQuery ? 'No results found.' : 'No categories yet.'}
            </CardContent>
          </Card>
        )}

        {filteredCategories.map((category) => {
          const isExpanded = expandedCategories.has(category.id);
          const catHidden = isCategoryHidden(category);
          const itemCount = (category.items || []).length;
          const hiddenCount = (category.items || []).filter(item => {
            const change = changes.get(item.id);
            const avail = change?.is_available !== undefined ? change.is_available : item.is_available;
            return !avail;
          }).length;

          return (
            <Card
              key={category.id}
              className={`transition-all ${catHidden ? 'opacity-60 border-neutral-200' : ''}`}
            >
              {/* Category header */}
              <CardHeader className="py-3 px-4">
                <div className="flex items-center gap-3">
                  {/* Expand/Collapse */}
                  <button
                    onClick={() => toggleCategory(category.id)}
                    className="p-1 rounded hover:bg-neutral-100 text-neutral-500"
                  >
                    {isExpanded
                      ? <ChevronDown className="h-4 w-4" />
                      : <ChevronRight className="h-4 w-4" />}
                  </button>

                  {/* Category name + badges */}
                  <div className="flex-1 flex items-center gap-2 flex-wrap cursor-pointer" onClick={() => toggleCategory(category.id)}>
                    <span className="font-semibold text-base">{category.name}</span>
                    <Badge variant="secondary" className="text-xs">{itemCount} items</Badge>
                    {catHidden && (
                      <Badge variant="outline" className="text-xs text-neutral-500 border-neutral-300">
                        <EyeOff className="h-3 w-3 mr-1" /> Hidden from customers
                      </Badge>
                    )}
                    {!catHidden && hiddenCount > 0 && (
                      <Badge variant="outline" className="text-xs text-amber-600 border-amber-300 bg-amber-50">
                        {hiddenCount} hidden item{hiddenCount !== 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>

                  {/* Category actions */}
                  <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleHideCategory(category, !catHidden)}
                      className={catHidden
                        ? 'text-emerald-600 border-emerald-300 hover:bg-emerald-50'
                        : 'text-neutral-600 hover:bg-neutral-100'}
                    >
                      {catHidden
                        ? <><Eye className="h-3.5 w-3.5 mr-1.5" />Show Category</>
                        : <><EyeOff className="h-3.5 w-3.5 mr-1.5" />Hide Category</>}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {/* Items list - collapsible */}
              {isExpanded && (
                <CardContent className="pt-0 px-4 pb-4">
                  {itemCount === 0 ? (
                    <p className="text-sm text-neutral-400 py-3 text-center">No items in this category.</p>
                  ) : (
                    <div className="divide-y border rounded-lg overflow-hidden">
                      {(category.items || []).map((item) => {
                        const currentPrice = getItemPrice(item);
                        const currentAvailability = getItemAvailability(item);
                        const isChanged = hasChanges(item.id);
                        const priceChanged = changes.get(item.id)?.price !== undefined;

                        return (
                          <div
                            key={item.id}
                            className={`flex items-center justify-between px-4 py-3 transition-colors ${
                              !currentAvailability
                                ? 'bg-neutral-50 opacity-70'
                                : isChanged
                                ? 'bg-amber-50'
                                : 'bg-white'
                            }`}
                          >
                            {/* Left: name + badges */}
                            <div className="flex-1 min-w-0 mr-4">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`font-medium ${!currentAvailability ? 'line-through text-neutral-400' : ''}`}>
                                  {item.name}
                                </span>
                                {!currentAvailability && (
                                  <Badge variant="outline" className="text-xs text-neutral-500 border-neutral-300">
                                    <EyeOff className="h-3 w-3 mr-1" />Hidden
                                  </Badge>
                                )}
                                {item.has_override && (
                                  <Badge variant="secondary" className="text-xs">
                                    <Package className="h-3 w-3 mr-1" />Overridden
                                  </Badge>
                                )}
                                {isChanged && (
                                  <Badge variant="outline" className="text-xs bg-amber-100 border-amber-300 text-amber-700">
                                    <Clock className="h-3 w-3 mr-1" />Unsaved
                                  </Badge>
                                )}
                              </div>
                              {item.description && (
                                <p className="text-xs text-neutral-500 mt-0.5 truncate">{item.description}</p>
                              )}
                            </div>

                            {/* Right: price + actions */}
                            <div className="flex items-center gap-3 flex-shrink-0">
                              {/* Price display */}
                              <div className="text-right">
                                <div className="font-semibold text-sm">
                                  {Number(currentPrice).toFixed(2)}
                                </div>
                                {priceChanged && item.original_price !== undefined && (
                                  <div className="text-xs text-neutral-400 line-through">
                                    {Number(item.original_price).toFixed(2)}
                                  </div>
                                )}
                              </div>

                              {/* Availability quick toggle */}
                              <Switch
                                checked={currentAvailability}
                                onCheckedChange={(checked) => handleAvailabilityChange(item.id, checked)}
                                title={currentAvailability ? 'Hide this item' : 'Show this item'}
                              />

                              {/* Actions dropdown */}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {currentAvailability ? (
                                    <DropdownMenuItem onClick={() => handleAvailabilityChange(item.id, false)}>
                                      <EyeOff className="h-4 w-4 mr-2 text-neutral-500" />
                                      Hide from customers
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem onClick={() => handleAvailabilityChange(item.id, true)}>
                                      <Eye className="h-4 w-4 mr-2 text-emerald-600" />
                                      Show to customers
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem onClick={() => openEditPrice(item)}>
                                    <DollarSign className="h-4 w-4 mr-2 text-blue-600" />
                                    Edit price override
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => openVariantsDialog(item)}>
                                    <Edit3 className="h-4 w-4 mr-2 text-indigo-600" />
                                    Edit sizes / variants
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => openCustomizationsDialog(item)}>
                                    <Plus className="h-4 w-4 mr-2 text-purple-600" />
                                    Edit customizations
                                  </DropdownMenuItem>
                                  {isChanged && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={() => handleResetItem(item.id)}
                                        className="text-red-600"
                                      >
                                        <RefreshCw className="h-4 w-4 mr-2" />
                                        Reset to master values
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Edit Price Dialog */}
      <Dialog open={editPriceDialog.open} onOpenChange={(open) => setEditPriceDialog({ open, item: editPriceDialog.item })}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Price Override</DialogTitle>
            <DialogDescription>
              Set a custom price for <strong>{editPriceDialog.item?.name}</strong> at {menu.location.name}.
              This won't affect other branches.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <Label>Override Price</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
              <Input
                type="number"
                step="0.01"
                min="0"
                className="pl-9"
                value={editPriceValue}
                onChange={(e) => setEditPriceValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleConfirmEditPrice()}
                autoFocus
              />
            </div>
            {editPriceDialog.item?.original_price !== undefined && (
              <p className="text-xs text-neutral-500">
                Master price: {Number(editPriceDialog.item.original_price).toFixed(2)}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPriceDialog({ open: false, item: null })}>
              Cancel
            </Button>
            <Button onClick={handleConfirmEditPrice}>
              <Check className="h-4 w-4 mr-2" />
              Apply Override
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Item Dialog */}
      {menu && (
        <MenuItemForm
          menuId={menu.id}
          item={null}
          categories={menu.categories || []}
          isOpen={isItemFormOpen}
          onClose={() => setIsItemFormOpen(false)}
          onSubmit={handleAddItem}
          onCreateCategory={() => {}}
          isLoading={addItemLoading}
        />
      )}

      {/* Variants Dialog */}
      <Dialog open={variantsDialogOpen} onOpenChange={setVariantsDialogOpen}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto" key={`variants-${editingItemId}`}>
          <DialogHeader>
            <DialogTitle>Size Variants</DialogTitle>
            <DialogDescription>
              Manage size options with different prices.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <ItemVariantsForm
              variants={editingVariants}
              onChange={handleVariantsChange}
              currency="LKR"
              basePrice={0}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVariantsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveVariants} disabled={savingVariants}>
              {savingVariants ? 'Saving...' : 'Save Variants'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Customizations Dialog */}
      <Dialog open={customizationsDialogOpen} onOpenChange={setCustomizationsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" key={`customizations-${editingItemId}`}>
          <DialogHeader>
            <DialogTitle>Item Customizations</DialogTitle>
            <DialogDescription>
              Define customization sections (e.g. base, sides, extras).
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <ItemCustomizationsForm
              sections={editingCustomizations}
              onChange={handleCustomizationsChange}
              currency="LKR"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCustomizationsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveCustomizations} disabled={savingVariants}>
              {savingVariants ? 'Saving...' : 'Save Customizations'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
