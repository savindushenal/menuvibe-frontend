'use client';

import { motion } from 'framer-motion';
import { TrendingUp, Users, Eye, Scan, Calendar, ShoppingCart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

// Types for analytics data
interface AnalyticsStats {
  totalViews: number;
  totalScans: number;
  totalOrders: number;
  uniqueVisitors: number;
  recentTrends: {
    views: number;
    scans: number;
    orders: number;
  }[];
  popularItems: {
    name: string;
    orders: number;
  }[];
  eventsByType: {
    [key: string]: number;
  };
}

const categoryData = [
  { name: 'Appetizers', value: 25, color: '#10b981' },
  { name: 'Main Courses', value: 45, color: '#3b82f6' },
  { name: 'Desserts', value: 15, color: '#f97316' },
  { name: 'Beverages', value: 15, color: '#8b5cf6' },
];

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7'); // days

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const period = dateRange === '7' ? '7d' : '30d';
      
      const response = await fetch(`/api/analytics/stats?period=${period}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Transform API data to match component expectations
          const transformedData: AnalyticsStats = {
            totalViews: result.data.overview?.total_views || 0,
            totalScans: result.data.overview?.total_scans || 0,
            totalOrders: result.data.overview?.total_orders || 0,
            uniqueVisitors: result.data.overview?.unique_visitors || 0,
            recentTrends: result.data.timeline?.map((day: any) => ({
              views: day.views || 0,
              scans: day.scans || 0,
              orders: day.orders || 0,
            })).reverse() || [],
            popularItems: result.data.popular_items?.map((item: any) => ({
              name: item.name,
              orders: item.interactions || item.view_count || 0,
            })) || [],
            eventsByType: {}
          };
          setAnalytics(transformedData);
        }
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return '+0%';
    const change = ((current - previous) / previous) * 100;
    return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
  };

  // Create stats array from analytics data
  const stats = analytics ? [
    {
      title: 'Total Views',
      value: formatNumber(analytics.totalViews),
      change: '+15.3%', // You can calculate this from analytics.recentTrends
      icon: Eye,
      color: 'emerald',
    },
    {
      title: 'QR Scans',
      value: formatNumber(analytics.totalScans),
      change: '+12.5%',
      icon: Scan,
      color: 'blue',
    },
    {
      title: 'Orders',
      value: formatNumber(analytics.totalOrders),
      change: '+8.7%',
      icon: ShoppingCart,
      color: 'orange',
    },
    {
      title: 'Unique Visitors',
      value: formatNumber(analytics.uniqueVisitors),
      change: '+5.2%',
      icon: Users,
      color: 'purple',
    },
  ] : [];

  // Create chart data from analytics trends
  const viewsData = analytics?.recentTrends.map((trend, index) => {
    const daysAgo = analytics.recentTrends.length - 1 - index;
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    return {
      date: dateRange === '7' ? dayName : monthDay,
      views: trend.views,
      scans: trend.scans,
      orders: trend.orders,
    };
  }) || [];

  if (loading) {
    return (
      <div className="p-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Analytics</h1>
            <p className="text-neutral-600 mt-1">
              Track your menu performance and customer engagement
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
            <p className="mt-4 text-neutral-600">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Analytics</h1>
          <p className="text-neutral-600 mt-1">
            Track your menu performance and customer engagement
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant={dateRange === '7' ? 'default' : 'outline'} 
            className="border-neutral-300"
            onClick={() => setDateRange('7')}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Last 7 Days
          </Button>
          <Button 
            variant={dateRange === '30' ? 'default' : 'outline'} 
            className="border-neutral-300"
            onClick={() => setDateRange('30')}
          >
            Last 30 Days
          </Button>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {loading ? (
          // Loading skeletons
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="border-neutral-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="h-4 bg-neutral-200 rounded w-24 animate-pulse"></div>
                <div className="w-10 h-10 bg-neutral-200 rounded-lg animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-neutral-200 rounded w-16 animate-pulse mb-2"></div>
                <div className="h-3 bg-neutral-200 rounded w-20 animate-pulse"></div>
              </CardContent>
            </Card>
          ))
        ) : (
          stats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
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
                    <span className="text-sm font-semibold text-emerald-600">
                      {stat.change}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 mt-2">vs last week</p>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-neutral-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-neutral-900">
              Views & Scans Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={viewsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="views"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ fill: '#10b981', r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="scans"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="orders"
                  stroke="#f97316"
                  strokeWidth={3}
                  dot={{ fill: '#f97316', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-neutral-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-neutral-900">
              Category Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

        <Card className="border-neutral-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-neutral-900">
              Most Popular Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics?.popularItems || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="orders" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-neutral-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-neutral-900">
              Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {!analytics || analytics.popularItems.length === 0 ? (
                <div className="text-center py-8 text-neutral-500">
                  <TrendingUp className="w-12 h-12 mx-auto mb-2 text-neutral-300" />
                  <p>No item data available yet</p>
                  <p className="text-sm">Data will appear as customers interact with your menu</p>
                </div>
              ) : (
                analytics.popularItems.slice(0, 5).map((item, index) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center text-white font-bold">
                        {index + 1}
                      </div>
                      <span className="font-medium text-neutral-900">{item.name}</span>
                    </div>
                    <span className="text-emerald-600 font-semibold">
                      {item.orders} views
                    </span>
                  </motion.div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-neutral-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-neutral-900">
              Insights & Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  title: 'Peak Hours',
                  description: 'Most views occur between 6 PM - 8 PM',
                  color: 'emerald',
                },
                {
                  title: 'Growing Category',
                  description: 'Appetizers show 23% increase this week',
                  color: 'blue',
                },
                {
                  title: 'Low Engagement',
                  description: 'Consider updating dessert descriptions',
                  color: 'orange',
                },
              ].map((insight, index) => (
                <motion.div
                  key={insight.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="p-4 bg-neutral-50 rounded-lg border-l-4 border-emerald-500"
                >
                  <h4 className="font-semibold text-neutral-900">{insight.title}</h4>
                  <p className="text-sm text-neutral-600 mt-1">{insight.description}</p>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
