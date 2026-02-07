'use client';

import { motion } from 'framer-motion';
import { Star, Plus } from 'lucide-react';
import Image from 'next/image';
import { MenuItem } from './types';

interface TopPicksProps {
  items: MenuItem[];
  onItemClick: (item: MenuItem) => void;
}

export default function TopPicks({ items, onItemClick }: TopPicksProps) {
  // Take first 4 items for top picks
  const topItems = items.slice(0, 4);

  if (topItems.length === 0) return null;

  return (
    <section className="px-4 sm:px-6 lg:px-12 py-6 md:py-10 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-franchise-dark">Top Picks</h2>
          <p className="text-gray-500 text-sm mt-0.5 hidden sm:block">Our most loved items</p>
        </div>
        <a href="#menu" className="text-franchise-primary text-sm font-medium hover:underline">
          View All
        </a>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {topItems.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -4 }}
            onClick={() => onItemClick(item)}
            className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-100"
          >
            <div className="relative aspect-square">
              {item.image ? (
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-franchise-neutral flex items-center justify-center">
                  <span className="text-4xl">☕</span>
                </div>
              )}
              <motion.button
                whileTap={{ scale: 0.9 }}
                className="absolute bottom-2 right-2 bg-franchise-primary text-white p-2 rounded-full shadow-lg"
                onClick={(e) => {
                  e.stopPropagation();
                  onItemClick(item);
                }}
              >
                <Plus className="w-4 h-4" />
              </motion.button>
            </div>
            <div className="p-3 md:p-4">
              <h3 className="font-semibold text-franchise-dark text-sm md:text-base line-clamp-1">{item.name}</h3>
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-franchise-primary font-bold text-sm md:text-base">
                  Rs. {item.price.toLocaleString()}
                </span>
                {item.rating && (
                  <div className="flex items-center gap-0.5 text-xs text-gray-500">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span>{item.rating}</span>
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
