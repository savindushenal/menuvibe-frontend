'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area,
} from 'recharts';
import {
  TrendingUp, ShoppingCart, DollarSign, Clock,
  Star, Sparkles, Zap, Target, ArrowUpRight, ArrowDownRight,
  Activity, CheckCircle2, Timer, Flame,
  Brain, ThumbsUp, Layers, Globe, MapPin, Crown, Shield, Store,
  RefreshCw, Info, Eye, MousePointerClick, Search, TrendingDown,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useFranchise } from '@/contexts/franchise-context';
import { api } from '@/lib/api';

// ─── Role definitions ────────────────────────────────────────────────────── //
type Role = 'owner' | 'branch_manager' | 'super_admin';

const ROLES: { id: Role; label: string; icon: React.ElementType; color: string }[] = [
  { id: 'owner',          label: 'Owner',          icon: Crown,  color: '#F26522' },
  { id: 'branch_manager', label: 'Branch Manager', icon: Store,  color: '#6DBDB6' },
  { id: 'super_admin',    label: 'Super Admin',    icon: Shield, color: '#8b5cf6' },
];

// ─── API helpers — use the configured api client so the correct backend URL
//                  and auth token are applied automatically ─────────────────── //
async function fetchStats(franchiseSlug: string, endpoint: string): Promise<any | null> {
  try {
    const res = await api.get(`/franchise/${franchiseSlug}/stats/${endpoint}`);
    return res.data?.success ? res.data?.data ?? null : null;
  } catch {
    return null;
  }
}

