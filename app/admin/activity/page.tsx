'use client';

import { useEffect, useState, useCallback } from 'react';
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Activity,
  Filter,
} from 'lucide-react';
import { Label } from '@/components/ui/label';

interface ActivityLog {
  id: number;
  action: string;
  target_type: string | null;
  target_id: number | null;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  ip_address: string | null;
  notes: string | null;
  created_at: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
}

export default function AdminActivityPage() {
  const { toast } = useToast();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [actions, setActions] = useState<string[]>([]);
  const [admins, setAdmins] = useState<{ id: number; name: string; email: string }[]>([]);
  const [adminFilter, setAdminFilter] = useState('all');

  // Dialog states
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      if (search) params.append('search', search);
      if (actionFilter !== 'all') params.append('action', actionFilter);
      if (adminFilter !== 'all') params.append('admin_id', adminFilter);

      const response = await apiClient.getAdminActivityLogs(params);
      if (response.success) {
        setLogs(response.data as ActivityLog[]);
        setMeta(response.meta);
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to load activity logs',
        variant: 'destructive',
      });
    }
  }, [page, search, actionFilter, adminFilter, toast]);

  const fetchFilters = async () => {
    try {
      const [actionsRes, adminsRes] = await Promise.all([
        apiClient.getAdminActivityActions(),
        apiClient.getAdminActivityAdmins(),
      ]);
      if (actionsRes.success) setActions(actionsRes.data as string[]);
      if (adminsRes.success) setAdmins(adminsRes.data as { id: number; name: string; email: string }[]);
    } catch (err) {
      console.error('Failed to load filters:', err);
    }
  };

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([fetchLogs(), fetchFilters()]);
      setLoading(false);
    };
    loadAll();
  }, [fetchLogs]);

  const getActionBadge = (action: string) => {
    const actionParts = action.split('.');
    const entity = actionParts[0] || '';
    const verb = actionParts[1] || action;

    let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'secondary';
    if (verb.includes('created') || verb.includes('activated')) variant = 'default';
    if (verb.includes('deleted') || verb.includes('suspended') || verb.includes('cancelled'))
      variant = 'destructive';

    return <Badge variant={variant}>{action.replace(/\./g, ' ')}</Badge>;
  };

  const formatTargetType = (type: string | null) => {
    if (!type) return '-';
    const parts = type.split('\\');
    return parts[parts.length - 1];
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Activity Logs</h1>
        <p className="text-muted-foreground">Track all admin actions on the platform</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search in notes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Action Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {actions.map((action) => (
                  <SelectItem key={action} value={action}>
                    {action.replace(/\./g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={adminFilter} onValueChange={setAdminFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Admin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Admins</SelectItem>
                {admins.map((admin) => (
                  <SelectItem key={admin.id} value={admin.id.toString()}>
                    {admin.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Activity Table */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Admin</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead className="text-right">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{log.user?.name}</p>
                          <p className="text-sm text-muted-foreground">{log.user?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{getActionBadge(log.action)}</TableCell>
                      <TableCell>
                        {log.target_type ? (
                          <span className="text-sm">
                            {formatTargetType(log.target_type)} #{log.target_id}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <p className="text-sm truncate max-w-[200px]">
                          {log.notes || '-'}
                        </p>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {log.ip_address || '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {new Date(log.created_at).toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedLog(log);
                            setViewDialogOpen(true);
                          }}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {meta && meta.last_page > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {logs.length} of {meta.total} logs
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
                    <span className="text-sm">
                      Page {page} of {meta.last_page}
                    </span>
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

      {/* View Log Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Activity Details
            </DialogTitle>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Admin</Label>
                  <p className="font-medium">{selectedLog.user?.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedLog.user?.email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Action</Label>
                  <div className="mt-1">{getActionBadge(selectedLog.action)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Target</Label>
                  <p className="font-medium">
                    {selectedLog.target_type
                      ? `${formatTargetType(selectedLog.target_type)} #${selectedLog.target_id}`
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Time</Label>
                  <p className="font-medium">
                    {new Date(selectedLog.created_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">IP Address</Label>
                  <p className="font-medium">{selectedLog.ip_address || 'N/A'}</p>
                </div>
              </div>

              {selectedLog.notes && (
                <div>
                  <Label className="text-muted-foreground">Notes</Label>
                  <p className="mt-1 p-3 bg-neutral-50 rounded-lg">{selectedLog.notes}</p>
                </div>
              )}

              {selectedLog.old_values && (
                <div>
                  <Label className="text-muted-foreground">Previous Values</Label>
                  <pre className="mt-1 p-3 bg-red-50 rounded-lg text-sm overflow-x-auto">
                    {JSON.stringify(selectedLog.old_values, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.new_values && (
                <div>
                  <Label className="text-muted-foreground">New Values</Label>
                  <pre className="mt-1 p-3 bg-emerald-50 rounded-lg text-sm overflow-x-auto">
                    {JSON.stringify(selectedLog.new_values, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
