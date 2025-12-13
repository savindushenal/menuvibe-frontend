'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  ArrowLeft,
  Edit2,
  Trash2,
  GripVertical,
  ChevronRight,
  ChevronDown,
  Save,
  X,
  ImageIcon,
  DollarSign,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/loading/spinner';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  items: Item[];
}

interface Item {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  image_url: string | null;
  is_available: boolean;
  is_featured: boolean;
  sort_order: number;
  allergens: string[] | null;
  dietary_info: string[] | null;
  is_spicy: boolean;
  spice_level: number | null;
  variations: ItemVariation[] | null;
}

interface ItemVariation {
  name: string;
  price: number;
  is_available?: boolean;
}

interface Template {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  currency: string;
  is_active: boolean;
  categories: Category[];
}

// Sortable Category Component
function SortableCategory({
  category,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
  onAddItem,
  onEditItem,
  onDeleteItem,
  currency,
}: {
  category: Category;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddItem: () => void;
  onEditItem: (item: Item) => void;
  onDeleteItem: (item: Item) => void;
  currency: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: category.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getCurrencySymbol = (code: string) => {
    const symbols: Record<string, string> = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      JPY: '¥',
      INR: '₹',
      AUD: 'A$',
      CAD: 'C$',
      AED: 'د.إ',
    };
    return symbols[code] || code;
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className={`mb-3 ${isDragging ? 'shadow-lg' : ''}`}>
        <CardHeader className="py-3 px-4">
          <div className="flex items-center gap-3">
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 hover:bg-neutral-100 rounded"
            >
              <GripVertical className="w-4 h-4 text-neutral-400" />
            </button>
            <button
              onClick={onToggle}
              className="flex items-center gap-2 flex-1 text-left"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-neutral-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-neutral-500" />
              )}
              <span className="font-medium">{category.name}</span>
              <Badge variant="secondary" className="ml-2">
                {category.items?.length || 0} items
              </Badge>
              {!category.is_active && (
                <Badge variant="outline" className="text-neutral-500">
                  Inactive
                </Badge>
              )}
            </button>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={onAddItem}>
                <Plus className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={onEdit}>
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={onDelete}>
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <AnimatePresence>
          {isExpanded && category.items && category.items.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <CardContent className="pt-0 pb-3 px-4">
                <div className="border-t pt-3 space-y-2">
                  {category.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-50 group"
                    >
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-neutral-100 flex items-center justify-center">
                          <ImageIcon className="w-5 h-5 text-neutral-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{item.name}</span>
                          {item.is_featured && (
                            <Badge className="bg-amber-100 text-amber-700 text-xs">Featured</Badge>
                          )}
                          {!item.is_available && (
                            <Badge variant="secondary" className="text-xs">
                              Unavailable
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-neutral-500 truncate">
                          {item.description || 'No description'}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-emerald-600">
                          {getCurrencySymbol(currency)}
                          {Number(item.price || 0).toFixed(2)}
                        </div>
                        {item.compare_at_price && Number(item.compare_at_price) > Number(item.price) && (
                          <div className="text-sm text-neutral-400 line-through">
                            {getCurrencySymbol(currency)}
                            {Number(item.compare_at_price).toFixed(2)}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEditItem(item)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDeleteItem(item)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </div>
  );
}

function TemplateEditorContent() {
  const params = useParams();
  const templateId = parseInt(params.templateId as string);
  const router = useRouter();
  const { toast } = useToast();

  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());

  // Category dialogs
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    icon: '',
    is_active: true,
  });

  // Item dialogs
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [deletingItem, setDeletingItem] = useState<Item | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [itemForm, setItemForm] = useState({
    name: '',
    description: '',
    price: '',
    compare_at_price: '',
    image_url: '',
    is_available: true,
    is_featured: false,
    is_spicy: false,
    spice_level: 0,
    variations: [] as { name: string; price: string }[],
  });

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadTemplate();
  }, [templateId]);

  const loadTemplate = async () => {
    try {
      setLoading(true);
      console.log('Loading template with ID:', templateId);
      const response = await apiClient.getMenuTemplate(templateId);
      console.log('API Response:', response);
      if (response.success && response.data) {
        // API returns template directly in data, not data.template
        const templateData = response.data.template || response.data;
        console.log('Template data:', templateData);
        // Ensure categories is always an array
        if (!templateData.categories) {
          templateData.categories = [];
        }
        // Ensure each category has items array
        templateData.categories = templateData.categories.map((cat: Category) => ({
          ...cat,
          items: cat.items || []
        }));
        setTemplate(templateData);
        // Expand first category by default
        if (templateData.categories.length > 0) {
          setExpandedCategories(new Set([templateData.categories[0].id]));
        }
      } else {
        toast({
          title: 'Error',
          description: 'Template not found',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Load template error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load template',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (categoryId: number) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  // Category handlers
  const openCategoryDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({
        name: category.name,
        description: category.description || '',
        icon: category.icon || '',
        is_active: category.is_active,
      });
    } else {
      setEditingCategory(null);
      setCategoryForm({
        name: '',
        description: '',
        icon: '',
        is_active: true,
      });
    }
    setIsCategoryDialogOpen(true);
  };

  const handleSaveCategory = async () => {
    try {
      if (editingCategory) {
        await apiClient.updateTemplateCategory(templateId, editingCategory.id, categoryForm);
        toast({ title: 'Success', description: 'Category updated' });
      } else {
        await apiClient.createTemplateCategory(templateId, categoryForm);
        toast({ title: 'Success', description: 'Category created' });
      }
      setIsCategoryDialogOpen(false);
      loadTemplate();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save category',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteCategory = async () => {
    if (!deletingCategory) return;
    try {
      await apiClient.deleteTemplateCategory(templateId, deletingCategory.id);
      toast({ title: 'Success', description: 'Category deleted' });
      setDeletingCategory(null);
      loadTemplate();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete category',
        variant: 'destructive',
      });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !template) return;

    const oldIndex = template.categories.findIndex((c) => c.id === active.id);
    const newIndex = template.categories.findIndex((c) => c.id === over.id);

    const newCategories = arrayMove(template.categories, oldIndex, newIndex);
    setTemplate({ ...template, categories: newCategories });

    // Save new order to backend
    try {
      await apiClient.reorderTemplateCategories(templateId, {
        categories: newCategories.map((c, i) => ({ id: c.id, sort_order: i })),
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to save category order',
        variant: 'destructive',
      });
      loadTemplate();
    }
  };

  // Item handlers
  const openItemDialog = (categoryId: number, item?: Item) => {
    setSelectedCategoryId(categoryId);
    if (item) {
      setEditingItem(item);
      setItemForm({
        name: item.name,
        description: item.description || '',
        price: String(item.price || ''),
        compare_at_price: item.compare_at_price ? String(item.compare_at_price) : '',
        image_url: item.image_url || '',
        is_available: item.is_available,
        is_featured: item.is_featured,
        is_spicy: item.is_spicy,
        spice_level: item.spice_level || 0,
        variations: (item.variations || []).map(v => ({ name: v.name, price: String(v.price || '') })),
      });
    } else {
      setEditingItem(null);
      setItemForm({
        name: '',
        description: '',
        price: '',
        compare_at_price: '',
        image_url: '',
        is_available: true,
        is_featured: false,
        is_spicy: false,
        spice_level: 0,
        variations: [],
      });
    }
    setIsItemDialogOpen(true);
  };

  const handleSaveItem = async () => {
    if (!selectedCategoryId) return;
    try {
      const variations = itemForm.variations
        .filter(v => v.name.trim() && v.price)
        .map(v => ({ name: v.name.trim(), price: parseFloat(v.price) || 0 }));
      
      const data = {
        name: itemForm.name,
        description: itemForm.description || undefined,
        price: parseFloat(itemForm.price) || 0,
        compare_at_price: itemForm.compare_at_price ? parseFloat(itemForm.compare_at_price) : undefined,
        image_url: itemForm.image_url || undefined,
        is_available: itemForm.is_available,
        is_featured: itemForm.is_featured,
        is_spicy: itemForm.is_spicy,
        spice_level: itemForm.spice_level > 0 ? itemForm.spice_level : undefined,
        variations: variations.length > 0 ? variations : undefined,
      };

      console.log('Saving item data:', data);

      if (editingItem) {
        const response = await apiClient.updateTemplateItem(templateId, editingItem.id, data);
        console.log('Update response:', response);
        toast({ title: 'Success', description: 'Item updated' });
      } else {
        const response = await apiClient.createTemplateItem(templateId, selectedCategoryId, data);
        console.log('Create response:', response);
        toast({ title: 'Success', description: 'Item created' });
      }
      setIsItemDialogOpen(false);
      loadTemplate();
    } catch (error: any) {
      console.error('Save item error:', error);
      const errorMsg = error.errors 
        ? Object.values(error.errors).flat().join(', ')
        : error.message || 'Failed to save item';
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteItem = async () => {
    if (!deletingItem) return;
    try {
      await apiClient.deleteTemplateItem(templateId, deletingItem.id);
      toast({ title: 'Success', description: 'Item deleted' });
      setDeletingItem(null);
      loadTemplate();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete item',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-lg font-medium">Template not found</h2>
        <Button asChild className="mt-4">
          <Link href="/dashboard/templates">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Templates
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/templates">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-neutral-900">{template.name}</h1>
          <p className="text-neutral-500">
            {template.description || 'Edit categories and items'}
          </p>
        </div>
        <Badge
          variant={template.is_active ? 'default' : 'secondary'}
          className={template.is_active ? 'bg-emerald-100 text-emerald-700' : ''}
        >
          {template.is_active ? 'Active' : 'Inactive'}
        </Badge>
      </div>

      {/* Add Category Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Categories & Items</h2>
        <Button onClick={() => openCategoryDialog()} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>

      {/* Categories List */}
      {!template.categories || template.categories.length === 0 ? (
        <Card className="p-12 text-center">
          <h3 className="text-lg font-medium text-neutral-900 mb-2">No Categories Yet</h3>
          <p className="text-neutral-500 mb-6">
            Start by adding your first category (e.g., Appetizers, Main Course, Desserts)
          </p>
          <Button onClick={() => openCategoryDialog()} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Category
          </Button>
        </Card>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={template.categories.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            {template.categories.map((category) => (
              <SortableCategory
                key={category.id}
                category={category}
                isExpanded={expandedCategories.has(category.id)}
                onToggle={() => toggleCategory(category.id)}
                onEdit={() => openCategoryDialog(category)}
                onDelete={() => setDeletingCategory(category)}
                onAddItem={() => openItemDialog(category.id)}
                onEditItem={(item) => openItemDialog(category.id, item)}
                onDeleteItem={(item) => setDeletingItem(item)}
                currency={template.currency}
              />
            ))}
          </SortableContext>
        </DndContext>
      )}

      {/* Category Dialog */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Edit Category' : 'Add Category'}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? 'Update the category details'
                : 'Create a new category for your menu'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                placeholder="e.g., Appetizers, Main Course"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Brief description of this category"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Icon (optional)</Label>
              <Input
                placeholder="e.g., 🍕 or icon class name"
                value={categoryForm.icon}
                onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch
                checked={categoryForm.is_active}
                onCheckedChange={(checked) =>
                  setCategoryForm({ ...categoryForm, is_active: checked })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveCategory}
              disabled={!categoryForm.name.trim()}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {editingCategory ? 'Save Changes' : 'Add Category'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Category Dialog */}
      <Dialog open={!!deletingCategory} onOpenChange={() => setDeletingCategory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deletingCategory?.name}"? All items in this
              category will also be deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingCategory(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteCategory}>
              Delete Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Item Dialog */}
      <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
        <DialogContent className="max-w-lg w-[95vw] sm:w-full max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Item' : 'Add Item'}</DialogTitle>
            <DialogDescription>
              {editingItem ? 'Update the item details' : 'Add a new item to this category'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[55vh] sm:max-h-[60vh] overflow-y-auto px-1">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                placeholder="Item name"
                value={itemForm.name}
                onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Describe this item"
                value={itemForm.description}
                onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Price *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="pl-9"
                    value={itemForm.price}
                    onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Compare Price</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Original price"
                    className="pl-9"
                    value={itemForm.compare_at_price}
                    onChange={(e) => setItemForm({ ...itemForm, compare_at_price: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Image URL</Label>
              <Input
                placeholder="https://..."
                value={itemForm.image_url}
                onChange={(e) => setItemForm({ ...itemForm, image_url: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <Label>Available</Label>
                <Switch
                  checked={itemForm.is_available}
                  onCheckedChange={(checked) =>
                    setItemForm({ ...itemForm, is_available: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Featured</Label>
                <Switch
                  checked={itemForm.is_featured}
                  onCheckedChange={(checked) =>
                    setItemForm({ ...itemForm, is_featured: checked })
                  }
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>Spicy</Label>
              <Switch
                checked={itemForm.is_spicy}
                onCheckedChange={(checked) =>
                  setItemForm({ ...itemForm, is_spicy: checked })
                }
              />
            </div>

            {/* Variations */}
            <div className="space-y-3 border-t pt-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <Label className="text-base font-medium">Variations (Size/Options)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setItemForm({
                      ...itemForm,
                      variations: [...itemForm.variations, { name: '', price: '' }],
                    })
                  }
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </div>
              {itemForm.variations.length === 0 && (
                <p className="text-sm text-neutral-500">No variations. Add sizes like Small, Medium, Large with different prices.</p>
              )}
              {itemForm.variations.map((variation, index) => (
                <div key={index} className="flex flex-col sm:flex-row gap-2 sm:items-center">
                  <Input
                    placeholder="Name (e.g. Large)"
                    value={variation.name}
                    onChange={(e) => {
                      const newVariations = [...itemForm.variations];
                      newVariations[index].name = e.target.value;
                      setItemForm({ ...itemForm, variations: newVariations });
                    }}
                    className="flex-1"
                  />
                  <div className="flex gap-2 items-center">
                    <div className="relative flex-1 sm:w-28 sm:flex-none">
                      <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Price"
                        className="pl-7"
                        value={variation.price}
                        onChange={(e) => {
                          const newVariations = [...itemForm.variations];
                          newVariations[index].price = e.target.value;
                          setItemForm({ ...itemForm, variations: newVariations });
                        }}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const newVariations = itemForm.variations.filter((_, i) => i !== index);
                        setItemForm({ ...itemForm, variations: newVariations });
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsItemDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveItem}
              disabled={!itemForm.name.trim() || !itemForm.price}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {editingItem ? 'Save Changes' : 'Add Item'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Item Dialog */}
      <Dialog open={!!deletingItem} onOpenChange={() => setDeletingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deletingItem?.name}"?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingItem(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteItem}>
              Delete Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function TemplateEditorPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    }>
      <TemplateEditorContent />
    </Suspense>
  );
}
