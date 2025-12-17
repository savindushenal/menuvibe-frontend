# 🍕 Pizza Hut SL Demo - Ultimate Digital Dining Experience

> **Objective:** Build a flawless, investor-ready mobile ordering demo for Pizza Hut Sri Lanka that showcases premium UX, seamless ordering, and real-time kitchen integration. This is a "Golden Path" implementation - one perfect flow that demonstrates the future of digital dining.

---

## 📋 Project Context

### Existing Tech Stack (Already in Project)
- **Framework:** Next.js 13.5.1 (App Router)
- **Styling:** Tailwind CSS 3.3.3
- **Animations:** Framer Motion 12.23.24 ✅
- **UI Components:** Radix UI + shadcn/ui
- **Database:** Supabase (for Realtime magic)
- **Proven Pattern:** Barista Demo Implementation ✅

### Routes to Create
```
/app/pizzahut/demo/page.tsx          → Customer Mobile Experience (Dine-in/Takeaway)

/app/pizzahut/admin/page.tsx         → Kitchen Display System (KDS)
```

---

## 🎨 Brand Assets Required

### Before Coding, Gather:
1. **Pizza Hut Logo** - PNG with transparent background (Classic roof logo with "Pizza Hut" text)
2. **Brand Colors** - Official Pizza Hut:
   - **Primary Red:** `#EE3124` (Hero backgrounds, CTAs, brand identity)
   - **Black:** `#000000` (Text, contrast elements)
   - **White:** `#FFFFFF` (Clean backgrounds, text on red)
   - **Warm Yellow:** `#FFD700` (Accents, highlights, deals)
   - **Dark Gray:** `#2D2D2D` (Secondary text)
3. **Font:** Sharp Sans (or fallback to system fonts that match: Montserrat/Poppins)
4. **Product Images** (High-res, appetizing, Steam/cheese pull shots):
   - Pan Pizza (signature)
   - Stuffed Crust Pizza
   - Cheese Lovers Pizza
   - Chicken Supreme
   - Pepperoni Pizza
   - Garlic Bread
   - Chicken Wings
   - Pasta (Creamy/Tomato)
   - Desserts (Chocolate Lava Cake)
   - Beverages (Pepsi, 7UP)
5. **Sound Effects:**
   - Order success chime (`/public/sounds/success.mp3`)
   - New order notification (`/public/sounds/notification.mp3`)
   - Optional: Pizza oven sizzle for ambiance

### Logo Reference:
```
      ╭───────────────────╮
     ╱ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ ╲    ← Red roof shape
    ╱───────────────────────╲
         PIZZA HUT
    
    Font: Sharp Sans Bold, all caps
    Roof: Classic red with yellow outline
```

### Tailwind Brand Colors (Add to tailwind.config.ts):
```typescript
pizzahut: {
  red: '#EE3124',           // Primary brand color (Pizza Hut Red)
  redDark: '#C41E1E',       // Darker shade for hover states
  redLight: '#FF4538',      // Lighter shade for gradients
  black: '#000000',         // Pure black for text
  warmYellow: '#FFD700',    // Accent for deals/highlights
  cream: '#FFF8F0',         // Warm white for cards
  dark: '#2D2D2D',          // Secondary text
  warmGray: '#F5F5F5',      // Background sections
}
```

### Font Configuration:
```css
/* Add to globals.css */
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap');

:root {
  --font-heading: 'Montserrat', 'Sharp Sans', sans-serif;
  --font-body: 'Montserrat', 'Sharp Sans', sans-serif;
}
```

---

## 📱 Screen-by-Screen Implementation

### Screen 1: Landing Page (`/pizzahut/demo`)

