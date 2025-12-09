'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from './components/Header';
import HeroSection from './components/HeroSection';
import ChristmasOffer from './components/ChristmasOffer';
import TopPicks, { topPicksData, MenuItem } from './components/TopPicks';
import CategoryNav from './components/CategoryNav';
import MenuList from './components/MenuList';
import ProductSheet from './components/ProductSheet';
import CartSheet from './components/CartSheet';
import SuccessScreen from './components/SuccessScreen';
import Footer from './components/Footer';

// Table info type
export interface TableInfo {
  table: string;
  floor?: string;
  location?: string;
}

interface CartItem {
  item: MenuItem;
  quantity: number;
  customizations: string[];
}

// Menu items data - Real Barista Menu
const allMenuItems: MenuItem[] = [
  // HOT BEVERAGES
  {
    id: 'espresso',
    name: 'Espresso',
    price: 450,
    description: 'Pure, intense shot of rich espresso with a golden crema.',
    image: '/barista/espresso.jpg',
    rating: 4.9,
    reviews: 67,
    category: 'Coffee',
    customizations: [
      { name: 'Double Shot (Doppio) +Rs. 70', price: 70 },
    ],
  },
  {
    id: 'americano',
    name: 'Americano',
    price: 620,
    description: 'Bold espresso with hot water for a clean, strong taste. Medium size.',
    image: '/barista/americano.jpg',
    rating: 4.7,
    reviews: 45,
    category: 'Coffee',
    customizations: [
      { name: 'Short (Rs. 530)', price: -90 },
      { name: 'Tall (Rs. 780)', price: 160 },
      { name: 'Extra Shot', price: 150 },
    ],
  },
  {
    id: 'cappuccino',
    name: 'Cappuccino',
    price: 720,
    description: 'Rich espresso with steamed milk and a deep layer of velvety foam. Medium size.',
    image: '/barista/cappuccino.jpg',
    rating: 5,
    reviews: 89,
    category: 'Coffee',
    customizations: [
      { name: 'Short (Rs. 620)', price: -100 },
      { name: 'Tall (Rs. 950)', price: 230 },
      { name: 'Extra Shot', price: 150 },
      { name: 'Oat Milk', price: 100 },
    ],
  },
  {
    id: 'cafe-latte',
    name: 'Cafe Latte',
    price: 750,
    description: 'Smooth espresso with perfectly steamed milk and light foam. Medium size.',
    image: '/barista/cafe-latte.jpg',
    rating: 4.8,
    reviews: 72,
    category: 'Coffee',
    customizations: [
      { name: 'Short (Rs. 650)', price: -100 },
      { name: 'Tall (Rs. 980)', price: 230 },
      { name: 'Extra Shot', price: 150 },
      { name: 'Vanilla Syrup', price: 80 },
    ],
  },
  {
    id: 'cafe-mocha',
    name: 'Cafe Mocha',
    price: 880,
    description: 'Indulgent espresso with rich chocolate and steamed milk, topped with whipped cream. Medium size.',
    image: '/barista/cafe-mocha.jpg',
    rating: 4.9,
    reviews: 95,
    category: 'Coffee',
    customizations: [
      { name: 'Short (Rs. 750)', price: -130 },
      { name: 'Tall (Rs. 1,190)', price: 310 },
      { name: 'Extra Whip', price: 0 },
      { name: 'Extra Shot', price: 150 },
    ],
  },
  {
    id: 'caramel-macchiato',
    name: 'Caramel Macchiato',
    price: 850,
    description: 'Vanilla-infused milk marked with espresso and topped with buttery caramel drizzle.',
    image: '/barista/caramel-macchiato.jpg',
    rating: 4.9,
    reviews: 103,
    category: 'Coffee',
    customizations: [
      { name: 'Extra Shot', price: 150 },
      { name: 'Extra Caramel', price: 50 },
    ],
  },
  {
    id: 'hot-chocolate',
    name: 'Hot Chocolate',
    price: 720,
    description: 'Rich, creamy hot chocolate made with premium cocoa and steamed milk. Medium size.',
    image: '/barista/hot-chocolate.jpg',
    rating: 4.8,
    reviews: 58,
    category: 'Coffee',
    customizations: [
      { name: 'Tall (Rs. 1,150)', price: 430 },
      { name: 'Extra Whip', price: 0 },
      { name: 'Marshmallows', price: 80 },
    ],
  },
  // FOOD - SANDWICHES
  {
    id: 'honey-roasted-chicken',
    name: 'Honey Roasted Chicken',
    price: 890,
    description: 'Tender honey-glazed chicken with fresh greens in artisan bread.',
    image: '/barista/honey-roasted-chicken.jpg',
    rating: 4.7,
    reviews: 34,
    category: 'Food',
  },
  {
    id: 'tuna-cucumber',
    name: 'Tuna and Cucumber',
    price: 790,
    description: 'Classic tuna salad with crisp cucumber on fresh bread.',
    image: '/barista/tuna-and-cucumber.jpg',
    rating: 4.6,
    reviews: 28,
    category: 'Food',
  },
  {
    id: 'smoked-chicken',
    name: 'Smoked Chicken',
    price: 960,
    description: 'Smoky, flavorful chicken with premium toppings in toasted bread.',
    image: '/barista/smoked-chicken.jpg',
    rating: 4.8,
    reviews: 41,
    category: 'Food',
  },
  {
    id: 'cheese-tomato',
    name: 'Cheese and Tomato',
    price: 650,
    description: 'Classic grilled cheese with fresh tomatoes on toasted bread.',
    image: '/barista/cheese-and-tomato.jpg',
    rating: 4.5,
    reviews: 23,
    category: 'Food',
  },
  // COLD DRINKS - MOJITOS
  {
    id: 'strawberry-mojito',
    name: 'Strawberry Mojito',
    price: 1150,
    description: 'Refreshing blend of fresh strawberries, mint, and lime with sparkling soda.',
    image: '/barista/strawberry-mojito.jpg',
    rating: 4.9,
    reviews: 76,
    category: 'Drinks',
  },
  {
    id: 'kiwi-mojito',
    name: 'Kiwi Mojito',
    price: 1150,
    description: 'Tropical kiwi muddled with fresh mint and lime, topped with sparkling soda.',
    image: '/barista/kiwi-mojito.jpg',
    rating: 4.8,
    reviews: 62,
    category: 'Drinks',
  },
];

