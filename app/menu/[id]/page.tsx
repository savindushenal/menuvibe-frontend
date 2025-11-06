'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  X, 
  Phone, 
  Mail, 
  User,
  MapPin,
  Clock,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
}

interface OrderForm {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  notes: string;
}

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  category_id: number;
  category_name: string;
  category_bg_color: string;
  image_url?: string;
  is_available: boolean;
  is_featured: boolean;
  dietary_info?: string[];
  card_color?: string;
  heading_color?: string;
  text_color?: string;
}

interface MenuCategory {
  id: number;
  name: string;
  description?: string;
  background_color: string;
  text_color?: string;
  heading_color?: string;
  sort_order: number;
}

interface Menu {
  id: number;
  menu_name: string;
  restaurant_name: string;
  description: string;
  style: string;
  currency: string;
  logo_url?: string;
}

// Menu Design color schemes (matching dashboard)
const menuDesigns: Record<string, { bg: string; text: string; accent: string; gradient: string }> = {
  modern: { 
    bg: '#F8FAFC', 
    text: '#1E293B', 
    accent: '#3B82F6',
    gradient: 'from-slate-50 via-blue-50 to-cyan-50'
  },
  classic: { 
    bg: '#FFFBEB', 
    text: '#78350F', 
    accent: '#D97706',
    gradient: 'from-amber-50 via-yellow-50 to-orange-50'
  },
  minimal: { 
    bg: '#FFFFFF', 
    text: '#000000', 
    accent: '#6B7280',
    gradient: 'from-gray-50 via-white to-gray-50'
  },
  elegant: { 
    bg: '#FAF5FF', 
    text: '#581C87', 
    accent: '#A855F7',
    gradient: 'from-purple-50 via-pink-50 to-fuchsia-50'
  },
  rustic: { 
    bg: '#FFF7ED', 
    text: '#7C2D12', 
    accent: '#EA580C',
    gradient: 'from-orange-50 via-amber-50 to-yellow-50'
  },
  bold: { 
    bg: '#FEF2F2', 
    text: '#7F1D1D', 
    accent: '#DC2626',
    gradient: 'from-red-50 via-rose-50 to-pink-50'
  }
};

