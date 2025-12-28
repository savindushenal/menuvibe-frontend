'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

interface BaristaLogoProps {
  className?: string;
  variant?: 'dark' | 'white';
  size?: 'sm' | 'md' | 'lg';
}

export default function BaristaLogo({ className = '', variant = 'dark', size = 'md' }: BaristaLogoProps) {
  // Size configurations
  const sizeConfig = {
    sm: { width: 80, height: 24 },
    md: { width: 120, height: 36 },
    lg: { width: 160, height: 48 },
  };

  const { width, height } = sizeConfig[size];

  return (
    <motion.div
      className={`flex items-center justify-center ${className}`}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Image
        src="/barista-logo.png"
        alt="Barista Coffee"
        width={width}
        height={height}
        className={variant === 'white' ? 'brightness-0 invert' : ''}
        priority
      />
    </motion.div>
  );
}