#### Layout Structure:
```
┌─────────────────────────────────┐
│ 🍕 PIZZA HUT    [🛒 Cart]       │  ← Sticky Header (white bg, red accents)
│    Colombo 7                    │  ← Location badge
├─────────────────────────────────┤
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │  ← Red gradient hero
│                                 │
│   Hey there, Pizza Lover! 🍕    │  ← Dynamic Greeting (white text)
│   Table 8 • Main Hall           │  ← Table Context
│                                 │
│   "No One OutPizzas The Hut"    │  ← Iconic Tagline
│                                 │
│   [🍕 Dine-In]  [🛵 Delivery]  │  ← Mode Toggle (pills)
│                                 │
├─────────────────────────────────┤
│   🔥 HOT DEALS                  │
│   ┌─────┐ ┌─────┐ ┌─────┐      │  ← Horizontal Scroll
│   │DEAL1│ │DEAL2│ │DEAL3│ →    │  ← Combo offers with savings
│   └─────┘ └─────┘ └─────┘      │
├─────────────────────────────────┤
│   Categories                    │
│   [🍕Pizza] [🍝Pasta] [🍗Sides]│  ← Pills with red accent
│   [🥗Starters] [🍰Desserts] [🥤Drinks]
├─────────────────────────────────┤
│                                 │
│   🍕 PIZZAS                     │
│   ┌─────────────────────────┐  │
│   │ [IMG] Pan Pizza Supreme │  │  ← Feature card
│   │        From LKR 1,990   │  │
│   │        ★★★★★ (156)     │  │
│   └─────────────────────────┘  │
│                                 │
│   🍕 Stuffed Crust Cheese      │  ← Item cards
│   🍕 Pepperoni Passion          │
│   🍕 Chicken BBQ                │
│                                 │
└─────────────────────────────────┘
```

#### Implementation Details:

```tsx
// Dynamic greeting logic - Pizza themed
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning, Pizza Lover!";
  if (hour < 17) return "Hungry for Pizza?";
  if (hour < 21) return "Pizza Time!";
  return "Late Night Cravings?";
};

// Emoji based on time
const getEmoji = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "☀️";
  if (hour < 17) return "🍕";
  if (hour < 21) return "🔥";
  return "🌙";
};
```

#### Hero Section - Pizza Hut Style:
```tsx
// Hero with signature Pizza Hut red gradient
<section className="relative overflow-hidden bg-gradient-to-br from-pizzahut-red via-red-600 to-pizzahut-redDark">
  {/* Subtle pizza pattern overlay */}
  <div className="absolute inset-0 opacity-5 bg-[url('/pizzahut/pattern.png')]" />
  
  {/* Ambient glow effects */}
  <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-400/20 rounded-full blur-3xl" />
  <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500/20 rounded-full blur-3xl" />
  
  {/* Content */}
  <div className="relative z-10 px-5 py-8 md:py-16">
    {/* Greeting + Table Info */}
  </div>
</section>
```

#### Animations Required:
- **Page Load:** Staggered fade-in for sections (Framer Motion)
- **Cards:** Scale on hover/tap (`whileHover={{ scale: 1.02 }}`)
- **Horizontal Scroll:** Smooth momentum scrolling with snap
- **Category Pills:** Red glow on selection
- **Deals:** Subtle pulse animation on "HOT" badge

#### Key UX Decisions:
- ❌ No login required (VIP treatment immediately)
- ❌ No complex menu navigation
- ✅ Pre-set table number from QR code
- ✅ Upsell deals prominently
- ✅ Pizza customization (size, crust, toppings)

---

### Screen 2: Product Detail - Pizza Customization (Modal/Sheet)

#### Trigger:
User taps any pizza card

#### Layout Structure:
```
┌─────────────────────────────────┐
│ [Full-width Pizza Hero Image]   │  ← Cheese pull shot
│   with steam animation          │
│ ═══════════════════════════════ │  ← Drag indicator
├─────────────────────────────────┤
│                                 │
│   Pan Pizza Supreme             │
│   ★★★★★ (156 reviews)          │
│                                 │
│   Loaded with pepperoni,        │
│   mushrooms, peppers, onions    │
│   & our signature sauce         │
│                                 │
│   ─────────────────────────     │
│   Choose Your Size              │
│   ┌───────┐ ┌───────┐ ┌───────┐│
│   │Personal│ │ Medium │ │ Large ││ ← Size selector
│   │Rs.1,290│ │Rs.2,190│ │Rs.3,290││
│   │  7"    │ │  10"   │ │  13"  ││
│   └───────┘ └───────┘ └───────┘│
│                                 │
│   ─────────────────────────     │
│   Choose Your Crust             │
│   ○ Pan (Classic)         +0    │
│   ○ Stuffed Crust     +Rs.350   │
│   ○ Thin & Crispy         +0    │
│   ○ Cheesy Bites      +Rs.450   │
│                                 │
│   ─────────────────────────     │
│   Extra Toppings (Optional)     │
│   □ Extra Cheese      +Rs.250   │
│   □ Jalapeños         +Rs.150   │
│   □ Chicken           +Rs.350   │
│   □ Double Pepperoni  +Rs.400   │
│                                 │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │   Add to Cart • LKR 2,190   │ │  ← Floating CTA (Red)
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

#### Pizza Size Selector Component:

```tsx
interface SizeOption {
  id: string;
  name: string;
  size: string;
  price: number;
}

