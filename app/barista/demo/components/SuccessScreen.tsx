'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TableInfo } from '../page';

interface SuccessScreenProps {
  isOpen: boolean;
  orderId: string;
  onCancel: () => void;
  onClose: () => void;
  tableInfo: TableInfo | null;
}

export default function SuccessScreen({ isOpen, orderId, onCancel, onClose, tableInfo }: SuccessScreenProps) {
  const [canCancel, setCanCancel] = useState(true);
  const [countdown, setCountdown] = useState(10);
  const router = useRouter();

  useEffect(() => {
    if (!isOpen) {
      setCanCancel(true);
      setCountdown(10);
      return;
    }

    // Play Apple Pay success sound
    const playSound = () => {
      try {
        const audio = new Audio('/sounds/applepay.mp3');
        audio.volume = 0.6;
        audio.play().catch(() => {
          console.log('Audio autoplay blocked');
        });
      } catch (e) {
        console.log('Audio not available');
      }
    };
    
    playSound();
    
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }

    // Countdown timer
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setCanCancel(false);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  const handleCancel = () => {
    if (!canCancel) return;
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    onCancel();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Desktop backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99] bg-black/50 hidden md:block"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center px-8
                       md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2
                       md:w-full md:max-w-md md:rounded-3xl md:shadow-2xl md:py-12"
          >
            {/* Animated Checkmark */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2, stiffness: 200, damping: 15 }}
            >
              <svg
                className="w-24 h-24 md:w-32 md:h-32"
                viewBox="0 0 100 100"
              >
              {/* Circle */}
              <motion.circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#22c55e"
                strokeWidth="3"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.6, ease: 'easeOut', delay: 0.3 }}
              />
              
              {/* Checkmark */}
              <motion.path
                d="M30 50 L45 65 L70 35"
                fill="none"
                stroke="#22c55e"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.4, ease: 'easeOut', delay: 0.8 }}
              />
            </svg>
          </motion.div>

          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="text-center mt-6 md:mt-8"
          >
            <h1 className="text-xl md:text-2xl font-bold text-barista-dark mb-2">
              Order Sent to Kitchen
            </h1>
            <p className="text-gray-500 mb-4 md:mb-6 text-sm md:text-base">
              {tableInfo 
                ? `Sit tight. We'll be at Table ${tableInfo.table} in ~5 mins.`
                : `Your order will be ready for pickup in ~5 mins.`
              }
            </p>
            
            <div className="w-16 h-0.5 bg-gray-200 mx-auto my-4 md:my-6" />
            
            <p className="text-xs md:text-sm text-gray-400">
              Order #{orderId}
            </p>
          </motion.div>

          {/* Done Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="absolute bottom-8 md:bottom-auto md:relative md:mt-8 left-0 right-0 text-center"
          >
            <motion.button
              onClick={onClose}
              className="px-8 py-3 bg-barista-orange text-white rounded-full font-semibold"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Done
            </motion.button>
          </motion.div>

          {/* Confetti/particles effect */}
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{
                backgroundColor: ['#F26522', '#E53935', '#22c55e', '#fbbf24'][i % 4],
                top: '40%',
                left: '50%',
              }}
              initial={{ 
                x: 0, 
                y: 0, 
                scale: 0,
                opacity: 1 
              }}
              animate={{
                x: (Math.random() - 0.5) * 300,
                y: (Math.random() - 0.5) * 300,
                scale: [0, 1, 0],
                opacity: [1, 1, 0],
              }}
              transition={{
                duration: 1.5,
                delay: 0.8 + Math.random() * 0.3,
                ease: 'easeOut',
              }}
            />
          ))}
        </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
