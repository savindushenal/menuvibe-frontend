'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBag, Search, Star, MapPin, Phone, Clock, 
  X, Plus, Minus, Menu as MenuIcon, Fish, Waves
} from 'lucide-react';

/**
 * Isso Seafood Template
 * 
 * Premium seafood restaurant template with:
 * - Ocean-themed header with brand greeting
 * - Seafood-focused category navigation
 * - Grid menu layout with premium seafood imagery
 * - Coral/ocean color scheme
 * - Product details with customization
 */

interface MenuItem {
  id: number;
  name: string;
  price: number;
  description?: string;
  image_url?: string;
  is_available?: boolean;
  variations?: any[];
}

interface Category {
  id: number;
  name: string;
  icon?: string;
  description?: string;
  items: MenuItem[];
}

interface CartItem {
  item: MenuItem;
  quantity: number;
}

export default function IssoSeafoodTemplate({ code }: { code: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isProductSheetOpen, setIsProductSheetOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchMenuData();
  }, [code]);

  const fetchMenuData = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      const response = await fetch(`${apiUrl}/public/menu/endpoint/${code}`);
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
        // Set first category as active
        if (result.data.menu?.categories?.length > 0) {
          setActiveCategory(result.data.menu.categories[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to load menu:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FF6B35 0%, #004E89 100%)' }}>
        <div className="text-center text-white">
          <Waves className="w-12 h-12 animate-pulse mx-auto mb-4" />
          <p className="text-lg">Loading menu...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <X className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Menu Not Found</h2>
          <p className="text-gray-600">This menu link may be expired or invalid.</p>
        </div>
      </div>
    );
  }

  const franchise = data.franchise || {};
  const designTokens = franchise.design_tokens || {};
  const colors = designTokens.colors || {
    primary: '#FF6B35',
    secondary: '#004E89',
    accent: '#F77F00',
    background: '#FFFFFF',
    text: '#2C3E50',
    textLight: '#718096',
  };
  const brand = designTokens.brand || {};
  const contact = designTokens.contact || {};
  const location = data.location || {};
  const currency = 'LKR';

  // Access menu structure same as barista template
  const categories: Category[] = data.menu?.categories || [];
  
  const addToCart = (item: MenuItem) => {
    const existingItem = cart.find(ci => ci.item.id === item.id);
    if (existingItem) {
      setCart(cart.map(ci => 
        ci.item.id === item.id 
          ? { ...ci, quantity: ci.quantity + 1 }
          : ci
      ));
    } else {
      setCart([...cart, { item, quantity: 1 }]);
    }
  };

  const removeFromCart = (itemId: number) => {
    setCart(cart.filter(ci => ci.item.id !== itemId));
  };

  const updateQuantity = (itemId: number, delta: number) => {
    setCart(cart.map(ci => {
      if (ci.item.id === itemId) {
        const newQuantity = ci.quantity + delta;
        return newQuantity > 0 ? { ...ci, quantity: newQuantity } : ci;
      }
      return ci;
    }).filter(ci => ci.quantity > 0));
  };

  // Ensure price is a number
  const cartTotal = cart.reduce((sum, ci) => {
    const price = typeof ci.item.price === 'number' ? ci.item.price : parseFloat(ci.item.price) || 0;
    return sum + (price * ci.quantity);
  }, 0);
  const cartCount = cart.reduce((sum, ci) => sum + ci.quantity, 0);

  const activeItems = categories
    .find(cat => cat.id === activeCategory)?.items || [];

  const filteredItems = searchQuery
    ? activeItems.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : activeItems;

  // Helper function to safely format price
  const formatPrice = (price: any): string => {
    const numPrice = typeof price === 'number' ? price : parseFloat(price) || 0;
    return numPrice.toFixed(2);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
      {/* Header with Ocean Gradient */}
      <header 
        className="sticky top-0 z-40 backdrop-blur-lg border-b"
        style={{ 
          background: `linear-gradient(135deg, ${colors.primary}15 0%, ${colors.secondary}15 100%)`,
          borderColor: `${colors.primary}30`
        }}
      >
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Brand Logo */}
            <div className="flex items-center gap-3">
              {brand.logo ? (
                <img src={brand.logo} alt={brand.name} className="h-12 w-auto" />
              ) : (
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: colors.primary }}
                >
                  <Fish className="w-6 h-6 text-white" />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold" style={{ color: colors.text }}>
                  {brand.name || franchise.name || 'Seafood Menu'}
                </h1>
                {brand.tagline && (
                  <p className="text-sm" style={{ color: colors.textLight }}>
                    {brand.tagline}
                  </p>
                )}
              </div>
            </div>

            {/* Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-3 rounded-full transition-all hover:scale-105"
              style={{ backgroundColor: colors.primary }}
            >
              <ShoppingBag className="w-6 h-6 text-white" />
              {cartCount > 0 && (
                <span 
                  className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: colors.accent }}
                >
                  {cartCount}
                </span>
              )}
            </button>
          </div>

          {/* Greeting & Location */}
          {(brand.greeting || location.name) && (
            <div className="mt-4 flex items-center justify-between">
              {brand.greeting && (
                <p className="text-lg font-medium" style={{ color: colors.text }}>
                  {brand.greeting}
                </p>
              )}
              {location.name && (
                <div className="flex items-center gap-2 text-sm" style={{ color: colors.textLight }}>
                  <MapPin className="w-4 h-4" />
                  <span>{location.name}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Search Bar */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: colors.textLight }} />
          <input
            type="text"
            placeholder="Search menu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2"
            style={{ 
              borderColor: `${colors.primary}30`,
              backgroundColor: 'white'
            }}
          />
        </div>
      </div>

      {/* Category Navigation */}
      <div className="sticky top-[120px] z-30 bg-white/95 backdrop-blur-lg border-b shadow-sm" style={{ borderColor: `${colors.primary}20` }}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto py-4 scrollbar-hide">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`flex-shrink-0 px-6 py-3 rounded-full font-medium transition-all whitespace-nowrap ${
                  activeCategory === category.id ? 'text-white shadow-lg' : 'hover:scale-105'
                }`}
                style={{
                  backgroundColor: activeCategory === category.id ? colors.primary : `${colors.primary}10`,
                  color: activeCategory === category.id ? 'white' : colors.text,
                }}
              >
                {category.icon && <span className="mr-2">{category.icon}</span>}
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredItems.map((item) => (
              <motion.div
                key={item.id}
                layout
                className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all cursor-pointer group"
                onClick={() => {
                  setSelectedItem(item);
                  setIsProductSheetOpen(true);
                }}
              >
                {/* Item Image */}
                {item.image_url && (
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div 
                      className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity"
                      style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)` }}
                    />
                  </div>
                )}

                {/* Item Details */}
                <div className="p-5">
                  <h3 className="text-lg font-bold mb-2" style={{ color: colors.text }}>
                    {item.name}
                  </h3>
                  {item.description && (
                    <p className="text-sm mb-3 line-clamp-2" style={{ color: colors.textLight }}>
                      {item.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold" style={{ color: colors.primary }}>
                      {currency} {formatPrice(item.price)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(item);
                      }}
                      className="p-2 rounded-full transition-all hover:scale-110"
                      style={{ backgroundColor: colors.primary }}
                    >
                      <Plus className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <Fish className="w-16 h-16 mx-auto mb-4" style={{ color: colors.textLight }} />
            <p className="text-lg" style={{ color: colors.textLight }}>
              No items found
            </p>
          </div>
        )}
      </div>

      {/* Product Sheet */}
      <AnimatePresence>
        {isProductSheetOpen && selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsProductSheetOpen(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30 }}
              className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Product Image */}
              {selectedItem.image_url && (
                <div className="relative h-64 w-full">
                  <img
                    src={selectedItem.image_url}
                    alt={selectedItem.name}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => setIsProductSheetOpen(false)}
                    className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}

              <div className="p-6">
                <h2 className="text-2xl font-bold mb-2" style={{ color: colors.text }}>
                  {selectedItem.name}
                </h2>
                {selectedItem.description && (
                  <p className="text-base mb-4" style={{ color: colors.textLight }}>
                    {selectedItem.description}
                  </p>
                )}
                <p className="text-3xl font-bold mb-6" style={{ color: colors.primary }}>
                  {currency} {formatPrice(selectedItem.price)}
                </p>

                <button
                  onClick={() => {
                    addToCart(selectedItem);
                    setIsProductSheetOpen(false);
                  }}
                  className="w-full py-4 rounded-xl font-bold text-white text-lg transition-all hover:scale-[1.02]"
                  style={{ backgroundColor: colors.primary }}
                >
                  Add to Cart
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Sheet */}
      <AnimatePresence>
        {isCartOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsCartOpen(false)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30 }}
              className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Cart Header */}
              <div 
                className="sticky top-0 z-10 p-6 flex items-center justify-between border-b"
                style={{ backgroundColor: colors.primary }}
              >
                <h2 className="text-2xl font-bold text-white">Your Cart</h2>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>

              {/* Cart Items */}
              <div className="p-6 space-y-4">
                {cart.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingBag className="w-16 h-16 mx-auto mb-4" style={{ color: colors.textLight }} />
                    <p style={{ color: colors.textLight }}>Your cart is empty</p>
                  </div>
                ) : (
                  <>
                    {cart.map((cartItem) => (
                      <div key={cartItem.item.id} className="flex gap-4 p-4 bg-gray-50 rounded-xl">
                        {cartItem.item.image_url && (
                          <img
                            src={cartItem.item.image_url}
                            alt={cartItem.item.name}
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold" style={{ color: colors.text }}>
                            {cartItem.item.name}
                          </h3>
                          <p className="text-sm" style={{ color: colors.primary }}>
                            {currency} {formatPrice(cartItem.item.price)}
                          </p>
                          <div className="flex items-center gap-3 mt-2">
                            <button
                              onClick={() => updateQuantity(cartItem.item.id, -1)}
                              className="p-1 rounded-full"
                              style={{ backgroundColor: `${colors.primary}20` }}
                            >
                              <Minus className="w-4 h-4" style={{ color: colors.primary }} />
                            </button>
                            <span className="font-semibold w-8 text-center">
                              {cartItem.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(cartItem.item.id, 1)}
                              className="p-1 rounded-full"
                              style={{ backgroundColor: colors.primary }}
                            >
                              <Plus className="w-4 h-4 text-white" />
                            </button>
                            <button
                              onClick={() => removeFromCart(cartItem.item.id)}
                              className="ml-auto text-red-500 hover:text-red-700"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Cart Total */}
                    <div className="border-t pt-4 mt-6">
                      <div className="flex justify-between text-xl font-bold mb-4">
                        <span style={{ color: colors.text }}>Total:</span>
                        <span style={{ color: colors.primary }}>
                          {currency} {formatPrice(cartTotal)}
                        </span>
                      </div>
                      <button
                        className="w-full py-4 rounded-xl font-bold text-white text-lg transition-all hover:scale-[1.02]"
                        style={{ backgroundColor: colors.primary }}
                      >
                        Checkout
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer - Contact Info */}
      {contact && Object.keys(contact).length > 0 && (
        <footer className="mt-12 border-t" style={{ borderColor: `${colors.primary}20` }}>
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
              {contact.address && (
                <div className="flex items-center justify-center md:justify-start gap-3">
                  <MapPin className="w-5 h-5 flex-shrink-0" style={{ color: colors.primary }} />
                  <span style={{ color: colors.textLight }}>{contact.address}</span>
                </div>
              )}
              {contact.phone && (
                <div className="flex items-center justify-center md:justify-start gap-3">
                  <Phone className="w-5 h-5 flex-shrink-0" style={{ color: colors.primary }} />
                  <span style={{ color: colors.textLight }}>{contact.phone}</span>
                </div>
              )}
              {contact.hours && (
                <div className="flex items-center justify-center md:justify-start gap-3">
                  <Clock className="w-5 h-5 flex-shrink-0" style={{ color: colors.primary }} />
                  <span style={{ color: colors.textLight }}>{contact.hours}</span>
                </div>
              )}
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
