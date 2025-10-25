'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { UtensilsCrossed } from 'lucide-react';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/auth/login');
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 1, repeat: Infinity, repeatDelay: 1 }}
          className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl flex items-center justify-center mb-6 mx-auto shadow-2xl shadow-emerald-500/30"
        >
          <UtensilsCrossed className="w-12 h-12 text-white" />
        </motion.div>
        <h1 className="text-4xl font-bold text-neutral-900 mb-2">MenuVibe</h1>
        <p className="text-neutral-600">Loading your restaurant platform...</p>
        <motion.div
          className="w-48 h-1 bg-neutral-200 rounded-full mx-auto mt-6 overflow-hidden"
        >
          <motion.div
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 2, ease: 'easeInOut' }}
          />
        </motion.div>
      </motion.div>
    </div>
  );
}
