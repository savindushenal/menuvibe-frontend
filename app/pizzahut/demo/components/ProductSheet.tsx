'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Check, Loader2, Minus, Plus } from 'lucide-react';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { MenuItem, SizeOption, CrustOption, ToppingOption } from '../types';

interface ProductSheetProps {
  item: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (item: MenuItem, quantity: number, selectedSize: SizeOption | null, selectedCrust: CrustOption | null, selectedToppings: string[]) => void;
}

export default function ProductSheet({ item, isOpen, onClose, onAddToCart }: ProductSheetProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<SizeOption | null>(null);
  const [selectedCrust, setSelectedCrust] = useState<CrustOption | null>(null);
  const [selectedToppings, setSelectedToppings] = useState<string[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  // Reset selections when item changes
  useEffect(() => {
    if (item) {
      setSelectedSize(item.sizes?.[1] || item.sizes?.[0] || null); // Default to medium
      setSelectedCrust(item.crusts?.[0] || null); // Default to first crust
      setSelectedToppings([]);
      setQuantity(1);
    }
  }, [item]);

  if (!item) return null;

  // Calculate total price
  const basePrice = selectedSize?.price || item.price;
  const crustPrice = selectedCrust?.price || 0;
  const toppingsPrice = selectedToppings.reduce((sum, toppingId) => {
    const topping = item.toppings?.find(t => t.id === toppingId);
    return sum + (topping?.price || 0);
  }, 0);
  const totalPrice = (basePrice + crustPrice + toppingsPrice) * quantity;

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
      onAddToCart(item, quantity, selectedSize, selectedCrust, selectedToppings);
      setIsAdded(false);
      setQuantity(1);
      onClose();
    }, 600);
  };

  const toggleTopping = (toppingId: string) => {
    setSelectedToppings(prev => 
      prev.includes(toppingId) 
        ? prev.filter(t => t !== toppingId)
        : [...prev, toppingId]
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
          
          {/* Sheet */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed z-50 bg-white overflow-hidden
              bottom-0 left-0 right-0 rounded-t-3xl max-h-[92vh]
              lg:bottom-auto lg:left-1/2 lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 
              lg:rounded-3xl lg:max-w-2xl lg:w-full lg:max-h-[85vh]"
          >
            {/* Scrollable container */}
            <div className="overflow-y-auto overscroll-contain max-h-[calc(92vh-80px)] pb-24 lg:pb-0 lg:max-h-[calc(85vh-80px)]">
              {/* Desktop layout - side by side */}
              <div className="lg:flex lg:flex-row">
                {/* Image */}
                <div className="relative h-64 lg:h-auto lg:w-1/2 lg:min-h-[500px] flex-shrink-0">
                  {/* Drag indicator - mobile only */}
                  <div className="absolute top-0 left-0 right-0 z-10 flex justify-center pt-3 pb-2 lg:hidden">
                    <div className="w-12 h-1.5 bg-white/70 backdrop-blur-sm rounded-full shadow-sm" />
                  </div>
                  {/* Close button */}
                  <button
                    onClick={onClose}
                    className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors z-20 shadow-md"
                  >
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                </div>
                
                {/* Content */}
                <div className="p-5 lg:pb-6 lg:overflow-y-auto lg:max-h-[500px] lg:w-1/2 lg:flex lg:flex-col">
                  {/* Title */}
                  <h2 className="text-xl lg:text-2xl font-bold text-pizzahut-dark">{item.name}</h2>
              
                  {/* Rating */}
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span className="text-sm font-semibold text-amber-700">{item.rating}</span>
                    </div>
                    <span className="text-sm text-gray-400">({item.reviews} reviews)</span>
                  </div>
              
                  {/* Description */}
                  <p className="text-gray-500 mt-3 leading-relaxed text-sm lg:text-base">{item.description}</p>

                  {/* Size Selector */}
                  {item.sizes && item.sizes.length > 0 && (
                    <div className="mt-5">
                      <h3 className="text-xs text-gray-400 uppercase tracking-wide mb-3">Choose Your Size</h3>
                      <div className="grid grid-cols-3 gap-2">
                        {item.sizes.map((size) => (
                          <motion.button
                            key={size.id}
                            onClick={() => setSelectedSize(size)}
                            className={`relative p-3 rounded-xl border-2 transition-all text-center ${
                              selectedSize?.id === size.id 
                                ? 'border-pizzahut-red bg-pizzahut-red/5 shadow-lg shadow-red-500/20'
                                : 'border-gray-200 bg-white hover:border-pizzahut-red/50'
                            }`}
                            whileTap={{ scale: 0.98 }}
                          >
                            {selectedSize?.id === size.id && (
                              <motion.div
                                className="absolute top-1 right-1 w-4 h-4 bg-pizzahut-red rounded-full flex items-center justify-center"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                              >
                                <Check className="w-2.5 h-2.5 text-white" />
                              </motion.div>
                            )}
                            <p className="font-bold text-sm">{size.name}</p>
                            <p className="text-gray-400 text-xs">{size.size}</p>
                            <p className="font-semibold text-pizzahut-red text-sm mt-1">
                              Rs. {size.price.toLocaleString()}
                            </p>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Crust Selector */}
                  {item.crusts && item.crusts.length > 0 && (
                    <div className="mt-5">
                      <h3 className="text-xs text-gray-400 uppercase tracking-wide mb-3">Choose Your Crust</h3>
                      <div className="space-y-2">
                        {item.crusts.map((crust) => (
                          <motion.button
                            key={crust.id}
                            onClick={() => setSelectedCrust(crust)}
                            className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                              selectedCrust?.id === crust.id
                                ? 'border-pizzahut-red bg-pizzahut-red/5'
                                : 'border-gray-200 hover:border-pizzahut-red/50'
                            }`}
                            whileTap={{ scale: 0.99 }}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                selectedCrust?.id === crust.id ? 'border-pizzahut-red' : 'border-gray-300'
                              }`}>
                                {selectedCrust?.id === crust.id && (
                                  <motion.div
                                    className="w-3 h-3 bg-pizzahut-red rounded-full"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                  />
                                )}
                              </div>
                              <span className="font-medium text-sm">{crust.name}</span>
                            </div>
                            <span className={`text-sm font-medium ${
                              crust.price > 0 ? 'text-pizzahut-red' : 'text-green-600'
                            }`}>
                              {crust.price > 0 ? `+Rs.${crust.price}` : 'Free'}
                            </span>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Extra Toppings */}
                  {item.toppings && item.toppings.length > 0 && (
                    <div className="mt-5">
                      <h3 className="text-xs text-gray-400 uppercase tracking-wide mb-3">Extra Toppings (Optional)</h3>
                      <div className="space-y-2">
                        {item.toppings.map((topping) => (
                          <motion.button
                            key={topping.id}
                            onClick={() => toggleTopping(topping.id)}
                            className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all ${
                              selectedToppings.includes(topping.id)
                                ? 'border-pizzahut-red bg-pizzahut-red/5'
                                : 'border-gray-100 bg-gray-50/50 hover:border-gray-200'
                            }`}
                            whileTap={{ scale: 0.99 }}
                          >
                            <span className={`font-medium text-sm ${
                              selectedToppings.includes(topping.id) ? 'text-pizzahut-dark' : 'text-gray-600'
                            }`}>{topping.name}</span>
                            <div className="flex items-center gap-3">
                              <span className={`text-sm font-medium ${
                                selectedToppings.includes(topping.id) ? 'text-pizzahut-red' : 'text-gray-400'
                              }`}>+Rs.{topping.price}</span>
                              <div className={`w-5 h-5 rounded flex items-center justify-center transition-all ${
                                selectedToppings.includes(topping.id)
                                  ? 'bg-pizzahut-red'
                                  : 'bg-white border-2 border-gray-200'
                              }`}>
                                {selectedToppings.includes(topping.id) && (
                                  <Check className="w-3 h-3 text-white" strokeWidth={3} />
                                )}
                              </div>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  )}
              
                  {/* Quantity - Desktop only */}
                  <div className="hidden lg:flex mt-5 items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <span className="text-sm text-gray-500">Quantity</span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center hover:bg-gray-100 transition-colors"
                      >
                        <Minus className="w-4 h-4 text-gray-600" />
                      </button>
                      <span className="font-bold text-lg w-8 text-center text-pizzahut-dark">{quantity}</span>
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center hover:bg-gray-100 transition-colors"
                      >
                        <Plus className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </div>

                  {/* Desktop CTA */}
                  <div className="hidden lg:block mt-5">
                    <motion.button
                      onClick={handleAddToCart}
                      disabled={isAdding || isAdded}
                      className={`w-full py-4 rounded-xl font-semibold text-white text-lg transition-all ${
                        isAdded 
                          ? 'bg-green-500' 
                          : 'bg-pizzahut-red hover:bg-pizzahut-redDark'
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
            </div>

            {/* Mobile bottom bar */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 z-10">
              <div className="flex items-center gap-4">
                {/* Quantity */}
                <div className="flex items-center gap-2 bg-gray-100 rounded-full px-2 py-1">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 rounded-full bg-white flex items-center justify-center"
                  >
                    <Minus className="w-4 h-4 text-gray-600" />
                  </button>
                  <span className="font-bold w-6 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-8 h-8 rounded-full bg-white flex items-center justify-center"
                  >
                    <Plus className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
                
                {/* Add button */}
                <motion.button
                  onClick={handleAddToCart}
                  disabled={isAdding || isAdded}
                  className={`flex-1 py-3.5 rounded-xl font-semibold text-white transition-all ${
                    isAdded 
                      ? 'bg-green-500' 
                      : 'bg-pizzahut-red'
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
                        <Loader2 className="w-5 h-5 animate-spin" />
                      </motion.div>
                    ) : isAdded ? (
                      <motion.div
                        key="added"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center justify-center gap-2"
                      >
                        <Check className="w-5 h-5" />
                        Added!
                      </motion.div>
                    ) : (
                      <motion.span
                        key="add"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        Add • LKR {totalPrice.toLocaleString()}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
