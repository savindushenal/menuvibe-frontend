'use client';

import { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Search, Star, Clock, MapPin, Phone, X, Plus, Minus, Check } from 'lucide-react';

/**
 * Premium Restaurant Template
 * 
 * Features:
 * - Full-screen hero with background image
 * - Elegant menu cards with hover effects
 * - Sticky floating cart
 * - Search and filter
 * - Featured items section
 * - Restaurant info footer
 */

export default function PremiumRestaurantTemplate({ code }: { code: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<any[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const sectionRefs = useRef<Record<number, HTMLElement | null>>({});
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMenuData();
  }, [code]);

  const fetchMenuData = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      const response = await fetch(`${apiUrl}/menu/${code}`);
      const result = await response.json();
      if (result.success) {
        setData(result.data);
        if (result.data.menu.categories?.length > 0) {
          setSelectedCategory(result.data.menu.categories[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to load menu:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item: any) => {
    const existing = cart.find(i => i.id === item.id);
    if (existing) {
      setCart(cart.map(i => 
        i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
      ));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
    
    // Show cart briefly
    setCartOpen(true);
    setTimeout(() => setCartOpen(false), 2000);
  };

  const updateQuantity = (itemId: number, delta: number) => {
    setCart(cart.map(i => {
      if (i.id === itemId) {
        const newQuantity = i.quantity + delta;
        return newQuantity > 0 ? { ...i, quantity: newQuantity } : i;
      }
      return i;
    }).filter(i => i.quantity > 0));
  };

  const removeFromCart = (itemId: number) => {
    setCart(cart.filter(i => i.id !== itemId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Search-filtered flat results
  const allItems = data?.menu.categories?.flatMap((c: any) => c.items || []) || [];
  const searchResults = searchQuery.trim()
    ? allItems.filter((item: any) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  // Uber Eats-style: observe which section is in viewport → highlight nav pill
  useEffect(() => {
    if (!data) return;
    const cats = data.menu?.categories || [];
    const observers: IntersectionObserver[] = [];
    cats.forEach((cat: any) => {
      const el = sectionRefs.current[cat.id];
      if (!el) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setSelectedCategory(cat.id);
            const btn = navRef.current?.querySelector(`[data-cat="${cat.id}"]`) as HTMLElement;
            btn?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
          }
        },
        { rootMargin: '-38% 0px -55% 0px', threshold: 0 }
      );
      observer.observe(el);
      observers.push(observer);
    });
    return () => observers.forEach((obs) => obs.disconnect());
  }, [data]);

  const scrollToSection = (categoryId: number) => {
    setSelectedCategory(categoryId);
    const el = sectionRefs.current[categoryId];
    if (el) {
      const offset = 130;
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading menu...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Menu Not Found</h2>
          <p className="text-gray-600">Please check the QR code and try again</p>
        </div>
      </div>
    );
  }

  const config = data.template.config;
  const colors = config.design.colors;
  const business = data.business || {};

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div 
        className="relative h-[60vh] bg-cover bg-center"
        style={{
          backgroundImage: business.cover_image_url 
            ? `url(${business.cover_image_url})` 
            : `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
        }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        
        {/* Content */}
        <div className="relative h-full flex flex-col items-center justify-center text-white px-4">
          {business.logo_url && (
            <img 
              src={business.logo_url} 
              alt={business.name}
              className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-2xl mb-6"
            />
          )}
          
          <h1 className="text-5xl md:text-7xl font-bold mb-4 text-center drop-shadow-lg">
            {business.name || data.endpoint.name}
          </h1>
          
          <p className="text-xl md:text-2xl text-center max-w-2xl mb-8 drop-shadow">
            {business.description || 'Welcome to our restaurant'}
          </p>

          <div className="flex flex-wrap gap-6 text-sm">
            {business.phone && typeof business.phone === 'string' && (
              <div className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                <span>{business.phone}</span>
              </div>
            )}
            {business.address && typeof business.address === 'string' && (
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                <span>{business.address}</span>
              </div>
            )}
            {business.opening_hours && typeof business.opening_hours === 'string' && (
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span>{business.opening_hours}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search & Category Bar */}
      <div className="sticky top-0 z-30 bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex gap-3 items-center">
            {/* Search */}
            <div className="flex-1 relative max-w-xs">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>
            {/* Category Pills */}
            <div className="flex gap-2 overflow-x-auto flex-1" ref={navRef}>
              {data.menu.categories?.map((cat: any) => (
                <button
                  key={cat.id}
                  data-cat={cat.id}
                  onClick={() => { setSearchQuery(''); scrollToSection(cat.id); }}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cat.icon && <span>{cat.icon}</span>}
                  {cat.name}
                </button>
              ))}
            </div>
            {/* Cart Button */}
            <button
              onClick={() => setCartOpen(true)}
              className="relative px-4 py-2.5 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors flex items-center gap-2 flex-shrink-0"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Featured Items */}
      {data.menu.categories?.some((cat: any) => cat.items?.some((item: any) => item.is_featured)) && (
        <section className="max-w-6xl mx-auto px-4 py-12">
          <div className="flex items-center gap-3 mb-8">
            <Star className="w-8 h-8 text-yellow-500" />
            <h2 className="text-4xl font-bold text-gray-800">Chef's Recommendations</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {data.menu.categories
              ?.flatMap((cat: any) => cat.items?.filter((item: any) => item.is_featured) || [])
              .slice(0, 3)
              .map((item: any) => (
                <div
                  key={item.id}
                  className="group relative bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
                >
                  <div className="absolute top-4 right-4 z-10">
                    <div className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                      <Star className="w-4 h-4 fill-current" />
                      Featured
                    </div>
                  </div>

                  {item.image_url ? (
                    <div className="h-56 overflow-hidden">
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                  ) : (
                    <div className="h-56 bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center text-6xl">
                      {item.icon || '🍽️'}
                    </div>
                  )}

                  <div className="p-6">
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">{item.name}</h3>
                    <p className="text-gray-600 mb-4 line-clamp-2">{item.description}</p>

                    <div className="flex items-center justify-between">
                      <span className="text-3xl font-bold text-emerald-600">
                        {data.template.currency} {item.price}
                      </span>

                      <button
                        onClick={() => addToCart(item)}
                        className="px-6 py-3 bg-emerald-600 text-white rounded-full font-semibold hover:bg-emerald-700 transition-colors flex items-center gap-2"
                      >
                        <Plus className="w-5 h-5" />
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </section>
      )}

      {/* Menu Sections — Uber Eats style */}
      <section className="max-w-6xl mx-auto px-4 py-8 pb-24">
        {searchQuery.trim() ? (
          /* Search results */
          <div>
            <p className="text-sm text-gray-500 mb-6">
              {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for &ldquo;{searchQuery}&rdquo;
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {searchResults.map((item: any) => (
                <div key={item.id} className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden flex">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-32 h-32 object-cover" />
                  ) : (
                    <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-4xl">{item.icon || '🍽️'}</div>
                  )}
                  <div className="flex-1 p-4 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 mb-1">{item.name}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-2xl font-bold text-emerald-600">{data.template.currency} {item.price}</span>
                      <button onClick={() => addToCart(item)} className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors">Add</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* All sections stacked */
          <div className="space-y-14">
            {data.menu.categories?.filter((cat: any) => (cat.items || []).length > 0).map((category: any) => (
              <div
                key={category.id}
                ref={(el) => { sectionRefs.current[category.id] = el; }}
              >
                {/* Section heading */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1 h-8 rounded-full bg-emerald-600 flex-shrink-0" />
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
                    {category.icon && <span className="text-3xl">{category.icon}</span>}
                    {category.name}
                  </h2>
                  <span className="text-sm text-gray-400 font-medium">{category.items.length} items</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {category.items.map((item: any) => (
                    <div key={item.id} className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden flex">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="w-32 h-32 object-cover" />
                      ) : (
                        <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-4xl">{item.icon || '🍽️'}</div>
                      )}
                      <div className="flex-1 p-4 flex flex-col justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-gray-800 mb-1">{item.name}</h3>
                          <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-2xl font-bold text-emerald-600">{data.template.currency} {item.price}</span>
                          <button onClick={() => addToCart(item)} className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors">Add</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Cart Sidebar */}
      <div
        className={`fixed inset-y-0 right-0 w-full md:w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ${
          cartOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Cart Header */}
          <div className="p-6 border-b bg-emerald-600 text-white">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold">Your Order</h3>
              <button
                onClick={() => setCartOpen(false)}
                className="p-2 rounded-full hover:bg-emerald-700 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <p className="text-emerald-100 mt-1">{cartItemCount} items</p>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-6">
            {cart.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="w-20 h-20 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500 text-lg">Your cart is empty</p>
                <p className="text-gray-400 text-sm mt-2">Add items to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item.id} className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">{item.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {data.template.currency} {item.price} each
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <span className="text-lg font-bold text-emerald-600">
                        {data.template.currency} {(item.price * item.quantity).toFixed(2)}
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-8 h-8 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart Footer */}
          {cart.length > 0 && (
            <div className="p-6 border-t bg-gray-50">
              <div className="mb-4">
                <div className="flex justify-between text-lg mb-2">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-semibold">{data.template.currency} {cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-2xl font-bold">
                  <span>Total:</span>
                  <span className="text-emerald-600">{data.template.currency} {cartTotal.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={() => alert('Checkout - Connect to POS system!')}
                className="w-full py-4 bg-emerald-600 text-white rounded-lg font-bold text-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
              >
                <Check className="w-6 h-6" />
                Place Order
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Overlay */}
      {cartOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setCartOpen(false)}
        />
      )}
    </div>
  );
}
