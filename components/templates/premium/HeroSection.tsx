'use client';

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import Image from 'next/image';
import { FranchiseInfo } from './types';

interface HeroSectionProps {
  franchise: FranchiseInfo;
  heroImage?: string;
  title?: string;
  subtitle?: string;
  badgeText?: string;
}

export default function HeroSection({ 
  franchise, 
  heroImage,
  title,
  subtitle,
  badgeText 
}: HeroSectionProps) {
  const defaultHeroImage = franchise.designTokens?.logoUrl || '/placeholder-hero.jpg';
  const displayTitle = title || `Welcome to ${franchise.name}`;
  const displaySubtitle = subtitle || 'Explore our delicious menu';

  return (
    <section className="relative w-full overflow-hidden">
      {/* Hero Image */}
      <div className="relative h-48 sm:h-56 md:h-72 lg:h-80">
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60 z-10" />
        
        {heroImage ? (
          <Image
            src={heroImage}
            alt={franchise.name}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-franchise-primary/20 to-franchise-secondary/20" />
        )}

        {/* Content Overlay */}
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-white p-4">
          {badgeText && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-2 bg-franchise-primary px-4 py-1.5 rounded-full mb-3"
            >
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">{badgeText}</span>
            </motion.div>
          )}

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-center drop-shadow-lg"
          >
            {displayTitle}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-sm sm:text-base md:text-lg text-white/90 text-center mt-2 drop-shadow"
          >
            {displaySubtitle}
          </motion.p>
        </div>
      </div>
    </section>
  );
}
