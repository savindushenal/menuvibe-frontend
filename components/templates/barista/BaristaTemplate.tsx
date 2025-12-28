'use client';

import { useState, useMemo } from 'react';
import { ShoppingBag, Star, Plus, Coffee, MapPin, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { BaristaTemplateProps } from './types';
import Image from 'next/image';

export function BaristaTemplate({ franchise, location, menuItems }: BaristaTemplateProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cart, setCart] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = ['all', ...new Set(menuItems.map(item => item.category))];
    return cats;
  }, [menuItems]);

  // Filter menu items by category
  const filteredItems = useMemo(() => {
    if (selectedCategory === 'all') return menuItems;
    return menuItems.filter(item => item.category === selectedCategory);
  }, [selectedCategory, menuItems]);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF8F0] to-orange-50">
      {/* Header */}
      <motion.header 
        className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        {/* Location Bar */}
        <div className="bg-[#1A1A1A] text-white px-4 sm:px-6 py-1.5">
          <div className="flex items-center justify-center gap-2 max-w-7xl mx-auto">
            <MapPin className="w-3.5 h-3.5 text-[#F26522]" />
            <span className="text-xs font-medium">{location.name}</span>
          </div>
        </div>
        
        {/* Main Header */}
        <div className="px-4 sm:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            {/* Logo */}
            <div className="flex items-center gap-2">
              {franchise.logoUrl ? (
                <Image src={franchise.logoUrl} alt={franchise.name} width={120} height={40} className="h-8 w-auto" />
              ) : (
                <div className="flex items-center gap-2">
                  <Coffee className="w-8 h-8 text-[#F26522]" />
                  <span className="text-xl font-bold text-[#1A1A1A]">{franchise.name}</span>
                </div>
              )}
            </div>
            
            {/* Cart Button */}
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ShoppingBag className="w-6 h-6 text-[#1A1A1A]" />
              {cartCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 bg-[#E53935] text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-semibold"
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
        className="relative overflow-hidden bg-gradient-to-br from-[#F26522] via-orange-500 to-orange-600"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* Ambient glow effects */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-400/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        {/* Main content */}
        <div className="relative z-10 px-4 sm:px-6 py-8 md:py-12">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 lg:gap-12">
              
              {/* Left: Main content */}
              <div className="flex-1">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="inline-flex items-center gap-2 mb-3"
                >
                  <Clock className="w-4 h-4 text-white/70" />
                  <span className="text-white font-medium text-sm">Open</span>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-white/70 text-sm">Closes 11.00PM</span>
                </motion.div>

                <motion.h1 
                  className="text-3xl md:text-5xl font-bold text-white"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {getGreeting()}! ☕
                </motion.h1>
                
                <motion.p 
                  className="text-white/80 text-lg md:text-xl font-light mt-2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  What would you like today?
                </motion.p>
              </div>

              {/* Right: Stats card - desktop only */}
              <motion.div 
                className="hidden lg:block"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/10 min-w-[200px]">
                  <div className="flex items-center gap-2 mb-4">
                    <Coffee className="w-5 h-5 text-white/80" />
                    <span className="text-white/80 text-sm font-medium">Quick Stats</span>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-3xl font-bold text-white">{menuItems.length}+</p>
                      <p className="text-white/50 text-xs uppercase tracking-wider">Menu Items</p>
                    </div>
                    <div className="w-full h-px bg-white/10" />
                    <div>
                      <p className="text-3xl font-bold text-white">4.9 ⭐</p>
                      <p className="text-white/50 text-xs uppercase tracking-wider">Customer Rating</p>
                    </div>
                    <div className="w-full h-px bg-white/10" />
                    <div>
                      <p className="text-3xl font-bold text-white">~5 min</p>
                      <p className="text-white/50 text-xs uppercase tracking-wider">Average Wait</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Category Navigation */}
      <div className="sticky top-[60px] md:top-[68px] z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex gap-2 px-4 sm:px-6 py-3 max-w-7xl mx-auto overflow-x-auto scrollbar-hide">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedCategory === category
                  ? 'bg-[#F26522] text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          layout
        >
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow cursor-pointer"
                onClick={() => setSelectedItem(item)}
              >
                {/* Item Image */}
                {item.image && (
                  <div className="relative h-48 bg-gray-200">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}

                {/* Item Details */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-lg text-[#1A1A1A] line-clamp-2">{item.name}</h3>
                    <div className="flex items-center gap-1 text-sm flex-shrink-0">
                      <Star className="w-4 h-4 fill-[#F26522] text-[#F26522]" />
                      <span className="font-medium">4.8</span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-[#F26522]">
                      Rs. {item.price.toFixed(2)}
                    </span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setCart([...cart, { item, quantity: 1, customizations: [] }]);
                      }}
                      className="bg-[#F26522] text-white p-2 rounded-full hover:bg-[#E55518] transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="bg-[#1A1A1A] text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="text-center">
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} {franchise.name}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Simple Cart Sheet - Placeholder */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setIsCartOpen(false)}>
          <div 
            className="absolute right-0 top-0 h-full w-full max-w-md bg-white p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold mb-4">Your Cart ({cartCount})</h2>
            {/* Cart items would go here */}
            <button 
              onClick={() => setIsCartOpen(false)}
              className="mt-4 w-full bg-[#F26522] text-white py-3 rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
