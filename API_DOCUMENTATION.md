# MenuVibe API Documentation

## API Architecture Overview

### Technology Stack
- **Framework**: Next.js 13+ API Routes (App Router)
- **ORM**: Prisma 6.19.0
- **Database**: MySQL (via Prisma Client)
- **Authentication**: JWT Bearer Tokens
- **File Storage**: Vercel Blob Storage
- **Response Format**: JSON

---

## 1. API Standards & Conventions

### Base URL
```
Production: https://yourdomain.com/api
Development: http://localhost:3000/api
```

### Request Headers
```http
Content-Type: application/json
Accept: application/json
Authorization: Bearer {jwt_token}
X-Requested-With: XMLHttpRequest
```

### Standard Response Format

#### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response payload
  },
  "meta": {
    // Optional metadata (pagination, counts, limits, etc.)
  }
}
```

#### Error Response
```json
{
  "success": false,
  "message": "Error description for user",
  "error": "Technical error details (dev mode only)",
  "errors": {
    // Field-specific validation errors
    "email": ["Email is required", "Email must be valid"],
    "password": ["Password must be at least 8 characters"]
  }
}
```

### HTTP Status Codes
- `200` - Success (GET, PUT, PATCH)
- `201` - Created (POST)
- `204` - No Content (DELETE)
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions/subscription limits)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `422` - Unprocessable Entity (validation failed)
- `429` - Too Many Requests (rate limiting)
- `500` - Internal Server Error
- `501` - Not Implemented (feature requires additional setup)

---

## 2. Authentication API

### Register New User
```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "password_confirmation": "SecurePass123!",
  "restaurantName": "John's Pizza" // Optional
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": {
      "id": "1234567890",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": null,
      "created_at": "2025-11-14T10:00:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Auto-Created Resources:**
- Default Location ("Main Location" or restaurant name)
- User Settings
- Free Subscription Plan
- Business Profile (if restaurant name provided)

---

### Login
```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "1234567890",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "subscription": {
      "plan_name": "Pro",
      "plan_slug": "pro",
      "limits": {
        "max_locations": 10,
        "max_menus_per_location": 5,
        "max_menu_items_total": -1,
        "photo_uploads": true
      }
    },
    "settings": {
      "theme": "light",
      "language": "en",
      "timezone": "America/New_York"
    }
  }
}
```

---

### Google OAuth Callback
```http
POST /api/auth/google/callback
```

**Request Body:**
```json
{
  "code": "google_auth_code_here",
  "redirectUri": "http://localhost:3000/auth/google/callback"
}
```

**Response:** Same as login response

---

### Forgot Password
```http
POST /api/auth/forgot-password
```

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "If an account exists with this email, you will receive a password reset link."
}
```

**Note:** Always returns success to prevent email enumeration

---

### Logout
```http
POST /api/auth/logout
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Note:** JWT tokens are stateless, so logout is client-side. This endpoint confirms the action.

---

## 3. User Management API

### Get Current User Profile
```http
GET /api/user
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "1234567890",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "created_at": "2025-11-14T10:00:00Z"
    }
  }
}
```

---

## 4. Location Management API

### List All Locations
```http
GET /api/locations
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "locations": [
      {
        "id": "1",
        "user_id": "1234567890",
        "name": "Main Restaurant",
        "description": "Our flagship location",
        "address_line_1": "123 Main St",
        "address_line_2": "Suite 100",
        "city": "New York",
        "state": "NY",
        "postal_code": "10001",
        "country": "US",
        "phone": "+1234567890",
        "email": "contact@restaurant.com",
        "website": "https://restaurant.com",
        "cuisine_type": "italian",
        "seating_capacity": 50,
        "logo_url": "https://blob.vercel-storage.com/logo.png",
        "primary_color": "#FF5733",
        "secondary_color": "#C70039",
        "is_active": true,
        "is_default": true,
        "operating_hours": {
          "monday": { "open": "09:00", "close": "22:00" },
          "tuesday": { "open": "09:00", "close": "22:00" }
        },
        "services": ["dine_in", "takeout", "delivery"],
        "social_media": {
          "facebook": "https://facebook.com/restaurant",
          "instagram": "@restaurant"
        },
        "created_at": "2025-11-14T10:00:00Z",
        "updated_at": "2025-11-14T10:00:00Z"
      }
    ]
  },
  "meta": {
    "total": 1,
    "can_add_location": true,
    "remaining_quota": 9,
    "max_locations": 10
  }
}
```

---

