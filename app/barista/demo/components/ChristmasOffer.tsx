'use client';

import { motion } from 'framer-motion';
import { Gift, Clock, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { MenuItem } from './TopPicks';

interface ChristmasOfferProps {
  onItemClick?: (item: MenuItem) => void;
}

// Special Christmas combo as a MenuItem
const christmasComboItem: MenuItem = {
  id: 'christmas-combo',
  name: 'Festive Breakfast Deal',
  price: 1499,
  description: 'Christmas Special! Enjoy our festive combo with Cafe Mocha and Honey Roasted Chicken Sandwich at a special price.',
  image: '/barista/breakfast-deal.jpg',
  rating: 4.9,
  reviews: 45,
  category: 'Specials',
  customizations: [],
};

const originalPrice = 1770;

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
      className="px-4 sm:px-6 lg:px-12 py-3"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <motion.div
        className="relative overflow-hidden rounded-2xl cursor-pointer group"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={() => onItemClick?.(christmasComboItem)}
      >
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-r from-barista-orange via-orange-500 to-barista-red" />
        
        {/* Content */}
        <div className="relative z-10 flex items-center gap-4 p-4">
          {/* Image */}
          <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden shadow-lg border-2 border-white/20 flex-shrink-0">
            <Image
              src="/barista/breakfast-deal.jpg"
              alt="Breakfast Deal"
              fill
              className="object-cover"
            />
          </div>

          {/* Text content */}
          <div className="flex-1 min-w-0">
            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 bg-white/20 px-2 py-0.5 rounded-full mb-1.5">
              <Gift className="w-3 h-3 text-yellow-200" />
              <span className="text-[10px] font-semibold text-white uppercase">Christmas Special 🎄</span>
            </div>
            
            {/* Title & Price */}
            <h3 className="text-base md:text-lg font-bold text-white leading-tight">Festive Breakfast Deal</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-lg font-bold text-white">LKR {christmasComboItem.price.toLocaleString()}</span>
              <span className="text-xs text-white/50 line-through">LKR {originalPrice.toLocaleString()}</span>
              <span className="bg-yellow-400 text-yellow-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full">-15%</span>
            </div>
            
            {/* Countdown */}
            <div className="flex items-center gap-1 mt-1.5 text-white/70 text-xs">
              <Clock className="w-3 h-3" />
              <span>{daysUntilChristmas} days left</span>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <ChevronRight className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
      </motion.div>
    </motion.section>
  );
}
