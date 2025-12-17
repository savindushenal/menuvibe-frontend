'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Plus, 
  ChefHat, 
  Edit, 
  Trash2, 
  Copy,
  RefreshCw,
  Settings2,
  MoreVertical,
  Check,
  X,
  Clock,
  Building2,
  UtensilsCrossed,
  Eye,
  ExternalLink
} from 'lucide-react';
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
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { CreateMasterMenuDialog } from '@/components/franchise/master-menu/create-master-menu-dialog';

interface MasterMenu {
  id: number;
  name: string;
  slug: string;
  description: string;
  image_url: string | null;
  currency: string;
  is_active: boolean;
  is_default: boolean;
  sort_order: number;
  last_synced_at: string | null;
  created_at: string;
  categories_count: number;
  items_count: number;
  sync_status?: {
    total_branches: number;
    synced_branches: number;
    pending_sync: boolean;
  };
}

interface SyncStatus {
  master_menu_id: number;
  last_synced_at: string | null;
  branches: Array<{
    branch_id: number;
    branch_name: string;
    last_synced_at: string | null;
    is_synced: boolean;
    items_synced: number;
    has_overrides: boolean;
  }>;
}

export default function MasterMenusPage() {
  const params = useParams();
  const router = useRouter();
  const franchiseSlug = params?.franchise as string;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menus, setMenus] = useState<MasterMenu[]>([]);
  const [syncing, setSyncing] = useState<number | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; menu: MasterMenu | null }>({ open: false, menu: null });
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [franchiseId, setFranchiseId] = useState<number | null>(null);

  useEffect(() => {
    fetchMenus();
  }, [franchiseSlug]);

  const fetchMenus = async () => {
    try {
      setLoading(true);
      // First get franchise details to get the ID
      const franchiseRes = await api.get(`/franchise/${franchiseSlug}/dashboard`);
      if (franchiseRes.data.success && franchiseRes.data.data.franchise) {
        const fId = franchiseRes.data.data.franchise.id;
        setFranchiseId(fId);
        
        // Then fetch master menus
        const response = await api.get(`/franchises/${fId}/master-menus`);
        if (response.data.success) {
          setMenus(response.data.data || []);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch master menus:', err);
      setError(err.response?.data?.message || 'Failed to load master menus');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncAll = async (menuId: number) => {
    if (!franchiseId) {
      toast.error('Franchise ID not found');
      return;
    }
    
    try {
      setSyncing(menuId);
      console.log('[Sync] Starting sync for menu:', menuId, 'franchise:', franchiseId);
      const response = await api.post(`/franchises/${franchiseId}/master-menus/${menuId}/sync`);
      console.log('[Sync] Response:', response);
      
      if (response.data.success) {
        toast.success(response.data.message || 'Menu synced to all branches successfully');
        fetchMenus();
      } else {
        toast.error(response.data.message || 'Sync failed');
      }
    } catch (err: any) {
      console.error('[Sync] Error:', err);
      const errorMsg = err.message || err.response?.data?.message || 'Failed to sync menu';
      toast.error(errorMsg);
    } finally {
      setSyncing(null);
    }
  };

  const handlePreviewMenu = (menu: MasterMenu) => {
    // Open menu preview in a new window
    const previewUrl = `/${franchiseSlug}/menu/${menu.slug}/preview`;
    window.open(previewUrl, '_blank', 'width=450,height=800');
  };

  const handleDelete = async () => {
    if (!deleteDialog.menu || !franchiseId) return;
    
    try {
      const response = await api.delete(`/franchises/${franchiseId}/master-menus/${deleteDialog.menu.id}`);
      
      if (response.data.success) {
        toast.success('Master menu deleted successfully');
        setMenus(menus.filter(m => m.id !== deleteDialog.menu?.id));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete menu');
    } finally {
      setDeleteDialog({ open: false, menu: null });
    }
  };

  const handleDuplicate = async (menu: MasterMenu) => {
    if (!franchiseId) return;
    
    try {
      const response = await api.post(`/franchises/${franchiseId}/master-menus`, {
        name: `${menu.name} (Copy)`,
        description: menu.description,
        currency: menu.currency,
        is_active: false,
        duplicate_from: menu.id
      });
      
      if (response.data.success) {
        toast.success('Menu duplicated successfully');
        fetchMenus();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to duplicate menu');
    }
  };

  const formatSyncTime = (dateStr: string | null) => {
    if (!dateStr) return 'Never synced';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000 / 60);
    
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
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
          <Button variant="outline" onClick={fetchMenus} className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Master Menus</h1>
          <p className="text-neutral-600">
            Create and manage centralized menus that sync to all branches
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Master Menu
        </Button>
      </div>

      {/* Info Banner */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-4 flex items-start gap-3">
          <ChefHat className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-700">
            <p className="font-medium">How Master Menus Work</p>
            <p className="text-blue-600 mt-1">
              Master menus are templates you create once and push to all branches. 
              Each branch can have custom pricing overrides while maintaining the same items.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Menus Grid */}
      {menus.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <UtensilsCrossed className="h-12 w-12 mx-auto text-neutral-400 mb-4" />
            <h3 className="text-lg font-semibold text-neutral-900">No Master Menus Yet</h3>
            <p className="text-neutral-600 mt-1 max-w-sm mx-auto">
              Create your first master menu to define items and categories that can be pushed to all your branches.
            </p>
            <Button className="mt-6" onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Menu
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {menus.map((menu) => (
            <Card 
              key={menu.id} 
              className={`relative overflow-hidden transition-shadow hover:shadow-md ${
                menu.is_default ? 'ring-2 ring-primary' : ''
              }`}
            >
              {menu.is_default && (
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-bl-md">
                  Default
                </div>
              )}
              
              {menu.image_url && (
                <div className="h-32 bg-neutral-100 overflow-hidden">
                  <img 
                    src={menu.image_url} 
                    alt={menu.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{menu.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {menu.description || 'No description'}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handlePreviewMenu(menu)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Preview Menu
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push(`/${franchiseSlug}/dashboard/menus/master/${menu.id}`)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Menu
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicate(menu)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleSyncAll(menu.id)}
                        disabled={syncing === menu.id}
                      >
                        <RefreshCw className={`h-4 w-4 mr-2 ${syncing === menu.id ? 'animate-spin' : ''}`} />
                        Sync to All Branches
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-red-600"
                        onClick={() => setDeleteDialog({ open: true, menu })}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {/* Stats */}
                <div className="flex items-center gap-4 text-sm text-neutral-600">
                  <div className="flex items-center gap-1">
                    <UtensilsCrossed className="h-4 w-4" />
                    <span>{menu.items_count || 0} items</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Building2 className="h-4 w-4" />
                    <span>{menu.sync_status?.total_branches || 0} branches</span>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center justify-between">
                  <Badge variant={menu.is_active ? 'default' : 'secondary'}>
                    {menu.is_active ? (
                      <>
                        <Check className="h-3 w-3 mr-1" />
                        Active
                      </>
                    ) : (
                      <>
                        <X className="h-3 w-3 mr-1" />
                        Inactive
                      </>
                    )}
                  </Badge>
                  
                  <div className="flex items-center gap-1 text-xs text-neutral-500">
                    <Clock className="h-3 w-3" />
                    <span>{formatSyncTime(menu.last_synced_at)}</span>
                  </div>
                </div>

                {/* Sync Status Bar */}
                {menu.sync_status && menu.sync_status.total_branches > 0 && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-neutral-500">
                      <span>Sync Progress</span>
                      <span>
                        {menu.sync_status.synced_branches}/{menu.sync_status.total_branches}
                      </span>
                    </div>
                    <div className="h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 rounded-full transition-all"
                        style={{ 
                          width: `${(menu.sync_status.synced_branches / menu.sync_status.total_branches) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => handlePreviewMenu(menu)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => router.push(`/${franchiseSlug}/dashboard/menus/master/${menu.id}`)}
                  >
                    <Settings2 className="h-4 w-4 mr-2" />
                    Manage
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <CreateMasterMenuDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        franchiseId={franchiseId}
        onSuccess={() => {
          fetchMenus();
          setCreateDialogOpen(false);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Master Menu</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteDialog.menu?.name}"? This will remove the master menu template. 
              Branch menus that were synced from this template will remain but won't receive updates.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
