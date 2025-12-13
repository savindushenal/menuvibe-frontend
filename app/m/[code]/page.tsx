'use client';

import { useEffect, useState, use, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  ShoppingCart,
  Plus,
  Minus,
  X,
  Tag,
  Clock,
  Flame,
  Leaf,
  AlertTriangle,
  Star,
  TableProperties,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import { apiClient } from '@/lib/api';

interface MenuItem {
  id: number;
  name: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  image_url: string | null;
  is_available: boolean;
  is_featured: boolean;
  is_spicy: boolean;
  spice_level: number | null;
  allergens: string[] | null;
  dietary_info: string[] | null;
  preparation_time: number | null;
}

interface Category {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
  items: MenuItem[];
}

interface Offer {
  id: number;
  name: string;
  description: string | null;
  type: string;
  discount_type: string;
  discount_value: number;
  image_url: string | null;
}

interface MenuData {
  endpoint: {
    id: number;
    name: string;
    type: string;
    identifier: string;
  };
  template: {
    id: number;
    name: string;
    currency: string;
    settings: any;
  };
  categories: Category[];
  offers: Offer[];
  overrides: Record<number, { price_override?: number; is_available?: boolean }>;
}

interface CartItem extends MenuItem {
  quantity: number;
}

// Menu designs
const menuDesigns: Record<string, { bg: string; text: string; accent: string; card: string }> = {
  modern: { bg: '#F8FAFC', text: '#1E293B', accent: '#3B82F6', card: '#FFFFFF' },
  classic: { bg: '#FEF3C7', text: '#78350F', accent: '#D97706', card: '#FFFBEB' },
  minimal: { bg: '#FFFFFF', text: '#18181B', accent: '#71717A', card: '#F9FAFB' },
  elegant: { bg: '#FAF5FF', text: '#581C87', accent: '#9333EA', card: '#FFFFFF' },
  rustic: { bg: '#FEF2F2', text: '#7F1D1D', accent: '#B91C1C', card: '#FFFBEB' },
  bold: { bg: '#FEF9C3', text: '#7C2D12', accent: '#DC2626', card: '#FFFFFF' },
};

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" />
        <p className="mt-2 text-gray-600">Loading menu...</p>
      </div>
    </div>
  );
}

