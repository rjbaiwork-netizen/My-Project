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
RUN npm run build --workspace=frontend

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/apps/frontend/.next/standalone ./
COPY --from=builder /app/apps/frontend/.next/static ./apps/frontend/.next/static

EXPOSE 3000

CMD ["node", "apps/frontend/server.js"]