### Create Location
```http
POST /api/locations
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Request Body (FormData):**
```
name: "Downtown Branch"
description: "Our new downtown location"
address_line_1: "456 Park Ave"
city: "New York"
state: "NY"
postal_code: "10002"
country: "US"
phone: "+1234567890"
email: "downtown@restaurant.com"
cuisine_type: "italian"
seating_capacity: 75
logo: [File]
operating_hours: {"monday": {"open": "09:00", "close": "22:00"}}
services: ["dine_in", "takeout"]
```

**Response (201):**
```json
{
  "success": true,
  "message": "Location created successfully",
  "data": {
    "location": {
      "id": "2",
      "name": "Downtown Branch",
      // ... full location object
    }
  },
  "meta": {
    "can_add_location": true,
    "remaining_quota": 8,
    "max_locations": 10
  }
}
```

**Error Response (403 - Subscription Limit):**
```json
{
  "success": false,
  "message": "You have reached your limit of 1 location(s). Upgrade to add more locations.",
  "error": {
    "code": "SUBSCRIPTION_LIMIT_REACHED",
    "current_count": 1,
    "limit": 1,
    "upgrade_required": true,
    "feature": "max_locations"
  }
}
```

---

### Get Single Location
```http
GET /api/locations/{id}
Authorization: Bearer {token}
```

**Response (200):** Single location object

---

### Update Location
```http
PUT /api/locations/{id}
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Request Body:** Same as create (only changed fields needed)

**Response (200):**
```json
{
  "success": true,
  "message": "Location updated successfully",
  "data": {
    "location": { /* updated location */ }
  }
}
```

---

### Delete Location
```http
DELETE /api/locations/{id}
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Location deleted successfully"
}
```

**Error (403):**
```json
{
  "success": false,
  "message": "Cannot delete default location"
}
```

---

### Set Default Location
```http
POST /api/locations/{id}/set-default
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Default location updated successfully",
  "data": {
    "location": { /* updated location */ }
  }
}
```

---

## 5. Menu Management API

### List Menus
```http
GET /api/menus?location_id={location_id}
Authorization: Bearer {token}
```

**Query Parameters:**
- `location_id` (optional) - Filter by location

**Response (200):**
```json
{
  "success": true,
  "data": {
    "menus": [
      {
        "id": "1",
        "location_id": "1",
        "name": "Lunch Menu",
        "slug": "lunch-menu-abc123",
        "description": "Our delicious lunch offerings",
        "currency": "USD",
        "is_active": true,
        "style": {
          "theme": "modern",
          "primaryColor": "#FF5733",
          "fontFamily": "Poppins"
        },
        "background_image_url": "https://blob.vercel-storage.com/bg.jpg",
        "qr_code_url": "https://yourdomain.com/menu/lunch-menu-abc123",
        "public_url": "https://yourdomain.com/menu/lunch-menu-abc123",
        "created_at": "2025-11-14T10:00:00Z",
        "updated_at": "2025-11-14T10:00:00Z",
        "location": {
          "id": "1",
          "name": "Main Restaurant"
        }
      }
    ]
  }
}
```

---

### Create Menu
```http
POST /api/menus
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Request Body:**
```
name: "Dinner Menu"
location_id: "1"
description: "Evening fine dining"
currency: "USD"
style: {"theme": "elegant", "primaryColor": "#000000"}
background_image: [File]
```

**Response (201):**
```json
{
  "success": true,
  "message": "Menu created successfully",
  "data": {
    "menu": {
      "id": "2",
      "slug": "dinner-menu-xyz789",
      "name": "Dinner Menu",
      // ... full menu object
    }
  },
  "meta": {
    "can_add_menu": true,
    "remaining_quota": 4,
    "max_menus_per_location": 5
  }
}
```

---

### Get Menu by ID
```http
GET /api/menus/{id}
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "menu": {
      "id": "1",
      "name": "Lunch Menu",
      // ... full menu details
      "location": { /* location object */ },
      "categories": [
        {
          "id": "1",
          "name": "Appetizers",
          "description": "Start your meal right",
          "sort_order": 0,
          "background_color": "#F5F5F5",
          "text_color": "#000000",
          "heading_color": "#FF5733"
        }
      ],
      "items": [
        {
          "id": "1",
          "category_id": "1",
          "name": "Bruschetta",
          "description": "Fresh tomatoes, basil, olive oil",
          "price": 8.99,
          "image_url": "https://blob.vercel-storage.com/bruschetta.jpg",
          "is_available": true,
          "is_featured": true,
          "dietary_info": ["vegetarian", "vegan"],
          "sort_order": 0,
          "card_color": "#FFFFFF",
          "heading_color": "#000000",
          "text_color": "#333333"
        }
      ]
    }
  }
}
```

---

### Get Menu by Slug
```http
GET /api/menus/{slug}/slug
Authorization: Bearer {token}
```

**Response:** Same as Get Menu by ID

---

### Update Menu
```http
PUT /api/menus/{id}
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Request Body:** Same as create (only changed fields)

**Response (200):**
```json
{
  "success": true,
  "message": "Menu updated successfully",
  "data": {
    "menu": { /* updated menu */ }
  }
}
```

