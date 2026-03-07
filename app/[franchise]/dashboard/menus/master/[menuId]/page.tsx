'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft,
  Plus, 
  ChefHat, 
  Edit, 
  Trash2, 
  RefreshCw,
  GripVertical,
  Image as ImageIcon,
  Tag,
  DollarSign,
  Percent,
  Clock,
  Building2,
  MoreVertical,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Zap,
  Calendar,
  Save,
  Eye,
  Settings2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CategoryDialog, ItemDialog, OfferDialog, SyncDialog } from '@/components/franchise/master-menu';

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  items: MenuItem[];
}

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
  variations?: Array<{
    name: string;
    price: number;
    compare_at_price?: number;
    is_default?: boolean;
  }> | null;
  customizations?: Array<{
    id: string;
    name: string;
    type: string;
    required: boolean;
    min_selections: number;
    max_selections: number;
    options: Array<{ id: string; name: string; price_modifier: number }>;
  }> | null;
}

interface Offer {
  id: number;
  title: string;
  description: string | null;
  offer_type: 'special' | 'instant' | 'seasonal' | 'combo' | 'happy_hour';
  discount_type: 'percentage' | 'fixed_amount' | 'bogo' | 'bundle_price';
  discount_value: number | null;
  image_url: string | null;
  badge_text: string | null;
  badge_color: string | null;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  is_featured: boolean;
  minimum_order: number | null;
  apply_to_all: boolean;
}

interface MasterMenu {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  currency: string;
  is_active: boolean;
  is_default: boolean;
  last_synced_at: string | null;
  categories: Category[];
  offers?: Offer[];
}

// Render-prop sortable wrapper — avoids extracting all complex JSX into separate components
function SortableWrapper({
  id,
  children,
}: {
  id: number;
  children: (dragHandleListeners: Record<string, unknown> | undefined) => React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    position: 'relative',
    zIndex: isDragging ? 10 : undefined,
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      {children(listeners)}
    </div>
  );
}

