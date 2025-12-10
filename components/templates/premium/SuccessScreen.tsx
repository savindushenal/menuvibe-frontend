'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, X } from 'lucide-react';
import { FranchiseInfo, LocationInfo, TableInfo } from './types';

interface SuccessScreenProps {
  isOpen: boolean;
  onClose: () => void;
  orderNumber: string;
  franchise: FranchiseInfo;
  location: LocationInfo;
  tableInfo: TableInfo | null;
}

export default function SuccessScreen({
  isOpen,
  onClose,
  orderNumber,
  franchise,
  location,
  tableInfo,
}: SuccessScreenProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-white z-[100] flex flex-col items-center justify-center p-6"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', damping: 15 }}
            className="mb-6"
          >
            <CheckCircle2 className="w-24 h-24 text-green-500" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-2xl md:text-3xl font-bold text-franchise-dark text-center"
          >
            Order Placed!
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-gray-600 text-center mt-2 max-w-sm"
          >
            Your order has been sent to the kitchen
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-6 p-4 bg-franchise-background rounded-2xl text-center"
          >
            <p className="text-sm text-gray-500">Order Number</p>
            <p className="text-2xl font-bold text-franchise-primary mt-1">#{orderNumber}</p>
          </motion.div>

          {tableInfo && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="mt-4 text-center"
            >
              <p className="text-sm text-gray-500">Delivering to</p>
              <p className="font-semibold text-franchise-dark">
                Table {tableInfo.table}
                {tableInfo.floor && ` • ${tableInfo.floor}`}
              </p>
              <p className="text-sm text-gray-500 mt-0.5">{location.name}</p>
            </motion.div>
          )}

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="mt-8 px-8 py-3 bg-franchise-primary text-white rounded-full font-semibold hover:shadow-lg transition-shadow"
          >
            Continue Browsing
          </motion.button>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-8 text-xs text-gray-400"
          >
            Powered by MenuVibe
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
