'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, Scan, TrendingUp, Users, ArrowUp, ArrowDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProtectedRoute } from '@/components/protected-route';

interface DashboardStats {
  totalViews: {
    value: number;
    change: number;
    trend: 'up' | 'down';
    formatted: string;
  };
  qrScans: {
    value: number;
    change: number;
    trend: 'up' | 'down';
    formatted: string;
  };
  menuItems: {
    value: number;
    change: number;
    trend: 'up' | 'down';
    formatted: string;
  };
  activeCustomers: {
    value: number;
    change: number;
    trend: 'up' | 'down';
    formatted: string;
  };
}

interface Activity {
  description: string;
  timeAgo: string;
  type: string;
}

interface DashboardData {
  stats: DashboardStats;
  recentActivity: Activity[];
  popularItems: Array<{ id: number; name: string; viewCount: number }>;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        const token = localStorage.getItem('auth_token');
        
        const response = await fetch('/api/dashboard/stats', {
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          }
        });
        const result = await response.json();

        if (result.success) {
          setDashboardData(result.data);
          setError(null);
        } else {
          setError(result.message || 'Failed to fetch dashboard data');
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  const stats = dashboardData ? [
    {
      title: 'Total Menu Views',
      value: dashboardData.stats.totalViews.formatted,
      change: `${dashboardData.stats.totalViews.trend === 'up' ? '+' : '-'}${dashboardData.stats.totalViews.change}%`,
      trend: dashboardData.stats.totalViews.trend,
      icon: Eye,
      color: 'emerald',
    },
    {
      title: 'QR Code Scans',
      value: dashboardData.stats.qrScans.formatted,
      change: `${dashboardData.stats.qrScans.trend === 'up' ? '+' : '-'}${dashboardData.stats.qrScans.change}%`,
      trend: dashboardData.stats.qrScans.trend,
      icon: Scan,
      color: 'blue',
    },
    {
      title: 'Menu Items',
      value: dashboardData.stats.menuItems.formatted,
      change: `${dashboardData.stats.menuItems.change >= 0 ? '+' : ''}${dashboardData.stats.menuItems.change}`,
      trend: dashboardData.stats.menuItems.trend,
      icon: TrendingUp,
      color: 'orange',
    },
    {
      title: 'Active Customers',
      value: dashboardData.stats.activeCustomers.formatted,
      change: `${dashboardData.stats.activeCustomers.trend === 'up' ? '+' : '-'}${dashboardData.stats.activeCustomers.change}%`,
      trend: dashboardData.stats.activeCustomers.trend,
      icon: Users,
      color: 'purple',
    },
  ] : [];

  return (
    <ProtectedRoute requireOnboarding={true}>
      <div className="p-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Dashboard</h1>
          <p className="text-neutral-600 mt-1">Welcome back! Here's your restaurant overview.</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="border-neutral-200">
                <CardHeader className="pb-2">
                  <div className="h-4 bg-neutral-200 rounded animate-pulse w-24"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-neutral-200 rounded animate-pulse w-32"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        ) : (
          <>
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {stats.map((stat) => (
                <motion.div key={stat.title} variants={item}>
                  <Card className="border-neutral-200 hover:shadow-lg transition-shadow duration-300">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-neutral-600">
                        {stat.title}
                      </CardTitle>
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br ${
                          stat.color === 'emerald'
                            ? 'from-emerald-100 to-emerald-200'
                            : stat.color === 'blue'
                            ? 'from-blue-100 to-blue-200'
                            : stat.color === 'orange'
                            ? 'from-orange-100 to-orange-200'
                            : 'from-purple-100 to-purple-200'
                        }`}
                      >
                        <stat.icon
                          className={`w-5 h-5 ${
                            stat.color === 'emerald'
                              ? 'text-emerald-600'
                              : stat.color === 'blue'
                              ? 'text-blue-600'
                              : stat.color === 'orange'
                              ? 'text-orange-600'
                              : 'text-purple-600'
                          }`}
                        />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-baseline justify-between">
                        <h3 className="text-3xl font-bold text-neutral-900">{stat.value}</h3>
                        <div
                          className={`flex items-center gap-1 text-sm font-semibold ${
                            stat.trend === 'up' ? 'text-emerald-600' : 'text-red-600'
                          }`}
                        >
                          {stat.trend === 'up' ? (
                            <ArrowUp className="w-4 h-4" />
                          ) : (
                            <ArrowDown className="w-4 h-4" />
                          )}
                          {stat.change}
                        </div>
                      </div>
                      <p className="text-xs text-neutral-500 mt-2">vs last month</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-neutral-200">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-neutral-900">
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dashboardData?.recentActivity && dashboardData.recentActivity.length > 0 ? (
                      dashboardData.recentActivity.slice(0, 5).map((activity, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-4 p-3 rounded-lg bg-neutral-50 hover:bg-neutral-100 transition-colors"
                        >
                          <div className={`w-2 h-2 rounded-full ${
                            activity.type === 'order_placed' ? 'bg-emerald-500' :
                            activity.type === 'qr_scan' ? 'bg-blue-500' :
                            activity.type === 'menu_view' ? 'bg-orange-500' :
                            'bg-purple-500'
                          }`}></div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-neutral-900">
                              {activity.description}
                            </p>
                            <p className="text-xs text-neutral-500">{activity.timeAgo}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-neutral-500">
                        No recent activity
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-neutral-200">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-neutral-900">
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <motion.a
                      href="/dashboard/menu"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-4 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white font-semibold shadow-lg shadow-emerald-500/30 hover:shadow-xl transition-shadow text-center"
                    >
                      Add Menu Item
                    </motion.a>
                    <motion.a
                      href="/dashboard/qr-codes"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-4 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl transition-shadow text-center"
                    >
                      Generate QR Code
                    </motion.a>
                    <motion.a
                      href="/dashboard/analytics"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-4 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white font-semibold shadow-lg shadow-orange-500/30 hover:shadow-xl transition-shadow text-center"
                    >
                      View Analytics
                    </motion.a>
                    <motion.a
                      href="/dashboard/profile"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-4 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white font-semibold shadow-lg shadow-purple-500/30 hover:shadow-xl transition-shadow text-center"
                    >
                      Edit Profile
                    </motion.a>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}
