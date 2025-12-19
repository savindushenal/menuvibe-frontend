'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Settings,
  Ticket,
  Activity,
  Shield,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Building,
  Menu,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { NotificationsDropdown } from '@/components/admin/notifications-dropdown';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const adminNavItems = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
    roles: ['admin', 'super_admin', 'support_officer'],
  },
  {
    title: 'Users',
    href: '/admin/users',
    icon: Users,
    roles: ['admin', 'super_admin', 'support_officer'],
  },
  {
    title: 'Subscriptions',
    href: '/admin/subscriptions',
    icon: CreditCard,
    roles: ['admin', 'super_admin', 'support_officer'],
  },
  {
    title: 'Support Tickets',
    href: '/admin/tickets',
    icon: Ticket,
    roles: ['admin', 'super_admin', 'support_officer'],
  },
  {
    title: 'Activity Logs',
    href: '/admin/activity',
    icon: Activity,
    roles: ['admin', 'super_admin', 'support_officer'],
  },
  {
    title: 'Platform Settings',
    href: '/admin/settings',
    icon: Settings,
    roles: ['super_admin'],
  },
  {
    title: 'Franchises',
    href: '/admin/franchises',
    icon: Building,
    roles: ['admin', 'super_admin', 'support_officer'],
  },
];

const superAdminNavItems = [
  {
    title: 'Super Admin Dashboard',
    href: '/admin',
    icon: Shield,
    roles: ['super_admin'],
  },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && (!user || !['admin', 'super_admin', 'support_officer'].includes(user.role))) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="mt-4 text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !['admin', 'super_admin', 'support_officer'].includes(user.role)) {
    return null;
  }

  const isSuperAdmin = user.role === 'super_admin';

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  const NavItem = ({ item, isCollapsed }: { item: typeof adminNavItems[0]; isCollapsed: boolean }) => {
    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
    const Icon = item.icon;

    if (!item.roles.includes(user.role)) {
      return null;
    }

    const linkContent = (
      <Link
        href={item.href}
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
          isActive
            ? 'bg-emerald-100 text-emerald-700'
            : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
        )}
        onClick={() => setMobileMenuOpen(false)}
      >
        <Icon className="h-5 w-5 flex-shrink-0" />
        {!isCollapsed && <span className="font-medium">{item.title}</span>}
      </Link>
    );

    if (isCollapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
          <TooltipContent side="right">
            <p>{item.title}</p>
          </TooltipContent>
        </Tooltip>
      );
    }

    return linkContent;
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-neutral-50">
        {/* Mobile Header */}
        <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-emerald-600" />
            <span className="font-bold text-lg">Admin Panel</span>
          </div>
          <div className="flex items-center gap-2">
            <NotificationsDropdown />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={cn(
            'fixed top-0 left-0 z-50 h-full bg-white border-r transition-all duration-300',
            collapsed ? 'w-16' : 'w-64',
            'hidden lg:block'
          )}
        >
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-4 border-b">
            {!collapsed && (
              <div className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-emerald-600" />
                <span className="font-bold text-lg">Admin Panel</span>
              </div>
            )}
            {collapsed && <Shield className="h-6 w-6 text-emerald-600 mx-auto" />}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed(!collapsed)}
              className={cn('hidden lg:flex', collapsed && 'mx-auto')}
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Navigation */}
          <nav className="p-3 space-y-1">
            {adminNavItems.map((item) => (
              <NavItem key={item.href} item={item} isCollapsed={collapsed} />
            ))}

            {isSuperAdmin && (
              <>
                <div className={cn('my-4 border-t', collapsed && 'mx-2')} />
                {superAdminNavItems.map((item) => (
                  <NavItem key={item.href} item={item} isCollapsed={collapsed} />
                ))}
              </>
            )}
          </nav>

          {/* User & Logout */}
          <div className="absolute bottom-0 left-0 right-0 p-3 border-t bg-white">
            <div className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
              <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-medium text-emerald-700">
                  {user.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.name}</p>
                  <p className="text-xs text-neutral-500 truncate">{user.role}</p>
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size={collapsed ? 'icon' : 'default'}
              className={cn('w-full mt-2', collapsed && 'px-0')}
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              {!collapsed && <span className="ml-2">Logout</span>}
            </Button>
          </div>
        </aside>

        {/* Mobile Sidebar */}
        <aside
          className={cn(
            'fixed top-0 left-0 z-50 h-full w-64 bg-white border-r transition-transform duration-300 lg:hidden',
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          {/* Logo */}
          <div className="h-16 flex items-center px-4 border-b">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-emerald-600" />
              <span className="font-bold text-lg">Admin Panel</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="p-3 space-y-1">
            {adminNavItems.map((item) => (
              <NavItem key={item.href} item={item} isCollapsed={false} />
            ))}

            {isSuperAdmin && (
              <>
                <div className="my-4 border-t" />
                {superAdminNavItems.map((item) => (
                  <NavItem key={item.href} item={item} isCollapsed={false} />
                ))}
              </>
            )}
          </nav>

          {/* User & Logout */}
          <div className="absolute bottom-0 left-0 right-0 p-3 border-t bg-white">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
                <span className="text-sm font-medium text-emerald-700">
                  {user.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-neutral-500 truncate">{user.role}</p>
              </div>
            </div>
            <Button variant="ghost" className="w-full mt-2" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main
          className={cn(
            'transition-all duration-300 pt-16 lg:pt-0',
            collapsed ? 'lg:ml-16' : 'lg:ml-64'
          )}
        >
          {/* Desktop Top Bar */}
          <div className="hidden lg:flex h-16 items-center justify-end px-6 border-b bg-white">
            <div className="flex items-center gap-4">
              <NotificationsDropdown />
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
                  <span className="text-sm font-medium text-emerald-700">
                    {user.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="text-sm">
                  <p className="font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user.role?.replace('_', ' ')}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="p-6">{children}</div>
        </main>
      </div>
    </TooltipProvider>
  );
}