const sizes: SizeOption[] = [
  { id: 'personal', name: 'Personal', size: '7"', price: 1290 },
  { id: 'medium', name: 'Medium', size: '10"', price: 2190 },
  { id: 'large', name: 'Large', size: '13"', price: 3290 },
];

const SizeSelector = ({ selected, onSelect }: Props) => (
  <div className="grid grid-cols-3 gap-3">
    {sizes.map(size => (
      <motion.button
        key={size.id}
        onClick={() => onSelect(size)}
        className={cn(
          "relative p-4 rounded-2xl border-2 transition-all",
          selected === size.id 
            ? "border-pizzahut-red bg-pizzahut-red/5 shadow-lg shadow-red-500/20"
            : "border-gray-200 bg-white hover:border-pizzahut-red/50"
        )}
        whileTap={{ scale: 0.98 }}
      >
        {selected === size.id && (
          <motion.div
            className="absolute top-2 right-2 w-5 h-5 bg-pizzahut-red rounded-full flex items-center justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          >
            <Check className="w-3 h-3 text-white" />
          </motion.div>
        )}
        <p className="font-bold text-lg">{size.name}</p>
        <p className="text-gray-500 text-sm">{size.size}</p>
        <p className="font-semibold text-pizzahut-red mt-1">
          Rs. {size.price.toLocaleString()}
        </p>
      </motion.button>
    ))}
  </div>
);
```

#### Crust Selector Component:

```tsx
const crusts = [
  { id: 'pan', name: 'Pan (Classic)', price: 0, description: 'Thick, golden & crispy' },
  { id: 'stuffed', name: 'Stuffed Crust', price: 350, description: 'Cheese-filled edge' },
  { id: 'thin', name: 'Thin & Crispy', price: 0, description: 'Light & crunchy' },
  { id: 'cheesy-bites', name: 'Cheesy Bites', price: 450, description: 'Pull-apart cheese crust' },
];

const CrustSelector = ({ selected, onSelect }: Props) => (
  <div className="space-y-3">
    {crusts.map(crust => (
      <motion.button
        key={crust.id}
        onClick={() => onSelect(crust)}
        className={cn(
          "w-full flex items-center justify-between p-4 rounded-xl border transition-all",
          selected === crust.id
            ? "border-pizzahut-red bg-pizzahut-red/5"
            : "border-gray-200 hover:border-pizzahut-red/50"
        )}
        whileTap={{ scale: 0.99 }}
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-5 h-5 rounded-full border-2 flex items-center justify-center",
            selected === crust.id ? "border-pizzahut-red" : "border-gray-300"
          )}>
            {selected === crust.id && (
              <motion.div
                className="w-3 h-3 bg-pizzahut-red rounded-full"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
              />
            )}
          </div>
          <div className="text-left">
            <p className="font-medium">{crust.name}</p>
            <p className="text-gray-500 text-sm">{crust.description}</p>
          </div>
        </div>
        <span className={cn(
          "font-medium",
          crust.price > 0 ? "text-pizzahut-red" : "text-green-600"
        )}>
          {crust.price > 0 ? `+Rs.${crust.price}` : 'Free'}
        </span>
      </motion.button>
    ))}
  </div>
);
```

---

### Screen 3: Cart / Order Review

#### Layout Structure:
```
┌─────────────────────────────────┐
│ ←  Your Order           🗑️     │
├─────────────────────────────────┤
│                                 │
│   🍕 Pan Pizza Supreme     ×1   │
│      Medium • Stuffed Crust     │
│      + Extra Cheese             │
│                        LKR 2,790│
│   [ − ]  1  [ + ]               │
│                                 │
│   🍗 Chicken Wings (6pc)   ×1   │
│                        LKR 890  │
│                                 │
│   ─────────────────────────     │
│                                 │
│   🔥 Complete Your Meal         │  ← Upsell Section
│   ┌─────────────────────────┐   │
│   │ 🥤 Pepsi 1.5L           │   │
│   │    +LKR 450   [Add]     │   │
│   └─────────────────────────┘   │
│   ┌─────────────────────────┐   │
│   │ 🍰 Chocolate Lava Cake  │   │
│   │    +LKR 690   [Add]     │   │
│   └─────────────────────────┘   │
│                                 │
├─────────────────────────────────┤
│   Order Details                 │
│   ─────────────────────────     │
│   📍 Table: 8 (Main Hall)   🔒  │  ← Locked from QR
│   💳 Payment: Pay at Table  ✓   │  ← Pre-selected
│                                 │
│   📝 Special Instructions       │
│   ┌─────────────────────────┐   │
│   │ No onions, extra spicy  │   │  ← Text input
│   └─────────────────────────┘   │
│                                 │
├─────────────────────────────────┤
│   Subtotal          LKR 3,680   │
│   Service Charge        LKR 0   │
│   ─────────────────────────     │
│   Total             LKR 3,680   │
│                                 │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │  ══════🍕────────────────   │ │  ← Slide to Order (Pizza icon)
│ │     Slide to Place Order    │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

