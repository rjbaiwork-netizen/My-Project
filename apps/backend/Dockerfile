FROM node:22-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json ./
COPY apps/frontend/package.json ./apps/frontend/
COPY apps/backend/package.json ./apps/backend/
COPY packages/shared/package.json ./packages/shared/
RUN npm install

FROM deps AS builder
COPY . .

# Prisma 7 loads prisma.config.ts during generate/build.
# Use a non-production placeholder at image-build time so
# prisma generate never requires a live database connection.
ARG DATABASE_URL="postgresql://build:build@localhost:5432/build"
ENV DATABASE_URL=${DATABASE_URL}

RUN npm run build --workspace=backend

FROM base AS runner
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/package.json ./
COPY --from=builder /app/apps/backend/package.json ./apps/backend/
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/generated ./apps/backend/generated
COPY --from=builder /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 4000

# Railway injects the real DATABASE_URL at runtime.
CMD ["sh","-c","npm run db:migrate:deploy --workspace=backend && npm run start --workspace=backend"]