function PublicMenuContent({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const resolvedParams = use(params);
  const shortCode = resolvedParams.code;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuData, setMenuData] = useState<MenuData | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadMenu();
    recordScan();
  }, [shortCode]);

  const loadMenu = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getPublicMenu(shortCode);
      if (response.success && response.data) {
        setMenuData(response.data);
        // Expand first category by default
        if (response.data.categories?.length > 0) {
          setActiveCategory(response.data.categories[0].id);
          setExpandedCategories(new Set([response.data.categories[0].id]));
        }
      } else {
        setError('Menu not found');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load menu');
    } finally {
      setLoading(false);
    }
  };

  const recordScan = async () => {
    try {
      await apiClient.recordMenuScan(shortCode);
    } catch {
      // Silent fail for analytics
    }
  };

  const getDesign = () => {
    const designName = menuData?.template?.settings?.design || 'modern';
    return menuDesigns[designName] || menuDesigns.modern;
  };

  const getCurrencySymbol = () => {
    const symbols: Record<string, string> = {
      USD: '$', EUR: '€', GBP: '£', JPY: '¥', INR: '₹',
      AUD: 'A$', CAD: 'C$', AED: 'د.إ',
    };
    return symbols[menuData?.template?.currency || 'USD'] || '$';
  };

  const getItemPrice = (item: MenuItem) => {
    const override = menuData?.overrides?.[item.id];
    if (override?.price_override !== undefined) {
      return override.price_override;
    }
    return item.price;
  };

  const isItemAvailable = (item: MenuItem) => {
    const override = menuData?.overrides?.[item.id];
    if (override?.is_available !== undefined) {
      return override.is_available;
    }
    return item.is_available;
  };

  const addToCart = (item: MenuItem) => {
    if (!isItemAvailable(item)) return;
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: number) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === itemId);
      if (existing && existing.quantity > 1) {
        return prev.map((i) =>
          i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i
        );
      }
      return prev.filter((i) => i.id !== itemId);
    });
  };

  const getCartTotal = () => {
    return cart.reduce((sum, item) => sum + getItemPrice(item) * item.quantity, 0);
  };

  const getCartCount = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-neutral-600">Loading menu...</p>
        </div>
      </div>
    );
  }

  if (error || !menuData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-neutral-900 mb-2">Menu Not Found</h1>
          <p className="text-neutral-600">
            {error || 'This menu link may be expired or invalid.'}
          </p>
        </div>
      </div>
    );
  }

  const design = getDesign();
  const symbol = getCurrencySymbol();

  return (
    <div
      className="min-h-screen pb-24"
      style={{ backgroundColor: design.bg, color: design.text }}
    >
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/80 border-b">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold">{menuData.template.name}</h1>
              <div className="flex items-center gap-2 text-sm text-neutral-500">
                <TableProperties className="w-4 h-4" />
                <span>{menuData.endpoint.name}</span>
              </div>
            </div>
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 rounded-full hover:bg-neutral-100"
              style={{ color: design.accent }}
            >
              <ShoppingCart className="w-6 h-6" />
              {getCartCount() > 0 && (
                <span
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-white text-xs flex items-center justify-center"
                  style={{ backgroundColor: design.accent }}
                >
                  {getCartCount()}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Offers Banner */}
      {menuData.offers.length > 0 && (
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {menuData.offers.map((offer) => (
              <div
                key={offer.id}
                className="flex-shrink-0 px-4 py-2 rounded-full flex items-center gap-2"
                style={{ backgroundColor: design.accent + '20', color: design.accent }}
              >
                <Tag className="w-4 h-4" />
                <span className="text-sm font-medium whitespace-nowrap">
                  {offer.name}
                  {offer.discount_type === 'percentage' && ` - ${offer.discount_value}% OFF`}
                  {offer.discount_type === 'fixed' && ` - ${symbol}${offer.discount_value} OFF`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Navigation */}
      <nav className="sticky top-[60px] z-30 bg-white/80 backdrop-blur-md border-b">
        <div className="max-w-lg mx-auto">
          <div className="flex overflow-x-auto py-2 px-4 gap-2 scrollbar-hide">
            {menuData.categories.map((category) => (
              <button
                key={category.id}
                onClick={() => {
                  setActiveCategory(category.id);
                  const element = document.getElementById(`category-${category.id}`);
                  element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeCategory === category.id
                    ? 'text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
                style={
                  activeCategory === category.id
                    ? { backgroundColor: design.accent }
                    : undefined
                }
              >
                {category.icon && <span className="mr-1">{category.icon}</span>}
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Menu Content */}
      <main className="max-w-lg mx-auto px-4 py-4">
        {menuData.categories.map((category) => (
          <section
            key={category.id}
            id={`category-${category.id}`}
            className="mb-6 scroll-mt-32"
          >
            {/* Category Header */}
            <button
              onClick={() => toggleCategory(category.id)}
              className="w-full flex items-center justify-between py-3 border-b"
            >
              <div className="flex items-center gap-2">
                {category.icon && <span className="text-xl">{category.icon}</span>}
                <h2 className="text-lg font-bold">{category.name}</h2>
                <span className="text-sm text-neutral-400">
                  ({category.items.length})
                </span>
              </div>
              <ChevronDown
                className={`w-5 h-5 transition-transform ${
                  expandedCategories.has(category.id) ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Category Items */}
            <AnimatePresence>
              {expandedCategories.has(category.id) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="py-3 space-y-3">
                    {category.items.map((item) => {
                      const available = isItemAvailable(item);
                      const price = getItemPrice(item);
                      const cartItem = cart.find((c) => c.id === item.id);

                      return (
                        <div
                          key={item.id}
                          className={`flex gap-4 p-3 rounded-xl transition-colors ${
                            available ? '' : 'opacity-50'
                          }`}
                          style={{ backgroundColor: design.card }}
                        >
                          {/* Image */}
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-24 h-24 rounded-lg bg-neutral-100 flex-shrink-0" />
                          )}

                          {/* Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h3 className="font-semibold line-clamp-1">{item.name}</h3>
                                <div className="flex items-center gap-2 flex-wrap mt-1">
                                  {item.is_featured && (
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 flex items-center gap-1">
                                      <Star className="w-3 h-3" /> Featured
                                    </span>
                                  )}
                                  {item.is_spicy && (
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 flex items-center gap-1">
                                      <Flame className="w-3 h-3" /> Spicy
                                    </span>
                                  )}
                                  {item.dietary_info?.includes('vegetarian') && (
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 flex items-center gap-1">
                                      <Leaf className="w-3 h-3" /> Veg
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {item.description && (
                              <p className="text-sm text-neutral-500 line-clamp-2 mt-1">
                                {item.description}
                              </p>
                            )}

                            {item.preparation_time && (
                              <div className="flex items-center gap-1 text-xs text-neutral-400 mt-1">
                                <Clock className="w-3 h-3" />
                                {item.preparation_time} min
                              </div>
                            )}

                            <div className="flex items-center justify-between mt-2">
                              <div>
                                <span
                                  className="font-bold text-lg"
                                  style={{ color: design.accent }}
                                >
                                  {symbol}{price.toFixed(2)}
                                </span>
                                {item.compare_at_price && item.compare_at_price > price && (
                                  <span className="ml-2 text-sm text-neutral-400 line-through">
                                    {symbol}{item.compare_at_price.toFixed(2)}
                                  </span>
                                )}
                              </div>

                              {available ? (
                                cartItem ? (
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => removeFromCart(item.id)}
                                      className="w-8 h-8 rounded-full flex items-center justify-center"
                                      style={{ backgroundColor: design.accent + '20', color: design.accent }}
                                    >
                                      <Minus className="w-4 h-4" />
                                    </button>
                                    <span className="w-6 text-center font-medium">
                                      {cartItem.quantity}
                                    </span>
                                    <button
                                      onClick={() => addToCart(item)}
                                      className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                                      style={{ backgroundColor: design.accent }}
                                    >
                                      <Plus className="w-4 h-4" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => addToCart(item)}
                                    className="px-4 py-2 rounded-full text-sm font-medium text-white"
                                    style={{ backgroundColor: design.accent }}
                                  >
                                    Add
                                  </button>
                                )
                              ) : (
                                <span className="text-sm text-neutral-400">Unavailable</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        ))}
      </main>

      {/* Cart Summary Bar */}
      {getCartCount() > 0 && !isCartOpen && (
        <div className="fixed bottom-0 left-0 right-0 z-50">
          <div className="max-w-lg mx-auto px-4 pb-4">
            <button
              onClick={() => setIsCartOpen(true)}
              className="w-full py-4 px-6 rounded-2xl flex items-center justify-between text-white shadow-lg"
              style={{ backgroundColor: design.accent }}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <span className="font-medium">{getCartCount()} items</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold">{symbol}{getCartTotal().toFixed(2)}</span>
                <ChevronRight className="w-5 h-5" />
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setIsCartOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 max-h-[80vh] overflow-hidden"
            >
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold">Your Order</h2>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="p-2 rounded-full hover:bg-neutral-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-4 overflow-y-auto max-h-[50vh]">
                {cart.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                    <p className="text-neutral-500">Your cart is empty</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <div key={item.id} className="flex items-center gap-4">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-neutral-100" />
                        )}
                        <div className="flex-1">
                          <h3 className="font-medium">{item.name}</h3>
                          <p className="text-sm" style={{ color: design.accent }}>
                            {symbol}{getItemPrice(item).toFixed(2)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="w-8 h-8 rounded-full flex items-center justify-center border"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-6 text-center">{item.quantity}</span>
                          <button
                            onClick={() => addToCart(item)}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                            style={{ backgroundColor: design.accent }}
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
                <div className="p-4 border-t bg-neutral-50">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-lg font-medium">Total</span>
                    <span className="text-xl font-bold" style={{ color: design.accent }}>
                      {symbol}{getCartTotal().toFixed(2)}
                    </span>
                  </div>
                  <button
                    className="w-full py-4 rounded-xl text-white font-medium"
                    style={{ backgroundColor: design.accent }}
                  >
                    Place Order
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Custom scrollbar styles */}
      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

export default function PublicMenuPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PublicMenuContent params={params} />
    </Suspense>
  );
}