---

### Delete Menu
```http
DELETE /api/menus/{id}
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Menu deleted successfully"
}
```

---

## 6. Menu Items API

### List Menu Items
```http
GET /api/menus/{menu_id}/items
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "1",
        "menu_id": "1",
        "category_id": "1",
        "name": "Margherita Pizza",
        "description": "Classic tomato, mozzarella, basil",
        "price": 12.99,
        "image_url": "https://blob.vercel-storage.com/pizza.jpg",
        "is_available": true,
        "is_featured": false,
        "dietary_info": ["vegetarian"],
        "allergens": ["gluten", "dairy"],
        "calories": 850,
        "prep_time": 15,
        "spice_level": 0,
        "sort_order": 0,
        "card_color": "#FFFFFF",
        "heading_color": "#000000",
        "text_color": "#333333",
        "created_at": "2025-11-14T10:00:00Z",
        "category_name": "Pizzas"
      }
    ]
  },
  "meta": {
    "total": 15,
    "can_add_item": true,
    "remaining_quota": -1,
    "max_items": -1
  }
}
```

---

### Create Menu Item
```http
POST /api/menus/{menu_id}/items
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Request Body:**
```
name: "Caesar Salad"
description: "Romaine, parmesan, croutons, caesar dressing"
price: 9.99
category_id: "2"
image: [File]
is_available: true
is_featured: false
dietary_info: ["vegetarian"]
allergens: ["dairy", "gluten"]
calories: 450
prep_time: 10
spice_level: 0
```

**Response (201):**
```json
{
  "success": true,
  "message": "Menu item created successfully",
  "data": {
    "item": {
      "id": "16",
      "name": "Caesar Salad",
      // ... full item object
    }
  },
  "meta": {
    "can_add_item": true,
    "remaining_quota": -1
  }
}
```

**Error (403 - Subscription Limit):**
```json
{
  "success": false,
  "message": "You have reached your limit of 50 menu items. Upgrade to add more items.",
  "error": {
    "code": "SUBSCRIPTION_LIMIT_REACHED",
    "current_count": 50,
    "limit": 50,
    "upgrade_required": true,
    "feature": "max_menu_items_total"
  }
}
```

---

### Get Single Menu Item
```http
GET /api/menus/{menu_id}/items/{item_id}
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "item": {
      "id": "1",
      "menu_id": "1",
      "category_id": "1",
      "name": "Margherita Pizza",
      "description": "Classic tomato, mozzarella, basil",
      "price": 12.99,
      "image_url": "https://blob.vercel-storage.com/pizza.jpg",
      "is_available": true,
      "is_featured": false,
      "dietary_info": ["vegetarian"],
      "allergens": ["gluten", "dairy"],
      "calories": 850,
      "prep_time": 15,
      "spice_level": 0,
      "sort_order": 0,
      "card_color": "#FFFFFF",
      "heading_color": "#000000",
      "text_color": "#333333",
      "created_at": "2025-11-14T10:00:00Z",
      "category_name": "Pizzas"
    }
  }
}
```

**Error (404):**
```json
{
  "success": false,
  "message": "Menu item not found"
}
```

---

### Update Menu Item
```http
PUT /api/menus/{menu_id}/items/{item_id}
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Request Body:** Same as create (only changed fields)

**Response (200):**
```json
{
  "success": true,
  "message": "Menu item updated successfully",
  "data": {
    "item": { /* updated item */ }
  }
}
```

---

### Delete Menu Item
```http
DELETE /api/menus/{menu_id}/items/{item_id}
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Menu item deleted successfully"
}
```

---

## 7. Menu Categories API

### List Categories
```http
GET /api/menus/{menu_id}/categories
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": "1",
        "menu_id": "1",
        "name": "Appetizers",
        "description": "Start your meal",
        "background_color": "#F5F5F5",
        "text_color": "#000000",
        "heading_color": "#FF5733",
        "sort_order": 0,
        "created_at": "2025-11-14T10:00:00Z"
      }
    ]
  }
}
```

---

### Create Category
```http
POST /api/menus/{menu_id}/categories
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "name": "Desserts",
  "description": "Sweet endings",
  "background_color": "#FFF5E1",
  "text_color": "#333333",
  "heading_color": "#8B4513",
  "sort_order": 4
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Category created successfully",
  "data": {
    "category": {
      "id": "5",
      "name": "Desserts",
      // ... full category object
    }
  }
}
```

---

### Update Category
```http
PUT /api/menus/{menu_id}/categories/{category_id}
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Category updated successfully",
  "data": {
    "category": { /* updated category */ }
  }
}
```

---

### Delete Category
```http
DELETE /api/menus/{menu_id}/categories/{category_id}
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Category deleted successfully"
}
```

