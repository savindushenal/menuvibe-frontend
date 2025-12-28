'use client';

import { useState, useMemo } from 'react';
import { ShoppingBag, Star, Plus, Coffee, MapPin } from 'lucide-react';
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

      {/* Category Navigation */}
      <div className="sticky top-[60px] md:top-[68px] z-40 bg-white border-b border-gray-200">
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