const categoryMap: Record<string, string> = {
  coffee: 'Coffee',
  food: 'Food',
  drinks: 'Drinks',
};

export default function BaristaDemo() {
  const searchParams = useSearchParams();
  
  // Get table info from URL query params
  const tableParam = searchParams.get('table');
  const floorParam = searchParams.get('floor');
  const locationParam = searchParams.get('location');
  
  // Parse table info - if table param exists, it's a table-specific view
  const tableInfo: TableInfo | null = tableParam ? {
    table: tableParam,
    floor: floorParam || undefined,
    location: locationParam || 'Barista',
  } : null;
  
  // Location name (from query or default)
  const locationName = locationParam || 'Barista Moratuwa';

  const [activeCategory, setActiveCategory] = useState('coffee');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isProductSheetOpen, setIsProductSheetOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [orderId, setOrderId] = useState('');

  const filteredItems = allMenuItems.filter(
    item => item.category === categoryMap[activeCategory]
  );

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleItemClick = (item: MenuItem) => {
    setSelectedItem(item);
    setIsProductSheetOpen(true);
  };

  const handleAddToCart = (item: MenuItem, quantity: number, customizations: string[]) => {
    setCartItems(prev => {
      const existingIndex = prev.findIndex(ci => ci.item.id === item.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      }
      return [...prev, { item, quantity, customizations }];
    });
  };

  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      setCartItems(prev => prev.filter(ci => ci.item.id !== itemId));
    } else {
      setCartItems(prev => 
        prev.map(ci => 
          ci.item.id === itemId ? { ...ci, quantity } : ci
        )
      );
    }
  };

  const handleAddUpsell = (item: MenuItem) => {
    handleAddToCart(item, 1, []);
  };

  const handleConfirmOrder = async () => {
    // Generate order ID
    const newOrderId = `BM-${Math.floor(1000 + Math.random() * 9000)}`;
    setOrderId(newOrderId);

    // Calculate total
    const total = cartItems.reduce((sum, cartItem) => {
      const customizationsTotal = cartItem.customizations.reduce((cSum, name) => {
        const customization = cartItem.item.customizations?.find(c => c.name === name);
        return cSum + (customization?.price || 0);
      }, 0);
      return sum + (cartItem.item.price + customizationsTotal) * cartItem.quantity;
    }, 0);

    // Submit to Supabase (if available)
    try {
      const response = await fetch('/api/barista/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: newOrderId,
          items: cartItems.map(ci => ({
            name: ci.item.name,
            quantity: ci.quantity,
            price: ci.item.price,
            customizations: ci.customizations,
          })),
          table_no: tableInfo?.table || 'Takeaway',
          floor: tableInfo?.floor || 'Counter',
          total,
          status: 'pending',
        }),
      });
      
      if (!response.ok) {
        console.log('Order API not available, continuing with demo');
      }
    } catch (error) {
      console.log('Order submission skipped:', error);
    }

    setIsCartOpen(false);
    setShowSuccess(true);
  };

  const handleCancelOrder = () => {
    setShowSuccess(false);
    setCartItems([]);
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    setCartItems([]);
  };

  return (
    <div className="min-h-screen bg-white">
      <Header 
        cartCount={cartCount} 
        onCartClick={() => setIsCartOpen(true)}
        tableInfo={tableInfo}
        locationName={locationName}
      />
      
      <HeroSection tableInfo={tableInfo} />
      
      <ChristmasOffer onItemClick={handleItemClick} />
      
      <TopPicks onItemClick={handleItemClick} />
      
      <CategoryNav 
        activeCategory={activeCategory} 
        onCategoryChange={setActiveCategory} 
      />
      
      <MenuList 
        items={filteredItems} 
        onItemClick={handleItemClick} 
      />
      
      <ProductSheet
        item={selectedItem}
        isOpen={isProductSheetOpen}
        onClose={() => setIsProductSheetOpen(false)}
        onAddToCart={handleAddToCart}
      />
      
      <CartSheet
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onAddUpsell={handleAddUpsell}
        onConfirmOrder={handleConfirmOrder}
      />
      
      <SuccessScreen
        isOpen={showSuccess}
        orderId={orderId}
        onCancel={handleCancelOrder}
        onClose={handleSuccessClose}
        tableInfo={tableInfo}
      />
      
      <Footer />
    </div>
  );
}
