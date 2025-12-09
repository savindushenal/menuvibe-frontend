'use client';

import { motion } from 'framer-motion';
import { MapPin, Store, Coffee } from 'lucide-react';
import { TableInfo } from '../page';

interface HeroSectionProps {
  tableInfo: TableInfo | null;
}

export default function HeroSection({ tableInfo }: HeroSectionProps) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const isTableView = !!tableInfo;

  return (
    <motion.section 
      className="relative overflow-hidden bg-gradient-to-br from-barista-orange via-orange-500 to-orange-600"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Ambient glow effects */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-400/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      {/* Main content */}
      <div className="relative z-10 px-5 sm:px-6 lg:px-12 py-8 md:py-12 lg:py-16">
        <div className="max-w-5xl mx-auto">
          
          {/* Two column layout on desktop */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 lg:gap-12">
            
            {/* Left: Main content */}
            <div className="flex-1">
              {/* Location pill */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-full mb-4"
              >
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                <span className="text-white/90 text-xs font-medium">Open • 8 AM – 11 PM</span>
              </motion.div>

              {/* Greeting */}
              <motion.h1 
                className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                {getGreeting()}! ☕
              </motion.h1>
              
              <motion.p 
                className="text-white/80 text-lg md:text-xl font-light mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                What would you like today?
              </motion.p>

              {/* Location/Table info card */}
              <motion.div 
                className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  {isTableView ? (
                    <MapPin className="w-5 h-5 text-white" />
                  ) : (
                    <Store className="w-5 h-5 text-white" />
                  )}
                </div>
                <div>
                  {isTableView ? (
                    <>
                      <p className="text-white font-semibold text-sm">
                        Table {tableInfo.table}{tableInfo.floor ? ` • ${tableInfo.floor}` : ''}
                      </p>
                      <p className="text-white/60 text-xs">Order here, we'll bring it to you</p>
                    </>
                  ) : (
                    <>
                      <p className="text-white font-semibold text-sm">Barista Moratuwa</p>
                      <p className="text-white/60 text-xs">Pickup or dine-in available</p>
                    </>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Right: Stats card - desktop only */}
            <motion.div 
              className="hidden lg:block"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/10 min-w-[200px]">
                <div className="flex items-center gap-2 mb-4">
                  <Coffee className="w-5 h-5 text-white/80" />
                  <span className="text-white/80 text-sm font-medium">Quick Stats</span>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-3xl font-bold text-white">50+</p>
                    <p className="text-white/50 text-xs uppercase tracking-wider">Menu Items</p>
                  </div>
                  <div className="w-full h-px bg-white/10" />
                  <div>
                    <p className="text-3xl font-bold text-white">4.9 ★</p>
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

          {/* Mobile stats row */}
          <motion.div 
            className="flex lg:hidden items-center justify-between mt-6 pt-5 border-t border-white/10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
          >
            <div className="text-center flex-1">
              <p className="text-xl font-bold text-white">50+</p>
              <p className="text-[10px] text-white/50 uppercase">Items</p>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div className="text-center flex-1">
              <p className="text-xl font-bold text-white">4.9 ★</p>
              <p className="text-[10px] text-white/50 uppercase">Rating</p>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div className="text-center flex-1">
              <p className="text-xl font-bold text-white">~5m</p>
              <p className="text-[10px] text-white/50 uppercase">Wait</p>
            </div>
          </motion.div>

        </div>
      </div>
    </motion.section>
  );
}
