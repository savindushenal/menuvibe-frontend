'use client';

import { Bell, User, ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useFranchise } from '@/contexts/franchise-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface FranchiseHeaderProps {
  franchiseSlug: string;
}

export function FranchiseHeader({ franchiseSlug }: FranchiseHeaderProps) {
  const { user, logout } = useAuth();
  const { currentFranchise, branding, myRole } = useFranchise();
  const router = useRouter();

  const franchiseName = currentFranchise?.name || branding?.name || franchiseSlug;
  const userRole = myRole || currentFranchise?.my_role;

  const getRoleDisplay = (role: string | null | undefined) => {
    if (!role) return '';
    const roleMap: Record<string, string> = {
      'franchise_owner': 'Owner',
      'franchise_admin': 'Admin',
      'branch_manager': 'Branch Manager',
      'staff': 'Staff',
      'owner': 'Owner',
      'admin': 'Admin',
      'manager': 'Manager',
      'viewer': 'Viewer',
    };
    return roleMap[role] || role;
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-neutral-200 flex items-center justify-between px-6 flex-shrink-0">
      {/* Left side - Breadcrumb / Title */}
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-semibold text-neutral-900">
          {franchiseName}
        </h1>
        {userRole && (
          <span className="px-2 py-1 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full">
            {getRoleDisplay(userRole)}
          </span>
        )}
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5 text-neutral-600" />
          {/* Notification badge */}
          {/* <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" /> */}
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-neutral-200 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-neutral-600" />
              </div>
              <span className="text-sm font-medium text-neutral-700 hidden sm:inline">
                {user?.name || 'User'}
              </span>
              <ChevronDown className="w-4 h-4 text-neutral-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span>{user?.name}</span>
                <span className="text-xs font-normal text-neutral-500">{user?.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push(`/${franchiseSlug}/settings`)}>
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/auth/select-context')}>
              Switch Context
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600">
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
