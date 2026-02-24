'use client';

import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Loader2, X, Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { ItemVariantsForm, ItemVariant } from '@/components/menu/item-variants-form';
import { ItemCustomizationsForm } from '@/components/menu/item-customizations-form';
import { CustomizationSection } from '@/lib/types';

interface MenuItem {
  id: number;
  name: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  image_url: string | null;
  is_available: boolean;
  is_featured: boolean;
  sort_order: number;
  allergens: string[] | null;
  dietary_info: string[] | null;
  preparation_time: number | null;
  is_spicy: boolean;
  spice_level: number | null;
  category_id: number;
  variations?: ItemVariant[] | null;
  customizations?: CustomizationSection[] | null;
}

interface ItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: MenuItem | null;
  categoryId: number | null;
  franchiseId: number | null;
  menuId: number;
  currency: string;
  onSuccess: (updatedItem: MenuItem) => void;
}

const ALLERGENS = [
  'Gluten', 'Dairy', 'Eggs', 'Fish', 'Shellfish', 'Tree Nuts', 
  'Peanuts', 'Soy', 'Sesame', 'Celery', 'Mustard', 'Sulphites'
];

const DIETARY_OPTIONS = [
  'Vegetarian', 'Vegan', 'Halal', 'Kosher', 'Gluten-Free', 
  'Dairy-Free', 'Keto', 'Paleo', 'Low-Carb', 'Organic'
];

