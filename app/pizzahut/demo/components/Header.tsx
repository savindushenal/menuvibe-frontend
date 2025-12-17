'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Menu, ShoppingBag, Search, X, Pizza, Sparkles, Info, MapPin, Store } from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';
import { TableInfo } from '../types';

interface HeaderProps {
  cartCount: number;
  onCartClick: () => void;
  tableInfo: TableInfo | null;
  locationName: string;
}

export default function Header({ cartCount, onCartClick, tableInfo, locationName }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <motion.header 
        className="sticky top-0 z-50 bg-white border-b border-gray-100"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Location Bar */}
        <div className="bg-pizzahut-dark text-white px-4 sm:px-6 lg:px-12 py-1.5">
          <div className="flex items-center justify-center gap-2 max-w-7xl mx-auto">
            <MapPin className="w-3.5 h-3.5 text-pizzahut-red" />
            <span className="text-xs font-medium">
              {tableInfo 
                ? `${locationName} • Table ${tableInfo.table}${tableInfo.floor ? ` (${tableInfo.floor})` : ''}`
                : locationName
              }
            </span>
          </div>
        </div>
        
        {/* Main Header */}
        <div className="px-4 sm:px-6 lg:px-12 py-3 md:py-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            {/* Hamburger Menu - Hidden on large screens */}
            <button 
              onClick={() => setIsMenuOpen(true)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors lg:hidden"
            >
              <Menu className="w-6 h-6 text-pizzahut-dark" />
            </button>
            
            {/* Desktop Navigation - Hidden on mobile */}
            <nav className="hidden lg:flex items-center gap-8">
              <a href="#" className="text-pizzahut-dark hover:text-pizzahut-red font-medium transition-colors">Menu</a>
              <a href="#" className="text-gray-500 hover:text-pizzahut-red transition-colors">Deals</a>
              <a href="#" className="text-gray-500 hover:text-pizzahut-red transition-colors">About</a>
            </nav>
            
            {/* Logo */}
            <div className="relative w-36 h-14 md:w-40 md:h-16 lg:w-44 lg:h-20 lg:absolute lg:left-1/2 lg:-translate-x-1/2">
              <Image
                src="/pizzahut-logo.png"
                alt="Pizza Hut"
                fill
                className="object-contain"
                priority
              />
            </div>
            
            {/* Right side actions */}
            <div className="flex items-center gap-2 md:gap-4">
              {/* Search - Desktop only */}
              <button className="hidden md:flex p-2 hover:bg-gray-100 rounded-full transition-colors">
                <Search className="w-5 h-5 text-pizzahut-dark" />
              </button>
              
              {/* Cart */}
              <button 
                onClick={onCartClick}
                className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ShoppingBag className="w-6 h-6 text-pizzahut-dark" />
                {cartCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 bg-pizzahut-red text-white text-xs w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center font-semibold"
                  >
                    {cartCount}
                  </motion.span>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Mobile Slide-out Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/50 z-[60] lg:hidden"
            />
            
            {/* Menu Panel */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-[280px] bg-white z-[70] lg:hidden shadow-2xl"
            >
              {/* Menu Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div className="relative w-32 h-14">
                  <Image
                    src="/pizzahut-logo.png"
                    alt="Pizza Hut"
                    fill
                    className="object-contain"
                  />
                </div>
                <button 
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              {/* Location Badge */}
              <div className="mx-4 mt-4 p-3 bg-red-50 rounded-xl flex items-center gap-2">
                {tableInfo ? (
                  <MapPin className="w-4 h-4 text-pizzahut-red" />
                ) : (
                  <Store className="w-4 h-4 text-pizzahut-red" />
                )}
                <div>
                  {tableInfo ? (
                    <>
                      <p className="text-sm font-medium text-pizzahut-dark">
                        Table {tableInfo.table}{tableInfo.floor ? ` • ${tableInfo.floor}` : ''}
                      </p>
                      <p className="text-xs text-gray-500">{locationName}</p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-pizzahut-dark">{locationName}</p>
                      <p className="text-xs text-gray-500">Order for dine-in or takeaway</p>
                    </>
                  )}
                </div>
              </div>
              
              {/* Menu Items */}
              <nav className="p-4 space-y-1">
                <motion.a
                  href="#"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-pizzahut-red/10 text-pizzahut-red font-medium"
                  whileTap={{ scale: 0.98 }}
                >
                  <Pizza className="w-5 h-5" />
                  Menu
                </motion.a>
                
                <motion.a
                  href="#"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-pizzahut-dark hover:bg-gray-50 transition-colors"
                  whileTap={{ scale: 0.98 }}
                >
                  <Sparkles className="w-5 h-5" />
                  Hot Deals
                </motion.a>
                
                <motion.a
                  href="#"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-pizzahut-dark hover:bg-gray-50 transition-colors"
                  whileTap={{ scale: 0.98 }}
                >
                  <Info className="w-5 h-5" />
                  About Us
                </motion.a>
              </nav>
              
              {/* Bottom Section */}
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100 bg-gray-50">
                <p className="text-xs text-gray-400 text-center">
                  Powered by MenuVibe
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
