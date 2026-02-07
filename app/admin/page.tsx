'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Building2,
  MapPin,
  UtensilsCrossed,
  CreditCard,
  Ticket,
  TrendingUp,
  TrendingDown,
  AlertCircle,
} from 'lucide-react';

interface DashboardStats {
  users: {
    total: number;
    active: number;
    new_today: number;
    new_this_week: number;
    new_this_month: number;
  };
  businesses: {
    total: number;
    completed_onboarding: number;
  };
  locations: {
    total: number;
    active: number;
  };
  menus: {
    total: number;
    active: number;
  };
  menu_items: {
    total: number;
    available: number;
  };
  subscriptions: {
    total: number;
    active: number;
    trialing: number;
  };
  support: {
    open_tickets: number;
    unassigned_tickets: number;
    urgent_tickets: number;
  };
}

interface RecentActivity {
  id: number;
  action: string;
  admin: string;
  admin_email: string;
  target_type: string;
  target_id: number;
  created_at: string;
  notes: string;
}

interface RecentUser {
  id: number;
  name: string;
  email: string;
  created_at: string;
  is_active: boolean;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await apiClient.getAdminDashboard();
        if (response.success) {
          setStats((response.data as any).stats);
          setRecentActivity((response.data as any).recent_activity || []);
          setRecentUsers((response.data as any).recent_users || []);
        } else {
          setError(response.message || 'Failed to load dashboard');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  const StatCard = ({
    title,
    value,
    subValue,
    icon: Icon,
    trend,
  }: {
    title: string;
    value: number | string;
    subValue?: string;
    icon: any;
    trend?: 'up' | 'down' | null;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subValue && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            {trend === 'up' && <TrendingUp className="h-3 w-3 text-emerald-500" />}
            {trend === 'down' && <TrendingDown className="h-3 w-3 text-red-500" />}
            {subValue}
          </p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Overview of your platform&apos;s performance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={stats?.users.total || 0}
          subValue={`+${stats?.users.new_this_week || 0} this week`}
          icon={Users}
          trend="up"
        />
        <StatCard
          title="Active Businesses"
          value={stats?.businesses.completed_onboarding || 0}
          subValue={`${stats?.businesses.total || 0} total registered`}
          icon={Building2}
        />
        <StatCard
          title="Total Locations"
          value={stats?.locations.total || 0}
          subValue={`${stats?.locations.active || 0} active`}
          icon={MapPin}
        />
        <StatCard
          title="Active Subscriptions"
          value={stats?.subscriptions.active || 0}
          subValue={`${stats?.subscriptions.trialing || 0} in trial`}
          icon={CreditCard}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Menus"
          value={stats?.menus.total || 0}
          subValue={`${stats?.menus.active || 0} active`}
          icon={UtensilsCrossed}
        />
        <StatCard
          title="Menu Items"
          value={stats?.menu_items.total || 0}
          subValue={`${stats?.menu_items.available || 0} available`}
          icon={UtensilsCrossed}
        />
        <StatCard
          title="Open Tickets"
          value={stats?.support.open_tickets || 0}
          subValue={stats?.support.urgent_tickets ? `${stats.support.urgent_tickets} urgent` : 'No urgent'}
          icon={Ticket}
          trend={stats?.support.urgent_tickets ? 'up' : null}
        />
        <StatCard
          title="Unassigned Tickets"
          value={stats?.support.unassigned_tickets || 0}
          subValue="Need attention"
          icon={Ticket}
        />
      </div>

      {/* Recent Activity & Users */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Admin Activity</CardTitle>
            <CardDescription>Latest actions by administrators</CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent activity</p>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-medium text-emerald-700">
                        {activity.admin?.charAt(0).toUpperCase() || '?'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-medium">{activity.admin}</span>{' '}
                        <span className="text-muted-foreground">{activity.action.replace(/\./g, ' ')}</span>
                      </p>
                      {activity.notes && (
                        <p className="text-xs text-muted-foreground truncate">{activity.notes}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Users */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Users</CardTitle>
            <CardDescription>Newest registered users</CardDescription>
          </CardHeader>
          <CardContent>
            {recentUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent users</p>
            ) : (
              <div className="space-y-4">
                {recentUsers.map((user) => (
                  <div key={user.id} className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-neutral-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-medium text-neutral-700">
                        {user.name?.charAt(0).toUpperCase() || '?'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <Badge variant={user.is_active ? 'default' : 'secondary'}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