#### Slide to Order - Pizza Hut Edition:

```tsx
const SlideToOrder: React.FC<{ onConfirm: () => void }> = ({ onConfirm }) => {
  const [dragX, setDragX] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [isConfirmed, setIsConfirmed] = useState(false);
  
  useEffect(() => {
    if (containerRef.current) {
      setContainerWidth(containerRef.current.offsetWidth);
    }
  }, []);
  
  const maxDrag = containerWidth - 60;
  const threshold = 0.85;
  
  const handleDragEnd = (info: PanInfo) => {
    if (info.point.x > maxDrag * threshold) {
      setIsConfirmed(true);
      
      // Haptic feedback
      navigator.vibrate?.([50, 30, 50]);
      
      setTimeout(() => {
        onConfirm();
      }, 300);
    }
  };
  
  return (
    <motion.div 
      ref={containerRef}
      className="relative h-16 bg-gradient-to-r from-pizzahut-red/20 to-orange-500/20 rounded-full overflow-hidden"
    >
      {/* Progress fill */}
      <motion.div 
        className="absolute inset-y-0 left-0 bg-gradient-to-r from-pizzahut-red/30 to-orange-500/30"
        style={{ width: `${(dragX / maxDrag) * 100}%` }}
      />
      
      {/* Shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
      
      {/* Draggable thumb with pizza icon */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: maxDrag }}
        dragElastic={0}
        onDrag={(_, info) => setDragX(info.point.x)}
        onDragEnd={(_, info) => handleDragEnd(info)}
        className="absolute left-1 top-1 bottom-1 w-14 bg-pizzahut-red rounded-full flex items-center justify-center shadow-lg cursor-grab active:cursor-grabbing"
        whileTap={{ scale: 0.95 }}
      >
        <AnimatePresence mode="wait">
          {isConfirmed ? (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              className="text-white"
            >
              <Check className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.span 
              className="text-2xl"
              animate={{ x: [0, 3, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              🍕
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
      
      {/* Label */}
      <span className="absolute inset-0 flex items-center justify-center text-pizzahut-red font-semibold pointer-events-none">
        Slide to Place Order
      </span>
    </motion.div>
  );
};
```

---

### Screen 4: Success State (The Climax)

#### Layout Structure:
```
┌─────────────────────────────────┐
│                                 │
│                                 │
│         ╭─────────────╮         │
│         │             │         │
│         │     🍕      │         │  ← Animated pizza celebration
│         │      ✓      │         │
│         │             │         │
│         ╰─────────────╯         │
│                                 │
│     Order Sent to Kitchen! 🔥   │
│                                 │
│   Your pizza is being crafted   │
│   with love. We'll bring it     │
│   piping hot to Table 8!        │
│                                 │
│                                 │
│      ─────────────────          │
│                                 │
│      Order #PH-2847             │
│      Estimated: 15-20 mins      │
│                                 │
│                                 │
│   ┌─────────────────────────┐   │
│   │ 🔔 Track Order Status   │   │  ← Optional tracking
│   └─────────────────────────┘   │
│                                 │
├─────────────────────────────────┤
│      I changed my mind          │  ← Cancel option (30s for pizza)
│         Cancel Order            │
└─────────────────────────────────┘
```

#### Animated Pizza Celebration:

