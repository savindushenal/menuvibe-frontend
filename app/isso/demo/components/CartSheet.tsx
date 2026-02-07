'use client';

import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { X, MapPin, CreditCard, Lock, Plus, Minus, ChevronRight, Sparkles } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { MenuItem } from './TopPicks';

interface CartItem {
  item: MenuItem;
  quantity: number;
  customizations: string[];
}

interface CartSheetProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onAddUpsell: (item: MenuItem) => void;
  onConfirmOrder: () => void;
}

const upsellItem: MenuItem = {
  id: 'fresh-salad-upsell',
  name: 'Fresh Garden Salad',
  price: 850,
  description: 'Crisp seasonal vegetables with house dressing',
  image: '/isso/Fresh Garden Salad.jpg',
  rating: 4.5,
  reviews: 45,
  category: 'Salads',
};

export default function CartSheet({ 
  isOpen, 
  onClose, 
  cartItems, 
  onUpdateQuantity,
  onAddUpsell,
  onConfirmOrder 
}: CartSheetProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [sliderWidth, setSliderWidth] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  
  // Calculate max drag distance
  const thumbWidth = 52;
  const maxDrag = sliderWidth - thumbWidth - 8; // 8 for padding
  
  // Progress based on drag position
  const progress = useTransform(x, [0, maxDrag > 0 ? maxDrag : 1], [0, 1]);
  const backgroundWidth = useTransform(x, [0, maxDrag > 0 ? maxDrag : 1], ['0%', '100%']);
  const labelOpacity = useTransform(progress, [0, 0.3], [1, 0]);
  
  // Update slider width on mount and resize
  useEffect(() => {
    const updateWidth = () => {
      if (sliderRef.current) {
        setSliderWidth(sliderRef.current.offsetWidth);
      }
    };
    
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, [isOpen]);
  
  // Reset slider when cart closes
  useEffect(() => {
    if (!isOpen) {
      x.set(0);
      setIsConfirming(false);
    }
  }, [isOpen, x]);

  const calculateTotal = () => {
    return cartItems.reduce((sum, cartItem) => {
      const customizationsTotal = cartItem.customizations.reduce((cSum, name) => {
        const customization = cartItem.item.customizations?.find(c => c.name === name);
        return cSum + (customization?.price || 0);
      }, 0);
      return sum + (cartItem.item.price + customizationsTotal) * cartItem.quantity;
    }, 0);
  };

  const handleDragEnd = () => {
    const currentX = x.get();
    const threshold = maxDrag * 0.75;
    
    if (currentX > threshold && maxDrag > 0) {
      // Success - complete the slide
      x.set(maxDrag);
      setIsConfirming(true);
      
      if (navigator.vibrate) {
        navigator.vibrate([50, 30, 100]);
      }
      
      setTimeout(() => {
        onConfirmOrder();
        x.set(0);
        setIsConfirming(false);
      }, 400);
    } else {
      // Snap back
      x.set(0);
    }
  };

  const hasUpsellInCart = cartItems.some(ci => ci.item.id === 'brownie-upsell' || ci.item.id === 'brownie');

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
          
          {/* Sheet - Bottom sheet on mobile, side panel on desktop */}
          <motion.div
            initial={{ y: '100%', x: 0 }}
            animate={{ y: 0, x: 0 }}
            exit={{ y: '100%', x: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed z-50 bg-white overflow-hidden flex flex-col
              bottom-0 left-0 right-0 rounded-t-3xl max-h-[90vh]
              lg:bottom-0 lg:right-0 lg:left-auto lg:top-0 lg:rounded-none lg:rounded-l-3xl lg:max-h-full lg:w-[480px]"
          >
            {/* Drag indicator - mobile only */}
            <div className="flex justify-center pt-3 pb-2 lg:hidden">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
            </div>
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 lg:py-6 border-b border-gray-100">
              <button onClick={onClose} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-6 h-6 text-gray-600" />
              </button>
              <h2 className="text-xl lg:text-2xl font-bold text-isso-dark">Your Order</h2>
              <div className="w-10" /> {/* Spacer */}
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4 lg:py-6">
              {/* Cart Items */}
              {cartItems.length === 0 ? (
                <div className="text-center py-12 lg:py-20 text-gray-500">
                  <span className="text-6xl block mb-4">🛒</span>
                  <p className="text-lg">Your cart is empty</p>
                  <p className="text-sm mt-2">Add some delicious items to get started</p>
                </div>
              ) : (
                <div className="space-y-4 lg:space-y-6">
                  {cartItems.map((cartItem) => {
                    // Calculate item total with customizations
                    const customizationsTotal = cartItem.customizations.reduce((sum, name) => {
                      const customization = cartItem.item.customizations?.find(c => c.name === name);
                      return sum + (customization?.price || 0);
                    }, 0);
                    const itemTotal = (cartItem.item.price + customizationsTotal) * cartItem.quantity;
                    
                    return (
                    <motion.div
                      key={cartItem.item.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-4"
                    >
                      {/* Image */}
                      <div className="relative w-16 h-16 lg:w-20 lg:h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                        <Image
                          src={cartItem.item.image}
                          alt={cartItem.item.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      
                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-isso-dark lg:text-lg truncate">{cartItem.item.name}</h3>
                            {cartItem.customizations.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {cartItem.customizations.map((custom, idx) => (
                                  <span 
                                    key={idx} 
                                    className="text-[10px] lg:text-xs bg-orange-50 text-isso-coral px-2 py-0.5 rounded-full"
                                  >
                                    {custom}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <p className="font-bold text-isso-coral lg:text-lg whitespace-nowrap">
                            LKR {itemTotal.toLocaleString()}
                          </p>
                        </div>
                        
                        {/* Quantity controls */}
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => onUpdateQuantity(cartItem.item.id, cartItem.quantity - 1)}
                            className="w-7 h-7 lg:w-8 lg:h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                          >
                            <Minus className="w-3 h-3 lg:w-4 lg:h-4 text-gray-600" />
                          </button>
                          <span className="font-semibold w-6 text-center lg:text-lg">{cartItem.quantity}</span>
                          <button
                            onClick={() => onUpdateQuantity(cartItem.item.id, cartItem.quantity + 1)}
                            className="w-7 h-7 lg:w-8 lg:h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                          >
                            <Plus className="w-3 h-3 lg:w-4 lg:h-4 text-gray-600" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                  })}
                </div>
              )}
              
              {/* Upsell */}
              {cartItems.length > 0 && !hasUpsellInCart && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-6 lg:mt-8 p-4 lg:p-5 bg-gradient-to-r from-isso-cream to-orange-50 rounded-2xl border border-isso-coral/20"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 lg:w-5 lg:h-5 text-isso-coral" />
                    <span className="text-sm lg:text-base font-medium text-isso-coral">Pair with:</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 lg:w-14 lg:h-14 rounded-xl overflow-hidden flex-shrink-0">
                      <Image
                        src={upsellItem.image}
                        alt={upsellItem.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-isso-dark lg:text-lg">{upsellItem.name}</h4>
                      <p className="text-sm text-gray-500">+LKR {upsellItem.price.toLocaleString()}</p>
                    </div>
                    <motion.button
                      onClick={() => onAddUpsell(upsellItem)}
                      className="px-4 py-2 lg:px-6 lg:py-3 bg-isso-coral text-white rounded-full text-sm lg:text-base font-medium"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Add
                    </motion.button>
                  </div>
                </motion.div>
              )}
              
              {/* Order Details */}
              {cartItems.length > 0 && (
                <div className="mt-6 lg:mt-8 space-y-3 lg:space-y-4">
                  <h3 className="font-semibold text-isso-dark lg:text-lg">Order Details</h3>
                  
                  <div className="flex items-center justify-between p-3 lg:p-4 bg-isso-warmGray rounded-xl">
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 lg:w-6 lg:h-6 text-isso-coral" />
                      <div>
                        <p className="font-medium lg:text-lg">Table 12</p>
                        <p className="text-sm text-gray-500">2nd Floor</p>
                      </div>
                    </div>
                    <Lock className="w-4 h-4 lg:w-5 lg:h-5 text-gray-400" />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 lg:p-4 bg-isso-warmGray rounded-xl">
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-5 h-5 lg:w-6 lg:h-6 text-isso-coral" />
                      <div>
                        <p className="font-medium lg:text-lg">Pay at Counter</p>
                        <p className="text-sm text-gray-500">Cash or Card accepted</p>
                      </div>
                    </div>
                    <div className="w-5 h-5 lg:w-6 lg:h-6 rounded-full bg-green-500 flex items-center justify-center">
                      <motion.svg
                        className="w-3 h-3 lg:w-4 lg:h-4 text-white"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                      >
                        <path d="M5 12l5 5L20 7" />
                      </motion.svg>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Summary */}
              {cartItems.length > 0 && (
                <div className="mt-6 lg:mt-8 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-500 lg:text-lg">Subtotal</span>
                    <span className="font-medium lg:text-lg">LKR {calculateTotal().toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-500 lg:text-lg">Service Charge</span>
                    <span className="font-medium lg:text-lg">LKR 0</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                    <span className="font-bold text-lg lg:text-xl">Total</span>
                    <span className="font-bold text-lg lg:text-xl text-isso-coral">
                      LKR {calculateTotal().toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Slide to Confirm (mobile) / Button (desktop) */}
            {cartItems.length > 0 && (
              <div className="p-4 lg:p-6 bg-white border-t border-gray-100">
                {/* Mobile: Slide to confirm */}
                <div 
                  ref={sliderRef}
                  className="relative h-14 lg:hidden bg-gradient-to-r from-isso-coral/20 to-isso-coral/10 rounded-full overflow-hidden"
                >
                  {/* Progress fill */}
                  <motion.div 
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-isso-coral/40 to-isso-coral/20 rounded-full"
                    style={{ width: backgroundWidth }}
                  />
                  
                  {/* Label */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <motion.span 
                      className="text-isso-coral font-semibold text-sm"
                      style={{ opacity: labelOpacity }}
                    >
                      {isConfirming ? 'Confirming...' : 'Slide to Confirm →'}
                    </motion.span>
                  </div>
                  
                  {/* Draggable thumb */}
                  <motion.div
                    drag="x"
                    dragConstraints={{ left: 0, right: maxDrag > 0 ? maxDrag : 0 }}
                    dragElastic={0}
                    dragMomentum={false}
                    onDragEnd={handleDragEnd}
                    style={{ x }}
                    className="absolute left-1 top-1 bottom-1 w-12 bg-isso-coral rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing shadow-lg z-10"
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  >
                    <motion.div
                      animate={{ x: [0, 4, 0] }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                    >
                      <ChevronRight className="w-6 h-6 text-white" />
                    </motion.div>
                  </motion.div>
                </div>

                {/* Desktop: Button */}
                <motion.button
                  onClick={onConfirmOrder}
                  className="hidden lg:flex w-full py-4 bg-isso-coral hover:bg-isso-orange text-white rounded-2xl font-semibold text-lg items-center justify-center gap-2 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Confirm Order • LKR {calculateTotal().toLocaleString()}
                </motion.button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
