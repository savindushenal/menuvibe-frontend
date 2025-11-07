# Enterprise Features - Public Menu Ordering System

## Overview
The public menu now supports full ordering functionality with enterprise-level customization for loyalty programs and custom authentication.

## Features by Subscription Tier

### Free Tier
- ✅ Menu viewing only
- ❌ No ordering

### Pro Tier  
- ✅ Menu viewing
- ✅ Basic ordering (name, phone, email)
- ✅ Cart management
- ✅ Order submission
- ❌ No loyalty integration

### Enterprise Tier
- ✅ All Pro features
- ✅ Loyalty number tracking
- ✅ Custom customer authentication hooks
- ✅ Table number tracking
- ✅ Advanced analytics on customer behavior

## Implementation Details

### Frontend Features (`app/menu/[slug]/page.tsx`)

1. **Shopping Cart**
   - Add/remove items with quantity controls
   - Real-time price calculation
   - Persistent cart during session
   - Visual cart badge with item count

2. **Order Form**
   - Customer name (required)
   - Phone number (required)
   - Email (optional)
   - Loyalty number (required for Enterprise)
   - Special instructions/notes
   - Table number (from URL parameter)

3. **Enterprise Loyalty Integration**
   - Conditional loyalty number field
   - Set `requires_loyalty` flag in menu metadata
   - Validates loyalty number before submission
   - Tracks loyalty number with order for rewards

### Backend API (`app/api/public/menu/[id]/route.ts`)

1. **Subscription Validation**
   ```typescript
   // Checks user's subscription plan
   // Only Pro and Enterprise can accept orders
   if (subscription.plan_type === 'pro' || subscription.plan_type === 'enterprise') {
     canAcceptOrders = true;
   }
   ```

2. **Order Data Structure**
   ```sql
   INSERT INTO orders (
     menu_id,
     location_id,
     customer_name,
     customer_phone,
     customer_email,
     loyalty_number,    -- Enterprise feature
     table_number,      -- QR code integration
     total_amount,
     notes,
     status,
     order_date
   )
   ```

3. **Error Handling**
   - Returns `requiresUpgrade: true` if subscription doesn't support ordering
   - Provides clear error messages to customers
   - Suggests contacting restaurant directly

### Database Schema

**New columns added to `orders` table:**
```sql
ALTER TABLE orders 
ADD COLUMN loyalty_number VARCHAR(50) NULL,
ADD COLUMN table_number VARCHAR(20) NULL;

ADD INDEX idx_loyalty_number (loyalty_number);
ADD INDEX idx_table_number (table_number);
```

**Migration file:** `database/add_loyalty_and_table_to_orders.sql`

## Enterprise Customization Guide

### Enabling Loyalty Integration

**Option 1: Menu Metadata (Recommended)**
Add to menu settings in dashboard:
```json
{
  "requires_loyalty": true,
  "loyalty_label": "Member Number",  // Custom label
  "loyalty_validation_pattern": "^[A-Z]{2}\\d{6}$"  // Optional regex
}
```

**Option 2: Restaurant Settings**
Add to business profile:
```json
{
  "features": {
    "loyalty_program": {
      "enabled": true,
      "provider": "custom",  // or "square", "toast", etc.
      "api_endpoint": "https://api.example.com/validate-loyalty"
    }
  }
}
```

### Custom Authentication Hook (Future Enhancement)

For enterprises needing custom customer authentication:

```typescript
// app/menu/[slug]/hooks/useCustomAuth.ts
export function useCustomAuth() {
  const validateCustomer = async (credentials: any) => {
    // Call enterprise's authentication API
    const response = await fetch('/api/enterprise/auth', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    return response.json();
  };

  return { validateCustomer };
}
```

### Loyalty Provider Integration Examples

**Example 1: Barista Chain with Custom Loyalty**
```typescript
// When customer enters loyalty number
const loyaltyNumber = "BC123456";

// Validate with enterprise API
const response = await fetch('/api/loyalty/validate', {
  method: 'POST',
  body: JSON.stringify({ loyaltyNumber, menuId })
});

// Return customer data, points, tier status
const { valid, customerName, points, tier } = await response.json();

// Pre-fill form if valid
if (valid) {
  setOrderForm({
    customerName,
    loyaltyNumber,
    // ... other fields
  });
}
```

**Example 2: Hotel Restaurant with Room Service**
```typescript
// Require room number for hotel guests
const requiresRoomNumber = menu.location?.type === 'hotel';

// Validate room number = loyalty number
if (requiresRoomNumber && !validateRoomNumber(loyaltyNumber)) {
  throw new Error('Invalid room number');
}
```

## Usage Examples

### Standard Customer Flow (Pro/Enterprise)
1. Scan QR code → `/menu/restaurant-slug?table=5`
2. Browse menu items
3. Add items to cart
4. Click floating cart button
5. Review cart, adjust quantities
6. Click "Proceed to Checkout"
7. Fill in contact details
8. Submit order
9. Receive confirmation

### Enterprise Customer Flow (with Loyalty)
1. Scan QR code → `/menu/restaurant-slug?table=5`
2. Browse menu items
3. Add items to cart
4. Click floating cart button
5. Review cart
6. Click "Proceed to Checkout"
7. **Enter loyalty number** (validated)
8. Pre-filled name/contact from loyalty account
9. Submit order with loyalty tracking
10. Earn points/rewards automatically

## Testing

### Test Ordering (Local Development)
```bash
# Start dev server
npm run dev

# Visit menu
http://localhost:3000/menu/your-slug

# Or with table parameter
http://localhost:3000/menu/your-slug?table=5
```

### Test Subscription Restrictions
1. **Free account**: Should only show menu, no "Add to Cart" buttons
2. **Pro account**: Should show cart and ordering functionality
3. **Enterprise account**: Should show cart + loyalty number field

### Test Loyalty Integration
```sql
-- Add loyalty requirement to menu
UPDATE menus 
SET metadata = JSON_OBJECT('requires_loyalty', true)
WHERE id = 3;
```

## Analytics Tracking

Orders include comprehensive tracking:
- Customer information
- Loyalty number (if applicable)
- Table number (from QR code)
- Order timestamp
- Item details and quantities
- Total amount
- Special instructions

Query orders by loyalty number:
```sql
SELECT 
  o.*,
  COUNT(*) as order_count,
  SUM(total_amount) as lifetime_value
FROM orders o
WHERE loyalty_number = 'BC123456'
GROUP BY customer_phone;
```

## Security Considerations

1. **Rate Limiting**: Implement rate limiting on order submission
2. **Validation**: Always validate loyalty numbers server-side
3. **PII Protection**: Secure customer phone/email data
4. **Subscription Check**: Always verify subscription before accepting orders
5. **Fraud Prevention**: Monitor unusual ordering patterns

## Future Enhancements

- [ ] Loyalty point calculation and display
- [ ] Real-time order status tracking
- [ ] Push notifications for order updates
- [ ] Saved customer profiles (for repeat orders)
- [ ] Integration with payment gateways
- [ ] Advanced fraud detection
- [ ] Multi-language support
- [ ] Dietary restriction filters
- [ ] Estimated wait time display
- [ ] Split bill functionality (multiple loyalty numbers)

## Support

For questions about implementing enterprise features:
- Check API documentation
- Review subscription plans
- Test with sample data
- Contact support for custom integrations
