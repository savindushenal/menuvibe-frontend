'use client';

import { useState } from 'react';
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
  Star,
  TableProperties,
  ChevronDown,
  Phone,
  Globe,
  MapPin,
  UtensilsCrossed,
} from 'lucide-react';
import {
  PublicMenuData,
  PublicMenuItem,
  CartItem,
  getColorTheme,
  getCurrencySymbol,
  getItemPrice,
  isItemAvailable,
  formatPrice,
} from './types';

// Default icons
const DEFAULT_ITEM_ICON = '🍽️';
const DEFAULT_CATEGORY_ICON = '📋';

interface StandardTemplateProps {
  menuData: PublicMenuData;
}

export function StandardTemplate({ menuData }: StandardTemplateProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<number | null>(
    menuData.categories[0]?.id || null
  );
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(
    new Set(menuData.categories[0] ? [menuData.categories[0].id] : [])
  );

  const design = getColorTheme(menuData.template.settings);
  const symbol = getCurrencySymbol(menuData.template.currency);

  const addToCart = (item: PublicMenuItem) => {
    if (!isItemAvailable(item, menuData.overrides)) return;
    setCart((prev) => {
      const existing = prev.find((i) => i.item.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.item.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { item, quantity: 1, selectedVariation: null }];
    });
  };

  const removeFromCart = (itemId: number) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.item.id === itemId);
      if (existing && existing.quantity > 1) {
        return prev.map((i) =>
          i.item.id === itemId ? { ...i, quantity: i.quantity - 1 } : i
        );
      }
      return prev.filter((i) => i.item.id !== itemId);
    });
  };

  const getCartTotal = () => {
    return cart.reduce(
      (sum, cartItem) =>
        sum + getItemPrice(cartItem.item, menuData.overrides) * cartItem.quantity,
      0
    );
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

  const getCartItem = (itemId: number) => {
    return cart.find((c) => c.item.id === itemId);
  };

  return (
    <div
      className="min-h-screen pb-24"
      style={{ backgroundColor: design.bg, color: design.text }}
    >
      {/* Header with Business Info */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/80 border-b">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {menuData.business?.logo_url || menuData.template.image_url ? (
                <img 
                  src={menuData.business?.logo_url || menuData.template.image_url || ''} 
                  alt={menuData.business?.name || menuData.template.name}
                  className="w-10 h-10 rounded-lg object-cover"
                />
              ) : (
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: menuData.business?.primary_color || design.accent }}
                >
                  {(menuData.business?.name || menuData.template.name).charAt(0)}
                </div>
              )}
              <div>
                <h1 className="text-lg font-bold">{menuData.business?.name || menuData.template.name}</h1>
                <div className="flex items-center gap-2 text-sm text-neutral-500">
                  {menuData.business?.cuisine_type ? (
                    <>
                      <UtensilsCrossed className="w-3 h-3" />
                      <span>{menuData.business.cuisine_type}</span>
                    </>
                  ) : (
                    <>
                      <TableProperties className="w-4 h-4" />
                      <span>{menuData.endpoint.name}</span>
                    </>
                  )}
                </div>
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
          
          {/* Business Contact Quick Links */}
          {menuData.business && (menuData.business.phone || menuData.business.website) && (
            <div className="flex gap-2 mt-2">
              {menuData.business.phone && (
                <a 
                  href={`tel:${menuData.business.phone}`}
                  className="flex items-center gap-1 px-2 py-1 rounded-full text-xs"
                  style={{ backgroundColor: design.accent + '15', color: design.accent }}
                >
                  <Phone className="w-3 h-3" />
                  Call
                </a>
              )}
              {menuData.business.website && (
                <a 
                  href={menuData.business.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-2 py-1 rounded-full text-xs"
                  style={{ backgroundColor: design.accent + '15', color: design.accent }}
                >
                  <Globe className="w-3 h-3" />
                  Website
                </a>
              )}
            </div>
          )}
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
                      const available = isItemAvailable(item, menuData.overrides);
                      const price = getItemPrice(item, menuData.overrides);
                      const cartItem = getCartItem(item.id);

                      return (
                        <div
                          key={item.id}
                          className={`flex gap-4 p-3 rounded-xl transition-colors ${
                            available ? '' : 'opacity-50'
                          }`}
                          style={{ backgroundColor: design.card }}
                        >
                          {/* Image/Icon */}
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
                            />
                          ) : (
                            <div 
                              className="w-24 h-24 rounded-lg flex-shrink-0 flex items-center justify-center text-4xl"
                              style={{ backgroundColor: design.bg }}
                            >
                              {item.icon || DEFAULT_ITEM_ICON}
                            </div>
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
                                  {symbol}{formatPrice(price)}
                                </span>
                                {item.compare_at_price && Number(item.compare_at_price) > price && (
                                  <span className="ml-2 text-sm text-neutral-400 line-through">
                                    {symbol}{formatPrice(item.compare_at_price)}
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
                <span className="font-bold">{symbol}{formatPrice(getCartTotal())}</span>
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
                    {cart.map((cartItem) => (
                      <div key={cartItem.item.id} className="flex items-center gap-4">
                        {cartItem.item.image_url ? (
                          <img
                            src={cartItem.item.image_url}
                            alt={cartItem.item.name}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                        ) : cartItem.item.icon ? (
                          <div className="w-16 h-16 rounded-lg bg-neutral-100 flex items-center justify-center text-2xl">
                            {cartItem.item.icon}
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-neutral-100" />
                        )}
                        <div className="flex-1">
                          <h3 className="font-medium">{cartItem.item.name}</h3>
                          <p className="text-sm" style={{ color: design.accent }}>
                            {symbol}{formatPrice(getItemPrice(cartItem.item, menuData.overrides))}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => removeFromCart(cartItem.item.id)}
                            className="w-8 h-8 rounded-full flex items-center justify-center border"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-6 text-center">{cartItem.quantity}</span>
                          <button
                            onClick={() => addToCart(cartItem.item)}
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
                      {symbol}{formatPrice(getCartTotal())}
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
