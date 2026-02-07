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
              bottom-0 left-0 right-0 rounded-t-3xl max-h-[92vh]
              lg:bottom-auto lg:left-1/2 lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 
              lg:rounded-3xl lg:max-w-2xl lg:w-full lg:max-h-[85vh]"
          >
            {/* Scrollable container for mobile */}
            <div className="overflow-y-auto overscroll-contain max-h-[calc(92vh-60px)] pb-40 lg:pb-0 lg:max-h-none lg:overflow-visible">
              {/* Desktop layout - side by side */}
              <div className="lg:flex lg:flex-row">
                {/* Image */}
                <div className="relative h-64 lg:h-auto lg:w-1/2 lg:min-h-[500px] flex-shrink-0">
                  {/* Drag indicator - mobile only, overlaid on image */}
                  <div className="absolute top-0 left-0 right-0 z-10 flex justify-center pt-3 pb-2 lg:hidden">
                    <div className="w-12 h-1.5 bg-white/70 backdrop-blur-sm rounded-full shadow-sm" />
                  </div>
                  {/* Close button - on image */}
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
                  <h2 className="text-xl lg:text-3xl font-bold text-isso-dark">{item.name}</h2>
              
                  {/* Rating */}
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span className="text-sm font-semibold text-amber-700">{item.rating}</span>
                    </div>
                    <span className="text-sm text-gray-400">({item.reviews} reviews)</span>
                  </div>
              
                  {/* Price */}
                  <div className="mt-4">
                    <span className="text-xs text-gray-400 uppercase tracking-wide">Price</span>
                    <p className="text-2xl lg:text-3xl font-bold text-isso-coral">
                      LKR {item.price.toLocaleString()}
                    </p>
                  </div>
              
                  {/* Description */}
                  <p className="text-gray-500 mt-4 leading-relaxed text-sm lg:text-base">{item.description}</p>
              
                  {/* Customizations */}
                  {item.customizations && item.customizations.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-xs text-gray-400 uppercase tracking-wide mb-3">Customizations</h3>
                      <div className="space-y-2">
                        {item.customizations.map((custom) => (
                          <button
                            key={custom.name}
                            onClick={() => toggleCustomization(custom.name)}
                            className={`w-full flex items-center justify-between p-3.5 rounded-2xl border-2 transition-all ${
                              selectedCustomizations.includes(custom.name)
                                ? 'border-isso-coral bg-gradient-to-r from-isso-coral/5 to-orange-50'
                                : 'border-gray-100 bg-gray-50/50 hover:border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            <span className={`font-medium text-sm ${
                              selectedCustomizations.includes(custom.name) ? 'text-isso-dark' : 'text-gray-600'
                            }`}>{custom.name}</span>
                            <div className="flex items-center gap-3">
                              <span className={`text-sm font-medium ${
                                selectedCustomizations.includes(custom.name) ? 'text-isso-coral' : 'text-gray-400'
                              }`}>+LKR {custom.price}</span>
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                                selectedCustomizations.includes(custom.name)
                                  ? 'bg-isso-coral shadow-lg shadow-isso-coral/30'
                                  : 'bg-white border-2 border-gray-200'
                              }`}>
                                {selectedCustomizations.includes(custom.name) && (
                                  <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                                )}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
              
                  {/* Quantity - Desktop only (mobile has it in bottom bar) */}
                  <div className="hidden lg:flex mt-6 items-center justify-between p-4 bg-gray-50 rounded-2xl">
                    <span className="text-sm text-gray-500">Quantity</span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center hover:bg-gray-100 transition-colors"
                      >
                        <Minus className="w-4 h-4 text-gray-600" />
                      </button>
                      <span className="font-bold text-xl w-8 text-center text-isso-dark">{quantity}</span>
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center hover:bg-gray-100 transition-colors"
                      >
                        <Plus className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </div>                {/* Desktop CTA - inside content area */}
                <div className="hidden lg:block mt-6">
                  <motion.button
                    onClick={handleAddToCart}
                    disabled={isAdding || isAdded}
                    className={`w-full py-4 rounded-2xl font-semibold text-white text-lg transition-all ${
                      isAdded 
                        ? 'bg-green-500' 
                        : 'bg-isso-coral hover:bg-isso-orange'
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
            {/* End scrollable container */}
            
            {/* Mobile Fixed bottom CTA - Premium Design */}
            <div className="lg:hidden absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
              <div className="p-4 pb-6">
                {/* Quantity & Price Row */}
                <div className="flex items-center justify-between mb-3">
                  {/* Quantity Controls */}
                  <div className="flex items-center gap-1 bg-gray-100 rounded-full p-1">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center active:scale-95 transition-transform"
                    >
                      <Minus className="w-4 h-4 text-gray-600" />
                    </button>
                    <span className="font-bold text-lg w-8 text-center text-isso-dark">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center active:scale-95 transition-transform"
                    >
                      <Plus className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                  
                  {/* Total Price */}
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Total</p>
                    <p className="text-xl font-bold text-isso-dark">LKR {totalPrice.toLocaleString()}</p>
                  </div>
                </div>
                
                {/* Add Button */}
                <motion.button
                  onClick={handleAddToCart}
                  disabled={isAdding || isAdded}
                  className={`w-full py-4 rounded-2xl font-semibold text-white text-base transition-all shadow-lg ${
                    isAdded 
                      ? 'bg-green-500 shadow-green-500/30' 
                      : 'bg-gradient-to-r from-isso-coral to-orange-500 shadow-isso-coral/30 active:scale-[0.98]'
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
                        className="flex items-center justify-center gap-2"
                      >
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Adding...</span>
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
                        <span>Added to Cart!</span>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="add"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center justify-center gap-2"
                      >
                        <Plus className="w-5 h-5" />
                        <span>Add to Order</span>
                      </motion.div>
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
