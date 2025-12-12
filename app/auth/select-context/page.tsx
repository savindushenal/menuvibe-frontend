'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2, User, ArrowRight, LogOut } from 'lucide-react';

interface UserContext {
  type: 'personal' | 'franchise';
  id: number | null;
  slug: string | null;
  name: string;
  logo_url?: string | null;
  role: string;
  branch?: string | null;
  locations_count?: number;
  redirect: string;
}

export default function SelectContextPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  
  const [contexts, setContexts] = useState<UserContext[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    if (isAuthenticated) {
      loadContexts();
    }
  }, [authLoading, isAuthenticated, router]);

  const loadContexts = async () => {
    try {
      setLoading(true);
      
      // First, try to get contexts from sessionStorage (set during login)
      const cachedContexts = sessionStorage.getItem('user_contexts');
      if (cachedContexts) {
        const userContexts = JSON.parse(cachedContexts);
        setContexts(userContexts);
        // Clear the cache after reading
        sessionStorage.removeItem('user_contexts');
        
        // If only one context, redirect directly
        if (userContexts.length === 1) {
          router.push(userContexts[0].redirect);
        }
        setLoading(false);
        return;
      }
      
      // Fallback: fetch from API if no cached contexts
      const response = await api.get('/auth/contexts');
      
      if (response.data.success) {
        const userContexts = response.data.data.contexts || [];
        setContexts(userContexts);

        // If only one context, redirect directly
        if (userContexts.length === 1) {
          router.push(userContexts[0].redirect);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch contexts:', err);
      setError(err.message || 'Failed to load your workspaces');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectContext = (context: UserContext) => {
    // Store selected context in localStorage for reference
    localStorage.setItem('selected_context', JSON.stringify({
      type: context.type,
      id: context.id,
      slug: context.slug,
      name: context.name,
    }));
    
    router.push(context.redirect);
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getRoleDisplay = (role: string) => {
    const roleMap: Record<string, string> = {
      'owner': 'Owner',
      'franchise_owner': 'Owner',
      'franchise_admin': 'Admin',
      'branch_manager': 'Manager',
      'staff': 'Staff',
      'admin': 'Admin',
      'super_admin': 'Super Admin',
      'user': 'Owner',
    };
    return roleMap[role] || role;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <Skeleton className="h-8 w-48 mx-auto mb-2" />
            <Skeleton className="h-4 w-64 mx-auto" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg border-red-200 bg-red-50">
          <CardContent className="pt-6 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={loadContexts} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (contexts.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <CardTitle>No Workspaces Found</CardTitle>
            <CardDescription>
              You don't have access to any workspaces yet.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-neutral-600">
              If you're expecting to see a franchise here, please contact your administrator.
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => router.push('/dashboard')} variant="outline">
                Go to Personal Dashboard
              </Button>
              <Button onClick={handleLogout} variant="ghost" className="text-red-600">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Select Workspace</CardTitle>
          <CardDescription>
            Choose which workspace you want to access
          </CardDescription>
          {user && (
            <p className="text-sm text-neutral-500 mt-2">
              Logged in as <span className="font-medium">{user.email}</span>
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {contexts.map((context, index) => (
            <button
              key={`${context.type}-${context.id || index}`}
              onClick={() => handleSelectContext(context)}
              className="w-full p-4 rounded-lg border hover:border-emerald-500 hover:bg-emerald-50 transition-all text-left group"
            >
              <div className="flex items-center gap-4">
                {/* Icon/Logo */}
                <div className="flex-shrink-0">
                  {context.logo_url ? (
                    <img 
                      src={context.logo_url} 
                      alt={context.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : context.type === 'personal' ? (
                    <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-emerald-600" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-neutral-900 group-hover:text-emerald-700 transition-colors">
                    {context.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">
                      {getRoleDisplay(context.role)}
                    </span>
                    {context.branch && (
                      <span className="text-xs text-neutral-500">
                        {context.branch}
                      </span>
                    )}
                    {context.type === 'personal' && context.locations_count !== undefined && (
                      <span className="text-xs text-neutral-500">
                        {context.locations_count} location{context.locations_count !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>

                {/* Arrow */}
                <ArrowRight className="w-5 h-5 text-neutral-400 group-hover:text-emerald-600 transition-colors" />
              </div>
            </button>
          ))}

          {/* Logout button */}
          <div className="pt-4 border-t">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2 text-neutral-600 hover:text-red-600 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
