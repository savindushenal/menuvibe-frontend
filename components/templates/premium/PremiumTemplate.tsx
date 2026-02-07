'use client';

import { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from './Header';
import TopPicks from './TopPicks';
import CategoryNav from './CategoryNav';
import MenuList from './MenuList';
import ProductSheet from './ProductSheet';
import CartSheet from './CartSheet';
import SuccessScreen from './SuccessScreen';
import Footer from './Footer';
import { 
  MenuItem, 
  CartItem, 
  TableInfo, 
  FranchiseInfo, 
  LocationInfo 
} from './types';

interface PremiumTemplateProps {
  franchise: FranchiseInfo;
  location: LocationInfo;
  menuItems: MenuItem[];
}

export default function PremiumTemplate({ 
  franchise, 
  location, 
  menuItems 
}: PremiumTemplateProps) {
  const searchParams = useSearchParams();
  
  // Parse table info from URL params
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
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isProductSheetOpen, setIsProductSheetOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');

  // Handlers
  const handleItemClick = (item: MenuItem) => {
    setSelectedItem(item);
    setIsProductSheetOpen(true);
  };

  const handleAddToCart = (cartItem: CartItem) => {
    setCartItems(prev => [...prev, cartItem]);
  };

  const handleUpdateQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(index);
      return;
    }
    setCartItems(prev => 
      prev.map((item, i) => 
        i === index ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveItem = (index: number) => {
    setCartItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleCheckout = () => {
    // Generate order number
    const num = Math.floor(Math.random() * 9000) + 1000;
    setOrderNumber(num.toString());
    setIsCartOpen(false);
    setIsSuccessOpen(true);
    setCartItems([]);
  };

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-franchise-neutral">
      <Header
        cartCount={cartCount}
        onCartClick={() => setIsCartOpen(true)}
        tableInfo={tableInfo}
        franchise={franchise}
        location={location}
      />

      <main>
        {/* Top Picks */}
        <TopPicks
          items={menuItems}
          onItemClick={handleItemClick}
        />

        {/* Category Navigation */}
        {categories.length > 0 && (
          <CategoryNav
            categories={categories}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          />
        )}

        {/* Menu List */}
        <MenuList
          items={menuItems}
          category={activeCategory}
          onItemClick={handleItemClick}
        />
      </main>

      <Footer franchise={franchise} />

      {/* Product Sheet */}
      <ProductSheet
        item={selectedItem}
        isOpen={isProductSheetOpen}
        onClose={() => setIsProductSheetOpen(false)}
        onAddToCart={handleAddToCart}
      />

      {/* Cart Sheet */}
      <CartSheet
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onCheckout={handleCheckout}
      />

      {/* Success Screen */}
      <SuccessScreen
        isOpen={isSuccessOpen}
        onClose={() => setIsSuccessOpen(false)}
        orderNumber={orderNumber}
        franchise={franchise}
        location={location}
        tableInfo={tableInfo}
      />
    </div>
  );
}
