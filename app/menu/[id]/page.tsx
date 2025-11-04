'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';

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

  useEffect(() => {
    loadMenu();
  }, [menuId]);

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
