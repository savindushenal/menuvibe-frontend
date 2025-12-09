'use client';

import { motion } from 'framer-motion';
import { Star, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { MenuItem } from './TopPicks';

interface MenuListProps {
  items: MenuItem[];
  onItemClick: (item: MenuItem) => void;
}

export default function MenuList({ items, onItemClick }: MenuListProps) {
  return (
    <motion.section 
      className="px-4 sm:px-6 lg:px-12 pb-24 md:pb-32"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.8 }}
    >
      <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-barista-dark mb-4 md:mb-6">Menu</h2>
      
      {/* Grid layout for desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            onClick={() => onItemClick(item)}
            className="bg-white rounded-xl p-4 md:p-5 shadow-sm border border-gray-100 cursor-pointer hover:shadow-lg transition-shadow"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 + index * 0.1 }}
            whileHover={{ scale: 1.01, y: -2 }}
            whileTap={{ scale: 0.99 }}
          >
            <div className="flex gap-4">
              {/* Image */}
              <div className="relative w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-xl overflow-hidden flex-shrink-0">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover"
                />
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-barista-dark text-base md:text-lg">{item.name}</h3>
                  <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 hidden md:block" />
                </div>
                
                <div className="flex items-center gap-1 mt-1">
                  <Star className="w-3 h-3 md:w-4 md:h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs md:text-sm text-gray-500">{item.rating} ({item.reviews} reviews)</span>
                </div>
                
                <p className="text-sm md:text-base text-gray-500 mt-1 line-clamp-2">{item.description}</p>
                
                <p className="text-barista-orange font-bold mt-2 text-base md:text-lg">LKR {item.price.toLocaleString()}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
