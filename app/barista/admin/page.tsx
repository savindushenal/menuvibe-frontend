'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellOff, Clock, CheckCircle, ChefHat, Coffee, RefreshCw } from 'lucide-react';
import BaristaLogo from '../demo/components/BaristaLogo';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  customizations?: string[];
}

interface Order {
  id: string;
  order_id: string;
  items: OrderItem[];
  table_no: string;
  floor: string;
  status: 'pending' | 'preparing' | 'ready' | 'completed';
  total: number;
  created_at: string;
}

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const playNotificationSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const audio = new Audio('/sounds/notification.mp3');
      audio.volume = 0.7;
      audio.play().catch(() => console.log('Audio blocked'));
    } catch (e) {
      console.log('Audio not available');
    }
  }, [soundEnabled]);

  const fetchOrders = useCallback(async () => {
    try {
      const response = await fetch('/api/barista/orders');
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.log('Failed to fetch orders:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();

    // Poll for new orders every 2 seconds (fallback if Supabase Realtime not available)
    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/barista/orders');
        if (response.ok) {
          const data = await response.json();
          const newOrders = data.orders || [];
          
          // Check for new orders
          if (newOrders.length > orders.length) {
            playNotificationSound();
          }
          
          setOrders(newOrders);
        }
      } catch (error) {
        console.log('Polling error:', error);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [fetchOrders, orders.length, playNotificationSound]);

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      await fetch('/api/barista/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, status }),
      });
      
      setOrders(prev => 
        prev.map(order => 
          order.order_id === orderId ? { ...order, status } : order
        )
      );
    } catch (error) {
      console.log('Failed to update order:', error);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} mins ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
  };

  const getStatusConfig = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return { 
          label: 'NEW ORDER', 
          color: 'bg-red-500', 
          textColor: 'text-red-500',
          icon: Bell 
        };
      case 'preparing':
        return { 
          label: 'PREPARING', 
          color: 'bg-yellow-500', 
          textColor: 'text-yellow-600',
          icon: ChefHat 
        };
      case 'ready':
        return { 
          label: 'READY', 
          color: 'bg-green-500', 
          textColor: 'text-green-600',
          icon: CheckCircle 
        };
      case 'completed':
        return { 
          label: 'COMPLETED', 
          color: 'bg-gray-400', 
          textColor: 'text-gray-500',
          icon: CheckCircle 
        };
      default:
        return { 
          label: 'UNKNOWN', 
          color: 'bg-gray-400', 
          textColor: 'text-gray-500',
          icon: Clock 
        };
    }
  };

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const preparingOrders = orders.filter(o => o.status === 'preparing');
  const readyOrders = orders.filter(o => o.status === 'ready');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-4">
              <BaristaLogo variant="dark" size="md" />
              <span className="text-gray-300 text-xl md:text-2xl font-light hidden sm:inline">|</span>
              <h1 className="text-base md:text-xl font-semibold text-barista-dark hidden sm:block">Kitchen Dashboard</h1>
            </div>
            
            <div className="flex items-center gap-2 md:gap-4">
              <button
                onClick={fetchOrders}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                title="Refresh orders"
              >
                <RefreshCw className="w-5 h-5 text-gray-600" />
              </button>
              
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2 rounded-full transition-all ${
                  soundEnabled 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {soundEnabled ? (
                  <>
                    <Bell className="w-4 h-4" />
                    <span className="text-sm font-medium hidden sm:inline">Sound On</span>
                  </>
                ) : (
                  <>
                    <BellOff className="w-4 h-4" />
                    <span className="text-sm font-medium hidden sm:inline">Sound Off</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3">
          <div className="flex items-center gap-4 md:gap-8 overflow-x-auto">
            <div className="flex items-center gap-2 whitespace-nowrap">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm font-medium">{pendingOrders.length} New</span>
            </div>
            <div className="flex items-center gap-2 whitespace-nowrap">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="text-sm font-medium">{preparingOrders.length} Preparing</span>
            </div>
            <div className="flex items-center gap-2 whitespace-nowrap">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-sm font-medium">{readyOrders.length} Ready</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <h2 className="text-xl md:text-2xl font-bold text-barista-dark mb-4 md:mb-6">Active Orders</h2>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-barista-orange" />
          </div>
        ) : orders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <Coffee className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No orders yet</h3>
            <p className="text-gray-400">Orders will appear here in real-time</p>
            <p className="text-sm text-gray-400 mt-4">
              Open <code className="bg-gray-100 px-2 py-1 rounded">/barista/demo</code> on your phone to place an order
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <AnimatePresence>
              {orders
                .filter(o => o.status !== 'completed')
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .map((order) => {
                  const statusConfig = getStatusConfig(order.status);
                  const StatusIcon = statusConfig.icon;
                  
                  return (
                    <motion.div
                      key={order.order_id}
                      layout
                      initial={{ opacity: 0, y: -20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, x: 100 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                      className={`bg-white rounded-2xl shadow-lg overflow-hidden border-l-4 ${
                        order.status === 'pending' 
                          ? 'border-l-red-500 ring-2 ring-red-100' 
                          : order.status === 'preparing'
                          ? 'border-l-yellow-500'
                          : 'border-l-green-500'
                      }`}
                    >
                      {/* Order Header */}
                      <div className="px-4 md:px-6 py-3 md:py-4 bg-gray-50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${statusConfig.color}`}>
                            <StatusIcon className="w-4 h-4 text-white" />
                          </div>
                          <span className={`text-sm font-bold ${statusConfig.textColor}`}>
                            {statusConfig.label}
                          </span>
                          {order.status === 'pending' && (
                            <span className="relative flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-gray-500">
                          {getTimeAgo(order.created_at)}
                        </span>
                      </div>
                      
                      {/* Order Content */}
                      <div className="px-4 md:px-6 py-4 md:py-5">
                        <div className="flex items-center gap-2 mb-4">
                          <span className="text-lg font-bold text-barista-dark">
                            Table {order.table_no}
                          </span>
                          <span className="text-gray-400">•</span>
                          <span className="text-gray-500">{order.floor}</span>
                        </div>
                        
                        {/* Items */}
                        <div className="space-y-2 mb-4">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">
                                  {item.name.toLowerCase().includes('cappuccino') || item.name.toLowerCase().includes('latte') || item.name.toLowerCase().includes('coffee') 
                                    ? '☕' 
                                    : item.name.toLowerCase().includes('brownie') || item.name.toLowerCase().includes('cake')
                                    ? '🍫'
                                    : '🥐'
                                  }
                                </span>
                                <span className="font-medium">
                                  {item.quantity}× {item.name}
                                </span>
                              </div>
                              <span className="text-gray-500">
                                LKR {(item.price * item.quantity).toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                        
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <span className="font-bold text-lg">Total</span>
                          <span className="font-bold text-lg text-barista-orange">
                            LKR {order.total.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="px-4 md:px-6 py-3 md:py-4 bg-gray-50 flex gap-3">
                        {order.status === 'pending' && (
                          <motion.button
                            onClick={() => updateOrderStatus(order.order_id, 'preparing')}
                            className="flex-1 py-3 bg-yellow-500 text-white rounded-xl font-semibold hover:bg-yellow-600 transition-colors"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            Start Preparing
                          </motion.button>
                        )}
                        {order.status === 'preparing' && (
                          <motion.button
                            onClick={() => updateOrderStatus(order.order_id, 'ready')}
                            className="flex-1 py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition-colors"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            Mark Ready
                          </motion.button>
                        )}
                        {order.status === 'ready' && (
                          <motion.button
                            onClick={() => updateOrderStatus(order.order_id, 'completed')}
                            className="flex-1 py-3 bg-gray-600 text-white rounded-xl font-semibold hover:bg-gray-700 transition-colors"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            Complete Order
                          </motion.button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}
