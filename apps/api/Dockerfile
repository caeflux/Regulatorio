FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
RUN npm install

# Copy source
COPY apps/api ./apps/api
COPY packages/shared ./packages/shared

# Generate Prisma client
RUN cd apps/api && npx prisma generate

# Development
FROM base AS development
WORKDIR /app/apps/api
CMD ["npx", "tsx", "watch", "src/server.ts"]

# Production build
FROM base AS builder
WORKDIR /app/apps/api
RUN npx tsup src/server.ts --format cjs

# Production
FROM node:20-alpine AS production
WORKDIR /app
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/node_modules ./node_modules
COPY --from=builder /app/apps/api/prisma ./prisma
ENV NODE_ENV=production
CMD ["node", "dist/server.js"]
