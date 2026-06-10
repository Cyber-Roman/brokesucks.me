# Deployment Guide

## Frontend Deployment

The app is a static Vite SPA. Deploy to any static hosting provider.

### Recommended: Vercel / Netlify / Cloudflare Pages

1. Connect your Git repository.
2. Set build command: `pnpm build` (or `npm run build`)
3. Set output directory: `dist`
4. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_SHOW_DEV_NAV=false`

### Build locally

```bash
pnpm install
pnpm build
```

Serve the `dist/` folder with any static file server.

## Supabase Production Checklist

1. **Run all migrations** in the production Supabase project SQL Editor.
2. **Enable Realtime** for the `orders` table (Database → Replication).
3. **Change default passwords** — update `employees` and `admins` password hashes:

```sql
UPDATE employees SET password_hash = crypt('your-new-password', gen_salt('bf')) WHERE pin = '753596';
UPDATE admins SET password_hash = crypt('your-new-password', gen_salt('bf')) WHERE pin = '529641';
```

4. **Configure CORS** — Supabase allows all origins by default; restrict in production if needed (Project Settings → API).
5. **Storage** — Verify `product-images` bucket is public for read access.
6. **Backups** — Enable Point-in-Time Recovery on paid plans.

## Kiosk Setup

Deploy three browser instances (or devices) pointing to:

| Device | URL hash |
|--------|----------|
| Customer tablet | `#/customers` |
| Kitchen display | `#/order` |
| Manager PC | `#/admin` |

Use kiosk mode (Chrome `--kiosk` flag or dedicated kiosk software) on customer and kitchen devices.

## Environment Variables

| Variable | Required | Where |
|----------|----------|-------|
| `VITE_SUPABASE_URL` | Yes | Frontend build |
| `VITE_SUPABASE_ANON_KEY` | Yes | Frontend build |
| `VITE_SHOW_DEV_NAV` | No | Set `false` in production |
| `SUPABASE_SERVICE_ROLE_KEY` | No | Server scripts only — never in frontend |

## Security Notes

- The anon key is safe to expose in the frontend (RLS + RPC protect data).
- Never expose the service role key in client code.
- Staff authentication uses server-side bcrypt verification via RPC.
- Session tokens expire after 12 hours.
- All admin/employee mutations require a valid session token.
