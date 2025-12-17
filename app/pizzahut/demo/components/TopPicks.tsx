'use client';

import { motion } from 'framer-motion';
import { Flame, Star } from 'lucide-react';
import Image from 'next/image';
import { MenuItem } from '../types';

interface TopPicksProps {
  onItemClick: (item: MenuItem) => void;
}

// Top picks - bestsellers
export const topPicksData: MenuItem[] = [
  {
    id: 'beef-pepperoni',
    name: 'Beef Pepperoni',
    price: 2490,
    description: 'Loaded with double beef pepperoni, extra mozzarella, and our signature tomato sauce.',
    image: '/pizzahut/beef-pepperoni.jpg',
    rating: 4.9,
    reviews: 312,
    category: 'Pizza',
    sizes: [
      { id: 'personal', name: 'Personal', size: '7"', price: 1490 },
      { id: 'medium', name: 'Medium', size: '10"', price: 2490 },
      { id: 'large', name: 'Large', size: '13"', price: 3490 },
    ],
    crusts: [
      { id: 'pan', name: 'Pan (Classic)', price: 0 },
      { id: 'stuffed', name: 'Stuffed Crust', price: 350 },
      { id: 'thin', name: 'Thin & Crispy', price: 0 },
    ],
  },
  {
    id: 'super-supreme',
    name: 'Super Supreme',
    price: 2690,
    description: 'The ultimate loaded pizza with pepperoni, sausage, beef, mushrooms, capsicum & onions.',
    image: '/pizzahut/super-supreme.jpg',
    rating: 4.8,
    reviews: 256,
    category: 'Pizza',
    sizes: [
      { id: 'personal', name: 'Personal', size: '7"', price: 1690 },
      { id: 'medium', name: 'Medium', size: '10"', price: 2690 },
      { id: 'large', name: 'Large', size: '13"', price: 3690 },
    ],
    crusts: [
      { id: 'pan', name: 'Pan (Classic)', price: 0 },
      { id: 'stuffed', name: 'Stuffed Crust', price: 350 },
      { id: 'thin', name: 'Thin & Crispy', price: 0 },
    ],
  },
  {
    id: 'lava-cake',
    name: 'Chocolate Lava Cake',
    price: 690,
    description: 'Warm chocolate cake with a molten center, served with vanilla ice cream.',
    image: '/pizzahut/lava-cake.webp',
    rating: 4.9,
    reviews: 445,
    category: 'Desserts',
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
        <Flame className="w-5 h-5 md:w-6 md:h-6 text-pizzahut-red" />
        <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-pizzahut-dark">Top Picks for You</h2>
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
              <div className="relative h-32 md:h-40 lg:h-48 bg-gradient-to-br from-pizzahut-warmGray to-red-50">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover"
                />
                {/* Popular badge */}
                <div className="absolute top-2 right-2 px-2 py-0.5 bg-pizzahut-warmYellow text-pizzahut-dark text-[10px] md:text-xs font-bold rounded-full">
                  POPULAR
                </div>
              </div>
              
              {/* Content */}
              <div className="p-3 md:p-4">
                <h3 className="font-bold text-pizzahut-dark text-sm md:text-base lg:text-lg truncate">{item.name}</h3>
                
                <div className="flex items-center gap-1 mt-1">
                  <Star className="w-3 h-3 md:w-4 md:h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs md:text-sm text-gray-500">{item.rating} ({item.reviews})</span>
                </div>
                
                <p className="text-pizzahut-red font-bold mt-2 text-sm md:text-base lg:text-lg">
                  {item.sizes ? `From LKR ${item.sizes[0].price.toLocaleString()}` : `LKR ${item.price.toLocaleString()}`}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