export default function PublicMenuPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const menuId = params.id as string;
  const tableNumber = searchParams.get('table');

  const [menu, setMenu] = useState<Menu | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [cart, setCart] = useState<{[key: number]: number}>({});
  const [showCart, setShowCart] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [orderingEnabled, setOrderingEnabled] = useState(false);
  const [orderForm, setOrderForm] = useState<OrderForm>({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    notes: ''
  });
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [sessionId] = useState(() => 
    typeof window !== 'undefined' ? `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` : null
  );

  useEffect(() => {
    loadMenu();
    // Track menu view
    if (menuId) {
      trackEvent('menu_view', { menu_id: parseInt(menuId), table_number: tableNumber });
    }
  }, [menuId]);

  // Track analytics events
  const trackEvent = async (eventType: string, data: any) => {
    try {
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: eventType,
          session_id: sessionId,
          ...data
        })
      });
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  };

  const loadMenu = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch menu data from Next.js public API route (no auth required)
      const response = await fetch(`/api/public/menu/${menuId}`);
      
      if (!response.ok) {
        throw new Error('Menu not found');
      }

      const data = await response.json();
      
      if (data.success) {
        setMenu(data.data.menu);
        setCategories(data.data.categories || []);
        setMenuItems(data.data.items || []);
        
        // Check if ordering is enabled based on subscription - this will be determined by the API
        // For now, assume ordering is available for all menus. The API will handle restrictions
        setOrderingEnabled(true);
      } else {
        throw new Error(data.message || 'Failed to load menu');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load menu');
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = selectedCategory
    ? menuItems.filter(item => item.category_id === selectedCategory && item.is_available)
    : menuItems.filter(item => item.is_available);

  const groupedItems = filteredItems.reduce((acc, item) => {
    const category = item.category_name || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  // Cart functions
  const addToCart = (itemId: number) => {
    setCart(prev => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1
    }));
    
    // Track item interaction
    trackEvent('item_view', { 
      menu_id: parseInt(menuId), 
      item_id: itemId,
      table_number: tableNumber,
      action: 'add_to_cart'
    });
  };

  const removeFromCart = (itemId: number) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[itemId] > 1) {
        newCart[itemId]--;
      } else {
        delete newCart[itemId];
      }
      return newCart;
    });
  };

  const getTotalItems = () => Object.values(cart).reduce((sum, count) => sum + count, 0);
  const getTotalPrice = () => {
    return Object.entries(cart).reduce((sum, [itemId, count]) => {
      const item = menuItems.find(i => i.id === parseInt(itemId));
      return sum + (item ? item.price * count : 0);
    }, 0);
  };

  const handleOrder = async () => {
    // Show order form first
    setShowCart(false);
    setShowOrderForm(true);
  };

  const submitOrder = async () => {
    if (!orderForm.customerName.trim() || !orderForm.customerPhone.trim()) {
      alert('Please provide your name and phone number');
      return;
    }

    setIsSubmittingOrder(true);

    try {
      const orderData = new FormData();
      orderData.append('customerName', orderForm.customerName);
      orderData.append('customerPhone', orderForm.customerPhone);
      orderData.append('customerEmail', orderForm.customerEmail);
      orderData.append('notes', orderForm.notes);
      orderData.append('sessionId', sessionId || '');
      
      // Convert cart to items array
      const items = Object.entries(cart).map(([itemId, quantity]) => {
        const item = menuItems.find(i => i.id === parseInt(itemId));
        return {
          id: parseInt(itemId),
          name: item?.name || '',
          price: item?.price || 0,
          quantity
        };
      });
      
      orderData.append('items', JSON.stringify(items));
      orderData.append('totalAmount', getTotalPrice().toString());

      const response = await fetch(`/api/public/menu/${menuId}`, {
        method: 'POST',
        body: orderData
      });

      const result = await response.json();

      if (result.success) {
        setOrderSuccess(true);
        setCart({});
        setOrderForm({
          customerName: '',
          customerPhone: '',
          customerEmail: '',
          notes: ''
        });
        
        // Track successful order
        await trackEvent('order_placed', {
          menu_id: parseInt(menuId),
          order_id: result.data.orderId,
          total_amount: getTotalPrice(),
          items: items
        });

        setTimeout(() => {
          setShowOrderForm(false);
          setOrderSuccess(false);
        }, 3000);
      } else {
        if (result.requiresUpgrade) {
          alert(`${result.message}\n\nThis restaurant needs to upgrade to Pro or Enterprise plan to accept online orders.`);
        } else {
          alert(result.message || 'Failed to place order. Please try again.');
        }
      }
    } catch (error) {
      console.error('Failed to place order:', error);
      alert('Failed to place order. Please try again.');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // Get menu design colors
  const designColors = menuDesigns[menu?.style || 'modern'] || menuDesigns.modern;
  const currencySymbol = menu?.currency === 'USD' ? '$' : 
                         menu?.currency === 'EUR' ? '€' :
                         menu?.currency === 'GBP' ? '£' :
                         menu?.currency === 'INR' ? '₹' : '$';

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br ${designColors.gradient}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 mx-auto" style={{ borderColor: designColors.accent }}></div>
          <p className="mt-4 text-lg font-medium" style={{ color: designColors.text }}>Loading menu...</p>
        </div>
      </div>
    );
  }

  if (error || !menu) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Menu Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'The menu you\'re looking for doesn\'t exist.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${designColors.gradient}`} style={{ backgroundColor: designColors.bg }}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            {/* Logo */}
            {menu.logo_url && (
              <div className="mb-6 flex justify-center">
                <div className="relative">
                  <img 
                    src={menu.logo_url} 
                    alt={menu.restaurant_name}
                    className="h-20 w-20 md:h-24 md:w-24 object-contain rounded-xl shadow-md bg-white p-2"
                  />
                </div>
              </div>
            )}
            
            <h1 className="text-4xl md:text-5xl font-bold mb-2" style={{ color: designColors.text }}>
              {menu.restaurant_name}
            </h1>
            {menu.description && (
              <p className="text-lg opacity-80" style={{ color: designColors.text }}>{menu.description}</p>
            )}
            {tableNumber && (
              <div 
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium"
                style={{ backgroundColor: `${designColors.accent}20`, color: designColors.accent }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Table {tableNumber}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Category Filter */}
      {categories.length > 0 && (
        <div className="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
          <div className="max-w-5xl mx-auto px-4 py-4">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <button
                onClick={() => setSelectedCategory(null)}
                style={{
                  backgroundColor: selectedCategory === null ? designColors.accent : '#F3F4F6',
                  color: selectedCategory === null ? '#FFFFFF' : designColors.text
                }}
                className="px-4 py-2 rounded-full whitespace-nowrap font-medium transition-all hover:opacity-90"
              >
                All Items
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  style={{
                    backgroundColor: selectedCategory === category.id ? (category.background_color || designColors.accent) : '#F3F4F6',
                    color: selectedCategory === category.id ? (category.text_color || '#FFFFFF') : designColors.text
                  }}
                  className="px-4 py-2 rounded-full whitespace-nowrap font-medium transition-all hover:opacity-90"
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Menu Items */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {Object.keys(groupedItems).length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🍽️</div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">No Items Available</h3>
            <p className="text-gray-600">Check back later for menu updates.</p>
          </div>
        ) : (
          Object.entries(groupedItems).map(([categoryName, items]) => (
            <motion.div
              key={categoryName}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-12"
            >
              <h2 
                className="text-3xl font-bold mb-6 pb-2 border-b-2" 
                style={{ color: designColors.text, borderColor: designColors.accent }}
              >
                {categoryName}
              </h2>
              <div className="grid gap-6">
                {items.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border"
                    style={{
                      backgroundColor: item.card_color || '#FFFFFF',
                      borderColor: item.card_color ? `${item.card_color}40` : '#E5E7EB'
                    }}
                  >
                    <div className="flex gap-4">
                      {item.image_url && (
                        <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden">
                          <Image
                            src={item.image_url}
                            alt={item.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 
                              className="text-xl font-semibold mb-1"
                              style={{ color: item.heading_color || designColors.text }}
                            >
                              {item.name}
                              {item.is_featured && (
                                <span className="ml-2 text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-medium">
                                  ⭐ Featured
                                </span>
                              )}
                            </h3>
                            {item.description && (
                              <p className="mb-2" style={{ color: item.text_color || '#6B7280' }}>
                                {item.description}
                              </p>
                            )}
                            {item.dietary_info && item.dietary_info.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {item.dietary_info.map((info, index) => (
                                  <span
                                    key={index}
                                    className="text-xs px-2 py-1 rounded-full"
                                    style={{ 
                                      backgroundColor: `${designColors.accent}20`,
                                      color: designColors.accent
                                    }}
                                  >
                                    {info}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-2xl font-bold" style={{ color: designColors.accent }}>
                              {currencySymbol}{item.price.toFixed(2)}
                            </p>
                            {orderingEnabled && (
                              <div className="mt-2 flex items-center gap-2">
                                {cart[item.id] ? (
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => removeFromCart(item.id)}
                                      className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center text-lg font-bold hover:bg-red-600"
                                    >
                                      -
                                    </button>
                                    <span className="font-bold min-w-[20px] text-center">{cart[item.id]}</span>
                                    <button
                                      onClick={() => addToCart(item.id)}
                                      className="w-8 h-8 rounded-full text-white flex items-center justify-center text-lg font-bold hover:opacity-90"
                                      style={{ backgroundColor: designColors.accent }}
                                    >
                                      +
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => addToCart(item.id)}
                                    className="px-4 py-2 rounded-full text-white font-medium hover:opacity-90 transition-all"
                                    style={{ backgroundColor: designColors.accent }}
                                  >
                                    Add to Cart
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Floating Cart Button */}
      {orderingEnabled && getTotalItems() > 0 && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={() => setShowCart(true)}
            className="w-16 h-16 rounded-full shadow-lg text-white flex items-center justify-center relative hover:scale-105 transition-transform"
            style={{ backgroundColor: designColors.accent }}
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.1 5.9M7 13l-1.1 5.9M7 13h10M17 13v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6" />
            </svg>
            <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center font-bold">
              {getTotalItems()}
            </span>
          </button>
        </div>
      )}

      {/* Cart Modal */}
      {showCart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end justify-center">
          <motion.div
            initial={{ opacity: 0, y: 300 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 300 }}
            className="bg-white w-full max-w-md max-h-[80vh] rounded-t-2xl overflow-hidden"
          >
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold" style={{ color: designColors.text }}>Your Order</h3>
                <button
                  onClick={() => setShowCart(false)}
                  className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                >
                  ✕
                </button>
              </div>
              {tableNumber && (
                <p className="text-sm opacity-70 mt-1" style={{ color: designColors.text }}>
                  Table {tableNumber}
                </p>
              )}
            </div>
            
            <div className="p-6 overflow-y-auto max-h-96">
              {Object.entries(cart).map(([itemId, quantity]) => {
                const item = menuItems.find(i => i.id === parseInt(itemId));
                if (!item) return null;
                
                return (
                  <div key={itemId} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                    <div className="flex-1">
                      <h4 className="font-medium" style={{ color: designColors.text }}>{item.name}</h4>
                      <p className="text-sm opacity-70" style={{ color: designColors.text }}>
                        {currencySymbol}{item.price.toFixed(2)} each
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-sm hover:bg-red-600"
                        >
                          -
                        </button>
                        <span className="font-bold min-w-[20px] text-center">{quantity}</span>
                        <button
                          onClick={() => addToCart(item.id)}
                          className="w-6 h-6 rounded-full text-white flex items-center justify-center text-sm hover:opacity-90"
                          style={{ backgroundColor: designColors.accent }}
                        >
                          +
                        </button>
                      </div>
                      <p className="font-bold min-w-[60px] text-right" style={{ color: designColors.accent }}>
                        {currencySymbol}{(item.price * quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="p-6 border-t bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-bold" style={{ color: designColors.text }}>Total:</span>
                <span className="text-xl font-bold" style={{ color: designColors.accent }}>
                  {currencySymbol}{getTotalPrice().toFixed(2)}
                </span>
              </div>
              <button
                onClick={handleOrder}
                className="w-full py-3 rounded-lg text-white font-bold text-lg hover:opacity-90 transition-all"
                style={{ backgroundColor: designColors.accent }}
              >
                Place Order ({getTotalItems()} items)
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Order Form Modal */}
      {showOrderForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white w-full max-w-md rounded-2xl overflow-hidden"
          >
            {orderSuccess ? (
              <div className="p-8 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <Check className="w-8 h-8 text-white" />
                </motion.div>
                <h3 className="text-xl font-bold text-green-600 mb-2">Order Placed Successfully!</h3>
                <p className="text-gray-600 mb-4">
                  Thank you! The restaurant will contact you shortly.
                </p>
                <p className="text-sm text-gray-500">
                  Estimated time: 20-30 minutes
                </p>
              </div>
            ) : (
              <>
                <div className="p-6 border-b">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold" style={{ color: designColors.text }}>Order Details</h3>
                    <button
                      onClick={() => setShowOrderForm(false)}
                      className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm opacity-70 mt-1" style={{ color: designColors.text }}>
                    Please provide your contact details
                  </p>
                </div>
                
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: designColors.text }}>
                      <User className="w-4 h-4 inline mr-2" />
                      Full Name *
                    </label>
                    <Input
                      type="text"
                      value={orderForm.customerName}
                      onChange={(e) => setOrderForm(prev => ({ ...prev, customerName: e.target.value }))}
                      placeholder="Enter your full name"
                      className="w-full"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: designColors.text }}>
                      <Phone className="w-4 h-4 inline mr-2" />
                      Phone Number *
                    </label>
                    <Input
                      type="tel"
                      value={orderForm.customerPhone}
                      onChange={(e) => setOrderForm(prev => ({ ...prev, customerPhone: e.target.value }))}
                      placeholder="Enter your phone number"
                      className="w-full"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: designColors.text }}>
                      <Mail className="w-4 h-4 inline mr-2" />
                      Email (Optional)
                    </label>
                    <Input
                      type="email"
                      value={orderForm.customerEmail}
                      onChange={(e) => setOrderForm(prev => ({ ...prev, customerEmail: e.target.value }))}
                      placeholder="Enter your email"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: designColors.text }}>
                      Special Instructions (Optional)
                    </label>
                    <textarea
                      value={orderForm.notes}
                      onChange={(e) => setOrderForm(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Any special requests or dietary requirements..."
                      className="w-full p-3 border border-gray-300 rounded-lg resize-none h-20"
                    />
                  </div>

                  {/* Order Summary */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold mb-2" style={{ color: designColors.text }}>Order Summary</h4>
                    <div className="space-y-1 text-sm">
                      {Object.entries(cart).map(([itemId, quantity]) => {
                        const item = menuItems.find(i => i.id === parseInt(itemId));
                        if (!item) return null;
                        return (
                          <div key={itemId} className="flex justify-between">
                            <span>{quantity}x {item.name}</span>
                            <span>{currencySymbol}{(item.price * quantity).toFixed(2)}</span>
                          </div>
                        );
                      })}
                      <div className="border-t pt-2 font-bold flex justify-between">
                        <span>Total:</span>
                        <span style={{ color: designColors.accent }}>
                          {currencySymbol}{getTotalPrice().toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 border-t bg-gray-50">
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowOrderForm(false);
                        setShowCart(true);
                      }}
                      className="flex-1"
                    >
                      Back to Cart
                    </Button>
                    <Button
                      onClick={submitOrder}
                      disabled={isSubmittingOrder || !orderForm.customerName.trim() || !orderForm.customerPhone.trim()}
                      className="flex-1"
                      style={{ backgroundColor: designColors.accent }}
                    >
                      {isSubmittingOrder ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Placing Order...
                        </div>
                      ) : (
                        'Place Order'
                      )}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}

      {/* Footer */}
      <div className="bg-white border-t border-gray-100 mt-16">
        <div className="max-w-5xl mx-auto px-4 py-6 text-center">
          <p style={{ color: designColors.text, opacity: 0.7 }}>
            Powered by <span className="font-semibold" style={{ color: designColors.accent }}>MenuVibe</span>
          </p>
        </div>
      </div>
    </div>
  );
}
