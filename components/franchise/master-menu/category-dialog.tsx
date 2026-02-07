'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Loader2, ImageIcon } from 'lucide-react';
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
  onSuccess: () => void;
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
        onSuccess();
        onOpenChange(false);
      }
    } catch (err: any) {
      console.error('Failed to save category:', err);
      toast.error(err.response?.data?.message || 'Failed to save category');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{category ? 'Edit Category' : 'Create Category'}</DialogTitle>
            <DialogDescription>
              {category ? 'Update the category details.' : 'Create a new category to organize menu items.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
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
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
              <p className="text-xs text-neutral-500">
                Enter a URL for the category image
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="icon">Icon (optional)</Label>
              <Input
                id="icon"
                placeholder="e.g., 🍔 or icon class name"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                disabled={loading}
              />
            </div>
            
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
              {category ? 'Update Category' : 'Create Category'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
