# My-Project Phase 6 Production Deployment

## Architecture
GitHub: rjbaiwork-netizen/My-Project
Frontend: apps/frontend, Next.js 16, Render
Backend: apps/backend, Express 5 + Prisma 7, Railway
Database: PostgreSQL, Railway

## Railway setup
1. Create a dedicated Railway project for My-Project. Do not reuse unrelated projects.
2. Add PostgreSQL and wait until healthy.
3. Create a GitHub service for rjbaiwork-netizen/My-Project on main.
4. The repository railway.toml selects apps/backend/Dockerfile.
5. Set backend variables:
   DATABASE_URL=<Railway PostgreSQL DATABASE_URL>
   PORT=<leave Railway injected value; local fallback is 4000>
   NODE_ENV=production
   CORS_ORIGIN=https://my-project-mk2x.onrender.com
6. Deploy. The backend image runs Prisma migrate deploy before starting Express.
7. Run the seed once when baseline CMS data is required:
   npm run db:seed --workspace=backend
8. Never run prisma migrate dev against production.

## Render setup
Set on the existing My-Project Render frontend service:
NEXT_PUBLIC_API_URL=https://YOUR-RAILWAY-BACKEND.up.railway.app
Do not include a trailing slash. Redeploy after changing it because this is a Next.js public build-time variable.

## API verification
GET /health
Expected: HTTP 200 and {"success":true,"status":"ok"}

GET /api/sections
Expected: HTTP 200, success=true, only visible sections, canonical order, seeded content present.

## End-to-end checklist
- [ ] Railway PostgreSQL healthy.
- [ ] Railway backend healthy.
- [ ] Prisma migration deploy successful.
- [ ] Seed successful and ten canonical sections exist.
- [ ] /health returns 200.
- [ ] /api/sections returns only visible sections.
- [ ] Render NEXT_PUBLIC_API_URL points to Railway.
- [ ] Render deployment is live.
- [ ] Public homepage renders CMS data.
- [ ] Hidden sections disappear without blank gaps.
- [ ] Admin toggle updates immediately and persists after refresh.
- [ ] Failed optimistic update rolls back.
- [ ] Mobile/tablet/desktop layouts remain stable.
- [ ] No recurring Railway/Render errors.

## Critical production security gate
The current repository's /api/admin/* write endpoints are not authenticated or authorized. Do NOT expose the admin dashboard as a production-secure system until authentication, authorization, request validation and appropriate rate limiting are implemented. CORS is not authentication.

## Final go-live criteria
Only mark LIVE / PRODUCTION VERIFIED after PostgreSQL, migrations, seed, backend health, public API, Render deployment, public rendering, persistence, and admin security have all passed.
