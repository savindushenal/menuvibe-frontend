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

// Menu items data - Real Isso Menu
const allMenuItems: MenuItem[] = [
  // APPETIZERS
  {
    id: 'batter-fried-prawns',
    name: 'Batter Fried Prawns 4pcs',
    price: 1850,
    description: 'Crispy golden prawns in a light, fluffy batter served with tangy dipping sauce.',
    image: '/isso/Batter Fried Prawns 4pcs.jpg',
    rating: 4.9,
    reviews: 89,
    category: 'Appetizers',
    customizations: [
      { name: 'Extra Sauce', price: 100 },
      { name: 'Spicy Version', price: 0 },
    ],
  },
  {
    id: 'coconut-crumbed-prawns',
    name: 'Coconut Crumbed Prawns 4 pcs',
    price: 1950,
    description: 'Succulent prawns coated in crispy coconut flakes, perfectly golden fried.',
    image: '/isso/Coconut Crumbed Prawns 4 pcs.jpg',
    rating: 5,
    reviews: 112,
    category: 'Appetizers',
    customizations: [
      { name: 'Sweet Chili Sauce', price: 100 },
      { name: 'Garlic Aioli', price: 100 },
    ],
  },
  {
    id: 'isso-wade',
    name: 'Isso Wade 4pcs',
    price: 1650,
    description: 'Traditional Sri Lankan prawn fritters with aromatic spices and herbs.',
    image: '/isso/Isso wade 4pcs.jpg',
    rating: 4.8,
    reviews: 78,
    category: 'Appetizers',
  },
  {
    id: 'prawn-souffle-toast',
    name: 'Prawn Soufflé Toast',
    price: 1450,
    description: 'Crispy toast topped with light, airy prawn soufflé and garnished with herbs.',
    image: '/isso/Prawn Soufflé Toast.jpg',
    rating: 4.7,
    reviews: 65,
    category: 'Appetizers',
  },
  {
    id: 'tuna-cutlets',
    name: 'Sri Lankan Tuna Cutlets 4pcs',
    price: 1350,
    description: 'Spiced tuna cutlets with Sri Lankan flavors, crispy on the outside, tender inside.',
    image: '/isso/Sri Lankan Tuna Cutlets 4pcs.jpg',
    rating: 4.6,
    reviews: 54,
    category: 'Appetizers',
  },
  
  // MAIN DISHES
  {
    id: 'hot-butter',
    name: 'Hot Butter',
    price: 2850,
    description: 'Signature dish with succulent prawns in rich, buttery sauce with aromatic spices.',
    image: '/isso/Hot Butter.jpg',
    rating: 5,
    reviews: 145,
    category: 'Mains',
    customizations: [
      { name: 'Extra Spicy', price: 0 },
      { name: 'Mild', price: 0 },
      { name: 'Extra Prawns', price: 500 },
    ],
  },
  {
    id: 'eastern-spice',
    name: 'Eastern Spice',
    price: 2950,
    description: 'Exotic blend of Eastern spices with fresh seafood in aromatic curry sauce.',
    image: '/isso/Eastern Spice.jpg',
    rating: 4.9,
    reviews: 98,
    category: 'Mains',
    customizations: [
      { name: 'Medium Spice', price: 0 },
      { name: 'Extra Hot', price: 0 },
    ],
  },
  {
    id: 'rich-and-red',
    name: 'Rich & Red',
    price: 2750,
    description: 'Delicious prawns in a rich tomato-based sauce with bell peppers and onions.',
    image: '/isso/Rich & red.jpg',
    rating: 4.8,
    reviews: 87,
    category: 'Mains',
  },
  {
    id: 'tuna-tataki',
    name: 'Black Pepper Crusted Yellow Fin Tuna Tataki',
    price: 3250,
    description: 'Seared yellow fin tuna with black pepper crust, served rare with citrus soy.',
    image: '/isso/Black Pepper Crusted Yellow Fin Tuna Tataki.jpg',
    rating: 5,
    reviews: 124,
    category: 'Mains',
  },
  
  // SALADS
  {
    id: 'prawn-guacamole-salad',
    name: 'Prawn and Guacamole Salad',
    price: 1950,
    description: 'Fresh prawns with creamy guacamole, mixed greens, and zesty lime dressing.',
    image: '/isso/Prawn and Guacamole Salad.jpg',
    rating: 4.7,
    reviews: 72,
    category: 'Salads',
  },
  {
    id: 'fresh-garden-salad',
    name: 'Fresh Garden Salad',
    price: 850,
    description: 'Crisp seasonal vegetables with house dressing and herb garnish.',
    image: '/isso/Fresh Garden Salad.jpg',
    rating: 4.5,
    reviews: 45,
    category: 'Salads',
  },
];

const categoryMap: Record<string, string> = {
  appetizers: 'Appetizers',
  mains: 'Mains',
  salads: 'Salads',
};

export default function IssoDemo() {
  const searchParams = useSearchParams();
  
  // Get table info from URL query params
  const tableParam = searchParams.get('table');
  const floorParam = searchParams.get('floor');
  const locationParam = searchParams.get('location');
  
  // Parse table info - if table param exists, it's a table-specific view
  const tableInfo: TableInfo | null = tableParam ? {
    table: tableParam,
    floor: floorParam || undefined,
    location: locationParam || 'Isso',
  } : null;
  
  // Location name (from query or default)
  const locationName = locationParam || 'Isso Moratuwa';

  const [activeCategory, setActiveCategory] = useState('appetizers');
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
      const response = await fetch('/api/isso/orders', {
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
