# Subscription Permission System - Quick Reference

## ✅ What Changed

Your subscription system is now **100% dynamic** - all permissions are read from the database, not hardcoded in the code.

## 🎯 Key Benefits

1. **Update Limits Without Code Deployment**
   - Change subscription limits in the database
   - Changes apply immediately
   - No need to redeploy frontend

2. **Single Source of Truth**
   - All limits stored in `subscription_plans.limits` (JSON)
   - All API routes use the same permission checker
   - Consistent behavior across the app

3. **Easy to Scale**
   - Add new plans without touching code
   - Create custom enterprise plans on-demand
   - A/B test different pricing tiers

## 📁 Files Created/Updated

### New Files
- ✅ `lib/permissions.ts` - Central permission system
- ✅ `app/api/subscription/permissions/route.ts` - Permission info endpoint
- ✅ `DYNAMIC_PERMISSIONS.md` - Full documentation
- ✅ `database/update_subscription_plans_phpmyadmin.sql` - SQL update script

### Updated API Routes
- ✅ `app/api/locations/route.ts` - Dynamic location limits
- ✅ `app/api/menus/route.ts` - Dynamic menu limits  
- ✅ `app/api/menus/[id]/items/route.ts` - Dynamic item limits + photo uploads
- ✅ `app/api/qr-codes/route.ts` - Dynamic QR limits + table/custom features

## 🚀 Quick Start

### 1. Update Database Plans

Run this in phpMyAdmin:
```bash
# Use the SQL file we created
database/update_subscription_plans_phpmyadmin.sql
```

### 2. Test Permission System

```bash
# Get user permissions
GET /api/subscription/permissions

# Response shows all limits, usage, and features
{
  "subscription": { "plan_name": "Pro" },
  "limits": { "max_locations": 3, ... },
  "usage": { "locations": 2, ... },
  "quotas": { "locations": { "remaining": 1 } },
  "features": { "analytics": true, ... }
}
```

### 3. Create Resources

When users try to create locations/menus/items/QR codes:
- ✅ System automatically checks database limits
- ✅ Returns clear error if limit exceeded
- ✅ Suggests upgrade to higher plan

## 🎨 Example: Change Pro Plan Limits

**Before (Hardcoded):** Edit code, redeploy
```typescript
if (planSlug === 'pro' && locations >= 3) error();
```

**After (Dynamic):** Update database
```sql
UPDATE subscription_plans 
SET limits = '{"max_locations": 5, ...}'
WHERE slug = 'pro';
```

Changes apply **immediately** - no code deployment!

## 📊 Current Plan Structure

| Plan | Locations | Menus/Location | Items | QR Codes | Price |
|------|-----------|----------------|-------|----------|-------|
| Free | 1 | 1 | 30 | 1 | $0 |
| Pro | 3 | 5 | Unlimited | Unlimited | $29 |
| Enterprise | 10 | Unlimited | Unlimited | Unlimited | $99 |
| Custom | Unlimited | Unlimited | Unlimited | Unlimited | Contact |

## 🔧 How It Works

```mermaid
User creates resource
    ↓
API endpoint receives request
    ↓
Call canCreate*(userId) from lib/permissions.ts
    ↓
Query database for user's subscription & limits
    ↓
Compare current usage vs limits
    ↓
Allow/Deny with dynamic message
```

## 📝 Common Tasks

### Add New Feature to Plans

1. Update database:
```sql
UPDATE subscription_plans 
SET limits = JSON_SET(limits, '$.new_feature', true)
WHERE slug = 'enterprise';
```

2. Check in code:
```typescript
const canUse = await canAccessFeature(userId, 'new_feature');
```

### Create Custom Enterprise Plan

```sql
INSERT INTO subscription_plans (name, slug, limits, ...) 
VALUES ('Custom Acme Corp', 'acme-custom', '{
  "max_locations": -1,
  "custom_feature": true
}', ...);
```

### View User's Current Permissions

```typescript
GET /api/subscription/permissions
```

## ⚡ Performance Notes

- Permission checks are **async** (database queries)
- Results could be cached for better performance
- Consider Redis cache for high-traffic apps

## 🐛 Debugging

### Check User's Subscription
```sql
SELECT us.*, sp.name, sp.limits
FROM user_subscriptions us
JOIN subscription_plans sp ON us.plan_id = sp.id
WHERE us.user_id = ? AND us.is_active = 1;
```

### Verify Permission Functions Work
```typescript
import { canCreateLocation } from '@/lib/permissions';
const result = await canCreateLocation(userId);
console.log(result); // { allowed: true/false, reason: "..." }
```

## 📚 Documentation

See `DYNAMIC_PERMISSIONS.md` for comprehensive documentation including:
- All permission functions
- API endpoint details
- Migration guide
- Testing instructions
- Future enhancements

## ✨ Summary

**Before:** Hardcoded limits scattered across API routes
**After:** Centralized, database-driven permission system

**Impact:** You can now change subscription limits and features without deploying code!
