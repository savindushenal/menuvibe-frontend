'use client';

import { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  MenuItem, 
  CartItem, 
  TableInfo, 
  FranchiseInfo, 
  LocationInfo 
} from '../premium/types';

interface MinimalTemplateProps {
  franchise: FranchiseInfo;
  location: LocationInfo;
  menuItems: MenuItem[];
}

/**
 * Minimal Template - Ultra-clean, card-based design
 * 
 * This is a skeleton template for your dev team to customize.
 * 
 * Features to implement:
 * - Floating header
 * - Grid-based menu cards
 * - Quick add to cart
 * - Bottom sheet cart
 * - Smooth animations
 * 
 * Design considerations:
 * - Minimalist aesthetic
 * - Focus on images
 * - Touch-friendly interactions
 */
export default function MinimalTemplate({ 
  franchise, 
  location, 
  menuItems 
}: MinimalTemplateProps) {
  const searchParams = useSearchParams();
  
  const tableInfo: TableInfo | null = useMemo(() => {
    const table = searchParams.get('table');
    if (!table) return null;
    return {
      table,
      floor: searchParams.get('floor') || undefined,
      location: searchParams.get('location') || undefined,
    };
  }, [searchParams]);

  const categories = useMemo(() => {
    const catSet = new Set<string>();
    menuItems.forEach(item => catSet.add(item.category));
    return Array.from(catSet);
  }, [menuItems]);

  const [activeCategory, setActiveCategory] = useState(categories[0] || 'All');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const filteredItems = menuItems.filter(item => item.category === activeCategory);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cartItems.reduce((sum, ci) => sum + ci.item.price * ci.quantity, 0);

  const handleAddToCart = (item: MenuItem) => {
    setCartItems(prev => {
      const existing = prev.find(ci => ci.item.id === item.id);
      if (existing) {
        return prev.map(ci => 
          ci.item.id === item.id 
            ? { ...ci, quantity: ci.quantity + 1 }
            : ci
        );
      }
      return [...prev, { item, quantity: 1, customizations: [] }];
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ============================================
          MINIMAL HEADER
          ============================================ */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="font-semibold text-base">{location.name}</h1>
            {tableInfo && (
              <p className="text-xs text-gray-500">Table {tableInfo.table}</p>
            )}
          </div>
          
          <button 
            onClick={() => setIsCartOpen(true)}
            className="relative"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-black text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ============================================
          CATEGORY PILLS
          ============================================ */}
      <div className="sticky top-[57px] z-40 bg-gray-50 py-3">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${
                  activeCategory === category
                    ? 'bg-black text-white'
                    : 'bg-white text-gray-600 border'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ============================================
          MENU GRID - Cards Layout
          ============================================ */}
      <main className="max-w-3xl mx-auto px-4 py-4">
        <div className="grid grid-cols-2 gap-3">
          {filteredItems.map(item => (
            <div 
              key={item.id}
              className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Image */}
              <div className="aspect-square bg-gray-100 relative">
                {item.image ? (
                  <img 
                    src={item.image} 
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">
                    🍽️
                  </div>
                )}
                
                {/* Quick Add Button */}
                <button
                  onClick={() => handleAddToCart(item)}
                  className="absolute bottom-2 right-2 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>

              {/* Info */}
              <div className="p-3">
                <h3 className="font-medium text-sm line-clamp-1">{item.name}</h3>
                <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{item.description}</p>
                <p className="font-semibold text-sm mt-2">
                  {item.variations && item.variations.length > 0 ? (
                    <>Rs. {Math.min(...item.variations.map(v => v.price)).toLocaleString()}+</>
                  ) : (
                    <>Rs. {item.price.toLocaleString()}</>
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* ============================================
          FLOATING CART BUTTON (when items in cart)
          ============================================ */}
      {cartCount > 0 && !isCartOpen && (
        <div className="fixed bottom-4 left-4 right-4 z-40 max-w-3xl mx-auto">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-black text-white py-4 rounded-2xl flex items-center justify-between px-6 shadow-xl"
          >
            <span className="bg-white text-black w-6 h-6 rounded-full text-sm flex items-center justify-center font-medium">
              {cartCount}
            </span>
            <span className="font-medium">View Cart</span>
            <span className="font-medium">Rs. {cartTotal.toLocaleString()}</span>
          </button>
        </div>
      )}

      {/* ============================================
          BOTTOM SHEET CART
          ============================================ */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50">
          <div 
            className="absolute inset-0 bg-black/40"
            onClick={() => setIsCartOpen(false)}
          />
          
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[80vh] overflow-hidden">
            {/* Handle */}
            <div className="flex justify-center py-3">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="px-6 pb-4 border-b">
              <h2 className="text-lg font-semibold">Your Order</h2>
            </div>

            {/* Items */}
            <div className="px-6 py-4 overflow-auto max-h-[40vh]">
              {cartItems.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Cart is empty</p>
              ) : (
                <div className="space-y-4">
                  {cartItems.map((cartItem, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {cartItem.item.image ? (
                          <img src={cartItem.item.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">🍽️</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm">{cartItem.item.name}</h4>
                        <p className="text-xs text-gray-500">x{cartItem.quantity}</p>
                      </div>
                      <span className="font-medium text-sm">
                        Rs. {(cartItem.item.price * cartItem.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {cartItems.length > 0 && (
              <div className="px-6 py-4 border-t bg-gray-50">
                <div className="flex justify-between mb-4">
                  <span className="text-gray-600">Total</span>
                  <span className="font-bold text-lg">Rs. {cartTotal.toLocaleString()}</span>
                </div>
                <button className="w-full py-4 bg-black text-white rounded-2xl font-medium">
                  Place Order
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
