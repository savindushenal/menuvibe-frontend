"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Fish, Search, ShoppingCart, Plus, Minus, X, ChevronLeft, 
  MapPin, Star, Clock, TrendingUp, Heart, Award, Flame,
  ChevronRight
} from 'lucide-react';
import { useParams } from 'next/navigation';
import Image from 'next/image';

// Shrimp SVG Icon Component
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

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number | string;
  image_url?: string;
  category_id: number;
  is_available: boolean;
  is_featured?: boolean;
  variations?: any[];
}

interface Category {
  id: number;
  name: string;
  description?: string;
  items: MenuItem[];
}

interface Offer {
  id: number;
  title: string;
  description: string;
  discount_percentage?: number;
  code?: string;
  image_url?: string;
}

interface CartItem extends MenuItem {
  quantity: number;
}

export default function IssoMenuView() {
  const params = useParams();
  const code = params?.code as string;
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [showCart, setShowCart] = useState(false);
  const [showProduct, setShowProduct] = useState(false);
  const [currentOfferIndex, setCurrentOfferIndex] = useState(0);
  
  // Fetch menu data
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const response = await fetch(`https://api.menuvire.com/api/menu/${code}`);
        const result = await response.json();
        
        if (result.success) {
          setData(result.data);
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

  // Auto-rotate offers
  useEffect(() => {
    if (data?.offers && data.offers.length > 1) {
      const interval = setInterval(() => {
        setCurrentOfferIndex((prev) => (prev + 1) % data.offers.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [data?.offers]);

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

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (itemId: number, delta: number) => {
    setCart(prev => {
      const updated = prev.map(item => 
        item.id === itemId ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
      );
      return updated.filter(item => item.quantity > 0);
    });
  };

  const cartTotal = cart.reduce((sum, item) => {
    const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
    return sum + (price * item.quantity);
  }, 0);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <ShrimpIcon className="w-16 h-16 text-[#FF6B35] mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600 text-lg">Loading menu...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <ShrimpIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Menu not found</p>
        </div>
      </div>
    );
  }

  const categories: Category[] = data.menu?.categories || [];
  const offers: Offer[] = data.offers || [];
  const colors = data.template?.config?.design?.colors || {
    primary: '#FF6B35',
    secondary: '#004E89',
    accent: '#F77F00'
  };

  const brandName = data.franchise?.design_tokens?.brand?.name || data.franchise?.name || 'Isso';
  const brandTagline = data.franchise?.design_tokens?.brand?.tagline || 'Fresh from the ocean';
  const brandGreeting = data.franchise?.design_tokens?.brand?.greeting || getGreeting();
  const locationName = data.location?.name || 'Main Location';

  // Get all available items
  const allItems = categories.flatMap(cat => cat.items.filter(item => item.is_available));
  
  // Filter items by search and category
  const activeItems = selectedCategory 
    ? allItems.filter(item => item.category_id === selectedCategory)
    : allItems;

  const filteredItems = searchQuery
    ? activeItems.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : activeItems;

  // Get featured items
  const featuredItems = allItems.filter(item => item.is_featured).slice(0, 6);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      {/* Header with Location */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#F77F00] flex items-center justify-center">
              <Fish className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{brandName}</h1>
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="w-3 h-3 mr-1" />
                {locationName}
              </div>
            </div>
          </div>
          
          <button
            onClick={() => setShowCart(true)}
            className="relative p-3 bg-gradient-to-r from-[#FF6B35] to-[#F77F00] rounded-full shadow-lg hover:shadow-xl transition-all"
          >
            <ShoppingCart className="w-6 h-6 text-white" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#004E89] text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#004E89] via-[#0077B6] to-[#00B4D8] text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#FF6B35] rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-3">{brandGreeting}</h2>
            <p className="text-xl text-blue-100">{brandTagline}</p>
          </motion.div>

          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/20">
              <Star className="w-8 h-8 text-[#F77F00] mx-auto mb-2" />
              <div className="text-2xl font-bold">4.8</div>
              <div className="text-sm text-blue-100">Rating</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/20">
              <Fish className="w-8 h-8 text-[#F77F00] mx-auto mb-2" />
              <div className="text-2xl font-bold">{allItems.length}</div>
              <div className="text-sm text-blue-100">Items</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/20">
              <Clock className="w-8 h-8 text-[#F77F00] mx-auto mb-2" />
              <div className="text-2xl font-bold">Fresh</div>
              <div className="text-sm text-blue-100">Daily</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="max-w-7xl mx-auto px-4 -mt-6 mb-8 relative z-10">
        <div className="bg-white rounded-2xl shadow-xl p-2 border-2 border-gray-100">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search seafood dishes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 text-lg rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
            />
          </div>
        </div>
      </div>

      {/* Special Offers */}
      {offers.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-bold text-gray-900 flex items-center">
              <Flame className="w-6 h-6 text-[#FF6B35] mr-2" />
              Special Offers
            </h3>
          </div>
          
          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentOfferIndex}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className="bg-gradient-to-r from-[#FF6B35] to-[#F77F00] rounded-2xl overflow-hidden shadow-xl"
              >
                <div className="flex items-center p-6">
                  {offers[currentOfferIndex].image_url && (
                    <div className="relative w-24 h-24 rounded-xl overflow-hidden mr-6 flex-shrink-0">
                      <Image
                        src={offers[currentOfferIndex].image_url}
                        alt={offers[currentOfferIndex].title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 text-white">
                    <h4 className="text-2xl font-bold mb-2">{offers[currentOfferIndex].title}</h4>
                    <p className="text-blue-50 mb-3">{offers[currentOfferIndex].description}</p>
                    {offers[currentOfferIndex].code && (
                      <div className="inline-block bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/30">
                        <span className="text-sm font-semibold">Code: {offers[currentOfferIndex].code}</span>
                      </div>
                    )}
                  </div>
                  {offers[currentOfferIndex].discount_percentage && (
                    <div className="ml-6 bg-white text-[#FF6B35] rounded-2xl px-6 py-4 text-center flex-shrink-0">
                      <div className="text-4xl font-bold">{offers[currentOfferIndex].discount_percentage}%</div>
                      <div className="text-sm font-semibold">OFF</div>
                    </div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
            
            {offers.length > 1 && (
              <div className="flex justify-center mt-4 space-x-2">
                {offers.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentOfferIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentOfferIndex ? 'bg-[#FF6B35] w-8' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Featured Items */}
      {featuredItems.length > 0 && !searchQuery && (
        <div className="max-w-7xl mx-auto px-4 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <Award className="w-6 h-6 text-[#F77F00] mr-2" />
            Top Picks
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {featuredItems.map((item) => (
              <motion.div
                key={item.id}
                whileHover={{ y: -5 }}
                onClick={() => {
                  setSelectedItem(item);
                  setShowProduct(true);
                }}
                className="bg-white rounded-2xl overflow-hidden shadow-lg cursor-pointer border-2 border-transparent hover:border-[#FF6B35] transition-all"
              >
                {item.image_url && (
                  <div className="relative h-32 bg-gray-100">
                    <Image
                      src={item.image_url}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute top-2 right-2 bg-[#F77F00] text-white px-2 py-1 rounded-full text-xs font-bold">
                      <Heart className="w-3 h-3 inline" />
                    </div>
                  </div>
                )}
                <div className="p-3">
                  <h4 className="font-bold text-sm mb-1 line-clamp-1">{item.name}</h4>
                  <div className="text-[#FF6B35] font-bold text-lg">
                    ${formatPrice(item.price)}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Category Navigation */}
      <div className="sticky top-[73px] z-30 bg-white/95 backdrop-blur-sm shadow-md mb-6">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex space-x-2 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-6 py-2 rounded-full whitespace-nowrap font-semibold transition-all ${
                selectedCategory === null
                  ? 'bg-gradient-to-r from-[#FF6B35] to-[#F77F00] text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Items
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-6 py-2 rounded-full whitespace-nowrap font-semibold transition-all ${
                  selectedCategory === category.id
                    ? 'bg-gradient-to-r from-[#FF6B35] to-[#F77F00] text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Items Grid */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        {filteredItems.length === 0 ? (
          <div className="text-center py-16">
            <Fish className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No items found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -5 }}
                className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all cursor-pointer border-2 border-transparent hover:border-[#FF6B35]"
                onClick={() => {
                  setSelectedItem(item);
                  setShowProduct(true);
                }}
              >
                {item.image_url && (
                  <div className="relative h-48 bg-gradient-to-br from-blue-100 to-orange-50">
                    <Image
                      src={item.image_url}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="p-5">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{item.name}</h3>
                  {item.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{item.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-[#FF6B35]">
                      ${formatPrice(item.price)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(item);
                      }}
                      className="bg-gradient-to-r from-[#FF6B35] to-[#F77F00] text-white px-6 py-2 rounded-full font-semibold hover:shadow-lg transition-all flex items-center space-x-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Product Detail Sheet */}
      <AnimatePresence>
        {showProduct && selectedItem && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => setShowProduct(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-50 max-h-[85vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-900">Item Details</h3>
                <button
                  onClick={() => setShowProduct(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              <div className="p-6">
                {selectedItem.image_url && (
                  <div className="relative h-64 rounded-2xl overflow-hidden mb-6 bg-gradient-to-br from-blue-100 to-orange-50">
                    <Image
                      src={selectedItem.image_url}
                      alt={selectedItem.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}

                <h2 className="text-3xl font-bold text-gray-900 mb-3">{selectedItem.name}</h2>
                
                {selectedItem.description && (
                  <p className="text-gray-600 text-lg mb-6">{selectedItem.description}</p>
                )}

                <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-200">
                  <span className="text-4xl font-bold text-[#FF6B35]">
                    ${formatPrice(selectedItem.price)}
                  </span>
                </div>

                <button
                  onClick={() => {
                    addToCart(selectedItem);
                    setShowProduct(false);
                  }}
                  className="w-full bg-gradient-to-r from-[#FF6B35] to-[#F77F00] text-white py-4 rounded-2xl font-bold text-lg hover:shadow-xl transition-all flex items-center justify-center space-x-2"
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span>Add to Cart</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Cart Sheet */}
      <AnimatePresence>
        {showCart && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => setShowCart(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30 }}
              className="fixed top-0 right-0 bottom-0 w-full md:w-96 bg-white shadow-2xl z-50 flex flex-col"
            >
              <div className="bg-gradient-to-r from-[#FF6B35] to-[#F77F00] text-white px-6 py-5 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold">Your Cart</h3>
                  <p className="text-blue-50">{cartCount} items</p>
                </div>
                <button
                  onClick={() => setShowCart(false)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {cart.length === 0 ? (
                  <div className="text-center py-16">
                    <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">Your cart is empty</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <div
                        key={item.id}
                        className="bg-gray-50 rounded-2xl p-4 flex items-center space-x-4"
                      >
                        {item.image_url && (
                          <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                            <Image
                              src={item.image_url}
                              alt={item.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-gray-900 mb-1">{item.name}</h4>
                          <p className="text-[#FF6B35] font-bold text-lg">
                            ${formatPrice(item.price)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors"
                          >
                            <Minus className="w-4 h-4 text-gray-700" />
                          </button>
                          <span className="w-8 text-center font-bold text-gray-900">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="w-8 h-8 bg-[#FF6B35] rounded-full flex items-center justify-center hover:bg-[#F77F00] transition-colors"
                          >
                            <Plus className="w-4 h-4 text-white" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {cart.length > 0 && (
                <div className="border-t border-gray-200 p-6 bg-gray-50">
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-xl font-bold text-gray-900">Total</span>
                    <span className="text-3xl font-bold text-[#FF6B35]">
                      ${cartTotal.toFixed(2)}
                    </span>
                  </div>
                  <button className="w-full bg-gradient-to-r from-[#FF6B35] to-[#F77F00] text-white py-4 rounded-2xl font-bold text-lg hover:shadow-xl transition-all">
                    Checkout
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Footer */}
      <div className="bg-gradient-to-br from-[#004E89] to-[#003459] text-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <Fish className="w-12 h-12 mx-auto mb-4 text-[#F77F00]" />
          <h3 className="text-2xl font-bold mb-2">{brandName}</h3>
          <p className="text-blue-200 mb-4">{brandTagline}</p>
          <p className="text-sm text-blue-300">
            Powered by MenuVibe • Fresh seafood delivered daily
          </p>
        </div>
      </div>
    </div>
  );
}
