'use client';

import { motion } from 'framer-motion';
import { Gift, Sparkles, Clock, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { MenuItem } from './TopPicks';

interface ChristmasOfferProps {
  onItemClick?: (item: MenuItem) => void;
}

// Special Christmas combo
const christmasCombo = {
  id: 'christmas-combo',
  name: 'Festive Combo',
  originalPrice: 1770,
  salePrice: 1499,
  items: ['Cafe Mocha', 'Honey Roasted Chicken'],
};

export default function ChristmasOffer({ onItemClick }: ChristmasOfferProps) {
  // Calculate days until Christmas
  const today = new Date();
  const christmas = new Date(today.getFullYear(), 11, 25);
  if (today > christmas) {
    christmas.setFullYear(christmas.getFullYear() + 1);
  }
  const daysUntilChristmas = Math.ceil((christmas.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <motion.section 
      className="px-4 sm:px-6 lg:px-12 py-4 md:py-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <motion.div
        className="relative overflow-hidden rounded-2xl md:rounded-3xl cursor-pointer group"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        {/* Brand-aligned warm gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-barista-orange via-amber-500 to-barista-red" />
        
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, white 1px, transparent 1px),
                             radial-gradient(circle at 80% 20%, white 1px, transparent 1px),
                             radial-gradient(circle at 40% 80%, white 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }} />
        </div>

        {/* Floating sparkle accents */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              style={{
                left: `${10 + Math.random() * 80}%`,
                top: `${10 + Math.random() * 80}%`,
              }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            >
              <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-yellow-200" />
            </motion.div>
          ))}
        </div>

        {/* Content */}
        <div className="relative z-10 p-4 md:p-6 lg:p-8">
          <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
            
            {/* Food images - floating on right side for desktop */}
            <div className="order-2 md:order-3 flex md:flex-col items-center justify-center gap-2 md:gap-3 md:absolute md:right-6 lg:right-10 md:top-1/2 md:-translate-y-1/2">
              {/* Cafe Mocha image */}
              <motion.div 
                className="relative w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-xl md:rounded-2xl overflow-hidden shadow-xl border-2 border-white/30"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Image
                  src="/barista/cafe-mocha.jpg"
                  alt="Cafe Mocha"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </motion.div>
              
              {/* Plus sign */}
              <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <span className="text-white font-bold text-sm md:text-base">+</span>
              </div>
              
              {/* Sandwich image */}
              <motion.div 
                className="relative w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-xl md:rounded-2xl overflow-hidden shadow-xl border-2 border-white/30"
                animate={{ y: [0, 5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              >
                <Image
                  src="/barista/honey-roasted-chicken.jpg"
                  alt="Honey Roasted Chicken"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </motion.div>
            </div>

            {/* Left side - Text content */}
            <div className="flex-1 order-1 md:order-1 md:pr-48 lg:pr-64">
              {/* Badge */}
              <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full mb-3">
                <Gift className="w-3.5 h-3.5 text-yellow-200" />
                <span className="text-xs font-semibold text-white uppercase tracking-wide">Christmas Special</span>
                <span className="text-lg">🎄</span>
              </div>
              
              {/* Title */}
              <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-white mb-2">
                Festive Combo Deal
              </h3>
              
              {/* Items included */}
              <p className="text-white/90 text-sm md:text-base mb-3">
                <span className="font-medium">Cafe Mocha</span>
                <span className="mx-2 text-white/50">+</span>
                <span className="font-medium">Honey Roasted Chicken</span>
              </p>
              
              {/* Price */}
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl md:text-3xl font-bold text-white">LKR {christmasCombo.salePrice.toLocaleString()}</span>
                <span className="text-sm text-white/60 line-through">LKR {christmasCombo.originalPrice.toLocaleString()}</span>
                <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full">
                  Save {Math.round((1 - christmasCombo.salePrice / christmasCombo.originalPrice) * 100)}%
                </span>
              </div>

              {/* Bottom row - Countdown & CTA */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Countdown */}
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                  <Clock className="w-3.5 h-3.5 text-white/80" />
                  <span className="text-white text-xs md:text-sm">
                    <span className="font-bold">{daysUntilChristmas}</span> days left
                  </span>
                </div>
                
                {/* Order button */}
                <motion.button 
                  className="flex items-center gap-2 bg-white text-barista-orange px-4 md:px-5 py-2 md:py-2.5 rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl transition-all"
                  whileHover={{ scale: 1.03, x: 3 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Claim Offer
                  <ChevronRight className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          </div>
        </div>

      </motion.div>
    </motion.section>
  );
}
