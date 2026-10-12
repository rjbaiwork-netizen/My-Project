FROM node:22-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json ./
COPY apps/frontend/package.json ./apps/frontend/
COPY apps/backend/package.json ./apps/backend/
COPY packages/shared/package.json ./packages/shared/
RUN npm install

FROM deps AS builder
WORKDIR /app
COPY . .
# NEXT_PUBLIC_API_URL must be available while Next.js builds its server and client bundles.
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
RUN npm run build:shared
RUN npm run build:frontend

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
# Keep the configured API origin available to the standalone Next.js server at runtime too.
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

COPY --from=builder /app/apps/frontend/.next/standalone ./
COPY --from=builder /app/apps/frontend/.next/static ./apps/frontend/.next/static

EXPOSE 3000

CMD ["node", "apps/frontend/server.js"]
