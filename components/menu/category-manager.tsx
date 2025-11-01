'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash2, GripVertical, Palette, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Spinner, OverlayLoader } from '@/components/loading';
import { MenuCategory } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface CategoryManagerProps {
  menuId: number;
  categories: MenuCategory[];
  isOpen: boolean;
  onClose: () => void;
  onCategoryCreated: (category: MenuCategory) => void;
  onCategoryUpdated: (category: MenuCategory) => void;
  onCategoryDeleted: (categoryId: number) => void;
  onCategoriesReordered: (categories: MenuCategory[]) => void;
}

interface SortableCategoryProps {
  category: MenuCategory;
  onEdit: (category: MenuCategory) => void;
  onDelete: (categoryId: number) => void;
  isDeleting: boolean;
}

function SortableCategory({ category, onEdit, onDelete, isDeleting }: SortableCategoryProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      {isDeleting && <OverlayLoader show={true} message="Deleting..." />}
      <Card 
        className="border-neutral-200 hover:shadow-md transition-shadow"
        style={{ backgroundColor: category.background_color + '10' }}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing touch-none"
            >
              <GripVertical className="w-5 h-5 text-neutral-400" />
            </div>

            <div
              className="w-12 h-12 rounded-md flex items-center justify-center"
              style={{ backgroundColor: category.background_color }}
            >
              <Palette className="w-6 h-6" style={{ color: category.text_color }} />
            </div>

            <div className="flex-1">
              <h4 
                className="font-semibold"
                style={{ color: category.heading_color }}
              >
                {category.name}
              </h4>
              {category.description && (
                <p className="text-sm text-neutral-600 mt-1">{category.description}</p>
              )}
              <div className="flex gap-2 mt-2">
                <Badge variant={category.is_active ? "default" : "secondary"} className="text-xs">
                  {category.is_active ? 'Active' : 'Inactive'}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Order: {category.sort_order}
                </Badge>
              </div>
            </div>

            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onEdit(category)}
                disabled={isDeleting}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-600 hover:text-red-700"
                onClick={() => onDelete(category.id)}
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const DEFAULT_COLORS = [
  { name: 'Emerald', bg: '#10b981', text: '#ffffff' },
  { name: 'Blue', bg: '#3b82f6', text: '#ffffff' },
  { name: 'Purple', bg: '#8b5cf6', text: '#ffffff' },
  { name: 'Pink', bg: '#ec4899', text: '#ffffff' },
  { name: 'Orange', bg: '#f97316', text: '#ffffff' },
  { name: 'Red', bg: '#ef4444', text: '#ffffff' },
  { name: 'Yellow', bg: '#eab308', text: '#000000' },
  { name: 'Gray', bg: '#6b7280', text: '#ffffff' },
];

