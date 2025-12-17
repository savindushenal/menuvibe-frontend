'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ShoppingCart } from 'lucide-react';

// Components
import Header from './components/Header';
import HeroSection from './components/HeroSection';
import DealsCarousel from './components/DealsCarousel';
import CategoryNav from './components/CategoryNav';
import TopPicks from './components/TopPicks';
import MenuList from './components/MenuList';
import ProductSheet from './components/ProductSheet';
import CartSheet from './components/CartSheet';
import SuccessScreen from './components/SuccessScreen';
import Footer from './components/Footer';

// Types
import { 
  MenuItem, 
  CartItem, 
  SizeOption, 
  CrustOption, 
  TableInfo 
} from './types';

// Pizza sizes for all pizza items
const defaultPizzaSizes: SizeOption[] = [
  { id: 'personal', name: 'Personal', size: '7"', price: 0 },
  { id: 'medium', name: 'Medium', size: '10"', price: 500 },
  { id: 'large', name: 'Large', size: '13"', price: 900 },
  { id: 'family', name: 'Family', size: '15"', price: 1400 },
];

// Pizza crusts
const defaultCrusts: CrustOption[] = [
  { id: 'pan', name: 'Pan', price: 0 },
  { id: 'stuffed', name: 'Stuffed Crust', price: 350 },
  { id: 'thin', name: 'Thin & Crispy', price: 0 },
  { id: 'cheese-burst', name: 'Cheese Burst', price: 450 },
];

