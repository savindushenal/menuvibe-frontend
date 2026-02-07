'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart, Plus, X, Loader2 } from 'lucide-react';

/**
 * Premium Cafe Template
 * 
 * Example custom template for developers to reference.
 * Shows how to:
 * - Fetch from API
 * - Use configuration
 * - Handle cart operations
 * - Custom styling
 * 
 * @author MenuVibe Team (Example)
 */

interface PremiumCafeProps {
  code: string;
}

export default function PremiumCafeTemplate({ code }: PremiumCafeProps) {
  const [data, setData] = useState<any>(null);
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    fetchMenu();
  }, [code]);

  const fetchMenu = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      const response = await fetch(`${apiUrl}/menu/${code}`);
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Failed to load menu:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item: any) => {
    // Add to local cart
    const existing = cart.find(i => i.id === item.id);
    if (existing) {
      setCart(cart.map(i => 
        i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
      ));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
    
    // Optional: Sync with backend
    // await fetch(`${apiUrl}/cart/add`, { method: 'POST', body: JSON.stringify({ item_id: item.id }) });
  };

  const removeFromCart = (itemId: number) => {
    setCart(cart.filter(i => i.id !== itemId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800">Menu not found</h2>
        </div>
      </div>
    );
  }

  const config = data.template.config;
  const colors = config.design.colors;

  return (
    <div 
      className="min-h-screen"
      style={{ 
        background: `linear-gradient(135deg, ${colors.primary}15 0%, ${colors.secondary}15 100%)`,
        fontFamily: config.design.typography.fontFamily
      }}
    >
      {/* Header */}
      <header 
        className="sticky top-0 z-40 backdrop-blur-xl border-b"
        style={{ 
          backgroundColor: `${colors.background}ee`,
          borderColor: `${colors.primary}20`
        }}
      >
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {data.business?.logo_url && (
              <img 
                src={data.business.logo_url} 
                alt={data.business.name}
                className="w-12 h-12 rounded-full object-cover"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold" style={{ color: colors.text }}>
                {data.business?.name || data.endpoint?.name}
              </h1>
              <p className="text-sm opacity-70">{data.business?.description}</p>
            </div>
          </div>

          <button
            onClick={() => setCartOpen(true)}
            className="relative p-3 rounded-full transition-transform hover:scale-110"
            style={{ backgroundColor: colors.primary }}
          >
            <ShoppingCart className="w-6 h-6 text-white" />
            {cart.length > 0 && (
              <span 
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ backgroundColor: colors.accent }}
              >
                {cart.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section 
        className="relative h-64 flex items-center justify-center text-center"
        style={{
          background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`
        }}
      >
        <div className="text-white px-4">
          <h2 className="text-5xl font-bold mb-4">Welcome to Our Menu</h2>
          <p className="text-xl opacity-90">Crafted with love, served with care</p>
        </div>
      </section>

      {/* Menu Categories */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        {data.menu.categories?.map((category: any) => (
          <div key={category.id} className="mb-12">
            <h3 
              className="text-3xl font-bold mb-6 flex items-center gap-3"
              style={{ color: colors.primary }}
            >
              {category.icon && <span className="text-4xl">{category.icon}</span>}
              {category.name}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {category.items?.map((item: any) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
                >
                  {/* Item Image */}
                  {item.image_url ? (
                    <div className="h-48 overflow-hidden">
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                  ) : (
                    <div 
                      className="h-48 flex items-center justify-center text-6xl"
                      style={{ backgroundColor: `${colors.primary}10` }}
                    >
                      {item.icon || '🍽️'}
                    </div>
                  )}

                  {/* Item Details */}
                  <div className="p-6">
                    <h4 className="text-xl font-bold mb-2" style={{ color: colors.text }}>
                      {item.name}
                    </h4>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {item.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <span 
                        className="text-2xl font-bold"
                        style={{ color: colors.primary }}
                      >
                        {data.template.currency} {item.price}
                      </span>

                      <button
                        onClick={() => addToCart(item)}
                        className="px-4 py-2 rounded-full text-white font-semibold flex items-center gap-2 hover:scale-105 transition-transform"
                        style={{ backgroundColor: colors.primary }}
                      >
                        <Plus className="w-4 h-4" />
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* Cart Sidebar */}
      {cartOpen && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setCartOpen(false)}
          />

          {/* Cart Panel */}
          <div className="fixed right-0 top-0 h-full w-full md:w-96 bg-white shadow-2xl z-50 p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold" style={{ color: colors.text }}>
                Your Cart
              </h3>
              <button
                onClick={() => setCartOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">Your cart is empty</p>
              </div>
            ) : (
              <>
                {/* Cart Items */}
                <div className="space-y-4 mb-6">
                  {cart.map((item) => (
                    <div key={item.id} className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-semibold">{item.name}</h4>
                        <p className="text-sm text-gray-600">
                          {data.template.currency} {item.price} × {item.quantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold" style={{ color: colors.primary }}>
                          {data.template.currency} {(item.price * item.quantity).toFixed(2)}
                        </span>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="p-1 rounded hover:bg-red-100 text-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="border-t pt-4 mb-6">
                  <div className="flex justify-between items-center text-xl font-bold">
                    <span>Total:</span>
                    <span style={{ color: colors.primary }}>
                      {data.template.currency} {cartTotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Checkout Button */}
                <button
                  className="w-full py-4 rounded-full text-white font-bold text-lg hover:scale-105 transition-transform"
                  style={{ backgroundColor: colors.primary }}
                  onClick={() => alert('Checkout functionality - connect to your POS!')}
                >
                  Proceed to Checkout
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
