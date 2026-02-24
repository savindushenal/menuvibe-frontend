'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock, Check, ChefHat, CheckCircle2, Truck, XCircle,
  Bell, BellOff, Wifi, WifiOff, RefreshCw, LogOut, Volume2, VolumeX,
} from 'lucide-react';
import Pusher from 'pusher-js';

const API = 'https://api.menuvire.com/api';
const PUSHER_KEY = 'f61e00b9dc8be69dc054';
const PUSHER_CLUSTER = 'ap2';

type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'completed' | 'cancelled';

interface OrderItem {
  id: number; name: string; quantity: number; unit_price: number;
  selectedVariation?: { name: string; price: number } | null;
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
              {item.selectedVariation?.name && (
                <span className="block text-xs text-gray-400 ml-4">{item.selectedVariation.name}</span>
              )}
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
  const router = useRouter();
  const locationId = params?.locationId as string;

  const [token, setToken] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [notifGranted, setNotifGranted] = useState(false);
  const [activeTab, setActiveTab] = useState<'live' | 'done'>('live');
  // Persistent alarm state — new orders queue until acknowledged
  const [alertOrders, setAlertOrders] = useState<Order[]>([]);
  const [alarmMuted, setAlarmMuted] = useState(false);
  const alarmMutedRef = useRef(false);
  const pusherRef = useRef<Pusher | null>(null);
  const notifBell = useRef<HTMLAudioElement | null>(null);
  const alarmRef = useRef<HTMLAudioElement | null>(null);
  // Web Audio API — unlocked on first user interaction, works on mobile PWA
  const audioCtxRef = useRef<AudioContext | null>(null);
  const alarmIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioUnlockedRef = useRef(false);

  // Keep muted ref in sync with state
  useEffect(() => { alarmMutedRef.current = alarmMuted; }, [alarmMuted]);

