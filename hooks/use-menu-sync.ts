import { useState, useCallback } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface SyncStatus {
  synced: boolean;
  synced_version: number;
  current_version: number;
  pending_versions: number;
  sync_mode: 'auto' | 'manual' | 'disabled';
  has_pending_updates: boolean;
  last_synced_at: string | null;
}

interface PendingChanges {
  added_items: number[];
  removed_items: number[];
  updated_items: Record<string, any>;
  price_changes: Record<string, number>;
}

interface SyncResult {
  success: boolean;
  message: string;
  stats?: {
    added: number;
    updated: number;
    removed: number;
    conflicts: number;
    conflict_details: any[];
  };
}

interface ItemOverride {
  id: number;
  master_menu_item_id: number;
  price_override: number | null;
  availability_override: boolean | null;
  price_locked: boolean;
  availability_locked: boolean;
  fully_locked: boolean;
  override_reason: string | null;
}

interface VersionInfo {
  version_number: number;
  change_type: string;
  change_summary: string;
  created_at: string;
}

interface VersionSnapshot {
  version_number: number;
  change_type: string;
  change_summary: string;
  changes_data: any;
  snapshot: {
    version: number;
    categories: Array<{
      id: number;
      name: string;
      items: Array<{
        id: number;
        name: string;
        price: number;
        description: string;
        image_url: string;
        is_available: boolean;
      }>;
    }>;
    created_at: string;
  };
  created_at: string;
}

interface VersionDiff {
  from_version: number;
  to_version: number;
  diff: {
    items_added: any[];
    items_removed: any[];
    items_modified: Array<{
      item: any;
      changes: Record<string, { from: any; to: any }>;
    }>;
    categories_added: any[];
    categories_removed: any[];
  };
  from_snapshot: any;
  to_snapshot: any;
}

interface SyncDashboardItem {
  master_menu: {
    id: number;
    name: string;
    current_version: number;
  };
  branches: {
    total: number;
    synced: number;
    pending: number;
    auto_sync_enabled: number;
  };
}