// Menu items data for each category
const menuItemsByCategory: Record<string, MenuItem[]> = {
  pizza: [
    {
      id: 'veggie-supreme',
      name: 'Veggie Supreme',
      price: 1790,
      description: 'Fresh mushrooms, onions, green peppers, black olives and tomatoes.',
      image: '/pizzahut/veggie-supreme.jpg',
      rating: 4.6,
      reviews: 156,
      category: 'Pizza',
      sizes: defaultPizzaSizes,
      crusts: defaultCrusts,
    },
    {
      id: 'super-supreme',
      name: 'Super Supreme',
      price: 2590,
      description: 'The ultimate loaded pizza with pepperoni, sausage, beef, mushrooms, capsicum & onions.',
      image: '/pizzahut/super-supreme.jpg',
      rating: 4.9,
      reviews: 289,
      category: 'Pizza',
      sizes: defaultPizzaSizes,
      crusts: defaultCrusts,
      badge: 'Best Seller',
    },
    {
      id: 'crispy-korean-chicken',
      name: 'Crispy Korean Chicken',
      price: 2390,
      description: 'Crispy fried chicken, spicy gochujang sauce, spring onions & sesame seeds.',
      image: '/pizzahut/crispy-korean-chicken.jpg',
      rating: 4.8,
      reviews: 198,
      category: 'Pizza',
      sizes: defaultPizzaSizes,
      crusts: defaultCrusts,
      badge: 'New',
    },
    {
      id: '4-cheese',
      name: '4 Cheese Pizza',
      price: 2190,
      description: 'A cheesy delight with mozzarella, cheddar, parmesan & feta cheese.',
      image: '/pizzahut/4-cheese-pizza.jpg',
      rating: 4.7,
      reviews: 234,
      category: 'Pizza',
      sizes: defaultPizzaSizes,
      crusts: defaultCrusts,
    },
    {
      id: 'middle-eastern-chicken',
      name: 'Middle Eastern Chicken',
      price: 2290,
      description: 'Tender chicken with Middle Eastern spices, capsicum & onions.',
      image: '/pizzahut/middle-eastern-chicken-pizza.jpg',
      rating: 4.8,
      reviews: 312,
      category: 'Pizza',
      sizes: defaultPizzaSizes,
      crusts: defaultCrusts,
      badge: 'Local Favorite',
    },
    {
      id: 'hot-garlic-prawns',
      name: 'Hot Garlic Prawns',
      price: 2790,
      description: 'Succulent prawns with garlic butter sauce, chili flakes & fresh herbs.',
      image: '/pizzahut/hot-garlic-prawns.jpg',
      rating: 4.7,
      reviews: 156,
      category: 'Pizza',
      sizes: defaultPizzaSizes,
      crusts: defaultCrusts,
      badge: 'Seafood',
    },
    {
      id: 'seafood-treat',
      name: 'Seafood Treat',
      price: 2690,
      description: 'A delicious mix of prawns, squid & crab sticks with creamy sauce.',
      image: '/pizzahut/seafood-treat.jpg',
      rating: 4.6,
      reviews: 143,
      category: 'Pizza',
      sizes: defaultPizzaSizes,
      crusts: defaultCrusts,
    },
    {
      id: 'minced-mutton-treat',
      name: 'Minced Mutton Treat',
      price: 2490,
      description: 'Spiced minced mutton with onions, capsicum & our special sauce.',
      image: '/pizzahut/minced-mutton-treat.jpg',
      rating: 4.8,
      reviews: 187,
      category: 'Pizza',
      sizes: defaultPizzaSizes,
      crusts: defaultCrusts,
    },
    {
      id: 'double-chicken-surprise',
      name: 'Double Chicken Surprise',
      price: 2390,
      description: 'Double portion of seasoned chicken, cheese & special herbs.',
      image: '/pizzahut/double-chicken-surprise.jpg',
      rating: 4.7,
      reviews: 201,
      category: 'Pizza',
      sizes: defaultPizzaSizes,
      crusts: defaultCrusts,
    },
    {
      id: 'beef-pepperoni',
      name: 'Beef Pepperoni',
      price: 2290,
      description: 'Loaded with double beef pepperoni, extra mozzarella & tomato sauce.',
      image: '/pizzahut/beef-pepperoni.jpg',
      rating: 4.9,
      reviews: 345,
      category: 'Pizza',
      sizes: defaultPizzaSizes,
      crusts: defaultCrusts,
      badge: 'Popular',
    },
  ],
  sides: [
    {
      id: 'garlic-bread',
      name: 'Garlic Bread',
      price: 590,
      description: 'Freshly baked bread with garlic butter. Served warm.',
      image: '/pizzahut/garlic-bread.jpg',
      rating: 4.6,
      reviews: 145,
      category: 'Sides',
    },
    {
      id: 'cheesy-garlic-bread',
      name: 'Cheesy Garlic Bread',
      price: 790,
      description: 'Garlic bread topped with melted mozzarella cheese.',
      image: '/pizzahut/cheesy-garlic-bread.jpg',
      rating: 4.8,
      reviews: 198,
      category: 'Sides',
    },
    {
      id: 'buffalo-wings',
      name: 'Buffalo Wings',
      price: 1290,
      description: '8 pieces of crispy chicken wings tossed in spicy buffalo sauce.',
      image: '/pizzahut/buffalo-wings.jpg',
      rating: 4.7,
      reviews: 223,
      category: 'Sides',
      badge: 'Spicy',
    },
    {
      id: 'loaded-fries',
      name: 'Loaded Fries',
      price: 890,
      description: 'Crispy fries topped with cheese sauce, bacon bits and jalapeños.',
      image: '/pizzahut/loaded-fries.jpg',
      rating: 4.5,
      reviews: 167,
      category: 'Sides',
    },
    {
      id: 'mozzarella-sticks',
      name: 'Mozzarella Sticks',
      price: 990,
      description: '6 pieces of golden fried mozzarella sticks with marinara dip.',
      image: '/pizzahut/mozzarella-sticks.jpg',
      rating: 4.6,
      reviews: 134,
      category: 'Sides',
    },
  ],
  pasta: [
    {
      id: 'creamy-chicken-pasta',
      name: 'Creamy Chicken Pasta',
      price: 1490,
      description: 'Penne pasta with grilled chicken in a creamy alfredo sauce.',
      image: '/pizzahut/creamy-pasta.jpg',
      rating: 4.7,
      reviews: 189,
      category: 'Pasta',
    },
    {
      id: 'spaghetti-bolognese',
      name: 'Spaghetti Bolognese',
      price: 1290,
      description: 'Classic spaghetti with rich beef bolognese sauce.',
      image: '/pizzahut/bolognese.jpg',
      rating: 4.5,
      reviews: 156,
      category: 'Pasta',
    },
    {
      id: 'baked-ziti',
      name: 'Baked Ziti',
      price: 1590,
      description: 'Ziti pasta baked with meat sauce and melted cheese.',
      image: '/pizzahut/baked-ziti.jpg',
      rating: 4.6,
      reviews: 123,
      category: 'Pasta',
    },
  ],
  starters: [
    {
      id: 'chicken-poppers',
      name: 'Chicken Poppers',
      price: 890,
      description: '10 pieces of crispy chicken bites with your choice of dip.',
      image: '/pizzahut/chicken-poppers.jpg',
      rating: 4.4,
      reviews: 145,
      category: 'Starters',
    },
    {
      id: 'nachos-supreme',
      name: 'Nachos Supreme',
      price: 990,
      description: 'Tortilla chips loaded with cheese, jalapeños, salsa and sour cream.',
      image: '/pizzahut/nachos.jpg',
      rating: 4.5,
      reviews: 167,
      category: 'Starters',
    },
    {
      id: 'soup-of-the-day',
      name: 'Soup of the Day',
      price: 590,
      description: 'Ask your server for today\'s freshly prepared soup.',
      image: '/pizzahut/soup.jpg',
      rating: 4.3,
      reviews: 89,
      category: 'Starters',
    },
  ],
  desserts: [
    {
      id: 'cinnamon-sticks',
      name: 'Cinnamon Sticks',
      price: 590,
      description: 'Warm cinnamon sugar breadsticks with vanilla icing.',
      image: '/pizzahut/cinnamon-sticks.jpg',
      rating: 4.6,
      reviews: 156,
      category: 'Desserts',
    },
    {
      id: 'brownie-sundae',
      name: 'Brownie Sundae',
      price: 790,
      description: 'Warm chocolate brownie topped with vanilla ice cream and chocolate sauce.',
      image: '/pizzahut/brownie-sundae.jpg',
      rating: 4.7,
      reviews: 189,
      category: 'Desserts',
    },
  ],
  drinks: [
    {
      id: 'pepsi',
      name: 'Pepsi',
      price: 250,
      description: 'Chilled Pepsi can (330ml)',
      image: '/pizzahut/pepsi.jpg',
      rating: 4.5,
      reviews: 89,
      category: 'Drinks',
    },
    {
      id: 'pepsi-1.5',
      name: 'Pepsi 1.5L',
      price: 450,
      description: 'Family size Pepsi bottle (1.5L)',
      image: '/pizzahut/pepsi-bottle.jpg',
      rating: 4.5,
      reviews: 78,
      category: 'Drinks',
    },
    {
      id: '7up',
      name: '7UP',
      price: 250,
      description: 'Chilled 7UP can (330ml)',
      image: '/pizzahut/7up.jpg',
      rating: 4.4,
      reviews: 67,
      category: 'Drinks',
    },
    {
      id: 'iced-tea',
      name: 'Iced Tea',
      price: 350,
      description: 'Refreshing lemon iced tea',
      image: '/pizzahut/iced-tea.jpg',
      rating: 4.3,
      reviews: 56,
      category: 'Drinks',
    },
  ],
};

