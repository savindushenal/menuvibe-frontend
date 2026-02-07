'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { CartItem } from './types';

interface CartSheetProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (index: number, quantity: number) => void;
  onRemoveItem: (index: number) => void;
  onCheckout: () => void;
}

export default function CartSheet({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
}: CartSheetProps) {
  const calculateItemTotal = (cartItem: CartItem) => {
    // Use selected variation price if available, otherwise use item price
    let total = cartItem.selectedVariation ? cartItem.selectedVariation.price : cartItem.item.price;
    cartItem.item.customizations?.forEach(c => {
      if (cartItem.customizations.includes(c.name)) {
        total += c.price;
      }
    });
    return total * cartItem.quantity;
  };

  const calculateCartTotal = () => {
    return cartItems.reduce((sum, item) => sum + calculateItemTotal(item), 0);
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
            className="fixed inset-0 bg-black/50 z-[80]"
          />

          {/* Sheet */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white z-[90] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-franchise-primary" />
                <h2 className="text-lg font-bold text-franchise-dark">Your Cart</h2>
                <span className="text-sm text-gray-500">({cartItems.length} items)</span>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-4">
              {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <ShoppingBag className="w-16 h-16 mb-4" />
                  <p className="text-lg font-medium">Your cart is empty</p>
                  <p className="text-sm mt-1">Add some items to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cartItems.map((cartItem, index) => (
                    <motion.div
                      key={`${cartItem.item.id}-${index}`}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm"
                    >
                      <div className="flex gap-3">
                        {/* Image */}
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                          {cartItem.item.image ? (
                            <Image
                              src={cartItem.item.image}
                              alt={cartItem.item.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-franchise-neutral flex items-center justify-center">
                              <span className="text-xl">☕</span>
                            </div>
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold text-franchise-dark text-sm line-clamp-1">
                              {cartItem.item.name}
                            </h3>
                            <button
                              onClick={() => onRemoveItem(index)}
                              className="p-1 hover:bg-red-50 rounded-full transition-colors"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          </div>

                          {/* Customizations */}
                          {(cartItem.selectedVariation || cartItem.customizations.length > 0) && (
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                              {[
                                cartItem.selectedVariation?.name,
                                ...cartItem.customizations
                              ].filter(Boolean).join(', ')}
                            </p>
                          )}

                          {/* Quantity & Price */}
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-2">
                              <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => onUpdateQuantity(index, cartItem.quantity - 1)}
                                className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                              >
                                <Minus className="w-3 h-3 text-franchise-dark" />
                              </motion.button>
                              <span className="text-sm font-medium text-franchise-dark w-6 text-center">
                                {cartItem.quantity}
                              </span>
                              <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => onUpdateQuantity(index, cartItem.quantity + 1)}
                                className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                              >
                                <Plus className="w-3 h-3 text-franchise-dark" />
                              </motion.button>
                            </div>
                            <span className="font-bold text-franchise-primary text-sm">
                              Rs. {calculateItemTotal(cartItem).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Checkout Footer */}
            {cartItems.length > 0 && (
              <div className="p-4 border-t border-gray-100 bg-white">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-xl font-bold text-franchise-dark">
                    Rs. {calculateCartTotal().toLocaleString()}
                  </span>
                </div>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={onCheckout}
                  className="w-full bg-franchise-primary text-white py-4 rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transition-shadow"
                >
                  Proceed to Checkout
                </motion.button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
