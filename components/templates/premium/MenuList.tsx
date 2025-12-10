'use client';

import { motion } from 'framer-motion';
import { Star, Plus } from 'lucide-react';
import Image from 'next/image';
import { MenuItem } from './types';

interface MenuListProps {
  items: MenuItem[];
  category: string;
  onItemClick: (item: MenuItem) => void;
}

export default function MenuList({ items, category, onItemClick }: MenuListProps) {
  const filteredItems = items.filter(item => item.category === category);

  if (filteredItems.length === 0) {
    return (
      <div className="px-4 sm:px-6 lg:px-12 py-8 max-w-7xl mx-auto">
        <p className="text-gray-500 text-center">No items in this category</p>
      </div>
    );
  }

  return (
    <section id="menu" className="px-4 sm:px-6 lg:px-12 py-6 max-w-7xl mx-auto">
      <h2 className="text-xl font-bold text-franchise-dark mb-4">{category}</h2>
      
      <div className="grid gap-3 md:gap-4">
        {filteredItems.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.01 }}
            onClick={() => onItemClick(item)}
            className="bg-white rounded-xl p-3 md:p-4 shadow-sm hover:shadow-md transition-all cursor-pointer border border-gray-100 flex gap-3 md:gap-4"
          >
            {/* Image */}
            <div className="relative w-20 h-20 md:w-24 md:h-24 flex-shrink-0 rounded-lg overflow-hidden">
              {item.image ? (
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-franchise-neutral flex items-center justify-center">
                  <span className="text-2xl">☕</span>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-semibold text-franchise-dark text-sm md:text-base line-clamp-1">
                    {item.name}
                  </h3>
                  {item.rating && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs text-gray-500">
                        {item.rating} ({item.reviews} reviews)
                      </span>
                    </div>
                  )}
                </div>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  className="bg-franchise-primary text-white p-1.5 md:p-2 rounded-full shadow flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onItemClick(item);
                  }}
                >
                  <Plus className="w-4 h-4" />
                </motion.button>
              </div>
              
              <p className="text-gray-500 text-xs md:text-sm mt-1 line-clamp-2">
                {item.description}
              </p>
              
              <div className="flex items-center justify-between mt-2">
                <span className="text-franchise-primary font-bold text-sm md:text-base">
                  Rs. {item.price.toLocaleString()}
                </span>
                {item.tags && item.tags.length > 0 && (
                  <div className="flex gap-1">
                    {item.tags.slice(0, 2).map(tag => (
                      <span 
                        key={tag} 
                        className="text-[10px] px-1.5 py-0.5 bg-franchise-background text-franchise-dark rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
