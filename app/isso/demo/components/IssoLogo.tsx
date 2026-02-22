'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

interface IssoLogoProps {
  className?: string;
  variant?: 'dark' | 'white';
  size?: 'sm' | 'md' | 'lg';
  logoUrl?: string;
  brandName?: string;
}

export default function IssoLogo({ 
  className = '', 
  variant = 'dark', 
  size = 'md',
  logoUrl = 'https://app.menuvire.com/isso-logo.png',
  brandName = 'ISSO'
}: IssoLogoProps) {
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
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt={brandName}
          width={width}
          height={height}
          className={variant === 'white' ? 'brightness-0 invert' : ''}
          priority
        />
      ) : (
        <span className="text-xl md:text-2xl font-bold">{brandName}</span>
      )}
    </motion.div>
  );
}
