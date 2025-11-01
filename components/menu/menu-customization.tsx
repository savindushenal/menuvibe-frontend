'use client';

import { useState, useCallback } from 'react';
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
import { formatPrice } from '@/lib/currency';
import { getImageUrl } from '@/lib/utils';
import { MENU_TEMPLATES, MenuTemplate, MenuStyle } from '@/lib/menu-templates';
import { Spinner } from '@/components/loading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  GripVertical,
  Palette,
  Image as ImageIcon,
  Layout,
  Settings,
  Plus,
  Edit,
  Trash2,
  Eye,
  Save,
  RotateCcw,
  Upload,
  X,
} from 'lucide-react';
import { Menu, MenuItem } from '@/lib/types';
import { MenuItemForm } from './menu-item-form';
import { InlineFeatureBlock } from '@/components/subscription/inline-feature-block';
import { useSubscription } from '@/contexts/subscription-context';

interface MenuCustomizationProps {
  menu: Menu;
  businessLogo?: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (menu: Menu) => Promise<void>;
  onAddItem: (data: any, image?: File) => Promise<MenuItem | void>;
  onUpdateItem: (itemId: number, data: any, image?: File) => Promise<void>;
  onDeleteItem: (itemId: number) => Promise<void>;
  onReorderItems: (items: MenuItem[]) => Promise<void>;
  onOpenCategoryManager: () => void;
}

interface SortableMenuItemProps {
  item: MenuItem;
  onEdit: (item: MenuItem) => void;
  onDelete: (itemId: number) => void;
  menuStyle: MenuStyle;
}

