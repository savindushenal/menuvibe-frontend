'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, Trash2, Edit2, GripVertical, List, FolderOpen, Utensils, Power } from 'lucide-react';
import { MenuCategory, MenuItem } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';
import { useLocation } from '@/contexts/location-context';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye } from 'lucide-react';
import { LoadingSpinner } from '@/components/loading/spinner';


// Currency options
const currencies = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
];

// Menu Design Templates
const menuDesigns = [
  {
    value: 'modern',
    label: 'Modern',
    description: 'Clean lines with bold typography',
    preview: 'bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-slate-300',
    colors: { bg: '#F8FAFC', text: '#1E293B', accent: '#3B82F6' }
  },
  {
    value: 'classic',
    label: 'Classic',
    description: 'Traditional elegant design',
    preview: 'bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-600',
    colors: { bg: '#FFFBEB', text: '#78350F', accent: '#D97706' }
  },
  {
    value: 'minimal',
    label: 'Minimal',
    description: 'Simple and clean layout',
    preview: 'bg-white border-2 border-gray-300',
    colors: { bg: '#FFFFFF', text: '#000000', accent: '#6B7280' }
  },
  {
    value: 'elegant',
    label: 'Elegant',
    description: 'Sophisticated with serif fonts',
    preview: 'bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-300',
    colors: { bg: '#FAF5FF', text: '#581C87', accent: '#A855F7' }
  },
  {
    value: 'rustic',
    label: 'Rustic',
    description: 'Warm earthy tones',
    preview: 'bg-gradient-to-br from-orange-100 to-yellow-100 border-2 border-orange-400',
    colors: { bg: '#FFF7ED', text: '#7C2D12', accent: '#EA580C' }
  },
  {
    value: 'bold',
    label: 'Bold',
    description: 'High contrast and vibrant',
    preview: 'bg-gradient-to-br from-red-100 to-yellow-100 border-2 border-red-500',
    colors: { bg: '#FEF2F2', text: '#7F1D1D', accent: '#DC2626' }
  }
];

