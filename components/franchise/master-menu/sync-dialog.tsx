'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2, Building2, Check, X, RefreshCw, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface Branch {
  id: number;
  name: string;
  location_name: string;
  last_synced_at: string | null;
  is_synced: boolean;
  items_synced: number;
  has_overrides: boolean;
}

interface SyncDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  franchiseId: number | null;
  menuId: number;
  menuName: string;
  onSync: () => void;
}

export function SyncDialog({ 
  open, 
  onOpenChange, 
  franchiseId, 
  menuId, 
  menuName,
  onSync 
}: SyncDialogProps) {
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranches, setSelectedBranches] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (open && franchiseId) {
      fetchSyncStatus();
    }
  }, [open, franchiseId]);

  const fetchSyncStatus = async () => {
    if (!franchiseId) return;
    
    try {
      setLoading(true);
      const response = await api.get(`/franchises/${franchiseId}/master-menus/${menuId}/sync-status`);
      
      if (response.data.success) {
        setBranches(response.data.data.branches || []);
        // Pre-select all branches
        const allBranchIds = new Set<number>(response.data.data.branches?.map((b: Branch) => b.id) || []);
        setSelectedBranches(allBranchIds);
      }
    } catch (err: any) {
      console.error('Failed to fetch sync status:', err);
      toast.error('Failed to load sync status');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    if (!franchiseId || selectedBranches.size === 0) return;
    
    try {
      setSyncing(true);
      
      if (selectedBranches.size === branches.length) {
        // Sync to all branches
        const response = await api.post(`/franchises/${franchiseId}/master-menus/${menuId}/sync`);
        
        if (response.data.success) {
          toast.success('Menu synced to all branches successfully');
          onSync();
          onOpenChange(false);
        }
      } else {
        // Sync to selected branches one by one
        const branchIds = Array.from(selectedBranches);
        let successCount = 0;
        
        for (const branchId of branchIds) {
          try {
            await api.post(`/franchises/${franchiseId}/master-menus/${menuId}/sync/${branchId}`);
            successCount++;
          } catch (err) {
            console.error(`Failed to sync to branch ${branchId}:`, err);
          }
        }
        
        if (successCount === branchIds.length) {
          toast.success(`Menu synced to ${successCount} branch(es) successfully`);
        } else {
          toast.warning(`Synced to ${successCount}/${branchIds.length} branches. Some failed.`);
        }
        
        onSync();
        onOpenChange(false);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to sync menu');
    } finally {
      setSyncing(false);
    }
  };

  const toggleBranch = (branchId: number) => {
    setSelectedBranches(prev => {
      const newSet = new Set(prev);
      if (newSet.has(branchId)) {
        newSet.delete(branchId);
      } else {
        newSet.add(branchId);
      }
      return newSet;
    });
  };

  const toggleAll = () => {
    if (selectedBranches.size === branches.length) {
      setSelectedBranches(new Set());
    } else {
      setSelectedBranches(new Set(branches.map(b => b.id)));
    }
  };

  const formatSyncTime = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Sync "{menuName}" to Branches
          </DialogTitle>
          <DialogDescription>
            Push the master menu to selected branches. Existing branch menus will be updated with the latest items and categories.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
            </div>
          ) : branches.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 mx-auto text-neutral-400 mb-4" />
              <p className="text-neutral-600">No branches found</p>
              <p className="text-sm text-neutral-500">Add branches to your franchise first</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Select All */}
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="select-all"
                    checked={selectedBranches.size === branches.length}
                    onCheckedChange={toggleAll}
                  />
                  <Label htmlFor="select-all" className="font-medium">
                    Select All ({branches.length} branches)
                  </Label>
                </div>
                <span className="text-sm text-neutral-500">
                  {selectedBranches.size} selected
                </span>
              </div>

              {/* Branches List */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {branches.map((branch) => (
                  <div 
                    key={branch.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-neutral-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id={`branch-${branch.id}`}
                        checked={selectedBranches.has(branch.id)}
                        onCheckedChange={() => toggleBranch(branch.id)}
                      />
                      <div>
                        <Label htmlFor={`branch-${branch.id}`} className="font-medium cursor-pointer">
                          {branch.name}
                        </Label>
                        <p className="text-xs text-neutral-500">
                          {branch.location_name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {branch.has_overrides && (
                        <Badge variant="secondary" className="text-xs">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Has Overrides
                        </Badge>
                      )}
                      <Badge variant={branch.is_synced ? 'outline' : 'secondary'} className="text-xs">
                        {branch.is_synced ? (
                          <>
                            <Check className="h-3 w-3 mr-1" />
                            Synced
                          </>
                        ) : (
                          <>
                            <X className="h-3 w-3 mr-1" />
                            Not Synced
                          </>
                        )}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>

              {/* Info */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700">
                <p className="font-medium">⚠️ Note</p>
                <p className="mt-1">
                  Syncing will update items and categories. Branch-specific price overrides will be preserved.
                </p>
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={syncing}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSync} 
            disabled={syncing || loading || selectedBranches.size === 0}
          >
            {syncing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {syncing ? 'Syncing...' : `Sync to ${selectedBranches.size} Branch(es)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