function SortableMenuItem({ item, onEdit, onDelete, menuStyle }: SortableMenuItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const cardClass = `
    ${menuStyle.card_style === 'modern' ? 'bg-white/90 backdrop-blur-sm border-0 shadow-lg' : ''}
    ${menuStyle.card_style === 'classic' ? 'bg-amber-50 border-amber-200' : ''}
    ${menuStyle.card_style === 'minimal' ? 'bg-white border-neutral-200' : ''}
    ${menuStyle.card_style === 'elegant' ? 'bg-neutral-50 border-neutral-300 shadow-sm' : ''}
  `;

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card className={`${cardClass} hover:shadow-md transition-shadow duration-200`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div
              {...listeners}
              className="mt-1 cursor-grab active:cursor-grabbing text-neutral-400 hover:text-neutral-600"
            >
              <GripVertical className="h-5 w-5" />
            </div>

            {menuStyle.show_images && item.image_url && (
              <div className="w-16 h-16 rounded-md overflow-hidden bg-neutral-100 flex-shrink-0">
                <img 
                  src={getImageUrl(item.image_url)} 
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 
                    className="font-medium mb-1 text-sm"
                    style={{ color: menuStyle.text_color }}
                  >
                    {item.name}
                  </h4>
                  
                  {menuStyle.show_descriptions && item.description && (
                    <p 
                      className="text-xs opacity-75 mb-2 line-clamp-2"
                      style={{ color: menuStyle.text_color }}
                    >
                      {item.description}
                    </p>
                  )}

                  <div className="flex items-center gap-2 mb-2">
                    {menuStyle.show_prices && (
                      <span 
                        className="font-semibold text-sm"
                        style={{ color: menuStyle.accent_color }}
                      >
                        {formatPrice(item.price, item.currency)}
                      </span>
                    )}
                    
                    {item.preparation_time && (
                      <span className="text-xs text-neutral-500">
                        {item.preparation_time} min
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1">
                    <Badge variant={item.is_available ? "default" : "secondary"} className="text-xs">
                      {item.is_available ? 'Available' : 'Unavailable'}
                    </Badge>
                    
                    {item.is_featured && (
                      <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                        Featured
                      </Badge>
                    )}
                    
                    {item.is_spicy && (
                      <Badge variant="destructive" className="text-xs">
                        🌶️ Spicy
                      </Badge>
                    )}

                    {menuStyle.show_dietary_info && item.dietary_info?.map((diet) => (
                      <Badge key={diet} variant="outline" className="text-xs">
                        {diet}
                      </Badge>
                    ))}

                    {menuStyle.show_allergens && item.allergens?.map((allergen) => (
                      <Badge key={allergen} variant="destructive" className="text-xs">
                        {allergen}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex gap-1 ml-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onEdit(item)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-600 hover:text-red-700"
                    onClick={() => onDelete(item.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function MenuCustomization({
  menu,
  businessLogo,
  isOpen,
  onClose,
  onSave,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onReorderItems,
  onOpenCategoryManager,
}: MenuCustomizationProps) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>(menu.menu_items || []);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [isItemFormOpen, setIsItemFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState<number | null>(null);
  const [menuStyle, setMenuStyle] = useState<MenuStyle>(MENU_TEMPLATES[0].style); // Default to Modern template
  
  const [backgroundImage, setBackgroundImage] = useState<File | null>(null);
  const [backgroundPreview, setBackgroundPreview] = useState<string>('');
  
  const { subscription } = useSubscription();

  // Check if user is near menu item limit
  const getMenuItemLimitInfo = () => {
    const maxItems = subscription?.plan?.limits?.max_menu_items_per_menu || 10;
    const currentItems = menuItems.length;
    const isNearLimit = currentItems >= maxItems * 0.8; // 80% of limit
    const isAtLimit = currentItems >= maxItems;
    
    return { maxItems, currentItems, isNearLimit, isAtLimit };
  };

  const { maxItems, currentItems, isNearLimit, isAtLimit } = getMenuItemLimitInfo();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  }, []);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = menuItems.findIndex(item => item.id === active.id);
      const newIndex = menuItems.findIndex(item => item.id === over.id);
      
      const newItems = arrayMove(menuItems, oldIndex, newIndex);
      setMenuItems(newItems);
      
      try {
        setReordering(true);
        await onReorderItems(newItems);
      } catch (error) {
        console.error('Error reordering items:', error);
        // Revert on error
        setMenuItems(menuItems);
      } finally {
        setReordering(false);
      }
    }
    
    setActiveId(null);
  }, [menuItems, onReorderItems]);

  const handleAddItem = () => {
    setEditingItem(null);
    setIsItemFormOpen(true);
  };

  const handleEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setIsItemFormOpen(true);
  };

  const handleDeleteItem = async (itemId: number) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    try {
      setDeletingItemId(itemId);
      await onDeleteItem(itemId);
      setMenuItems(prev => prev.filter(item => item.id !== itemId));
    } catch (error) {
      console.error('Error deleting item:', error);
    } finally {
      setDeletingItemId(null);
    }
  };

  const handleItemSubmit = async (data: any, image?: File) => {
    try {
      if (editingItem) {
        await onUpdateItem(editingItem.id, data, image);
        setMenuItems(prev => prev.map(item => 
          item.id === editingItem.id ? { ...item, ...data } : item
        ));
      } else {
        const newItem = await onAddItem(data, image);
        if (newItem && typeof newItem === 'object') {
          setMenuItems(prev => [...prev, newItem]);
        }
      }
      setIsItemFormOpen(false);
      setEditingItem(null);
    } catch (error) {
      console.error('Error saving item:', error);
      // Don't close the form on error to allow retry
    }
  };

  const handleBackgroundImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBackgroundImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBackgroundPreview(reader.result as string);
        setMenuStyle((prev: MenuStyle) => ({ 
          ...prev, 
          background_type: 'image',
          background_image: reader.result as string 
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeBackgroundImage = () => {
    setBackgroundImage(null);
    setBackgroundPreview('');
    setMenuStyle((prev: MenuStyle) => ({ 
      ...prev, 
      background_type: 'color',
      background_image: '' 
    }));
  };

  const getMenuPreviewStyle = () => {
    const baseStyle: React.CSSProperties = {
      fontFamily: menuStyle.font_family,
      color: menuStyle.text_color,
      borderRadius: `${menuStyle.border_radius}px`,
      gap: `${menuStyle.spacing}px`,
    };

    if (menuStyle.background_type === 'color') {
      baseStyle.backgroundColor = menuStyle.background_color;
    } else if (menuStyle.background_type === 'gradient') {
      baseStyle.background = menuStyle.background_gradient;
    } else if (menuStyle.background_type === 'image' && menuStyle.background_image) {
      baseStyle.backgroundImage = `url(${menuStyle.background_image})`;
      baseStyle.backgroundSize = 'cover';
      baseStyle.backgroundPosition = 'center';
    }

    return baseStyle;
  };

  const activeItem = menuItems.find(item => item.id === activeId);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Customize Menu: {menu.name}
            </DialogTitle>
          </DialogHeader>

          <div className="flex h-[80vh]">
            {/* Customization Panel */}
            <div className="w-80 border-r border-neutral-200 overflow-y-auto">
              <Tabs defaultValue="items" className="h-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="items">Items</TabsTrigger>
                  <TabsTrigger value="style">Templates</TabsTrigger>
                </TabsList>

                <div className="p-4 space-y-4">
                  <TabsContent value="items" className="space-y-4 mt-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Menu Items</h3>
                      {isAtLimit ? (
                        <InlineFeatureBlock
                          feature="menu_items"
                          requiredPlan="pro"
                          blockType="replace"
                          title="Upgrade to Add More Items"
                          description={`You've reached your limit of ${maxItems} menu items`}
                          className="w-full"
                        />
                      ) : (
                        <Button 
                          size="sm" 
                          onClick={handleAddItem}
                          className="bg-emerald-600 hover:bg-emerald-700"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Item
                        </Button>
                      )}
                    </div>

                    {isNearLimit && !isAtLimit && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p className="text-sm text-yellow-800">
                          ⚠️ You're using {currentItems} of {maxItems} menu items. 
                          <Button 
                            variant="link" 
                            className="text-yellow-700 p-0 h-auto font-medium ml-1"
                            onClick={() => window.location.href = '/dashboard/subscription'}
                          >
                            Upgrade to Pro
                          </Button> 
                          for unlimited items.
                        </p>
                      </div>
                    )}

                    <div className="text-sm text-neutral-600">
                      Drag items to reorder them in your menu
                    </div>

                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={menuItems.map(item => item.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-2">
                          {menuItems.map((item) => (
                            <SortableMenuItem
                              key={item.id}
                              item={item}
                              onEdit={handleEditItem}
                              onDelete={handleDeleteItem}
                              menuStyle={menuStyle}
                            />
                          ))}
                        </div>
                      </SortableContext>

                      <DragOverlay>
                        {activeItem && (
                          <SortableMenuItem
                            item={activeItem}
                            onEdit={handleEditItem}
                            onDelete={handleDeleteItem}
                            menuStyle={menuStyle}
                          />
                        )}
                      </DragOverlay>
                    </DndContext>
                  </TabsContent>

                  <TabsContent value="style" className="space-y-6 mt-0">
                    {/* Template Selector */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Choose a Template</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {MENU_TEMPLATES.map((template) => (
                          <button
                            key={template.id}
                            onClick={() => setMenuStyle(template.style)}
                            className="p-4 border-2 rounded-lg hover:border-primary transition-colors text-left"
                          >
                            <div className="text-3xl mb-2">{template.preview}</div>
                            <div className="font-semibold text-sm">{template.name}</div>
                            <div className="text-xs text-neutral-600">{template.description}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Simple Customization Options */}
                    <div className="space-y-4 pt-4 border-t">
                      <h3 className="text-sm font-semibold">Customize</h3>
                      
                      <div>
                        <Label className="text-sm">Primary Color</Label>
                        <input
                          type="color"
                          value={menuStyle.primary_color || '#3B82F6'}
                          onChange={(e) => setMenuStyle((prev: MenuStyle) => ({ ...prev, primary_color: e.target.value }))}
                          className="w-full h-10 rounded cursor-pointer"
                        />
                      </div>

                      <div>
                        <Label className="text-sm">Background Color</Label>
                        <input
                          type="color"
                          value={menuStyle.background_color || '#FFFFFF'}
                          onChange={(e) => setMenuStyle((prev: MenuStyle) => ({ ...prev, background_color: e.target.value }))}
                          className="w-full h-10 rounded cursor-pointer"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Show Images</Label>
                        <Switch
                          checked={menuStyle.show_images}
                          onCheckedChange={(checked) => 
                            setMenuStyle((prev: MenuStyle) => ({ ...prev, show_images: checked }))
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Show Prices</Label>
                        <Switch
                          checked={menuStyle.show_prices}
                          onCheckedChange={(checked) => 
                            setMenuStyle((prev: MenuStyle) => ({ ...prev, show_prices: checked }))
                          }
                        />
                      </div>
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </div>

            {/* Preview Panel */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Menu Preview</h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={saving || reordering}>
                    <Eye className="h-4 w-4 mr-1" />
                    Preview
                  </Button>
                  <Button 
                    size="sm" 
                    className="bg-emerald-600 hover:bg-emerald-700"
                    onClick={async () => {
                      try {
                        setSaving(true);
                        await onSave({ ...menu, menu_items: menuItems });
                      } catch (error) {
                        console.error('Error saving menu:', error);
                      } finally {
                        setSaving(false);
                      }
                    }}
                    disabled={saving || reordering}
                  >
                    {saving && <Spinner size="sm" className="mr-1 border-white border-t-transparent" />}
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>

              <div 
                className="min-h-96 p-6 rounded-lg border"
                style={getMenuPreviewStyle()}
              >
                <div className="mb-6">
                  {businessLogo ? (
                    <div className="mb-4">
                      <img 
                        src={businessLogo.startsWith('http') ? businessLogo : `http://localhost:8000${businessLogo}`}
                        alt="Business Logo" 
                        className="h-16 object-contain"
                        style={{ maxWidth: '200px' }}
                      />
                    </div>
                  ) : (
                    <h1 
                      className="font-bold mb-2"
                      style={{ 
                        color: menuStyle.text_color,
                        fontSize: `${menuStyle.title_font_size || 32}px`
                      }}
                    >
                      {menu.name}
                    </h1>
                  )}
                  {menu.description && (
                    <p 
                      className="opacity-75"
                      style={{ 
                        color: menuStyle.text_color,
                        fontSize: `${menuStyle.description_font_size || 14}px`
                      }}
                    >
                      {menu.description}
                    </p>
                  )}
                </div>

                {/* Group items by category */}
                {menu.categories && menu.categories.length > 0 ? (
                  <div className="space-y-8">
                    {menu.categories
                      .filter(category => category.is_active)
                      .map((category) => {
                        const categoryItems = menuItems.filter(item => item.category_id === category.id);
                        if (categoryItems.length === 0) return null;

                        return (
                          <div key={category.id} className="space-y-4">
                            {/* Category Header */}
                            <div className="border-b-2 pb-2">
                              <h2 
                                className="font-bold"
                                style={{ 
                                  color: menuStyle.text_color,
                                  fontSize: `${menuStyle.category_font_size || 24}px`
                                }}
                              >
                                {category.name}
                              </h2>
                              {category.description && (
                                <p 
                                  className="text-sm mt-1 opacity-75"
                                  style={{ 
                                    color: menuStyle.text_color,
                                    fontSize: `${menuStyle.description_font_size || 14}px`
                                  }}
                                >
                                  {category.description}
                                </p>
                              )}
                            </div>

                            {/* Category Items */}
                            <div 
                              className={`
                                ${menuStyle.layout === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : ''}
                                ${menuStyle.layout === 'list' ? 'space-y-4' : ''}
                                ${menuStyle.layout === 'masonry' ? 'columns-1 md:columns-2 lg:columns-3' : ''}
                              `}
                              style={{ gap: `${menuStyle.spacing}px` }}
                            >
                              {categoryItems.map((item) => (
                                <div
                                  key={item.id}
                                  className={`
                                    ${menuStyle.layout === 'masonry' ? 'break-inside-avoid mb-4' : ''}
                                    ${menuStyle.card_style === 'modern' ? 'bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-lg' : ''}
                                    ${menuStyle.card_style === 'classic' ? 'bg-amber-50 border border-amber-200 rounded-md' : ''}
                                    ${menuStyle.card_style === 'minimal' ? 'bg-white border border-neutral-200 rounded' : ''}
                                    ${menuStyle.card_style === 'elegant' ? 'bg-neutral-50 border border-neutral-300 shadow-sm rounded-lg' : ''}
                                    p-4 hover:shadow-md transition-shadow duration-200
                                  `}
                                  style={{ borderRadius: `${menuStyle.border_radius}px` }}
                                >
                                  <div className="flex gap-3">
                                    {menuStyle.show_images && item.image_url && (
                                      <div className="w-16 h-16 rounded-md overflow-hidden bg-neutral-100 flex-shrink-0">
                                        <img 
                                          src={getImageUrl(item.image_url)} 
                                          alt={item.name}
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                    )}

                                    <div className="flex-1">
                                      <h4 
                                        className="font-medium mb-1"
                                        style={{ 
                                          color: menuStyle.text_color,
                                          fontSize: `${menuStyle.item_name_font_size || 16}px`
                                        }}
                                      >
                                        {item.name}
                                      </h4>
                                      
                                      {menuStyle.show_descriptions && item.description && (
                                        <p 
                                          className="opacity-75 mb-2"
                                          style={{ 
                                            color: menuStyle.text_color,
                                            fontSize: `${menuStyle.description_font_size || 14}px`
                                          }}
                                        >
                                          {item.description}
                                        </p>
                                      )}

                                      <div className="flex items-center gap-2 mb-2">
                                        {menuStyle.show_prices && (
                                          <span 
                                            className="font-semibold"
                                            style={{ 
                                              color: menuStyle.accent_color,
                                              fontSize: `${menuStyle.price_font_size || 16}px`
                                            }}
                                          >
                                            {formatPrice(item.price, item.currency)}
                                          </span>
                                        )}
                                        
                                        {item.preparation_time && (
                                          <span className="text-sm text-neutral-500">
                                            {item.preparation_time} min
                                          </span>
                                        )}
                                      </div>

                                      <div className="flex flex-wrap gap-1">
                                        <Badge variant={item.is_available ? "default" : "secondary"} className="text-xs">
                                          {item.is_available ? 'Available' : 'Unavailable'}
                                        </Badge>
                                        
                                        {item.is_featured && (
                                          <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                                            Featured
                                          </Badge>
                                        )}
                                        
                                        {item.is_spicy && (
                                          <Badge variant="destructive" className="text-xs">
                                            🌶️ Spicy
                                          </Badge>
                                        )}

                                        {menuStyle.show_dietary_info && item.dietary_info?.map((diet) => (
                                          <Badge key={diet} variant="outline" className="text-xs">
                                            {diet}
                                          </Badge>
                                        ))}

                                        {menuStyle.show_allergens && item.allergens?.map((allergen) => (
                                          <Badge key={allergen} variant="destructive" className="text-xs">
                                            {allergen}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <div 
                    className={`
                      ${menuStyle.layout === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : ''}
                      ${menuStyle.layout === 'list' ? 'space-y-4' : ''}
                      ${menuStyle.layout === 'masonry' ? 'columns-1 md:columns-2 lg:columns-3' : ''}
                    `}
                    style={{ gap: `${menuStyle.spacing}px` }}
                  >
                    {menuItems.map((item) => (
                      <div
                        key={item.id}
                        className={`
                          ${menuStyle.layout === 'masonry' ? 'break-inside-avoid mb-4' : ''}
                          ${menuStyle.card_style === 'modern' ? 'bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-lg' : ''}
                          ${menuStyle.card_style === 'classic' ? 'bg-amber-50 border border-amber-200 rounded-md' : ''}
                          ${menuStyle.card_style === 'minimal' ? 'bg-white border border-neutral-200 rounded' : ''}
                          ${menuStyle.card_style === 'elegant' ? 'bg-neutral-50 border border-neutral-300 shadow-sm rounded-lg' : ''}
                          p-4 hover:shadow-md transition-shadow duration-200
                        `}
                        style={{ borderRadius: `${menuStyle.border_radius}px` }}
                      >
                        <div className="flex gap-3">
                          {menuStyle.show_images && item.image_url && (
                            <div className="w-16 h-16 rounded-md overflow-hidden bg-neutral-100 flex-shrink-0">
                              <img 
                                src={getImageUrl(item.image_url)} 
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}

                          <div className="flex-1">
                            <h4 
                              className="font-medium mb-1"
                              style={{ 
                                color: menuStyle.text_color,
                                fontSize: `${menuStyle.item_name_font_size || 16}px`
                              }}
                            >
                              {item.name}
                            </h4>
                            
                            {menuStyle.show_descriptions && item.description && (
                              <p 
                                className="opacity-75 mb-2"
                                style={{ 
                                  color: menuStyle.text_color,
                                  fontSize: `${menuStyle.description_font_size || 14}px`
                                }}
                              >
                                {item.description}
                              </p>
                            )}

                            <div className="flex items-center gap-2 mb-2">
                              {menuStyle.show_prices && (
                                <span 
                                  className="font-semibold"
                                  style={{ 
                                    color: menuStyle.accent_color,
                                    fontSize: `${menuStyle.price_font_size || 16}px`
                                  }}
                                >
                                  {formatPrice(item.price, item.currency)}
                                </span>
                              )}
                              
                              {item.preparation_time && (
                                <span className="text-sm text-neutral-500">
                                  {item.preparation_time} min
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap gap-1">
                              <Badge variant={item.is_available ? "default" : "secondary"} className="text-xs">
                                {item.is_available ? 'Available' : 'Unavailable'}
                              </Badge>
                              
                              {item.is_featured && (
                                <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                                  Featured
                                </Badge>
                              )}
                              
                              {item.is_spicy && (
                                <Badge variant="destructive" className="text-xs">
                                  🌶️ Spicy
                                </Badge>
                              )}

                              {menuStyle.show_dietary_info && item.dietary_info?.map((diet) => (
                                <Badge key={diet} variant="outline" className="text-xs">
                                  {diet}
                                </Badge>
                              ))}

                              {menuStyle.show_allergens && item.allergens?.map((allergen) => (
                                <Badge key={allergen} variant="destructive" className="text-xs">
                                  {allergen}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div 
                  className={`
                    ${menuStyle.layout === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : ''}
                    ${menuStyle.layout === 'list' ? 'space-y-4' : ''}
                    ${menuStyle.layout === 'masonry' ? 'columns-1 md:columns-2 lg:columns-3' : ''}
                  `}
                  style={{ gap: `${menuStyle.spacing}px`, display: 'none' }}
                >
                  {menuItems.map((item) => (
                    <div key={item.id} style={{ display: 'none' }}></div>
                  ))}
                </div>

                {menuItems.length === 0 && (
                  <div className="text-center py-12">
                    <ImageIcon className="h-12 w-12 mx-auto mb-4 text-neutral-300" />
                    <p className="text-neutral-500 mb-4">No items in this menu yet</p>
                    <Button onClick={handleAddItem} className="bg-emerald-600 hover:bg-emerald-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Item
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Menu Item Form Dialog */}
      <MenuItemForm
        menuId={menu.id}
        item={editingItem}
        categories={menu.categories || []}
        isOpen={isItemFormOpen}
        onClose={() => {
          setIsItemFormOpen(false);
          setEditingItem(null);
        }}
        onSubmit={handleItemSubmit}
        onCreateCategory={onOpenCategoryManager}
      />
    </>
  );
}