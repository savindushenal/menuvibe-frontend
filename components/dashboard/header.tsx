'use client';

import { Bell, Search, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { motion } from 'framer-motion';

export function DashboardHeader() {
  return (
    <header className="bg-white border-b border-neutral-200 px-8 py-4 sticky top-0 z-10 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <Input
              placeholder="Search menu items, categories..."
              className="pl-10 bg-neutral-50 border-neutral-200 focus:bg-white"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5 text-neutral-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full"></span>
            </Button>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-neutral-50 cursor-pointer transition-colors"
          >
            <Avatar className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-emerald-600">
              <AvatarFallback className="text-white font-semibold">
                <User className="w-5 h-5" />
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:block">
              <p className="text-sm font-semibold text-neutral-900">John Doe</p>
              <p className="text-xs text-neutral-500">Restaurant Owner</p>
            </div>
          </motion.div>
        </div>
      </div>
    </header>
  );
}
