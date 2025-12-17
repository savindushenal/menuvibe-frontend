'use client';

import { motion } from 'framer-motion';
import { Clock, Pizza } from 'lucide-react';
import { TableInfo } from '../types';

interface HeroSectionProps {
  tableInfo?: TableInfo | null;
  onExploreClick?: () => void;
}

export default function HeroSection({ tableInfo, onExploreClick }: HeroSectionProps) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning, Pizza Lover!";
    if (hour < 17) return "Hungry for Pizza?";
    if (hour < 21) return "Pizza Time!";
    return "Late Night Cravings?";
  };

  const getEmoji = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "☀️";
    if (hour < 17) return "🍕";
    if (hour < 21) return "🔥";
    return "🌙";
  };

  return (
    <motion.section 
      className="relative overflow-hidden bg-gradient-to-br from-pizzahut-red via-red-600 to-pizzahut-redDark"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Ambient glow effects */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-400/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      {/* Main content */}
      <div className="relative z-10 px-5 sm:px-6 lg:px-12 py-5 md:py-12 lg:py-16">
        <div className="max-w-5xl mx-auto">
          
          {/* Two column layout on desktop */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-12">
            
            {/* Left: Main content */}
            <div className="flex-1">
              {/* Open status */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 mb-2 md:mb-4"
              >
                <Clock className="w-4 h-4 text-white/70" />
                <span className="text-white font-medium text-sm">Open</span>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-white/70 text-sm">Closes 11:00 PM</span>
              </motion.div>

              {/* Greeting */}
              <motion.h1 
                className="text-2xl sm:text-3xl md:text-5xl font-bold text-white"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                {getGreeting()} {getEmoji()}
              </motion.h1>
              
              <motion.p 
                className="text-white/80 text-base md:text-xl font-light mt-2 md:mt-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                What would you like today?
              </motion.p>
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
                  <Pizza className="w-5 h-5 text-white/80" />
                  <span className="text-white/80 text-sm font-medium">Quick Stats</span>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-3xl font-bold text-white">30+</p>
                    <p className="text-white/50 text-xs uppercase tracking-wider">Pizzas & More</p>
                  </div>
                  <div className="w-full h-px bg-white/10" />
                  <div>
                    <p className="text-3xl font-bold text-white">4.8 ★</p>
                    <p className="text-white/50 text-xs uppercase tracking-wider">Customer Rating</p>
                  </div>
                  <div className="w-full h-px bg-white/10" />
                  <div>
                    <p className="text-3xl font-bold text-white">~15 min</p>
                    <p className="text-white/50 text-xs uppercase tracking-wider">Average Wait</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Mobile stats row */}
          <motion.div 
            className="flex lg:hidden items-center justify-between mt-4 pt-4 border-t border-white/10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
          >
            <div className="text-center flex-1">
              <p className="text-lg font-bold text-white">30+</p>
              <p className="text-[10px] text-white/50 uppercase">Items</p>
            </div>
            <div className="w-px h-6 bg-white/20" />
            <div className="text-center flex-1">
              <p className="text-lg font-bold text-white">4.8 ★</p>
              <p className="text-[10px] text-white/50 uppercase">Rating</p>
            </div>
            <div className="w-px h-6 bg-white/20" />
            <div className="text-center flex-1">
              <p className="text-lg font-bold text-white">~15m</p>
              <p className="text-[10px] text-white/50 uppercase">Wait</p>
            </div>
          </motion.div>

        </div>
      </div>
    </motion.section>
  );
}
