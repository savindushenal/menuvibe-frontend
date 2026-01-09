'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart,
  Plus,
  Minus,
  X,
  Star,
  Flame,
  Leaf,
  Phone,
  Globe,
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

// Default icon
const DEFAULT_ITEM_ICON = '🍽️';

interface MinimalMenuTemplateProps {
  menuData: PublicMenuData;
}

export function MinimalMenuTemplate({ menuData }: MinimalMenuTemplateProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PublicMenuItem | null>(null);
  const [selectedVariation, setSelectedVariation] = useState<{ name: string; price: number } | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>(
    menuData.categories?.[0]?.name || 'All'
  );

  const design = getColorTheme(menuData.template.settings);
  const symbol = getCurrencySymbol(menuData.template.currency);

  // Get all items for the active category
  const activeItems = useMemo(() => {
    if (activeCategory === 'All') {
      return menuData.categories?.flatMap((cat) => cat.items) || [];
    }
    const category = menuData.categories?.find((cat) => cat.name === activeCategory);
    return category?.items || [];
  }, [menuData, activeCategory]);

  const handleItemClick = (item: PublicMenuItem) => {
    if (item.variations && item.variations.length > 0) {
      setSelectedItem(item);
      setSelectedVariation(null);
    } else {
      addToCart(item);
    }
  };

  const addToCartWithVariation = (item: PublicMenuItem, variation: { name: string; price: number } | null) => {
    if (!isItemAvailable(item, menuData.overrides)) return;
    setCart((prev) => {
      const existing = prev.find((i) => 
        i.item.id === item.id && 
        ((!i.selectedVariation && !variation) || (i.selectedVariation?.name === variation?.name))
      );
      if (existing) {
        return prev.map((i) =>
          (i.item.id === item.id && 
           ((!i.selectedVariation && !variation) || (i.selectedVariation?.name === variation?.name)))
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { item, quantity: 1, selectedVariation: variation }];
    });
    setSelectedItem(null);
    setSelectedVariation(null);
  };

  const addToCart = (item: PublicMenuItem) => {
    addToCartWithVariation(item, null);
  };

  const removeFromCart = (itemId: number, variation: { name: string; price: number } | null = null) => {
    setCart((prev) => {
      const existing = prev.find((i) => 
        i.item.id === itemId &&
        ((!i.selectedVariation && !variation) || (i.selectedVariation?.name === variation?.name))
      );
      if (existing && existing.quantity > 1) {
        return prev.map((i) =>
          (i.item.id === itemId &&
           ((!i.selectedVariation && !variation) || (i.selectedVariation?.name === variation?.name)))
            ? { ...i, quantity: i.quantity - 1 }
            : i
        );
      }
      return prev.filter((i) => 
        !(i.item.id === itemId &&
          ((!i.selectedVariation && !variation) || (i.selectedVariation?.name === variation?.name)))
      );
    });
  };

  const getCartTotal = () => {
    return cart.reduce(
      (sum, cartItem) => {
        const price = cartItem.selectedVariation?.price || getItemPrice(cartItem.item, menuData.overrides);
        return sum + price * cartItem.quantity;
      },
      0
    );
  };

  const getCartCount = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  const getCartItem = (itemId: number) => {
    const itemsInCart = cart.filter((c) => c.item.id === itemId);
    if (itemsInCart.length === 0) return null;
    const totalQuantity = itemsInCart.reduce((sum, item) => sum + item.quantity, 0);
    return { ...itemsInCart[0], quantity: totalQuantity };
  };

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ backgroundColor: design.bg }}>
      {/* Minimal Header with Business Info */}
      <header className="sticky top-0 z-40 backdrop-blur-md border-b" style={{ backgroundColor: design.bg + 'ee' }}>
        <div className="max-w-3xl mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              {menuData.business?.logo_url || menuData.template.image_url ? (
                <img 
                  src={menuData.business?.logo_url || menuData.template.image_url || ''} 
                  alt={menuData.business?.name || menuData.template.name}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg object-cover flex-shrink-0"
                />
              ) : (
                <div 
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm sm:text-base flex-shrink-0"
                  style={{ backgroundColor: menuData.business?.primary_color || design.accent }}
                >
                  {(menuData.business?.name || menuData.template.name).charAt(0)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h1 className="text-base sm:text-lg md:text-xl font-bold truncate" style={{ color: design.text }}>
                  {menuData.business?.name || menuData.template.name}
                </h1>
                {/* Show branch name if different from business name */}
                {menuData.business?.branch_name && menuData.business.branch_name !== menuData.business.name ? (
                  <p className="text-xs sm:text-sm font-medium opacity-80 truncate" style={{ color: design.text }}>
                    {menuData.business.branch_name}
                  </p>
                ) : (
                  <p className="text-xs sm:text-sm opacity-60 flex items-center gap-1 truncate" style={{ color: design.text }}>
                    {menuData.business?.cuisine_type ? (
                      <><UtensilsCrossed className="w-3 h-3 flex-shrink-0" /> <span className="truncate">{menuData.business.cuisine_type}</span></>
                    ) : (
                      <span className="truncate">{menuData.endpoint.name}</span>
                    )}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 sm:p-2.5 md:p-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: design.card, color: design.text }}
            >
              <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
              {getCartCount() > 0 && (
                <span 
                  className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full text-white text-[10px] sm:text-xs flex items-center justify-center"
                  style={{ backgroundColor: design.accent }}
                >
                  {getCartCount()}
                </span>
              )}
            </button>
          </div>
          {/* Quick contact links */}
          {menuData.business && (menuData.business.phone || menuData.business.website) && (
            <div className="hidden sm:flex gap-2 mt-2">
              {menuData.business.phone && (
                <a href={`tel:${menuData.business.phone}`} className="flex items-center gap-1 text-xs opacity-60" style={{ color: design.text }}>
                  <Phone className="w-3 h-3" /> {menuData.business.phone}
                </a>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Category Pills */}
      <nav className="max-w-3xl mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4">
        <div className="flex overflow-x-auto gap-2 scrollbar-hide">
          {menuData.categories?.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.name)}
              className={`flex-shrink-0 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all whitespace-nowrap`}
              style={
                activeCategory === category.name
                  ? { backgroundColor: design.accent, color: 'white' }
                  : { backgroundColor: design.card, color: design.text }
              }
            >
              {category.icon && <span className="mr-1">{category.icon}</span>}
              {category.name}
            </button>
          ))}
        </div>
      </nav>

      {/* Grid Menu */}
      <main className="max-w-3xl mx-auto px-3 sm:px-4 md:px-6 pb-24 sm:pb-28 md:pb-32">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {activeItems.map((item) => {
            const available = isItemAvailable(item, menuData.overrides);
            const price = getItemPrice(item, menuData.overrides);
            const cartItem = getCartItem(item.id);

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`rounded-2xl overflow-hidden shadow-sm ${!available ? 'opacity-50' : ''}`}
                style={{ backgroundColor: design.card }}
              >
                {/* Image/Icon */}
                <div className="relative aspect-square">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div 
                      className="w-full h-full flex items-center justify-center text-6xl"
                      style={{ backgroundColor: design.bg }}
                    >
                      {item.icon || DEFAULT_ITEM_ICON}
                    </div>
                  )}
                  
                  {/* Badges */}
                  <div className="absolute top-2 left-2 flex gap-1">
                    {item.is_featured && (
                      <span className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center">
                        <Star className="w-3 h-3 text-white fill-white" />
                      </span>
                    )}
                    {item.is_spicy && (
                      <span className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                        <Flame className="w-3 h-3 text-white" />
                      </span>
                    )}
                    {item.dietary_info?.includes('vegetarian') && (
                      <span className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                        <Leaf className="w-3 h-3 text-white" />
                      </span>
                    )}
                  </div>

                  {/* Quick Add Button */}
                  {available && (
                    <div className="absolute bottom-2 right-2">
                      {cartItem ? (
                        <div 
                          className="flex items-center gap-1 rounded-full px-2 py-1"
                          style={{ backgroundColor: design.accent }}
                        >
                          <button
                            onClick={() => {
                              if (item.variations && item.variations.length > 0) {
                                setSelectedItem(item);
                                setSelectedVariation(null);
                              } else {
                                removeFromCart(item.id);
                              }
                            }}
                            className="w-6 h-6 rounded-full flex items-center justify-center text-white hover:bg-white/20"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-5 text-center text-white text-sm font-medium">
                            {cartItem.quantity}
                          </span>
                          <button
                            onClick={() => handleItemClick(item)}
                            className="w-6 h-6 rounded-full flex items-center justify-center text-white hover:bg-white/20"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleItemClick(item)}
                          className="w-9 h-9 rounded-full flex items-center justify-center text-white shadow-lg"
                          style={{ backgroundColor: design.accent }}
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="p-3">
                  <h3 className="font-semibold text-sm line-clamp-1" style={{ color: design.text }}>
                    {item.name}
                  </h3>
                  {item.description && (
                    <p className="text-xs opacity-50 line-clamp-1 mt-0.5" style={{ color: design.text }}>
                      {item.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-bold" style={{ color: design.accent }}>
                      {symbol}{formatPrice(price)}
                    </span>
                    {item.compare_at_price && Number(item.compare_at_price) > price && (
                      <span className="text-xs line-through opacity-40" style={{ color: design.text }}>
                        {symbol}{formatPrice(item.compare_at_price)}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </main>

      {/* Bottom Sheet Cart Button */}
      {getCartCount() > 0 && !isCartOpen && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4" style={{ backgroundColor: design.bg }}>
          <div className="max-w-3xl mx-auto">
            <button
              onClick={() => setIsCartOpen(true)}
              className="w-full py-4 px-6 rounded-2xl flex items-center justify-between text-white shadow-xl"
              style={{ backgroundColor: design.accent }}
            >
              <div className="flex items-center gap-3">
                <ShoppingCart className="w-5 h-5" />
                <span className="font-medium">{getCartCount()} items</span>
              </div>
              <span className="font-bold">{symbol}{formatPrice(getCartTotal())}</span>
            </button>
          </div>
        </div>
      )}

      {/* Cart Bottom Sheet */}
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
              className="fixed bottom-0 left-0 right-0 rounded-t-3xl z-50 max-h-[80vh] overflow-hidden"
              style={{ backgroundColor: design.card }}
            >
              <div className="w-12 h-1 bg-neutral-300 rounded-full mx-auto mt-3" />
              
              <div className="p-4 flex items-center justify-between">
                <h2 className="text-lg font-bold" style={{ color: design.text }}>Cart</h2>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 rounded-full hover:bg-neutral-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 overflow-y-auto max-h-[45vh]">
                {cart.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="opacity-50" style={{ color: design.text }}>Empty cart</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cart.map((cartItem) => (
                      <div 
                        key={cartItem.item.id} 
                        className="flex items-center gap-3 p-2 rounded-xl"
                        style={{ backgroundColor: design.bg }}
                      >
                        {cartItem.item.image_url ? (
                          <img
                            src={cartItem.item.image_url}
                            alt={cartItem.item.name}
                            className="w-14 h-14 rounded-lg object-cover"
                          />
                        ) : cartItem.item.icon ? (
                          <div className="w-14 h-14 rounded-lg bg-neutral-200 flex items-center justify-center text-2xl">
                            {cartItem.item.icon}
                          </div>
                        ) : (
                          <div className="w-14 h-14 rounded-lg bg-neutral-200" />
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm truncate" style={{ color: design.text }}>
                            {cartItem.item.name}
                          </h3>
                          {cartItem.selectedVariation && (
                            <p className="text-xs opacity-60" style={{ color: design.text }}>
                              {cartItem.selectedVariation.name}
                            </p>
                          )}
                          <p className="text-sm font-bold" style={{ color: design.accent }}>
                            {symbol}{formatPrice(cartItem.selectedVariation?.price || getItemPrice(cartItem.item, menuData.overrides))}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => removeFromCart(cartItem.item.id, cartItem.selectedVariation || null)}
                            className="w-7 h-7 rounded-full flex items-center justify-center border"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center text-sm font-bold">{cartItem.quantity}</span>
                          <button
                            onClick={() => addToCartWithVariation(cartItem.item, cartItem.selectedVariation || null)}
                            className="w-7 h-7 rounded-full flex items-center justify-center text-white"
                            style={{ backgroundColor: design.accent }}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-4 border-t">
                  <div className="flex items-center justify-between mb-4">
                    <span style={{ color: design.text }}>Total</span>
                    <span className="text-xl font-bold" style={{ color: design.accent }}>
                      {symbol}{formatPrice(getCartTotal())}
                    </span>
                  </div>
                  <button
                    className="w-full py-4 rounded-xl text-white font-medium"
                    style={{ backgroundColor: design.accent }}
                  >
                    Checkout
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Variation Modal */}
      <AnimatePresence>
        {selectedItem && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setSelectedItem(null)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 max-h-[80vh] overflow-y-auto rounded-t-3xl"
              style={{ backgroundColor: design.card }}
            >
              <div className="p-4 border-b flex items-center justify-between sticky top-0 z-10" style={{ backgroundColor: design.card }}>
                <h2 className="text-lg font-bold" style={{ color: design.text }}>{selectedItem.name}</h2>
                <button onClick={() => setSelectedItem(null)} className="p-2 rounded-full hover:bg-neutral-100">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4">
                {selectedItem.image_url && (
                  <img src={selectedItem.image_url} alt={selectedItem.name} className="w-full h-40 object-cover rounded-lg mb-4" />
                )}
                
                {selectedItem.description && (
                  <p className="text-sm opacity-70 mb-4" style={{ color: design.text }}>{selectedItem.description}</p>
                )}

                {selectedItem.variations && selectedItem.variations.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold mb-3" style={{ color: design.text }}>Choose Your Option</h3>
                    <div className="space-y-2">
                      {selectedItem.variations.map((variation, idx) => {
                        const inCart = cart.find(c => c.item.id === selectedItem.id && c.selectedVariation?.name === variation.name);
                        return (
                          <button
                            key={idx}
                            onClick={() => setSelectedVariation(variation)}
                            disabled={variation.is_available === false}
                            className={`w-full p-3 rounded-lg border-2 transition-all ${
                              variation.is_available === false ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                            }`}
                            style={{
                              borderColor: selectedVariation?.name === variation.name ? design.accent : design.bg,
                              backgroundColor: selectedVariation?.name === variation.name ? design.accent + '10' : design.bg,
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-medium" style={{ color: design.text }}>{variation.name}</span>
                                {inCart && (
                                  <span className="px-2 py-0.5 rounded-full text-xs font-medium text-white" style={{ backgroundColor: design.accent }}>
                                    {inCart.quantity} in cart
                                  </span>
                                )}
                              </div>
                              <span className="font-bold" style={{ color: design.accent }}>
                                {symbol}{formatPrice(variation.price)}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="sticky bottom-0 pt-4 border-t" style={{ backgroundColor: design.card }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-semibold" style={{ color: design.text }}>Total</span>
                    <span className="text-2xl font-bold" style={{ color: design.accent }}>
                      {symbol}{formatPrice(selectedVariation?.price || getItemPrice(selectedItem, menuData.overrides))}
                    </span>
                  </div>
                  <button
                    onClick={() => addToCartWithVariation(selectedItem, selectedVariation)}
                    disabled={!!(selectedItem.variations && selectedItem.variations.length > 0 && !selectedVariation)}
                    className="w-full py-4 rounded-lg text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: design.accent }}
                  >
                    {selectedItem.variations && selectedItem.variations.length > 0 && !selectedVariation
                      ? 'Please select an option'
                      : 'Add to Cart'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Scrollbar styles */}
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
