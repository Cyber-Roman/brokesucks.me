# Bakery Self-Ordering System — Setup Guide

## Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- A [Supabase](https://supabase.com) project (free tier works)

## 1. Create Supabase Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and create a new project.
2. Wait for the database to finish provisioning.

## 2. Run Database Migrations

Open **SQL Editor** in your Supabase dashboard and run each migration file **in order**:

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_rls_policies.sql`
3. `supabase/migrations/003_functions.sql`
4. `supabase/migrations/004_seed_data.sql`
5. `supabase/migrations/005_grants.sql`

This creates all tables, RLS policies, RPC functions, seed menu data, default staff accounts, and API permissions.

### Enable Realtime

In Supabase Dashboard → **Database** → **Replication**, ensure the `orders` table is enabled for Realtime (the migration adds it to the publication).

## 3. Configure Environment

Copy the example env file and fill in your Supabase credentials:

```bash
cp .env.example .env
```

Edit `.env`:

```env
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SHOW_DEV_NAV=false
```

Find these values in Supabase Dashboard → **Project Settings** → **API**.

> **Never** put `SUPABASE_SERVICE_ROLE_KEY` in the frontend `.env` file. It is only for server-side scripts.

## 4. Install & Run

```bash
pnpm install
pnpm dev
```

Open the URLs:

| Route | URL | Purpose |
|-------|-----|---------|
| Customer kiosk | `http://localhost:5173/#/customers` | Self-ordering |
| Employee dashboard | `http://localhost:5173/#/order` | Kitchen queue |
| Admin console | `http://localhost:5173/#/admin` | Menu & analytics |

Set `VITE_SHOW_DEV_NAV=true` during development to show the route switcher.

## 5. Default Login Credentials

| Role | PIN | Password |
|------|-----|----------|
| Employee | `753596` | `passvord` |
| Admin | `529641` | `passivordik` |

Passwords are stored as bcrypt hashes in the database. Change them in production.

## 6. Verify

1. **Customer**: Select Sit Here or Takeaway → add items → place order with your name.
2. **Employee**: Log in → new order appears instantly (no refresh) → Prepare → Ready → Complete.
3. **Admin**: Log in → view analytics → create/edit/delete products and categories.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Supabase Not Configured" | Check `.env` has correct `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` |
| Login fails | Re-run migration `004_seed_data.sql` |
| Orders don't appear in realtime | Enable Realtime for `orders` table in Supabase dashboard |
| Image upload fails | Ensure `product-images` storage bucket exists (created by migration 001) |
