'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UtensilsCrossed, Eye, Edit, ExternalLink, MoreVertical, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

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
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; menu: Menu | null }>({ open: false, menu: null });

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

  const handleDelete = async () => {
    if (!deleteDialog.menu) return;
    
    try {
      const response = await api.delete(`/franchise/${franchiseSlug}/menus/${deleteDialog.menu.id}`);
      
      if (response.data.success) {
        toast.success('Menu deleted successfully');
        setMenus(menus.filter(m => m.id !== deleteDialog.menu?.id));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete menu');
    } finally {
      setDeleteDialog({ open: false, menu: null });
    }
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
          <h1 className="text-2xl font-bold text-neutral-900">Branch Menus</h1>
          <p className="text-neutral-600">View and manage menus for each branch location</p>
        </div>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-4">
          <p className="text-sm text-blue-700">
            <strong>Tip:</strong> Branch menus are derived from your Master Menu. 
            Use the <a href={`/${franchiseSlug}/dashboard/menus/master`} className="underline font-medium">Master Menu</a> to 
            add items, then sync them to branches. Each branch can customize availability and prices.
          </p>
        </CardContent>
      </Card>

      {/* Menus Grid */}
      {menus.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <UtensilsCrossed className="w-12 h-12 mx-auto text-neutral-400 mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 mb-2">No branch menus yet</h3>
            <p className="text-neutral-600 mb-4">
              Create your Master Menu first, then sync it to your branches.
            </p>
            <Button onClick={() => window.location.href = `/${franchiseSlug}/dashboard/menus/master`}>
              Go to Master Menu
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {menus.map((menu) => (
            <Card key={menu.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{menu.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {menu.location?.name || 'No location'}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      menu.is_active 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : 'bg-neutral-100 text-neutral-600'
                    }`}>
                      {menu.is_active ? 'Active' : 'Draft'}
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => window.location.href = `/${franchiseSlug}/dashboard/menus/branch/${menu.id}`}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Menu
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => window.location.href = `/${franchiseSlug}/menu/${menu.location.branch_id || menu.location.id}`}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Preview
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => setDeleteDialog({ open: true, menu })}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Menu
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-neutral-600">
                  <span>{menu.categories?.length || 0} categories</span>
                  <span>{getTotalItems(menu)} items</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, menu: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Branch Menu</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteDialog.menu?.name}"? 
              This will remove all menu items, categories, and custom overrides for this branch. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete Menu
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