```tsx
const PizzaCelebration = () => (
  <div className="relative w-32 h-32 mx-auto">
    {/* Background circle */}
    <motion.div
      className="absolute inset-0 bg-pizzahut-red/10 rounded-full"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    />
    
    {/* Rotating pizza */}
    <motion.div
      className="absolute inset-0 flex items-center justify-center text-6xl"
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ 
        duration: 0.6, 
        delay: 0.2,
        type: "spring",
        stiffness: 200 
      }}
    >
      🍕
    </motion.div>
    
    {/* Checkmark overlay */}
    <motion.div
      className="absolute bottom-0 right-0 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shadow-lg"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.8, type: "spring" }}
    >
      <Check className="w-6 h-6 text-white" />
    </motion.div>
    
    {/* Confetti particles */}
    {[...Array(12)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-2 h-2 rounded-full"
        style={{
          backgroundColor: ['#EE3124', '#FFD700', '#FF6B35', '#00C853'][i % 4],
          top: '50%',
          left: '50%',
        }}
        initial={{ x: 0, y: 0, opacity: 1 }}
        animate={{
          x: Math.cos((i * 30) * Math.PI / 180) * 80,
          y: Math.sin((i * 30) * Math.PI / 180) * 80,
          opacity: 0,
        }}
        transition={{ delay: 0.5, duration: 0.8 }}
      />
    ))}
  </div>
);
```

#### Sound & Haptic Feedback:

```tsx
const SuccessScreen = ({ orderId, tableInfo }: Props) => {
  useEffect(() => {
    // Play success sound
    const audio = new Audio('/sounds/success.mp3');
    audio.volume = 0.5;
    audio.play().catch(() => console.log('Audio blocked'));
    
    // Celebration haptic pattern
    navigator.vibrate?.([100, 50, 100, 50, 200]);
  }, []);
  
  // Cancel window (longer for pizza - 30 seconds)
  const [canCancel, setCanCancel] = useState(true);
  const [countdown, setCountdown] = useState(30);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setCanCancel(false);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  return (/* ... */);
};
```

---

## 💻 Kitchen Display System (KDS) (`/pizzahut/admin`)

### Layout Structure - Pizza Hut Kitchen Theme:
```
┌──────────────────────────────────────────────────────────────┐
│  🍕 PIZZA HUT                        Kitchen Display         │
│     Kitchen Operations                     [🔔 Sound: On]    │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌─────────────────┐ ┌─────────────────┐ ┌────────────────┐│
│   │   📥 NEW (2)    │ │ 👨‍🍳 PREPARING (1)│ │  ✅ READY (3)  ││ ← Kanban lanes
│   └─────────────────┘ └─────────────────┘ └────────────────┘│
│                                                              │
│   ┌────────────────────────────────────────────────────────┐ │
│   │  🆕 NEW ORDER #PH-2847                     Just now    │ │
│   │  ─────────────────────────────────────────────────     │ │
│   │  📍 Table 8 • Main Hall                                │ │
│   │                                                        │ │
│   │  🍕 Pan Pizza Supreme (Medium)                         │ │
│   │     • Stuffed Crust                                    │ │
│   │     • Extra Cheese                                     │ │
│   │                                                        │ │
│   │  🍗 Chicken Wings (6pc)                                │ │
│   │                                                        │ │
│   │  📝 "No onions, extra spicy"                          │ │
│   │                                                        │ │
│   │  Total: LKR 3,680                                      │ │
│   │                                                        │ │
│   │  [🍕 Start Preparing]     [⏱️ 15 mins]                 │ │
│   └────────────────────────────────────────────────────────┘ │
│                                                              │
│   ┌────────────────────────────────────────────────────────┐ │
│   │  👨‍🍳 PREPARING #PH-2843                    5 mins ago  │ │
│   │  ─────────────────────────────────────────────────     │ │
│   │  📍 Table 3 • Window Side                              │ │
│   │                                                        │ │
│   │  🍕 Pepperoni Passion (Large)                          │ │
│   │                                                        │ │
│   │  [✅ Mark Ready for Pickup]    [⏱️ 10 mins remaining]  │ │
│   └────────────────────────────────────────────────────────┘ │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Admin Features:

```tsx
// Order status flow
type OrderStatus = 'pending' | 'preparing' | 'ready' | 'completed';

// Status badge colors - Pizza Hut themed
const statusStyles = {
  pending: 'bg-yellow-500 text-white animate-pulse',
  preparing: 'bg-pizzahut-red text-white',
  ready: 'bg-green-500 text-white',
  completed: 'bg-gray-400 text-white',
};

