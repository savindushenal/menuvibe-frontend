'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UtensilsCrossed, Plus, Eye, Edit, ExternalLink } from 'lucide-react';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';

interface Menu {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  location: {
    id: number;
    name: string;
    branch_id: number | null;
  };
  categories: Array<{
    id: number;
    name: string;
    items: Array<{ id: number; name: string; price: number }>;
  }>;
}

export default function FranchiseMenusPage() {
  const params = useParams();
  const franchiseSlug = params?.franchise as string;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menus, setMenus] = useState<Menu[]>([]);

  useEffect(() => {
    const fetchMenus = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/franchise/${franchiseSlug}/menus`);
        
        if (response.data.success) {
          setMenus(response.data.data || []);
        }
      } catch (err: any) {
        console.error('Failed to fetch menus:', err);
        setError(err.response?.data?.message || 'Failed to load menus');
      } finally {
        setLoading(false);
      }
    };

    if (franchiseSlug) {
      fetchMenus();
    }
  }, [franchiseSlug]);

  const getTotalItems = (menu: Menu) => {
    return menu.categories?.reduce((total, cat) => total + (cat.items?.length || 0), 0) || 0;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <p className="text-red-600">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Menus</h1>
          <p className="text-neutral-600">Manage your franchise menus</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create Menu
        </Button>
      </div>

      {/* Menus Grid */}
      {menus.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <UtensilsCrossed className="w-12 h-12 mx-auto text-neutral-400 mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 mb-2">No menus yet</h3>
            <p className="text-neutral-600 mb-4">Create your first menu to get started</p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Menu
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {menus.map((menu) => (
            <Card key={menu.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{menu.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {menu.location?.name || 'No location'}
                    </CardDescription>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    menu.is_active 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : 'bg-neutral-100 text-neutral-600'
                  }`}>
                    {menu.is_active ? 'Active' : 'Draft'}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-neutral-600 mb-4">
                  <span>{menu.categories?.length || 0} categories</span>
                  <span>{getTotalItems(menu)} items</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Eye className="w-3 h-3 mr-1" />
                    Preview
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
