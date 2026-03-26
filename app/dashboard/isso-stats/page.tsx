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
  BarChart2, Activity, CheckCircle2, Timer, Flame,
  Brain, ThumbsUp, Layers, Globe, MapPin, Crown, Shield, Store,
  RefreshCw, Info,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// ─── Isso brand palette ──────────────────────────────────────────────────── //
const ISSO_TEAL   = '#6DBDB6';
const ISSO_CORAL  = '#F26522';
const ISSO_YELLOW = '#E8F34E';

// ─── Role definitions ────────────────────────────────────────────────────── //
type Role = 'owner' | 'branch_manager' | 'super_admin';

const ROLES: { id: Role; label: string; icon: React.ElementType; color: string }[] = [
  { id: 'owner',          label: 'Owner',          icon: Crown,  color: ISSO_CORAL  },
  { id: 'branch_manager', label: 'Branch Manager', icon: Store,  color: ISSO_TEAL   },
  { id: 'super_admin',    label: 'Super Admin',    icon: Shield, color: '#8b5cf6'   },
];

// ─── API helper ──────────────────────────────────────────────────────────── //
const FRANCHISE_SLUG = 'isso';

async function fetchStats(endpoint: string, token?: string): Promise<any | null> {
  try {
    const res = await fetch(
      `/api/franchise/${FRANCHISE_SLUG}/stats/${endpoint}`,
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

// ─── Demo data (used when API returns no data) ───────────────────────────── //
const demoWeeklyOrders = [
  { day: 'Mon', orders: 28, revenue: 71960 },
  { day: 'Tue', orders: 34, revenue: 87412 },
  { day: 'Wed', orders: 31, revenue: 79715 },
  { day: 'Thu', orders: 42, revenue: 107982 },
  { day: 'Fri', orders: 67, revenue: 172290 },
  { day: 'Sat', orders: 89, revenue: 228930 },
  { day: 'Sun', orders: 72, revenue: 185040 },
];

const demoHourlyOrders = [
  { label: '10am', orders: 2 }, { label: '11am', orders: 5 },
  { label: '12pm', orders: 11 }, { label: '1pm', orders: 14 },
  { label: '2pm', orders: 8 },  { label: '3pm', orders: 3 },
  { label: '4pm', orders: 2 },  { label: '5pm', orders: 4 },
  { label: '6pm', orders: 7 },  { label: '7pm', orders: 13 },
  { label: '8pm', orders: 11 }, { label: '9pm', orders: 6 },
  { label: '10pm', orders: 3 },
];

const demoTopItems = [
  { id: 1, name: 'Hot Butter',                orders: 245, revenue: 697625, category: 'Mains',      trend: 12  },
  { id: 2, name: 'Coconut Crumbed Prawns',    orders: 198, revenue: 386100, category: 'Appetizers', trend: 8   },
  { id: 3, name: 'Tuna Tataki',               orders: 176, revenue: 572000, category: 'Mains',      trend: 5   },
  { id: 4, name: 'Eastern Spice',             orders: 154, revenue: 454300, category: 'Mains',      trend: 3   },
  { id: 5, name: 'Batter Fried Prawns',       orders: 143, revenue: 264550, category: 'Appetizers', trend: -2  },
  { id: 6, name: 'Rich & Red',                orders: 128, revenue: 352000, category: 'Mains',      trend: 7   },
  { id: 7, name: 'Prawn Soufflé Toast',       orders: 97,  revenue: 140650, category: 'Appetizers', trend: 1   },
  { id: 8, name: 'Prawn & Guacamole Salad',   orders: 82,  revenue: 159900, category: 'Salads',     trend: 4   },
];

const demoCategoryData = [
  { name: 'Mains',      value: 703, pct: 48, color: ISSO_CORAL  },
  { name: 'Appetizers', value: 513, pct: 35, color: ISSO_TEAL   },
  { name: 'Salads',     value: 249, pct: 17, color: ISSO_YELLOW  },
];

const demoOrderFunnel = [
  { stage: 'Order Placed', count: 40 },
  { stage: 'Confirmed',    count: 38 },
  { stage: 'Preparing',    count: 36 },
  { stage: 'Ready',        count: 35 },
  { stage: 'Delivered',    count: 34 },
];

const demoLiveOrders = [
  { id: 'IS-0041', order_number: 'IS-0041', table: 'T-07', items: 4, item_count: 4, status: 'preparing', elapsed: '8 min',  elapsed_label: '8 min',  total: 9800  },
  { id: 'IS-0042', order_number: 'IS-0042', table: 'T-03', items: 2, item_count: 2, status: 'preparing', elapsed: '6 min',  elapsed_label: '6 min',  total: 5700  },
  { id: 'IS-0043', order_number: 'IS-0043', table: 'T-11', items: 6, item_count: 6, status: 'ready',     elapsed: '14 min', elapsed_label: '14 min', total: 14500 },
  { id: 'IS-0044', order_number: 'IS-0044', table: 'T-02', items: 3, item_count: 3, status: 'pending',   elapsed: '2 min',  elapsed_label: '2 min',  total: 7350  },
];

const demoTableStatus = [
  { id: 'T-01', status: 'available' }, { id: 'T-02', status: 'occupied' },
  { id: 'T-03', status: 'occupied' }, { id: 'T-04', status: 'available' },
  { id: 'T-05', status: 'available' }, { id: 'T-06', status: 'reserved'  },
  { id: 'T-07', status: 'occupied' }, { id: 'T-08', status: 'available' },
  { id: 'T-09', status: 'available' }, { id: 'T-10', status: 'reserved'  },
  { id: 'T-11', status: 'occupied' }, { id: 'T-12', status: 'available' },
];

const demoRecSignals = [
  { signal: 'Trending',  shown: 342, clicked: 147, converted: 98,  ctr: 43, cvr: 29, color: ISSO_CORAL  },
  { signal: 'Upsells',   shown: 218, clicked: 83,  converted: 54,  ctr: 38, cvr: 25, color: '#8b5cf6'   },
  { signal: 'Pairings',  shown: 276, clicked: 119, converted: 76,  ctr: 43, cvr: 28, color: ISSO_TEAL   },
  { signal: 'Cart Gaps', shown: 154, clicked: 59,  converted: 41,  ctr: 38, cvr: 27, color: '#f59e0b'   },
];

const demoRecWeekly = [
  { day: 'Mon', trending: 38, upsells: 22, pairings: 31, guide: 8  },
  { day: 'Tue', trending: 44, upsells: 28, pairings: 37, guide: 11 },
  { day: 'Wed', trending: 41, upsells: 25, pairings: 34, guide: 9  },
  { day: 'Thu', trending: 55, upsells: 36, pairings: 48, guide: 14 },
  { day: 'Fri', trending: 76, upsells: 52, pairings: 68, guide: 22 },
  { day: 'Sat', trending: 98, upsells: 71, pairings: 87, guide: 34 },
  { day: 'Sun', trending: 80, upsells: 58, pairings: 73, guide: 27 },
];

const demoLocations = [
  { id: 1, name: 'Isso Moratuwa', orders: 363, revenue: 1122348, status: 'online'  },
  { id: 2, name: 'Isso Colombo',  orders: 441, revenue: 1362285, status: 'online'  },
  { id: 3, name: 'Isso Galle',    orders: 198, revenue: 611442,  status: 'online'  },
  { id: 4, name: 'Isso Kandy',    orders: 0,   revenue: 0,       status: 'offline' },
];

const STATUS_COLORS: Record<string, string> = {
  pending:   '#f59e0b',
  preparing: ISSO_CORAL,
  ready:     '#10b981',
  delivered: '#6366f1',
  cancelled: '#ef4444',
};

// ─── Shared small components ─────────────────────────────────────────────── //

function KpiCard({
  title, value, sub, change, icon: Icon, color, prefix = '', delay = 0,
}: {
  title: string; value: string | number; sub?: string;
  change?: number; icon: React.ElementType; color: string; prefix?: string; delay?: number;
}) {
  const up = (change ?? 0) >= 0;
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
      <Card className="border-neutral-200 hover:shadow-md transition-shadow">
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}18` }}>
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            {change !== undefined && (
              <span className={`flex items-center gap-0.5 text-xs font-semibold px-2 py-1 rounded-full ${up ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {Math.abs(change)}%
              </span>
            )}
          </div>
          <p className="text-2xl font-bold text-neutral-900">{prefix}{typeof value === 'number' ? value.toLocaleString() : value}</p>
          <p className="text-sm text-neutral-500 mt-0.5">{title}</p>
          {sub && <p className="text-xs text-neutral-400 mt-1">{sub}</p>}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function SectionCard({ icon: Icon, title, sub, delay = 0, children }: {
  icon: React.ElementType; title: string; sub?: string; delay?: number; children: React.ReactNode;
}) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay }}>
      <Card className="border-neutral-200">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-neutral-100">
              <Icon className="w-4 h-4 text-neutral-600" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-neutral-900">{title}</CardTitle>
              {sub && <p className="text-xs text-neutral-500 mt-0.5">{sub}</p>}
            </div>
          </div>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Role views ──────────────────────────────────────────────────────────── //

