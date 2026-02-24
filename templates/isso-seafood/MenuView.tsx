'use client';

import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { 
  ShoppingBag, X, MapPin, Star, ChevronRight,
  Fish, UtensilsCrossed, Salad, Sparkles, Plus, Minus, Gift, Loader2, Check
} from 'lucide-react';
import Image from 'next/image';

// Shrimp SVG Icon
const ShrimpIcon = ({className = "w-16 h-16", color}: { className?: string; color?: string }) => (
  <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M42 18C42 18 45 15 48 15C51 15 54 17 54 20C54 23 52 25 49 26L42 28" stroke={color || "currentColor"} strokeWidth="2" strokeLinecap="round"/>
    <path d="M38 22C38 22 40 19 43 19C45 19 47 20 47 22C47 24 46 25 44 26L38 28" stroke={color || "currentColor"} strokeWidth="2" strokeLinecap="round"/>
    <ellipse cx="32" cy="32" rx="18" ry="12" fill={color || "currentColor"} opacity="0.2"/>
    <path d="M50 32C50 38 42 44 32 44C22 44 14 38 14 32C14 26 22 20 32 20C42 20 50 26 50 32Z" stroke={color || "currentColor"} strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M32 44C32 44 28 48 25 50C23 52 20 52 18 50C16 48 16 45 18 43C20 41 24 38 24 38" stroke={color || "currentColor"} strokeWidth="2" strokeLinecap="round"/>
    <circle cx="38" cy="28" r="2" fill={color || "currentColor"}/>
    <circle cx="26" cy="28" r="2" fill={color || "currentColor"}/>
    <path d="M20 32C20 32 22 34 24 34" stroke={color || "currentColor"} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M20 36C20 36 22 38 24 38" stroke={color || "currentColor"} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M44 32C44 32 42 34 40 34" stroke={color || "currentColor"} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M44 36C44 36 42 38 40 38" stroke={color || "currentColor"} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

// Isso Logo Component (Dynamic)
const IssoLogo = ({ logoUrl, brandName, className = "", priority = false }: { logoUrl?: string; brandName?: string; className?: string; priority?: boolean }) => (
  <div className={`flex items-center ${className}`}>
    {logoUrl ? (
      <Image 
        src={logoUrl} 
        alt={brandName || "Isso"} 
        width={160} 
        height={50} 
        className="h-9 md:h-11 w-auto object-contain" 
        priority={priority}
      />
    ) : (
      <span className="text-xl md:text-2xl font-bold">{brandName || "ISSO"}</span>
    )}
  </div>
);

export interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number | string;
  image_url?: string;
  category_id: number;
  is_available: boolean;
  is_featured?: boolean;
  variations?: Array<{
    id: string;
    name: string;
    type: string;
    required: boolean;
    min_selections?: number;
    max_selections?: number;
    options?: Array<{
      id: string;
      name: string;
      price_modifier?: number;
    }>;
  }>;
  customizations?: Array<{
    id: string;
    name: string;
    type: string;
    required: boolean;
    min_selections?: number;
    max_selections?: number;
    options?: Array<{
      id: string;
      name: string;
      price_modifier?: number;
    }>;
  }>;
}

interface Category {
  id: number;
  name: string;
  items: MenuItem[];
}

interface CartItem {
  item: MenuItem;
  quantity: number;
  finalPrice: number;
  selectedOptions: Record<string, string[]>;
}

