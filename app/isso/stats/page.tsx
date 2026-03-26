'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area,
} from 'recharts';
import {
  TrendingUp, TrendingDown, ShoppingCart, Users, DollarSign, Clock,
  Star, Sparkles, Zap, Target, ArrowUpRight, ArrowDownRight, ChefHat,
  BarChart2, Activity, AlertCircle, CheckCircle2, Timer, Flame,
  Brain, ThumbsUp, Layers, Globe, MapPin, Crown, Shield, Store,
} from 'lucide-react';

// ─── Isso Brand Palette ──────────────────────────────────────────────────── //
const ISSO_TEAL   = '#6DBDB6';
const ISSO_CORAL  = '#F26522';
const ISSO_ORANGE = '#ED5C3C';
const ISSO_YELLOW = '#E8F34E';
const ISSO_DARK   = '#1A1A1A';

// ─── Live API helpers (Isso franchise slug = "isso") ────────────────────── //

const FRANCHISE_SLUG = 'isso';

async function fetchStats(endpoint: string, token?: string): Promise<any | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? ''}/api/franchise/${FRANCHISE_SLUG}/stats/${endpoint}`,
      {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      }
    );
    if (!res.ok) return null;
    const json = await res.json();
    return json.success ? json.data : null;
  } catch {
    return null;
  }
}

// ─── Role definitions ────────────────────────────────────────────────────── //
type Role = 'owner' | 'branch_manager' | 'super_admin';

const ROLES: { id: Role; label: string; icon: React.ElementType; color: string }[] = [
  { id: 'owner',          label: 'Owner',          icon: Crown,  color: ISSO_CORAL  },
  { id: 'branch_manager', label: 'Branch Manager', icon: Store,  color: ISSO_TEAL   },
  { id: 'super_admin',    label: 'Super Admin',    icon: Shield, color: '#8b5cf6'   },
];

// ─── Demo Data (Isso Moratuwa, March 26 2026) ───────────────────────────── //

// Weekly order trend
const weeklyOrders = [
  { day: 'Mon', orders: 28, revenue: 71960 },
  { day: 'Tue', orders: 34, revenue: 87412 },
  { day: 'Wed', orders: 31, revenue: 79715 },
  { day: 'Thu', orders: 42, revenue: 107982 },
  { day: 'Fri', orders: 67, revenue: 172290 },
  { day: 'Sat', orders: 89, revenue: 228930 },
  { day: 'Sun', orders: 72, revenue: 185040 },
];

// Today's hourly orders
const hourlyOrders = [
  { hour: '10am', orders: 2 },
  { hour: '11am', orders: 5 },
  { hour: '12pm', orders: 11 },
  { hour: '1pm',  orders: 14 },
  { hour: '2pm',  orders: 8 },
  { hour: '3pm',  orders: 3 },
  { hour: '4pm',  orders: 2 },
  { hour: '5pm',  orders: 4 },
  { hour: '6pm',  orders: 7 },
  { hour: '7pm',  orders: 13 },
  { hour: '8pm',  orders: 11 },
  { hour: '9pm',  orders: 6 },
  { hour: '10pm', orders: 3 },
];

// Top menu items by orders this week
const topMenuItems = [
  { name: 'Hot Butter',              orders: 245, revenue: 697625, category: 'Mains',      trend: +12, img: '/isso/Hot Butter.jpg'                                   },
  { name: 'Coconut Crumbed Prawns',  orders: 198, revenue: 386100, category: 'Appetizers', trend: +8,  img: '/isso/Coconut Crumbed Prawns 4 pcs.jpg'                  },
  { name: 'Tuna Tataki',             orders: 176, revenue: 572000, category: 'Mains',      trend: +5,  img: '/isso/Black Pepper Crusted Yellow Fin Tuna Tataki.jpg'   },
  { name: 'Eastern Spice',           orders: 154, revenue: 454300, category: 'Mains',      trend: +3,  img: '/isso/Eastern Spice.jpg'                                 },
  { name: 'Batter Fried Prawns',     orders: 143, revenue: 264550, category: 'Appetizers', trend: -2,  img: '/isso/Batter Fried Prawns 4pcs.jpg'                      },
  { name: 'Rich & Red',              orders: 128, revenue: 352000, category: 'Mains',      trend: +7,  img: '/isso/Rich & red.jpg'                                    },
  { name: 'Prawn Soufflé Toast',     orders: 97,  revenue: 140650, category: 'Appetizers', trend: +1,  img: '/isso/Prawn Soufflé Toast.jpg'                           },
  { name: 'Prawn & Guacamole Salad', orders: 82,  revenue: 159900, category: 'Salads',     trend: +4,  img: '/isso/Prawn and Guacamole Salad.jpg'                     },
];

// Category distribution
const categoryData = [
  { name: 'Mains',      value: 703, pct: 48, color: ISSO_CORAL  },
  { name: 'Appetizers', value: 513, pct: 35, color: ISSO_TEAL   },
  { name: 'Salads',     value: 249, pct: 17, color: ISSO_YELLOW  },
];

// Order funnel today
const orderFunnel = [
  { stage: 'Order Placed',  count: 40, color: '#6366f1' },
  { stage: 'Confirmed',     count: 38, color: ISSO_TEAL   },
  { stage: 'Preparing',     count: 36, color: ISSO_CORAL  },
  { stage: 'Ready',         count: 35, color: '#f59e0b'   },
  { stage: 'Delivered',     count: 34, color: '#10b981'   },
];

// Live orders (branch manager view)
const liveOrders = [
  { id: 'IS-0041', table: 'T-07', items: 4, status: 'preparing', elapsed: '8 min',  total: 9800  },
  { id: 'IS-0042', table: 'T-03', items: 2, status: 'preparing', elapsed: '6 min',  total: 5700  },
  { id: 'IS-0043', table: 'T-11', items: 6, status: 'ready',     elapsed: '14 min', total: 14500 },
  { id: 'IS-0044', table: 'T-02', items: 3, status: 'pending',   elapsed: '2 min',  total: 7350  },
];

// Table utilization
const tableStatus = [
  { id: 'T-01', status: 'available' }, { id: 'T-02', status: 'occupied' },
  { id: 'T-03', status: 'occupied' }, { id: 'T-04', status: 'available' },
  { id: 'T-05', status: 'available' }, { id: 'T-06', status: 'reserved'  },
  { id: 'T-07', status: 'occupied' }, { id: 'T-08', status: 'available' },
  { id: 'T-09', status: 'available' }, { id: 'T-10', status: 'reserved'  },
  { id: 'T-11', status: 'occupied' }, { id: 'T-12', status: 'available' },
];

// AI Recommendation signals
const recSignals = [
  { signal: 'Trending',  shown: 342, clicked: 147, converted: 98,  ctr: 43, cvr: 29, color: ISSO_CORAL  },
  { signal: 'Upsells',   shown: 218, clicked: 83,  converted: 54,  ctr: 38, cvr: 25, color: '#8b5cf6'   },
  { signal: 'Pairings',  shown: 276, clicked: 119, converted: 76,  ctr: 43, cvr: 28, color: ISSO_TEAL   },
  { signal: 'Cart Gaps', shown: 154, clicked: 59,  converted: 41,  ctr: 38, cvr: 27, color: '#f59e0b'   },
];

const recWeekly = [
  { day: 'Mon', trending: 38, upsells: 22, pairings: 31, guide: 8  },
  { day: 'Tue', trending: 44, upsells: 28, pairings: 37, guide: 11 },
  { day: 'Wed', trending: 41, upsells: 25, pairings: 34, guide: 9  },
  { day: 'Thu', trending: 55, upsells: 36, pairings: 48, guide: 14 },
  { day: 'Fri', trending: 76, upsells: 52, pairings: 68, guide: 22 },
  { day: 'Sat', trending: 98, upsells: 71, pairings: 87, guide: 34 },
  { day: 'Sun', trending: 80, upsells: 58, pairings: 73, guide: 27 },
];

// Multi-location (super admin)
const locations = [
  { name: 'Isso Moratuwa',  orders: 363, revenue: 1122348, rating: 4.9, status: 'online'  },
  { name: 'Isso Colombo',   orders: 441, revenue: 1362285, rating: 4.8, status: 'online'  },
  { name: 'Isso Galle',     orders: 198, revenue: 611442,  rating: 4.7, status: 'online'  },
  { name: 'Isso Kandy',     orders: 0,   revenue: 0,       rating: 0,   status: 'offline' },
];

const systemMetrics = [
  { metric: 'API Uptime',       value: '99.97%', icon: Activity,    color: '#10b981' },
  { metric: 'Avg Response',     value: '142ms',  icon: Zap,         color: ISSO_TEAL   },
  { metric: 'QR Scans (7d)',    value: '2,847',  icon: Target,      color: ISSO_CORAL  },
  { metric: 'Active Endpoints', value: '4',      icon: Globe,       color: '#8b5cf6'   },
];

// ─── Helper components ───────────────────────────────────────────────────── //

function KpiCard({
  title, value, sub, change, icon: Icon, color, prefix = '', delay = 0,
}: {
  title: string; value: string | number; sub?: string;
  change?: number; icon: React.ElementType; color: string; prefix?: string; delay?: number;
}) {
  const up = (change ?? 0) >= 0;
  return (
    <motion.div
      className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        {change !== undefined && (
          <span className={`flex items-center gap-0.5 text-xs font-semibold px-2 py-1 rounded-full ${up ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
            {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(change)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900">{prefix}{typeof value === 'number' ? value.toLocaleString() : value}</p>
      <p className="text-sm text-gray-500 mt-0.5">{title}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </motion.div>
  );
}