// Sortable Menu Card Component
function SortableMenuCard({ menu, onEdit, onDelete, onSelect, onView, onToggleStatus }: {
  menu: any;
  onEdit: (menu: any) => void;
  onDelete: (menuId: number) => void;
  onSelect: (menu: any) => void;
  onView: (menu: any) => void;
  onToggleStatus: (menuId: number, currentStatus: boolean) => void;
}) {
  const designInfo = menuDesigns.find(d => d.value === menu.style) || menuDesigns[0];
  
  return (
    <Card className="hover:shadow-lg transition-all">
      <CardContent className="p-5">
        {/* Header */}
        <div className="mb-4">
          <h3 className="text-xl font-bold mb-2">{menu.name}</h3>
          {menu.description && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{menu.description}</p>
          )}
          
          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className={`px-3 py-1.5 rounded-md text-xs font-medium ${designInfo.preview}`}>
              {designInfo.label} Style
            </div>
            {menu.is_active ? (
              <Badge className="bg-black text-white">Active</Badge>
            ) : (
              <Badge variant="secondary">Inactive</Badge>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="default"
            onClick={() => onView(menu)}
            className="w-full"
          >
            <Eye className="w-4 h-4 mr-2" />
            View
          </Button>
          <Button
            variant="outline"
            size="default"
            onClick={() => onSelect(menu)}
            className="w-full"
          >
            Manage
          </Button>
        </div>

        {/* Edit and Delete Icons */}
        <div className="flex justify-between items-center gap-1 mt-3 pt-3 border-t">
          <Button
            variant={menu.is_active ? "default" : "outline"}
            size="sm"
            onClick={() => onToggleStatus(menu.id, menu.is_active)}
            className="h-8"
          >
            <Power className="w-3 h-3 mr-1.5" />
            {menu.is_active ? 'Active' : 'Inactive'}
          </Button>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(menu)}
              className="h-8 w-8"
            >
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(menu.id)}
              className="h-8 w-8 text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Sortable Category Item Component
function SortableCategoryItem({ category, onEdit, onDelete }: { 
  category: MenuCategory; 
  onEdit: (category: MenuCategory) => void;
  onDelete: (categoryId: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="mb-2">
      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
              <GripVertical className="w-5 h-5 text-gray-400" />
            </button>
            <div>
              <h4 className="font-semibold">{category.name}</h4>
              {category.description && (
                <p className="text-sm text-muted-foreground">{category.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => onEdit(category)}>
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onDelete(category.id)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Sortable Menu Item Component
function SortableMenuItem({ item, onEdit, onDelete }: { 
  item: MenuItem; 
  onEdit: (item: MenuItem) => void;
  onDelete: (itemId: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="mb-2">
      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
              <GripVertical className="w-5 h-5 text-gray-400" />
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold">{item.name}</h4>
                <Badge variant={item.is_available ? 'default' : 'secondary'}>
                  {item.is_available ? 'Available' : 'Unavailable'}
                </Badge>
                {item.is_spicy && <Badge variant="destructive">🌶️ Spicy</Badge>}
              </div>
              {item.description && (
                <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
              )}
              <p className="text-sm font-semibold mt-1">${Number(item.price).toFixed(2)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => onEdit(item)}>
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onDelete(item.id)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function MenuManagementPage() {
  const { currentLocation, isLoading: locationLoading } = useLocation();
  const [menus, setMenus] = useState<any[]>([]);
  const [selectedMenu, setSelectedMenu] = useState<any | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('menus');
  
  // Dialog states
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [isEditMenuOpen, setIsEditMenuOpen] = useState(false);
  const [isViewMenuOpen, setIsViewMenuOpen] = useState(false);
  const [isViewMenuEditMode, setIsViewMenuEditMode] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isEditCategoryOpen, setIsEditCategoryOpen] = useState(false);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isEditItemOpen, setIsEditItemOpen] = useState(false);
  
  const { toast } = useToast();

  // Form states
  const [menuForm, setMenuForm] = useState({
    id: 0,
    name: '',
    description: '',
    style: 'modern',
    currency: 'USD',
  });

  const [categoryForm, setCategoryForm] = useState({
    id: 0,
    name: '',
    description: '',
    background_color: '#FFFFFF',
    text_color: '#000000',
    heading_color: '#000000',
  });

  const [itemForm, setItemForm] = useState({
    id: 0,
    name: '',
    description: '',
    price: '',
    category_id: 0,
    is_available: true,
    is_spicy: false,
  });

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load menus
  useEffect(() => {
    if (currentLocation) {
      loadMenus();
    } else {
      // If no location, set loading to false and show empty state
      setLoading(false);
      setMenus([]);
    }
  }, [currentLocation]);

  // Load categories and items when menu is selected
  useEffect(() => {
    if (selectedMenu) {
      loadCategories();
      loadItems();
    } else {
      setCategories([]);
      setItems([]);
    }
  }, [selectedMenu]);

  const loadMenus = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getMenus(currentLocation?.id);
      if (response.success) {
        const menusList = response.data?.menus || [];
        setMenus(menusList);
        if (menusList.length > 0 && !selectedMenu) {
          setSelectedMenu(menusList[0]);
        }
      }
    } catch (error) {
      console.error('Error loading menus:', error);
      toast({
        title: 'Error',
        description: 'Failed to load menus',
        variant: 'destructive',
      });
      setMenus([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    if (!selectedMenu) return;
    try {
      setLoadingCategories(true);
      const response = await apiClient.getMenuCategories(selectedMenu.id);
      if (response.success && response.data?.categories) {
        setCategories(response.data.categories);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const loadItems = async () => {
    if (!selectedMenu) return;
    try {
      setLoadingItems(true);
      const response = await apiClient.getMenuItems(selectedMenu.id);
      if (response.success && response.data) {
        // Backend returns 'menu_items', handle both 'items' and 'menu_items' for compatibility
        const itemsData = response.data.items || response.data.menu_items || [];
        setItems(itemsData);
      } else {
        setItems([]);
      }
    } catch (error) {
      console.error('Error loading items:', error);
      toast({
        title: 'Error',
        description: 'Failed to load menu items',
        variant: 'destructive',
      });
      setItems([]);
    } finally {
      setLoadingItems(false);
    }
  };

  // Menu handlers
  const handleAddMenu = async () => {
    if (!menuForm.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Menu name is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('name', menuForm.name);
      formData.append('description', menuForm.description);
      formData.append('style', menuForm.style);
      formData.append('currency', menuForm.currency);

      const response = await apiClient.createMenu(formData);
      
      if (response.success) {
        toast({
          title: 'Menu created',
          description: `${menuForm.name} has been created successfully.`,
        });
        setIsAddMenuOpen(false);
        setMenuForm({ id: 0, name: '', description: '', style: 'modern', currency: 'USD' });
        loadMenus();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create menu',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditMenu = async () => {
    if (!menuForm.id) return;
    
    if (!menuForm.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Menu name is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('name', menuForm.name);
      formData.append('description', menuForm.description);
      formData.append('style', menuForm.style);
      formData.append('currency', menuForm.currency);
      formData.append('is_active', '1'); // Ensure menu stays active when updating

      const response = await apiClient.updateMenu(menuForm.id, formData);
      
      if (response.success) {
        toast({
          title: 'Menu updated',
          description: `${menuForm.name} has been updated successfully.`,
        });
        setIsEditMenuOpen(false);
        setIsViewMenuEditMode(false);
        await loadMenus();
        // Update selectedMenu if it's the one being edited
        if (selectedMenu?.id === menuForm.id) {
          setSelectedMenu({
            ...selectedMenu,
            name: menuForm.name,
            description: menuForm.description,
            style: menuForm.style,
            currency: menuForm.currency,
          });
        }
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update menu',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMenu = async (menuId: number) => {
    if (!confirm('Are you sure you want to delete this menu? All categories and items will be deleted.')) return;
    try {
      const response = await apiClient.deleteMenu(menuId);
      if (response.success) {
        toast({
          title: 'Menu deleted',
          description: 'Menu has been deleted successfully.',
        });
        if (selectedMenu?.id === menuId) {
          setSelectedMenu(null);
        }
        loadMenus();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete menu',
        variant: 'destructive',
      });
    }
  };

  const handleToggleMenuStatus = async (menuId: number, currentStatus: boolean) => {
    try {
      const formData = new FormData();
      formData.append('is_active', currentStatus ? '0' : '1');
      
      const response = await fetch(`/api/menus/${menuId}`, {
        method: 'PUT',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to update menu status');

      toast({
        title: 'Menu updated',
        description: `Menu ${currentStatus ? 'deactivated' : 'activated'} successfully.`,
      });
      
      loadMenus();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update menu status',
        variant: 'destructive',
      });
    }
  };

  const handleSelectMenu = (menu: any) => {
    setSelectedMenu(menu);
    setActiveTab('categories');
  };

  const handleViewMenu = (menu: any) => {
    setSelectedMenu(menu);
    setIsViewMenuOpen(true);
  };

  // Category handlers
  const handleAddCategory = async () => {
    if (!selectedMenu) return;
    try {
      setSubmitting(true);
      const response = await apiClient.createMenuCategory(selectedMenu.id, {
        name: categoryForm.name,
        description: categoryForm.description,
        background_color: categoryForm.background_color,
        text_color: categoryForm.text_color,
        heading_color: categoryForm.heading_color,
      });
      
      if (response.success) {
        toast({
          title: 'Category added',
          description: `${categoryForm.name} has been added successfully.`,
        });
        setIsAddCategoryOpen(false);
        setCategoryForm({ id: 0, name: '', description: '', background_color: '#FFFFFF', text_color: '#000000', heading_color: '#000000' });
        loadCategories();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add category',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditCategory = async () => {
    if (!selectedMenu || !categoryForm.id) return;
    try {
      setSubmitting(true);
      const response = await apiClient.updateMenuCategory(selectedMenu.id, categoryForm.id, {
        name: categoryForm.name,
        description: categoryForm.description,
        background_color: categoryForm.background_color,
        text_color: categoryForm.text_color,
        heading_color: categoryForm.heading_color,
      });
      
      if (response.success) {
        toast({
          title: 'Category updated',
          description: `${categoryForm.name} has been updated successfully.`,
        });
        setIsEditCategoryOpen(false);
        loadCategories();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update category',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    if (!selectedMenu || !confirm('Are you sure you want to delete this category?')) return;
    try {
      const response = await apiClient.deleteMenuCategory(selectedMenu.id, categoryId);
      if (response.success) {
        toast({
          title: 'Category deleted',
          description: 'Category has been deleted successfully.',
        });
        loadCategories();
        if (selectedCategory === categoryId) {
          setSelectedCategory(null);
        }
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete category',
        variant: 'destructive',
      });
    }
  };

  // Item handlers
  const handleAddItem = async () => {
    if (!selectedMenu) {
      toast({
        title: 'No menu selected',
        description: 'Please select a menu first before adding items.',
        variant: 'destructive',
      });
      return;
    }

    if (!itemForm.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter an item name.',
        variant: 'destructive',
      });
      return;
    }

    if (!itemForm.price || parseFloat(itemForm.price) <= 0) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a valid price.',
        variant: 'destructive',
      });
      return;
    }

    if (!itemForm.category_id || itemForm.category_id === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please select a category.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('name', itemForm.name.trim());
      formData.append('description', itemForm.description.trim());
      formData.append('price', itemForm.price);
      formData.append('category_id', itemForm.category_id.toString());
      formData.append('is_available', itemForm.is_available ? '1' : '0');
      formData.append('is_spicy', itemForm.is_spicy ? '1' : '0');

      const response = await apiClient.createMenuItem(selectedMenu.id, formData);
      
      if (response.success) {
        toast({
          title: 'Menu item added',
          description: `${itemForm.name} has been added successfully.`,
        });
        setIsAddItemOpen(false);
        setItemForm({ id: 0, name: '', description: '', price: '', category_id: 0, is_available: true, is_spicy: false });
        loadItems();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add menu item',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditItem = async () => {
    if (!selectedMenu || !itemForm.id) return;

    if (!itemForm.category_id || itemForm.category_id === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please select a category.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('name', itemForm.name);
      formData.append('description', itemForm.description);
      formData.append('price', itemForm.price);
      formData.append('category_id', itemForm.category_id.toString());
      formData.append('is_available', itemForm.is_available ? '1' : '0');
      formData.append('is_spicy', itemForm.is_spicy ? '1' : '0');

      const response = await apiClient.updateMenuItem(selectedMenu.id, itemForm.id, formData);
      
      if (response.success) {
        toast({
          title: 'Menu item updated',
          description: `${itemForm.name} has been updated successfully.`,
        });
        setIsEditItemOpen(false);
        loadItems();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update menu item',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    if (!selectedMenu || !confirm('Are you sure you want to delete this item?')) return;
    try {
      const response = await apiClient.deleteMenuItem(selectedMenu.id, itemId);
      if (response.success) {
        toast({
          title: 'Menu item deleted',
          description: 'Menu item has been deleted successfully.',
        });
        loadItems();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete menu item',
        variant: 'destructive',
      });
    }
  };

  // Drag handlers
  const handleCategoryDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !selectedMenu) return;

    const oldIndex = categories.findIndex((cat) => cat.id === active.id);
    const newIndex = categories.findIndex((cat) => cat.id === over.id);

    const newCategories = arrayMove(categories, oldIndex, newIndex);
    setCategories(newCategories);

    try {
      await apiClient.reorderMenuCategories(
        selectedMenu.id,
        newCategories.map((cat) => cat.id)
      );
    } catch (error) {
      console.error('Error reordering categories:', error);
      loadCategories();
    }
  };

  const handleItemDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !selectedMenu) return;

    const oldIndex = filteredItems.findIndex((item) => item.id === active.id);
    const newIndex = filteredItems.findIndex((item) => item.id === over.id);

    const newItems = arrayMove(filteredItems, oldIndex, newIndex);
    setItems(newItems);

    try {
      await apiClient.reorderMenuItems(
        selectedMenu.id,
        newItems.map((item) => item.id)
      );
    } catch (error) {
      console.error('Error reordering items:', error);
      loadItems();
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesCategory = selectedCategory === null || item.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading || locationLoading) {
    return (
      <div className="p-8">
        <LoadingSpinner text="Loading menus..." />
      </div>
    );
  }

  if (!currentLocation) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Please select a location first</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Menu Management</h1>
        <p className="text-muted-foreground">Manage your menus, categories, and items</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="menus">
            <List className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Menus</span>
          </TabsTrigger>
          <TabsTrigger value="categories" disabled={!selectedMenu}>
            <FolderOpen className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Categories</span>
          </TabsTrigger>
          <TabsTrigger value="items" disabled={!selectedMenu}>
            <Utensils className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Items</span>
          </TabsTrigger>
        </TabsList>

        {/* Menus Tab */}
        <TabsContent value="menus" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <CardTitle>Your Menus</CardTitle>
                  <CardDescription className="hidden sm:block">Create and manage your restaurant menus</CardDescription>
                </div>
                <Button onClick={() => setIsAddMenuOpen(true)} className="flex-shrink-0">
                  <Plus className="w-4 h-4 md:mr-2" />
                  <span className="hidden md:inline">Create Menu</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {menus.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">No menus yet. Create your first menu to get started!</p>
                  <Button onClick={() => setIsAddMenuOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Menu
                  </Button>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {menus.map((menu) => (
                    <SortableMenuCard
                      key={menu.id}
                      menu={menu}
                      onEdit={(m) => {
                        setMenuForm({
                          id: m.id,
                          name: m.name,
                          description: m.description || '',
                          style: m.style || 'modern',
                          currency: m.currency || 'USD',
                        });
                        setIsEditMenuOpen(true);
                      }}
                      onDelete={handleDeleteMenu}
                      onSelect={handleSelectMenu}
                      onView={handleViewMenu}
                      onToggleStatus={handleToggleMenuStatus}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          {selectedMenu && (
            <>
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-muted-foreground">Managing categories for:</p>
                      <p className="font-semibold truncate">{selectedMenu.name}</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setActiveTab('menus')}
                      className="whitespace-nowrap flex-shrink-0"
                    >
                      <List className="w-4 h-4 md:mr-2" />
                      <span className="hidden md:inline">Change Menu</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <CardTitle>Categories</CardTitle>
                      <CardDescription className="hidden sm:block">Organize your menu items by category</CardDescription>
                    </div>
                    <Button onClick={() => setIsAddCategoryOpen(true)} className="flex-shrink-0">
                      <Plus className="w-4 h-4 md:mr-2" />
                      <span className="hidden md:inline">Add Category</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingCategories ? (
                    <LoadingSpinner text="Loading categories..." />
                  ) : categories.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground mb-4">No categories yet. Add your first category!</p>
                      <Button onClick={() => setIsAddCategoryOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Category
                      </Button>
                    </div>
                  ) : (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleCategoryDragEnd}
                    >
                      <SortableContext
                        items={categories.map((cat) => cat.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-2">
                          {categories.map((category) => (
                            <SortableCategoryItem
                              key={category.id}
                              category={category}
                              onEdit={(cat) => {
                                setCategoryForm({
                                  id: cat.id,
                                  name: cat.name,
                                  description: cat.description || '',
                                  background_color: cat.background_color,
                                  text_color: cat.text_color,
                                  heading_color: cat.heading_color,
                                });
                                setIsEditCategoryOpen(true);
                              }}
                              onDelete={handleDeleteCategory}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Items Tab */}
        <TabsContent value="items" className="space-y-4">
          {selectedMenu && (
            <>
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-muted-foreground">Managing items for:</p>
                      <p className="font-semibold truncate">{selectedMenu.name}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setActiveTab('categories')}
                        className="whitespace-nowrap"
                      >
                        <FolderOpen className="w-4 h-4 md:mr-2" />
                        <span className="hidden md:inline">Manage Categories</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setActiveTab('menus')}
                        className="whitespace-nowrap"
                      >
                        <List className="w-4 h-4 md:mr-2" />
                        <span className="hidden md:inline">Change Menu</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Category Filter */}
                <Card>
                  <CardHeader>
                    <CardTitle>Filter by Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Button
                        variant={selectedCategory === null ? 'default' : 'outline'}
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => setSelectedCategory(null)}
                      >
                        All Items ({items.length})
                      </Button>
                      {categories.map((category) => (
                        <Button
                          key={category.id}
                          variant={selectedCategory === category.id ? 'default' : 'outline'}
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => setSelectedCategory(category.id)}
                        >
                          {category.name} ({items.filter(i => i.category_id === category.id).length})
                        </Button>
                      ))}
                    </div>
                    {categories.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No categories yet.{' '}
                        <button
                          className="text-primary underline"
                          onClick={() => setActiveTab('categories')}
                        >
                          Add categories first
                        </button>
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Items List */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <CardTitle>Menu Items</CardTitle>
                        <CardDescription className="hidden sm:block truncate">
                          {selectedCategory === null
                            ? 'All menu items'
                            : categories.find(c => c.id === selectedCategory)?.name || 'Category items'}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Button variant="outline" size="sm" onClick={() => loadItems()}>
                          <Search className="w-4 h-4 md:mr-2" />
                          <span className="hidden md:inline">Refresh</span>
                        </Button>
                        <Button onClick={() => setIsAddItemOpen(true)}>
                          <Plus className="w-4 h-4 md:mr-2" />
                          <span className="hidden md:inline">Add Item</span>
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Search items..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    {loadingItems ? (
                      <LoadingSpinner text="Loading items..." />
                    ) : filteredItems.length === 0 ? (
                      <div className="text-center py-12">
                        <p className="text-muted-foreground mb-4">
                          {searchQuery ? 'No items match your search.' : items.length > 0 ? 'No items match the selected category.' : 'No items yet. Add your first item!'}
                        </p>
                        {!searchQuery && items.length === 0 && (
                          <Button onClick={() => setIsAddItemOpen(true)}>
                            <Plus className="w-4 h-4 md:mr-2" />
                            <span className="hidden md:inline">Add Item</span>
                          </Button>
                        )}
                      </div>
                    ) : (
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleItemDragEnd}
                      >
                        <SortableContext
                          items={filteredItems.map((item) => item.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="space-y-2">
                            {filteredItems.map((item) => (
                              <SortableMenuItem
                                key={item.id}
                                item={item}
                                onEdit={(itm) => {
                                  setItemForm({
                                    id: itm.id,
                                    name: itm.name,
                                    description: itm.description || '',
                                    price: itm.price.toString(),
                                    category_id: itm.category_id || 0,
                                    is_available: itm.is_available,
                                    is_spicy: itm.is_spicy,
                                  });
                                  setIsEditItemOpen(true);
                                }}
                                onDelete={handleDeleteItem}
                              />
                            ))}
                          </div>
                        </SortableContext>
                      </DndContext>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Menu Dialog */}
      <Dialog open={isAddMenuOpen} onOpenChange={setIsAddMenuOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Menu</DialogTitle>
            <DialogDescription>Create a new menu for your restaurant</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="menu-name">Menu Name <span className="text-red-500">*</span></Label>
              <Input
                id="menu-name"
                value={menuForm.name}
                onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })}
                placeholder="e.g., Lunch Menu, Dinner Menu"
                required
              />
            </div>
            <div>
              <Label htmlFor="menu-description">Description (optional)</Label>
              <Textarea
                id="menu-description"
                value={menuForm.description}
                onChange={(e) => setMenuForm({ ...menuForm, description: e.target.value })}
                placeholder="Describe this menu..."
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="menu-currency">Currency</Label>
              <select
                id="menu-currency"
                className="w-full border border-gray-300 rounded-md p-2"
                value={menuForm.currency}
                onChange={(e) => setMenuForm({ ...menuForm, currency: e.target.value })}
              >
                {currencies.map((curr) => (
                  <option key={curr.code} value={curr.code}>
                    {curr.symbol} - {curr.name} ({curr.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Menu Design Template</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                {menuDesigns.map((design) => (
                  <button
                    key={design.value}
                    type="button"
                    onClick={() => setMenuForm({ ...menuForm, style: design.value })}
                    className={`p-3 rounded-lg border-2 transition-all text-left ${
                      menuForm.style === design.value
                        ? 'border-primary shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`h-16 rounded mb-2 ${design.preview}`}></div>
                    <div className="font-semibold text-sm">{design.label}</div>
                    <div className="text-xs text-muted-foreground">{design.description}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddMenuOpen(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={handleAddMenu} disabled={!menuForm.name.trim() || submitting}>
              {submitting ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Creating...</span>
                </>
              ) : (
                'Create Menu'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Menu Dialog */}
      <Dialog open={isEditMenuOpen} onOpenChange={setIsEditMenuOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Menu</DialogTitle>
            <DialogDescription>Update menu details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-menu-name">Menu Name <span className="text-red-500">*</span></Label>
              <Input
                id="edit-menu-name"
                value={menuForm.name}
                onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-menu-description">Description</Label>
              <Textarea
                id="edit-menu-description"
                value={menuForm.description}
                onChange={(e) => setMenuForm({ ...menuForm, description: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-menu-currency">Currency</Label>
              <select
                id="edit-menu-currency"
                className="w-full border border-gray-300 rounded-md p-2"
                value={menuForm.currency}
                onChange={(e) => setMenuForm({ ...menuForm, currency: e.target.value })}
              >
                {currencies.map((curr) => (
                  <option key={curr.code} value={curr.code}>
                    {curr.symbol} - {curr.name} ({curr.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Menu Design Template</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {menuDesigns.map((design) => (
                  <button
                    key={design.value}
                    type="button"
                    onClick={() => setMenuForm({ ...menuForm, style: design.value })}
                    className={`p-3 rounded-lg border-2 transition-all text-left ${
                      menuForm.style === design.value
                        ? 'border-primary shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`h-16 rounded mb-2 ${design.preview}`}></div>
                    <div className="font-semibold text-sm">{design.label}</div>
                    <div className="text-xs text-muted-foreground">{design.description}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditMenuOpen(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={handleEditMenu} disabled={!menuForm.name.trim() || submitting}>
              {submitting ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Updating...</span>
                </>
              ) : (
                'Update Menu'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Menu Dialog */}
      <Dialog open={isViewMenuOpen} onOpenChange={(open) => {
        setIsViewMenuOpen(open);
        if (!open) setIsViewMenuEditMode(false);
      }}>
        <DialogContent className="max-w-7xl h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>
              {isViewMenuEditMode ? 'Edit Menu' : 'View Menu'}: {isViewMenuEditMode ? menuForm.name || 'Untitled Menu' : selectedMenu?.name}
            </DialogTitle>
            <DialogDescription>
              {isViewMenuEditMode ? 'Update your menu details and see live preview' : 'Preview your menu as customers will see it'}
            </DialogDescription>
          </DialogHeader>
          {selectedMenu && (
            <div className="flex-1 overflow-hidden min-h-0">
              {isViewMenuEditMode ? (
                /* Edit Mode with Live Preview */
                <div className="grid grid-cols-2 gap-6 h-full">
                  {/* Left Side - Edit Form */}
                  <div className="overflow-y-auto pr-4 space-y-4">
                    <div>
                      <Label htmlFor="view-edit-name">Menu Name</Label>
                      <Input
                        id="view-edit-name"
                        value={menuForm.name}
                        onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })}
                        placeholder="e.g., Dinner Menu, Lunch Specials"
                      />
                    </div>
                    <div>
                      <Label htmlFor="view-edit-description">Description</Label>
                      <Textarea
                        id="view-edit-description"
                        value={menuForm.description}
                        onChange={(e) => setMenuForm({ ...menuForm, description: e.target.value })}
                        placeholder="Brief description of your menu"
                      />
                    </div>
                    <div>
                      <Label htmlFor="view-edit-currency">Currency</Label>
                      <select
                        id="view-edit-currency"
                        className="w-full border border-gray-300 rounded-md p-2"
                        value={menuForm.currency}
                        onChange={(e) => setMenuForm({ ...menuForm, currency: e.target.value })}
                      >
                        {currencies.map((curr) => (
                          <option key={curr.code} value={curr.code}>
                            {curr.symbol} - {curr.name} ({curr.code})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>Menu Design Template</Label>
                      <div className="grid grid-cols-2 gap-3 mt-2">
                        {menuDesigns.map((design) => (
                          <div
                            key={design.value}
                            className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${
                              menuForm.style === design.value
                                ? 'border-primary bg-primary/5'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => setMenuForm({ ...menuForm, style: design.value })}
                          >
                            <div className={`h-8 rounded mb-2 ${design.preview}`}></div>
                            <div className="font-medium text-xs">{design.label}</div>
                            <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{design.description}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Side - Live Preview */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-gray-50">
                    <div className="h-full overflow-y-auto">
                      <div className="bg-white p-6 min-h-full">
                        {/* Restaurant Header */}
                        <div className="text-center border-b-2 pb-6 mb-6" style={{
                          borderColor: menuDesigns.find(d => d.value === menuForm.style)?.colors.accent + '30'
                        }}>
                          {currentLocation?.logo_url && (
                            <img 
                              src={currentLocation.logo_url} 
                              alt={currentLocation.name}
                              className="w-24 h-24 mx-auto rounded-full object-cover mb-4 border-4"
                              style={{
                                borderColor: menuDesigns.find(d => d.value === menuForm.style)?.colors.accent
                              }}
                            />
                          )}
                          <h1 className="text-3xl font-bold mb-2" style={{ 
                            color: menuDesigns.find(d => d.value === menuForm.style)?.colors.text 
                          }}>
                            {currentLocation?.name || 'Restaurant Name'}
                          </h1>
                          <p className="text-sm text-muted-foreground mb-4">
                            {currentLocation?.description || 'Welcome to our restaurant'}
                          </p>
                        </div>

                        {/* Menu Section */}
                        <div className="border-b pb-4 mb-6">
                          <h2 className="text-2xl font-bold text-center" style={{ 
                            color: menuDesigns.find(d => d.value === menuForm.style)?.colors.accent 
                          }}>
                            {menuForm.name || 'Untitled Menu'}
                          </h2>
                          {menuForm.description && (
                            <p className="text-muted-foreground mt-2 text-center text-sm">{menuForm.description}</p>
                          )}
                          <div className="flex items-center justify-center gap-2 mt-3">
                            <Badge style={{ 
                              backgroundColor: menuDesigns.find(d => d.value === menuForm.style)?.colors.accent,
                              color: 'white'
                            }}>
                              {menuDesigns.find(d => d.value === menuForm.style)?.label || 'Modern'} Style
                            </Badge>
                            <Badge variant="outline">
                              {currencies.find(c => c.code === menuForm.currency)?.symbol} {menuForm.currency}
                            </Badge>
                          </div>
                        </div>

                        {/* Preview Categories and Items */}
                        {categories.length === 0 ? (
                          <div className="text-center py-12 text-muted-foreground">
                            <p className="text-sm">No categories or items yet.</p>
                            <p className="text-xs mt-2">Add categories and items to see them here</p>
                          </div>
                        ) : (
                          <div className="space-y-6">
                            {categories.map((category) => {
                              const categoryItems = items.filter(item => item.category_id === category.id);
                              if (categoryItems.length === 0) return null;
                              
                              return (
                                <div key={category.id} className="border rounded-lg p-4" style={{
                                  borderColor: menuDesigns.find(d => d.value === menuForm.style)?.colors.accent + '30'
                                }}>
                                  <h3 className="text-lg font-semibold mb-3" style={{
                                    color: menuDesigns.find(d => d.value === menuForm.style)?.colors.text
                                  }}>{category.name}</h3>
                                  {category.description && (
                                    <p className="text-sm text-muted-foreground mb-4">{category.description}</p>
                                  )}
                                  <div className="space-y-3">
                                    {categoryItems.map((item) => (
                                      <div key={item.id} className="flex justify-between items-start border-b pb-3 last:border-0">
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2">
                                            <h4 className="font-medium text-sm">{item.name}</h4>
                                            {item.is_spicy && <span className="text-red-500">🌶️</span>}
                                            {!item.is_available && (
                                              <Badge variant="secondary" className="text-xs">Unavailable</Badge>
                                            )}
                                          </div>
                                          {item.description && (
                                            <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                                          )}
                                        </div>
                                        <div className="font-semibold ml-4 text-sm" style={{
                                          color: menuDesigns.find(d => d.value === menuForm.style)?.colors.accent
                                        }}>
                                          {currencies.find(c => c.code === menuForm.currency)?.symbol}{Number(item.price).toFixed(2)}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* View Mode */
                <div className="overflow-y-auto h-full" style={{
                  backgroundColor: menuDesigns.find(d => d.value === selectedMenu.style)?.colors.bg || '#FFFFFF'
                }}>
                  <div className="max-w-4xl mx-auto">
                    {/* Restaurant Header */}
                    <div className="text-center border-b-2 pb-6 mb-6" style={{
                      borderColor: menuDesigns.find(d => d.value === selectedMenu.style)?.colors.accent || '#000000'
                    }}>
                      {currentLocation?.logo_url && (
                        <img 
                          src={currentLocation.logo_url} 
                          alt={currentLocation.name}
                          className="w-32 h-32 mx-auto rounded-full object-cover mb-4 border-4"
                          style={{
                            borderColor: menuDesigns.find(d => d.value === selectedMenu.style)?.colors.accent || '#000000'
                          }}
                        />
                      )}
                      <h1 className="text-4xl font-bold mb-2" style={{
                        color: menuDesigns.find(d => d.value === selectedMenu.style)?.colors.text || '#000000'
                      }}>{currentLocation?.name || 'Restaurant Name'}</h1>
                      <p className="text-muted-foreground mb-4">
                        {currentLocation?.description || 'Welcome to our restaurant'}
                      </p>
                    </div>

                    {/* Menu Header */}
                    <div className="text-center border-b pb-4 mb-6" style={{
                      borderColor: menuDesigns.find(d => d.value === selectedMenu.style)?.colors.accent || '#000000'
                    }}>
                      <h2 className="text-3xl font-bold" style={{
                        color: menuDesigns.find(d => d.value === selectedMenu.style)?.colors.text || '#000000'
                      }}>{selectedMenu.name}</h2>
                      {selectedMenu.description && (
                        <p className="text-muted-foreground mt-2">{selectedMenu.description}</p>
                      )}
                      <Badge className="mt-2">{menuDesigns.find(d => d.value === selectedMenu.style)?.label || 'Modern'} Style</Badge>
                    </div>

                    {/* Categories and Items */}
                    {categories.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <p>No categories or items yet.</p>
                        <Button 
                          variant="outline" 
                          className="mt-4"
                          onClick={() => {
                            setIsViewMenuOpen(false);
                            setActiveTab('categories');
                          }}
                        >
                          Add Categories & Items
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {categories.map((category) => {
                          const categoryItems = items.filter(item => item.category_id === category.id);
                          if (categoryItems.length === 0) return null;
                          const designColors = menuDesigns.find(d => d.value === selectedMenu.style)?.colors || { bg: '#FFFFFF', text: '#000000', accent: '#000000' };
                          
                          return (
                            <div key={category.id} className="border rounded-lg p-4" style={{
                              borderColor: designColors.accent,
                              backgroundColor: designColors.bg
                            }}>
                              <h3 className="text-xl font-semibold mb-3" style={{
                                color: designColors.text
                              }}>{category.name}</h3>
                              {category.description && (
                                <p className="text-sm text-muted-foreground mb-4">{category.description}</p>
                              )}
                              <div className="space-y-3">
                                {categoryItems.map((item) => (
                                  <div key={item.id} className="flex justify-between items-start border-b pb-3 last:border-0" style={{
                                    borderColor: designColors.accent + '40'
                                  }}>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <h4 className="font-medium" style={{
                                          color: designColors.text
                                        }}>{item.name}</h4>
                                        {item.is_spicy && <span className="text-red-500">🌶️</span>}
                                        {!item.is_available && (
                                          <Badge variant="secondary" className="text-xs">Unavailable</Badge>
                                        )}
                                      </div>
                                      {item.description && (
                                        <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                                      )}
                                    </div>
                                    <div className="font-semibold ml-4" style={{
                                      color: designColors.accent
                                    }}>
                                      {currencies.find(c => c.code === selectedMenu.currency)?.symbol || '$'}{Number(item.price).toFixed(2)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="flex-shrink-0">
            {isViewMenuEditMode ? (
              <>
                <Button variant="outline" onClick={() => setIsViewMenuEditMode(false)} disabled={submitting}>Cancel</Button>
                <Button onClick={handleEditMenu} disabled={submitting}>
                  {submitting ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span className="ml-2">Saving...</span>
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setIsViewMenuOpen(false)}>Close</Button>
                <Button onClick={() => {
                  setMenuForm({
                    id: selectedMenu?.id || 0,
                    name: selectedMenu?.name || '',
                    description: selectedMenu?.description || '',
                    style: selectedMenu?.style || 'modern',
                    currency: selectedMenu?.currency || 'USD',
                  });
                  setIsViewMenuEditMode(true);
                }}>Edit Menu</Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Category Dialog */}
      <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Category</DialogTitle>
            <DialogDescription>Create a new menu category</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="category-name">Name</Label>
              <Input
                id="category-name"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                placeholder="e.g., Appetizers"
              />
            </div>
            <div>
              <Label htmlFor="category-description">Description (optional)</Label>
              <Textarea
                id="category-description"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                placeholder="Describe this category..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddCategoryOpen(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={handleAddCategory} disabled={submitting}>
              {submitting ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Adding...</span>
                </>
              ) : (
                'Add Category'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={isEditCategoryOpen} onOpenChange={setIsEditCategoryOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>Update category details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-category-name">Name</Label>
              <Input
                id="edit-category-name"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-category-description">Description</Label>
              <Textarea
                id="edit-category-description"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditCategoryOpen(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={handleEditCategory} disabled={submitting}>
              {submitting ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Updating...</span>
                </>
              ) : (
                'Update Category'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Item Dialog */}
      <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Menu Item</DialogTitle>
            <DialogDescription>
              Create a new menu item {selectedMenu && `for ${selectedMenu.name}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="item-name">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="item-name"
                value={itemForm.name}
                onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                placeholder="e.g., Caesar Salad"
                required
              />
            </div>
            <div>
              <Label htmlFor="item-description">Description</Label>
              <Textarea
                id="item-description"
                value={itemForm.description}
                onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                placeholder="Describe this item..."
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="item-price">
                Price <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                  {selectedMenu && currencies.find(c => c.code === selectedMenu.currency)?.symbol || '$'}
                </span>
                <Input
                  id="item-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={itemForm.price}
                  onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
                  placeholder="0.00"
                  className="pl-8"
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="item-category">Category *</Label>
              <select
                id="item-category"
                className="w-full border border-gray-300 rounded-md p-2"
                value={itemForm.category_id}
                onChange={(e) => setItemForm({ ...itemForm, category_id: parseInt(e.target.value) })}
                required
              >
                <option value={0}>Select a category...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              {categories.length === 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Tip: Create categories first for better organization
                </p>
              )}
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={itemForm.is_available}
                  onChange={(e) => setItemForm({ ...itemForm, is_available: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm">Available for order</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={itemForm.is_spicy}
                  onChange={(e) => setItemForm({ ...itemForm, is_spicy: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm">Spicy 🌶️</span>
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAddItemOpen(false);
              setItemForm({ id: 0, name: '', description: '', price: '', category_id: 0, is_available: true, is_spicy: false });
            }} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleAddItem} disabled={submitting}>
              {submitting ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Adding...</span>
                </>
              ) : (
                'Add Item'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={isEditItemOpen} onOpenChange={setIsEditItemOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Menu Item</DialogTitle>
            <DialogDescription>Update item details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-item-name">Name</Label>
              <Input
                id="edit-item-name"
                value={itemForm.name}
                onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-item-description">Description</Label>
              <Textarea
                id="edit-item-description"
                value={itemForm.description}
                onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-item-price">Price</Label>
              <Input
                id="edit-item-price"
                type="number"
                step="0.01"
                value={itemForm.price}
                onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-item-category">Category</Label>
              <select
                id="edit-item-category"
                className="w-full border border-gray-300 rounded-md p-2"
                value={itemForm.category_id}
                onChange={(e) => setItemForm({ ...itemForm, category_id: parseInt(e.target.value) })}
              >
                <option value={0}>No Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={itemForm.is_available}
                  onChange={(e) => setItemForm({ ...itemForm, is_available: e.target.checked })}
                />
                Available
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={itemForm.is_spicy}
                  onChange={(e) => setItemForm({ ...itemForm, is_spicy: e.target.checked })}
                />
                Spicy 🌶️
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditItemOpen(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={handleEditItem} disabled={submitting}>
              {submitting ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Updating...</span>
                </>
              ) : (
                'Update Item'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
