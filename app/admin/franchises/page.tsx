'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Building2,
  MapPin,
  Users,
  Globe,
  MoreHorizontal,
  Eye,
  Power,
  Plus,
  Trash2,
  UserCog,
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface Franchise {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  custom_domain: string | null;
  settings: Record<string, any> | null;
  created_at: string;
  owner: {
    id: number;
    name: string;
    email: string;
  };
  locations_count: number;
  users_count: number;
}

interface FranchiseStats {
  stats: {
    total: number;
    active: number;
    inactive: number;
    with_custom_domain: number;
    total_locations: number;
  };
  recent: Franchise[];
}

interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export default function AdminFranchisesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [stats, setStats] = useState<FranchiseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Dialog states
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [selectedFranchise, setSelectedFranchise] = useState<Franchise | null>(null);

  // Form states
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    custom_domain: '',
  });
  const [newOwnerId, setNewOwnerId] = useState('');

  const fetchFranchises = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      if (search) params.append('search', search);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const response = await apiClient.getAdminFranchises(params);
      if (response.success) {
        setFranchises(response.data as Franchise[]);
        if (response.meta) {
          setMeta(response.meta as PaginationMeta);
        }
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to load franchises',
        variant: 'destructive',
      });
    }
  }, [page, search, statusFilter, toast]);

  const fetchStats = async () => {
    try {
      const response = await apiClient.getAdminFranchiseStats();
      if (response.success) {
        setStats(response.data as FranchiseStats);
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([fetchFranchises(), fetchStats()]);
      setLoading(false);
    };
    loadAll();
  }, [fetchFranchises]);

  const handleToggleStatus = async (franchise: Franchise) => {
    try {
      const response = await apiClient.toggleFranchiseStatus(franchise.id);
      if (response.success) {
        toast({
          title: 'Success',
          description: response.message,
        });
        fetchFranchises();
        fetchStats();
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to update status',
        variant: 'destructive',
      });
    }
  };

  const handleEditFranchise = async () => {
    if (!selectedFranchise) return;

    try {
      const response = await apiClient.updateAdminFranchise(selectedFranchise.id, editForm);
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Franchise updated successfully',
        });
        setEditDialogOpen(false);
        setSelectedFranchise(null);
        fetchFranchises();
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to update franchise',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteFranchise = async () => {
    if (!selectedFranchise) return;

    try {
      const response = await apiClient.deleteAdminFranchise(selectedFranchise.id);
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Franchise deleted successfully',
        });
        setDeleteDialogOpen(false);
        setSelectedFranchise(null);
        fetchFranchises();
        fetchStats();
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to delete franchise',
        variant: 'destructive',
      });
    }
  };

  const handleTransferOwnership = async () => {
    if (!selectedFranchise || !newOwnerId) return;

    try {
      const response = await apiClient.transferFranchiseOwnership(selectedFranchise.id, {
        new_owner_id: parseInt(newOwnerId),
      });
      if (response.success) {
        toast({
          title: 'Success',
          description: response.message,
        });
        setTransferDialogOpen(false);
        setSelectedFranchise(null);
        setNewOwnerId('');
        fetchFranchises();
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to transfer ownership',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (franchise: Franchise) => {
    setSelectedFranchise(franchise);
    setEditForm({
      name: franchise.name,
      description: franchise.description || '',
      custom_domain: franchise.custom_domain || '',
    });
    setEditDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Franchises</h1>
          <p className="text-muted-foreground">Manage all franchises on the platform</p>
        </div>
        <Button onClick={() => router.push('/admin/franchises/onboard')}>
          <Plus className="h-4 w-4 mr-2" />
          Onboard Franchise
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Total</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Power className="h-4 w-4 text-emerald-500" />
                <span className="text-sm text-muted-foreground">Active</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.stats.active}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Power className="h-4 w-4 text-red-500" />
                <span className="text-sm text-muted-foreground">Inactive</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.stats.inactive}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-muted-foreground">Custom Domains</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.stats.with_custom_domain}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-orange-500" />
                <span className="text-sm text-muted-foreground">Total Locations</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.stats.total_locations}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search franchises..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Franchises Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Franchises</CardTitle>
          <CardDescription>
            {meta ? `${meta.total} franchise${meta.total !== 1 ? 's' : ''} found` : 'Loading...'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Franchise</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Locations</TableHead>
                    <TableHead>Users</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {franchises.map((franchise) => (
                    <TableRow key={franchise.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{franchise.name}</p>
                          <p className="text-sm text-muted-foreground">{franchise.slug}</p>
                          {franchise.custom_domain && (
                            <p className="text-xs text-blue-500">{franchise.custom_domain}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{franchise.owner?.name || 'N/A'}</p>
                          <p className="text-xs text-muted-foreground">
                            {franchise.owner?.email || ''}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          {franchise.locations_count}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          {franchise.users_count}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={franchise.is_active ? 'default' : 'secondary'}>
                          {franchise.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(franchise.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => router.push(`/admin/franchises/${franchise.id}`)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditDialog(franchise)}>
                              <Building2 className="h-4 w-4 mr-2" />
                              Edit Franchise
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedFranchise(franchise);
                                setTransferDialogOpen(true);
                              }}
                            >
                              <UserCog className="h-4 w-4 mr-2" />
                              Transfer Ownership
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleToggleStatus(franchise)}>
                              <Power className="h-4 w-4 mr-2" />
                              {franchise.is_active ? 'Deactivate' : 'Activate'}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => {
                                setSelectedFranchise(franchise);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Franchise
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {franchises.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No franchises found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {meta && meta.last_page > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {meta.current_page} of {meta.last_page}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
                      disabled={page === meta.last_page}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Franchise Details</DialogTitle>
          </DialogHeader>
          {selectedFranchise && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Name</Label>
                  <p className="font-medium">{selectedFranchise.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Slug</Label>
                  <p className="font-medium">{selectedFranchise.slug}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Owner</Label>
                  <p className="font-medium">{selectedFranchise.owner?.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedFranchise.owner?.email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge variant={selectedFranchise.is_active ? 'default' : 'secondary'}>
                    {selectedFranchise.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Locations</Label>
                  <p className="font-medium">{selectedFranchise.locations_count}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Team Members</Label>
                  <p className="font-medium">{selectedFranchise.users_count}</p>
                </div>
                {selectedFranchise.custom_domain && (
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">Custom Domain</Label>
                    <p className="font-medium text-blue-500">{selectedFranchise.custom_domain}</p>
                  </div>
                )}
                {selectedFranchise.description && (
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">Description</Label>
                    <p className="text-sm">{selectedFranchise.description}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Franchise</DialogTitle>
            <DialogDescription>Update franchise details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={3}
              />
            </div>
            <div>
              <Label>Custom Domain</Label>
              <Input
                value={editForm.custom_domain}
                onChange={(e) => setEditForm({ ...editForm, custom_domain: e.target.value })}
                placeholder="menu.yourdomain.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditFranchise}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Franchise</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{selectedFranchise?.name}&quot;? This action
              cannot be undone and will remove all associated data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteFranchise}>
              Delete Franchise
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transfer Ownership Dialog */}
      <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer Ownership</DialogTitle>
            <DialogDescription>
              Transfer ownership of &quot;{selectedFranchise?.name}&quot; to another user.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>New Owner User ID</Label>
              <Input
                type="number"
                value={newOwnerId}
                onChange={(e) => setNewOwnerId(e.target.value)}
                placeholder="Enter user ID"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter the ID of the user who will become the new owner.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransferDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleTransferOwnership} disabled={!newOwnerId}>
              Transfer Ownership
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
