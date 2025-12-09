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
    id: 'caramel-macchiato',
    name: 'Caramel Macchiato',
    price: 850,
    description: 'Vanilla-infused milk marked with espresso and topped with buttery caramel drizzle.',
    image: '/barista/caramel-macchiato.jpg',
    rating: 4.9,
    reviews: 103,
    category: 'Coffee',
    customizations: [
      { name: 'Extra Shot', price: 150 },
      { name: 'Extra Caramel', price: 50 },
    ],
  },
  {
    id: 'cafe-mocha',
    name: 'Cafe Mocha',
    price: 880,
    description: 'Indulgent espresso with rich chocolate and steamed milk, topped with whipped cream.',
    image: '/barista/cafe-mocha.jpg',
    rating: 4.9,
    reviews: 95,
    category: 'Coffee',
    customizations: [
      { name: 'Short (Rs. 750)', price: -130 },
      { name: 'Tall (Rs. 1,190)', price: 310 },
      { name: 'Extra Whip', price: 0 },
    ],
  },
  {
    id: 'strawberry-mojito',
    name: 'Strawberry Mojito',
    price: 1150,
    description: 'Refreshing blend of fresh strawberries, mint, and lime with sparkling soda.',
    image: '/barista/strawberry-mojito.jpg',
    rating: 4.9,
    reviews: 76,
    category: 'Drinks',
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
        <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-barista-orange" />
        <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-barista-dark">Top Picks for You</h2>
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
              <div className="relative h-32 md:h-40 lg:h-48 bg-gradient-to-br from-barista-warmGray to-orange-50">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover"
                />
              </div>
              
              {/* Content */}
              <div className="p-3 md:p-4">
                <h3 className="font-semibold text-barista-dark text-sm md:text-base truncate">{item.name}</h3>
                <div className="flex items-center gap-1 mt-1">
                  <Star className="w-3 h-3 md:w-4 md:h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs md:text-sm text-gray-500">{item.rating} ({item.reviews})</span>
                </div>
                <p className="text-barista-orange font-bold mt-2 text-base md:text-lg">LKR {item.price.toLocaleString()}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
