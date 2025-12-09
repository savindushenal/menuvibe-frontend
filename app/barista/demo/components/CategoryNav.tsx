'use client';

import { motion } from 'framer-motion';
import { Coffee, Sandwich, GlassWater } from 'lucide-react';

const categories = [
  { id: 'coffee', name: 'Coffee', icon: Coffee },
  { id: 'food', name: 'Food', icon: Sandwich },
  { id: 'drinks', name: 'Drinks', icon: GlassWater },
];

interface CategoryNavProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

export default function CategoryNav({ activeCategory, onCategoryChange }: CategoryNavProps) {
  return (
    <motion.section 
      className="px-4 sm:px-6 lg:px-12 py-4 md:py-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 }}
    >
      <div className="flex gap-3 md:gap-4 flex-wrap">
        {categories.map((category) => {
          const Icon = category.icon;
          const isActive = activeCategory === category.id;
          
          return (
            <motion.button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={`flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 rounded-full font-medium text-sm md:text-base transition-all ${
                isActive
                  ? 'bg-barista-orange text-white shadow-lg'
                  : 'bg-barista-warmGray text-barista-dark hover:bg-gray-200'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              animate={isActive ? { y: [0, -3, 0] } : {}}
              transition={{ duration: 0.3 }}
            >
              <Icon className="w-4 h-4 md:w-5 md:h-5" />
              {category.name}
            </motion.button>
          );
        })}
      </div>
    </motion.section>
  );
}
