'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBag, Search, Star, ChevronRight, Clock, 
  MapPin, Coffee, X, Plus, Minus, Menu as MenuIcon,
  Percent, Tag, Sparkles, Timer, Gift
} from 'lucide-react';
import { useMenuSession } from '@/hooks/useMenuSession';
import { OrderTracker } from '@/components/menu/OrderTracker';

/**
 * Barista Style Template
 * 
 * Premium cafe/coffee shop template with:
 * - Animated header with location bar
 * - Hero section with greeting & stats
 * - Special Offers carousel
 * - Category navigation tabs
 * - Grid menu layout with images
 * - Product sheet for customization
 * - Sliding cart sheet
 */

interface MenuItem {
  id: number;
  name: string;
  price: number;
  description?: string;
  image_url?: string;
  icon?: string;
  rating?: number;
  reviews?: number;
  is_featured?: boolean;
  is_available?: boolean;
}

interface Category {
  id: number;
  name: string;
  icon?: string;
  items: MenuItem[];
}

interface Offer {
  id: number;
  type: string;
  title: string;
  description?: string;
  image_url?: string;
  badge_text?: string;
  badge_color?: string;
  discount_type?: string;
  discount_value?: number;
  bundle_price?: number;
  minimum_order?: number;
  remaining_time?: string;
  terms_conditions?: string;
  is_featured?: boolean;
}

interface CartItem {
  item: MenuItem;
  quantity: number;
}

