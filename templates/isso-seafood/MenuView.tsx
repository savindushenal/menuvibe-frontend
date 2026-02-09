'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBag, X, MapPin, Star, ChevronRight,
  Fish, UtensilsCrossed, Salad, Sparkles, Plus, Minus, Gift
} from 'lucide-react';
import Image from 'next/image';

// Shrimp SVG Icon
const ShrimpIcon = ({ className = "w-16 h-16" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M42 18C42 18 45 15 48 15C51 15 54 17 54 20C54 23 52 25 49 26L42 28" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M38 22C38 22 40 19 43 19C45 19 47 20 47 22C47 24 46 25 44 26L38 28" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <ellipse cx="32" cy="32" rx="18" ry="12" fill="currentColor" opacity="0.2"/>
    <path d="M50 32C50 38 42 44 32 44C22 44 14 38 14 32C14 26 22 20 32 20C42 20 50 26 50 32Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M32 44C32 44 28 48 25 50C23 52 20 52 18 50C16 48 16 45 18 43C20 41 24 38 24 38" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="38" cy="28" r="2" fill="currentColor"/>
    <circle cx="26" cy="28" r="2" fill="currentColor"/>
    <path d="M20 32C20 32 22 34 24 34" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M20 36C20 36 22 38 24 38" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M44 32C44 32 42 34 40 34" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M44 36C44 36 42 38 40 38" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

// Isso Logo Component
const IssoLogo = ({ className = "" }: { className?: string }) => (
  <div className={`flex items-center ${className}`}>
    <Image src="/isso-logo.png" alt="Isso" width={120} height={40} className="h-8 md:h-10 w-auto" />
  </div>
);

export interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number | string;
  image_url?: string;
  category_id: number;
  is_available: boolean;
  is_featured?: boolean;
}

interface Category {
  id: number;
  name: string;
  items: MenuItem[];
}

interface CartItem {
  item: MenuItem;
  quantity: number;
}

export default function IssoMenuView() {
  const params = useParams();
  const code = params?.code as string;
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isProductSheetOpen, setIsProductSheetOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const response = await fetch(`https://api.menuvire.com/api/menu/${code}`);
        const result = await response.json();
        
        if (result.success) {
          setData(result.data);
          if (result.data.menu?.categories?.length > 0) {
            setActiveCategory(result.data.menu.categories[0].id);
          }
        }
      } catch (error) {
        console.error('Error fetching menu:', error);
      } finally {
        setLoading(false);
      }
    };

    if (code) {
      fetchMenu();
    }
  }, [code]);

  const formatPrice = (price: number | string): string => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return numPrice.toFixed(2);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning! 🌅';
    if (hour < 17) return 'Good Afternoon! 🦐';
    return 'Good Evening! 🌊';
  };

  const handleItemClick = (item: MenuItem) => {
    setSelectedItem(item);
    setIsProductSheetOpen(true);
  };

  const handleAddToCart = (item: MenuItem, quantity: number) => {
    setCartItems(prev => {
      const existingIndex = prev.findIndex(ci => ci.item.id === item.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      }
      return [...prev, { item, quantity }];
    });
    setIsProductSheetOpen(false);
  };

  const handleUpdateQuantity = (itemId: number, delta: number) => {
    setCartItems(prev => {
      const updated = prev.map(ci => 
        ci.item.id === itemId ? { ...ci, quantity: Math.max(0, ci.quantity + delta) } : ci
      );
      return updated.filter(ci => ci.quantity > 0);
    });
  };

  const cartTotal = cartItems.reduce((sum, ci) => {
    const price = typeof ci.item.price === 'string' ? parseFloat(ci.item.price) : ci.item.price;
    return sum + (price * ci.quantity);
  }, 0);

  const cartCount = cartItems.reduce((sum, ci) => sum + ci.quantity, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center">
        <div className="text-center">
          <ShrimpIcon className="w-16 h-16 text-[#F26522] mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600 text-lg">Loading menu...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center">
        <div className="text-center">
          <ShrimpIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Menu not found</p>
        </div>
      </div>
    );
  }

  const categories: Category[] = data.menu?.categories || [];
  const brandName = data.franchise?.design_tokens?.brand?.name || 'Isso';
  const brandGreeting = data.franchise?.design_tokens?.brand?.greeting || getGreeting();
  const locationName = data.location?.name || 'Main Location';

  // Get items filtered by active category or all items
  const activeItems = activeCategory
    ? (categories.find(cat => cat.id === activeCategory)?.items.filter(item => item.is_available) || [])
    : categories.flatMap(cat => cat.items.filter(item => item.is_available));

  const categoryIcons: Record<string, any> = {
    'Appetizers': Fish,
    'Mains': UtensilsCrossed,
    'Salads': Salad,
    'default': Fish
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <motion.header 
        className="sticky top-0 z-50 bg-white border-b border-gray-100"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="bg-[#1A1A1A] text-white px-4 sm:px-6 lg:px-12 py-1.5">
          <div className="flex items-center justify-center gap-2 max-w-7xl mx-auto">
            <MapPin className="w-3.5 h-3.5 text-[#F26522]" />
            <span className="text-xs font-medium">{locationName}</span>
          </div>
        </div>
        
        <div className="px-4 sm:px-6 lg:px-12 py-3 md:py-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="w-10"></div>
            <IssoLogo className="lg:absolute lg:left-1/2 lg:-translate-x-1/2" />
            
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ShoppingBag className="w-6 h-6 text-[#1A1A1A]" />
              {cartCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 bg-[#F26522] text-white text-xs w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center font-semibold"
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
        className="relative px-4 sm:px-6 lg:px-12 py-8 md:py-12 bg-[#F26522] overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="absolute top-10 left-10 w-64 h-64 bg-[#E8F34E] rounded-full blur-3xl opacity-20"></div>
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-[#6DBDB6] rounded-full blur-3xl opacity-20"></div>
        
        <div className="relative max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8">
            <motion.div 
              className="text-white"
              initial={{ x: -30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-3">
                {brandGreeting}
              </h1>
              <p className="text-lg md:text-xl text-white/90 mb-6">
                Fresh from the ocean, served with love
              </p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Open Now</span>
              </div>
            </motion.div>

            <motion.div
              className="hidden lg:flex items-end justify-end"
              initial={{ x: 30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="bg-white/10 backdrop-blur-md rounded-2xl px-8 py-6 border border-white/20">
                <div className="grid grid-cols-3 gap-6 text-white text-center">
                  <div>
                    <div className="text-3xl font-bold">{allItems.length}+</div>
                    <div className="text-sm text-white/80">Items</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold flex items-center justify-center gap-1">
                      4.9 <Star className="w-5 h-5 fill-[#E8F34E] text-[#E8F34E]" />
                    </div>
                    <div className="text-sm text-white/80">Rating</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold">~5min</div>
                    <div className="text-sm text-white/80">Wait</div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div 
              className="lg:hidden flex items-center justify-between text-white text-center"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div>
                <div className="text-2xl font-bold">{allItems.length}+</div>
                <div className="text-xs text-white/80">Items</div>
              </div>
              <div className="w-px h-10 bg-white/20"></div>
              <div>
                <div className="text-2xl font-bold flex items-center justify-center gap-1">
                  4.9 <Star className="w-4 h-4 fill-[#E8F34E] text-[#E8F34E]" />
                </div>
                <div className="text-xs text-white/80">Rating</div>
              </div>
              <div className="w-px h-10 bg-white/20"></div>
              <div>
                <div className="text-2xl font-bold">~5min</div>
                <div className="text-xs text-white/80">Wait</div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Special Offer */}
      {data.offers && data.offers.length > 0 && (
        <motion.section 
          className="px-4 sm:px-6 lg:px-12 py-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="max-w-7xl mx-auto">
            <motion.div
              className="relative overflow-hidden rounded-2xl cursor-pointer group"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#F26522] via-[#ED5C3C] to-[#F26522]" />
              
              <div className="relative z-10 flex items-center gap-4 p-4">
                {data.offers[0].image_url && (
                  <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden shadow-lg border-2 border-white/20 flex-shrink-0">
                    <Image
                      src={data.offers[0].image_url}
                      alt={data.offers[0].title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="inline-flex items-center gap-1.5 bg-white/20 px-2 py-0.5 rounded-full mb-1.5">
                    <Sparkles className="w-3 h-3 text-[#E8F34E]" />
                    <span className="text-[10px] font-semibold text-white uppercase">Special Offer 🦐</span>
                  </div>
                  
                  <h3 className="text-base md:text-lg font-bold text-white leading-tight">
                    {data.offers[0].title}
                  </h3>
                  <p className="text-xs text-white/80 mt-1 line-clamp-1">
                    {data.offers[0].description}
                  </p>
                  
                  {data.offers[0].discount_percentage && (
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="bg-[#E8F34E] text-[#1A1A1A] text-xs font-bold px-2 py-0.5 rounded-full">
                        -{data.offers[0].discount_percentage}% OFF
                      </span>
                      {data.offers[0].code && (
                        <span className="text-xs text-white/70">Code: {data.offers[0].code}</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <ChevronRight className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.section>
      )}

      {/* Category Navigation */}
      <div className="sticky top-[73px] md:top-[82px] z-40 bg-white border-b border-gray-100 px-4 sm:px-6 lg:px-12 py-4">
        <div className="max-w-7xl mx-auto overflow-x-auto scrollbar-hide">
          <div className="flex gap-3 min-w-max">
            {categories.map((category) => {
              const IconComponent = categoryIcons[category.name] || categoryIcons.default;
              return (
                <motion.button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all ${
                    activeCategory === category.id
                      ? 'bg-[#F26522] text-white shadow-lg'
                      : 'bg-[#F5F5F5] text-[#1A1A1A] hover:bg-gray-200'
                  }`}
                >
                  <IconComponent className="w-5 h-5" />
                  <span>{category.name}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Menu List */}
      <section className="px-4 sm:px-6 lg:px-12 py-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {activeItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                whileHover={{ y: -2 }}
                onClick={() => handleItemClick(item)}
                className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-lg transition-all cursor-pointer overflow-hidden group"
              >
                <div className="flex gap-4 p-4">
                  {item.image_url && (
                    <div className="relative w-20 h-20 md:w-28 md:h-28 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                      <Image
                        src={item.image_url}
                        alt={item.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-bold text-[#1A1A1A] line-clamp-1 flex-1">
                        {item.name}
                      </h3>
                      <ChevronRight className="hidden md:block w-5 h-5 text-gray-400 flex-shrink-0 group-hover:text-[#F26522] transition-colors" />
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
                      <Star className="w-3 h-3 fill-[#E8F34E] text-[#E8F34E]" />
                      <span>4.7</span>
                    </div>
                    {item.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                    <div className="text-lg md:text-xl font-bold text-[#F26522]">
                      ${formatPrice(item.price)}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Product Sheet */}
      <AnimatePresence>
        {isProductSheetOpen && selectedItem && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => setIsProductSheetOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-50 max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h3 className="text-xl font-bold text-[#1A1A1A]">Item Details</h3>
                <button
                  onClick={() => setIsProductSheetOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6">
                {selectedItem.image_url && (
                  <div className="relative h-64 rounded-2xl overflow-hidden mb-6 bg-gradient-to-br from-[#6DBDB6]/10 to-[#F26522]/10">
                    <Image
                      src={selectedItem.image_url}
                      alt={selectedItem.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}

                <h2 className="text-3xl font-bold text-[#1A1A1A] mb-2">{selectedItem.name}</h2>
                
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="w-4 h-4 fill-[#E8F34E] text-[#E8F34E]" />
                    <span className="font-medium">4.8</span>
                    <span className="text-gray-500">(95 reviews)</span>
                  </div>
                </div>

                {selectedItem.description && (
                  <p className="text-gray-600 text-lg mb-6">{selectedItem.description}</p>
                )}

                <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-200">
                  <span className="text-4xl font-bold text-[#F26522]">
                    ${formatPrice(selectedItem.price)}
                  </span>
                </div>

                <button
                  onClick={() => handleAddToCart(selectedItem, 1)}
                  className="w-full bg-[#F26522] hover:bg-[#ED5C3C] text-white py-4 rounded-2xl font-bold text-lg transition-colors flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-5 h-5" />
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
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => setIsCartOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30 }}
              className="fixed top-0 right-0 bottom-0 w-full md:w-96 bg-white shadow-2xl z-50 flex flex-col"
            >
              <div className="bg-[#F26522] text-white px-6 py-5 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold">Your Cart</h3>
                  <p className="text-white/90">{cartCount} items</p>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {cartItems.length === 0 ? (
                  <div className="text-center py-16">
                    <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">Your cart is empty</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cartItems.map((ci) => (
                      <div
                        key={ci.item.id}
                        className="bg-[#FFF8F0] rounded-xl p-4 flex items-center gap-4"
                      >
                        {ci.item.image_url && (
                          <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                            <Image
                              src={ci.item.image_url}
                              alt={ci.item.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-[#1A1A1A] mb-1">{ci.item.name}</h4>
                          <p className="text-[#F26522] font-bold text-lg">
                            ${formatPrice(ci.item.price)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleUpdateQuantity(ci.item.id, -1)}
                            className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center font-bold">
                            {ci.quantity}
                          </span>
                          <button
                            onClick={() => handleUpdateQuantity(ci.item.id, 1)}
                            className="w-8 h-8 bg-[#F26522] rounded-full flex items-center justify-center hover:bg-[#ED5C3C] transition-colors"
                          >
                            <Plus className="w-4 h-4 text-white" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {cartItems.length > 0 && (
                <div className="border-t border-gray-200 p-6 bg-[#FFF8F0]">
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-xl font-bold text-[#1A1A1A]">Total</span>
                    <span className="text-3xl font-bold text-[#F26522]">
                      ${cartTotal.toFixed(2)}
                    </span>
                  </div>
                  <button className="w-full bg-[#F26522] hover:bg-[#ED5C3C] text-white py-4 rounded-xl font-bold text-lg transition-colors">
                    Checkout
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="bg-[#1A1A1A] text-white py-12 px-4 sm:px-6 lg:px-12 mt-16">
        <div className="max-w-7xl mx-auto text-center">
          <ShrimpIcon className="w-12 h-12 mx-auto mb-4 text-[#F26522]" />
          <h3 className="text-2xl font-bold mb-2">{brandName}</h3>
          <p className="text-white/70 mb-4">Fresh from the ocean, served with love</p>
          <p className="text-sm text-white/50">
            Powered by MenuVibe • Fresh seafood delivered daily
          </p>
        </div>
      </footer>
    </div>
  );
}
