'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Check, Loader2, Minus, Plus } from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';
import { MenuItem } from './TopPicks';

interface ProductSheetProps {
  item: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (item: MenuItem, quantity: number, customizations: string[]) => void;
}

export default function ProductSheet({ item, isOpen, onClose, onAddToCart }: ProductSheetProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedCustomizations, setSelectedCustomizations] = useState<string[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  if (!item) return null;

  const customizationsTotal = selectedCustomizations.reduce((sum, name) => {
    const customization = item.customizations?.find(c => c.name === name);
    return sum + (customization?.price || 0);
  }, 0);

  const totalPrice = (item.price + customizationsTotal) * quantity;

  const handleAddToCart = async () => {
    setIsAdding(true);
    
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    
    await new Promise(resolve => setTimeout(resolve, 400));
    
    setIsAdding(false);
    setIsAdded(true);
    
    // Play add to cart sound
    try {
      const audio = new Audio('/sounds/add-to-cart.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {
        console.log('Audio autoplay blocked');
      });
    } catch (e) {
      console.log('Audio not available');
    }
    
    // Play success haptic
    if (navigator.vibrate) {
      navigator.vibrate([50, 50, 50]);
    }
    
    setTimeout(() => {
      onAddToCart(item, quantity, selectedCustomizations);
      setIsAdded(false);
      setQuantity(1);
      setSelectedCustomizations([]);
      onClose();
    }, 600);
  };

  const toggleCustomization = (name: string) => {
    setSelectedCustomizations(prev => 
      prev.includes(name) 
        ? prev.filter(c => c !== name)
        : [...prev, name]
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />
          
          {/* Sheet - Bottom sheet on mobile, centered modal on desktop */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed z-50 bg-white overflow-hidden
              bottom-0 left-0 right-0 rounded-t-3xl max-h-[90vh]
              lg:bottom-auto lg:left-1/2 lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 
              lg:rounded-3xl lg:max-w-2xl lg:w-full lg:max-h-[85vh]"
          >
            {/* Drag indicator - mobile only */}
            <div className="flex justify-center pt-3 pb-2 lg:hidden">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
            </div>
            
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors z-10"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
            
            {/* Desktop layout - side by side */}
            <div className="lg:flex lg:flex-row">
              {/* Image */}
              <div className="relative h-56 lg:h-auto lg:w-1/2 lg:min-h-[500px] bg-gradient-to-br from-barista-cream to-barista-warmGray">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover"
                />
              </div>
              
              {/* Content */}
              <div className="p-6 pb-32 lg:pb-6 overflow-y-auto max-h-[50vh] lg:max-h-[500px] lg:w-1/2 lg:flex lg:flex-col">
                <h2 className="text-2xl lg:text-3xl font-bold text-barista-dark">{item.name}</h2>
              
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 lg:w-5 lg:h-5 ${i < Math.floor(item.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                  <span className="text-sm lg:text-base text-gray-500">({item.reviews} reviews)</span>
                </div>
              
                <p className="text-2xl lg:text-3xl font-bold text-barista-orange mt-4">
                  LKR {item.price.toLocaleString()}
                </p>
              
                <p className="text-gray-600 mt-4 leading-relaxed lg:text-lg">{item.description}</p>
              
                {/* Customizations */}
                {item.customizations && item.customizations.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-semibold text-barista-dark mb-3 lg:text-lg">Customizations</h3>
                    <div className="space-y-2">
                      {item.customizations.map((custom) => (
                        <button
                          key={custom.name}
                          onClick={() => toggleCustomization(custom.name)}
                          className={`w-full flex items-center justify-between p-3 lg:p-4 rounded-xl border transition-all ${
                            selectedCustomizations.includes(custom.name)
                              ? 'border-barista-orange bg-barista-orange/10'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <span className="font-medium lg:text-lg">{custom.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">+LKR {custom.price}</span>
                            <div className={`w-5 h-5 lg:w-6 lg:h-6 rounded-full border-2 flex items-center justify-center ${
                              selectedCustomizations.includes(custom.name)
                                ? 'border-barista-orange bg-barista-orange'
                                : 'border-gray-300'
                            }`}>
                              {selectedCustomizations.includes(custom.name) && (
                                <Check className="w-3 h-3 lg:w-4 lg:h-4 text-white" />
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              
                {/* Quantity */}
                <div className="mt-6 flex items-center justify-between">
                  <span className="font-semibold text-barista-dark lg:text-lg">Quantity</span>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-barista-warmGray flex items-center justify-center hover:bg-gray-200 transition-colors"
                    >
                      <Minus className="w-4 h-4 lg:w-5 lg:h-5" />
                    </button>
                    <span className="font-bold text-xl lg:text-2xl w-8 text-center">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-barista-warmGray flex items-center justify-center hover:bg-gray-200 transition-colors"
                    >
                      <Plus className="w-4 h-4 lg:w-5 lg:h-5" />
                    </button>
                  </div>
                </div>

                {/* Desktop CTA - inside content area */}
                <div className="hidden lg:block mt-6">
                  <motion.button
                    onClick={handleAddToCart}
                    disabled={isAdding || isAdded}
                    className={`w-full py-4 rounded-2xl font-semibold text-white text-lg transition-all ${
                      isAdded 
                        ? 'bg-green-500' 
                        : 'bg-barista-orange hover:bg-orange-600'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <AnimatePresence mode="wait">
                      {isAdding ? (
                        <motion.div
                          key="loading"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center justify-center"
                        >
                          <Loader2 className="w-6 h-6 animate-spin" />
                        </motion.div>
                      ) : isAdded ? (
                        <motion.div
                          key="added"
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center justify-center gap-2"
                        >
                          <Check className="w-6 h-6" />
                          Added!
                        </motion.div>
                      ) : (
                        <motion.span
                          key="add"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          Add to Order • LKR {totalPrice.toLocaleString()}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </div>
              </div>
            </div>
            
            {/* Mobile Fixed bottom CTA */}
            <div className="lg:hidden absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100">
              <motion.button
                onClick={handleAddToCart}
                disabled={isAdding || isAdded}
                className={`w-full py-4 rounded-2xl font-semibold text-white text-lg transition-all ${
                  isAdded 
                    ? 'bg-green-500' 
                    : 'bg-barista-orange hover:bg-orange-600'
                }`}
                whileTap={{ scale: 0.98 }}
              >
                <AnimatePresence mode="wait">
                  {isAdding ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center justify-center"
                    >
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </motion.div>
                  ) : isAdded ? (
                    <motion.div
                      key="added"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center justify-center gap-2"
                    >
                      <Check className="w-6 h-6" />
                      Added!
                    </motion.div>
                  ) : (
                    <motion.span
                      key="add"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      Add to Order • LKR {totalPrice.toLocaleString()}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
