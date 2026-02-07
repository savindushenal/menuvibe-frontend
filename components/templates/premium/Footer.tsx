'use client';

import { Coffee, Instagram, Facebook, Twitter } from 'lucide-react';
import { FranchiseInfo } from './types';
import Image from 'next/image';

interface FooterProps {
  franchise: FranchiseInfo;
}

export default function Footer({ franchise }: FooterProps) {
  return (
    <footer className="bg-franchise-dark text-white mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-3">
            {franchise.logoUrl ? (
              <Image
                src={franchise.logoUrl}
                alt={franchise.name}
                width={120}
                height={40}
                className="h-8 w-auto brightness-0 invert"
              />
            ) : (
              <>
                <Coffee className="w-6 h-6 text-franchise-primary" />
                <span className="text-xl font-bold">{franchise.name}</span>
              </>
            )}
          </div>

          {/* Links */}
          <nav className="flex items-center gap-6 text-sm">
            <a href="#" className="hover:text-franchise-primary transition-colors">Menu</a>
            <a href="#" className="hover:text-franchise-primary transition-colors">Locations</a>
            <a href="#" className="hover:text-franchise-primary transition-colors">About</a>
            <a href="#" className="hover:text-franchise-primary transition-colors">Contact</a>
          </nav>

          {/* Social */}
          <div className="flex items-center gap-4">
            <a href="#" className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <Instagram className="w-5 h-5" />
            </a>
            <a href="#" className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <Facebook className="w-5 h-5" />
            </a>
            <a href="#" className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <Twitter className="w-5 h-5" />
            </a>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-8 pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <p>© {new Date().getFullYear()} {franchise.name}. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Powered by <a href="https://MenuVire.com" className="text-franchise-primary hover:underline">MenuVire</a>
          </p>
        </div>
      </div>
    </footer>
  );
}