export function CategoryManager({
  menuId,
  categories: initialCategories,
  isOpen,
  onClose,
  onCategoryCreated,
  onCategoryUpdated,
  onCategoryDeleted,
  onCategoriesReordered,
}: CategoryManagerProps) {
  const { toast } = useToast();
  const [categories, setCategories] = useState<MenuCategory[]>(initialCategories);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [reordering, setReordering] = useState(false);
  const [activeId, setActiveId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    background_color: '#10b981',
    text_color: '#ffffff',
    heading_color: '#ffffff',
    is_active: true,
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = categories.findIndex((cat) => cat.id === active.id);
      const newIndex = categories.findIndex((cat) => cat.id === over.id);

      const newCategories = arrayMove(categories, oldIndex, newIndex);
      setCategories(newCategories);

      try {
        setReordering(true);
        onCategoriesReordered(newCategories);
      } catch (error) {
        console.error('Error reordering categories:', error);
        setCategories(categories);
      } finally {
        setReordering(false);
      }
    }

    setActiveId(null);
  };

  const handleAddCategory = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      background_color: '#10b981',
      text_color: '#ffffff',
      heading_color: '#ffffff',
      is_active: true,
    });
    setIsFormOpen(true);
  };

  const handleEditCategory = (category: MenuCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      background_color: category.background_color,
      text_color: category.text_color,
      heading_color: category.heading_color,
      is_active: category.is_active,
    });
    setIsFormOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Error',
        description: 'Category name is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);
      if (editingCategory) {
        await onCategoryUpdated({ ...editingCategory, ...formData });
      } else {
        await onCategoryCreated(formData as any);
      }
      setIsFormOpen(false);
    } catch (error) {
      console.error('Error saving category:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (categoryId: number) => {
    if (!confirm('Are you sure you want to delete this category? Items in this category will become uncategorized.')) {
      return;
    }

    try {
      setDeletingId(categoryId);
      await onCategoryDeleted(categoryId);
    } catch (error) {
      console.error('Error deleting category:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const applyPresetColor = (preset: typeof DEFAULT_COLORS[0]) => {
    setFormData({
      ...formData,
      background_color: preset.bg,
      text_color: preset.text,
      heading_color: preset.text,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-emerald-600" />
            Manage Categories
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-neutral-600">
                Organize your menu items into categories with custom colors
              </p>
              <Button
                onClick={handleAddCategory}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Category
              </Button>
            </div>

            {categories.length > 0 ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={categories.map((cat) => cat.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {categories.map((category) => (
                      <SortableCategory
                        key={category.id}
                        category={category}
                        onEdit={handleEditCategory}
                        onDelete={handleDelete}
                        isDeleting={deletingId === category.id}
                      />
                    ))}
                  </div>
                </SortableContext>

                <DragOverlay>
                  {activeId ? (
                    <Card className="border-neutral-200 shadow-lg">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <GripVertical className="w-5 h-5 text-neutral-400" />
                          <div className="w-12 h-12 rounded-md bg-emerald-500 flex items-center justify-center">
                            <Palette className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold">Dragging...</h4>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : null}
                </DragOverlay>
              </DndContext>
            ) : (
              <Card className="border-dashed border-2 border-neutral-300">
                <CardContent className="p-8 text-center">
                  <Palette className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
                  <p className="text-neutral-600 mb-4">No categories yet</p>
                  <Button
                    onClick={handleAddCategory}
                    variant="outline"
                    className="text-emerald-600 border-emerald-600"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Create First Category
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Category Form Dialog */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0">
            <DialogHeader className="px-6 pt-6 pb-4">
              <DialogTitle>
                {editingCategory ? 'Edit Category' : 'Create Category'}
              </DialogTitle>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-4">
              <div>
                <Label htmlFor="categoryName">Category Name *</Label>
                <Input
                  id="categoryName"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Appetizers, Main Courses, Desserts"
                />
              </div>

              <div>
                <Label htmlFor="categoryDescription">Description</Label>
                <Textarea
                  id="categoryDescription"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this category..."
                  rows={2}
                />
              </div>

              {/* Color Presets */}
              <div>
                <Label>Color Presets</Label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {DEFAULT_COLORS.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => applyPresetColor(preset)}
                      className="relative h-12 rounded-md border-2 hover:border-emerald-500 transition-colors"
                      style={{ backgroundColor: preset.bg }}
                    >
                      <span className="text-xs font-medium" style={{ color: preset.text }}>
                        {preset.name}
                      </span>
                      {formData.background_color === preset.bg && (
                        <Check className="absolute top-1 right-1 w-4 h-4 text-white" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Colors */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="bgColor">Background Color</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="bgColor"
                      type="color"
                      value={formData.background_color}
                      onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                      className="w-16 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={formData.background_color}
                      onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                      placeholder="#10b981"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="textColor">Text Color</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="textColor"
                      type="color"
                      value={formData.text_color}
                      onChange={(e) => setFormData({ ...formData, text_color: e.target.value })}
                      className="w-16 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={formData.text_color}
                      onChange={(e) => setFormData({ ...formData, text_color: e.target.value })}
                      placeholder="#ffffff"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="headingColor">Heading Color</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="headingColor"
                      type="color"
                      value={formData.heading_color}
                      onChange={(e) => setFormData({ ...formData, heading_color: e.target.value })}
                      className="w-16 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={formData.heading_color}
                      onChange={(e) => setFormData({ ...formData, heading_color: e.target.value })}
                      placeholder="#ffffff"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div>
                <Label>Preview</Label>
                <div
                  className="mt-2 p-6 rounded-lg"
                  style={{ backgroundColor: formData.background_color }}
                >
                  <h3
                    className="text-xl font-bold mb-2"
                    style={{ color: formData.heading_color }}
                  >
                    {formData.name || 'Category Name'}
                  </h3>
                  <p style={{ color: formData.text_color }}>
                    {formData.description || 'This is how your category will look'}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsFormOpen(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {saving && <Spinner size="sm" className="mr-2" />}
                  {saving ? 'Saving...' : editingCategory ? 'Update' : 'Create'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
