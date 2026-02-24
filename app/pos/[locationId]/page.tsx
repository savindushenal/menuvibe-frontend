'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock, Check, ChefHat, CheckCircle2, Truck, XCircle,
  Bell, BellOff, Wifi, WifiOff, RefreshCw, LogOut,
} from 'lucide-react';
import Pusher from 'pusher-js';

const API = 'https://api.menuvire.com/api';
const PUSHER_KEY = 'f61e00b9dc8be69dc054';
const PUSHER_CLUSTER = 'ap2';

type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'completed' | 'cancelled';

interface OrderItem {
  id: number; name: string; quantity: number; unit_price: number;
}

interface Order {
  id: number;
  order_number: string;
  status: OrderStatus;
  items: OrderItem[];
  total: number | string;
  currency: string;
  table_identifier: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  confirmed_at: string | null;
  preparing_at: string | null;
  ready_at: string | null;
  delivered_at: string | null;
}

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string; border: string; icon: any }> = {
  pending:   { label: 'New Order',  color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A', icon: Clock },
  preparing: { label: 'Preparing',  color: '#F26522', bg: '#FFF5EF', border: '#FDBA9B', icon: ChefHat },
  ready:     { label: 'Ready',      color: '#10B981', bg: '#ECFDF5', border: '#6EE7B7', icon: CheckCircle2 },
  delivered: { label: 'Delivered',  color: '#6B7280', bg: '#F9FAFB', border: '#E5E7EB', icon: Truck },
  completed: { label: 'Completed',  color: '#6B7280', bg: '#F9FAFB', border: '#E5E7EB', icon: Check },
  cancelled: { label: 'Cancelled',  color: '#EF4444', bg: '#FEF2F2', border: '#FECACA', icon: XCircle },
};

const NEXT_STATUS: Record<OrderStatus, OrderStatus | null> = {
  pending:   'preparing',
  preparing: 'ready',
  ready:     'delivered',
  delivered: 'completed',
  completed:  null,
  cancelled:  null,
};

const NEXT_STATUS_LABEL: Record<OrderStatus, string> = {
  pending:   '👨‍🍳 Start Preparing',
  preparing: '✅ Mark Ready',
  ready:     '🚚 Mark Delivered',
  delivered: '✔ Complete',
  completed: '',
  cancelled: '',
};

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function OrderCard({ order, token, locationId, onStatusUpdate }: {
  order: Order; token: string; locationId: string;
  onStatusUpdate: (id: number, newStatus: OrderStatus) => void;
}) {
  const [updating, setUpdating] = useState(false);
  const cfg = STATUS_CONFIG[order.status];
  const Icon = cfg.icon;
  const nextStatus = NEXT_STATUS[order.status];
  const total = typeof order.total === 'string' ? parseFloat(order.total) : order.total;

  const handleAdvance = async () => {
    if (!nextStatus || updating) return;
    setUpdating(true);
    try {
      const res = await fetch(`${API}/pos/${locationId}/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: nextStatus }),
      });
      const result = await res.json();
      if (result.success) {
        onStatusUpdate(order.id, nextStatus);
      }
    } catch (e) {}
    setUpdating(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="rounded-2xl border-2 overflow-hidden shadow-sm"
      style={{ backgroundColor: cfg.bg, borderColor: cfg.border }}
    >
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between" style={{ backgroundColor: cfg.color + '15' }}>
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5" style={{ color: cfg.color }} />
          <span className="font-bold text-lg text-gray-900">{order.order_number}</span>
        </div>
        <div className="flex items-center gap-2">
          {order.table_identifier && (
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-white/70 text-gray-700">
              {order.table_identifier}
            </span>
          )}
          <span className="text-xs text-gray-500">{timeAgo(order.created_at)}</span>
        </div>
      </div>

      {/* Items */}
      <div className="px-4 py-3 space-y-1">
        {order.items?.map((item, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <span className="text-gray-800">
              <span className="font-bold text-gray-900">{item.quantity}×</span> {item.name}
            </span>
            <span className="text-gray-500">{order.currency || 'LKR'} {((item.unit_price ?? 0) * item.quantity).toFixed(2)}</span>
          </div>
        ))}
      </div>

      {/* Notes */}
      {order.notes && (
        <div className="px-4 pb-2 text-xs text-amber-700 bg-amber-50 border-t border-amber-100 py-2">
          📝 {order.notes}
        </div>
      )}

      {/* Footer */}
      <div className="px-4 pb-4 flex items-center justify-between">
        <span className="font-bold text-base" style={{ color: cfg.color }}>
          {order.currency || 'LKR'} {total.toFixed(2)}
        </span>
        {nextStatus && (
          <button
            onClick={handleAdvance}
            disabled={updating}
            className="px-4 py-2 rounded-xl text-sm font-bold text-white transition-opacity disabled:opacity-50"
            style={{ backgroundColor: cfg.color }}
          >
            {updating ? <RefreshCw className="w-4 h-4 animate-spin" /> : NEXT_STATUS_LABEL[order.status]}
          </button>
        )}
      </div>
    </motion.div>
  );
}

export default function PosPage() {
  const params = useParams();
  const locationId = params?.locationId as string;

  const [token, setToken] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [notifGranted, setNotifGranted] = useState(false);
  const [activeTab, setActiveTab] = useState<'live' | 'done'>('live');
  const pusherRef = useRef<Pusher | null>(null);
  const notifBell = useRef<HTMLAudioElement | null>(null);

  // Load auth token
  useEffect(() => {
    const t = localStorage.getItem('auth_token');
    if (t) setToken(t);
  }, []);

  // Register service worker + request notification permission
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/pos-sw.js').then(() => {
      console.log('POS service worker registered');
    });
    if (Notification.permission === 'granted') {
      setNotifGranted(true);
    }
  }, []);

  const requestNotificationPermission = async () => {
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      setNotifGranted(true);
      subscribeWebPush();
    }
  };

  const subscribeWebPush = useCallback(async () => {
    if (!token || !locationId) return;
    try {
      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      const sub = existing || await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: 'BEb74NO3VfDD97myo96akSlsdBTmJzItzWKQ4a614BztuI5ZL0iLlSnFszwAjOMFNDsw5fERBkitAN2qSg2djMo',
      });
      await fetch(`${API}/pos/${locationId}/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          subscription: sub.toJSON(),
          device_label: navigator.userAgent.substring(0, 50),
        }),
      });
    } catch (e) {
      console.error('Web Push subscribe error', e);
    }
  }, [token, locationId]);

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    if (!token || !locationId) return;
    try {
      const res = await fetch(`${API}/pos/${locationId}/orders`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const result = await res.json();
      if (result.success) {
        setOrders([...(result.data.active || []), ...(result.data.done || [])]);
      }
    } catch (e) {}
    setLoading(false);
  }, [token, locationId]);

  useEffect(() => {
    if (token) {
      fetchOrders();
      if (notifGranted) subscribeWebPush();
    }
  }, [token, fetchOrders, notifGranted, subscribeWebPush]);

  // Connect Pusher for real-time updates
  useEffect(() => {
    if (!locationId) return;

    const pusher = new Pusher(PUSHER_KEY, {
      cluster: PUSHER_CLUSTER,
    });
    pusherRef.current = pusher;

    pusher.connection.bind('connected', () => setConnected(true));
    pusher.connection.bind('disconnected', () => setConnected(false));

    const channel = pusher.subscribe(`pos.${locationId}`);

    channel.bind('order.placed', (data: { order: Order }) => {
      setOrders(prev => {
        if (prev.find(o => o.id === data.order.id)) return prev;
        return [data.order, ...prev];
      });
      // Play sound
      try {
        if (!notifBell.current) notifBell.current = new Audio('/sounds/add-to-cart.mp3');
        notifBell.current.play().catch(() => {});
      } catch (e) {}
      // Show in-page notification
      if (Notification.permission === 'granted') {
        new Notification(`🍽 New Order — ${data.order.order_number}`, {
          body: `Table ${data.order.table_identifier || '?'} · ${data.order.items?.length} item(s)`,
          icon: '/menuvibe-logo.png',
        });
      }
    });

    channel.bind('order.status_changed', (data: { order: Order }) => {
      setOrders(prev => prev.map(o => o.id === data.order.id ? { ...o, ...data.order } : o));
    });

    return () => {
      pusher.unsubscribe(`pos.${locationId}`);
      pusher.disconnect();
    };
  }, [locationId]);

  const handleStatusUpdate = (id: number, newStatus: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus, is_active: ['pending','preparing','ready'].includes(newStatus) } : o));
  };

  const activeOrders = orders.filter(o => o.is_active);
  const doneOrders   = orders.filter(o => !o.is_active);

  // Split active orders into kanban columns
  const pending   = activeOrders.filter(o => o.status === 'pending');
  const preparing = activeOrders.filter(o => o.status === 'preparing');
  const ready     = activeOrders.filter(o => o.status === 'ready');

  if (!token) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center">
        <div className="text-center text-white">
          <p className="text-lg mb-4">Please log in to access POS</p>
          <a href="/auth/login" className="px-6 py-3 bg-[#F26522] rounded-xl font-bold">Log In</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      {/* Top bar */}
      <header className="bg-[#1A1A1A] border-b border-white/10 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#F26522] rounded-lg flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none">POS — Kitchen View</h1>
              <p className="text-xs text-gray-400">Location #{locationId}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Connection status */}
            <div className="flex items-center gap-1.5">
              {connected ? (
                <><Wifi className="w-4 h-4 text-green-400" /><span className="text-xs text-green-400">Live</span></>
              ) : (
                <><WifiOff className="w-4 h-4 text-red-400" /><span className="text-xs text-red-400">Offline</span></>
              )}
            </div>

            {/* Notification permission */}
            <button
              onClick={notifGranted ? undefined : requestNotificationPermission}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{ backgroundColor: notifGranted ? '#10B98122' : '#F2652222', color: notifGranted ? '#10B981' : '#F26522' }}
            >
              {notifGranted ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
              {notifGranted ? 'Notifs On' : 'Enable Notifs'}
            </button>

            {/* Refresh */}
            <button
              onClick={fetchOrders}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      </header>

      {/* Stats bar */}
      <div className="bg-[#1A1A1A] border-b border-white/5 px-4 py-2">
        <div className="max-w-7xl mx-auto flex gap-6">
          {[
            { label: 'New',      count: pending.length,   color: '#F59E0B' },
            { label: 'Preparing',count: preparing.length, color: '#F26522' },
            { label: 'Ready',    count: ready.length,     color: '#10B981' },
            { label: 'Done today', count: doneOrders.length, color: '#6B7280' },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-2">
              <span className="text-2xl font-bold" style={{ color: s.color }}>{s.count}</span>
              <span className="text-xs text-gray-500">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-white/10 px-4">
        <div className="max-w-7xl mx-auto flex gap-0">
          {(['live', 'done'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-5 py-3 text-sm font-semibold border-b-2 transition-colors capitalize"
              style={{
                borderColor: activeTab === tab ? '#F26522' : 'transparent',
                color: activeTab === tab ? '#F26522' : '#9CA3AF',
              }}
            >
              {tab === 'live' ? `Live (${activeOrders.length})` : `Done (${doneOrders.length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-7xl mx-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 text-[#F26522] animate-spin" />
          </div>
        ) : activeTab === 'live' ? (
          activeOrders.length === 0 ? (
            <div className="text-center py-20">
              <ChefHat className="w-16 h-16 text-gray-700 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No active orders</p>
              <p className="text-gray-600 text-sm mt-1">Waiting for new orders…</p>
            </div>
          ) : (
            /* Kanban: 3 columns on desktop, stacked on mobile */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { title: '🆕 New Orders',   orders: pending,   color: '#F59E0B' },
                { title: '👨‍🍳 Preparing',    orders: preparing, color: '#F26522' },
                { title: '✅ Ready',         orders: ready,     color: '#10B981' },
              ].map(col => (
                <div key={col.title}>
                  <div className="flex items-center gap-2 mb-3">
                    <h2 className="font-bold text-sm" style={{ color: col.color }}>{col.title}</h2>
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-bold"
                      style={{ backgroundColor: col.color + '22', color: col.color }}
                    >
                      {col.orders.length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    <AnimatePresence>
                      {col.orders.map(order => (
                        <OrderCard
                          key={order.id}
                          order={order}
                          token={token!}
                          locationId={locationId}
                          onStatusUpdate={handleStatusUpdate}
                        />
                      ))}
                    </AnimatePresence>
                    {col.orders.length === 0 && (
                      <div
                        className="rounded-2xl border-2 border-dashed p-6 text-center"
                        style={{ borderColor: col.color + '44' }}
                      >
                        <p className="text-xs" style={{ color: col.color + 'AA' }}>Empty</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* Done orders — flat list */
          doneOrders.length === 0 ? (
            <div className="text-center py-20">
              <Check className="w-16 h-16 text-gray-700 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No completed orders yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {doneOrders.map(order => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    token={token!}
                    locationId={locationId}
                    onStatusUpdate={handleStatusUpdate}
                  />
                ))}
              </AnimatePresence>
            </div>
          )
        )}
      </main>
    </div>
  );
}
