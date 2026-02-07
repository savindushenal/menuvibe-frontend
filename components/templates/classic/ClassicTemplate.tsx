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

interface ClassicTemplateProps {
  franchise: FranchiseInfo;
  location: LocationInfo;
  menuItems: MenuItem[];
}

/**
 * Classic Template - Simple, clean menu layout
 * 
 * This is a skeleton template for your dev team to customize.
 * 
 * Features to implement:
 * - Simple header with logo and cart
 * - List-based menu layout
 * - Category sidebar or tabs
 * - Clean product cards
 * - Slide-out cart
 * - Order confirmation
 * 
 * Design considerations:
 * - Uses franchise.designTokens for colors/fonts
 * - Supports tableInfo from QR code scans
 * - Mobile-first responsive design
 */
export default function ClassicTemplate({ 
  franchise, 
  location, 
  menuItems 
}: ClassicTemplateProps) {
  const searchParams = useSearchParams();
  
  // Parse table info from URL params (from QR code)
  const tableInfo: TableInfo | null = useMemo(() => {
    const table = searchParams.get('table');
    if (!table) return null;
    return {
      table,
      floor: searchParams.get('floor') || undefined,
      location: searchParams.get('location') || undefined,
    };
  }, [searchParams]);

  // Get unique categories
  const categories = useMemo(() => {
    const catSet = new Set<string>();
    menuItems.forEach(item => catSet.add(item.category));
    return Array.from(catSet);
  }, [menuItems]);

  // State
  const [activeCategory, setActiveCategory] = useState(categories[0] || 'All');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Filter items by category
  const filteredItems = menuItems.filter(item => item.category === activeCategory);

  // Cart count
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Handlers
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
    <div className="min-h-screen bg-white">
      {/* ============================================
          HEADER - Customize this section
          ============================================ */}
      <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            {franchise.logoUrl && (
              <img 
                src={franchise.logoUrl} 
                alt={franchise.name} 
                className="h-10 w-auto"
              />
            )}
            <div>
              <h1 className="font-bold text-lg">{franchise.name}</h1>
              <p className="text-sm text-gray-500">{location.name}</p>
            </div>
          </div>

          {/* Table Info (if from QR code) */}
          {tableInfo && (
            <div className="text-sm text-gray-600">
              Table {tableInfo.table}
              {tableInfo.floor && ` • ${tableInfo.floor}`}
            </div>
          )}

          {/* Cart Button */}
          <button 
            onClick={() => setIsCartOpen(true)}
            className="relative p-2 hover:bg-gray-100 rounded-full"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ============================================
          CATEGORY NAVIGATION - Customize this section
          ============================================ */}
      <nav className="sticky top-[73px] z-40 bg-white border-b">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto py-3 scrollbar-hide">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${
                  activeCategory === category
                    ? 'bg-black text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* ============================================
          MENU LIST - Customize this section
          ============================================ */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        <h2 className="text-xl font-bold mb-4">{activeCategory}</h2>
        
        <div className="space-y-4">
          {filteredItems.map(item => (
            <div 
              key={item.id}
              className="flex gap-4 p-4 border rounded-lg hover:shadow-md transition-shadow"
            >
              {/* Item Image */}
              {item.image && (
                <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                  <img 
                    src={item.image} 
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Item Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold">{item.name}</h3>
                <p className="text-sm text-gray-500 line-clamp-2">{item.description}</p>
                
                {/* Price with variations support */}
                <div className="mt-2 flex items-center justify-between">
                  <span className="font-bold text-lg">
                    {item.variations && item.variations.length > 0 ? (
                      <>
                        <span className="text-sm font-normal text-gray-500">from </span>
                        Rs. {Math.min(...item.variations.map(v => v.price)).toLocaleString()}
                      </>
                    ) : (
                      <>Rs. {item.price.toLocaleString()}</>
                    )}
                  </span>
                  
                  <button
                    onClick={() => handleAddToCart(item)}
                    className="px-4 py-2 bg-black text-white rounded-full text-sm font-medium hover:bg-gray-800 transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* ============================================
          CART DRAWER - Customize this section
          ============================================ */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsCartOpen(false)}
          />
          
          {/* Cart Panel */}
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-xl">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-bold">Your Cart</h2>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 flex-1 overflow-auto">
              {cartItems.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Your cart is empty</p>
              ) : (
                <div className="space-y-4">
                  {cartItems.map((cartItem, index) => (
                    <div key={index} className="flex gap-3 pb-4 border-b">
                      <div className="flex-1">
                        <h4 className="font-medium">{cartItem.item.name}</h4>
                        <p className="text-sm text-gray-500">Qty: {cartItem.quantity}</p>
                      </div>
                      <span className="font-medium">
                        Rs. {(cartItem.item.price * cartItem.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="p-4 border-t">
                <div className="flex justify-between mb-4">
                  <span className="font-bold">Total</span>
                  <span className="font-bold">
                    Rs. {cartItems.reduce((sum, ci) => sum + ci.item.price * ci.quantity, 0).toLocaleString()}
                  </span>
                </div>
                <button className="w-full py-3 bg-black text-white rounded-full font-medium hover:bg-gray-800">
                  Place Order
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================
          FOOTER - Customize this section
          ============================================ */}
      <footer className="border-t py-6 text-center text-sm text-gray-500">
        <p>Powered by MenuVibe</p>
      </footer>
    </div>
  );
}