export function ItemDialog({ 
  open, 
  onOpenChange, 
  item, 
  categoryId,
  franchiseId, 
  menuId, 
  currency,
  onSuccess 
}: ItemDialogProps) {
  const [loading, setLoading] = useState(false);
  const [variants, setVariants] = useState<ItemVariant[]>([]);
  const [customizations, setCustomizations] = useState<CustomizationSection[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    compare_at_price: '',
    image_url: '',
    is_available: true,
    is_featured: false,
    allergens: [] as string[],
    dietary_info: [] as string[],
    preparation_time: '',
    is_spicy: false,
    spice_level: '',
    calories: '',
    sku: '',
  });

  const handleCustomizationsChange = useCallback((newSections: CustomizationSection[]) => {
    setCustomizations(newSections);
  }, []);

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || '',
        description: item.description || '',
        price: item.price?.toString() || '',
        compare_at_price: item.compare_at_price?.toString() || '',
        image_url: item.image_url || '',
        is_available: item.is_available ?? true,
        is_featured: item.is_featured ?? false,
        allergens: item.allergens || [],
        dietary_info: item.dietary_info || [],
        preparation_time: item.preparation_time?.toString() || '',
        is_spicy: item.is_spicy ?? false,
        spice_level: item.spice_level?.toString() || '',
        calories: '',
        sku: '',
      });
      // Load existing variants
      setVariants(item.variations || []);
      setCustomizations((item.customizations as CustomizationSection[]) || []);
    } else {
      setFormData({
        name: '',
        description: '',
        price: '',
        compare_at_price: '',
        image_url: '',
        is_available: true,
        is_featured: false,
        allergens: [],
        dietary_info: [],
        preparation_time: '',
        is_spicy: false,
        spice_level: '',
        calories: '',
        sku: '',
      });
      setVariants([]);
      setCustomizations([]);
    }
  }, [item, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!franchiseId || !categoryId) {
      toast.error('Missing required information');
      return;
    }
    
    if (!formData.name.trim()) {
      toast.error('Please enter an item name');
      return;
    }
    
    if (formData.price === '' || formData.price === null || formData.price === undefined || parseFloat(formData.price) < 0) {
      toast.error('Please enter a valid price (0 or more)');
      return;
    }

    try {
      setLoading(true);
      
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        compare_at_price: formData.compare_at_price ? parseFloat(formData.compare_at_price) : null,
        preparation_time: formData.preparation_time ? parseInt(formData.preparation_time) : null,
        spice_level: formData.spice_level ? parseInt(formData.spice_level) : null,
        calories: formData.calories ? parseInt(formData.calories) : null,
        category_id: categoryId,
        variations: variants.length > 0 ? variants.map(v => ({
          name: v.name,
          price: v.price,
          compare_at_price: v.compare_at_price || null,
          is_default: v.is_default || false,
        })) : null,
        customizations: customizations.length > 0 ? customizations : null,
      };
      
      const endpoint = item 
        ? `/franchises/${franchiseId}/master-menus/${menuId}/items/${item.id}`
        : `/franchises/${franchiseId}/master-menus/${menuId}/categories/${categoryId}/items`;
      
      const method = item ? 'put' : 'post';
      const response = await api[method](endpoint, payload);
      
      if (response.data.success) {
        toast.success(item ? 'Item updated successfully' : 'Item created successfully');
        onSuccess(response.data.data);
        onOpenChange(false);
      }
    } catch (err: any) {
      console.error('Failed to save item:', err);
      toast.error(err.response?.data?.message || 'Failed to save item');
    } finally {
      setLoading(false);
    }
  };

  const toggleAllergen = (allergen: string) => {
    setFormData(prev => ({
      ...prev,
      allergens: prev.allergens.includes(allergen)
        ? prev.allergens.filter(a => a !== allergen)
        : [...prev.allergens, allergen]
    }));
  };

  const toggleDietaryInfo = (info: string) => {
    setFormData(prev => ({
      ...prev,
      dietary_info: prev.dietary_info.includes(info)
        ? prev.dietary_info.filter(d => d !== info)
        : [...prev.dietary_info, info]
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{item ? 'Edit Item' : 'Add New Item'}</DialogTitle>
            <DialogDescription>
              {item ? 'Update the menu item details.' : 'Add a new item to this category.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="name">Item Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Grilled Chicken Burger"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={loading}
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the item..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  disabled={loading}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price ({currency}) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="compare_at_price">Compare at Price (optional)</Label>
                <Input
                  id="compare_at_price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Original price for strikethrough"
                  value={formData.compare_at_price}
                  onChange={(e) => setFormData({ ...formData, compare_at_price: e.target.value })}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Image */}
            <div className="space-y-2">
              <Label htmlFor="image_url">Image URL</Label>
              <div className="flex gap-2">
                <Input
                  id="image_url"
                  placeholder="https://..."
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  disabled={loading}
                  className="flex-1"
                />
                {formData.image_url && (
                  <div className="h-10 w-10 rounded overflow-hidden flex-shrink-0 border">
                    <img 
                      src={formData.image_url} 
                      alt="Preview" 
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '';
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Size Variants */}
            <ItemVariantsForm
              variants={variants}
              onChange={setVariants}
              currency={currency}
              basePrice={formData.price ? parseFloat(formData.price) : 0}
            />

            {/* Customization Sections */}
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-semibold">Item Customizations</h4>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Add optional or required choices (e.g. spice level, base, sides, extras). Each section can be required or optional.
                </p>
              </div>
              <ItemCustomizationsForm
                sections={customizations}
                onChange={handleCustomizationsChange}
                currency={currency}
              />
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label>Available</Label>
                  <p className="text-xs text-neutral-500">Can be ordered</p>
                </div>
                <Switch
                  checked={formData.is_available}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_available: checked })}
                  disabled={loading}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label>Featured</Label>
                  <p className="text-xs text-neutral-500">Highlight item</p>
                </div>
                <Switch
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                  disabled={loading}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label>Spicy 🌶️</Label>
                  <p className="text-xs text-neutral-500">Mark as spicy</p>
                </div>
                <Switch
                  checked={formData.is_spicy}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_spicy: checked })}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Additional Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="preparation_time">Prep Time (mins)</Label>
                <Input
                  id="preparation_time"
                  type="number"
                  min="0"
                  placeholder="e.g., 15"
                  value={formData.preparation_time}
                  onChange={(e) => setFormData({ ...formData, preparation_time: e.target.value })}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="calories">Calories</Label>
                <Input
                  id="calories"
                  type="number"
                  min="0"
                  placeholder="e.g., 450"
                  value={formData.calories}
                  onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  placeholder="e.g., BRG-001"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Allergens */}
            <div className="space-y-2">
              <Label>Allergens</Label>
              <div className="flex flex-wrap gap-2">
                {ALLERGENS.map((allergen) => (
                  <Badge
                    key={allergen}
                    variant={formData.allergens.includes(allergen) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleAllergen(allergen)}
                  >
                    {allergen}
                    {formData.allergens.includes(allergen) && (
                      <X className="h-3 w-3 ml-1" />
                    )}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Dietary Info */}
            <div className="space-y-2">
              <Label>Dietary Information</Label>
              <div className="flex flex-wrap gap-2">
                {DIETARY_OPTIONS.map((info) => (
                  <Badge
                    key={info}
                    variant={formData.dietary_info.includes(info) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleDietaryInfo(info)}
                  >
                    {info}
                    {formData.dietary_info.includes(info) && (
                      <X className="h-3 w-3 ml-1" />
                    )}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {item ? 'Update Item' : 'Add Item'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
