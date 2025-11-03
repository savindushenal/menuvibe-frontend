'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  UtensilsCrossed,
  Building,
  QrCode,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: UtensilsCrossed, label: 'Menu Management', href: '/dashboard/menu' },
  { icon: Building, label: 'Restaurant Profile', href: '/dashboard/profile' },
  { icon: QrCode, label: 'QR Codes', href: '/dashboard/qr-codes' },
  { icon: BarChart3, label: 'Analytics', href: '/dashboard/analytics' },
  { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  // Auto-collapse on mobile on initial load
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      if (mobile) {
        setCollapsed(true);
      }
    };

    checkMobile();
  }, []);

  return (
    <motion.aside
      animate={{ width: collapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="bg-white border-r border-neutral-200 h-screen sticky top-0 flex flex-col shadow-sm"
    >
      <div className={cn(
        "p-6 border-b border-neutral-200 flex items-center",
        collapsed ? "justify-center" : "justify-between"
      )}>
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
                <UtensilsCrossed className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-neutral-900">MenuVibe</h2>
                <p className="text-xs text-neutral-500">Restaurant Platform</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {collapsed ? (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            title="Expand sidebar"
          >
            <Menu className="w-5 h-5 text-neutral-600" />
          </motion.button>
        ) : (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            title="Collapse sidebar"
          >
            <ChevronLeft className="w-5 h-5 text-neutral-600" />
          </motion.button>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ x: 4 }}
                transition={{ type: 'spring', stiffness: 300 }}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                  isActive
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                    : 'text-neutral-700 hover:bg-neutral-100'
                )}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <AnimatePresence mode="wait">
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="font-medium whitespace-nowrap overflow-hidden"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-neutral-200">
        <motion.button
          whileHover={{ x: 4 }}
          transition={{ type: 'spring', stiffness: 300 }}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-neutral-700 hover:bg-red-50 hover:text-red-600 transition-all duration-200 w-full"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="font-medium whitespace-nowrap overflow-hidden"
              >
                Logout
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </motion.aside>
  );
}
