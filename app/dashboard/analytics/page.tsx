'use client';

import { motion } from 'framer-motion';
import { TrendingUp, Users, Eye, Scan, Calendar } from 'lucide-react';
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

const viewsData = [
  { date: 'Mon', views: 320, scans: 145 },
  { date: 'Tue', views: 410, scans: 190 },
  { date: 'Wed', views: 380, scans: 165 },
  { date: 'Thu', views: 520, scans: 240 },
  { date: 'Fri', views: 680, scans: 310 },
  { date: 'Sat', views: 890, scans: 420 },
  { date: 'Sun', views: 750, scans: 350 },
];

const popularItems = [
  { name: 'Caesar Salad', orders: 145 },
  { name: 'Grilled Salmon', orders: 132 },
  { name: 'Margherita Pizza', orders: 118 },
  { name: 'Beef Burger', orders: 98 },
  { name: 'Pasta Carbonara', orders: 87 },
];

const categoryData = [
  { name: 'Appetizers', value: 25, color: '#10b981' },
  { name: 'Main Courses', value: 45, color: '#3b82f6' },
  { name: 'Desserts', value: 15, color: '#f97316' },
  { name: 'Beverages', value: 15, color: '#8b5cf6' },
];

const stats = [
  {
    title: 'Total Views',
    value: '24,567',
    change: '+15.3%',
    icon: Eye,
    color: 'emerald',
  },
  {
    title: 'QR Scans',
    value: '8,234',
    change: '+12.5%',
    icon: Scan,
    color: 'blue',
  },
  {
    title: 'Engagement Rate',
    value: '68.4%',
    change: '+5.2%',
    icon: TrendingUp,
    color: 'orange',
  },
  {
    title: 'Unique Visitors',
    value: '3,892',
    change: '+8.7%',
    icon: Users,
    color: 'purple',
  },
];

export default function AnalyticsPage() {
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
          <Button variant="outline" className="border-neutral-300">
            <Calendar className="w-4 h-4 mr-2" />
            Last 7 Days
          </Button>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {stats.map((stat, index) => (
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
        ))}
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
            <BarChart data={popularItems}>
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
              {popularItems.map((item, index) => (
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
                    {item.orders} orders
                  </span>
                </motion.div>
              ))}
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
