'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, Star, Check } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { MenuItem, CartItem } from './types';

interface ProductSheetProps {
  item: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (cartItem: CartItem) => void;
}

export default function ProductSheet({ item, isOpen, onClose, onAddToCart }: ProductSheetProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedCustomizations, setSelectedCustomizations] = useState<string[]>([]);

  // Reset state when item changes
  const handleClose = () => {
    setQuantity(1);
    setSelectedCustomizations([]);
    onClose();
  };

  if (!item) return null;

  const toggleCustomization = (name: string) => {
    setSelectedCustomizations(prev =>
      prev.includes(name)
        ? prev.filter(c => c !== name)
        : [...prev, name]
    );
  };

  const calculateTotal = () => {
    let total = item.price * quantity;
    item.customizations?.forEach(c => {
      if (selectedCustomizations.includes(c.name)) {
        total += c.price * quantity;
      }
    });
    return total;
  };

  const handleAddToCart = () => {
    onAddToCart({
      item,
      quantity,
      customizations: selectedCustomizations,
    });
    handleClose();
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
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 z-[80]"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-[90] max-h-[90vh] overflow-hidden"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors z-10"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>

            <div className="overflow-y-auto max-h-[calc(90vh-60px)]">
              {/* Image */}
              <div className="relative w-full aspect-[16/10]">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-franchise-neutral flex items-center justify-center">
                    <span className="text-6xl">☕</span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4 md:p-6">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-franchise-dark">{item.name}</h2>
                    {item.rating && (
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm text-gray-600">
                          {item.rating} ({item.reviews} reviews)
                        </span>
                      </div>
                    )}
                  </div>
                  <span className="text-xl md:text-2xl font-bold text-franchise-primary">
                    Rs. {item.price.toLocaleString()}
                  </span>
                </div>

                {/* Description */}
                <p className="text-gray-600 mt-3">{item.description}</p>

                {/* Customizations */}
                {item.customizations && item.customizations.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-semibold text-franchise-dark mb-3">Customizations</h3>
                    <div className="space-y-2">
                      {item.customizations.map((customization) => (
                        <motion.button
                          key={customization.name}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => toggleCustomization(customization.name)}
                          className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                            selectedCustomizations.includes(customization.name)
                              ? 'border-franchise-primary bg-franchise-primary/5'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                                selectedCustomizations.includes(customization.name)
                                  ? 'border-franchise-primary bg-franchise-primary'
                                  : 'border-gray-300'
                              }`}
                            >
                              {selectedCustomizations.includes(customization.name) && (
                                <Check className="w-3 h-3 text-white" />
                              )}
                            </div>
                            <span className="text-franchise-dark">{customization.name}</span>
                          </div>
                          <span className={`font-medium ${customization.price >= 0 ? 'text-franchise-primary' : 'text-green-600'}`}>
                            {customization.price >= 0 ? '+' : ''}Rs. {customization.price.toLocaleString()}
                          </span>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quantity */}
                <div className="mt-6 flex items-center justify-between">
                  <span className="font-semibold text-franchise-dark">Quantity</span>
                  <div className="flex items-center gap-4">
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                      disabled={quantity <= 1}
                    >
                      <Minus className="w-4 h-4 text-franchise-dark" />
                    </motion.button>
                    <span className="text-lg font-semibold text-franchise-dark w-8 text-center">
                      {quantity}
                    </span>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setQuantity(quantity + 1)}
                      className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                      <Plus className="w-4 h-4 text-franchise-dark" />
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>

            {/* Add to Cart Button */}
            <div className="p-4 border-t border-gray-100 bg-white">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleAddToCart}
                className="w-full bg-franchise-primary text-white py-4 rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transition-shadow"
              >
                Add to Cart - Rs. {calculateTotal().toLocaleString()}
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
