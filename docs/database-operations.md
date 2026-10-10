# Database Operations

This guide describes the database lifecycle for the My-Project monorepo (PostgreSQL + Prisma 7).

## Required configuration

Set `DATABASE_URL` as a server-side environment variable for the backend service. Use the PostgreSQL connection URL supplied by the database provider. Do not commit credentials or expose the URL through a `NEXT_PUBLIC_*` variable.

The Prisma schema is maintained at `apps/backend/prisma/schema.prisma`; Prisma 7 configuration is in `apps/backend/prisma.config.ts`.

## Safe deployment order

1. Provision PostgreSQL and configure the backend's `DATABASE_URL`.
2. Generate the Prisma client during the backend build with `npm run db:generate --workspace=backend`.
3. Review and commit a migration for every schema change. Do not edit an already-applied migration; create a new migration instead.
4. Deploy using `npm run db:migrate:deploy --workspace=backend`.
5. Seed canonical CMS sections and initial AI-agent records with `npm run db:seed --workspace=backend`.
6. Start the API only after migration and seed commands succeed.

The backend start script currently runs migration deployment and seeding before starting the server. The real database URL must be available at runtime; image builds should use only a disposable placeholder URL and must not connect to a production database.

## Seed safety and CMS data

The seed routine uses upserts so it can be rerun. For existing CMS sections, it must preserve administrator-owned `content` and `isVisible` values. Seed defaults are applied only when a canonical section is first created. This prevents a service restart or redeployment from unexpectedly republishing a section hidden in System Configuration.

The seed routine may refresh canonical section titles and ordering and refresh built-in agent descriptions/prompts. Treat changes to those values as intentional deployment changes.

## Operational checks (before release)

- Confirm the production database is backed up and recoverable.
- Confirm all schema changes have a checked-in Prisma migration.
- Confirm `DATABASE_URL` is configured only on the backend runtime.
- Confirm migration deployment exits successfully before API startup.
- Confirm the database readiness endpoint reports database connectivity separately from worker readiness.
- Never run destructive schema resets against a production database.
- Functional/live testing remains a separate release step; documentation does not imply that deployment or tests have been performed.
