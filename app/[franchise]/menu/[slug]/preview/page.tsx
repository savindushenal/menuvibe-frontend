'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Loader2, ChefHat, ShoppingCart, Plus, Minus, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';

interface MenuItem {
  id: number;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  is_featured: boolean;
  category_id: number;
}

interface MenuCategory {
  id: number;
  name: string;
  description: string | null;
  sort_order: number;
  items: MenuItem[];
}

interface MasterMenu {
  id: number;
  name: string;
  description: string | null;
  currency: string;
  image_url: string | null;
  categories: MenuCategory[];
}

interface CartItem extends MenuItem {
  quantity: number;
}

export default function MasterMenuPreviewPage() {
  const params = useParams();
  const franchiseSlug = params?.franchise as string;
  const menuSlug = params?.slug as string;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menu, setMenu] = useState<MasterMenu | null>(null);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    fetchMenuData();
  }, [franchiseSlug, menuSlug]);

  const fetchMenuData = async () => {
    try {
      setLoading(true);
      // First get franchise ID
      const franchiseRes = await api.get(`/franchise/${franchiseSlug}/dashboard`);
      if (!franchiseRes.data.success) {
        throw new Error('Franchise not found');
      }
      
      const franchiseId = franchiseRes.data.data.franchise.id;
      
      // Get all master menus and find by slug
      const menusRes = await api.get(`/franchises/${franchiseId}/master-menus`);
      if (!menusRes.data.success) {
        throw new Error('Failed to load menus');
      }
      
      const foundMenu = menusRes.data.data.find((m: any) => m.slug === menuSlug);
      if (!foundMenu) {
        throw new Error('Menu not found');
      }
      
      // Get full menu with categories and items
      const menuRes = await api.get(`/franchises/${franchiseId}/master-menus/${foundMenu.id}`);
      if (menuRes.data.success) {
        setMenu(menuRes.data.data);
        if (menuRes.data.data.categories?.length > 0) {
          setActiveCategory(menuRes.data.data.categories[0].id);
        }
      }
    } catch (err: any) {
      console.error('Failed to load menu:', err);
      setError(err.message || 'Failed to load menu');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: menu?.currency || 'USD',
    }).format(price);
  };

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: number) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === itemId);
      if (existing && existing.quantity > 1) {
        return prev.map(i => i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i);
      }
      return prev.filter(i => i.id !== itemId);
    });
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const filteredCategories = menu?.categories?.map(cat => ({
    ...cat,
    items: cat.items.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(cat => cat.items.length > 0) || [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50 to-white">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-amber-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading menu preview...</p>
        </div>
      </div>
    );
  }

  if (error || !menu) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-red-50 to-white">
        <div className="text-center">
          <ChefHat className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Menu Not Found</h2>
          <p className="text-gray-600">{error || 'The requested menu could not be loaded.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      {/* Preview Banner */}
      <div className="bg-amber-600 text-white text-center py-2 text-sm font-medium">
        🔍 Preview Mode - This is how your menu will appear to customers
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{menu.name}</h1>
              {menu.description && (
                <p className="text-sm text-gray-500 mt-1">{menu.description}</p>
              )}
            </div>
            <button
              onClick={() => setCartOpen(true)}
              className="relative p-2 bg-amber-100 rounded-full hover:bg-amber-200 transition-colors"
            >
              <ShoppingCart className="w-6 h-6 text-amber-700" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          </div>

          {/* Search */}
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-50 border-gray-200"
            />
          </div>

          {/* Category Tabs */}
          {menu.categories.length > 0 && !searchQuery && (
            <div className="flex gap-2 overflow-x-auto mt-4 pb-2 -mx-4 px-4">
              {menu.categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    activeCategory === cat.id
                      ? 'bg-amber-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Menu Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {searchQuery ? (
          // Search Results
          <div className="space-y-6">
            {filteredCategories.map((category) => (
              <div key={category.id}>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">{category.name}</h2>
                <div className="space-y-3">
                  {category.items.map((item) => (
                    <MenuItemCard
                      key={item.id}
                      item={item}
                      formatPrice={formatPrice}
                      onAdd={() => addToCart(item)}
                      cartQuantity={cart.find(i => i.id === item.id)?.quantity || 0}
                    />
                  ))}
                </div>
              </div>
            ))}
            {filteredCategories.length === 0 && (
              <div className="text-center py-12">
                <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No items found for "{searchQuery}"</p>
              </div>
            )}
          </div>
        ) : (
          // Category View
          <div className="space-y-3">
            {menu.categories
              .find(c => c.id === activeCategory)
              ?.items.map((item) => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  formatPrice={formatPrice}
                  onAdd={() => addToCart(item)}
                  cartQuantity={cart.find(i => i.id === item.id)?.quantity || 0}
                />
              ))}
          </div>
        )}
      </main>

      {/* Cart Summary Bar */}
      {cart.length > 0 && !cartOpen && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-0 left-0 right-0 bg-amber-600 text-white p-4 shadow-lg"
        >
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <div>
              <span className="font-semibold">{cartCount} items</span>
              <span className="mx-2">•</span>
              <span>{formatPrice(cartTotal)}</span>
            </div>
            <Button
              onClick={() => setCartOpen(true)}
              className="bg-white text-amber-600 hover:bg-gray-100"
            >
              View Cart
            </Button>
          </div>
        </motion.div>
      )}

      {/* Cart Drawer */}
      <AnimatePresence>
        {cartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-50"
              onClick={() => setCartOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-50 shadow-xl"
            >
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between p-4 border-b">
                  <h2 className="text-lg font-semibold">Your Order</h2>
                  <button onClick={() => setCartOpen(false)}>
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                  {cart.length === 0 ? (
                    <div className="text-center py-12">
                      <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">Your cart is empty</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {cart.map((item) => (
                        <div key={item.id} className="flex items-center gap-4 bg-gray-50 rounded-lg p-3">
                          {item.image_url && (
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="w-16 h-16 rounded-lg object-cover"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium truncate">{item.name}</h3>
                            <p className="text-sm text-gray-600">{formatPrice(item.price)}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-6 text-center font-medium">{item.quantity}</span>
                            <button
                              onClick={() => addToCart(item)}
                              className="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center hover:bg-amber-700"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {cart.length > 0 && (
                  <div className="border-t p-4 space-y-4">
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total</span>
                      <span>{formatPrice(cartTotal)}</span>
                    </div>
                    <Button className="w-full bg-amber-600 hover:bg-amber-700">
                      Place Order (Preview Only)
                    </Button>
                    <p className="text-xs text-center text-gray-500">
                      This is a preview. Orders cannot be placed in preview mode.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// Menu Item Card Component
function MenuItemCard({ 
  item, 
  formatPrice, 
  onAdd, 
  cartQuantity 
}: { 
  item: MenuItem; 
  formatPrice: (price: number) => string; 
  onAdd: () => void; 
  cartQuantity: number;
}) {
  return (
    <motion.div
      layout
      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="flex">
        <div className="flex-1 p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0 pr-4">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
                {item.is_featured && (
                  <Badge className="bg-amber-100 text-amber-700 text-xs">Popular</Badge>
                )}
              </div>
              {item.description && (
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.description}</p>
              )}
              <p className="font-semibold text-amber-600 mt-2">{formatPrice(item.price)}</p>
            </div>
          </div>
        </div>
        
        {item.image_url && (
          <div className="relative w-28 h-28 flex-shrink-0">
            <img
              src={item.image_url}
              alt={item.name}
              className="w-full h-full object-cover"
            />
            {!item.is_available && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-white text-xs font-medium">Sold Out</span>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="px-4 pb-4">
        {item.is_available ? (
          cartQuantity > 0 ? (
            <div className="flex items-center justify-center gap-4 bg-amber-50 rounded-lg py-2">
              <button
                onClick={() => {/* handled in parent */}}
                className="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center hover:bg-amber-700"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="font-semibold text-amber-700">{cartQuantity}</span>
              <button
                onClick={onAdd}
                className="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center hover:bg-amber-700"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Button 
              onClick={onAdd}
              className="w-full bg-amber-600 hover:bg-amber-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add to Order
            </Button>
          )
        ) : (
          <Button disabled className="w-full">
            Sold Out
          </Button>
        )}
      </div>
    </motion.div>
  );
}
