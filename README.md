# Bakery Self-Ordering Platform

Production-ready bakery self-ordering kiosk connected to **Supabase**.

## Features

- **Customer kiosk** — dining mode selection, menu browsing, cart, order placement
- **Employee dashboard** — real-time order queue with Prepare / Ready / Complete actions
- **Admin console** — product & category management, image upload, analytics
- **Supabase backend** — PostgreSQL, RLS, RPC functions, Realtime, Storage
- **Secure auth** — bcrypt-hashed passwords, session tokens

## Quick Start

```bash
# 1. Clone and install
pnpm install

# 2. Configure Supabase (see docs/SETUP.md)
cp .env.example .env
# Edit .env with your Supabase URL and anon key

# 3. Run SQL migrations in Supabase SQL Editor
#    supabase/migrations/001 through 004

# 4. Start dev server
pnpm dev
```

## Routes

| Route | URL |
|-------|-----|
| Customer | `/#/customers` |
| Employee | `/#/order` |
| Admin | `/#/admin` |

## Default Credentials

| Role | PIN | Password |
|------|-----|----------|
| Employee | 753596 | passvord |
| Admin | 529641 | passivordik |

## Documentation

- [Setup Guide](docs/SETUP.md)
- [Database Documentation](docs/DATABASE.md)
- [Deployment Guide](docs/DEPLOYMENT.md)

## Tech Stack

- React 18 + TypeScript + Vite
- Tailwind CSS v4
- Supabase (PostgreSQL, Realtime, Storage, RPC)
- Motion (animations), Recharts (analytics)