function OwnerView({ overview, weekly, menuPerf }: { overview?: any; weekly?: any[]; menuPerf?: any }) {
  const todayRevenue = overview?.today?.revenue      ?? 87450;
  const todayOrders  = overview?.today?.orders       ?? 40;
  const avgOV        = overview?.today?.avg_order_value ?? 2186;
  const itemsSold    = overview?.today?.items_sold   ?? 156;
  const revDelta     = overview?.today?.revenue_delta_pct ?? 14;
  const ordDelta     = overview?.today?.orders_delta_pct  ?? 8;

  const chartData = weekly?.length
    ? weekly.map((d: any) => ({ day: d.day, orders: d.orders, revenue: d.revenue }))
    : demoWeeklyOrders;

  const items   = menuPerf?.top_items?.length  ? menuPerf.top_items  : demoTopItems;
  const catPie  = menuPerf?.categories?.length
    ? menuPerf.categories.map((c: any, i: number) => ({
        name: c.name, value: c.orders, pct: c.pct,
        color: [ISSO_CORAL, ISSO_TEAL, ISSO_YELLOW, '#8b5cf6'][i % 4],
      }))
    : demoCategoryData;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Revenue Today"    value={Math.round(todayRevenue).toLocaleString()} prefix="LKR " change={revDelta} icon={DollarSign}  color={ISSO_CORAL}  delay={0.05} />
        <KpiCard title="Orders Today"     value={todayOrders}                               change={ordDelta}               icon={ShoppingCart} color={ISSO_TEAL}   delay={0.10} />
        <KpiCard title="Avg Order Value"  value={Math.round(avgOV).toLocaleString()}        prefix="LKR " change={6}        icon={TrendingUp}   color="#8b5cf6"     delay={0.15} />
        <KpiCard title="Items Sold Today" value={itemsSold}                                 change={11}                     icon={ChefHat}      color="#f59e0b"     delay={0.20} />
      </div>

      {/* Weekly trend */}
      <SectionCard icon={BarChart2} title="Weekly Performance" sub="Revenue & orders — last 7 days" delay={0.25}>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"   stopColor={ISSO_CORAL} stopOpacity={0.2} />
                <stop offset="95%"  stopColor={ISSO_CORAL} stopOpacity={0}   />
              </linearGradient>
              <linearGradient id="ordGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"   stopColor={ISSO_TEAL} stopOpacity={0.2} />
                <stop offset="95%"  stopColor={ISSO_TEAL} stopOpacity={0}   />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="day" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="rev" orientation="right" tick={{ fontSize: 11 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
            <YAxis yAxisId="ord" tick={{ fontSize: 11 }} />
            <Tooltip formatter={(val: number, name: string) => name === 'Revenue' ? [`LKR ${val.toLocaleString()}`, name] : [val, name]} />
            <Legend />
            <Area yAxisId="rev" type="monotone" dataKey="revenue" name="Revenue" stroke={ISSO_CORAL} fill="url(#revGrad)" strokeWidth={2} />
            <Area yAxisId="ord" type="monotone" dataKey="orders"  name="Orders"  stroke={ISSO_TEAL}  fill="url(#ordGrad)"  strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </SectionCard>

      {/* Menu perf + category pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div className="lg:col-span-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <Card className="border-neutral-200">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-neutral-100">
                  <Flame className="w-4 h-4 text-neutral-600" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold text-neutral-900">Menu Performance</CardTitle>
                  <p className="text-xs text-neutral-500 mt-0.5">Top items by orders — 7 days</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(items as typeof demoTopItems).map((item, i) => (
                  <div key={item.id ?? item.name} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-neutral-300 w-5 flex-shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-neutral-800 truncate max-w-[200px]">{item.name}</span>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="text-xs text-neutral-500">{item.orders} orders</span>
                          <span className={`flex items-center text-xs font-semibold ${(item.trend ?? 0) >= 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                            {(item.trend ?? 0) >= 0 ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                            {Math.abs(item.trend ?? 0)}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-neutral-100 rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full transition-all"
                          style={{ width: `${(item.orders / (items as typeof demoTopItems)[0].orders) * 100}%`, backgroundColor: i === 0 ? ISSO_CORAL : ISSO_TEAL }}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-neutral-400 w-20 text-right flex-shrink-0">
                      LKR {((item.revenue ?? 0) / 1000).toFixed(0)}k
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <SectionCard icon={Layers} title="Category Split" sub="Orders by category" delay={0.35}>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={catPie} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                {(catPie as typeof demoCategoryData).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(val: number) => [`${val} orders`]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {(catPie as typeof demoCategoryData).map(cat => (
              <div key={cat.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="text-sm text-neutral-700">{cat.name}</span>
                </div>
                <span className="text-sm font-semibold text-neutral-800">{cat.pct}%</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Order funnel */}
      <SectionCard icon={Activity} title="Order Processing Funnel" sub="Today — placement through delivery" delay={0.4}>
        <div className="flex items-end gap-3 justify-center py-2">
          {demoOrderFunnel.map((stage, i) => {
            const funnelColors = [ISSO_CORAL, ISSO_TEAL, '#8b5cf6', '#f59e0b', '#10b981'];
            return (
              <div key={stage.stage} className="flex flex-col items-center gap-2 flex-1 max-w-[110px]">
                <span className="text-xl font-bold" style={{ color: funnelColors[i] }}>{stage.count}</span>
                <div
                  className="w-full rounded-t-xl"
                  style={{
                    backgroundColor: funnelColors[i],
                    opacity: 0.8 - i * 0.06,
                    height: `${Math.round((stage.count / demoOrderFunnel[0].count) * 100)}px`,
                    minHeight: 20,
                  }}
                />
                <span className="text-xs text-neutral-500 text-center leading-tight">{stage.stage}</span>
                {i < demoOrderFunnel.length - 1 && (
                  <span className="text-xs text-neutral-300">
                    {((demoOrderFunnel[i + 1].count / stage.count) * 100).toFixed(0)}% →
                  </span>
                )}
              </div>
            );
          })}
        </div>
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-neutral-100 mt-4">
          <div className="text-center"><p className="text-xl font-bold text-emerald-600">34</p><p className="text-xs text-neutral-400">Completed</p></div>
          <div className="text-center"><p className="text-xl font-bold" style={{ color: ISSO_CORAL }}>4</p><p className="text-xs text-neutral-400">In Progress</p></div>
          <div className="text-center"><p className="text-xl font-bold text-red-400">2</p><p className="text-xs text-neutral-400">Cancelled</p></div>
        </div>
      </SectionCard>
    </div>
  );
}

function BranchManagerView({ liveOrdersData, hourlyData, topItems }: {
  liveOrdersData?: any[] | null; hourlyData?: any[] | null; topItems?: any[] | null;
}) {
  const orders: any[]      = liveOrdersData ?? demoLiveOrders;
  const hourlyChart: any[] = hourlyData     ?? demoHourlyOrders;
  const sellers: any[]     = topItems       ?? demoTopItems;
  const activeCount        = orders.filter((o: any) => ['pending','preparing','ready'].includes(o.status)).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Active Orders"    value={activeCount || 4}  sub="2 almost ready"    icon={ShoppingCart} color={ISSO_CORAL} delay={0.05} />
        <KpiCard title="Tables Occupied"  value="4 / 12"            sub="33% utilization"   icon={Store}        color={ISSO_TEAL}  delay={0.10} />
        <KpiCard title="Avg Prep Time"    value="12 min"            sub="Target: 15 min"    icon={Timer}        color="#10b981"    delay={0.15} />
        <KpiCard title="Satisfaction"     value="4.9 ★"             sub="Based on 12 reviews" icon={Star}       color="#f59e0b"   delay={0.20} />
      </div>

      {/* Live orders */}
      <SectionCard icon={Activity} title="Live Order Board" sub="Real-time kitchen queue" delay={0.25}>
        <div className="space-y-3">
          {orders.map((order: any) => (
            <div
              key={order.id}
              className="flex items-center gap-4 p-4 rounded-xl border"
              style={{ borderColor: `${STATUS_COLORS[order.status]}40`, backgroundColor: `${STATUS_COLORS[order.status]}08` }}
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ backgroundColor: STATUS_COLORS[order.status] }}>
                {order.table}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-neutral-800">{order.order_number ?? order.id}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium capitalize"
                    style={{ backgroundColor: `${STATUS_COLORS[order.status]}20`, color: STATUS_COLORS[order.status] }}>
                    {order.status}
                  </span>
                </div>
                <p className="text-sm text-neutral-500">{order.item_count ?? order.items} items · LKR {(order.total ?? 0).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-1 text-neutral-400 text-sm flex-shrink-0">
                <Clock className="w-4 h-4" />
                {order.elapsed_label ?? order.elapsed}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Table map */}
        <SectionCard icon={MapPin} title="Table Status" sub="Floor overview" delay={0.3}>
          <div className="grid grid-cols-4 gap-3">
            {demoTableStatus.map(t => (
              <div
                key={t.id}
                className="aspect-square rounded-xl flex flex-col items-center justify-center text-xs font-semibold border-2"
                style={{
                  backgroundColor: t.status === 'occupied' ? `${ISSO_CORAL}15` : t.status === 'reserved' ? `${ISSO_TEAL}15` : '#f9fafb',
                  color:           t.status === 'occupied' ? ISSO_CORAL         : t.status === 'reserved' ? ISSO_TEAL          : '#9ca3af',
                  borderColor:     t.status === 'occupied' ? `${ISSO_CORAL}50`  : t.status === 'reserved' ? `${ISSO_TEAL}50`   : 'transparent',
                }}
              >
                <Store className="w-4 h-4 mb-0.5" />{t.id}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-4 text-xs text-neutral-500">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: ISSO_CORAL }} /> Occupied</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: ISSO_TEAL  }} /> Reserved</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full inline-block bg-neutral-200" /> Available</span>
          </div>
        </SectionCard>

        {/* Hourly */}
        <SectionCard icon={Clock} title="Today's Order Flow" sub="Orders by hour" delay={0.35}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={hourlyChart} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={1} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="orders" name="Orders" radius={[4, 4, 0, 0]}>
                {hourlyChart.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={(entry.orders ?? 0) >= 10 ? ISSO_CORAL : ISSO_TEAL} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>
      </div>

      {/* Top sellers */}
      <SectionCard icon={Flame} title="Today's Best Sellers" sub="Branch performance" delay={0.4}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {sellers.slice(0, 4).map((item: any, i: number) => (
            <div key={item.id ?? item.name} className="text-center p-4 rounded-xl bg-neutral-50">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold mx-auto mb-2"
                style={{ backgroundColor: i === 0 ? ISSO_CORAL : ISSO_TEAL }}>
                {i + 1}
              </div>
              <p className="text-sm font-semibold text-neutral-800 leading-tight mb-1 line-clamp-2">{item.name}</p>
              <p className="text-xs text-neutral-500">{Math.round(item.orders / 7)} today</p>
              <p className={`text-xs font-semibold mt-1 ${(item.trend ?? 0) >= 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                {(item.trend ?? 0) >= 0 ? '↑' : '↓'} {Math.abs(item.trend ?? 0)}%
              </p>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

function RecommendationsPanel({ signals: apiSignals }: { signals?: any[] | null }) {
  const signals = (apiSignals ?? demoRecSignals).map((s: any) => ({
    ...s,
    color: s.signal === 'Trending' ? ISSO_CORAL : s.signal === 'Upsells' ? '#8b5cf6' : s.signal === 'Pairings' ? ISSO_TEAL : '#f59e0b',
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {signals.map((sig: any, i: number) => (
          <motion.div key={sig.signal} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}>
            <Card className="border-neutral-200 hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${sig.color}18` }}>
                    <Brain className="w-4 h-4" style={{ color: sig.color }} />
                  </div>
                  <span className="text-sm font-semibold text-neutral-700">{sig.signal}</span>
                </div>
                <p className="text-2xl font-bold text-neutral-900">{sig.ctr}%</p>
                <p className="text-xs text-neutral-400 mb-2">Click-through rate</p>
                <div className="w-full bg-neutral-100 rounded-full h-1.5 mb-2">
                  <div className="h-1.5 rounded-full" style={{ width: `${sig.ctr}%`, backgroundColor: sig.color }} />
                </div>
                <div className="flex justify-between text-xs text-neutral-400">
                  <span>{sig.shown} shown</span>
                  <span>{sig.converted} converted</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <SectionCard icon={Sparkles} title="AI Recommendation Activity" sub="Clicks per signal type — last 7 days" delay={0.25}>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={demoRecWeekly} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
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
      </SectionCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard icon={TrendingUp} title="Upsell Revenue Impact" sub="Additional revenue from AI engine" delay={0.3}>
          <div className="space-y-4">
            {[
              { label: 'Trending → Add to Cart',  orders: 98, revenue: 214278, pct: 43 },
              { label: 'Upsell → Upgrade',        orders: 54, revenue: 135000, pct: 25 },
              { label: 'Pairing → Added Item',    orders: 76, revenue: 143880, pct: 35 },
              { label: 'Cart Gap → Added Drink',  orders: 41, revenue: 61500,  pct: 19 },
            ].map(row => (
              <div key={row.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-neutral-700">{row.label}</span>
                  <span className="text-sm font-semibold text-neutral-800">LKR {(row.revenue / 1000).toFixed(0)}k</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-neutral-100 rounded-full h-2">
                    <div className="h-2 rounded-full" style={{ width: `${row.pct}%`, backgroundColor: ISSO_CORAL }} />
                  </div>
                  <span className="text-xs text-neutral-400 w-16 text-right">{row.orders} orders</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 pt-4 border-t border-neutral-100 flex items-center justify-between">
            <div>
              <p className="text-xs text-neutral-400">Total uplift this week</p>
              <p className="text-2xl font-bold" style={{ color: ISSO_CORAL }}>LKR 554,658</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-neutral-400">vs food-only orders</p>
              <p className="text-lg font-bold text-emerald-500">+28.4%</p>
            </div>
          </div>
        </SectionCard>

        <SectionCard icon={ThumbsUp} title="Most Recommended Items" sub="Items surfaced most by AI engine" delay={0.35}>
          <div className="space-y-3">
            {[
              { name: 'Hot Butter',             signal: 'Trending',  clicks: 98,  icon: '🔥' },
              { name: 'Coconut Crumbed Prawns',  signal: 'Upsell',    clicks: 76,  icon: '⬆️' },
              { name: 'Eastern Spice',           signal: 'Pairing',   clicks: 64,  icon: '🔗' },
              { name: 'Prawn Soufflé Toast',     signal: 'Cart Gap',  clicks: 41,  icon: '🛒' },
              { name: 'Fresh Garden Salad',      signal: 'Cart Gap',  clicks: 38,  icon: '🛒' },
            ].map(row => (
              <div key={row.name} className="flex items-center gap-3">
                <span className="text-lg w-7 flex-shrink-0">{row.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-800 truncate">{row.name}</p>
                  <p className="text-xs text-neutral-400">{row.signal}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-neutral-700">{row.clicks}</p>
                  <p className="text-xs text-neutral-400">clicks</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function SuperAdminView({ overview, locData }: { overview?: any; locData?: any[] | null }) {
  const locs         = locData ?? demoLocations;
  const totalOrders  = locs.reduce((s: number, l: any) => s + l.orders,  0);
  const totalRevenue = locs.reduce((s: number, l: any) => s + l.revenue, 0);
  const onlineCount  = locs.filter((l: any) => l.status !== 'offline').length;

  const systemMetrics = [
    { metric: 'API Uptime',       value: '99.97%', icon: Activity,    color: '#10b981' },
    { metric: 'Avg Response',     value: '142ms',  icon: Zap,         color: ISSO_TEAL   },
    { metric: 'QR Scans (7d)',    value: '2,847',  icon: Target,      color: ISSO_CORAL  },
    { metric: 'Active Endpoints', value: '4',      icon: Globe,       color: '#8b5cf6'   },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {systemMetrics.map((m, i) => (
          <KpiCard key={m.metric} title={m.metric} value={m.value} icon={m.icon} color={m.color} delay={0.05 * i} />
        ))}
      </div>

      <SectionCard icon={Globe} title="All Locations — This Week" sub="Cross-branch performance" delay={0.25}>
        <div className="space-y-3">
          {(locs as typeof demoLocations).map(loc => (
            <div key={loc.id ?? loc.name} className="flex items-center gap-4 p-4 rounded-xl bg-neutral-50">
              <div className={`w-3 h-3 rounded-full flex-shrink-0 ${loc.status !== 'offline' ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-300'}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-semibold text-neutral-800">{loc.name}</span>
                  {loc.status === 'offline' && <span className="text-xs text-neutral-400 bg-neutral-200 px-2 py-0.5 rounded-full">Offline</span>}
                </div>
                {loc.status !== 'offline'
                  ? <p className="text-sm text-neutral-500">{loc.orders} orders · LKR {(loc.revenue / 1000).toFixed(0)}k</p>
                  : <p className="text-xs text-neutral-400">Coming soon</p>
                }
              </div>
              {loc.status !== 'offline' && (
                <p className="text-lg font-bold text-neutral-900 flex-shrink-0">LKR {(loc.revenue / 1000).toFixed(0)}k</p>
              )}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-neutral-100">
          <div className="text-center"><p className="text-xl font-bold text-neutral-900">{totalOrders.toLocaleString()}</p><p className="text-xs text-neutral-400">Total Orders</p></div>
          <div className="text-center"><p className="text-xl font-bold" style={{ color: ISSO_CORAL }}>LKR {(totalRevenue / 1000000).toFixed(1)}M</p><p className="text-xs text-neutral-400">Total Revenue</p></div>
          <div className="text-center"><p className="text-xl font-bold text-emerald-600">{onlineCount}/{locs.length}</p><p className="text-xs text-neutral-400">Locations Online</p></div>
        </div>
      </SectionCard>

      <SectionCard icon={BarChart2} title="Revenue by Location" sub="This week — LKR" delay={0.3}>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={locs.filter((l: any) => l.status !== 'offline')} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(val: number) => [`LKR ${val.toLocaleString()}`]} />
            <Bar dataKey="revenue" name="Revenue" radius={[6, 6, 0, 0]}>
              {locs.filter((l: any) => l.status !== 'offline').map((_: any, index: number) => (
                <Cell key={`cell-${index}`} fill={index === 1 ? ISSO_CORAL : ISSO_TEAL} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </SectionCard>

      <SectionCard icon={Shield} title="System Health" sub="MenuVibe platform status" delay={0.35}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { service: 'POS Order Engine',         latency: '38ms'  },
            { service: 'AI Recommendation API',    latency: '142ms' },
            { service: 'QR Scan Tracker',          latency: '22ms'  },
            { service: 'Push Notifications',       latency: '67ms'  },
            { service: 'Menu Sync Engine',         latency: '89ms'  },
            { service: 'Analytics Pipeline',       latency: '210ms' },
          ].map(svc => (
            <div key={svc.service} className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <span className="text-sm text-neutral-700 flex-1">{svc.service}</span>
              <span className="text-xs text-neutral-400">{svc.latency}</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────── //

export default function IssoStatsPage() {
  const [role, setRole] = useState<Role>('owner');
  const [tab, setTab]   = useState<'performance' | 'recommendations'>('performance');

  // Live data (null = API not loaded yet or returned nothing → demo data used)
  const [liveOverview,    setLiveOverview]    = useState<any | null>(null);
  const [liveMenuPerf,    setLiveMenuPerf]    = useState<any | null>(null);
  const [liveWeekly,      setLiveWeekly]      = useState<any | null>(null);
  const [liveHourly,      setLiveHourly]      = useState<any | null>(null);
  const [liveLiveOrders,  setLiveLiveOrders]  = useState<any | null>(null);
  const [liveRec,         setLiveRec]         = useState<any | null>(null);
  const [liveLocations,   setLiveLocations]   = useState<any | null>(null);
  const [isLive,          setIsLive]          = useState(false);
  const [loading,         setLoading]         = useState(true);

  const loadLiveData = useCallback(async () => {
    setLoading(true);
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
    // Consider it "live" if at least overview came back from the server
    setIsLive(!!overview);
    setLoading(false);
  }, []);

  useEffect(() => { loadLiveData(); }, [loadLiveData]);

  const activeRole = ROLES.find(r => r.id === role)!;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-sm"
              style={{ background: `linear-gradient(135deg, ${ISSO_CORAL}, ${ISSO_TEAL})` }}
            >
              IS
            </div>
            <h1 className="text-2xl font-bold text-neutral-900">Isso Analytics</h1>
          </div>
          <p className="text-neutral-500 text-sm ml-12">
            Menu performance, order processing & AI recommendation insights
          </p>
        </div>

        {/* Data source badge + refresh */}
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium border ${
            isLive
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            {isLive ? 'Live Data' : 'Demo Data — connect to see real orders'}
          </div>
          <Button variant="outline" size="sm" className="border-neutral-200" onClick={loadLiveData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Loading…' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* ── Role switcher ── */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-neutral-400 mr-1">View as:</span>
        {ROLES.map(r => {
          const Icon = r.icon;
          const active = role === r.id;
          return (
            <button
              key={r.id}
              onClick={() => setRole(r.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all"
              style={{
                backgroundColor: active ? r.color : 'transparent',
                borderColor:     active ? r.color : '#e5e7eb',
                color:           active ? '#fff'   : '#6b7280',
              }}
            >
              <Icon className="w-4 h-4" />
              {r.label}
            </button>
          );
        })}
      </div>

      {/* ── Sub-tabs (owner + super admin) ── */}
      {role !== 'branch_manager' && (
        <div className="flex gap-1 border-b border-neutral-200">
          {[
            { id: 'performance'     as const, label: 'Menu & Orders',      icon: BarChart2 },
            { id: 'recommendations' as const, label: 'AI Recommendations', icon: Brain     },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px"
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
      )}

      {/* ── Content ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${role}-${tab}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
        >
          {role === 'branch_manager' && (
            <BranchManagerView
              liveOrdersData={liveLiveOrders?.orders}
              hourlyData={liveHourly?.hours}
              topItems={liveMenuPerf?.top_items}
            />
          )}
          {role !== 'branch_manager' && tab === 'performance' && (
            role === 'owner'
              ? <OwnerView overview={liveOverview} weekly={liveWeekly?.days} menuPerf={liveMenuPerf} />
              : <SuperAdminView overview={liveOverview} locData={liveLocations?.locations} />
          )}
          {role !== 'branch_manager' && tab === 'recommendations' && (
            <RecommendationsPanel signals={liveRec?.signals} />
          )}
        </motion.div>
      </AnimatePresence>

      {/* ── Demo data notice ── */}
      {!isLive && !loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-start gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50"
        >
          <Info className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">Showing demo data</p>
            <p className="text-xs text-amber-600 mt-0.5">
              The figures above are sample data for the Isso restaurant. Real data will appear automatically once orders
              are placed through the MenuVibe POS system and you are authenticated with an Isso franchise account.
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
