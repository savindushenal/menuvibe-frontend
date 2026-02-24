'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Clock, ChefHat, CheckCircle2, Truck, X } from 'lucide-react';
import type { OrderSummary } from '@/hooks/useMenuSession';

const STEPS = [
  { key: 'pending',   label: 'Received',  icon: Clock },
  { key: 'preparing', label: 'Preparing', icon: ChefHat },
  { key: 'ready',     label: 'Ready!',    icon: CheckCircle2 },
  { key: 'delivered', label: 'Delivered', icon: Truck },
];

const STEP_INDEX: Record<string, number> = {
  pending: 0, preparing: 1, ready: 2, delivered: 3, completed: 3, cancelled: -1,
};

function OrderRow({ order }: { order: OrderSummary }) {
  const stepIdx = STEP_INDEX[order.status] ?? 0;
  const isCancelled = order.status === 'cancelled';

  return (
    <div className="py-3 border-t border-white/10 first:border-t-0">
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-sm text-white">
          #{order.order_number}
          {order.table_identifier && (
            <span className="ml-2 text-xs text-gray-400">Table {order.table_identifier}</span>
          )}
        </span>
        <span className="text-xs font-medium text-gray-400">
          {order.currency} {parseFloat(String(order.total)).toFixed(2)}
        </span>
      </div>

      {isCancelled ? (
        <p className="text-xs text-red-400">Order cancelled</p>
      ) : (
        <div className="flex items-center gap-0.5">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const done = i <= stepIdx;
            const active = i === stepIdx;
            return (
              <div key={s.key} className="flex items-center gap-0.5 flex-1 last:flex-initial">
                <div className={`flex flex-col items-center transition-all ${active ? 'scale-110' : ''}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${done ? 'bg-emerald-500' : 'bg-white/10'}`}>
                    <Icon className={`w-3.5 h-3.5 ${done ? 'text-white' : 'text-gray-500'}`} />
                  </div>
                  <span className={`text-[9px] mt-0.5 ${active ? 'text-emerald-400 font-bold' : done ? 'text-emerald-500' : 'text-gray-600'}`}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-0.5 flex-1 rounded-full mb-3 transition-colors ${i < stepIdx ? 'bg-emerald-500' : 'bg-white/10'}`} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface OrderTrackerProps {
  orders: OrderSummary[];
}

export function OrderTracker({ orders }: OrderTrackerProps) {
  const [expanded, setExpanded] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  const activeOrders = orders.filter((o) => o.is_active);
  const recentDone = orders.filter((o) => !o.is_active).slice(0, 1);
  const visible = [...activeOrders, ...recentDone];

  if (dismissed || visible.length === 0) return null;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="fixed bottom-4 left-3 right-3 z-[60] max-w-lg mx-auto"
    >
      <div className="bg-[#1A1A1A] rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#111111]">
          <div className="flex items-center gap-2">
            {activeOrders.length > 0 && (
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
            <span className="text-sm font-bold text-white">
              {activeOrders.length > 0
                ? `${activeOrders.length} order${activeOrders.length > 1 ? 's' : ''} in progress`
                : 'Order complete'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setExpanded(!expanded)} className="p-1.5 text-gray-400 hover:text-white transition-colors">
              {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
            <button onClick={() => setDismissed(true)} className="p-1.5 text-gray-400 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Orders */}
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              key="body"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-3">
                {visible.map((order) => (
                  <OrderRow key={order.id} order={order} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