// Estimated time based on items
const getEstimatedTime = (items: OrderItem[]): number => {
  const hasPizza = items.some(i => i.category === 'Pizza');
  const hasSides = items.some(i => i.category === 'Sides');
  
  if (hasPizza) return 15; // Pizza takes longer
  if (hasSides) return 8;
  return 10;
};
```

---

## 🗄️ Database Schema

### Quick Setup SQL:

```sql
-- Create pizzahut_orders table
CREATE TABLE pizzahut_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id VARCHAR(20) UNIQUE NOT NULL,
  items JSONB NOT NULL,
  table_no VARCHAR(10) NOT NULL,
  floor VARCHAR(50) DEFAULT 'Main Hall',
  location VARCHAR(100) DEFAULT 'Pizza Hut',
  status VARCHAR(20) DEFAULT 'pending',
  total INTEGER NOT NULL,
  special_instructions TEXT,
  payment_method VARCHAR(50) DEFAULT 'pay_at_table',
  estimated_time INTEGER DEFAULT 15,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE pizzahut_orders;

-- Row Level Security (demo mode)
ALTER TABLE pizzahut_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for demo" ON pizzahut_orders
  FOR ALL USING (true) WITH CHECK (true);

-- Indexes for performance
CREATE INDEX idx_pizzahut_orders_status ON pizzahut_orders(status);
CREATE INDEX idx_pizzahut_orders_created ON pizzahut_orders(created_at DESC);
```

---

## 📁 Recommended File Structure

```
/app/pizzahut/
├── demo/
│   ├── page.tsx              # Main customer page
│   ├── layout.tsx            # Mobile-optimized layout
│   └── components/
│       ├── PizzaHutLogo.tsx
│       ├── Header.tsx
│       ├── HeroSection.tsx
│       ├── DealsCarousel.tsx
│       ├── CategoryNav.tsx
│       ├── MenuList.tsx
│       ├── PizzaCard.tsx
│       ├── ProductSheet.tsx
│       ├── SizeSelector.tsx
│       ├── CrustSelector.tsx
│       ├── ToppingsSelector.tsx
│       ├── CartSheet.tsx
│       ├── SlideToOrder.tsx
│       ├── SuccessScreen.tsx
│       └── Footer.tsx
├── admin/
│   ├── page.tsx              # Kitchen Display System
│   └── components/
│       ├── OrderCard.tsx
│       ├── OrderLane.tsx
│       ├── StatusBadge.tsx
│       └── TimeTracker.tsx
└── components/
    ├── PizzaHutLogo.tsx      # Shared logo component
    └── AnimatedPizza.tsx

/public/
├── sounds/
│   ├── success.mp3           # Order confirmation
│   └── notification.mp3      # New order alert
└── pizzahut/
    ├── logo.png
    ├── pattern.png           # Subtle pizza pattern
    ├── pan-pizza.jpg
    ├── stuffed-crust.jpg
    ├── pepperoni.jpg
    ├── chicken-supreme.jpg
    ├── garlic-bread.jpg
    ├── chicken-wings.jpg
    ├── pasta.jpg
    ├── chocolate-lava.jpg
    └── beverages/
        ├── pepsi.jpg
        └── 7up.jpg
