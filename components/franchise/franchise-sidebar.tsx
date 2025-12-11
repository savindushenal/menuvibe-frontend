'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  UtensilsCrossed,
  Building2,
  Users,
  MapPin,
  Settings,
  ChevronLeft,
  Menu,
  LogOut,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useParams, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useFranchise } from '@/contexts/franchise-context';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';

interface FranchiseSidebarProps {
  franchiseSlug: string;
}

export function FranchiseSidebar({ franchiseSlug }: FranchiseSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const { currentFranchise, branding } = useFranchise();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: `/${franchiseSlug}/dashboard` },
    { icon: UtensilsCrossed, label: 'Menus', href: `/${franchiseSlug}/dashboard/menus` },
    { icon: MapPin, label: 'Locations', href: `/${franchiseSlug}/dashboard/locations` },
    { icon: Building2, label: 'Branches', href: `/${franchiseSlug}/dashboard/branches` },
    { icon: Users, label: 'Team', href: `/${franchiseSlug}/dashboard/team` },
    { icon: Settings, label: 'Settings', href: `/${franchiseSlug}/dashboard/settings` },
  ];

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

  const franchiseName = currentFranchise?.name || branding?.name || franchiseSlug;
  const franchiseLogo = currentFranchise?.logo_url || branding?.logo_url;
  const brandColor = branding?.primary_color || '#10b981';

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleSwitchContext = () => {
    router.push('/auth/select-context');
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="bg-white border-r border-neutral-200 h-screen flex flex-col shadow-sm flex-shrink-0"
    >
      {/* Header with franchise branding */}
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
              {franchiseLogo ? (
                <img 
                  src={franchiseLogo} 
                  alt={franchiseName}
                  className="w-10 h-10 rounded-xl object-cover shadow-md"
                />
              ) : (
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md text-white font-bold"
                  style={{ backgroundColor: brandColor }}
                >
                  {franchiseName.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h2 className="font-bold text-neutral-900 truncate max-w-[150px]">
                  {franchiseName}
                </h2>
                <p className="text-xs text-neutral-500">Franchise Dashboard</p>
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

      {/* Navigation items */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto min-h-0">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                isActive
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900",
                collapsed && "justify-center px-0"
              )}
              style={isActive ? { backgroundColor: `${brandColor}15`, color: brandColor } : undefined}
            >
              <item.icon className={cn(
                "w-5 h-5 flex-shrink-0",
                isActive ? "text-current" : "text-neutral-400"
              )} />
              
              <AnimatePresence mode="wait">
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="font-medium whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      {/* Footer with actions */}
      <div className="p-4 border-t border-neutral-200 space-y-2">
        {/* Switch Context Button */}
        <motion.button
          onClick={handleSwitchContext}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition-colors",
            collapsed && "justify-center px-0"
          )}
        >
          <ArrowLeft className="w-5 h-5 text-neutral-400" />
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="font-medium whitespace-nowrap"
              >
                Switch Context
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Logout Button */}
        <motion.button
          onClick={handleLogout}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors",
            collapsed && "justify-center px-0"
          )}
        >
          <LogOut className="w-5 h-5" />
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="font-medium whitespace-nowrap"
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