**Error (400 - Has Items):**
```json
{
  "success": false,
  "message": "Cannot delete category with 5 items. Please reassign or delete the items first.",
  "error": {
    "code": "CATEGORY_HAS_ITEMS",
    "item_count": 5
  }
}
```

---

## 8. Subscription Management API

### Get Current Subscription
```http
GET /api/subscriptions/current
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "subscription": {
      "id": "1",
      "user_id": "1234567890",
      "plan_name": "Pro",
      "plan_slug": "pro",
      "status": "active",
      "is_active": true,
      "starts_at": "2025-11-14T00:00:00Z",
      "ends_at": null,
      "created_at": "2025-11-14T10:00:00Z",
      "limits": {
        "max_locations": 10,
        "max_menus_per_location": 5,
        "max_menu_items_total": -1,
        "max_qr_codes": -1,
        "photo_uploads": true,
        "custom_qr_codes": true,
        "table_specific_qr": true,
        "analytics": true,
        "advanced_analytics": true,
        "online_ordering": true,
        "api_access": false,
        "white_label": false,
        "priority_support": true
      },
      "features": {
        "photo_uploads": true,
        "analytics": true,
        "online_ordering": true
      },
      "price": 29.99,
      "billing_period": "monthly"
    }
  }
}
```

---

### Get All Subscription Plans
```http
GET /api/subscriptions/plans
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "plans": [
      {
        "id": "1",
        "name": "Free",
        "slug": "free",
        "description": "Get started with basic features",
        "price": 0,
        "billing_period": "monthly",
        "is_active": true,
        "sort_order": 0,
        "limits": {
          "max_locations": 1,
          "max_menus_per_location": 1,
          "max_menu_items_total": 50,
          "max_qr_codes": 1,
          "photo_uploads": false,
          "analytics": false,
          "online_ordering": false
        },
        "features": {
          "photo_uploads": false,
          "analytics": false,
          "online_ordering": false,
          "priority_support": false
        }
      },
      {
        "id": "2",
        "name": "Pro",
        "slug": "pro",
        "description": "Perfect for growing restaurants",
        "price": 29.99,
        "billing_period": "monthly",
        "is_active": true,
        "sort_order": 1,
        "limits": {
          "max_locations": 10,
          "max_menus_per_location": 5,
          "max_menu_items_total": -1,
          "max_qr_codes": -1,
          "photo_uploads": true,
          "analytics": true,
          "online_ordering": true
        }
      },
      {
        "id": "3",
        "name": "Enterprise",
        "slug": "enterprise",
        "description": "Full power for restaurant chains",
        "price": 99.99,
        "billing_period": "monthly",
        "is_active": true,
        "sort_order": 2,
        "limits": {
          "max_locations": -1,
          "max_menus_per_location": -1,
          "max_menu_items_total": -1,
          "max_qr_codes": -1,
          "photo_uploads": true,
          "analytics": true,
          "advanced_analytics": true,
          "online_ordering": true,
          "api_access": true,
          "white_label": true,
          "priority_support": true,
          "dedicated_support": true
        }
      }
    ]
  }
}
```

**Note:** `-1` in limits means unlimited

---

### Get Subscription Permissions
```http
GET /api/subscription/permissions
Authorization: Bearer {token}
```

