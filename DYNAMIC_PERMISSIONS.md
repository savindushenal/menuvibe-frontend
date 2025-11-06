# Dynamic Subscription Permission System

## Overview

MenuVibe now uses a **fully dynamic subscription permission system** that reads limits and permissions directly from the database subscription plans. This eliminates hardcoded restrictions and allows you to update subscription limits without changing any code.

## Key Features

✅ **Database-Driven**: All limits come from `subscription_plans.limits` JSON column
✅ **No Hardcoded Limits**: No need to edit code to change subscription features
✅ **Centralized Logic**: All permission checks use `lib/permissions.ts`
✅ **Real-time Updates**: Change limits in database, they apply immediately
✅ **Flexible Plans**: Easy to add new plans or modify existing ones

## Architecture

### 1. Permission System (`lib/permissions.ts`)

Central module that handles all subscription-based permission checks:

```typescript
// Check if user can create a location
const check = await canCreateLocation(userId);
if (!check.allowed) {
  return error(check.reason); // Dynamic error message
}

// Check feature access
const hasAnalytics = await canAccessFeature(userId, 'analytics');
```

### 2. Database Structure

Subscription limits are stored as JSON in `subscription_plans.limits`:

```json
{
  "max_locations": 3,              // -1 = unlimited
  "max_menus_per_location": 5,     // -1 = unlimited
  "max_menu_items_total": -1,      // unlimited
  "max_qr_codes": -1,              // unlimited
  "photo_uploads": true,           // boolean feature
  "custom_qr_codes": true,
  "table_specific_qr": true,
  "analytics": true,
  "advanced_analytics": false,
  "online_ordering": true,
  "api_access": false,
  "white_label": false,
  "priority_support": true,
  "dedicated_support": false
}
```

### 3. API Integration

All creation endpoints now check permissions dynamically:

**Example: Creating a Location**
```typescript
// app/api/locations/route.ts
const permissionCheck = await canCreateLocation(user.id);

if (!permissionCheck.allowed) {
  return NextResponse.json({
    success: false,
    message: permissionCheck.reason, // Dynamic from database
    subscription_limit: true,
    current_count: permissionCheck.current_count,
    limit: permissionCheck.limit
  }, { status: 403 });
}
```

## Permission Functions

### Resource Limits

| Function | Description | Returns |
|----------|-------------|---------|
| `canCreateLocation(userId)` | Check if user can add location | `PermissionCheckResult` |
| `canCreateMenu(userId, locationId)` | Check if user can add menu to location | `PermissionCheckResult` |
| `canCreateMenuItem(userId)` | Check if user can add menu item | `PermissionCheckResult` |
| `canCreateQRCode(userId, options)` | Check if user can create QR code | `PermissionCheckResult` |

### Feature Access

| Function | Description | Returns |
|----------|-------------|---------|
| `canAccessFeature(userId, feature)` | Check if user has feature access | `PermissionCheckResult` |

Supported features:
- `photo_uploads` - Upload images for menu items
- `custom_qr_codes` - Custom QR code designs
- `table_specific_qr` - QR codes with table numbers
- `analytics` - Basic analytics dashboard
- `advanced_analytics` - Advanced reports
- `online_ordering` - Online ordering system
- `api_access` - API access
- `white_label` - White-label branding
- `priority_support` - Priority email support
- `dedicated_support` - Dedicated account manager

### Usage Tracking

| Function | Description | Returns |
|----------|-------------|---------|
| `getUserSubscription(userId)` | Get user's active subscription | `UserSubscriptionInfo` |
| `getUserUsage(userId)` | Get current usage counts | Usage object |
| `getRemainingQuota(userId, resource)` | Get remaining quota for resource | Quota object |

## API Endpoints

### GET /api/subscription/permissions

Get comprehensive subscription info with all permissions and quotas:

```json
{
  "success": true,
  "data": {
    "subscription": {
      "plan_name": "Pro",
      "plan_slug": "pro",
      "is_active": true
    },
    "limits": {
      "max_locations": 3,
      "max_menus_per_location": 5,
      "max_menu_items_total": -1,
      "photo_uploads": true,
      "analytics": true
    },
    "usage": {
      "locations": 2,
      "menus": 8,
      "menu_items": 156,
      "qr_codes": 12
    },
    "quotas": {
      "locations": {
        "current": 2,
        "limit": 3,
        "remaining": 1,
        "unlimited": false,
        "can_create": true
      }
    },
    "features": {
      "photo_uploads": true,
      "analytics": true,
      "advanced_analytics": false,
      "api_access": false
    }
  }
}
```

## How to Update Subscription Plans

### Option 1: SQL Update (Recommended)

Run the provided SQL script in phpMyAdmin:
```sql
UPDATE subscription_plans 
SET 
  limits = '{
    "max_locations": 5,
    "max_menus_per_location": 10,
    "max_menu_items_total": -1,
    "photo_uploads": true,
    "analytics": true
  }'
WHERE slug = 'pro';
```

### Option 2: Admin Interface (Future)

Create an admin panel to manage subscription plans with a UI.

## Benefits

### 1. **Flexibility**
- Change limits without deploying code
- A/B test different pricing tiers
- Create promotional plans instantly

### 2. **Consistency**
- Single source of truth (database)
- All permission checks use same logic
- No conflicting hardcoded values

### 3. **Scalability**
- Easy to add new features
- Simple to create custom enterprise plans
- Support for unlimited users/resources

### 4. **Maintainability**
- Centralized permission logic
- Easy to debug and test
- Clear error messages

## Migration from Hardcoded System

All API routes have been updated:

✅ `app/api/locations/route.ts` - Dynamic location limits
✅ `app/api/menus/route.ts` - Dynamic menu limits
✅ `app/api/menus/[id]/items/route.ts` - Dynamic item limits + photo check
✅ `app/api/qr-codes/route.ts` - Dynamic QR limits + table/custom checks

### Old Way (Hardcoded) ❌
```typescript
if (planSlug === 'free') {
  if (locationCount >= 1) {
    return error('Free plan: max 1 location');
  }
}
```

### New Way (Dynamic) ✅
```typescript
const check = await canCreateLocation(userId);
if (!check.allowed) {
  return error(check.reason); // Message from database
}
```

## Testing

### Test Permission Checks
```bash
# Get user's permissions
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/subscription/permissions

# Try creating location (will check limits)
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name":"New Location", ...}' \
  http://localhost:3000/api/locations
```

### Verify Database Limits
```sql
SELECT 
  name, 
  slug, 
  limits 
FROM subscription_plans 
WHERE is_active = 1;
```

## Error Handling

When limits are exceeded, APIs return:

```json
{
  "success": false,
  "message": "You have reached your limit of 3 location(s). Upgrade to add more locations.",
  "subscription_limit": true,
  "current_count": 3,
  "limit": 3
}
```

Frontend can detect `subscription_limit: true` and show upgrade prompt.

## Future Enhancements

- [ ] Admin dashboard for plan management
- [ ] Usage analytics per plan
- [ ] Automatic upgrade suggestions
- [ ] Grace periods for limit overages
- [ ] Per-feature usage tracking
- [ ] Custom limits for enterprise clients

## Summary

The permission system is now **completely dynamic** and controlled by the database. You can:

1. ✅ Update subscription plans via SQL
2. ✅ Add new features without code changes
3. ✅ Change limits and they apply immediately
4. ✅ Create custom plans for enterprise clients
5. ✅ A/B test different pricing structures

**No code deployment needed to change subscription limits!**
