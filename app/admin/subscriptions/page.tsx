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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  TrendingUp,
  Users,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';
import { Label } from '@/components/ui/label';

interface Subscription {
  id: number;
  user_id: number;
  subscription_plan_id: number;
  status: string;
  is_active: boolean;
  starts_at: string;
  ends_at: string | null;
  user: {
    id: number;
    name: string;
    email: string;
  };
  subscription_plan: {
    id: number;
    name: string;
    slug: string;
  };
}

interface Plan {
  id: number;
  name: string;
  slug: string;
  price_monthly: number;
  price_yearly: number;
  active_count?: number;
}

interface Stats {
  by_plan: { plan: string; slug: string; active_count: number }[];
  by_status: {
    active: number;
    trialing: number;
    cancelled: number;
    expired: number;
  };
  expiring_soon: number;
  mrr: number;
}

export default function AdminSubscriptionsPage() {
  const { toast } = useToast();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');

  // Dialog states
  const [changeSubDialogOpen, setChangeSubDialogOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [newPlanId, setNewPlanId] = useState('');
  const [changeReason, setChangeReason] = useState('');

  const fetchSubscriptions = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      if (search) params.append('search', search);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (planFilter !== 'all') params.append('plan_id', planFilter);

      const response = await apiClient.getAdminSubscriptions(params);
      if (response.success) {
        setSubscriptions(response.data as Subscription[]);
        setMeta(response.meta);
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to load subscriptions',
        variant: 'destructive',
      });
    }
  }, [page, search, statusFilter, planFilter, toast]);

  const fetchPlans = async () => {
    try {
      const response = await apiClient.getAdminSubscriptionPlans();
      if (response.success) {
        setPlans(response.data as Plan[]);
      }
    } catch (err) {
      console.error('Failed to load plans:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await apiClient.getAdminSubscriptionStats();
      if (response.success) {
        setStats(response.data as Stats);
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([fetchSubscriptions(), fetchPlans(), fetchStats()]);
      setLoading(false);
    };
    loadAll();
  }, [fetchSubscriptions]);

  const handleChangeSubscription = async () => {
    if (!selectedSubscription || !newPlanId) return;

    try {
      const response = await apiClient.changeUserSubscription(
        selectedSubscription.user_id,
        {
          plan_id: parseInt(newPlanId),
          reason: changeReason,
        }
      );
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Subscription changed successfully',
        });
        setChangeSubDialogOpen(false);
        setSelectedSubscription(null);
        setNewPlanId('');
        setChangeReason('');
        fetchSubscriptions();
        fetchStats();
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to change subscription',
        variant: 'destructive',
      });
    }
  };

  const handleCancelSubscription = async (subscription: Subscription) => {
    try {
      const response = await apiClient.cancelSubscription(subscription.id, { reason: 'Admin cancelled' });
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Subscription cancelled',
        });
        fetchSubscriptions();
        fetchStats();
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to cancel subscription',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string, isActive: boolean) => {
    if (!isActive) return <Badge variant="secondary">Inactive</Badge>;
    switch (status) {
      case 'active':
        return <Badge className="bg-emerald-100 text-emerald-700">Active</Badge>;
      case 'trialing':
        return <Badge className="bg-blue-100 text-blue-700">Trial</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      case 'expired':
        return <Badge variant="secondary">Expired</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Subscriptions</h1>
        <p className="text-muted-foreground">Manage user subscriptions and plans</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.mrr.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">MRR</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.by_status.active}</div>
              <p className="text-xs text-muted-foreground">
                +{stats.by_status.trialing} in trial
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.expiring_soon}</div>
              <p className="text-xs text-muted-foreground">Within 7 days</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
              <TrendingUp className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.by_status.cancelled}</div>
              <p className="text-xs text-muted-foreground">
                {stats.by_status.expired} expired
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Plan Distribution */}
      {stats && stats.by_plan.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Subscription Distribution</CardTitle>
            <CardDescription>Active subscriptions by plan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {stats.by_plan.map((planStat) => (
                <div
                  key={planStat.slug}
                  className="flex items-center gap-2 px-4 py-2 bg-neutral-100 rounded-lg"
                >
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{planStat.plan}</span>
                  <Badge variant="secondary">{planStat.active_count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by user name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="trialing">Trial</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                {plans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id.toString()}>
                    {plan.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions Table */}
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
                    <TableHead>User</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Ends</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptions.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{sub.user?.name}</p>
                          <p className="text-sm text-muted-foreground">{sub.user?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{sub.subscription_plan?.name}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(sub.status, sub.is_active)}</TableCell>
                      <TableCell>
                        {new Date(sub.starts_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {sub.ends_at ? new Date(sub.ends_at).toLocaleDateString() : 'Never'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedSubscription(sub);
                              setNewPlanId(sub.subscription_plan_id.toString());
                              setChangeSubDialogOpen(true);
                            }}
                          >
                            Change Plan
                          </Button>
                          {sub.status === 'active' && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleCancelSubscription(sub)}
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {meta && meta.last_page > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {subscriptions.length} of {meta.total} subscriptions
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

      {/* Change Subscription Dialog */}
      <Dialog open={changeSubDialogOpen} onOpenChange={setChangeSubDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Subscription</DialogTitle>
            <DialogDescription>
              Change subscription plan for {selectedSubscription?.user?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>New Plan</Label>
              <Select value={newPlanId} onValueChange={setNewPlanId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id.toString()}>
                      {plan.name} - ${plan.price_monthly}/mo
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Reason (Optional)</Label>
              <Input
                value={changeReason}
                onChange={(e) => setChangeReason(e.target.value)}
                placeholder="Reason for change..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangeSubDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleChangeSubscription}>Change Plan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
