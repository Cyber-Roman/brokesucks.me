# Database Documentation

## Overview

The bakery system uses **Supabase (PostgreSQL)** as its sole backend. All data persists in the database; the React frontend connects via the Supabase JS client and RPC functions.

## Tables

### `categories`

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | TEXT | Category display name |
| display_order | INTEGER | Sort order (0-based) |
| created_at | TIMESTAMPTZ | Creation timestamp |

### `products`

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | TEXT | Product name |
| description | TEXT | Product description |
| image_url | TEXT | Image URL (Supabase Storage or external) |
| category_id | UUID | FK → categories |
| sit_here_price | NUMERIC | Price when dining in |
| takeaway_price | NUMERIC | Price for takeaway |
| is_available | BOOLEAN | Visible and orderable |
| display_order | INTEGER | Sort order within category |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

### `orders`

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| customer_name | TEXT | Name entered at checkout |
| order_number | INTEGER | Sequential display number (starts at 101) |
| order_type | TEXT | `sit_here` or `takeaway` |
| status | TEXT | `new` → `preparing` → `ready` → `completed` |
| total_price | NUMERIC | Order total |
| created_at | TIMESTAMPTZ | Order placement time |
| completed_at | TIMESTAMPTZ | Set when status = completed |

### `order_items`

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| order_id | UUID | FK → orders |
| product_id | UUID | FK → products (nullable if deleted) |
| quantity | INTEGER | Item count |
| price | NUMERIC | Unit price at time of order |
| product_name_snapshot | TEXT | Product name at time of order |

### `employees`

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| username | TEXT | Unique username |
| pin | TEXT | Unique 6-digit PIN |
| password_hash | TEXT | bcrypt hash (pgcrypto) |
| created_at | TIMESTAMPTZ | Creation timestamp |

### `admins`

Same structure as `employees`.

### `settings`

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| store_name | TEXT | Display name on kiosk |
| currency | TEXT | Currency code (default NOK) |
| sit_here_markup | NUMERIC | Default markup added to takeaway price |
| updated_at | TIMESTAMPTZ | Last update |

### `analytics`

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| date | DATE | Unique per day |
| daily_orders | INTEGER | Order count for the day |
| daily_revenue | NUMERIC | Total revenue for the day |
| popular_products | JSONB | `[{name, count}, ...]` |
| popular_categories | JSONB | `[{name, count}, ...]` |
| peak_hours | JSONB | `{"07:00": 3, "08:00": 5, ...}` |
| updated_at | TIMESTAMPTZ | Last refresh |

### `staff_sessions`

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| role | TEXT | `employee` or `admin` |
| staff_id | UUID | FK to employees or admins |
| token | TEXT | Session token (hex) |
| expires_at | TIMESTAMPTZ | 12-hour expiry |
| created_at | TIMESTAMPTZ | Creation timestamp |

## Relationships

```
categories 1──* products
orders 1──* order_items
products *──1 order_items (optional, SET NULL on delete)
```

## RPC Functions

| Function | Access | Purpose |
|----------|--------|---------|
| `login_employee(pin, password)` | Public | Returns session token |
| `login_admin(pin, password)` | Public | Returns session token |
| `logout_staff(token)` | Public | Invalidates session |
| `place_order(name, type, items)` | Public | Creates order + items atomically |
| `update_order_status(token, order_id, status)` | Employee | Updates order status |
| `get_active_orders()` | Public | Returns new/preparing/ready orders with items |
| `get_today_analytics()` | Public | Refreshes and returns today's analytics |
| `admin_upsert_category(...)` | Admin | Create/update category |
| `admin_delete_category(...)` | Admin | Delete category (cascades products) |
| `admin_reorder_categories(...)` | Admin | Reorder categories |
| `admin_upsert_product(...)` | Admin | Create/update product |
| `admin_delete_product(...)` | Admin | Delete product |
| `admin_reorder_products(...)` | Admin | Reorder products |
| `admin_update_settings(...)` | Admin | Update store settings |

## Row Level Security

- **Public read**: categories, products, settings, orders, order_items, analytics
- **No direct writes**: All mutations go through SECURITY DEFINER RPC functions
- **Staff tables**: No public access (login via RPC only)

## Realtime

The `orders` table is added to `supabase_realtime` publication. The employee dashboard subscribes to `postgres_changes` on orders for instant updates across devices.

## Storage

Bucket `product-images` (public) stores uploaded product images. Created automatically by migration 001.