```

---

## 🍕 Pizza Hut Menu Data

### Sample Menu Structure:

```tsx
const pizzaMenu: MenuItem[] = [
  // SIGNATURE PIZZAS
  {
    id: 'pan-supreme',
    name: 'Pan Pizza Supreme',
    description: 'Loaded with pepperoni, Italian sausage, mushrooms, green peppers & onions on our signature pan crust.',
    category: 'Pizza',
    basePrice: 1990, // Personal size
    image: '/pizzahut/pan-pizza.jpg',
    rating: 4.9,
    reviews: 156,
    isPopular: true,
    sizes: [
      { id: 'personal', name: 'Personal', size: '7"', price: 1990 },
      { id: 'medium', name: 'Medium', size: '10"', price: 2690 },
      { id: 'large', name: 'Large', size: '13"', price: 3490 },
    ],
    crusts: [
      { id: 'pan', name: 'Pan (Classic)', price: 0 },
      { id: 'stuffed', name: 'Stuffed Crust', price: 350 },
      { id: 'thin', name: 'Thin & Crispy', price: 0 },
      { id: 'cheesy-bites', name: 'Cheesy Bites', price: 450 },
    ],
    extraToppings: [
      { id: 'cheese', name: 'Extra Cheese', price: 250 },
      { id: 'pepperoni', name: 'Double Pepperoni', price: 400 },
      { id: 'chicken', name: 'Grilled Chicken', price: 350 },
      { id: 'jalapenos', name: 'Jalapeños', price: 150 },
    ],
  },
  {
    id: 'pepperoni-passion',
    name: 'Pepperoni Passion',
    description: 'A carnival of pepperoni with mozzarella cheese and our signature tomato sauce.',
    category: 'Pizza',
    basePrice: 1790,
    image: '/pizzahut/pepperoni.jpg',
    rating: 4.8,
    reviews: 203,
    sizes: [/* ... */],
    crusts: [/* ... */],
  },
  {
    id: 'chicken-supreme',
    name: 'Chicken Supreme',
    description: 'Succulent chicken pieces with mushrooms, capsicum, and onions.',
    category: 'Pizza',
    basePrice: 2190,
    image: '/pizzahut/chicken-supreme.jpg',
    rating: 4.7,
    reviews: 134,
    sizes: [/* ... */],
    crusts: [/* ... */],
  },
  
  // SIDES
  {
    id: 'chicken-wings',
    name: 'Chicken Wings',
    description: 'Crispy golden wings with your choice of sauce.',
    category: 'Sides',
    basePrice: 890,
    image: '/pizzahut/chicken-wings.jpg',
    rating: 4.6,
    reviews: 89,
    variants: [
      { id: '6pc', name: '6 Pieces', price: 890 },
      { id: '12pc', name: '12 Pieces', price: 1590 },
    ],
    sauces: ['BBQ', 'Buffalo', 'Honey Mustard'],
  },
  {
    id: 'garlic-bread',
    name: 'Garlic Breadsticks',
    description: 'Warm, buttery breadsticks with garlic seasoning.',
    category: 'Sides',
    basePrice: 590,
    image: '/pizzahut/garlic-bread.jpg',
    rating: 4.8,
    reviews: 167,
  },
  
  // PASTA
  {
    id: 'creamy-pasta',
    name: 'Creamy Chicken Pasta',
    description: 'Al dente pasta in creamy white sauce with grilled chicken.',
    category: 'Pasta',
    basePrice: 1290,
    image: '/pizzahut/pasta.jpg',
    rating: 4.5,
    reviews: 78,
  },
  
  // DESSERTS
  {
    id: 'lava-cake',
    name: 'Chocolate Lava Cake',
    description: 'Warm chocolate cake with molten center, served with ice cream.',
    category: 'Desserts',
    basePrice: 690,
    image: '/pizzahut/chocolate-lava.jpg',
    rating: 4.9,
    reviews: 201,
    isPopular: true,
  },
  
  // BEVERAGES
  {
    id: 'pepsi-1.5',
    name: 'Pepsi 1.5L',
    description: 'Chilled Pepsi to complement your meal.',
    category: 'Drinks',
    basePrice: 450,
    image: '/pizzahut/beverages/pepsi.jpg',
    rating: 4.5,
    reviews: 45,
  },
];

// HOT DEALS
const deals = [
  {
    id: 'family-feast',
    name: 'Family Feast',
    description: '2 Large Pizzas + Wings + Garlic Bread + 1.5L Pepsi',
    originalPrice: 8970,
    dealPrice: 6999,
    savings: 1971,
    image: '/pizzahut/deals/family-feast.jpg',
    badge: 'SAVE 22%',
  },
  {
    id: 'lunch-combo',
    name: 'Lunch Special',
    description: 'Personal Pizza + Wings + Drink',
    originalPrice: 2730,
    dealPrice: 1999,
    savings: 731,
    image: '/pizzahut/deals/lunch-combo.jpg',
    badge: 'LUNCH ONLY',
    validHours: { start: 11, end: 15 },
  },
];
```

---

## 🎬 Animation Guidelines

### Framer Motion Defaults - Pizza Hut Edition:

```tsx
// Shared animation config
export const transitions = {
  spring: { type: "spring", stiffness: 300, damping: 30 },
  smooth: { type: "tween", ease: "easeInOut", duration: 0.3 },
  bounce: { type: "spring", stiffness: 400, damping: 10 },
  pizza: { type: "spring", stiffness: 200, damping: 20 }, // Special for pizza items
};

export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
};

export const pizzaSpin = {
  initial: { opacity: 0, scale: 0.5, rotate: -180 },
  animate: { opacity: 1, scale: 1, rotate: 0 },
  transition: { type: "spring", stiffness: 200, damping: 15 },
};

