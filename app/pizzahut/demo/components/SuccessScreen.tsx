'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, ChefHat, X, Loader2, Undo2 } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import confetti from 'canvas-confetti';

interface SuccessScreenProps {
  isOpen: boolean;
  onClose: () => void;
  orderNumber: number;
  onCancel: () => void;
  orderItems: { name: string; quantity: number }[];
}

export default function SuccessScreen({
  isOpen,
  onClose,
  orderNumber,
  onCancel,
  orderItems
}: SuccessScreenProps) {
  const [timeLeft, setTimeLeft] = useState(30);
  const [canCancel, setCanCancel] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const confettiFired = useRef(false);

  useEffect(() => {
    if (isOpen && !confettiFired.current) {
      confettiFired.current = true;
      
      // Fire confetti from multiple points
      const duration = 2000;
      const end = Date.now() + duration;
      
      const colors = ['#EE3124', '#FFD700', '#FF4538', '#FFFFFF'];
      
      (function frame() {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.8 },
          colors: colors
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.8 },
          colors: colors
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      })();
      
      // Center burst
      setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: colors
        });
      }, 300);
    }

    if (!isOpen) {
      confettiFired.current = false;
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeLeft(30);
      setCanCancel(true);
      
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setCanCancel(false);
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen]);

  const handleCancel = async () => {
    if (!canCancel) return;
    setIsCancelling(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    onCancel();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        >
          {/* Background */}
          <motion.div 
            className="absolute inset-0 bg-gradient-to-br from-pizzahut-red via-red-600 to-orange-600"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          />
          
          {/* Content */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="relative z-10 w-full max-w-md"
          >
            {/* Card */}
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
              {/* Success animation */}
              <div className="pt-10 pb-6 px-6 flex flex-col items-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2, damping: 10, stiffness: 200 }}
                  className="relative"
                >
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-pizzahut-red to-orange-500 flex items-center justify-center">
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', delay: 0.4, damping: 10 }}
                    >
                      <CheckCircle className="w-12 h-12 text-white" strokeWidth={2.5} />
                    </motion.div>
                  </div>
                  
                  {/* Animated ring */}
                  <motion.div
                    className="absolute inset-0 rounded-full border-4 border-pizzahut-red"
                    initial={{ scale: 1, opacity: 1 }}
                    animate={{ scale: 1.5, opacity: 0 }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: 'easeOut' }}
                  />
                </motion.div>
                
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl font-bold text-pizzahut-dark mt-6"
                >
                  Order Confirmed! 🍕
                </motion.h1>
                
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-gray-500 mt-2 text-center"
                >
                  Your delicious Pizza Hut order is being prepared
                </motion.p>
              </div>
              
              {/* Order number */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="px-6 py-6 bg-gradient-to-r from-red-50 to-orange-50"
              >
                <div className="text-center">
                  <p className="text-sm text-gray-500 uppercase tracking-wider mb-1">Order Number</p>
                  <motion.p
                    className="text-5xl font-bold text-pizzahut-red"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.6, damping: 10 }}
                  >
                    #{String(orderNumber).padStart(3, '0')}
                  </motion.p>
                </div>
                
                {/* Order items */}
                <div className="mt-4 space-y-1">
                  {orderItems.slice(0, 3).map((item, idx) => (
                    <motion.p
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + idx * 0.1 }}
                      className="text-sm text-gray-600 text-center"
                    >
                      {item.quantity}x {item.name}
                    </motion.p>
                  ))}
                  {orderItems.length > 3 && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.9 }}
                      className="text-sm text-gray-400 text-center"
                    >
                      +{orderItems.length - 3} more items
                    </motion.p>
                  )}
                </div>
              </motion.div>
              
              {/* Kitchen status */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="px-6 py-4 flex items-center justify-center gap-3 bg-pizzahut-warmGray"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                  className="w-8 h-8 rounded-full bg-pizzahut-red/10 flex items-center justify-center"
                >
                  <ChefHat className="w-4 h-4 text-pizzahut-red" />
                </motion.div>
                <p className="text-sm text-pizzahut-dark font-medium">
                  Kitchen is preparing your order...
                </p>
              </motion.div>
              
              {/* Cancel timer */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="px-6 py-4"
              >
                {canCancel ? (
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <motion.div 
                        className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ repeat: Infinity, duration: 1 }}
                      >
                        <span className="text-sm font-bold text-gray-700">{timeLeft}</span>
                      </motion.div>
                      <p className="text-xs text-gray-500">seconds to cancel</p>
                    </div>
                    
                    <motion.button
                      onClick={handleCancel}
                      disabled={isCancelling}
                      className="flex items-center justify-center gap-2 w-full py-2.5 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all disabled:opacity-50"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {isCancelling ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Undo2 className="w-4 h-4" />
                      )}
                      <span className="text-sm font-medium">
                        {isCancelling ? 'Cancelling...' : 'Cancel Order'}
                      </span>
                    </motion.button>
                  </div>
                ) : (
                  <p className="text-center text-xs text-gray-400">
                    Order cannot be cancelled anymore
                  </p>
                )}
              </motion.div>
              
              {/* Done button */}
              <div className="p-6 pt-2">
                <motion.button
                  onClick={onClose}
                  className="w-full py-4 bg-pizzahut-red hover:bg-pizzahut-redDark text-white rounded-xl font-semibold transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Done
                </motion.button>
              </div>
            </div>
          </motion.div>
          
          {/* Close button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center z-20"
          >
            <X className="w-5 h-5 text-white" />
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