**Response (200):**
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
      "max_locations": 10,
      "max_menus_per_location": 5,
      "max_menu_items_total": -1,
      "max_qr_codes": -1,
      "photo_uploads": true,
      "analytics": true
    },
    "usage": {
      "locations": 3,
      "menus": 5,
      "menu_items": 42,
      "qr_codes": 10
    },
    "quotas": {
      "locations": {
        "current": 3,
        "limit": 10,
        "remaining": 7,
        "unlimited": false,
        "can_create": true
      },
      "menus": {
        "current": 5,
        "limit": 5,
        "remaining": 0,
        "unlimited": false,
        "can_create": false
      },
      "menu_items": {
        "current": 42,
        "limit": -1,
        "remaining": -1,
        "unlimited": true,
        "can_create": true
      },
      "qr_codes": {
        "current": 10,
        "limit": -1,
        "remaining": -1,
        "unlimited": true,
        "can_create": true
      }
    },
    "features": {
      "photo_uploads": true,
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
  }
}
```

**Use Case:** Get comprehensive permissions, usage, and quota information for UI rendering and feature gating.

---

### Change Subscription
```http
POST /api/subscriptions/change
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "plan_id": "2"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Successfully upgraded to Pro plan",
  "data": {
    "subscription": { /* new subscription object */ },
    "change_type": "upgrade",
    "previous_plan": "Free",
    "new_plan": "Pro"
  }
}
```

---

### Check Subscription Status
```http
GET /api/subscription/check
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "message": "User has active subscription",
  "data": {
    "has_subscription": true,
    "subscription": {
      "id": "1",
      "status": "active",
      "plan_name": "Pro",
      "plan_slug": "pro"
    }
  }
}
```

---

### Create/Assign Subscription
```http
POST /api/subscription/check
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "plan_id": "1"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Subscription assigned successfully",
  "data": {
    "subscription": {
      "id": "1",
      "user_id": "1234567890",
      "plan_id": "1",
      "plan_name": "Free",
      "plan_slug": "free",
      "status": "active",
      "is_active": true
    }
  }
}
```

**Note:** This endpoint creates a subscription if one doesn't exist, typically used during onboarding.

---

## 9. Business Profile API

### Get Business Profile
```http
GET /api/business-profile
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "profile": {
      "id": "1",
      "user_id": "1234567890",
      "business_name": "Tony's Italian Restaurant",
      "business_type": "restaurant",
      "description": "Authentic Italian cuisine",
      "phone": "+1234567890",
      "email": "contact@tonys.com",
      "website": "https://tonys.com",
      "address_line_1": "123 Main St",
      "address_line_2": "Suite 100",
      "city": "New York",
      "state": "NY",
      "postal_code": "10001",
      "country": "US",
      "cuisine_type": "italian",
      "seating_capacity": 50,
      "logo_url": "https://blob.vercel-storage.com/logo.png",
      "primary_color": "#FF5733",
      "secondary_color": "#C70039",
      "operating_hours": {
        "monday": { "open": "09:00", "close": "22:00" },
        "tuesday": { "open": "09:00", "close": "22:00" }
      },
      "services": ["dine_in", "takeout", "delivery"],
      "social_media": {
        "facebook": "https://facebook.com/tonys",
        "instagram": "@tonysitalian"
      },
      "onboarding_completed": true,
      "onboarding_completed_at": "2025-11-14T10:30:00Z",
      "created_at": "2025-11-14T10:00:00Z",
      "updated_at": "2025-11-14T10:30:00Z"
    }
  }
}
```

**Error (404 - Not Found):**
```json
{
  "success": false,
  "message": "Business profile not found",
  "data": {
    "needs_onboarding": true
  }
}
```

---

### Create Business Profile
```http
POST /api/business-profile
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "business_name": "Tony's Italian Restaurant",
  "business_type": "restaurant",
  "description": "Authentic Italian cuisine",
  "phone": "+1234567890",
  "email": "contact@tonys.com",
  "website": "https://tonys.com",
  "address_line_1": "123 Main St",
  "city": "New York",
  "state": "NY",
  "postal_code": "10001",
  "country": "US",
  "cuisine_type": "italian",
  "seating_capacity": 50,
  "services": ["dine_in", "takeout", "delivery"],
  "operating_hours": {
    "monday": { "open": "09:00", "close": "22:00" }
  },
  "social_media": {
    "facebook": "https://facebook.com/tonys"
  }
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Business profile created successfully",
  "data": {
    "profile": { /* created profile */ }
  }
}
```

---

### Update Business Profile
```http
PUT /api/business-profile
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Request Body (FormData):**
```
business_name: "Tony's Italian Restaurant"
description: "Updated description"
logo: [File]
services: ["dine_in", "takeout", "delivery", "catering"]
operating_hours: {"monday": {"open": "09:00", "close": "22:00"}}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Business profile updated successfully",
  "data": {
    "profile": { /* updated profile */ }
  }
}
```

---

### Complete Onboarding
```http
POST /api/business-profile/complete-onboarding
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Onboarding completed successfully and default location created",
  "data": {
    "profile": {
      "onboarding_completed": true,
      "onboarding_completed_at": "2025-11-14T11:00:00Z"
    }
  }
}
```

**Side Effects:**
- Marks onboarding as complete
- Creates default location from business profile data (if not exists)

---

## 10. Settings API

### Get User Settings
```http
GET /api/settings
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "settings": {
      "id": "1",
      "user_id": "1234567890",
      "theme": "light",
      "language": "en",
      "timezone": "America/New_York",
      "date_format": "MM/DD/YYYY",
      "time_format": "12h",
      "currency": "USD",
      "email_notifications": true,
      "push_notifications": true,
      "sms_notifications": false,
      "marketing_emails": false,
      "two_factor_enabled": false,
      "created_at": "2025-11-14T10:00:00Z",
      "updated_at": "2025-11-14T10:00:00Z"
    }
  }
}
```

---

### Update Settings
```http
PUT /api/settings
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "theme": "dark",
  "email_notifications": false,
  "language": "es",
  "timezone": "Europe/Madrid"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Settings updated successfully",
  "data": {
    "settings": { /* updated settings */ }
  }
}
```

---

### Get Ordering Settings
```http
GET /api/settings/ordering
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "settings": {
    "ordering": {
      "enabled": true,
      "requiresApproval": false
    },
    "loyalty": {
      "enabled": true,
      "required": false,
      "label": "Loyalty Number",
      "placeholder": "Enter your loyalty number",
      "helpText": "Sign up for our loyalty program at the register"
    }
  }
}
```