// Shimmer animation for CTAs
export const shimmer = {
  animate: {
    backgroundPosition: ["200% 0", "-200% 0"],
    transition: { 
      duration: 3, 
      repeat: Infinity,
      ease: "linear" 
    },
  },
};
```

### Key Animation Moments:
1. **Page Load:** Stagger all sections (0.1s delay each)
2. **Pizza Cards:** Slight rotation on tap for playfulness
3. **Size Selection:** Scale + glow effect on selected size
4. **Add to Cart:** Pizza spins into cart with trail
5. **Slide to Order:** Pizza emoji slides with the thumb
6. **Success:** Pizza celebration with confetti burst
7. **Admin New Order:** Slide in with fire/heat effect + notification sound

---

## ⏱️ Development Timeline (4-5 Hours)

### Hour 1: Setup & Assets
- [ ] Create route structure (`/app/pizzahut/demo`, `/app/pizzahut/admin`)
- [ ] Gather Pizza Hut brand assets (logo, colors, images)
- [ ] Set up Tailwind brand colors (`pizzahut-*`)
- [ ] Add font configuration (Sharp Sans / Montserrat fallback)
- [ ] Create PizzaHutLogo component

### Hour 2: Customer UI - Core
- [ ] Build landing page layout with Hero
- [ ] Create category navigation with red accents
- [ ] Build menu cards grid
- [ ] Style everything to look premium "Pizza Hut Red"

### Hour 3: Product Customization
- [ ] Build product detail sheet
- [ ] Implement size selector component
- [ ] Implement crust selector component
- [ ] Implement toppings multi-select
- [ ] Build dynamic price calculator

### Hour 4: Cart & Checkout
- [ ] Build cart sheet with item management
- [ ] Create upsell suggestions
- [ ] Implement special instructions field
- [ ] Build slide-to-order component
- [ ] Create success celebration screen

### Hour 5: Admin & Polish
- [ ] Set up API route for orders
- [ ] Build Kitchen Display System
- [ ] Implement realtime updates (polling fallback)
- [ ] Add sound effects & haptic feedback
- [ ] Test full end-to-end flow
- [ ] Mobile testing & fixes

---

## ✅ Quality Checklist

### Visual Polish
- [ ] Consistent Pizza Hut Red (`#EE3124`) throughout
- [ ] Sharp Sans / Montserrat font applied
- [ ] High-quality pizza images (cheese pull shots!)
- [ ] Smooth 60fps animations
- [ ] Proper loading states with pizza spinner
- [ ] No layout shifts

### Interaction Quality
- [ ] Haptic feedback on add-to-cart
- [ ] Sound effects at order confirmation
- [ ] Optimistic UI updates
- [ ] Error handling (graceful fallbacks)
- [ ] Cancel option works within 30s

### Pizza-Specific UX
- [ ] Size selector is intuitive
- [ ] Crust options clearly explained
- [ ] Price updates dynamically
- [ ] Deals prominently displayed
- [ ] Special instructions field available

### Demo Readiness
- [ ] Works on iPhone Safari
- [ ] Works on Chrome mobile
- [ ] Admin works on laptop Chrome
- [ ] Realtime sync < 2 seconds
- [ ] Sound plays correctly
- [ ] No console errors
- [ ] QR code with table param works

---

## 🚨 Fallback Options

### If Supabase Realtime Fails:
- Use `setInterval` polling every 2 seconds on admin
- Still looks impressive for demo purposes

### If Complex Customization Takes Too Long:
- Start with just size selection
- Add crust selection
- Skip extra toppings for MVP

### If Running Out of Time:
1. **Priority 1:** Customer ordering flow must be flawless
2. **Priority 2:** Pizza customization (size + crust)
3. **Priority 3:** Admin can be simple polling-based

---

## 💡 The "Wow" Moments to Nail

1. **First Impression:** Red gradient hero, Pizza Hut branding on point, premium feel
2. **Pizza Customization:** Selecting size/crust feels like building YOUR pizza
3. **The Slide:** Pizza emoji sliding across = delightful surprise
4. **The Celebration:** Spinning pizza + confetti = emotional payoff
5. **The Magic:** Laptop DINGS when phone orders, pizza appears on KDS
6. **The Details:** Special instructions field shows we understand real dining

---

## 🎯 Success Criteria

> "If I can customize a Pan Pizza Supreme on my phone, slide to order, hear a ding on the kitchen display, and see the order with all customizations appear in under 3 seconds - we win."

**The Pizza Hut Red must pop. The cheese must pull. The experience must sizzle.**

---

## 🍕 Go Build It. Make It Hot. 🔥

No one out-pizzas this demo.