export default function IssoMenuView() {
  const params = useParams();
  const code = params?.code as string;
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isProductSheetOpen, setIsProductSheetOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVariations, setSelectedVariations] = useState<Record<string, string[]>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  // Slide-to-confirm state
  const sliderRef = useRef<HTMLDivElement>(null);
  const [sliderWidth, setSliderWidth] = useState(0);
  const sliderX = useMotionValue(0);
  const thumbWidth = 56;
  const maxDrag = sliderWidth - thumbWidth - 8;
  const sliderProgress = useTransform(sliderX, [0, maxDrag > 0 ? maxDrag : 1], [0, 1]);
  const sliderBgWidth = useTransform(sliderX, [0, maxDrag > 0 ? maxDrag : 1], ['0%', '100%']);
  const sliderLabelOpacity = useTransform(sliderProgress, [0, 0.3], [1, 0]);

  // Measure slider width
  useEffect(() => {
    const update = () => {
      if (sliderRef.current) setSliderWidth(sliderRef.current.offsetWidth);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [isCartOpen]);

  // Reset slider when cart closes
  useEffect(() => {
    if (!isCartOpen) sliderX.set(0);
  }, [isCartOpen]);

  // Reset animation when product sheet closes
  useEffect(() => {
    if (!isProductSheetOpen) { setIsAdding(false); setIsAdded(false); }
  }, [isProductSheetOpen]);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const response = await fetch(`https://api.menuvire.com/api/menu/${code}`);
        const result = await response.json();
        
        if (result.success) {
          setData(result.data);
          // Extract logo from all possible API sources
          const d = result.data;
          const logo =
            d?.franchise?.design_tokens?.brand?.logo ||
            d?.franchise?.logo_url ||
            d?.business?.logo_url ||
            null;
          setLogoUrl(logo);
        }
      } catch (error) {
        console.error('Error fetching menu:', error);
      } finally {
        setLoading(false);
      }
    };

    if (code) {
      fetchMenu();
    }
  }, [code]);

  const formatPrice = (price: number | string): string => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return numPrice.toFixed(2);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning! 🌅';
    if (hour < 17) return 'Good Afternoon! 🦐';
    return 'Good Evening! 🌊';
  };

  const handleItemClick = (item: MenuItem) => {
    setSelectedItem(item);
    setSelectedVariations({}); // Reset variations for new item
    setIsProductSheetOpen(true);
  };

  const handleAddToCartWithAnimation = async (item: MenuItem) => {
    if (!canAddToCart() || isAdding || isAdded) return;
    setIsAdding(true);
    if (navigator.vibrate) navigator.vibrate(50);
    try {
      const audio = new Audio('/sounds/add-to-cart.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch (e) {}
    await new Promise(r => setTimeout(r, 400));
    setIsAdding(false);
    setIsAdded(true);
    if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
    await new Promise(r => setTimeout(r, 500));
    handleAddToCart(item, 1);
    setIsAdded(false);
  };

  const handleSliderDragEnd = () => {
    const cur = sliderX.get();
    if (cur > maxDrag * 0.75 && maxDrag > 0) {
      sliderX.set(maxDrag);
      if (navigator.vibrate) navigator.vibrate([50, 30, 100]);
      try {
        const audio = new Audio('/sounds/applepay.mp3');
        audio.volume = 0.5;
        audio.play().catch(() => {});
      } catch (e) {}
      setTimeout(() => {
        setIsCartOpen(false);
        sliderX.set(0);
        toast.success('Order confirmed! 🎉', { duration: 3000 });
      }, 400);
    } else {
      sliderX.set(0);
    }
  };

  const handleAddToCart = (item: MenuItem, quantity: number) => {
    const finalPrice = calculateVariationPrice(item, selectedVariations);
    setCartItems(prev => {
      // Match by item id AND selected options (same item with different options = separate cart entry)
      const optionsKey = JSON.stringify(selectedVariations);
      const existingIndex = prev.findIndex(
        ci => ci.item.id === item.id && JSON.stringify(ci.selectedOptions) === optionsKey
      );
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      }
      return [...prev, { item, quantity, finalPrice, selectedOptions: { ...selectedVariations } }];
    });
    setIsProductSheetOpen(false);
    toast.success(`${item.name} added to cart`, {
      description: finalPrice !== (typeof item.price === 'string' ? parseFloat(item.price) : item.price)
        ? `Total: ${data?.menu?.currency || 'LKR'} ${finalPrice.toFixed(2)}`
        : undefined,
      duration: 2000,
    });
  };

  const handleUpdateQuantity = (itemId: number, delta: number) => {
    setCartItems(prev => {
      const updated = prev.map(ci => 
        ci.item.id === itemId ? { ...ci, quantity: Math.max(0, ci.quantity + delta) } : ci
      );
      return updated.filter(ci => ci.quantity > 0);
    });
  };

  const cartTotal = cartItems.reduce((sum, ci) => {
    return sum + (ci.finalPrice * ci.quantity);
  }, 0);

  const cartCount = cartItems.reduce((sum, ci) => sum + ci.quantity, 0);

  // Calculate price with variations AND customizations
  const calculateVariationPrice = (item: MenuItem, variations: Record<string, string[]>): number => {
    let basePrice = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
    
    let totalModifier = 0;
    
    // Add modifiers from variations
    item.variations?.forEach((section: any) => {
      const selectedIds = variations[section.id] || [];
      selectedIds.forEach((optionId: string) => {
        const option = section.options?.find((opt: any) => opt.id === optionId);
        if (option && option.price_modifier) {
          totalModifier += option.price_modifier;
        }
      });
    });

    // Add modifiers from customizations
    item.customizations?.forEach((section: any) => {
      const selectedIds = variations[section.id] || [];
      selectedIds.forEach((optionId: string) => {
        const option = section.options?.find((opt: any) => opt.id === optionId);
        if (option && option.price_modifier) {
          totalModifier += option.price_modifier;
        }
      });
    });
    
    return basePrice + totalModifier;
  };

  const handleVariationSelect = (sectionId: string, optionId: string, isMultiSelect: boolean) => {
    setSelectedVariations(prev => {
      const current = prev[sectionId] || [];
      let updated: string[];
      
      if (isMultiSelect) {
        // Multiple select
        if (current.includes(optionId)) {
          updated = current.filter(id => id !== optionId);
        } else {
          updated = [...current, optionId];
        }
      } else {
        // Single select
        updated = [optionId];
      }
      
      return { ...prev, [sectionId]: updated };
    });
  };

  const canAddToCart = (): boolean => {
    // Check required variations
    const variationsValid = selectedItem?.variations?.every((section: any) => {
      if (section.required) {
        return (selectedVariations[section.id] || []).length > 0;
      }
      return true;
    }) ?? true;

    // Check required customizations
    const customizationsValid = selectedItem?.customizations?.every((section: any) => {
      if (section.required) {
        return (selectedVariations[section.id] || []).length > 0;
      }
      return true;
    }) ?? true;

    return variationsValid && customizationsValid;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#F26522] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-base">Loading menu...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center">
        <div className="text-center">
          <ShrimpIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Menu not found</p>
        </div>
      </div>
    );
  }

  const categories: Category[] = data.menu?.categories || [];
  const brandName = data.franchise?.design_tokens?.brand?.name || 'Isso';
  const brandGreeting = data.franchise?.design_tokens?.brand?.greeting || getGreeting();
  const brandLogo =
    logoUrl ||
    data.franchise?.design_tokens?.brand?.logo ||
    data.franchise?.logo_url ||
    data.business?.logo_url ||
    null;
  const locationName = data.location?.name || 'Main Location';
  
  // Get design tokens colors or use defaults
  const colors = data.franchise?.design_tokens?.colors || {
    primary: '#F26522',
    secondary: '#6DBDB6',
    accent: '#E8F34E',
    background: '#FFF8F0',
    text: '#1A1A1A',
    textLight: '#666666'
  };

  // Get all available items
  const allItems = categories.flatMap(cat => cat.items.filter(item => item.is_available));
  
  // Filter items by search query
  const searchFilteredItems = searchQuery.trim() 
    ? allItems.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allItems;
  
  // Get items filtered by active category and search
  const activeItems = activeCategory && !searchQuery
    ? (categories.find(cat => cat.id === activeCategory)?.items.filter(item => item.is_available) || [])
    : searchFilteredItems;

  const categoryIcons: Record<string, any> = {
    'Appetizers': Fish,
    'Mains': UtensilsCrossed,
    'Salads': Salad,
    'default': Fish
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <motion.header 
        className="sticky top-0 z-50 bg-white border-b border-gray-100"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="bg-[#1A1A1A] text-white px-4 sm:px-6 lg:px-12 py-1.5">
          <div className="flex items-center justify-center gap-2 max-w-7xl mx-auto">
            <MapPin className="w-3.5 h-3.5" style={{ color: colors.primary }} />
            <span className="text-xs font-medium">{locationName}</span>
          </div>
        </div>
        
        <div className="px-4 sm:px-6 lg:px-12 py-3 md:py-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="w-10"></div>
            <IssoLogo 
              logoUrl={brandLogo} 
              brandName={brandName}
              className="lg:absolute lg:left-1/2 lg:-translate-x-1/2"
              priority
            />
            
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ShoppingBag className="w-6 h-6 text-[#1A1A1A]" />
              {cartCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 text-white text-xs w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center font-semibold"
                  style={{ backgroundColor: colors.primary }}
                >
                  {cartCount}
                </motion.span>
              )}
            </button>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <motion.section 
        className="relative px-4 sm:px-6 lg:px-12 py-8 md:py-12 overflow-hidden"
        style={{ backgroundColor: colors.primary }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="absolute top-10 left-10 w-64 h-64 rounded-full blur-3xl opacity-20" style={{ backgroundColor: colors.accent }}></div>
        <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full blur-3xl opacity-20" style={{ backgroundColor: colors.secondary }}></div>
        
        <div className="relative max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8">
            <motion.div 
              className="text-white"
              initial={{ x: -30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-3">
                {brandGreeting}
              </h1>
              <p className="text-lg md:text-xl text-white/90 mb-6">
                Fresh from the ocean, served with love
              </p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Open Now</span>
              </div>
            </motion.div>

            <motion.div
              className="hidden lg:flex items-end justify-end"
              initial={{ x: 30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="bg-white/10 backdrop-blur-md rounded-2xl px-8 py-6 border border-white/20">
                <div className="grid grid-cols-3 gap-6 text-white text-center">
                  <div>
                    <div className="text-3xl font-bold">{allItems.length}+</div>
                    <div className="text-sm text-white/80">Items</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold flex items-center justify-center gap-1">
                      4.9 <Star className="w-5 h-5" style={{ fill: colors.accent, color: colors.accent }} />
                    </div>
                    <div className="text-sm text-white/80">Rating</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold">~5min</div>
                    <div className="text-sm text-white/80">Wait</div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div 
              className="lg:hidden flex items-center justify-between text-white text-center"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div>
                <div className="text-2xl font-bold">{allItems.length}+</div>
                <div className="text-xs text-white/80">Items</div>
              </div>
              <div className="w-px h-10 bg-white/20"></div>
              <div>
                <div className="text-2xl font-bold flex items-center justify-center gap-1">
                  4.9 <Star className="w-4 h-4" style={{ fill: colors.accent, color: colors.accent }} />
                </div>
                <div className="text-xs text-white/80">Rating</div>
              </div>
              <div className="w-px h-10 bg-white/20"></div>
              <div>
                <div className="text-2xl font-bold">~5min</div>
                <div className="text-xs text-white/80">Wait</div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Special Offer */}
      {data.offers && data.offers.length > 0 && (
        <motion.section 
          className="px-4 sm:px-6 lg:px-12 py-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="max-w-7xl mx-auto">
            <motion.div
              className="relative overflow-hidden rounded-2xl cursor-pointer group"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r" style={{ 
                backgroundImage: `linear-gradient(to right, ${colors.primary}, ${colors.primary}dd, ${colors.primary})` 
              }} />
              
              <div className="relative z-10 flex items-center gap-4 p-4">
                {data.offers[0].image_url && (
                  <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden shadow-lg border-2 border-white/20 flex-shrink-0">
                    <Image
                      src={data.offers[0].image_url}
                      alt={data.offers[0].title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="inline-flex items-center gap-1.5 bg-white/20 px-2 py-0.5 rounded-full mb-1.5">
                    <Sparkles className="w-3 h-3" style={{ color: colors.accent }} />
                    <span className="text-[10px] font-semibold text-white uppercase">Special Offer 🦐</span>
                  </div>
                  
                  <h3 className="text-base md:text-lg font-bold text-white leading-tight">
                    {data.offers[0].title}
                  </h3>
                  <p className="text-xs text-white/80 mt-1 line-clamp-1">
                    {data.offers[0].description}
                  </p>
                  
                  {data.offers[0].discount_percentage && (
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: colors.accent, color: colors.text }}>
                        -{data.offers[0].discount_percentage}% OFF
                      </span>
                      {data.offers[0].code && (
                        <span className="text-xs text-white/70">Code: {data.offers[0].code}</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <ChevronRight className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.section>
      )}

      {/* Search Bar */}
      {data.menu?.settings?.allow_search && (
        <motion.section 
          className="px-4 sm:px-6 lg:px-12 py-4 bg-white border-b border-gray-100"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="max-w-7xl mx-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Search menu items..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value) setActiveCategory(null);
                }}
                className="w-full px-4 py-3 pl-12 rounded-xl border-2 focus:outline-none transition-all"
                style={{ 
                  borderColor: searchQuery ? colors.primary : '#E5E5E5',
                  backgroundColor: '#FAFAFA'
                }}
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <ShrimpIcon className="w-5 h-5" color={colors.primary} />
              </div>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-200 transition-colors"
                >
                  <X className="w-4 h-4" style={{ color: colors.text }} />
                </button>
              )}
            </div>
            {searchQuery && (
              <p className="mt-2 text-sm" style={{ color: colors.textLight }}>
                Found {activeItems.length} item{activeItems.length !== 1 ? 's' : ''} matching "{searchQuery}"
              </p>
            )}
          </div>
        </motion.section>
      )}

      {/* Category Navigation */}
      <div className="sticky top-[73px] md:top-[82px] z-40 bg-white border-b border-gray-100 px-4 sm:px-6 lg:px-12 py-4">
        <div className="max-w-7xl mx-auto overflow-x-auto scrollbar-hide">
          <div className="flex gap-3 min-w-max">
            {/* All Items Button */}
            <motion.button
              onClick={() => {
                setActiveCategory(null);
                setSearchQuery(''); // Clear search when selecting All
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all ${
                activeCategory === null
                  ? 'text-white shadow-lg'
                  : 'bg-[#F5F5F5] hover:bg-gray-200'
              }`}
              style={{
                backgroundColor: activeCategory === null ? colors.primary : undefined,
                color: activeCategory === null ? 'white' : colors.text
              }}
            >
              <Sparkles className="w-5 h-5" />
              <span>All Items</span>
            </motion.button>
            
            {categories.map((category) => {
              const IconComponent = categoryIcons[category.name] || categoryIcons.default;
              return (
                <motion.button
                  key={category.id}
                  onClick={() => {
                    setActiveCategory(category.id);
                    setSearchQuery(''); // Clear search when selecting category
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all ${
                    activeCategory === category.id
                      ? 'text-white shadow-lg'
                      : 'bg-[#F5F5F5] hover:bg-gray-200'
                  }`}
                  style={{
                    backgroundColor: activeCategory === category.id ? colors.primary : undefined,
                    color: activeCategory === category.id ? 'white' : colors.text
                  }}
                >
                  <IconComponent className="w-5 h-5" />
                  <span>{category.name}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Menu List */}
      <section className="px-4 sm:px-6 lg:px-12 py-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {activeItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                whileHover={{ y: -2 }}
                onClick={() => handleItemClick(item)}
                className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-lg transition-all cursor-pointer overflow-hidden group"
              >
                <div className="flex gap-4 p-4">
                  {item.image_url && (
                    <div className="relative w-20 h-20 md:w-28 md:h-28 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                      <Image
                        src={item.image_url}
                        alt={item.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-bold text-[#1A1A1A] line-clamp-1 flex-1">
                        {item.name}
                      </h3>
                      <ChevronRight className="hidden md:block w-5 h-5 text-gray-400 flex-shrink-0 transition-colors" style={{ 
                        color: 'inherit' 
                      }} />
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
                      <Star className="w-3 h-3" style={{ fill: colors.accent, color: colors.accent }} />
                      <span>4.7</span>
                    </div>
                    {item.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                    <div className="text-lg md:text-xl font-bold" style={{ color: colors.primary }}>
                      {data.menu?.currency || 'LKR'} {formatPrice(item.price)}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Product Sheet */}
      <AnimatePresence>
        {isProductSheetOpen && selectedItem && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => setIsProductSheetOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-50 max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h3 className="text-xl font-bold text-[#1A1A1A]">Item Details</h3>
                <button
                  onClick={() => setIsProductSheetOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6">
                {selectedItem.image_url && (
                  <div className="relative h-64 rounded-2xl overflow-hidden mb-6" style={{
                    background: `linear-gradient(to bottom right, ${colors.secondary}1A, ${colors.primary}1A)`
                  }}>
                    <Image
                      src={selectedItem.image_url}
                      alt={selectedItem.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}

                <h2 className="text-3xl font-bold text-[#1A1A1A] mb-2">{selectedItem.name}</h2>
                
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="w-4 h-4" style={{ fill: colors.accent, color: colors.accent }} />
                    <span className="font-medium">4.8</span>
                    <span className="text-gray-500">(95 reviews)</span>
                  </div>
                </div>

                {selectedItem.description && (
                  <p className="text-gray-600 text-lg mb-6">{selectedItem.description}</p>
                )}

                <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-200">
                  <span className="text-4xl font-bold" style={{ color: colors.primary }}>
                    {data.menu?.currency || 'LKR'} {formatPrice(calculateVariationPrice(selectedItem, selectedVariations))}
                  </span>
                </div>

                {/* Variations/Customizations Sections */}
                {selectedItem.variations && selectedItem.variations.length > 0 && (
                  <div className="mb-8 space-y-6 pb-6 border-b border-gray-200">
                    {selectedItem.variations.map((section: any) => {
                      const isMultiSelect = section.max_selections !== 1;
                      const selected = selectedVariations[section.id] || [];
                      const isRequired = section.required;
                      const isValidSelection = !isRequired || selected.length > 0;
                      
                      return (
                        <div key={section.id}>
                          <div className="mb-3">
                            <h4 className="font-bold text-lg text-[#1A1A1A]">{section.name}</h4>
                            {isRequired && (
                              <p className="text-xs text-red-500 mt-1">Required</p>
                            )}
                            {!isValidSelection && (
                              <p className="text-xs" style={{ color: colors.primary }}>
                                {section.min_selections > 1 
                                  ? `Select at least ${section.min_selections} options` 
                                  : `Select one option`}
                              </p>
                            )}
                          </div>
                          <div className="space-y-2">
                            {section.options?.map((option: any) => (
                              <label
                                key={option.id}
                                className="flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all"
                                style={{
                                  borderColor: selected.includes(option.id) ? colors.primary : '#E5E5E5',
                                  backgroundColor: selected.includes(option.id) ? `${colors.primary}08` : 'transparent'
                                }}
                              >
                                <input
                                  type={isMultiSelect ? "checkbox" : "radio"}
                                  name={section.id}
                                  value={option.id}
                                  checked={selected.includes(option.id)}
                                  onChange={() => handleVariationSelect(section.id, option.id, isMultiSelect)}
                                  className="w-5 h-5 rounded cursor-pointer"
                                  style={{
                                    accentColor: colors.primary
                                  }}
                                />
                                <div className="flex-1">
                                  <p className="font-medium text-[#1A1A1A]">{option.name}</p>
                                </div>
                                {option.price_modifier !== 0 && (
                                  <span className="font-bold text-sm" style={{ color: colors.primary }}>
                                    {option.price_modifier > 0 ? '+' : ''}
                                    {data.menu?.currency || 'LKR'} {formatPrice(option.price_modifier)}
                                  </span>
                                )}
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Customizations Sections */}
                {selectedItem.customizations && selectedItem.customizations.length > 0 && (
                  <div className="mb-8 space-y-6 pb-6 border-b border-gray-200">
                    {selectedItem.customizations.map((section: any) => {
                      const isMultiSelect = section.max_selections !== 1;
                      const selected = selectedVariations[section.id] || [];
                      const isRequired = section.required;
                      const isValidSelection = !isRequired || selected.length > 0;
                      
                      return (
                        <div key={section.id}>
                          <div className="mb-3">
                            <h4 className="font-bold text-lg text-[#1A1A1A]">{section.name}</h4>
                            {isRequired && (
                              <p className="text-xs text-red-500 mt-1">Required</p>
                            )}
                            {!isValidSelection && (
                              <p className="text-xs" style={{ color: colors.primary }}>
                                {section.min_selections > 1 
                                  ? `Select at least ${section.min_selections} options` 
                                  : `Select one option`}
                              </p>
                            )}
                          </div>
                          <div className="space-y-2">
                            {section.options?.map((option: any) => (
                              <label
                                key={option.id}
                                className="flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all"
                                style={{
                                  borderColor: selected.includes(option.id) ? colors.primary : '#E5E5E5',
                                  backgroundColor: selected.includes(option.id) ? `${colors.primary}08` : 'transparent'
                                }}
                              >
                                <input
                                  type={isMultiSelect ? "checkbox" : "radio"}
                                  name={section.id}
                                  value={option.id}
                                  checked={selected.includes(option.id)}
                                  onChange={() => handleVariationSelect(section.id, option.id, isMultiSelect)}
                                  className="w-5 h-5 rounded cursor-pointer"
                                  style={{
                                    accentColor: colors.primary
                                  }}
                                />
                                <div className="flex-1">
                                  <p className="font-medium text-[#1A1A1A]">{option.name}</p>
                                </div>
                                {option.price_modifier !== 0 && (
                                  <span className="font-bold text-sm" style={{ color: colors.primary }}>
                                    {option.price_modifier > 0 ? '+' : ''}
                                    {data.menu?.currency || 'LKR'} {formatPrice(option.price_modifier)}
                                  </span>
                                )}
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <motion.button
                  onClick={() => handleAddToCartWithAnimation(selectedItem)}
                  disabled={!canAddToCart() || isAdding || isAdded}
                  whileTap={{ scale: 0.97 }}
                  className="w-full text-white py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: isAdded ? '#22c55e' : colors.primary,
                    opacity: (!canAddToCart() && !isAdding && !isAdded) ? 0.5 : 1,
                  }}
                >
                  {isAdding ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : isAdded ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <ShoppingBag className="w-5 h-5" />
                  )}
                  {isAdding ? 'Adding...' : isAdded ? 'Added!' : 'Add to Cart'}
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Cart Sheet */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => setIsCartOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30 }}
              className="fixed top-0 right-0 bottom-0 w-full md:w-96 bg-white shadow-2xl z-50 flex flex-col"
            >
              <div className="text-white px-6 py-5 flex items-center justify-between" style={{ backgroundColor: colors.primary }}>
                <div>
                  <h3 className="text-2xl font-bold">Your Cart</h3>
                  <p className="text-white/90">{cartCount} items</p>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {cartItems.length === 0 ? (
                  <div className="text-center py-16">
                    <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">Your cart is empty</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cartItems.map((ci) => (
                      <div
                        key={`${ci.item.id}-${JSON.stringify(ci.selectedOptions)}`}
                        className="bg-[#FFF8F0] rounded-xl p-4 flex items-center gap-4"
                      >
                        {ci.item.image_url && (
                          <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                            <Image
                              src={ci.item.image_url}
                              alt={ci.item.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold mb-1" style={{ color: colors.text }}>{ci.item.name}</h4>
                          {/* Show selected customization/variation options */}
                          {Object.keys(ci.selectedOptions).length > 0 && (
                            <p className="text-xs text-gray-500 mb-1 truncate">
                              {[...(ci.item.variations || []), ...(ci.item.customizations || [])]
                                .flatMap((section: any) =>
                                  (ci.selectedOptions[section.id] || []).map((optId: string) => {
                                    const opt = section.options?.find((o: any) => o.id === optId);
                                    return opt?.name;
                                  }).filter(Boolean)
                                ).join(', ')}
                            </p>
                          )}
                          <p className="font-bold text-lg" style={{ color: colors.primary }}>
                            {data.menu?.currency || 'LKR'} {formatPrice(ci.finalPrice)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleUpdateQuantity(ci.item.id, -1)}
                            className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center font-bold">
                            {ci.quantity}
                          </span>
                          <button
                            onClick={() => handleUpdateQuantity(ci.item.id, 1)}
                            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                            style={{ backgroundColor: colors.primary }}
                          >
                            <Plus className="w-4 h-4 text-white" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {cartItems.length > 0 && (
                <div className="border-t border-gray-200 p-6" style={{ backgroundColor: `${colors.background}dd` || '#FFF8F0' }}>
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-xl font-bold" style={{ color: colors.text }}>Total</span>
                    <span className="text-3xl font-bold" style={{ color: colors.primary }}>
                      {data.menu?.currency || 'LKR'} {cartTotal.toFixed(2)}
                    </span>
                  </div>
                  {/* Slide to confirm */}
                  <div
                    ref={sliderRef}
                    className="relative h-14 bg-gray-100 rounded-full overflow-hidden select-none"
                  >
                    {/* Fill track */}
                    <motion.div
                      className="absolute inset-y-0 left-0 rounded-full"
                      style={{ width: sliderBgWidth, backgroundColor: colors.primary, opacity: 0.25 }}
                    />
                    {/* Label */}
                    <motion.span
                      style={{ opacity: sliderLabelOpacity }}
                      className="absolute inset-0 flex items-center justify-center text-gray-500 font-semibold text-sm pointer-events-none select-none"
                    >
                      Slide to confirm →
                    </motion.span>
                    {/* Thumb */}
                    <motion.div
                      drag="x"
                      dragConstraints={{ left: 0, right: maxDrag > 0 ? maxDrag : 0 }}
                      dragElastic={0}
                      dragMomentum={false}
                      style={{ x: sliderX, backgroundColor: colors.primary }}
                      onDragEnd={handleSliderDragEnd}
                      className="absolute top-1 left-1 w-12 h-12 rounded-full flex items-center justify-center shadow-lg cursor-grab active:cursor-grabbing z-10"
                    >
                      <ChevronRight className="w-6 h-6 text-white" />
                    </motion.div>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>


    </div>
  );
}
