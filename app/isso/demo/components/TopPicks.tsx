'use client';

import { motion } from 'framer-motion';
import { Sparkles, Star } from 'lucide-react';
import Image from 'next/image';

interface TopPicksProps {
  onItemClick: (item: MenuItem) => void;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  rating: number;
  reviews: number;
  category: string;
  customizations?: { name: string; price: number }[];
}

// Top picks - bestsellers from real menu
export const topPicksData: MenuItem[] = [
  {
    id: 'hot-butter',
    name: 'Hot Butter',
    price: 2850,
    description: 'Signature dish with succulent prawns in rich, buttery sauce with aromatic spices.',
    image: '/isso/Hot Butter.jpg',
    rating: 5,
    reviews: 145,
    category: 'Mains',
    customizations: [
      { name: 'Extra Spicy', price: 0 },
      { name: 'Mild', price: 0 },
      { name: 'Extra Prawns', price: 500 },
    ],
  },
  {
    id: 'coconut-crumbed-prawns',
    name: 'Coconut Crumbed Prawns 4 pcs',
    price: 1950,
    description: 'Succulent prawns coated in crispy coconut flakes, perfectly golden fried.',
    image: '/isso/Coconut Crumbed Prawns 4 pcs.jpg',
    rating: 5,
    reviews: 112,
    category: 'Appetizers',
    customizations: [
      { name: 'Sweet Chili Sauce', price: 100 },
      { name: 'Garlic Aioli', price: 100 },
    ],
  },
  {
    id: 'tuna-tataki',
    name: 'Black Pepper Crusted Yellow Fin Tuna Tataki',
    price: 3250,
    description: 'Seared yellow fin tuna with black pepper crust, served rare with citrus soy.',
    image: '/isso/Black Pepper Crusted Yellow Fin Tuna Tataki.jpg',
    rating: 5,
    reviews: 124,
    category: 'Mains',
  },
];

export default function TopPicks({ onItemClick }: TopPicksProps) {
  return (
    <motion.section 
      className="py-6 md:py-8 lg:py-10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <div className="px-4 sm:px-6 lg:px-12 mb-4 md:mb-6 flex items-center gap-2">
        <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-isso-teal" />
        <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-isso-dark">Top Picks for You</h2>
      </div>
      
      {/* Horizontal scroll on mobile, grid on desktop */}
      <div className="overflow-x-auto scrollbar-hide lg:overflow-visible px-4 sm:px-6 lg:px-12">
        <div className="flex gap-4 md:gap-6 pb-4 lg:pb-0 lg:grid lg:grid-cols-3 w-max lg:w-full">
          {topPicksData.map((item, index) => (
            <motion.div
              key={item.id}
              onClick={() => onItemClick(item)}
              className="w-44 md:w-52 lg:w-full bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer flex-shrink-0 hover:shadow-xl transition-shadow"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Image */}
              <div className="relative h-32 md:h-40 lg:h-48 bg-gradient-to-br from-isso-teal/10 to-isso-coral/10">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover"
                />
              </div>
              
              {/* Content */}
              <div className="p-3 md:p-4">
                <h3 className="font-semibold text-isso-dark text-sm md:text-base truncate">{item.name}</h3>
                <div className="flex items-center gap-1 mt-1">
                  <Star className="w-3 h-3 md:w-4 md:h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs md:text-sm text-gray-500">{item.rating} ({item.reviews})</span>
                </div>
                <p className="text-isso-coral font-bold mt-2 text-base md:text-lg">LKR {item.price.toLocaleString()}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