export default function BaristaStyleTemplate({ code }: { code: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isProductSheetOpen, setIsProductSheetOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const sectionRefs = useRef<Record<number, HTMLElement | null>>({});
  const navRef = useRef<HTMLDivElement>(null);

  const { orders, isPlacingOrder, placeOrder } = useMenuSession(code);

  const handlePlaceOrder = async () => {
    const currency = data?.template?.currency || data?.menu?.currency || 'LKR';
    const items = cart.map(ci => ({
      id: ci.item.id,
      name: ci.item.name,
      quantity: ci.quantity,
      unit_price: ci.item.price,
      selectedVariation: null,
    }));
    const result = await placeOrder(items, currency);
    if (result) { setCart([]); setIsCartOpen(false); }
  };

  useEffect(() => {
    fetchMenuData();
  }, [code]);

  const fetchMenuData = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      const response = await fetch(`${apiUrl}/menu/${code}`);
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
        // Set first category as active for initial highlight
        if (result.data.menu.categories?.length > 0) {
          setActiveCategory(result.data.menu.categories[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to load menu:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const addToCart = (item: MenuItem, quantity: number = 1) => {
    setCart(prev => {
      const existing = prev.find(ci => ci.item.id === item.id);
      if (existing) {
        return prev.map(ci => 
          ci.item.id === item.id ? { ...ci, quantity: ci.quantity + quantity } : ci
        );
      }
      return [...prev, { item, quantity }];
    });
    setIsProductSheetOpen(false);
  };

  const updateQuantity = (itemId: number, delta: number) => {
    setCart(prev => prev.map(ci => {
      if (ci.item.id === itemId) {
        const newQuantity = ci.quantity + delta;
        return newQuantity > 0 ? { ...ci, quantity: newQuantity } : ci;
      }
      return ci;
    }).filter(ci => ci.quantity > 0));
  };

  const cartTotal = cart.reduce((sum, ci) => sum + (ci.item.price * ci.quantity), 0);
  const cartCount = cart.reduce((sum, ci) => sum + ci.quantity, 0);

  // Search-filtered flat list (for search mode only)
  const allItems: MenuItem[] = data?.menu?.categories?.flatMap((c: Category) => c.items) || [];
  const searchResults = searchQuery.trim()
    ? allItems.filter((item: MenuItem) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const featuredItems = data?.menu.categories
    ?.flatMap((c: Category) => c.items)
    .filter((item: MenuItem) => item.is_featured)
    .slice(0, 4);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading menu...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Menu Not Found</h2>
        </div>
      </div>
    );
  }

  const config = data.template.config;
  const colors = config.design.colors;
  const business = data.business || {};
  const currency = data.template.currency || 'Rs.';

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <motion.header 
        className="sticky top-0 z-50 bg-white border-b border-gray-100"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        {/* Location Bar */}
        <div 
          className="text-white px-4 py-1.5"
          style={{ backgroundColor: colors.primary }}
        >
          <div className="flex items-center justify-center gap-2 max-w-7xl mx-auto">
            <MapPin className="w-3.5 h-3.5" style={{ color: colors.accent }} />
            <span className="text-xs font-medium">
              {business.name || data.endpoint?.name}
            </span>
          </div>
        </div>
        
        {/* Main Header */}
        <div className="px-4 py-3">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            {/* Menu Button */}
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors lg:hidden">
              <MenuIcon className="w-6 h-6 text-gray-800" />
            </button>
            
            {/* Logo/Name */}
            <div className="flex items-center gap-2">
              {business.logo_url && (
                <img src={business.logo_url} alt="" className="w-8 h-8 rounded-full" />
              )}
              <span className="font-bold text-lg" style={{ color: colors.primary }}>
                {business.name || 'Menu'}
              </span>
            </div>
            
            {/* Cart */}
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ShoppingBag className="w-6 h-6 text-gray-800" />
              {cartCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-semibold"
                  style={{ backgroundColor: colors.accent || '#ef4444' }}
                >
                  {cartCount}
                </motion.span>
              )}
            </button>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <motion.section 
        className="relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary || colors.primary} 100%)`
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* Ambient glow effects */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-400/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10 px-5 py-5 md:py-12">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-12">
              {/* Main content */}
              <div className="flex-1">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="inline-flex items-center gap-2 mb-2"
                >
                  <Clock className="w-4 h-4 text-white/70" />
                  <span className="text-white font-medium text-sm">Open</span>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                </motion.div>

                <motion.h1 
                  className="text-2xl sm:text-3xl md:text-5xl font-bold text-white"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {getGreeting()}! ☕
                </motion.h1>
                
                <motion.p 
                  className="text-white/80 text-base md:text-xl font-light mt-2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  What would you like today?
                </motion.p>
              </div>

              {/* Stats card - desktop only */}
              <motion.div 
                className="hidden lg:block"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/10 min-w-[200px]">
                  <div className="flex items-center gap-2 mb-4">
                    <Coffee className="w-5 h-5 text-white/80" />
                    <span className="text-white/80 text-sm font-medium">{business.name || 'Menu'}</span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-white">
                        {data.menu.categories?.reduce((sum: number, c: Category) => sum + c.items.length, 0) || 0}+
                      </p>
                      <p className="text-white/50 text-xs uppercase tracking-wider">Items</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">4.9 ★</p>
                      <p className="text-white/50 text-xs uppercase tracking-wider">Rating</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">~5m</p>
                      <p className="text-white/50 text-xs uppercase tracking-wider">Wait</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Mobile Stats */}
            <motion.div 
              className="flex justify-center gap-6 mt-4 lg:hidden"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="text-center">
                <p className="text-xl font-bold text-white">
                  {data.menu.categories?.reduce((sum: number, c: Category) => sum + c.items.length, 0) || 0}+
                </p>
                <p className="text-white/60 text-xs">ITEMS</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-white">4.9 ★</p>
                <p className="text-white/60 text-xs">RATING</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-white">~5m</p>
                <p className="text-white/60 text-xs">WAIT</p>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Special Offers Section */}
      {data.offers && data.offers.length > 0 && (
        <motion.section 
          className="px-4 py-6 bg-gradient-to-b from-gray-50 to-white"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div 
              className="p-2 rounded-xl"
              style={{ backgroundColor: `${colors.accent || '#ef4444'}15` }}
            >
              <Sparkles className="w-5 h-5" style={{ color: colors.accent || '#ef4444' }} />
            </div>
            <h2 className="text-lg md:text-xl font-bold text-gray-800">Special Offers</h2>
          </div>
          
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x">
            {data.offers.map((offer: Offer) => (
              <motion.div
                key={offer.id}
                className="flex-shrink-0 w-72 md:w-80 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden snap-start relative"
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Offer Badge */}
                {offer.badge_text && (
                  <div 
                    className="absolute top-3 left-3 z-10 px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg"
                    style={{ backgroundColor: offer.badge_color || colors.accent || '#ef4444' }}
                  >
                    {offer.badge_text}
                  </div>
                )}
                
                {/* Offer Image or Gradient */}
                <div 
                  className="h-32 md:h-36 relative overflow-hidden"
                  style={{
                    background: offer.image_url 
                      ? undefined 
                      : `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary || colors.primary} 100%)`
                  }}
                >
                  {offer.image_url ? (
                    <img src={offer.image_url} alt={offer.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-white/20 text-6xl">
                        {offer.type === 'discount' && <Percent className="w-16 h-16" />}
                        {offer.type === 'bundle' && <Gift className="w-16 h-16" />}
                        {offer.type === 'bogo' && <Tag className="w-16 h-16" />}
                        {offer.type === 'happy_hour' && <Timer className="w-16 h-16" />}
                        {!['discount', 'bundle', 'bogo', 'happy_hour'].includes(offer.type) && <Sparkles className="w-16 h-16" />}
                      </div>
                    </div>
                  )}
                  
                  {/* Discount Badge Overlay */}
                  {offer.discount_value && (
                    <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-xl shadow-lg">
                      <span className="font-bold text-lg" style={{ color: colors.accent || '#ef4444' }}>
                        {offer.discount_type === 'percentage' 
                          ? `${offer.discount_value}% OFF`
                          : `${currency} ${offer.discount_value} OFF`
                        }
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Offer Content */}
                <div className="p-4">
                  <h3 className="font-bold text-gray-800 text-base line-clamp-1">{offer.title}</h3>
                  {offer.description && (
                    <p className="text-gray-500 text-sm mt-1 line-clamp-2">{offer.description}</p>
                  )}
                  
                  {/* Offer Details */}
                  <div className="flex items-center gap-3 mt-3 flex-wrap">
                    {offer.bundle_price && (
                      <div className="flex items-center gap-1 text-sm">
                        <Tag className="w-4 h-4 text-gray-400" />
                        <span className="font-semibold" style={{ color: colors.primary }}>
                          {currency} {offer.bundle_price.toLocaleString()}
                        </span>
                      </div>
                    )}
                    
                    {offer.minimum_order && (
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <ShoppingBag className="w-4 h-4" />
                        <span>Min. {currency} {offer.minimum_order.toLocaleString()}</span>
                      </div>
                    )}
                    
                    {offer.remaining_time && (
                      <div className="flex items-center gap-1 text-sm" style={{ color: colors.accent || '#ef4444' }}>
                        <Timer className="w-4 h-4" />
                        <span className="font-medium">{offer.remaining_time}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Terms */}
                  {offer.terms_conditions && (
                    <p className="text-gray-400 text-xs mt-3 line-clamp-1">*{offer.terms_conditions}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Featured Items / Top Picks */}
      {featuredItems && featuredItems.length > 0 && (
        <motion.section 
          className="px-4 py-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-4">Top Picks for You</h2>
          
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x">
            {featuredItems.map((item: MenuItem) => (
              <motion.div
                key={item.id}
                onClick={() => { setSelectedItem(item); setIsProductSheetOpen(true); }}
                className="flex-shrink-0 w-36 md:w-44 bg-white rounded-2xl shadow-sm border border-gray-100 cursor-pointer overflow-hidden snap-start"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="relative h-28 md:h-32 bg-gray-100">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">
                      {item.icon || '☕'}
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-gray-800 text-sm line-clamp-1">{item.name}</h3>
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs text-gray-500">4.9</span>
                  </div>
                  <p className="font-bold mt-1 text-sm" style={{ color: colors.primary }}>
                    {currency} {item.price.toLocaleString()}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Category Navigation */}
      <motion.section 
        className="sticky top-[88px] bg-white z-40 border-b border-gray-100"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex gap-2 overflow-x-auto px-4 py-3">
          {/* All pill */}
          <button
            onClick={() => { setActiveCategory(null); setSearchQuery(''); }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all ${
              activeCategory === null
                ? 'text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            style={{ backgroundColor: activeCategory === null ? colors.primary : undefined }}
          >
            All
          </button>
          {data.menu.categories?.map((category: Category) => (
            <button
              key={category.id}
              onClick={() => { setActiveCategory(category.id); setSearchQuery(''); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                activeCategory === category.id
                  ? 'text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              style={{
                backgroundColor: activeCategory === category.id ? colors.primary : undefined
              }}
            >
              {category.icon && <span>{category.icon}</span>}
              <span className="font-medium text-sm">{category.name}</span>
            </button>
          ))}
        </div>
      </motion.section>

      {/* Menu Sections */}
      <motion.section 
        className="px-4 pb-28"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        {searchQuery.trim() ? (
          /* Search flat list */
          <div className="pt-6">
            <p className="text-sm text-gray-500 mb-4">
              {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for &ldquo;{searchQuery}&rdquo;
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
              {searchResults.map((item: MenuItem, index: number) => (
                <motion.div
                  key={item.id}
                  onClick={() => { setSelectedItem(item); setIsProductSheetOpen(true); }}
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 cursor-pointer hover:shadow-lg transition-shadow"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  whileHover={{ scale: 1.01, y: -2 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="flex gap-4">
                    <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl">{item.icon || '🍽️'}</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-800 text-base line-clamp-1">{item.name}</h3>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.description}</p>
                      <p className="font-bold mt-2 text-base" style={{ color: colors.primary }}>
                        {currency} {item.price.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          /* Category filter active → single section; null → all sections stacked */
          <div className="space-y-10 pt-6">
            {data.menu.categories
              ?.filter((cat: Category) =>
                (activeCategory === null || cat.id === activeCategory) &&
                cat.items.some((i: MenuItem) => i.is_available !== false)
              )
              .map((category: Category) => (
                <div key={category.id}>
                  {/* Section heading */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-1 h-7 rounded-full flex-shrink-0" style={{ backgroundColor: colors.primary }} />
                    <h2 className="text-lg md:text-xl font-bold text-gray-800">{category.name}</h2>
                    <span className="text-sm text-gray-400 font-medium">
                      {category.items.filter((i: MenuItem) => i.is_available !== false).length} items
                    </span>
                  </div>
                  {/* Items list */}
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
                    {category.items.filter((i: MenuItem) => i.is_available !== false).map((item: MenuItem, index: number) => (
                      <motion.div
                        key={item.id}
                        onClick={() => { setSelectedItem(item); setIsProductSheetOpen(true); }}
                        className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 cursor-pointer hover:shadow-lg transition-shadow"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.04 }}
                        whileHover={{ scale: 1.01, y: -2 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        <div className="flex gap-4">
                          <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                            {item.image_url ? (
                              <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-3xl">{item.icon || '🍽️'}</div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <h3 className="font-semibold text-gray-800 text-base line-clamp-1">{item.name}</h3>
                              <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 hidden md:block" />
                            </div>
                            <div className="flex items-center gap-1 mt-1">
                              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-xs text-gray-500">4.9</span>
                            </div>
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.description}</p>
                            <p className="font-bold mt-2 text-base" style={{ color: colors.primary }}>
                              {currency} {item.price.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </motion.section>

      {/* Product Sheet */}
      <AnimatePresence>
        {isProductSheetOpen && selectedItem && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsProductSheetOpen(false)}
              className="fixed inset-0 bg-black/50 z-50"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 max-h-[90vh] overflow-y-auto"
            >
              {/* Product Image */}
              <div className="relative h-56 bg-gray-100">
                {selectedItem.image_url ? (
                  <img src={selectedItem.image_url} alt={selectedItem.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-6xl">
                    {selectedItem.icon || '🍽️'}
                  </div>
                )}
                <button
                  onClick={() => setIsProductSheetOpen(false)}
                  className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Product Info */}
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-800">{selectedItem.name}</h2>
                
                <div className="flex items-center gap-2 mt-2">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-gray-600">4.9 (reviews)</span>
                </div>
                
                <p className="text-gray-600 mt-3">{selectedItem.description}</p>
                
                <div className="flex items-center justify-between mt-6">
                  <span className="text-3xl font-bold" style={{ color: colors.primary }}>
                    {currency} {selectedItem.price.toLocaleString()}
                  </span>
                </div>
                
                <button
                  onClick={() => addToCart(selectedItem)}
                  className="w-full py-4 rounded-xl text-white font-bold text-lg mt-6"
                  style={{ backgroundColor: colors.primary }}
                >
                  Add to Cart
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Cart Sheet */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/50 z-50"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-full md:w-96 bg-white z-50 flex flex-col"
            >
              {/* Cart Header */}
              <div className="p-6 border-b" style={{ backgroundColor: colors.primary }}>
                <div className="flex items-center justify-between text-white">
                  <h3 className="text-xl font-bold">Your Order</h3>
                  <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-white/10 rounded-full">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <p className="text-white/70 mt-1">{cartCount} items</p>
              </div>

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto p-4">
                {cart.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500">Your cart is empty</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map((ci) => (
                      <div key={ci.item.id} className="flex gap-3 p-3 bg-gray-50 rounded-xl">
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                          {ci.item.image_url ? (
                            <img src={ci.item.image_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl">
                              {ci.item.icon || '🍽️'}
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800">{ci.item.name}</h4>
                          <p className="text-sm font-bold mt-1" style={{ color: colors.primary }}>
                            {currency} {(ci.item.price * ci.quantity).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(ci.item.id, -1)}
                            className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center font-semibold">{ci.quantity}</span>
                          <button
                            onClick={() => updateQuantity(ci.item.id, 1)}
                            className="w-8 h-8 rounded-full text-white flex items-center justify-center"
                            style={{ backgroundColor: colors.primary }}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Cart Footer */}
              {cart.length > 0 && (
                <div className="p-6 border-t bg-gray-50">
                  <div className="flex justify-between text-2xl font-bold mb-4">
                    <span>Total:</span>
                    <span style={{ color: colors.primary }}>{currency} {cartTotal.toLocaleString()}</span>
                  </div>
                  <button
                    onClick={handlePlaceOrder}
                    disabled={isPlacingOrder}
                    className="w-full py-4 rounded-xl text-white font-bold text-lg disabled:opacity-70"
                    style={{ backgroundColor: colors.primary }}
                  >
                    {isPlacingOrder ? 'Placing Order…' : 'Place Order'}
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="bg-gray-900 text-white px-4 py-8">
        <div className="max-w-6xl mx-auto text-center">
          {business.logo_url && (
            <img src={business.logo_url} alt="" className="w-16 h-16 mx-auto mb-4 rounded-full" />
          )}
          <h3 className="text-xl font-bold mb-2">{business.name || 'Menu'}</h3>
          <p className="text-gray-400 text-sm">{business.description}</p>
          
          <div className="mt-6 pt-6 border-t border-gray-800 text-gray-500 text-sm">
            Powered by <span className="text-white font-semibold">MenuVibe</span>
          </div>
        </div>
      </footer>
      <OrderTracker orders={orders} />
    </div>
  );
}
