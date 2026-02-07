# 📁 Custom Templates Directory

This folder contains custom menu templates that developers can create for different franchises.

## 🎯 Purpose

Each franchise can have their own **unique menu design** while using the same API backend. This allows:

- ✅ Custom branding and design
- ✅ Different user experiences
- ✅ Premium templates for paying customers
- ✅ Easy A/B testing of designs
- ✅ Developer marketplace opportunity

---

## 🚀 Quick Start: Create Your Template

### Step 1: Create Template Folder

```bash
templates/
└── your-template-name/
    ├── MenuView.tsx          # Main component (required)
    ├── components/           # Optional sub-components
    │   ├── Header.tsx
    │   ├── ProductCard.tsx
    │   └── Cart.tsx
    ├── styles.css            # Optional custom styles
    └── README.md             # Template documentation
```

### Step 2: Create MenuView.tsx

```typescript
'use client';

import { useState, useEffect } from 'react';

interface YourTemplateProps {
  code: string; // Menu short code from URL
}

export default function YourTemplate({ code }: YourTemplateProps) {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    // Fetch menu data from API
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/menu/${code}`)
      .then(res => res.json())
      .then(result => setData(result.data));
  }, [code]);

  if (!data) return <div>Loading...</div>;

  // Your custom design here!
  return (
    <div>
      <h1>{data.business.name}</h1>
      {/* Your amazing UI */}
    </div>
  );
}
```

### Step 3: Register Template

Edit `lib/template-router.ts`:

```typescript
import YourTemplate from '@/templates/your-template-name/MenuView';

export const TEMPLATE_REGISTRY: Record<string, TemplateInfo> = {
  // ... existing templates
  
  'your-template-name': {
    key: 'your-template-name',
    name: 'Your Template Name',
    description: 'Beautiful template for X type of business',
    developer: 'Your Name',
    isPremium: true, // or false for free
    previewImage: '/templates/your-preview.jpg',
    component: YourTemplate,
  },
};
```

### Step 4: Assign to Franchise

In database, set `menu_endpoints.template_key`:

```sql
UPDATE menu_endpoints 
SET template_key = 'your-template-name'
WHERE short_code = 'DEMO123';
```

---

## 📋 API Reference

### Fetch Menu Data

```typescript
const response = await fetch(`${API_URL}/menu/${code}`);
const result = await response.json();

// Result structure:
{
  success: true,
  data: {
    menu: { categories: [...] },
    offers: [...],
    business: { name, logo_url, colors, ... },
    endpoint: { name, short_code, ... },
    template: {
      currency: 'Rs.',
      config: {
        design: {
          colors: { primary, secondary, background, text, accent },
          typography: { fontFamily, headingWeight, bodyWeight },
          spacing: { container, section, card },
          borderRadius: { small, medium, large }
        },
        components: [...],
        features: { cart, search, loyalty, ordering, payment },
        businessRules: { priceModifiers, availability, ordering }
      }
    }
  }
}
```

### Cart Operations (Future API)

```typescript
// Add to cart
await fetch(`${API_URL}/cart/add`, {
  method: 'POST',
  body: JSON.stringify({
    menu_code: code,
    item_id: itemId,
    quantity: 1
  })
});

// Submit order (routes to franchise's POS)
await fetch(`${API_URL}/orders/submit`, {
  method: 'POST',
  body: JSON.stringify({
    menu_code: code,
    items: cart,
    customer: { name, phone, email },
    payment_method: 'card'
  })
});
```

---

## 🎨 Example Templates

### 1. Default Template
- **Location:** `components/menu/ApiDrivenMenu.tsx`
- **Type:** Free
- **Best for:** All business types
- **Features:** Fully API-driven, dynamic components

### 2. Premium Cafe
- **Location:** `templates/premium-cafe/MenuView.tsx`
- **Type:** Premium example
- **Best for:** Coffee shops, cafes
- **Features:** Gradient hero, floating cart, animations

### 3. Your Template Here!
Create your own and add to this list!

---

## ✅ Template Checklist

When creating a template, ensure:

- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Fetches data from API (not hardcoded)
- [ ] Uses config.design colors from API
- [ ] Handles loading and error states
- [ ] Cart functionality (if features.cart = true)
- [ ] Search functionality (if features.search = true)
- [ ] Accessibility (ARIA labels, keyboard nav)
- [ ] Performance optimized (lazy loading images)
- [ ] Preview image for template gallery
- [ ] Documentation (README in template folder)

---

## 🔐 Business Rules Integration

Your template should respect business rules from API:

```typescript
// Check if feature is enabled
if (config.features.cart) {
  // Show cart functionality
}

if (config.features.loyalty) {
  // Show loyalty points
}

// Check ordering rules
if (config.businessRules.ordering.enabled) {
  const minOrder = config.businessRules.ordering.min_order_amount;
  // Enforce minimum order
}

// Check inventory
if (config.businessRules.availability.check_inventory) {
  // Disable unavailable items
}
```

---

## 🎯 Best Practices

### 1. Use API Configuration

```typescript
// ✅ Good - Uses API colors
<div style={{ backgroundColor: config.design.colors.primary }}>

// ❌ Bad - Hardcoded
<div style={{ backgroundColor: '#3B82F6' }}>
```

### 2. Handle All States

```typescript
if (loading) return <LoadingSpinner />;
if (error) return <ErrorMessage />;
if (!data) return <NotFound />;
return <YourMenu />;
```

### 3. Mobile-First Design

```typescript
// Use responsive classes
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
```

### 4. Performance

```typescript
// Lazy load images
<img loading="lazy" src={item.image_url} />

// Memoize expensive calculations
const cartTotal = useMemo(() => 
  cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
  [cart]
);
```

---

## 💰 Monetization

### Free Templates
- Basic designs
- Standard features
- Community support

### Premium Templates ($)
- Advanced animations
- Custom integrations
- Priority support
- Exclusive features

### Enterprise Templates ($$)
- White-label ready
- Custom development
- Dedicated support
- Source code access

---

## 🚀 Publishing Your Template

1. **Test thoroughly** - Test with different data
2. **Document well** - Create README with screenshots
3. **Add preview** - Include preview image
4. **Submit PR** - Or add to marketplace
5. **Set pricing** - Free or premium
6. **Market it** - Share with community

---

## 📞 Support

- **Documentation:** `/DEVELOPER_GUIDE.md`
- **Examples:** See `premium-cafe/` template
- **API Docs:** `/API_DRIVEN_ARCHITECTURE.md`

Happy coding! 🎉
