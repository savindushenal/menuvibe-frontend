'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { MapPin, Phone, Clock, Instagram, Facebook, Twitter } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-pizzahut-dark text-white">
      {/* Main Footer Content */}
      <div className="px-4 sm:px-6 lg:px-12 py-8 md:py-12">
        <div className="max-w-7xl mx-auto">
          
          {/* Mobile Layout - Stacked and centered */}
          <div className="md:hidden space-y-8">
            {/* Brand - Centered */}
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="relative w-32 h-12">
                  <Image
                    src="/pizzahut-white-logo.png"
                    alt="Pizza Hut"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed max-w-xs mx-auto">
                Making it great since 1958. Your favorite pizza destination.
              </p>
            </div>

            {/* Contact Info - Compact */}
            <div className="flex flex-col items-center gap-3 text-gray-400 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-pizzahut-red" />
                <span>10 AM – 11 PM Daily</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-pizzahut-red" />
                <span>011-2-456-456</span>
              </div>
            </div>

            {/* Social Links - Centered */}
            <div className="flex items-center justify-center gap-4">
              <a href="#" className="p-2.5 bg-white/10 rounded-full hover:bg-pizzahut-red transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="p-2.5 bg-white/10 rounded-full hover:bg-pizzahut-red transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="p-2.5 bg-white/10 rounded-full hover:bg-pizzahut-red transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Desktop Layout - Grid */}
          <div className="hidden md:grid md:grid-cols-3 gap-8 lg:gap-12">
            
            {/* Brand Column */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="relative w-36 h-14">
                  <Image
                    src="/pizzahut-logo.png"
                    alt="Pizza Hut"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                Making it great since 1958. The world&apos;s largest pizza company, committed to serving hot, delicious pizza for everyone.
              </p>
              {/* Social Links */}
              <div className="flex items-center gap-3">
                <a href="#" className="p-2 bg-white/10 rounded-full hover:bg-pizzahut-red transition-colors">
                  <Instagram className="w-4 h-4" />
                </a>
                <a href="#" className="p-2 bg-white/10 rounded-full hover:bg-pizzahut-red transition-colors">
                  <Facebook className="w-4 h-4" />
                </a>
                <a href="#" className="p-2 bg-white/10 rounded-full hover:bg-pizzahut-red transition-colors">
                  <Twitter className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold text-lg mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-pizzahut-red transition-colors">Our Menu</a></li>
                <li><a href="#" className="hover:text-pizzahut-red transition-colors">Locations</a></li>
                <li><a href="#" className="hover:text-pizzahut-red transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-pizzahut-red transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-pizzahut-red transition-colors">Franchise</a></li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="font-semibold text-lg mb-4">Contact</h4>
              <ul className="space-y-3 text-gray-400">
                <li className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 mt-1 text-pizzahut-red flex-shrink-0" />
                  <span className="text-sm">Pizza Hut Union Place, No. 45, Union Place, Colombo 02</span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-pizzahut-red flex-shrink-0" />
                  <span className="text-sm">011-2-456-456</span>
                </li>
                <li className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-pizzahut-red flex-shrink-0" />
                  <span className="text-sm">10 AM – 11 PM Daily</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10 px-4 sm:px-6 lg:px-12 py-4">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-3 md:flex-row md:justify-between md:gap-4">
          <p className="text-gray-500 text-xs md:text-sm text-center md:text-left">
            © 2025 Pizza Hut Sri Lanka
          </p>
          <div className="flex items-center gap-3 md:gap-4 text-gray-500 text-xs md:text-sm">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <span>•</span>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
          </div>
          {/* Powered by MenuVire */}
          <motion.div 
            className="flex items-center gap-1.5 text-gray-500 text-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <span>Powered by</span>
            <span className="font-semibold text-pizzahut-red">MenuVire</span>
          </motion.div>
        </div>
      </div>
    </footer>
  );
}
