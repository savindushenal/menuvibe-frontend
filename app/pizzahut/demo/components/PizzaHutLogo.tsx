'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

interface PizzaHutLogoProps {
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function PizzaHutLogo({ 
  variant = 'dark', 
  size = 'md',
  className = '' 
}: PizzaHutLogoProps) {
  const sizeClasses = {
    sm: 'w-16 h-8',
    md: 'w-24 h-12',
    lg: 'w-32 h-16',
  };

  return (
    <motion.div 
      className={`relative ${sizeClasses[size]} ${className}`}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Image
        src="/pizzahut-logo.png"
        alt="Pizza Hut"
        fill
        className={`object-contain ${variant === 'light' ? 'brightness-0 invert' : ''}`}
        priority
      />
    </motion.div>
  );
}