export function useMenuSync(token: string | null) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWithAuth = useCallback(async (url: string, options: RequestInit = {}) => {
    if (!token) throw new Error('Not authenticated');
    
    const response = await fetch(`${API_URL}${url}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }
    
    return data;
  }, [token]);

  /**
   * Get sync status for a branch
   */
  const getSyncStatus = useCallback(async (
    locationId: number,
    masterMenuId: number
  ): Promise<SyncStatus> => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchWithAuth(`/menu-sync/status/${locationId}/${masterMenuId}`);
      return result.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth]);

  /**
   * Get pending changes preview
   */
  const getPendingChanges = useCallback(async (
    branchSyncId: number
  ): Promise<PendingChanges> => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchWithAuth(`/menu-sync/${branchSyncId}/pending`);
      return result.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth]);

  /**
   * Trigger manual sync for a branch
   */
  const syncBranch = useCallback(async (
    branchSyncId: number,
    targetVersion?: number
  ): Promise<SyncResult> => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchWithAuth(`/menu-sync/${branchSyncId}/sync`, {
        method: 'POST',
        body: JSON.stringify({ target_version: targetVersion }),
      });
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth]);

  /**
   * Update sync mode for a branch
   */
  const updateSyncMode = useCallback(async (
    branchSyncId: number,
    syncMode: 'auto' | 'manual' | 'disabled'
  ): Promise<{ success: boolean; message: string }> => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchWithAuth(`/menu-sync/${branchSyncId}/mode`, {
        method: 'PUT',
        body: JSON.stringify({ sync_mode: syncMode }),
      });
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth]);

  /**
   * Set item override for a branch
   */
  const setItemOverride = useCallback(async (
    branchSyncId: number,
    masterItemId: number,
    overrideData: {
      price_override?: number;
      availability_override?: boolean;
      price_locked?: boolean;
      availability_locked?: boolean;
      fully_locked?: boolean;
      notes?: string;
    }
  ): Promise<{ success: boolean; message: string }> => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchWithAuth(`/menu-sync/${branchSyncId}/override/${masterItemId}`, {
        method: 'POST',
        body: JSON.stringify(overrideData),
      });
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth]);

  /**
   * Remove item override
   */
  const removeItemOverride = useCallback(async (
    branchSyncId: number,
    masterItemId: number
  ): Promise<{ success: boolean; message: string }> => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchWithAuth(`/menu-sync/${branchSyncId}/override/${masterItemId}`, {
        method: 'DELETE',
      });
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth]);

  /**
   * Get all overrides for a branch
   */
  const getOverrides = useCallback(async (
    branchSyncId: number
  ): Promise<ItemOverride[]> => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchWithAuth(`/menu-sync/${branchSyncId}/overrides`);
      return result.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth]);

  /**
   * Get sync history/logs for a branch
   */
  const getSyncHistory = useCallback(async (
    branchSyncId: number
  ): Promise<any[]> => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchWithAuth(`/menu-sync/${branchSyncId}/history`);
      return result.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth]);

  /**
   * Get version history for a master menu
   */
  const getVersionHistory = useCallback(async (
    masterMenuId: number
  ): Promise<VersionInfo[]> => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchWithAuth(`/menu-sync/versions/${masterMenuId}`);
      return result.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth]);

  /**
   * Initialize branch sync link
   */
  const initializeBranchSync = useCallback(async (
    locationId: number,
    menuId: number,
    masterMenuId: number,
    syncMode: 'auto' | 'manual' | 'disabled' = 'manual'
  ): Promise<{ success: boolean; data: { id: number; pending_versions: number } }> => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchWithAuth('/menu-sync/initialize', {
        method: 'POST',
        body: JSON.stringify({
          location_id: locationId,
          menu_id: menuId,
          master_menu_id: masterMenuId,
          sync_mode: syncMode,
        }),
      });
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth]);

  /**
   * Get franchise sync dashboard
   */
  const getSyncDashboard = useCallback(async (
    franchiseId: number
  ): Promise<SyncDashboardItem[]> => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchWithAuth(`/menu-sync/dashboard/${franchiseId}`);
      return result.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth]);

  /**
   * Get a specific version's snapshot (view old menu)
   */
  const getVersionSnapshot = useCallback(async (
    masterMenuId: number,
    versionNumber: number
  ): Promise<VersionSnapshot> => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchWithAuth(`/menu-sync/versions/${masterMenuId}/snapshot/${versionNumber}`);
      return result.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth]);

  /**
   * Compare two versions
   */
  const compareVersions = useCallback(async (
    masterMenuId: number,
    fromVersion: number,
    toVersion: number
  ): Promise<VersionDiff> => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchWithAuth(`/menu-sync/versions/${masterMenuId}/compare/${fromVersion}/${toVersion}`);
      return result.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth]);

  /**
   * Bulk sync all branches to latest version
   */
  const bulkSyncAllBranches = useCallback(async (
    masterMenuId: number
  ): Promise<{
    success: boolean;
    message: string;
    data: {
      total: number;
      successful: number;
      failed: number;
      details: any[];
    };
  }> => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchWithAuth(`/menu-sync/bulk/${masterMenuId}`, {
        method: 'POST',
      });
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth]);

  return {
    loading,
    error,
    // Status & Info
    getSyncStatus,
    getPendingChanges,
    getVersionHistory,
    getVersionSnapshot,
    compareVersions,
    getSyncHistory,
    getSyncDashboard,
    // Sync Operations
    syncBranch,
    bulkSyncAllBranches,
    initializeBranchSync,
    // Configuration
    updateSyncMode,
    // Overrides
    setItemOverride,
    removeItemOverride,
    getOverrides,
  };
}

export default useMenuSync;
