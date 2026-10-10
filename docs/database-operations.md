# Database Operations

This guide describes the database lifecycle for the My-Project monorepo (PostgreSQL + Prisma 7).

## Required configuration

Set `DATABASE_URL` as a server-side environment variable for the backend service. Use the PostgreSQL connection URL supplied by the database provider. Do not commit credentials or expose the URL through a `NEXT_PUBLIC_*` variable.

The Prisma schema is maintained at `apps/backend/prisma/schema.prisma`; Prisma 7 configuration is in `apps/backend/prisma.config.ts`. Existing migration history is maintained under `apps/backend/prisma/migrations/`; review that complete history before preparing a new migration.

## Safe deployment order

1. Confirm the PostgreSQL service is online and the backend's `DATABASE_URL` references that service.
2. Generate the Prisma client during the backend build with `npm run db:generate --workspace=backend`.
3. Review and commit a forward-only migration for each actual schema change. Do not edit an already-applied migration.
4. Deploy using `npm run db:migrate:deploy --workspace=backend`; it applies only pending migrations in the checked-in migration history.
5. Seed canonical CMS sections and initial AI-agent records with `npm run db:seed --workspace=backend`.
6. Start the API only after migration and seed commands succeed.

The backend start script runs migration deployment and seeding before starting the server. The real database URL must be available at runtime; image builds should use only a disposable placeholder URL and must not connect to a production database.

## Existing database and migration history

The production Railway database already has a checked-in migration history (the runtime logs reported 10 migrations and no pending migrations at the last observed deployment). Never add a full-schema "initial migration" after that history: it would attempt to recreate tables/types that already exist. The Phase 3 changes do not add a schema migration because the existing migration history already contains the `AIProviderConnection(status, updatedAt)` index.

Before any future baseline/reconciliation, inspect the real schema and `_prisma_migrations` history and prepare an explicit plan. Do not run a full initial schema against an existing database or treat it as data-preserving.

## Seed safety and CMS data

The seed routine uses upserts so it can be rerun. For existing CMS sections, it must preserve administrator-owned `content` and `isVisible` values. Seed defaults are applied only when a canonical section is first created. This prevents a service restart or redeployment from unexpectedly republishing a section hidden in System Configuration.

The seed routine may refresh canonical section titles and ordering and refresh built-in agent descriptions/prompts. Treat changes to those values as intentional deployment changes.

## Operational checks (before release)

- Confirm the production database is backed up and recoverable.
- Compare every model, enum, relation, index, and unique constraint in `schema.prisma` with the complete checked-in migration history.
- Confirm `DATABASE_URL` is configured only on the backend runtime.
- Confirm migration deployment exits successfully before API startup.
- Confirm the readiness endpoint reports database and worker readiness without exposing raw database-driver errors.
- Never run destructive schema resets against a production database.
- Functional/live testing and deployment status must be reported from actual results, not inferred from source changes.
