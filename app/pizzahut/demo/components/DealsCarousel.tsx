'use client';

import { motion } from 'framer-motion';
import { Flame, Star } from 'lucide-react';
import Image from 'next/image';
import { MenuItem, Deal } from '../types';

interface DealsCarouselProps {
  onDealClick: (deal: MenuItem) => void;
}

// Hot Deals data
export const dealsData: MenuItem[] = [
  {
    id: 'family-feast',
    name: 'Family Feast',
    price: 6999,
    originalPrice: 8970,
    description: '2 Large Pizzas + 6pc Wings + Garlic Bread + 1.5L Pepsi. Perfect for the whole family!',
    image: '/pizzahut/family-feast.jpg',
    rating: 4.9,
    reviews: 234,
    category: 'Deals',
    badge: 'SAVE 22%',
  },
  {
    id: 'lunch-combo',
    name: 'Lunch Special',
    price: 1999,
    originalPrice: 2730,
    description: 'Personal Pan Pizza + 3pc Wings + Regular Drink. Available 11 AM - 3 PM.',
    image: '/pizzahut/lunch-combo.jpg',
    rating: 4.8,
    reviews: 189,
    category: 'Deals',
    badge: 'LUNCH ONLY',
  },
  {
    id: 'triple-treat',
    name: 'Triple Treat Box',
    price: 4499,
    originalPrice: 5650,
    description: '1 Medium Pizza + Breadsticks + Cinnamon Sticks. The ultimate combo!',
    image: '/pizzahut/triple-treat.jpg',
    rating: 4.7,
    reviews: 156,
    category: 'Deals',
    badge: 'BEST VALUE',
  },
];

export default function DealsCarousel({ onDealClick }: DealsCarouselProps) {
  return (
    <motion.section 
      className="py-6 md:py-8 lg:py-10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <div className="px-4 sm:px-6 lg:px-12 mb-4 md:mb-6 flex items-center gap-2">
        <Flame className="w-5 h-5 md:w-6 md:h-6 text-pizzahut-red" />
        <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-pizzahut-dark">Hot Deals</h2>
        <span className="ml-2 px-2 py-0.5 bg-pizzahut-red text-white text-xs font-bold rounded-full animate-pulse">
          LIMITED TIME
        </span>
      </div>
      
      {/* Horizontal scroll on mobile, grid on desktop */}
      <div className="overflow-x-auto scrollbar-hide lg:overflow-visible px-4 sm:px-6 lg:px-12">
        <div className="flex gap-4 md:gap-6 pb-4 lg:pb-0 lg:grid lg:grid-cols-3 w-max lg:w-full">
          {dealsData.map((deal, index) => (
            <motion.div
              key={deal.id}
              onClick={() => onDealClick(deal)}
              className="w-64 md:w-72 lg:w-full bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer flex-shrink-0 hover:shadow-xl transition-shadow border-2 border-pizzahut-red/10"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Image */}
              <div className="relative h-36 md:h-44 lg:h-48 bg-gradient-to-br from-pizzahut-warmGray to-red-50">
                <Image
                  src={deal.image}
                  alt={deal.name}
                  fill
                  className="object-cover"
                />
                {/* Badge */}
                {deal.badge && (
                  <div className="absolute top-3 left-3 px-2 py-1 bg-pizzahut-red text-white text-xs font-bold rounded-lg shadow-lg">
                    {deal.badge}
                  </div>
                )}
              </div>
              
              {/* Content */}
              <div className="p-4">
                <h3 className="font-bold text-pizzahut-dark text-base md:text-lg">{deal.name}</h3>
                
                <div className="flex items-center gap-1 mt-1">
                  <Star className="w-3 h-3 md:w-4 md:h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs md:text-sm text-gray-500">{deal.rating} ({deal.reviews})</span>
                </div>
                
                <p className="text-xs md:text-sm text-gray-500 mt-2 line-clamp-2">{deal.description}</p>
                
                <div className="flex items-center gap-2 mt-3">
                  <p className="text-pizzahut-red font-bold text-lg">LKR {deal.price.toLocaleString()}</p>
                  {deal.originalPrice && (
                    <p className="text-gray-400 text-sm line-through">LKR {deal.originalPrice.toLocaleString()}</p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
