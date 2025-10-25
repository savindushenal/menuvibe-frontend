'use client';

import { motion } from 'framer-motion';
import { Eye, Scan, TrendingUp, Users, ArrowUp, ArrowDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const stats = [
  {
    title: 'Total Menu Views',
    value: '12,456',
    change: '+12.5%',
    trend: 'up',
    icon: Eye,
    color: 'emerald',
  },
  {
    title: 'QR Code Scans',
    value: '3,842',
    change: '+8.2%',
    trend: 'up',
    icon: Scan,
    color: 'blue',
  },
  {
    title: 'Popular Items',
    value: '24',
    change: '+3',
    trend: 'up',
    icon: TrendingUp,
    color: 'orange',
  },
  {
    title: 'Active Customers',
    value: '1,234',
    change: '-2.4%',
    trend: 'down',
    icon: Users,
    color: 'purple',
  },
];

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
  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">Dashboard</h1>
        <p className="text-neutral-600 mt-1">Welcome back! Here's your restaurant overview.</p>
      </div>

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
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 p-3 rounded-lg bg-neutral-50 hover:bg-neutral-100 transition-colors"
                >
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-neutral-900">
                      Menu item updated
                    </p>
                    <p className="text-xs text-neutral-500">2 hours ago</p>
                  </div>
                </div>
              ))}
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
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-4 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white font-semibold shadow-lg shadow-emerald-500/30 hover:shadow-xl transition-shadow"
              >
                Add Menu Item
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-4 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl transition-shadow"
              >
                Generate QR Code
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-4 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white font-semibold shadow-lg shadow-orange-500/30 hover:shadow-xl transition-shadow"
              >
                View Analytics
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-4 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white font-semibold shadow-lg shadow-purple-500/30 hover:shadow-xl transition-shadow"
              >
                Edit Profile
              </motion.button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