---

### Update Ordering Settings
```http
PUT /api/settings/ordering
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "ordering": {
    "enabled": true,
    "requiresApproval": true
  },
  "loyalty": {
    "enabled": true,
    "required": true,
    "label": "Loyalty Card Number",
    "placeholder": "XXXX-XXXX-XXXX",
    "helpText": "Required for all orders"
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Settings updated successfully",
  "settings": { /* updated settings */ }
}
```

---

### Get Order Form Configuration
```http
GET /api/settings/order-form
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "config": {
    "defaultFields": {
      "customerName": {
        "enabled": true,
        "required": true,
        "label": "Full Name",
        "placeholder": "Enter your name"
      },
      "customerPhone": {
        "enabled": true,
        "required": true,
        "label": "Phone Number",
        "placeholder": "Enter your phone number"
      },
      "customerEmail": {
        "enabled": true,
        "required": false,
        "label": "Email Address",
        "placeholder": "Enter your email"
      }
    },
    "fields": [
      {
        "id": "custom_1",
        "type": "text",
        "label": "Special Instructions",
        "placeholder": "Any allergies or preferences?",
        "required": false,
        "enabled": true
      }
    ]
  }
}
```

---

### Update Order Form Configuration
```http
PUT /api/settings/order-form
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "defaultFields": {
    "customerName": {
      "enabled": true,
      "required": true,
      "label": "Your Name",
      "placeholder": "John Doe"
    }
  },
  "fields": [
    {
      "id": "custom_1",
      "type": "select",
      "label": "Delivery or Pickup?",
      "options": ["Delivery", "Pickup"],
      "required": true,
      "enabled": true
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Order form configuration updated successfully",
  "config": { /* updated config */ }
}
```

---

## 11. QR Codes API

### List QR Codes
```http
GET /api/qr-codes?location_id={location_id}
Authorization: Bearer {token}
```

**Query Parameters:**
- `location_id` (optional) - Filter by location

**Response (200):**
```json
{
  "success": true,
  "data": {
    "qr_codes": [
      {
        "id": "1",
        "location_id": "1",
        "menu_id": "1",
        "name": "Table 5 QR Code",
        "table_number": "5",
        "qr_code_data": "https://yourdomain.com/menu/lunch-menu-abc123?table=5",
        "qr_code_image_url": "https://blob.vercel-storage.com/qr-code-1.png",
        "scan_count": 42,
        "is_active": true,
        "created_at": "2025-11-14T10:00:00Z"
      }
    ]
  },
  "meta": {
    "total": 15,
    "can_add_qr_code": true,
    "remaining_quota": -1,
    "max_qr_codes": -1
  }
}
```

---

### Create QR Code
```http
POST /api/qr-codes
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "name": "Table 10 QR Code",
  "menu_id": "1",
  "table_number": "10",
  "location_id": "1"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "QR code created successfully",
  "data": {
    "qr_code": {
      "id": "16",
      "name": "Table 10 QR Code",
      "qr_code_data": "https://yourdomain.com/menu/lunch-menu-abc123?table=10",
      "qr_code_image_url": "https://blob.vercel-storage.com/qr-code-16.png"
    }
  }
}
```

**Error (403 - Subscription Limit):**
```json
{
  "success": false,
  "message": "You have reached your limit of 1 QR code(s). Upgrade for unlimited QR codes.",
  "error": {
    "code": "SUBSCRIPTION_LIMIT_REACHED",
    "current_count": 1,
    "limit": 1,
    "upgrade_required": true,
    "feature": "max_qr_codes"
  }
}
```

**Error (403 - Feature Not Available):**
```json
{
  "success": false,
  "message": "Table-specific QR codes require a higher subscription plan.",
  "error": {
    "code": "FEATURE_NOT_AVAILABLE",
    "feature": "table_specific_qr",
    "upgrade_required": true
  }
}
```

---

### Get Single QR Code
```http
GET /api/qr-codes/{id}
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "qr_code": {
      "id": "1",
      "location_id": "1",
      "menu_id": "1",
      "name": "Table 5 QR Code",
      "table_number": "5",
      "qr_url": "https://yourdomain.com/menu/lunch-menu-abc123?table=5",
      "qr_image": "data:image/png;base64,...",
      "scan_count": 42,
      "created_at": "2025-11-14T10:00:00Z",
      "menu_name": "Lunch Menu",
      "location_name": "Main Restaurant"
    }
  }
}
```

**Error (404):**
```json
{
  "success": false,
  "message": "QR code not found"
}
```

---

### Update QR Code
```http
PUT /api/qr-codes/{id}
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "name": "VIP Table 10",
  "menu_id": "2",
  "table_number": "10A"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "QR code updated successfully",
  "data": {
    "qr_code": { /* updated QR code */ }
  }
}
```

