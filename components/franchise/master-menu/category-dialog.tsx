'use client';

import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Loader2, Search, X } from 'lucide-react';
import { CategoryIcon, CATEGORY_ICONS } from '@/components/menu/CategoryIcon';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
}

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category | null;
  franchiseId: number | null;
  menuId: number;
  onSuccess: (updatedCategory: Category) => void;
}

export function CategoryDialog({ 
  open, 
  onOpenChange, 
  category, 
  franchiseId, 
  menuId, 
  onSuccess 
}: CategoryDialogProps) {
  const [loading, setLoading] = useState(false);
  const [iconSearch, setIconSearch] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image_url: '',
    icon: '',
    background_color: '',
    text_color: '',
    is_active: true,
  });

  useEffect(() => {
    if (open) setIconSearch('');
    if (category) {
      setFormData({
        name: category.name || '',
        description: category.description || '',
        image_url: category.image_url || '',
        icon: category.icon || '',
        background_color: '',
        text_color: '',
        is_active: category.is_active,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        image_url: '',
        icon: '',
        background_color: '',
        text_color: '',
        is_active: true,
      });
    }
  }, [category, open]);

  const filteredIcons = useMemo(() => {
    if (!iconSearch.trim()) return [];
    const q = iconSearch.toLowerCase();
    return CATEGORY_ICONS.filter(({ name, label }) =>
      label.toLowerCase().includes(q) || name.toLowerCase().includes(q)
    );
  }, [iconSearch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!franchiseId) {
      toast.error('Franchise ID not found');
      return;
    }
    
    if (!formData.name.trim()) {
      toast.error('Please enter a category name');
      return;
    }

    try {
      setLoading(true);
      
      const endpoint = category 
        ? `/franchises/${franchiseId}/master-menus/${menuId}/categories/${category.id}`
        : `/franchises/${franchiseId}/master-menus/${menuId}/categories`;
      
      const method = category ? 'put' : 'post';
      const response = await api[method](endpoint, formData);
      
      if (response.data.success) {
        toast.success(category ? 'Category updated successfully' : 'Category created successfully');
        onSuccess(response.data.data);
        onOpenChange(false);
      }
    } catch (err: any) {
      console.error('Failed to save category:', err);
      toast.error(err.response?.data?.message || 'Failed to save category');
    } finally {
      setLoading(false);
    }
  };

  const selectedIcon = CATEGORY_ICONS.find(i => i.name === formData.icon);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-md max-h-[90svh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-2 flex-shrink-0">
          <DialogTitle>{category ? 'Edit Category' : 'Create Category'}</DialogTitle>
          <DialogDescription>
            {category ? 'Update the category details.' : 'Create a new category to organize menu items.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Category Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Appetizers, Main Course, Beverages"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={loading}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of this category..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                disabled={loading}
                rows={2}
              />
            </div>

            {/* Image URL */}
            <div className="space-y-2">
              <Label htmlFor="image_url">Image URL</Label>
              <div className="flex gap-2">
                <Input
                  id="image_url"
                  placeholder="https://..."
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  disabled={loading}
                />
                {formData.image_url && (
                  <div className="h-10 w-10 rounded overflow-hidden flex-shrink-0">
                    <img
                      src={formData.image_url}
                      alt="Preview"
                      className="h-full w-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                )}
              </div>
              <p className="text-xs text-neutral-500">Enter a URL for the category image</p>
            </div>

            {/* Icon picker */}
            <div className="space-y-2">
              <Label>Icon (optional)</Label>

              {/* Currently selected */}
              {formData.icon && (
                <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 border border-primary/30 rounded-lg">
                  <CategoryIcon icon={formData.icon} className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-sm font-medium text-primary flex-1">{selectedIcon?.label ?? formData.icon}</span>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, icon: '' })}
                    className="text-primary/60 hover:text-primary transition-colors"
                    disabled={loading}
                    aria-label="Remove icon"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
                <Input
                  placeholder="Search icons — e.g. soup, chicken, coffee…"
                  value={iconSearch}
                  onChange={(e) => setIconSearch(e.target.value)}
                  className="pl-9"
                  disabled={loading}
                />
              </div>

              {/* Results grid — only shown while searching */}
              {iconSearch.trim() && (
                filteredIcons.length > 0 ? (
                  <div className="grid grid-cols-5 gap-1 p-2 border rounded-lg bg-neutral-50">
                    {filteredIcons.map(({ name, label }) => (
                      <button
                        key={name}
                        type="button"
                        title={label}
                        disabled={loading}
                        onClick={() => {
                          setFormData({ ...formData, icon: name });
                          setIconSearch('');
                        }}
                        className={`flex flex-col items-center justify-center rounded p-2 gap-1 transition-colors ${
                          formData.icon === name
                            ? 'bg-primary text-white'
                            : 'hover:bg-neutral-200 text-neutral-600'
                        }`}
                      >
                        <CategoryIcon icon={name} className="h-5 w-5" />
                        <span className="text-[10px] leading-tight text-center">{label}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-neutral-400 text-center py-3">No icons found for &ldquo;{iconSearch}&rdquo;</p>
                )
              )}

              {!iconSearch.trim() && !formData.icon && (
                <p className="text-xs text-neutral-400">Type above to search — icons are SVG, identical on all devices</p>
              )}
            </div>

            {/* Active toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="is_active">Active</Label>
                <p className="text-xs text-neutral-500">Show this category in the menu</p>
              </div>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                disabled={loading}
              />
            </div>

          </div>

          {/* Footer — always visible */}
          <div className="flex-shrink-0 px-6 py-4 border-t flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {category ? 'Update Category' : 'Create Category'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}