async function fetchBehaviour(franchiseSlug: string, endpoint: string): Promise<any | null> {
  try {
    const res = await api.get(`/franchise/${franchiseSlug}/behaviour/${endpoint}`);
    return res.data?.success ? res.data?.data ?? null : null;
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

// ─── Demo behaviour data ──────────────────────────────────────────────────── //
const demoBehaviourItems = [
  { item_name: 'Signature Prawns',           category_name: 'Mains',          views: 284, cart_adds: 168, cart_removes: 18, conversion_rate: 59.2, avg_view_ms: 12400 },
  { item_name: 'Garlic Butter King Crab',    category_name: 'Mains',          views: 241, cart_adds: 121, cart_removes: 22, conversion_rate: 50.2, avg_view_ms: 15800 },
  { item_name: 'Seafood Platter',            category_name: 'Special Combos', views: 198, cart_adds: 72,  cart_removes: 30, conversion_rate: 36.4, avg_view_ms: 18200 },
  { item_name: 'Prawn Cocktail',             category_name: 'Appetizers',     views: 176, cart_adds: 110, cart_removes: 8,  conversion_rate: 62.5, avg_view_ms: 9800  },
  { item_name: 'Grilled Lobster',            category_name: 'Mains',          views: 162, cart_adds: 44,  cart_removes: 34, conversion_rate: 27.2, avg_view_ms: 21600 },
  { item_name: 'Calamari Rings',             category_name: 'Appetizers',     views: 138, cart_adds: 92,  cart_removes: 6,  conversion_rate: 66.7, avg_view_ms: 8200  },
];
const demoBehaviourFunnel = [
  { stage: 'Menu Opened',  count: 524, pct: 100 },
  { stage: 'Item Viewed',  count: 412, pct: 79 },
  { stage: 'Added to Cart', count: 284, pct: 54 },
  { stage: 'Order Placed', count: 218, pct: 42 },
];
const demoBehaviourHeatmap = Array.from({ length: 24 }, (_, h) => ({
  hour: h,
  label: `${String(h).padStart(2, '0')}:00`,
  views: h < 9 || h > 22 ? Math.floor(Math.random() * 4) : Math.floor(Math.random() * 40) + (h >= 11 && h <= 14 || h >= 18 && h <= 21 ? 30 : 5),
  cart_adds: h < 9 || h > 22 ? 0 : Math.floor(Math.random() * 20) + (h >= 11 && h <= 14 || h >= 18 && h <= 21 ? 15 : 2),
}));
const demoBehaviourSearches = [
  { query: 'prawn', count: 48 },
  { query: 'crab', count: 31 },
  { query: 'veg', count: 27 },
  { query: 'lobster', count: 19 },
  { query: 'dessert', count: 14 },
  { query: 'kids', count: 11 },
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

// ─── Behaviour View ───────────────────────────────────────────────────────── //
function BehaviourView({ behaviourOverview, behaviourItems, behaviourFunnel, behaviourHeatmap, behaviourSearches, brandColor }: any) {
  const ov       = behaviourOverview;
  const items    = behaviourItems?.items   ?? demoBehaviourItems;
  const funnel   = behaviourFunnel?.stages ?? demoBehaviourFunnel;
  const heatmap  = behaviourHeatmap?.hours ?? demoBehaviourHeatmap;
  const searches = behaviourSearches?.searches ?? demoBehaviourSearches;

  const maxViews    = Math.max(...items.map((i: any) => i.views), 1);
  const maxSearches = Math.max(...searches.map((s: any) => s.count), 1);
  const peakHour    = heatmap.reduce((p: any, c: any) => (c.views > p.views ? c : p), heatmap[0]);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Eye}             label="Total Item Views"    value={String(ov?.total_views    ?? items.reduce((s: number, i: any) => s + i.views, 0))}     color={brandColor} />
        <KpiCard icon={MousePointerClick} label="Cart Adds"         value={String(ov?.total_cart_adds  ?? items.reduce((s: number, i: any) => s + i.cart_adds, 0))} color="#10b981" />
        <KpiCard icon={Target}          label="View→Cart Rate"      value={`${ov?.conversion_rate ?? (items.reduce((s: number, i: any) => s + i.cart_adds, 0) / Math.max(items.reduce((s: number, i: any) => s + i.views, 0), 1) * 100).toFixed(1)}%`} color="#f59e0b" />
        <KpiCard icon={Search}          label="Searches"            value={String(ov?.total_searches ?? searches.reduce((s: number, r: any) => s + r.count, 0))}   color="#8b5cf6" />
      </div>

      {/* Browse-to-order funnel */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="w-4 h-4 text-blue-500" />
            Customer Browse-to-Order Funnel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {funnel.map((s: any, i: number) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-neutral-600">{s.stage}</span>
                  <span className="font-medium">{s.count.toLocaleString()} <span className="text-neutral-400 font-normal">({s.pct}%)</span></span>
                </div>
                <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${s.pct}%` }}
                    transition={{ delay: i * 0.1, duration: 0.6 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: brandColor, opacity: 1 - i * 0.18 }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-neutral-400 mt-3">
            {funnel[3]?.pct ?? 42}% of visitors who open the menu place an order
          </p>
        </CardContent>
      </Card>

      {/* Per-item breakdown */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Eye className="w-4 h-4" style={{ color: brandColor }} />
            Item View vs Cart Conversion
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {items.slice(0, 8).map((item: any, i: number) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-bold text-neutral-400 w-4 shrink-0">{i + 1}</span>
                    <span className="font-medium text-neutral-700 truncate">{item.item_name}</span>
                    <span className="text-xs bg-neutral-100 text-neutral-500 px-1.5 py-0.5 rounded shrink-0">{item.category_name}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-2">
                    <span className="text-neutral-400 text-xs">{item.views} views</span>
                    <span className="text-emerald-600 font-semibold text-xs">{item.conversion_rate}%</span>
                  </div>
                </div>
                {/* Stacked bar: views (light) + cart_adds (brand) */}
                <div className="h-2 bg-neutral-100 rounded-full overflow-hidden relative">
                  <div className="h-full rounded-full absolute left-0" style={{ width: `${(item.views / maxViews) * 100}%`, backgroundColor: `${brandColor}30` }} />
                  <div className="h-full rounded-full absolute left-0" style={{ width: `${(item.cart_adds / maxViews) * 100}%`, backgroundColor: brandColor }} />
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-3">
            <div className="flex items-center gap-1.5 text-xs text-neutral-500">
              <div className="w-3 h-2 rounded-full" style={{ backgroundColor: `${brandColor}30` }} /> Views
            </div>
            <div className="flex items-center gap-1.5 text-xs text-neutral-500">
              <div className="w-3 h-2 rounded-full" style={{ backgroundColor: brandColor }} /> Cart Adds
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Browsing heatmap + searches side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Hourly heatmap */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              Browsing Heatmap
              <span className="text-xs font-normal text-neutral-400 ml-1">Peak: {peakHour?.label}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={heatmap.filter((_: any, i: number) => i >= 7 && i <= 23)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 9 }} interval={2} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="views"     fill={`${brandColor}80`} name="Views"     stackId="a" />
                <Bar dataKey="cart_adds" fill={brandColor}        name="Cart Adds" stackId="a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Search queries */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Search className="w-4 h-4 text-violet-500" />
              Top Search Queries
              <span className="text-xs font-normal text-neutral-400 ml-1">menu gaps</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5">
              {searches.slice(0, 7).map((s: any, i: number) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-neutral-400 w-4">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-neutral-700">"{s.query}"</span>
                      <span className="text-neutral-400">{s.count}×</span>
                    </div>
                    <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-violet-400" style={{ width: `${(s.count / maxSearches) * 100}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {searches.length === 0 && <p className="text-sm text-neutral-400 text-center py-4">No search data yet</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────── //
export default function FranchiseStatsPage() {
  const params = useParams();
  const franchiseSlug = params?.franchise as string;
  const { currentFranchise, branding, myRole } = useFranchise();

  // Derive brand color from franchise branding, fallback to a neutral brand color
  const brandColor = (branding as any)?.colors?.primary ?? '#6366f1';

  // Map the logged-in user's actual role into one of the three stats views
  function deriveStatsRole(r: string | null | undefined): Role {
    if (!r) return 'owner';
    if (r === 'super_admin' || r === 'platform_admin') return 'super_admin';
    if (r === 'branch_manager' || r === 'manager') return 'branch_manager';
    return 'owner'; // owner / admin / franchise_admin
  }

  const [role, setRole] = useState<Role>(() => deriveStatsRole(myRole));

  // Sync when context resolves (e.g. page reload)
  useEffect(() => { if (myRole) setRole(deriveStatsRole(myRole)); }, [myRole]);

  // Only owners/admins/super_admins can switch views; branch managers see only their data
  const canSwitchRoles = ['owner', 'admin', 'franchise_admin', 'super_admin', 'platform_admin'].includes(myRole ?? '');
  const [tab, setTab] = useState<'main' | 'recommendations' | 'behaviour'>('main');
  const [loading, setLoading] = useState(true);

  const [overview, setOverview]   = useState<any>(null);
  const [weekly, setWeekly]       = useState<any>(null);
  const [menuPerf, setMenuPerf]   = useState<any>(null);
  const [funnel, setFunnel]       = useState<any>(null);
  const [hourly, setHourly]       = useState<any>(null);
  const [liveOrders, setLiveOrders] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [locations, setLocations] = useState<any>(null);

  // Behaviour state
  const [bOverview,  setBOverview]  = useState<any>(null);
  const [bItems,     setBItems]     = useState<any>(null);
  const [bFunnel,    setBFunnel]    = useState<any>(null);
  const [bHeatmap,   setBHeatmap]   = useState<any>(null);
  const [bSearches,  setBSearches]  = useState<any>(null);

  const loadData = useCallback(async () => {
    if (!franchiseSlug) return;
    setLoading(true);

    const [ov, wt, mp, fn, hf, lo, rec, locs, bov, bi, bf, bh, bs] = await Promise.all([
      fetchStats(franchiseSlug, 'overview'),
      fetchStats(franchiseSlug, 'weekly-trend'),
      fetchStats(franchiseSlug, 'menu-performance'),
      fetchStats(franchiseSlug, 'order-funnel'),
      fetchStats(franchiseSlug, 'hourly-flow'),
      fetchStats(franchiseSlug, 'live-orders'),
      fetchStats(franchiseSlug, 'recommendations'),
      fetchStats(franchiseSlug, 'locations'),
      fetchBehaviour(franchiseSlug, 'overview'),
      fetchBehaviour(franchiseSlug, 'items'),
      fetchBehaviour(franchiseSlug, 'funnel'),
      fetchBehaviour(franchiseSlug, 'heatmap'),
      fetchBehaviour(franchiseSlug, 'searches'),
    ]);

    setOverview(ov);    setWeekly(wt);  setMenuPerf(mp); setFunnel(fn);
    setHourly(hf);      setLiveOrders(lo); setRecommendations(rec); setLocations(locs);
    setBOverview(bov);  setBItems(bi);  setBFunnel(bf);  setBHeatmap(bh); setBSearches(bs);
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

      {/* Role switcher — only shown to owners / admins / super_admins */}
      {canSwitchRoles && (
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
      )}

      {/* Tab bar (Owner only) */}
      {role === 'owner' && (
        <div className="flex gap-1 bg-neutral-100 p-1 rounded-xl w-fit flex-wrap">
          {[
            { id: 'main',            label: 'Menu & Orders' },
            { id: 'behaviour',       label: 'User Behaviour' },
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
          {role === 'owner' && tab === 'behaviour' && (
            <BehaviourView behaviourOverview={bOverview} behaviourItems={bItems} behaviourFunnel={bFunnel} behaviourHeatmap={bHeatmap} behaviourSearches={bSearches} brandColor={brandColor} />
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
