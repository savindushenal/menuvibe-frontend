'use client';

import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { X, MapPin, CreditCard, Lock, Plus, Minus, ChevronRight, Sparkles } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import LoyaltyOtpVerification from './LoyaltyOtpVerification';
import LoyaltySessionDisplay from './LoyaltySessionDisplay';
import LoyaltyRegistration from './LoyaltyRegistration';
import AddPaymentCard from './AddPaymentCard';

interface CartItem {
  item: any;
  quantity: number;
  customizations: string[];
}

interface CartSheetProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onConfirmOrder: () => void;
  locationName?: string;
  franchiseSlug?: string;
  loyaltyInfo?: any;
  savedCards?: any[];
}

export default function CartSheet({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onConfirmOrder,
  locationName = 'Table 12',
  franchiseSlug = 'barista',
  loyaltyInfo = null,
  savedCards = []
}: CartSheetProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [sliderWidth, setSliderWidth] = useState(0);
  // Use passed loyalty info instead of local state
  const [showAddCard, setShowAddCard] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('cash');
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
      return sum + (cartItem.item.price * cartItem.quantity);
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
              <h2 className="text-xl lg:text-2xl font-bold text-[#1A1A1A]">Your Order</h2>
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
                <>
                  {/* Show loyalty info if authenticated via modal */}
                  {loyaltyInfo && (
                    <div className="mb-6">
                      <LoyaltySessionDisplay
                        loyaltyInfo={loyaltyInfo}
                        savedCards={savedCards}
                        mobileNumber={loyaltyInfo.mobile}
                      />
                    </div>
                  )}

                  <div className="space-y-4 lg:space-y-6">
                  {cartItems.map((cartItem) => {
                    const itemTotal = cartItem.item.price * cartItem.quantity;

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
                          {cartItem.item.image && (
                            <Image
                              src={cartItem.item.image}
                              alt={cartItem.item.name}
                              fill
                              className="object-cover"
                            />
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <h3 className="font-semibold text-[#1A1A1A] lg:text-lg truncate">{cartItem.item.name}</h3>
                            </div>
                            <p className="font-bold text-[#F26522] lg:text-lg whitespace-nowrap">
                              Rs. {itemTotal.toFixed(2)}
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
                </>
              )}

              {/* Order Details */}
              {cartItems.length > 0 && !showAddCard && (
                <div className="mt-6 lg:mt-8 space-y-3 lg:space-y-4">
                  <h3 className="font-semibold text-[#1A1A1A] lg:text-lg">Order Details</h3>

                  <div className="flex items-center justify-between p-3 lg:p-4 bg-[#FFF8F0] rounded-xl">
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 lg:w-6 lg:h-6 text-[#F26522]" />
                      <div>
                        <p className="font-medium lg:text-lg">{locationName}</p>
                        <p className="text-sm text-gray-500">{locationName}</p>
                      </div>
                    </div>
                    <Lock className="w-4 h-4 lg:w-5 lg:h-5 text-gray-400" />
                  </div>

                  {/* Payment Method Selection */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-[#1A1A1A]">Payment Method</label>
                    
                    {/* Saved Cards (only for loyalty members with saved cards) */}
                    {loyaltyInfo && savedCards && savedCards.length > 0 && (
                      <div className="space-y-2">
                        {savedCards.map((card: any) => (
                          <button
                            key={card.id}
                            onClick={() => setSelectedPaymentMethod(`card_${card.id}`)}
                            className={`w-full p-3 rounded-xl border-2 transition-all ${
                              selectedPaymentMethod === `card_${card.id}`
                                ? 'border-orange-500 bg-orange-50'
                                : 'border-gray-200 bg-white hover:border-orange-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <CreditCard className="w-5 h-5 text-[#F26522]" />
                                <div className="text-left">
                                  <p className="font-medium">{card.brand} •••• {card.last4}</p>
                                  <p className="text-xs text-gray-500">
                                    Expires {card.exp_month}/{card.exp_year}
                                  </p>
                                </div>
                              </div>
                              {card.is_default && (
                                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">Default</span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Add New Card Button - only for loyalty members */}
                    {loyaltyInfo && (
                      <button
                        onClick={() => setShowAddCard(true)}
                        className="w-full p-3 rounded-xl border-2 border-dashed border-orange-300 bg-orange-50 hover:bg-orange-100 transition-all"
                      >
                        <div className="flex items-center justify-center gap-2">
                          <Plus className="w-5 h-5 text-orange-600" />
                          <p className="font-medium text-orange-600">Add New Card</p>
                        </div>
                      </button>
                    )}

                    {/* Apple Pay / Google Pay Option */}
                    <button
                      onClick={() => setSelectedPaymentMethod('digital_wallet')}
                      className={`w-full p-3 rounded-xl border-2 transition-all ${
                        selectedPaymentMethod === 'digital_wallet'
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 bg-white hover:border-orange-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 flex items-center justify-center text-lg">📱</div>
                        <div className="text-left">
                          <p className="font-medium">Apple Pay / Google Pay</p>
                          <p className="text-xs text-gray-500">Quick digital payment</p>
                        </div>
                      </div>
                    </button>

                    {/* Demo Card Option */}
                    <button
                      onClick={() => setSelectedPaymentMethod('demo_card')}
                      className={`w-full p-3 rounded-xl border-2 transition-all ${
                        selectedPaymentMethod === 'demo_card'
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 bg-white hover:border-orange-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <CreditCard className="w-5 h-5 text-[#F26522]" />
                        <div className="text-left">
                          <p className="font-medium">Demo Card •••• 4242</p>
                          <p className="text-xs text-gray-500">Visa - For testing only</p>
                        </div>
                      </div>
                    </button>

                    {/* Cash Payment Option */}
                    <button
                      onClick={() => setSelectedPaymentMethod('cash')}
                      className={`w-full p-3 rounded-xl border-2 transition-all ${
                        selectedPaymentMethod === 'cash'
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 bg-white hover:border-orange-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 flex items-center justify-center">💵</div>
                          <div className="text-left">
                            <p className="font-medium">Pay at Counter</p>
                            <p className="text-xs text-gray-500">Cash or Card</p>
                          </div>
                        </div>
                        {selectedPaymentMethod === 'cash' && (
                          <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                            <motion.svg
                              className="w-3 h-3 text-white"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                            >
                              <path d="M5 12l5 5L20 7" />
                            </motion.svg>
                          </div>
                        )}
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* Add Payment Card Form */}
              {showAddCard && loyaltyInfo && (
                <div className="mt-6 lg:mt-8">
                  <AddPaymentCard
                    franchiseSlug={franchiseSlug}
                    sessionToken={''}
                    onCardAdded={(newCard) => {
                      // Card added successfully
                      console.log('Card added:', newCard);
                      setShowAddCard(false);
                      setSelectedPaymentMethod(`card_${newCard.id}`);
                    }}
                    onCancel={() => setShowAddCard(false)}
                  />
                </div>
              )}

              {/* Summary */}
              {cartItems.length > 0 && !showAddCard && (
                <div className="mt-6 lg:mt-8 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-500 lg:text-lg">Subtotal</span>
                    <span className="font-medium lg:text-lg">Rs. {calculateTotal().toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-500 lg:text-lg">Service Charge</span>
                    <span className="font-medium lg:text-lg">Rs. 0.00</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                    <span className="font-bold text-lg lg:text-xl">Total</span>
                    <span className="font-bold text-lg lg:text-xl text-[#F26522]">
                      Rs. {calculateTotal().toFixed(2)}
                    </span>
                  </div>
                  
                  {/* Payment method selection reminder */}
                  {!selectedPaymentMethod && (
                    <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <p className="text-sm text-orange-800 text-center">
                        💳 Select a payment method above to continue
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Slide to Confirm (mobile) / Button (desktop) */}
            {cartItems.length > 0 && selectedPaymentMethod && !showAddCard && (
              <div className="p-4 lg:p-6 bg-white border-t border-gray-100">
                {/* Payment Summary */}
                <div className="mb-3 p-3 bg-orange-50 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-orange-900">
                      {selectedPaymentMethod === 'cash' ? '💵 Pay at Counter' :
                       selectedPaymentMethod === 'digital_wallet' ? '📱 Apple/Google Pay' :
                       selectedPaymentMethod === 'demo_card' ? '💳 Demo Card ••••4242' :
                       selectedPaymentMethod.startsWith('card_') ? '💳 Saved Card' :
                       '💳 Card Payment'}
                    </span>
                    <span className="font-bold text-orange-900">Rs. {calculateTotal().toFixed(2)}</span>
                  </div>
                  {loyaltyInfo && (
                    <p className="text-xs text-orange-700 mt-1">
                      +{Math.floor(calculateTotal() / 10)} loyalty points will be added
                    </p>
                  )}
                </div>

                {/* Mobile: Slide to confirm */}
                <div
                  ref={sliderRef}
                  className="relative h-14 lg:hidden bg-gradient-to-r from-[#F26522]/20 to-[#F26522]/10 rounded-full overflow-hidden"
                >
                  {/* Progress fill */}
                  <motion.div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#F26522]/40 to-[#F26522]/20 rounded-full"
                    style={{ width: backgroundWidth }}
                  />

                  {/* Label */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <motion.span
                      className="text-[#F26522] font-semibold text-sm"
                      style={{ opacity: labelOpacity }}
                    >
                      {isConfirming ? 'Processing Payment...' : 'Slide to Pay →'}
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
                    className="absolute left-1 top-1 bottom-1 w-12 bg-[#F26522] rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing shadow-lg z-10"
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
                  onClick={() => {
                    console.log('Payment:', { method: selectedPaymentMethod, amount: calculateTotal(), loyalty: loyaltyInfo });
                    onConfirmOrder();
                  }}
                  className="hidden lg:flex w-full py-4 bg-[#F26522] hover:bg-orange-600 text-white rounded-2xl font-semibold text-lg items-center justify-center gap-2 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {selectedPaymentMethod === 'cash' ? 'Confirm Order' : 'Pay Now'} • Rs. {calculateTotal().toFixed(2)}
                </motion.button>
              </div>
            )}


          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
