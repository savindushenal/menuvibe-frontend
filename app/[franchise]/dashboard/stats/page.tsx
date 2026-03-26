'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area,
} from 'recharts';
import {
  TrendingUp, TrendingDown, ShoppingCart, DollarSign, Clock,
  Star, Sparkles, Zap, Target, ArrowUpRight, ArrowDownRight, ChefHat,
  Activity, CheckCircle2, Timer, Flame,
  Brain, ThumbsUp, Layers, Globe, MapPin, Crown, Shield, Store,
  RefreshCw, Info,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useFranchise } from '@/contexts/franchise-context';

// ─── Role definitions ────────────────────────────────────────────────────── //
type Role = 'owner' | 'branch_manager' | 'super_admin';

const ROLES: { id: Role; label: string; icon: React.ElementType; color: string }[] = [
  { id: 'owner',          label: 'Owner',          icon: Crown,  color: '#F26522' },
  { id: 'branch_manager', label: 'Branch Manager', icon: Store,  color: '#6DBDB6' },
  { id: 'super_admin',    label: 'Super Admin',    icon: Shield, color: '#8b5cf6' },
];

// ─── API helper ──────────────────────────────────────────────────────────── //
async function fetchStats(franchiseSlug: string, endpoint: string, token?: string): Promise<any | null> {
  try {
    const res = await fetch(
      `/api/franchise/${franchiseSlug}/stats/${endpoint}`,
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

// ─── Demo fallback data ──────────────────────────────────────────────────── //
const demoWeeklyOrders = [
  { day: 'Mon', orders: 42, revenue: 18500 },
  { day: 'Tue', orders: 38, revenue: 16200 },
  { day: 'Wed', orders: 55, revenue: 24300 },
  { day: 'Thu', orders: 61, revenue: 27800 },
  { day: 'Fri', orders: 78, revenue: 35100 },
  { day: 'Sat', orders: 94, revenue: 42600 },
  { day: 'Sun', orders: 88, revenue: 39700 },
];

const demoTopItems = [
  { name: 'Signature Prawns', orders: 142, revenue: 64600, category: 'Mains' },
  { name: 'Garlic Butter King Crab', orders: 98, revenue: 58800, category: 'Mains' },
  { name: 'Prawn Cocktail', orders: 87, revenue: 26100, category: 'Appetizers' },
  { name: 'Seafood Platter', orders: 72, revenue: 50400, category: 'Special Combos' },
  { name: 'Grilled Lobster', orders: 64, revenue: 57600, category: 'Mains' },
  { name: 'Calamari Rings', orders: 58, revenue: 17400, category: 'Appetizers' },
];

const demoCategories = [
  { name: 'Mains', orders: 304, pct: 48 },
  { name: 'Appetizers', orders: 145, pct: 23 },
  { name: 'Special Combos', orders: 108, pct: 17 },
  { name: 'Salads', orders: 76, pct: 12 },
];

const demoFunnel = [
  { stage: 'Order Placed',  count: 456 },
  { stage: 'Confirmed',     count: 441 },
  { stage: 'Preparing',     count: 428 },
  { stage: 'Ready',         count: 418 },
  { stage: 'Delivered',     count: 412 },
];

const demoHourly = Array.from({ length: 14 }, (_, i) => ({
  hour: `${i + 9}:00`,
  orders: Math.floor(Math.random() * 18) + 2,
}));

const demoLocations = [
  { name: 'Colombo 03 – Main',   revenue: 142500, orders: 312, avg: 457 },
  { name: 'Colombo 07 – Branch', revenue: 98400,  orders: 218, avg: 451 },
  { name: 'Kandy – City Centre', revenue: 76200,  orders: 171, avg: 446 },
];

const demoRecommendations = [
  { pair: 'Signature Prawns + Garlic Butter King Crab', lift: 2.4, orders: 68 },
  { pair: 'Prawn Cocktail + Seafood Platter',           lift: 1.9, orders: 41 },
  { pair: 'Calamari Rings + Grilled Lobster',           lift: 1.7, orders: 29 },
];

// ─── KPI Card ────────────────────────────────────────────────────────────── //
function KpiCard({
  icon: Icon, label, value, delta, color, subtitle,
}: {
  icon: React.ElementType; label: string; value: string; delta?: number; color: string; subtitle?: string;
}) {
  const positive = delta !== undefined && delta >= 0;
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-neutral-500">{label}</p>
            <p className="text-2xl font-bold text-neutral-900 mt-1">{value}</p>
            {subtitle && <p className="text-xs text-neutral-400 mt-0.5">{subtitle}</p>}
          </div>
          <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${color}20` }}>
            <Icon className="w-5 h-5" style={{ color }} />
          </div>
        </div>
        {delta !== undefined && (
          <div className={`flex items-center gap-1 mt-3 text-xs font-medium ${positive ? 'text-emerald-600' : 'text-red-500'}`}>
            {positive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            {Math.abs(delta).toFixed(1)}% vs yesterday
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Owner View ──────────────────────────────────────────────────────────── //
function OwnerView({ overview, weeklyTrend, menuPerf, funnel, locations, brandColor }: any) {
  const weekly = weeklyTrend?.days ?? demoWeeklyOrders;
  const topItems = menuPerf?.top_items ?? demoTopItems;
  const categories = menuPerf?.categories ?? demoCategories;
  const funnelData = funnel?.stages ?? demoFunnel;
  const locs = locations ?? demoLocations;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={DollarSign} label="Today's Revenue" value={`LKR ${(overview?.today?.revenue ?? 38400).toLocaleString()}`} delta={overview?.today?.revenue_delta_pct} color={brandColor} />
        <KpiCard icon={ShoppingCart} label="Today's Orders" value={String(overview?.today?.orders ?? 88)} delta={overview?.today?.orders_delta_pct} color="#8b5cf6" />
        <KpiCard icon={Target} label="Avg Order Value" value={`LKR ${(overview?.today?.avg_order_value ?? 436).toFixed(0)}`} color="#f59e0b" />
        <KpiCard icon={Activity} label="Week Revenue" value={`LKR ${((overview?.week?.revenue ?? 204200) / 1000).toFixed(0)}k`} subtitle="Last 7 days" color="#10b981" />
      </div>

      {/* Weekly Trend */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4" style={{ color: brandColor }} />
            Weekly Revenue & Orders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={weekly}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={brandColor} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={brandColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
              <Tooltip />
              <Area yAxisId="left" type="monotone" dataKey="revenue" stroke={brandColor} fill="url(#revGrad)" strokeWidth={2} name="Revenue (LKR)" />
              <Bar yAxisId="right" dataKey="orders" fill="#e2e8f0" name="Orders" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Items + Category split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-500" />
              Top Menu Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topItems.slice(0, 6).map((item: any, i: number) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-neutral-400 w-4">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-neutral-700">{item.name}</span>
                      <span className="text-neutral-500">{item.orders ?? item.qty} orders</span>
                    </div>
                    <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${((item.orders ?? item.qty) / (topItems[0].orders ?? topItems[0].qty)) * 100}%`, backgroundColor: brandColor }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="w-4 h-4 text-violet-500" />
              Category Split
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={categories} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="orders" nameKey="name">
                  {categories.map((_: any, i: number) => (
                    <Cell key={i} fill={[brandColor, '#8b5cf6', '#f59e0b', '#10b981'][i % 4]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 mt-2">
              {categories.map((c: any, i: number) => (
                <div key={i} className="flex justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: [brandColor, '#8b5cf6', '#f59e0b', '#10b981'][i % 4] }} />
                    <span className="text-neutral-600">{c.name}</span>
                  </div>
                  <span className="font-medium text-neutral-700">{c.pct}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order Funnel */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="w-4 h-4 text-blue-500" />
            Order Funnel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {funnelData.map((s: any, i: number) => {
              const pct = Math.round((s.count / funnelData[0].count) * 100);
              return (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-neutral-600">{s.stage}</span>
                    <span className="font-medium">{s.count} <span className="text-neutral-400 font-normal">({pct}%)</span></span>
                  </div>
                  <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ delay: i * 0.1, duration: 0.6 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: brandColor, opacity: 1 - i * 0.12 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Location Scorecard */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-500" />
            Location Scorecard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {locs.map((loc: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-neutral-400" />
                  <span className="text-sm font-medium text-neutral-700">{loc.name}</span>
                </div>
                <div className="flex gap-6 text-sm">
                  <div className="text-right">
                    <p className="font-semibold text-neutral-900">LKR {(loc.revenue / 1000).toFixed(0)}k</p>
                    <p className="text-xs text-neutral-400">Revenue</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-neutral-900">{loc.orders}</p>
                    <p className="text-xs text-neutral-400">Orders</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Branch Manager View ─────────────────────────────────────────────────── //
function BranchManagerView({ hourly, liveOrders, menuPerf, brandColor }: any) {
  const hours = hourly?.hours ?? demoHourly;
  const live = liveOrders?.orders ?? [];
  const topItems = menuPerf?.top_items ?? demoTopItems.slice(0, 4);

  const statusColors: Record<string, string> = {
    pending: '#f59e0b', preparing: '#3b82f6', ready: '#10b981', delivered: '#6366f1', completed: '#a3a3a3',
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Clock}    label="Active Orders" value={String(live.length || 12)} color={brandColor} />
        <KpiCard icon={Timer}    label="Avg Wait Time" value="14 min" color="#f59e0b" />
        <KpiCard icon={CheckCircle2} label="Completed Today" value="88" color="#10b981" />
        <KpiCard icon={Flame}    label="Peak Hour" value="7:00 PM" color="#ef4444" />
      </div>

      {/* Hourly flow */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="w-4 h-4" style={{ color: brandColor }} />
            Today's Hourly Order Flow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={hours}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="orders" fill={brandColor} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Live orders queue */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-500" />
            Live Order Queue
            {live.length === 0 && <span className="text-xs font-normal text-neutral-400 ml-2">(no active orders)</span>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {live.length === 0 ? (
            <p className="text-sm text-neutral-400 text-center py-6">All orders completed — queue is clear</p>
          ) : (
            <div className="space-y-2">
              {live.map((o: any, i: number) => (
                <div key={i} className="flex justify-between items-center p-3 bg-neutral-50 rounded-xl">
                  <span className="text-sm font-medium text-neutral-700">Order #{o.id}</span>
                  <span className="text-xs px-2 py-1 rounded-full text-white" style={{ backgroundColor: statusColors[o.status] ?? '#999' }}>{o.status}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top sellers */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-400" />
            Today's Top Sellers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topItems.slice(0, 4).map((item: any, i: number) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs font-bold text-neutral-400 w-4">{i + 1}</span>
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{item.name}</span>
                    <span className="text-neutral-500">{item.orders ?? item.qty} orders</span>
                  </div>
                  <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${((item.orders ?? item.qty) / (topItems[0].orders ?? topItems[0].qty)) * 100}%`, backgroundColor: brandColor }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Recommendations Panel ───────────────────────────────────────────────── //
function RecommendationsPanel({ data, brandColor }: any) {
  const recs = data?.pairs ?? demoRecommendations;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <KpiCard icon={Brain}    label="Rec Engine Status" value="Active" color="#8b5cf6" />
        <KpiCard icon={ThumbsUp} label="Upsell Accepted"   value="34%" color={brandColor} />
        <KpiCard icon={Sparkles} label="Avg Uplift"        value="+18% AOV" color="#f59e0b" />
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-500" />
            AI-Powered Item Pairings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recs.map((r: any, i: number) => (
              <div key={i} className="p-4 bg-gradient-to-r from-violet-50 to-violet-50/0 rounded-xl border border-violet-100">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-sm font-medium text-neutral-800">{r.pair}</p>
                  <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full shrink-0 ml-2">
                    {r.orders} orders
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-xs text-emerald-600 font-medium">{r.lift}× lift</span>
                  <span className="text-xs text-neutral-400">vs. independent purchase probability</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Super Admin View ────────────────────────────────────────────────────── //
function SuperAdminView({ overview, locations, brandColor }: any) {
  const locs = locations ?? demoLocations;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Globe}       label="Total Locations" value={String(locs.length)}                                                    color={brandColor} />
        <KpiCard icon={DollarSign}  label="Total Revenue"   value={`LKR ${(locs.reduce((s: number, l: any) => s + l.revenue, 0) / 1000).toFixed(0)}k`} color="#10b981" />
        <KpiCard icon={ShoppingCart} label="Total Orders"   value={String(locs.reduce((s: number, l: any) => s + l.orders, 0))}           color="#3b82f6" />
        <KpiCard icon={Activity}    label="System Health"   value="99.8%" color="#8b5cf6" />
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="w-4 h-4" style={{ color: brandColor }} />
            All Locations Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={locs} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={160} />
              <Tooltip />
              <Bar dataKey="revenue" fill={brandColor} radius={[0, 4, 4, 0]} name="Revenue (LKR)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {locs.map((loc: any, i: number) => (
          <Card key={i} className="border-0 shadow-sm">
            <CardContent className="pt-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-neutral-400" />
                  <span className="font-medium text-neutral-800">{loc.name}</span>
                </div>
                <div className="flex gap-6 text-sm">
                  <div className="text-right">
                    <p className="font-bold">LKR {(loc.revenue / 1000).toFixed(0)}k</p>
                    <p className="text-xs text-neutral-400">Revenue</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{loc.orders}</p>
                    <p className="text-xs text-neutral-400">Orders</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">LKR {loc.avg ?? Math.round(loc.revenue / loc.orders)}</p>
                    <p className="text-xs text-neutral-400">Avg Order</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────── //
export default function FranchiseStatsPage() {
  const params = useParams();
  const franchiseSlug = params?.franchise as string;
  const { currentFranchise, branding } = useFranchise();

  // Derive brand color from franchise branding, fallback to a neutral brand color
  const brandColor = (branding as any)?.colors?.primary ?? '#6366f1';

  const [role, setRole] = useState<Role>('owner');
  const [tab, setTab] = useState<'main' | 'recommendations'>('main');
  const [loading, setLoading] = useState(true);

  const [overview, setOverview]   = useState<any>(null);
  const [weekly, setWeekly]       = useState<any>(null);
  const [menuPerf, setMenuPerf]   = useState<any>(null);
  const [funnel, setFunnel]       = useState<any>(null);
  const [hourly, setHourly]       = useState<any>(null);
  const [liveOrders, setLiveOrders] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [locations, setLocations] = useState<any>(null);

  const loadData = useCallback(async () => {
    if (!franchiseSlug) return;
    setLoading(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') ?? undefined : undefined;

    const [ov, wt, mp, fn, hf, lo, rec, locs] = await Promise.all([
      fetchStats(franchiseSlug, 'overview', token),
      fetchStats(franchiseSlug, 'weekly-trend', token),
      fetchStats(franchiseSlug, 'menu-performance', token),
      fetchStats(franchiseSlug, 'order-funnel', token),
      fetchStats(franchiseSlug, 'hourly-flow', token),
      fetchStats(franchiseSlug, 'live-orders', token),
      fetchStats(franchiseSlug, 'recommendations', token),
      fetchStats(franchiseSlug, 'locations', token),
    ]);

    setOverview(ov);
    setWeekly(wt);
    setMenuPerf(mp);
    setFunnel(fn);
    setHourly(hf);
    setLiveOrders(lo);
    setRecommendations(rec);
    setLocations(locs);
    setLoading(false);
  }, [franchiseSlug]);

  useEffect(() => { loadData(); }, [loadData]);

  const isLive = !!overview;
  const franchiseName = currentFranchise?.name ?? franchiseSlug?.toUpperCase();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">{franchiseName} Statistics</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Performance across menus, orders & recommendations</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Loading…' : 'Refresh'}
        </Button>
      </div>

      {/* Demo data notice */}
      {!isLive && !loading && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
          <Info className="w-4 h-4 mt-0.5 shrink-0" />
          <span>Showing sample data — live order data will appear once orders are recorded for this franchise.</span>
        </div>
      )}

      {/* Role switcher */}
      <div className="flex gap-2 flex-wrap">
        {ROLES.map((r) => (
          <button
            key={r.id}
            onClick={() => { setRole(r.id); setTab('main'); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              role === r.id
                ? 'text-white shadow-md'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
            style={role === r.id ? { backgroundColor: r.color } : {}}
          >
            <r.icon className="w-4 h-4" />
            {r.label}
          </button>
        ))}
      </div>

      {/* Tab bar (Owner only) */}
      {role === 'owner' && (
        <div className="flex gap-1 bg-neutral-100 p-1 rounded-xl w-fit">
          {[
            { id: 'main', label: 'Menu & Orders' },
            { id: 'recommendations', label: 'AI Recommendations' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                tab === t.id ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${role}-${tab}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {role === 'owner' && tab === 'main' && (
            <OwnerView overview={overview} weeklyTrend={weekly} menuPerf={menuPerf} funnel={funnel} locations={locations} brandColor={brandColor} />
          )}
          {role === 'owner' && tab === 'recommendations' && (
            <RecommendationsPanel data={recommendations} brandColor={brandColor} />
          )}
          {role === 'branch_manager' && (
            <BranchManagerView hourly={hourly} liveOrders={liveOrders} menuPerf={menuPerf} brandColor={brandColor} />
          )}
          {role === 'super_admin' && (
            <SuperAdminView overview={overview} locations={locations} brandColor={brandColor} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