---

### Delete QR Code
```http
DELETE /api/qr-codes/{id}
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "message": "QR code deleted successfully"
}
```

---

## 12. Public Menu API (No Authentication)

### Get Public Menu
```http
GET /api/public/menu/{slug_or_id}?table={table_number}
```

**Query Parameters:**
- `table` (optional) - Table number for analytics tracking

**Path Parameters:**
- `{slug_or_id}` - Menu slug (e.g., `lunch-menu-abc123`) or numeric ID

**Response (200):**
```json
{
  "success": true,
  "data": {
    "menu": {
      "id": "1",
      "location_id": "1",
      "menu_name": "Lunch Menu",
      "slug": "lunch-menu-abc123",
      "description": "Delicious lunch offerings",
      "currency": "USD",
      "is_active": true,
      "restaurant_name": "Tony's Italian Restaurant",
      "logo_url": "https://blob.vercel-storage.com/logo.png",
      "location_name": "Main Restaurant",
      "primary_color": "#FF5733",
      "secondary_color": "#C70039",
      "phone": "+1234567890",
      "email": "contact@tonys.com",
      "website": "https://tonys.com",
      "location_settings": {
        "ordering": { "enabled": true }
      },
      "order_form_config": {
        "defaultFields": { /* ... */ }
      },
      "style": {
        "theme": "modern",
        "primaryColor": "#FF5733"
      }
    },
    "categories": [
      {
        "id": "1",
        "menu_id": "1",
        "name": "Appetizers",
        "description": "Start your meal",
        "sort_order": 0,
        "background_color": "#F5F5F5"
      }
    ],
    "items": [
      {
        "id": "1",
        "menu_id": "1",
        "category_id": "1",
        "name": "Bruschetta",
        "description": "Fresh tomatoes on toasted bread",
        "price": 8.99,
        "image_url": "https://blob.vercel-storage.com/bruschetta.jpg",
        "is_available": true,
        "is_featured": true,
        "dietary_info": ["vegetarian", "vegan"],
        "category_name": "Appetizers"
      }
    ]
  }
}
```

**Error (404):**
```json
{
  "success": false,
  "message": "Menu not found"
}
```

**Side Effects:**
- Tracks analytics event (`menu_view` or `qr_scan` if table number provided)

---

## 13. Analytics API (Simplified - Requires Additional Tables)

### Track Event
```http
POST /api/analytics/track
```

**Request Body:**
```json
{
  "event_type": "menu_view",
  "menu_id": "1",
  "item_id": null,
  "qr_code_id": null,
  "table_number": null,
  "session_id": "unique-session-id",
  "referrer": "https://google.com",
  "additional_data": {
    "custom_field": "value"
  }
}
```

**Event Types:**
- `qr_scan` - QR code scanned
- `menu_view` - Menu viewed
- `item_view` - Menu item viewed
- `order_placed` - Order submitted

**Response (200):**
```json
{
  "success": true,
  "message": "Event tracked successfully",
  "data": {
    "event_id": null
  }
}
```

**Note:** Currently returns placeholder - requires `analytics_events` table

---

### Get Analytics Stats
```http
GET /api/analytics/stats?menu_id={menu_id}&period=7d
Authorization: Bearer {token}
```

**Query Parameters:**
- `menu_id` (optional) - Filter by specific menu
- `period` - `7d`, `30d`, `90d`, `1y` (default: `7d`)
- `timezone` (optional) - Timezone for date grouping

**Response (200):**
```json
{
  "success": true,
  "data": {
    "overview": {
      "total_scans": 0,
      "total_views": 0,
      "total_orders": 0,
      "unique_visitors": 0
    },
    "timeline": [],
    "popular_items": [],
    "popular_tables": [],
    "devices": [],
    "hourly_pattern": [],
    "category_distribution": []
  },
  "message": "Analytics feature requires analytics_events table in database schema"
}
```

---

### Get Dashboard Stats
```http
GET /api/dashboard/stats
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalViews": {
        "value": 0,
        "change": 0,
        "trend": "up",
        "formatted": "0"
      },
      "qrScans": {
        "value": 0,
        "change": 0,
        "trend": "up",
        "formatted": "0"
      },
      "menuItems": {
        "value": 42,
        "change": 0,
        "trend": "up",
        "formatted": "42"
      },
      "activeCustomers": {
        "value": 0,
        "change": 0,
        "trend": "up",
        "formatted": "0"
      }
    },
    "recentActivity": [],
    "popularItems": []
  },
  "message": "Full analytics requires analytics_events table"
}
```

---

## 14. Database Testing API

### Test Database Connection
```http
GET /api/test-db
```

**Response (200):**
```json
{
  "success": true,
  "message": "Database connection successful (Prisma)"
}
```