// Extra toppings for price calculation
const defaultToppings = [
  { id: 'extra-cheese', name: 'Extra Cheese', price: 250 },
  { id: 'pepperoni', name: 'Pepperoni', price: 300 },
  { id: 'mushrooms', name: 'Mushrooms', price: 200 },
  { id: 'olives', name: 'Black Olives', price: 200 },
  { id: 'jalapenos', name: 'Jalapeños', price: 150 },
  { id: 'onions', name: 'Onions', price: 100 },
  { id: 'bell-peppers', name: 'Bell Peppers', price: 150 },
  { id: 'bacon', name: 'Crispy Bacon', price: 350 },
];

export default function PizzaHutDemoPage() {
  // State
  const [activeCategory, setActiveCategory] = useState('pizza');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isProductSheetOpen, setIsProductSheetOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [orderNumber, setOrderNumber] = useState(0);
  const [tableInfo] = useState<TableInfo | null>({ 
    table: '7', 
    floor: 'Ground Floor' 
  });
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);

  const menuSectionRef = useRef<HTMLDivElement>(null);

  // Get current category items
  const currentItems = menuItemsByCategory[activeCategory] || [];

  // Handle scroll indicator
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 200) {
        setShowScrollIndicator(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll to menu section
  const scrollToMenu = () => {
    menuSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Handle item click
  const handleItemClick = (item: MenuItem) => {
    setSelectedItem(item);
    setIsProductSheetOpen(true);
  };

  // Handle add to cart
  const handleAddToCart = (
    item: MenuItem, 
    quantity: number, 
    selectedSize: SizeOption | null, 
    selectedCrust: CrustOption | null,
    selectedToppings: string[] = []
  ) => {
    // Calculate total price
    let totalPrice = item.price;
    if (selectedSize) {
      totalPrice = selectedSize.price === 0 ? item.price : item.price + selectedSize.price;
    }
    if (selectedCrust && selectedCrust.price > 0) {
      totalPrice += selectedCrust.price;
    }
    
    // Add topping prices
    selectedToppings.forEach(toppingName => {
      const topping = defaultToppings.find(t => t.name === toppingName);
      if (topping) totalPrice += topping.price;
    });

    const newCartItem: CartItem = {
      item,
      quantity,
      selectedSize: selectedSize || undefined,
      selectedCrust: selectedCrust || undefined,
      selectedToppings,
      totalPrice,
    };

    // Check if same item with same customizations exists
    const existingIndex = cartItems.findIndex(ci => 
      ci.item.id === item.id && 
      ci.selectedSize?.id === selectedSize?.id &&
      ci.selectedCrust?.id === selectedCrust?.id &&
      JSON.stringify(ci.selectedToppings.sort()) === JSON.stringify(selectedToppings.sort())
    );

    if (existingIndex >= 0) {
      // Update quantity
      setCartItems(prev => prev.map((ci, idx) => 
        idx === existingIndex 
          ? { ...ci, quantity: ci.quantity + quantity }
          : ci
      ));
    } else {
      setCartItems(prev => [...prev, newCartItem]);
    }

    setIsProductSheetOpen(false);
    setSelectedItem(null);
  };

  // Handle quantity update
  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCartItems(prev => prev.filter(ci => ci.item.id !== itemId));
    } else {
      setCartItems(prev => prev.map(ci => 
        ci.item.id === itemId ? { ...ci, quantity: newQuantity } : ci
      ));
    }
  };

  // Handle add upsell
  const handleAddUpsell = (item: MenuItem) => {
    handleAddToCart(item, 1, null, null, []);
  };

  // Handle confirm order
  const handleConfirmOrder = async (specialInstructions: string) => {
    // Generate order number
    const newOrderNumber = Math.floor(Math.random() * 900) + 100;
    setOrderNumber(newOrderNumber);

    // Submit order to API
    try {
      await fetch('/api/pizzahut/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: newOrderNumber,
          items: cartItems.map(ci => ({
            name: ci.item.name,
            quantity: ci.quantity,
            price: ci.totalPrice,
            customizations: {
              size: ci.selectedSize?.name,
              crust: ci.selectedCrust?.name,
              toppings: ci.selectedToppings,
            },
          })),
          table: tableInfo?.table,
          floor: tableInfo?.floor,
          specialInstructions,
          total: cartItems.reduce((sum, ci) => sum + ci.totalPrice * ci.quantity, 0),
        }),
      });
    } catch (error) {
      console.error('Failed to submit order:', error);
    }

    // Close cart and show success
    setIsCartOpen(false);
    setIsSuccessOpen(true);
  };

  // Handle cancel order
  const handleCancelOrder = () => {
    setIsSuccessOpen(false);
    setCartItems([]);
  };

  // Handle success close
  const handleSuccessClose = () => {
    setIsSuccessOpen(false);
    setCartItems([]);
  };

  // Calculate cart total
  const cartTotal = cartItems.reduce((sum, ci) => sum + ci.totalPrice * ci.quantity, 0);
  const cartItemCount = cartItems.reduce((sum, ci) => sum + ci.quantity, 0);

  return (
    <main className="min-h-screen bg-pizzahut-warmGray">
      {/* Header */}
      <Header 
        cartCount={cartItemCount}
        onCartClick={() => setIsCartOpen(true)}
        tableInfo={tableInfo}
        locationName="Pizza Hut - Union Place"
      />

      {/* Hero */}
      <HeroSection 
        tableInfo={tableInfo}
        onExploreClick={scrollToMenu} 
      />

      {/* Scroll indicator */}
      <AnimatePresence>
        {showScrollIndicator && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex justify-center -mt-6 mb-4 lg:hidden relative z-10"
          >
            <motion.button
              onClick={scrollToMenu}
              className="flex flex-col items-center gap-1 text-pizzahut-red"
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              <span className="text-xs font-medium">Explore Menu</span>
              <ChevronDown className="w-5 h-5" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hot Deals */}
      <DealsCarousel onDealClick={handleItemClick} />

      {/* Menu Section */}
      <section ref={menuSectionRef} className="scroll-mt-20">
        {/* Category Nav */}
        <CategoryNav
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />

        {/* Top Picks (only show for Pizza) */}
        {activeCategory === 'pizza' && (
          <TopPicks onItemClick={handleItemClick} />
        )}

        {/* Menu Grid */}
        <MenuList
          items={currentItems}
          onItemClick={handleItemClick}
        />
      </section>

      {/* Footer */}
      <Footer />

      {/* Product Sheet */}
      <ProductSheet
        item={selectedItem}
        isOpen={isProductSheetOpen}
        onClose={() => {
          setIsProductSheetOpen(false);
          setSelectedItem(null);
        }}
        onAddToCart={handleAddToCart}
      />

      {/* Cart Sheet */}
      <CartSheet
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onAddUpsell={handleAddUpsell}
        onConfirmOrder={handleConfirmOrder}
        tableInfo={tableInfo}
      />

      {/* Success Screen */}
      <SuccessScreen
        isOpen={isSuccessOpen}
        onClose={handleSuccessClose}
        orderNumber={orderNumber}
        tableInfo={tableInfo}
      />

      {/* Floating Cart Button (Mobile) */}
      <AnimatePresence>
        {cartItemCount > 0 && !isCartOpen && !isProductSheetOpen && !isSuccessOpen && (
          <motion.button
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            onClick={() => setIsCartOpen(true)}
            className="fixed bottom-6 left-4 right-4 bg-pizzahut-red text-white py-4 rounded-2xl shadow-lg flex items-center justify-between px-6 z-40 lg:hidden"
          >
            <div className="flex items-center gap-3">
              <ShoppingCart className="w-6 h-6" />
              <div>
                <p className="font-semibold">{cartItemCount} item{cartItemCount > 1 ? 's' : ''}</p>
                <p className="text-xs text-white/80">Tap to view cart</p>
              </div>
            </div>
            <span className="font-bold">LKR {cartTotal.toLocaleString()}</span>
          </motion.button>
        )}
      </AnimatePresence>
    </main>
  );
}
