'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, X } from 'lucide-react';
import { useEffect } from 'react';

interface ToastNotificationProps {
  show: boolean;
  message: string;
  onClose: () => void;
  duration?: number;
}

export default function ToastNotification({ 
  show, 
  message, 
  onClose, 
  duration = 3000 
}: ToastNotificationProps) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.8 }}
          transition={{ 
            type: "spring", 
            damping: 25, 
            stiffness: 300,
            mass: 0.5
          }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[95%] max-w-lg"
        >
          <div className="bg-white rounded-2xl shadow-2xl border-2 border-green-500 overflow-hidden">
            <div className="flex items-center gap-4 p-5">
              {/* Success Icon */}
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                  <CheckCircle className="w-7 h-7 text-white" />
                </div>
              </div>
              
              {/* Message */}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 text-base">Added to Cart!</p>
                <p className="text-sm text-gray-600 truncate mt-0.5">{message}</p>
              </div>
              
              {/* Close Button */}
              <button
                onClick={onClose}
                className="flex-shrink-0 p-1.5 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            {/* Progress Bar */}
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: duration / 1000, ease: 'linear' }}
              className="h-1.5 bg-green-500"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