**Error (500):**
```json
{
  "success": false,
  "message": "Database connection failed",
  "error": "Connection timed out"
}
```

---

## 15. Error Handling & Validation

### Validation Error Format
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "email": ["Email is required", "Email must be a valid email address"],
    "password": ["Password must be at least 8 characters"],
    "name": ["Name is required"]
  }
}
```

### Common Error Codes
```javascript
// Subscription Limits
SUBSCRIPTION_LIMIT_REACHED
FEATURE_NOT_AVAILABLE
UPGRADE_REQUIRED

// Resource Errors
RESOURCE_NOT_FOUND
RESOURCE_ALREADY_EXISTS
CANNOT_DELETE_RESOURCE

// Authentication
UNAUTHORIZED
INVALID_TOKEN
TOKEN_EXPIRED

// Validation
VALIDATION_FAILED
INVALID_INPUT
MISSING_REQUIRED_FIELD

// Database
DATABASE_ERROR
QUERY_FAILED
TRANSACTION_FAILED
```

---

## 16. Pagination (Future Implementation)

### Standard Pagination Format
```http
GET /api/menus?page=2&per_page=20&sort_by=created_at&sort_order=desc
```

**Response:**
```json
{
  "success": true,
  "data": {
    "menus": [ /* items */ ]
  },
  "meta": {
    "current_page": 2,
    "per_page": 20,
    "total": 150,
    "total_pages": 8,
    "has_next_page": true,
    "has_prev_page": true
  },
  "links": {
    "first": "/api/menus?page=1&per_page=20",
    "prev": "/api/menus?page=1&per_page=20",
    "next": "/api/menus?page=3&per_page=20",
    "last": "/api/menus?page=8&per_page=20"
  }
}
```

---

## 17. Rate Limiting (Recommended)

### Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1699977600
```

### Rate Limit Response (429)
```json
{
  "success": false,
  "message": "Too many requests. Please try again later.",
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "retry_after": 60
  }
}
```

---

## 18. Webhooks (Future Feature)

### Event Types
- `menu.created`
- `menu.updated`
- `menu.deleted`
- `order.placed`
- `order.completed`
- `subscription.changed`

### Webhook Payload
```json
{
  "event": "order.placed",
  "timestamp": "2025-11-14T12:00:00Z",
  "data": {
    "order_id": "12345",
    "menu_id": "1",
    "customer_name": "John Doe",
    "total_amount": 45.99
  }
}
```

---

## 19. Best Practices

### 1. Always Include Authorization Header
```javascript
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

### 2. Handle BigInt Serialization
All IDs are returned as strings (BigInt converted)

### 3. Check Subscription Limits
Always check `meta` object for quota information

### 4. Use FormData for File Uploads
```javascript
const formData = new FormData();
formData.append('name', 'Menu Name');
formData.append('logo', fileInput.files[0]);
```

### 5. Handle Errors Gracefully
```javascript
try {
  const response = await fetch('/api/menus', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(data)
  });
  
  const result = await response.json();
  
  if (!result.success) {
    // Handle error
    if (result.errors) {
      // Validation errors
    }
    if (result.error?.code === 'SUBSCRIPTION_LIMIT_REACHED') {
      // Show upgrade prompt
    }
  }
} catch (error) {
  // Network error
}
```

### 6. Parse JSON Fields
Fields like `operating_hours`, `services`, `social_media`, `limits`, `features` are JSON strings and need parsing

---

## 20. Database Schema Requirements

### Core Tables (Implemented)
- `users`
- `user_settings`
- `user_subscriptions`
- `subscription_plans`
- `locations`
- `business_profiles`
- `menus`
- `menu_categories`
- `menu_items`
- `qr_codes`

### Additional Tables (Not Implemented)
- `analytics_events` - For tracking and analytics
- `orders` - For online ordering
- `order_items` - Order line items
- `password_resets` - Password reset tokens
- `api_keys` - For API access (Enterprise)
- `webhooks` - Webhook configurations

---

## Summary

This API provides a complete restaurant menu management system with:

✅ **Authentication** - JWT-based with Google OAuth
✅ **Multi-tenancy** - Users, locations, menus
✅ **Subscription Management** - Free, Pro, Enterprise plans with limits
✅ **File Uploads** - Vercel Blob integration
✅ **Dynamic Permissions** - Database-driven subscription limits
✅ **Type Safety** - Prisma ORM with TypeScript
✅ **Public Access** - Shareable menu links and QR codes
✅ **Extensible** - Ready for analytics, ordering, webhooks

**Next Steps for Production:**
1. Add rate limiting
2. Implement pagination for list endpoints
3. Add analytics_events table for tracking
4. Add orders/order_items tables for online ordering
5. Implement webhook system
6. Add API key authentication for Enterprise
7. Add full-text search
8. Implement caching (Redis)
9. Add request logging and monitoring
