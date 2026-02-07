'use client';

import { motion } from 'framer-motion';
import { useRef, useEffect } from 'react';

interface CategoryNavProps {
  categories: string[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

export default function CategoryNav({ categories, activeCategory, onCategoryChange }: CategoryNavProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to active category
  useEffect(() => {
    if (containerRef.current) {
      const activeButton = containerRef.current.querySelector(`[data-category="${activeCategory}"]`);
      if (activeButton) {
        activeButton.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [activeCategory]);

  return (
    <div className="sticky top-[105px] md:top-[113px] z-40 bg-white border-b border-gray-100">
      <div 
        ref={containerRef}
        className="flex gap-2 px-4 sm:px-6 lg:px-12 py-3 overflow-x-auto scrollbar-hide max-w-7xl mx-auto"
      >
        {categories.map((category) => (
          <motion.button
            key={category}
            data-category={category}
            whileTap={{ scale: 0.95 }}
            onClick={() => onCategoryChange(category)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              activeCategory === category
                ? 'bg-franchise-primary text-white shadow-md'
                : 'bg-franchise-neutral text-franchise-dark hover:bg-gray-200'
            }`}
          >
            {category}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