export default function MasterMenuEditorPage() {
  const params = useParams();
  const router = useRouter();
  const franchiseSlug = params?.franchise as string;
  const menuId = params?.menuId as string;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menu, setMenu] = useState<MasterMenu | null>(null);
  const [franchiseId, setFranchiseId] = useState<number | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dialog states
  const [categoryDialog, setCategoryDialog] = useState<{ open: boolean; category: Category | null }>({ open: false, category: null });
  const [itemDialog, setItemDialog] = useState<{ open: boolean; item: MenuItem | null; categoryId: number | null }>({ open: false, item: null, categoryId: null });
  const [offerDialog, setOfferDialog] = useState<{ open: boolean; offer: Offer | null }>({ open: false, offer: null });
  const [syncDialog, setSyncDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; type: 'category' | 'item' | 'offer'; id: number; name: string } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const fetchMenu = useCallback(async () => {
    try {
      setLoading(true);
      // First get franchise details
      const franchiseRes = await api.get(`/franchise/${franchiseSlug}/dashboard`);
      if (franchiseRes.data.success && franchiseRes.data.data.franchise) {
        const fId = franchiseRes.data.data.franchise.id;
        setFranchiseId(fId);
        
        // Fetch menu with categories, items, and offers
        const response = await api.get(`/franchises/${fId}/master-menus/${menuId}`);
        if (response.data.success) {
          setMenu(response.data.data);
          // Expand first category by default
          if (response.data.data.categories?.length > 0) {
            setExpandedCategories(new Set([response.data.data.categories[0].id]));
          }
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch master menu:', err);
      setError(err.response?.data?.message || 'Failed to load master menu');
    } finally {
      setLoading(false);
    }
  }, [franchiseSlug, menuId]);

  const handleItemSuccess = useCallback((updatedItem: MenuItem) => {
    setMenu(prevMenu => {
      if (!prevMenu) return prevMenu;
      
      const updatedCategories = prevMenu.categories.map(cat => {
        if (cat.id === updatedItem.category_id) {
          const existingItems = cat.items || [];
          const itemIndex = existingItems.findIndex(item => item.id === updatedItem.id);
          if (itemIndex >= 0) {
            // Update existing item
            const newItems = [...existingItems];
            newItems[itemIndex] = updatedItem;
            return { ...cat, items: newItems };
          } else {
            // Add new item
            return { ...cat, items: [...existingItems, updatedItem] };
          }
        }
        return cat;
      });
      
      return { ...prevMenu, categories: updatedCategories };
    });
  }, []);

  const handleCategorySuccess = useCallback((updatedCategory: Category) => {
    setMenu(prevMenu => {
      if (!prevMenu) return prevMenu;
      
      const categoryIndex = prevMenu.categories.findIndex(cat => cat.id === updatedCategory.id);
      if (categoryIndex >= 0) {
        // Update existing category - preserve existing items from state
        const newCategories = [...prevMenu.categories];
        newCategories[categoryIndex] = {
          ...newCategories[categoryIndex],
          ...updatedCategory,
          items: newCategories[categoryIndex].items || [],
        };
        return { ...prevMenu, categories: newCategories };
      } else {
        // Add new category - ensure items array exists
        return { ...prevMenu, categories: [...prevMenu.categories, { ...updatedCategory, items: updatedCategory.items || [] }] };
      }
    });
  }, []);

  const handleOfferSuccess = useCallback(() => {
    // Refresh menu for offers since they're not in the category structure
    fetchMenu();
  }, [fetchMenu]);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  const handleSyncAll = async () => {
    if (!franchiseId || !menu) return;
    
    try {
      setSyncing(true);
      const response = await api.post(`/franchises/${franchiseId}/master-menus/${menu.id}/sync`);
      
      if (response.data.success) {
        toast.success('Menu synced to all branches successfully');
        fetchMenu();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to sync menu');
    } finally {
      setSyncing(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog || !franchiseId || !menu) return;
    
    try {
      let endpoint = '';
      if (deleteDialog.type === 'category') {
        endpoint = `/franchises/${franchiseId}/master-menus/${menu.id}/categories/${deleteDialog.id}`;
      } else if (deleteDialog.type === 'item') {
        endpoint = `/franchises/${franchiseId}/master-menus/${menu.id}/items/${deleteDialog.id}`;
      } else if (deleteDialog.type === 'offer') {
        endpoint = `/franchises/${franchiseId}/master-menus/${menu.id}/offers/${deleteDialog.id}`;
      }
      
      const response = await api.delete(endpoint);
      
      if (response.data.success) {
        toast.success(`${deleteDialog.type === 'category' ? 'Category' : deleteDialog.type === 'item' ? 'Item' : 'Offer'} deleted successfully`);
        fetchMenu();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    } finally {
      setDeleteDialog(null);
    }
  };

  const toggleCategory = (categoryId: number) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const handleCategoryDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !menu || !franchiseId) return;
    const oldIndex = menu.categories.findIndex((c) => c.id === active.id);
    const newIndex = menu.categories.findIndex((c) => c.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(menu.categories, oldIndex, newIndex);
    setMenu((prev) => prev ? { ...prev, categories: reordered } : prev);
    try {
      await api.post(`/franchises/${franchiseId}/master-menus/${menu.id}/categories/reorder`, {
        orders: reordered.map((c, i) => ({ id: c.id, sort_order: i })),
      });
    } catch {
      toast.error('Failed to save category order');
      fetchMenu();
    }
  }, [menu, franchiseId, fetchMenu]);

  const handleItemsDragEnd = useCallback(async (categoryId: number, event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !menu || !franchiseId) return;
    const catIndex = menu.categories.findIndex((c) => c.id === categoryId);
    if (catIndex === -1) return;
    const items = menu.categories[catIndex].items || [];
    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reorderedItems = arrayMove(items, oldIndex, newIndex);
    const newCategories = menu.categories.map((c, idx) =>
      idx === catIndex ? { ...c, items: reorderedItems } : c
    );
    setMenu((prev) => prev ? { ...prev, categories: newCategories } : prev);
    try {
      await api.post(`/franchises/${franchiseId}/master-menus/${menu.id}/items/reorder`, {
        orders: reorderedItems.map((item, i) => ({ id: item.id, sort_order: i })),
      });
    } catch {
      toast.error('Failed to save item order');
      fetchMenu();
    }
  }, [menu, franchiseId, fetchMenu]);

  const getOfferTypeIcon = (type: Offer['offer_type']) => {
    switch (type) {
      case 'special': return <Sparkles className="h-4 w-4" />;
      case 'instant': return <Zap className="h-4 w-4" />;
      case 'seasonal': return <Calendar className="h-4 w-4" />;
      case 'combo': return <Tag className="h-4 w-4" />;
      case 'happy_hour': return <Clock className="h-4 w-4" />;
      default: return <Tag className="h-4 w-4" />;
    }
  };

  const getOfferTypeBadge = (type: Offer['offer_type']) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      special: 'default',
      instant: 'destructive',
      seasonal: 'secondary',
      combo: 'outline',
      happy_hour: 'secondary',
    };
    return variants[type] || 'default';
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: menu?.currency || 'LKR',
    }).format(price);
  };

  const filteredCategories = menu?.categories?.filter(cat => 
    cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (cat.items || []).some(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (error || !menu) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <p className="text-red-600">{error || 'Menu not found'}</p>
          <Button variant="outline" onClick={() => router.back()} className="mt-4">
            Go Back
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push(`/${franchiseSlug}/dashboard/menus/master`)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-neutral-900">{menu.name}</h1>
              <Badge variant={menu.is_active ? 'default' : 'secondary'}>
                {menu.is_active ? 'Active' : 'Inactive'}
              </Badge>
              {menu.is_default && (
                <Badge variant="outline">Default</Badge>
              )}
            </div>
            <p className="text-neutral-600 text-sm">
              {menu.description || 'No description'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => router.push(`/${franchiseSlug}/dashboard/menus/master/${menuId}/preview`)}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button variant="outline" onClick={() => setSyncDialog(true)}>
            <Building2 className="h-4 w-4 mr-2" />
            Sync Settings
          </Button>
          <Button onClick={handleSyncAll} disabled={syncing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            Sync to All Branches
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="items" className="space-y-4">
        <TabsList>
          <TabsTrigger value="items" className="gap-2">
            <ChefHat className="h-4 w-4" />
            Items & Categories
          </TabsTrigger>
          <TabsTrigger value="offers" className="gap-2">
            <Tag className="h-4 w-4" />
            Offers
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings2 className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Items & Categories Tab */}
        <TabsContent value="items" className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <Input
              placeholder="Search items or categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setCategoryDialog({ open: true, category: null })}>
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </div>
          </div>

          {filteredCategories.length === 0 ? (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <ChefHat className="h-12 w-12 mx-auto text-neutral-400 mb-4" />
                <h3 className="text-lg font-semibold text-neutral-900">
                  {searchQuery ? 'No items match your search' : 'No Categories Yet'}
                </h3>
                <p className="text-neutral-600 mt-1 max-w-sm mx-auto">
                  {searchQuery 
                    ? 'Try a different search term'
                    : 'Start by creating a category to organize your menu items.'}
                </p>
                {!searchQuery && (
                  <Button className="mt-6" onClick={() => setCategoryDialog({ open: true, category: null })}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Category
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleCategoryDragEnd}
            >
              <SortableContext
                items={menu.categories.map((c) => c.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {filteredCategories.map((category) => (
                    <SortableWrapper key={category.id} id={category.id}>
                      {(dragListeners) => (
                <Collapsible
                  open={expandedCategories.has(category.id)}
                  onOpenChange={() => toggleCategory(category.id)}
                >
                  <Card>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-neutral-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span {...dragListeners} className="touch-none">
                              <GripVertical className="h-5 w-5 text-neutral-400 cursor-grab" />
                            </span>
                            {expandedCategories.has(category.id) ? (
                              <ChevronDown className="h-5 w-5 text-neutral-500" />
                            ) : (
                              <ChevronRight className="h-5 w-5 text-neutral-500" />
                            )}
                            {category.icon ? (
                              <span className="text-2xl w-10 h-10 flex items-center justify-center">{category.icon}</span>
                            ) : category.image_url ? (
                              <img 
                                src={category.image_url} 
                                alt={category.name}
                                className="h-10 w-10 rounded object-cover"
                              />
                            ) : null}
                            <div>
                              <CardTitle className="text-base">{category.name}</CardTitle>
                              <CardDescription className="text-sm">
                                {category.items?.length || 0} items
                              </CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <Badge variant={category.is_active ? 'default' : 'secondary'} className="text-xs">
                              {category.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setItemDialog({ open: true, item: null, categoryId: category.id })}>
                                  <Plus className="h-4 w-4 mr-2" />
                                  Add Item
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setCategoryDialog({ open: true, category })}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Category
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-red-600"
                                  onClick={() => setDeleteDialog({ 
                                    open: true, 
                                    type: 'category', 
                                    id: category.id, 
                                    name: category.name 
                                  })}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Category
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        {!category.items?.length ? (
                          <div className="py-6 text-center border-t">
                            <p className="text-neutral-500 text-sm">No items in this category</p>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="mt-2"
                              onClick={() => setItemDialog({ open: true, item: null, categoryId: category.id })}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Add Item
                            </Button>
                          </div>
                        ) : (
                          <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={(e) => handleItemsDragEnd(category.id, e)}
                          >
                            <SortableContext
                              items={(category.items || []).map((i) => i.id)}
                              strategy={verticalListSortingStrategy}
                            >
                              <div className="border-t divide-y">
                                {(category.items || []).map((item) => (
                                  <SortableWrapper key={item.id} id={item.id}>
                                    {(dragListeners) => (
                              <div
                                className="py-3 px-2 flex items-center justify-between hover:bg-neutral-50 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <span {...dragListeners} className="touch-none">
                                    <GripVertical className="h-4 w-4 text-neutral-300 cursor-grab" />
                                  </span>
                                  {item.image_url ? (
                                    <img 
                                      src={item.image_url} 
                                      alt={item.name}
                                      className="h-12 w-12 rounded object-cover"
                                    />
                                  ) : (
                                    <div className="h-12 w-12 rounded bg-neutral-100 flex items-center justify-center">
                                      <ImageIcon className="h-5 w-5 text-neutral-400" />
                                    </div>
                                  )}
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">{item.name}</span>
                                      {item.is_featured && (
                                        <Badge variant="secondary" className="text-xs">Featured</Badge>
                                      )}
                                      {item.is_spicy && (
                                        <span className="text-red-500 text-xs">🌶️</span>
                                      )}
                                    </div>
                                    <p className="text-sm text-neutral-500 line-clamp-1">
                                      {item.description || 'No description'}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="text-right">
                                    {item.variations && item.variations.length > 0 ? (
                                      <div className="flex items-center gap-1">
                                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                          {item.variations.length} sizes
                                        </Badge>
                                        <span className="text-xs text-neutral-500">from</span>
                                        <span className="font-semibold">
                                          {formatPrice(Math.min(...item.variations.map(v => v.price)))}
                                        </span>
                                      </div>
                                    ) : (
                                      <>
                                        <p className="font-semibold">{formatPrice(item.price)}</p>
                                        {item.compare_at_price && (
                                          <p className="text-xs text-neutral-400 line-through">
                                            {formatPrice(item.compare_at_price)}
                                          </p>
                                        )}
                                      </>
                                    )}
                                    {item.customizations && item.customizations.length > 0 && (
                                      <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200 mt-1">
                                        {item.customizations.length} customization{item.customizations.length !== 1 ? 's' : ''}
                                        {item.customizations.filter(c => c.required).length > 0 && (
                                          <span className="ml-1 text-purple-500">
                                            ({item.customizations.filter(c => c.required).length} required)
                                          </span>
                                        )}
                                      </Badge>
                                    )}
                                  </div>
                                  <Badge variant={item.is_available ? 'outline' : 'secondary'} className="text-xs">
                                    {item.is_available ? 'Available' : 'Unavailable'}
                                  </Badge>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => setItemDialog({ open: true, item, categoryId: category.id })}>
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit Item
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => router.push(`/${franchiseSlug}/dashboard/menus/master/${menuId}/preview`)}>
                                        <Eye className="h-4 w-4 mr-2" />
                                        Preview Menu
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem 
                                        className="text-red-600"
                                        onClick={() => setDeleteDialog({ 
                                          open: true, 
                                          type: 'item', 
                                          id: item.id, 
                                          name: item.name 
                                        })}
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete Item
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                                    )}
                                  </SortableWrapper>
                                ))}
                              </div>
                            </SortableContext>
                          </DndContext>
                        )}
                        <div className="pt-3 border-t">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-primary"
                            onClick={() => setItemDialog({ open: true, item: null, categoryId: category.id })}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Item to {category.name}
                          </Button>
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
                      )}
                    </SortableWrapper>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </TabsContent>

        {/* Offers Tab */}
        <TabsContent value="offers" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold">Special Offers & Promotions</h2>
              <p className="text-sm text-neutral-600">Create offers that apply across all branches</p>
            </div>
            <Button onClick={() => setOfferDialog({ open: true, offer: null })}>
              <Plus className="h-4 w-4 mr-2" />
              Create Offer
            </Button>
          </div>

          {!menu.offers || menu.offers.length === 0 ? (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <Tag className="h-12 w-12 mx-auto text-neutral-400 mb-4" />
                <h3 className="text-lg font-semibold text-neutral-900">No Offers Yet</h3>
                <p className="text-neutral-600 mt-1 max-w-sm mx-auto">
                  Create special offers, instant deals, or seasonal promotions to boost sales.
                </p>
                <Button className="mt-6" onClick={() => setOfferDialog({ open: true, offer: null })}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Offer
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {menu.offers.map((offer) => (
                <Card key={offer.id} className={`relative ${!offer.is_active ? 'opacity-60' : ''}`}>
                  {offer.image_url && (
                    <div className="h-32 bg-neutral-100 overflow-hidden rounded-t-lg">
                      <img 
                        src={offer.image_url} 
                        alt={offer.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {getOfferTypeIcon(offer.offer_type)}
                          <Badge variant={getOfferTypeBadge(offer.offer_type)} className="text-xs capitalize">
                            {offer.offer_type.replace('_', ' ')}
                          </Badge>
                          {offer.is_featured && (
                            <Badge variant="secondary" className="text-xs">Featured</Badge>
                          )}
                        </div>
                        <CardTitle className="text-base">{offer.title}</CardTitle>
                        <CardDescription className="line-clamp-2">
                          {offer.description || 'No description'}
                        </CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setOfferDialog({ open: true, offer })}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Offer
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => setDeleteDialog({ 
                              open: true, 
                              type: 'offer', 
                              id: offer.id, 
                              name: offer.title 
                            })}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Offer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {/* Discount Info */}
                      <div className="flex items-center gap-2 text-sm">
                        {offer.discount_type === 'percentage' && (
                          <>
                            <Percent className="h-4 w-4 text-green-600" />
                            <span className="font-semibold text-green-600">{offer.discount_value}% OFF</span>
                          </>
                        )}
                        {offer.discount_type === 'fixed_amount' && (
                          <>
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <span className="font-semibold text-green-600">{formatPrice(offer.discount_value || 0)} OFF</span>
                          </>
                        )}
                        {offer.discount_type === 'bogo' && (
                          <span className="font-semibold text-green-600">Buy One Get One</span>
                        )}
                        {offer.discount_type === 'bundle_price' && (
                          <span className="font-semibold text-green-600">Bundle Deal</span>
                        )}
                      </div>

                      {/* Date Range */}
                      {(offer.starts_at || offer.ends_at) && (
                        <div className="flex items-center gap-2 text-xs text-neutral-500">
                          <Clock className="h-3 w-3" />
                          <span>
                            {offer.starts_at ? new Date(offer.starts_at).toLocaleDateString() : 'Now'}
                            {' - '}
                            {offer.ends_at ? new Date(offer.ends_at).toLocaleDateString() : 'Ongoing'}
                          </span>
                        </div>
                      )}

                      {/* Status */}
                      <div className="flex items-center justify-between pt-2">
                        <Badge variant={offer.is_active ? 'default' : 'secondary'}>
                          {offer.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        {offer.badge_text && (
                          <span 
                            className="text-xs font-semibold px-2 py-1 rounded"
                            style={{ backgroundColor: offer.badge_text ? '#f59e0b' : undefined, color: 'white' }}
                          >
                            {offer.badge_text}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Menu Settings</CardTitle>
              <CardDescription>Configure master menu properties</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Menu Name</label>
                  <p className="text-sm text-neutral-600 mt-1">{menu.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <p className="text-sm text-neutral-600 mt-1">{menu.description || 'No description'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Currency</label>
                  <p className="text-sm text-neutral-600 mt-1">{menu.currency}</p>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Status:</label>
                  <Badge variant={menu.is_active ? 'default' : 'secondary'}>
                    {menu.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Default Menu:</label>
                  <Badge variant={menu.is_default ? 'default' : 'outline'}>
                    {menu.is_default ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium">Last Synced</label>
                  <p className="text-sm text-neutral-600 mt-1">
                    {menu.last_synced_at ? new Date(menu.last_synced_at).toLocaleString() : 'Never'}
                  </p>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <h3 className="font-medium mb-2">Statistics</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-neutral-600">Categories</p>
                    <p className="text-2xl font-bold">{menu.categories?.length || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-600">Total Items</p>
                    <p className="text-2xl font-bold">
                      {menu.categories?.reduce((sum, cat) => sum + (cat.items?.length || 0), 0) || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-600">Active Offers</p>
                    <p className="text-2xl font-bold">
                      {menu.offers?.filter(o => o.is_active).length || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-600">Featured Items</p>
                    <p className="text-2xl font-bold">
                      {menu.categories?.reduce((sum, cat) => 
                        sum + (cat.items?.filter(i => i.is_featured).length || 0), 0
                      ) || 0}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <CategoryDialog
        open={categoryDialog.open}
        onOpenChange={(open: boolean) => setCategoryDialog({ ...categoryDialog, open })}
        category={categoryDialog.category}
        franchiseId={franchiseId}
        menuId={menu.id}
        onSuccess={handleCategorySuccess}
      />

      <ItemDialog
        open={itemDialog.open}
        onOpenChange={(open: boolean) => setItemDialog({ ...itemDialog, open })}
        item={itemDialog.item}
        categoryId={itemDialog.categoryId}
        franchiseId={franchiseId}
        menuId={menu.id}
        currency={menu.currency}
        onSuccess={handleItemSuccess}
      />

      <OfferDialog
        open={offerDialog.open}
        onOpenChange={(open: boolean) => setOfferDialog({ ...offerDialog, open })}
        offer={offerDialog.offer}
        franchiseId={franchiseId}
        menuId={menu.id}
        currency={menu.currency}
        onSuccess={handleOfferSuccess}
      />

      <SyncDialog
        open={syncDialog}
        onOpenChange={setSyncDialog}
        franchiseId={franchiseId}
        menuId={menu.id}
        menuName={menu.name}
        onSync={handleSyncAll}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialog?.open} onOpenChange={(open) => !open && setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {deleteDialog?.type === 'category' ? 'Category' : deleteDialog?.type === 'item' ? 'Item' : 'Offer'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteDialog?.name}"? 
              {deleteDialog?.type === 'category' && ' All items in this category will also be deleted.'}
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
