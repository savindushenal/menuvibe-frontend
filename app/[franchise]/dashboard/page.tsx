'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, MapPin, UtensilsCrossed, Users, TrendingUp, Calendar } from 'lucide-react';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';

interface DashboardStats {
  branches: number;
  locations: number;
  menus: number;
  staff: number;
}

interface FranchiseInfo {
  id: number;
  name: string;
  slug: string;
  logo_url: string | null;
  brand_color: string | null;
}

export default function FranchiseDashboardPage() {
  const params = useParams();
  const franchiseSlug = params?.franchise as string;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [franchise, setFranchise] = useState<FranchiseInfo | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/franchise/${franchiseSlug}/dashboard`);
        
        if (response.data.success) {
          setFranchise(response.data.data.franchise);
          setStats(response.data.data.stats);
          setUserRole(response.data.data.user_role);
        }
      } catch (err: any) {
        console.error('Failed to fetch dashboard:', err);
        setError(err.response?.data?.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    if (franchiseSlug) {
      fetchDashboard();
    }
  }, [franchiseSlug]);

  const getRoleDisplay = (role: string | null) => {
    if (!role) return '';
    const roleMap: Record<string, string> = {
      'franchise_owner': 'Franchise Owner',
      'franchise_admin': 'Franchise Admin',
      'branch_manager': 'Branch Manager',
      'staff': 'Staff Member',
    };
    return roleMap[role] || role;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
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

  const statCards = [
    {
      title: 'Branches',
      value: stats?.branches || 0,
      icon: Building2,
      description: 'Active branches',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Locations',
      value: stats?.locations || 0,
      icon: MapPin,
      description: 'Total locations',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
    },
    {
      title: 'Menus',
      value: stats?.menus || 0,
      icon: UtensilsCrossed,
      description: 'Published menus',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Team Members',
      value: stats?.staff || 0,
      icon: Users,
      description: 'Active staff',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">
          Welcome to {franchise?.name || franchiseSlug}
        </h1>
        <p className="text-neutral-600">
          {userRole && (
            <span>
              You are logged in as <span className="font-medium">{getRoleDisplay(userRole)}</span>
            </span>
          )}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-neutral-600">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-neutral-500 mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks for managing your franchise</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <a
              href={`/${franchiseSlug}/dashboard/menus`}
              className="flex items-center gap-3 p-4 rounded-lg border hover:bg-neutral-50 transition-colors"
            >
              <div className="p-2 rounded-lg bg-emerald-100">
                <UtensilsCrossed className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="font-medium">Manage Menus</p>
                <p className="text-sm text-neutral-500">Edit menu items and categories</p>
              </div>
            </a>
            
            <a
              href={`/${franchiseSlug}/dashboard/locations`}
              className="flex items-center gap-3 p-4 rounded-lg border hover:bg-neutral-50 transition-colors"
            >
              <div className="p-2 rounded-lg bg-blue-100">
                <MapPin className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">View Locations</p>
                <p className="text-sm text-neutral-500">Manage your franchise locations</p>
              </div>
            </a>
            
            <a
              href={`/${franchiseSlug}/dashboard/team`}
              className="flex items-center gap-3 p-4 rounded-lg border hover:bg-neutral-50 transition-colors"
            >
              <div className="p-2 rounded-lg bg-orange-100">
                <Users className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="font-medium">Team Management</p>
                <p className="text-sm text-neutral-500">Invite and manage team members</p>
              </div>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
