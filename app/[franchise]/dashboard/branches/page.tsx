'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Building2, 
  Plus, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Users, 
  MapPin,
  Phone,
  Loader2,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useFranchise } from '@/contexts/franchise-context';

interface Branch {
  id: number;
  branch_name: string;
  branch_code: string;
  address: string | null;
  city: string | null;
  phone: string | null;
  is_active: boolean;
  is_paid: boolean;
  activated_at: string | null;
  accounts_count?: number;
  last_synced_at?: string | null;
}

interface BranchFormData {
  branch_name: string;
  address: string;
  city: string;
  phone: string;
  is_active: boolean;
}

export default function FranchiseBranchesPage() {
  const params = useParams();
  const franchiseSlug = params?.franchise as string;
  const { currentFranchise } = useFranchise();
  
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; branch: Branch | null }>({ open: false, branch: null });
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<BranchFormData>({
    branch_name: '',
    address: '',
    city: '',
    phone: '',
    is_active: true,
  });

  const franchiseId = currentFranchise?.id;

  const fetchBranches = useCallback(async () => {
    if (!franchiseSlug) return;
    
    try {
      setLoading(true);
      const response = await api.get(`/franchise/${franchiseSlug}/branches`);
      
      if (response.data.success) {
        setBranches(response.data.data || []);
      }
    } catch (err: any) {
      console.error('Failed to fetch branches:', err);
      toast.error('Failed to load branches');
    } finally {
      setLoading(false);
    }
  }, [franchiseSlug]);

  useEffect(() => {
    if (franchiseSlug) {
      fetchBranches();
    }
  }, [franchiseSlug, fetchBranches]);

  const openCreateDialog = () => {
    setEditingBranch(null);
    setFormData({
      branch_name: '',
      address: '',
      city: '',
      phone: '',
      is_active: true,
    });
    setDialogOpen(true);
  };

  const openEditDialog = (branch: Branch) => {
    setEditingBranch(branch);
    setFormData({
      branch_name: branch.branch_name,
      address: branch.address || '',
      city: branch.city || '',
      phone: branch.phone || '',
      is_active: branch.is_active,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!franchiseId) return;
    
    if (!formData.branch_name.trim()) {
      toast.error('Please enter a branch name');
      return;
    }

    try {
      setSaving(true);
      
      if (editingBranch) {
        // Update
        const response = await api.put(`/franchise/${franchiseSlug}/branches/${editingBranch.id}`, formData);
        if (response.data.success) {
          toast.success('Branch updated successfully');
          fetchBranches();
          setDialogOpen(false);
        }
      } else {
        // Create
        const response = await api.post(`/franchise/${franchiseSlug}/branches`, formData);
        if (response.data.success) {
          toast.success('Branch created successfully');
          fetchBranches();
          setDialogOpen(false);
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save branch');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!franchiseSlug || !deleteDialog.branch) return;

    try {
      const response = await api.delete(`/franchise/${franchiseSlug}/branches/${deleteDialog.branch.id}`);
      if (response.data.success) {
        toast.success('Branch deleted successfully');
        fetchBranches();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete branch');
    } finally {
      setDeleteDialog({ open: false, branch: null });
    }
  };

  const toggleBranchStatus = async (branch: Branch) => {
    if (!franchiseSlug) return;

    try {
      const response = await api.put(`/franchise/${franchiseSlug}/branches/${branch.id}`, {
        is_active: !branch.is_active,
      });
      if (response.data.success) {
        toast.success(`Branch ${branch.is_active ? 'deactivated' : 'activated'}`);
        fetchBranches();
      }
    } catch (err: any) {
      toast.error('Failed to update branch status');
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Branches</h1>
          <p className="text-neutral-600">Manage your franchise branches and their settings</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Add Branch
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{branches.length}</p>
                <p className="text-sm text-neutral-600">Total Branches</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{branches.filter(b => b.is_active).length}</p>
                <p className="text-sm text-neutral-600">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-100 rounded-lg">
                <XCircle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{branches.filter(b => !b.is_active).length}</p>
                <p className="text-sm text-neutral-600">Inactive</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {branches.reduce((acc, b) => acc + (b.accounts_count || 0), 0)}
                </p>
                <p className="text-sm text-neutral-600">Total Staff</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Branches Grid */}
      {branches.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <Building2 className="w-12 h-12 mx-auto text-neutral-400 mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 mb-2">No branches yet</h3>
            <p className="text-neutral-600 mb-4">Get started by adding your first branch</p>
            <Button onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Add Branch
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {branches.map((branch) => (
            <Card key={branch.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{branch.branch_name}</CardTitle>
                      <Badge variant="outline" className="text-xs">
                        {branch.branch_code}
                      </Badge>
                    </div>
                    <CardDescription className="mt-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {branch.city || branch.address || 'No address'}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditDialog(branch)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Branch
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toggleBranchStatus(branch)}>
                        {branch.is_active ? (
                          <>
                            <XCircle className="w-4 h-4 mr-2" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Activate
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-red-600"
                        onClick={() => setDeleteDialog({ open: true, branch })}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Branch
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {branch.phone && (
                    <div className="flex items-center gap-2 text-sm text-neutral-600">
                      <Phone className="w-4 h-4" />
                      {branch.phone}
                    </div>
                  )}
                  {branch.address && (
                    <div className="flex items-center gap-2 text-sm text-neutral-600">
                      <MapPin className="w-4 h-4" />
                      <span className="line-clamp-1">{branch.address}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-2 text-sm text-neutral-600">
                      <Users className="w-4 h-4" />
                      {branch.accounts_count || 0} staff
                    </div>
                    <Badge variant={branch.is_active ? 'default' : 'secondary'}>
                      {branch.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingBranch ? 'Edit Branch' : 'Add New Branch'}
              </DialogTitle>
              <DialogDescription>
                {editingBranch 
                  ? 'Update the branch details below.' 
                  : 'Create a new branch for your franchise.'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="branch_name">Branch Name *</Label>
                <Input
                  id="branch_name"
                  placeholder="e.g., Colombo City Mall"
                  value={formData.branch_name}
                  onChange={(e) => setFormData({ ...formData, branch_name: e.target.value })}
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="e.g., Colombo"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  placeholder="Full address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  placeholder="+94 11 234 5678"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={saving}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label>Active Status</Label>
                  <p className="text-xs text-neutral-500">Branch can receive menu syncs</p>
                </div>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  disabled={saving}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingBranch ? 'Update' : 'Create'} Branch
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, branch: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Branch</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteDialog.branch?.branch_name}"? 
              This will also remove all staff accounts and menu overrides for this branch.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete Branch
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