function SectionTitle({ icon: Icon, title, sub }: { icon: React.ElementType; title: string; sub?: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${ISSO_CORAL}20` }}>
        <Icon className="w-5 h-5" style={{ color: ISSO_CORAL }} />
      </div>
      <div>
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        {sub && <p className="text-xs text-gray-500">{sub}</p>}
      </div>
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  pending:   '#f59e0b',
  preparing: ISSO_CORAL,
  ready:     '#10b981',
  delivered: '#6366f1',
  cancelled: '#ef4444',
};

// ─── Role Views ──────────────────────────────────────────────────────────── //

function OwnerView({ overview, weekly, menuPerf }: {
  overview?: any;
  weekly?: any[];
  menuPerf?: any;
}) {
  // Merge live data over demo defaults
  const todayRevenue  = overview?.today?.revenue      ?? 87450;
  const todayOrders   = overview?.today?.orders       ?? 40;
  const avgOV         = overview?.today?.avg_order_value ?? 2186;
  const itemsSold     = overview?.today?.items_sold   ?? 156;
  const revDelta      = overview?.today?.revenue_delta_pct ?? 14;
  const ordDelta      = overview?.today?.orders_delta_pct  ?? 8;

  const chartData = weekly
    ? weekly.map((d: any) => ({ day: d.day, orders: d.orders, revenue: d.revenue }))
    : weeklyOrders;

  const items  = menuPerf?.top_items  ?? topMenuItems;
  const cats   = menuPerf?.categories ?? categoryData.map(c => ({ name: c.name, orders: c.value, pct: c.pct }));
  const catPie = menuPerf?.categories
    ? menuPerf.categories.map((c: any, i: number) => ({
        name: c.name, value: c.orders, pct: c.pct,
        color: [ISSO_CORAL, ISSO_TEAL, ISSO_YELLOW, '#8b5cf6'][i % 4],
      }))
    : categoryData;

  return (
    <div className="space-y-8">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Revenue Today"    value={todayRevenue.toLocaleString()}  prefix="LKR " change={revDelta} icon={DollarSign}  color={ISSO_CORAL}  delay={0.05} />
        <KpiCard title="Orders Today"     value={todayOrders}                    change={ordDelta}                icon={ShoppingCart} color={ISSO_TEAL}   delay={0.10} />
        <KpiCard title="Avg Order Value"  value={Math.round(avgOV).toLocaleString()} prefix="LKR " change={+6}  icon={TrendingUp}   color="#8b5cf6"     delay={0.15} />
        <KpiCard title="Items Sold Today" value={itemsSold}                      change={+11}                    icon={ChefHat}      color="#f59e0b"     delay={0.20} />
      </div>

      {/* Weekly Revenue + Orders */}
      <motion.div
        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
      >
        <SectionTitle icon={BarChart2} title="Weekly Performance" sub="Revenue & order volume — last 7 days" />
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={ISSO_CORAL} stopOpacity={0.25} />
                <stop offset="95%" stopColor={ISSO_CORAL} stopOpacity={0}    />
              </linearGradient>
              <linearGradient id="ordersGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={ISSO_TEAL} stopOpacity={0.25} />
                <stop offset="95%" stopColor={ISSO_TEAL} stopOpacity={0}    />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="day" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="rev" orientation="right" tick={{ fontSize: 11 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
            <YAxis yAxisId="ord" tick={{ fontSize: 11 }} />
            <Tooltip
              formatter={(val: number, name: string) =>
                name === 'Revenue' ? [`LKR ${val.toLocaleString()}`, name] : [val, name]
              }
            />
            <Legend />
            <Area yAxisId="rev" type="monotone" dataKey="revenue" name="Revenue" stroke={ISSO_CORAL} fill="url(#revenueGrad)" strokeWidth={2} />
            <Area yAxisId="ord" type="monotone" dataKey="orders"  name="Orders"  stroke={ISSO_TEAL}  fill="url(#ordersGrad)"  strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Top Menu Items + Category Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Items */}
        <motion.div
          className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <SectionTitle icon={Flame} title="Menu Performance" sub="Top items by orders (7-day)" />
          <div className="space-y-3">
            {(items as typeof topMenuItems).map((item, i) => (
              <div key={item.name} className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-300 w-5">{i + 1}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-800 truncate max-w-[200px]">{item.name}</span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-gray-500">{item.orders} orders</span>
                      <span className={`flex items-center text-xs font-semibold ${item.trend >= 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                        {item.trend >= 0 ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                        {Math.abs(item.trend)}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full"
                      style={{ width: `${(item.orders / (items as typeof topMenuItems)[0].orders) * 100}%`, backgroundColor: i === 0 ? ISSO_CORAL : ISSO_TEAL }}
                    />
                  </div>
                </div>
                <span className="text-xs text-gray-400 w-20 text-right">LKR {(item.revenue / 1000).toFixed(0)}k</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Category Pie */}
        <motion.div
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
        >
          <SectionTitle icon={Layers} title="Category Split" sub="Orders by category" />
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={catPie} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                {catPie.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(val: number) => [`${val} orders`]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {catPie.map((cat: any) => (
              <div key={cat.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="text-sm text-gray-700">{cat.name}</span>
                </div>
                <span className="text-sm font-semibold text-gray-800">{cat.pct}%</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Order Funnel */}
      <motion.div
        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <SectionTitle icon={Activity} title="Order Processing Funnel" sub="Today's orders — from placement to delivery" />
        <div className="flex items-end gap-3 justify-center">
          {orderFunnel.map((stage, i) => (
            <div key={stage.stage} className="flex flex-col items-center gap-2 flex-1 max-w-[120px]">
              <span className="text-2xl font-bold" style={{ color: stage.color }}>{stage.count}</span>
              <div
                className="w-full rounded-xl transition-all"
                style={{
                  backgroundColor: stage.color,
                  opacity: 0.85 - i * 0.07,
                  height: `${Math.round((stage.count / orderFunnel[0].count) * 120)}px`,
                  minHeight: 24,
                }}
              />
              <span className="text-xs text-gray-500 text-center leading-tight">{stage.stage}</span>
              {i < orderFunnel.length - 1 && (
                <span className="text-xs text-gray-300">
                  {((orderFunnel[i + 1].count / stage.count) * 100).toFixed(0)}% →
                </span>
              )}
            </div>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-gray-50">
          <div className="text-center">
            <p className="text-xl font-bold text-emerald-500">34</p>
            <p className="text-xs text-gray-400">Completed</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold" style={{ color: ISSO_CORAL }}>4</p>
            <p className="text-xs text-gray-400">In Progress</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-red-400">2</p>
            <p className="text-xs text-gray-400">Cancelled</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function BranchManagerView({ liveOrders: apiOrders, hourlyData, topItems: apiTopItems }: {
  liveOrders?: any[] | null;
  hourlyData?: any[] | null;
  topItems?: any[] | null;
}) {
  const orders: any[]       = apiOrders   ?? liveOrders;
  const hourlyChart: any[]  = hourlyData  ?? hourlyOrders.map(h => ({ hour: h.hour, label: h.hour, orders: h.orders }));
  const topSellers: any[]   = apiTopItems ?? topMenuItems;
  const activeOrders        = orders.filter((o: any) => ['pending','preparing','ready'].includes(o.status ?? o.status));
  return (
    <div className="space-y-8">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Active Orders"    value={activeOrders.length || 4} sub="2 almost ready" icon={ShoppingCart} color={ISSO_CORAL} delay={0.05} />
        <KpiCard title="Tables Occupied"  value="4 / 12" sub="33% utilization" icon={Store}    color={ISSO_TEAL}  delay={0.10} />
        <KpiCard title="Avg Prep Time"    value="12 min" sub="Target: 15 min"  icon={Timer}    color="#10b981"    delay={0.15} />
        <KpiCard title="Satisfaction"     value="4.9 ★"  sub="Based on 12 reviews" icon={Star} color="#f59e0b"   delay={0.20} />
      </div>

      {/* Live Order Board */}
      <motion.div
        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
      >
        <SectionTitle icon={Activity} title="Live Order Board" sub="Real-time kitchen queue" />
        <div className="space-y-3">
          {orders.map((order: any) => (
            <div
              key={order.id}
              className="flex items-center gap-4 p-4 rounded-xl border"
              style={{ borderColor: `${STATUS_COLORS[order.status]}40`, backgroundColor: `${STATUS_COLORS[order.status]}08` }}
            >
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: STATUS_COLORS[order.status] }}>
                  {order.table}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-800">{order.order_number ?? order.id}</span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium capitalize"
                    style={{ backgroundColor: `${STATUS_COLORS[order.status]}20`, color: STATUS_COLORS[order.status] }}
                  >
                    {order.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500">{order.item_count ?? order.items} items · LKR {(order.total ?? 0).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-1 text-gray-400 text-sm flex-shrink-0">
                <Clock className="w-4 h-4" />
                {order.elapsed_label ?? order.elapsed}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Table Grid + Hourly Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Table Map */}
        <motion.div
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <SectionTitle icon={MapPin} title="Table Status" sub="Floor plan view" />
          <div className="grid grid-cols-4 gap-3">
            {tableStatus.map(t => (
              <div
                key={t.id}
                className="aspect-square rounded-xl flex flex-col items-center justify-center text-xs font-semibold"
                style={{
                  backgroundColor:
                    t.status === 'occupied'  ? `${ISSO_CORAL}20` :
                    t.status === 'reserved'  ? `${ISSO_TEAL}20`  :
                    '#f3f4f6',
                  color:
                    t.status === 'occupied'  ? ISSO_CORAL :
                    t.status === 'reserved'  ? ISSO_TEAL  :
                    '#9ca3af',
                  border: `2px solid ${
                    t.status === 'occupied'  ? `${ISSO_CORAL}50` :
                    t.status === 'reserved'  ? `${ISSO_TEAL}50`  :
                    'transparent'
                  }`,
                }}
              >
                <Store className="w-4 h-4 mb-0.5" />
                {t.id}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
            <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ISSO_CORAL }} /> Occupied</div>
            <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ISSO_TEAL  }} /> Reserved</div>
            <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-gray-200" /> Available</div>
          </div>
        </motion.div>

        {/* Hourly Chart */}
        <motion.div
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
        >
          <SectionTitle icon={Clock} title="Today's Order Flow" sub="Orders by hour" />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={hourlyChart} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={1} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="orders" name="Orders" radius={[4, 4, 0, 0]}>
                {hourlyChart.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.orders >= 10 ? ISSO_CORAL : ISSO_TEAL} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Top Sellers (branch today) */}
      <motion.div
        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <SectionTitle icon={Flame} title="Today's Best Sellers" sub="For this branch" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {(topSellers as typeof topMenuItems).slice(0, 4).map((item, i) => (
            <div key={item.name} className="text-center p-4 rounded-xl bg-gray-50">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold mx-auto mb-2"
                style={{ backgroundColor: i === 0 ? ISSO_CORAL : ISSO_TEAL }}
              >
                {i + 1}
              </div>
              <p className="text-sm font-semibold text-gray-800 leading-tight mb-1 line-clamp-2">{item.name}</p>
              <p className="text-xs text-gray-500">{Math.round(item.orders / 7)} today</p>
              <p className={`text-xs font-semibold mt-1 ${item.trend >= 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                {item.trend >= 0 ? '↑' : '↓'} {Math.abs(item.trend)}%
              </p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function RecommendationsPanel({ signals: apiSignals }: { signals?: any[] | null }) {
  const signals = (apiSignals ?? recSignals).map((s: any) => ({
    ...s,
    color:
      s.signal === 'Trending'  ? ISSO_CORAL :
      s.signal === 'Upsells'   ? '#8b5cf6'  :
      s.signal === 'Pairings'  ? ISSO_TEAL  :
      '#f59e0b',
  }));
  return (
    <div className="space-y-8">
      {/* AI Signal Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {signals.map((sig: any, i: number) => (
          <motion.div
            key={sig.signal}
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${sig.color}20` }}>
                <Brain className="w-4 h-4" style={{ color: sig.color }} />
              </div>
              <span className="text-sm font-semibold text-gray-700">{sig.signal}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{sig.ctr}%</p>
            <p className="text-xs text-gray-400 mb-2">Click-through rate</p>
            <div className="w-full bg-gray-100 rounded-full h-1.5 mb-1">
              <div className="h-1.5 rounded-full" style={{ width: `${sig.ctr}%`, backgroundColor: sig.color }} />
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-2">
              <span>{sig.shown} shown</span>
              <span>{sig.converted} converted</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recommendation activity over week */}
      <motion.div
        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
      >
        <SectionTitle icon={Sparkles} title="AI Recommendation Activity" sub="Clicks per signal type — last 7 days" />
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={recWeekly} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="day" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="trending"  name="Trending"   fill={ISSO_CORAL} radius={[3, 3, 0, 0]} />
            <Bar dataKey="upsells"   name="Upsells"    fill="#8b5cf6"   radius={[3, 3, 0, 0]} />
            <Bar dataKey="pairings"  name="Pairings"   fill={ISSO_TEAL} radius={[3, 3, 0, 0]} />
            <Bar dataKey="guide"     name="Guide Used" fill="#f59e0b"   radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Upsell impact */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <SectionTitle icon={TrendingUp} title="Upsell Revenue Impact" sub="Additional revenue attributed to AI recommendations" />
          <div className="space-y-4 mt-2">
            {[
              { label: 'Trending → Add to Cart',    orders: 98,  revenue: 214278, pct: 43 },
              { label: 'Upsell → Upgrade',          orders: 54,  revenue: 135000, pct: 25 },
              { label: 'Pairing → Added Item',      orders: 76,  revenue: 143880, pct: 35 },
              { label: 'Cart Gap → Added Drink',    orders: 41,  revenue: 61500,  pct: 19 },
            ].map(row => (
              <div key={row.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-700">{row.label}</span>
                  <span className="text-sm font-semibold text-gray-800">LKR {(row.revenue / 1000).toFixed(0)}k</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div className="h-2 rounded-full" style={{ width: `${row.pct}%`, backgroundColor: ISSO_CORAL }} />
                  </div>
                  <span className="text-xs text-gray-400 w-16 text-right">{row.orders} orders</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 pt-4 border-t border-gray-50 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">Total uplift this week</p>
              <p className="text-2xl font-bold" style={{ color: ISSO_CORAL }}>LKR 554,658</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">vs food-only orders</p>
              <p className="text-lg font-bold text-emerald-500">+28.4%</p>
            </div>
          </div>
        </motion.div>

        {/* Top recommended items */}
        <motion.div
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
        >
          <SectionTitle icon={ThumbsUp} title="Most Recommended Items" sub="Items surfaced most by AI engine" />
          <div className="space-y-3">
            {[
              { name: 'Hot Butter',             signal: 'Trending',  clicks: 98,  icon: '🔥' },
              { name: 'Coconut Crumbed Prawns',  signal: 'Upsell',    clicks: 76,  icon: '⬆️' },
              { name: 'Eastern Spice',           signal: 'Pairing',   clicks: 64,  icon: '🔗' },
              { name: 'Prawn Soufflé Toast',     signal: 'Cart Gap',  clicks: 41,  icon: '🛒' },
              { name: 'Fresh Garden Salad',      signal: 'Cart Gap',  clicks: 38,  icon: '🛒' },
            ].map((row, i) => (
              <div key={row.name} className="flex items-center gap-3">
                <span className="text-lg w-7">{row.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{row.name}</p>
                  <p className="text-xs text-gray-400">{row.signal}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-gray-700">{row.clicks}</p>
                  <p className="text-xs text-gray-400">clicks</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function SuperAdminView({ overview, locData }: { overview?: any; locData?: any[] | null }) {
  const locationsDisplay = locData ?? locations;
  const totalOrders  = locData ? locData.reduce((s: number, l: any) => s + l.orders, 0)  : locations.reduce((s, l) => s + l.orders, 0);
  const totalRevenue = locData ? locData.reduce((s: number, l: any) => s + l.revenue, 0) : locations.reduce((s, l) => s + l.revenue, 0);
  const onlineCount  = (locData ?? locations).filter((l: any) => l.status !== 'offline').length;
  return (
    <div className="space-y-8">
      {/* System Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {systemMetrics.map((m, i) => (
          <KpiCard key={m.metric} title={m.metric} value={m.value} icon={m.icon} color={m.color} delay={0.05 * i} />
        ))}
      </div>

      {/* Location performance */}
      <motion.div
        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
      >
        <SectionTitle icon={Globe} title="All Locations — This Week" sub="Cross-branch performance overview" />
        <div className="space-y-4">
          {(locationsDisplay as typeof locations).map(loc => (
            <div key={loc.name} className="flex items-center gap-4 p-4 rounded-xl bg-gray-50">
              <div className="flex-shrink-0">
                <div className={`w-3 h-3 rounded-full ${loc.status === 'online' ? 'bg-emerald-400 animate-pulse' : 'bg-gray-300'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-800">{loc.name}</span>
                  {loc.status === 'offline' && (
                    <span className="text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">Offline</span>
                  )}
                </div>
                {loc.status === 'online' ? (
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{loc.orders} orders</span>
                    <span>LKR {(loc.revenue / 1000).toFixed(0)}k revenue</span>
                    <span>⭐ {loc.rating}</span>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">Coming soon</p>
                )}
              </div>
              {loc.status === 'online' && (
                <div className="flex-shrink-0 text-right">
                  <p className="text-lg font-bold text-gray-900">LKR {(loc.revenue / 1000).toFixed(0)}k</p>
                  <p className="text-xs text-gray-400">{loc.orders} orders</p>
                </div>
              )}
            </div>
          ))}
        </div>
        {/* Summary bar */}
        <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
          <div className="text-center">
            <p className="text-xl font-bold text-gray-900">{totalOrders.toLocaleString()}</p>
            <p className="text-xs text-gray-400">Total Orders (7d)</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold" style={{ color: ISSO_CORAL }}>LKR {(totalRevenue / 1000000).toFixed(1)}M</p>
            <p className="text-xs text-gray-400">Total Revenue (7d)</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-emerald-500">{onlineCount}/{locationsDisplay.length}</p>
            <p className="text-xs text-gray-400">Locations Online</p>
          </div>
        </div>
      </motion.div>

      {/* Location revenue bar */}
      <motion.div
        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <SectionTitle icon={BarChart2} title="Revenue by Location" sub="This week — LKR" />
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={(locationsDisplay as typeof locations).filter(l => l.status !== 'offline')}
            margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(val: number) => [`LKR ${val.toLocaleString()}`]} />
            <Bar dataKey="revenue" name="Revenue" radius={[6, 6, 0, 0]}>
              {(locationsDisplay as typeof locations).filter(l => l.status !== 'offline').map((_, index) => (
                <Cell key={`cell-${index}`} fill={index === 1 ? ISSO_CORAL : ISSO_TEAL} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* POS order system health */}
      <motion.div
        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
      >
        <SectionTitle icon={Shield} title="System Health" sub="MenuVibe platform status" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { service: 'POS Order Engine',        status: 'healthy', latency: '38ms'  },
            { service: 'AI Recommendation API',   status: 'healthy', latency: '142ms' },
            { service: 'QR Scan Tracker',         status: 'healthy', latency: '22ms'  },
            { service: 'Push Notifications',      status: 'healthy', latency: '67ms'  },
            { service: 'Menu Sync Engine',        status: 'healthy', latency: '89ms'  },
            { service: 'Analytics Pipeline',      status: 'healthy', latency: '210ms' },
          ].map(svc => (
            <div key={svc.service} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <span className="text-sm text-gray-700 flex-1">{svc.service}</span>
              <span className="text-xs text-gray-400">{svc.latency}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────── //

export default function IssoStatsPage() {
  const [role, setRole] = useState<Role>('owner');
  const [tab, setTab] = useState<'performance' | 'recommendations'>('performance');

  // Live data state (null = use demo data)
  const [liveOverview,   setLiveOverview]   = useState<any | null>(null);
  const [liveMenuPerf,   setLiveMenuPerf]   = useState<any | null>(null);
  const [liveWeekly,     setLiveWeekly]     = useState<any | null>(null);
  const [liveHourly,     setLiveHourly]     = useState<any | null>(null);
  const [liveLiveOrders, setLiveLiveOrders] = useState<any | null>(null);
  const [liveRec,        setLiveRec]        = useState<any | null>(null);
  const [liveLocations,  setLiveLocations]  = useState<any | null>(null);
  const [apiLoaded,      setApiLoaded]      = useState(false);

  const loadLiveData = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') ?? undefined : undefined;
    const [overview, menuPerf, weekly, hourly, orders, rec, locs] = await Promise.all([
      fetchStats('overview',         token),
      fetchStats('menu-performance', token),
      fetchStats('weekly-trend',     token),
      fetchStats('hourly-flow',      token),
      fetchStats('live-orders',      token),
      fetchStats('recommendations',  token),
      fetchStats('locations',        token),
    ]);
    setLiveOverview(overview);
    setLiveMenuPerf(menuPerf);
    setLiveWeekly(weekly);
    setLiveHourly(hourly);
    setLiveLiveOrders(orders);
    setLiveRec(rec);
    setLiveLocations(locs);
    setApiLoaded(true);
  }, []);

  useEffect(() => { loadLiveData(); }, [loadLiveData]);

  const activeRole = ROLES.find(r => r.id === role)!;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8f9fb' }}>
      {/* ── Top bar ── */}
      <div style={{ backgroundColor: ISSO_DARK }} className="px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          {/* Brand + Title */}
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-lg"
              style={{ background: `linear-gradient(135deg, ${ISSO_CORAL}, ${ISSO_TEAL})` }}
            >
              IS
            </div>
            <div>
              <p className="text-white font-bold text-base leading-tight">Isso Analytics</p>
              <p className="text-white/50 text-xs">
                MenuVibe Dashboard · {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                {apiLoaded && liveOverview && (
                  <span className="ml-2 text-emerald-400">● Live</span>
                )}
              </p>
            </div>
          </div>

          {/* Role switcher */}
          <div className="flex items-center gap-2 bg-white/10 rounded-xl p-1">
            {ROLES.map(r => {
              const Icon = r.icon;
              const active = role === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => setRole(r.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                  style={{
                    backgroundColor: active ? r.color : 'transparent',
                    color: active ? '#fff' : 'rgba(255,255,255,0.5)',
                  }}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{r.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Sub-tab (only for owner + super admin) ── */}
      {role !== 'branch_manager' && (
        <div className="border-b border-gray-200 bg-white px-4 sm:px-8">
          <div className="max-w-7xl mx-auto flex gap-1">
            {[
              { id: 'performance'     as const, label: 'Menu & Orders',      icon: BarChart2 },
              { id: 'recommendations' as const, label: 'AI Recommendations', icon: Brain     },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors"
                style={{
                  borderColor: tab === t.id ? ISSO_CORAL : 'transparent',
                  color:       tab === t.id ? ISSO_CORAL : '#6b7280',
                }}
              >
                <t.icon className="w-4 h-4" />
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Page Body ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
        {/* Role context badge */}
        <motion.div
          key={role}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 mb-6"
        >
          <div
            className="flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-full"
            style={{ backgroundColor: `${activeRole.color}15`, color: activeRole.color }}
          >
            <activeRole.icon className="w-4 h-4" />
            Viewing as {activeRole.label}
          </div>
          {role === 'branch_manager' && (
            <span className="text-sm text-gray-400 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> Isso Moratuwa
            </span>
          )}
          {!apiLoaded && (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <div className="w-3 h-3 rounded-full border-2 border-gray-300 border-t-isso-coral animate-spin" />
              Loading live data…
            </span>
          )}
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={`${role}-${tab}`}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            {role === 'branch_manager' && (
              <BranchManagerView
                liveOrders={liveLiveOrders?.orders ?? null}
                hourlyData={liveHourly?.hours ?? null}
                topItems={liveMenuPerf?.top_items ?? null}
              />
            )}
            {role !== 'branch_manager' && tab === 'performance' && (
              role === 'owner'
                ? <OwnerView overview={liveOverview} weekly={liveWeekly?.days ?? null} menuPerf={liveMenuPerf} />
                : <SuperAdminView overview={liveOverview} locData={liveLocations?.locations ?? null} />
            )}
            {role !== 'branch_manager' && tab === 'recommendations' && (
              <RecommendationsPanel signals={liveRec?.signals ?? null} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