  // Unlock AudioContext on first touch/click — required on iOS/Android
  useEffect(() => {
    const unlock = () => {
      if (audioUnlockedRef.current) return;
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        // Play a silent buffer to fully unlock
        const buf = ctx.createBuffer(1, 1, 22050);
        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.connect(ctx.destination);
        src.start(0);
        audioCtxRef.current = ctx;
        audioUnlockedRef.current = true;
      } catch (e) {}
    };
    window.addEventListener('touchstart', unlock, { once: true });
    window.addEventListener('click', unlock, { once: true });
    return () => {
      window.removeEventListener('touchstart', unlock);
      window.removeEventListener('click', unlock);
    };
  }, []);

  // Synthesize a double-beep alarm pattern using Web Audio API (works on all devices)
  const playBeepPattern = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    // Two sharp beeps: 880Hz then 1100Hz
    [[0, 880], [0.22, 1100]].forEach(([offset, freq]) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t = ctx.currentTime + offset;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.7, t + 0.01);
      gain.gain.setValueAtTime(0.7, t + 0.14);
      gain.gain.linearRampToValueAtTime(0, t + 0.18);
      osc.start(t);
      osc.stop(t + 0.2);
    });
  }, []);

  const startAlarm = useCallback(() => {
    if (alarmMutedRef.current) return;

    // 1. Try HTML Audio first (works on desktop after interaction)
    try {
      if (!alarmRef.current) {
        alarmRef.current = new Audio('/sounds/order-received.mp3');
        alarmRef.current.loop = true;
        alarmRef.current.volume = 0.85;
      }
      alarmRef.current.currentTime = 0;
      alarmRef.current.play().catch(() => {
        // Audio file blocked (mobile autoplay policy) — fall back to Web Audio beeps
        if (!alarmMutedRef.current) {
          playBeepPattern();
          if (alarmIntervalRef.current) clearInterval(alarmIntervalRef.current);
          alarmIntervalRef.current = setInterval(() => {
            if (!alarmMutedRef.current) playBeepPattern();
          }, 1500);
        }
      });
    } catch (e) {
      // No Audio API at all — use Web Audio only
      playBeepPattern();
      if (alarmIntervalRef.current) clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = setInterval(() => {
        if (!alarmMutedRef.current) playBeepPattern();
      }, 1500);
    }

    // 2. Always also schedule Web Audio beeps as redundant layer on mobile
    if (audioUnlockedRef.current) {
      playBeepPattern();
      if (alarmIntervalRef.current) clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = setInterval(() => {
        if (!alarmMutedRef.current) playBeepPattern();
      }, 1500);
    }
  }, [playBeepPattern]);

  const stopAlarm = useCallback(() => {
    try { alarmRef.current?.pause(); } catch (e) {}
    if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
    }
  }, []);

  const acknowledgeAlerts = useCallback(() => {
    setAlertOrders([]);
    stopAlarm();
  }, [stopAlarm]);

  // Clean up alarm interval and AudioContext on unmount
  useEffect(() => {
    return () => {
      if (alarmIntervalRef.current) clearInterval(alarmIntervalRef.current);
      try { audioCtxRef.current?.close(); } catch (e) {}
    };
  }, []);

  // Load auth token from sessionStorage (pos login) or localStorage (dashboard login)
  useEffect(() => {
    const t = sessionStorage.getItem('pos_token') || localStorage.getItem('auth_token');
    if (!t) {
      router.replace('/pos/login');
      return;
    }
    setToken(t);
    try {
      const u = JSON.parse(sessionStorage.getItem('pos_user') || '{}');
      setUserName(u.name || u.email || '');
    } catch {}
  }, [router]);

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

  const handleLogout = () => {
    sessionStorage.removeItem('pos_token');
    sessionStorage.removeItem('pos_user');
    localStorage.removeItem('auth_token');
    router.replace('/pos/login');
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
      // Add to alert queue — looping alarm until acknowledged
      setAlertOrders(prev => prev.find(o => o.id === data.order.id) ? prev : [...prev, data.order]);
      startAlarm();
      // OS notification (background tab)
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
  }, [locationId, startAlarm]);

  const handleStatusUpdate = (id: number, newStatus: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus, is_active: ['pending','preparing','ready'].includes(newStatus) } : o));
  };

  const activeOrders = orders.filter(o => o.is_active);
  const doneOrders   = orders.filter(o => !o.is_active);

  // Split active orders into kanban columns
  const pending   = activeOrders.filter(o => o.status === 'pending');
  const preparing = activeOrders.filter(o => o.status === 'preparing');
  const ready     = activeOrders.filter(o => o.status === 'ready');

  // While token is being loaded, show a blank screen (redirect happens in useEffect)
  if (!token) {
    return <div className="min-h-screen bg-[#0F0F0F]" />;
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">

      {/* ===== PERSISTENT ALARM MODAL ===== */}
      <AnimatePresence>
        {alertOrders.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex flex-col items-center justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.92)' }}
          >
            {/* Pulsing ring */}
            <motion.div
              animate={{ scale: [1, 1.08, 1], opacity: [0.6, 1, 0.6] }}
              transition={{ repeat: Infinity, duration: 1.2 }}
              className="absolute w-72 h-72 rounded-full border-4 border-[#F26522] pointer-events-none"
            />

            <div className="relative z-10 flex flex-col items-center px-6 w-full max-w-lg">
              {/* Header */}
              <motion.div
                animate={{ scale: [1, 1.04, 1] }}
                transition={{ repeat: Infinity, duration: 0.9 }}
                className="flex items-center gap-3 mb-6"
              >
                <Bell className="w-10 h-10 text-[#F26522]" />
                <span className="text-4xl font-black text-white tracking-wide">NEW ORDER{alertOrders.length > 1 ? 'S' : ''}!</span>
              </motion.div>

              {/* Order cards */}
              <div className="w-full space-y-3 max-h-[55vh] overflow-y-auto mb-6">
                {alertOrders.map(order => (
                  <div key={order.id} className="bg-[#1A1A1A] rounded-2xl p-4 border-2 border-[#F26522]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-black text-xl text-white">{order.order_number}</span>
                      {order.table_identifier && (
                        <span className="px-3 py-1 bg-[#F26522] rounded-full text-xs font-bold text-white">
                          {order.table_identifier}
                        </span>
                      )}
                    </div>
                    <div className="space-y-0.5">
                      {(order.items || []).map((item, i) => (
                        <p key={i} className="text-sm text-gray-300">
                          <span className="font-bold text-white">{item.quantity}×</span> {item.name}
                          {item.selectedVariation?.name && (
                            <span className="text-gray-500 ml-1">({item.selectedVariation.name})</span>
                          )}
                        </p>
                      ))}
                    </div>
                    <p className="mt-2 font-bold text-[#F26522]">
                      {order.currency || 'LKR'} {parseFloat(String(order.total)).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => {
                    const next = !alarmMuted;
                    setAlarmMuted(next);
                    alarmMutedRef.current = next;
                    if (next) stopAlarm(); else startAlarm();
                  }}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 transition-colors text-sm font-semibold text-gray-300"
                >
                  {alarmMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  {alarmMuted ? 'Unmute' : 'Mute'}
                </button>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={acknowledgeAlerts}
                  className="flex-1 py-4 rounded-xl bg-[#F26522] hover:bg-[#d4551a] text-white font-black text-xl transition-colors"
                >
                  ✅ ACKNOWLEDGE ({alertOrders.length})
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Top bar */}
      <header className="bg-[#1A1A1A] border-b border-white/10 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#F26522] rounded-lg flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none">POS — Kitchen View</h1>
              <p className="text-xs text-gray-400">{userName ? `${userName} · ` : ''}Branch #{locationId}</p>
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

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-red-900/40 transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4 text-gray-400" />
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
