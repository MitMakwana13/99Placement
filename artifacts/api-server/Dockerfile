# ==============================================================================
# MULTI-STAGE DOCKER BUILD FOR RMS MONOREPO BACKEND
# ==============================================================================

# Base image
FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Development stage
FROM base AS development
WORKDIR /app
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json tsconfig.base.json ./
COPY artifacts/api-server/package.json ./artifacts/api-server/
COPY lib/db-prisma/package.json ./lib/db-prisma/
COPY lib/shared-schemas/package.json ./lib/shared-schemas/
COPY lib/api-zod/package.json ./lib/api-zod/
COPY lib/db/package.json ./lib/db/

# Mount cache for faster pnpm installs
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# Copy the rest of the workspace source code
COPY . .
WORKDIR /app/artifacts/api-server
EXPOSE 5000
CMD ["pnpm", "run", "dev"]

# Production builder stage
FROM base AS builder
WORKDIR /app
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json tsconfig.base.json ./
COPY artifacts/api-server/package.json ./artifacts/api-server/
COPY lib/db-prisma/package.json ./lib/db-prisma/
COPY lib/shared-schemas/package.json ./lib/shared-schemas/
COPY lib/api-zod/package.json ./lib/api-zod/
COPY lib/db/package.json ./lib/db/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --ignore-scripts
COPY . .
RUN DATABASE_URL="postgresql://localhost:5432" node ./lib/db-prisma/node_modules/prisma/build/index.js generate --schema=./lib/db-prisma/prisma/schema.prisma
RUN node artifacts/api-server/build.mjs

# Production runner stage
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000
COPY --from=builder /app/artifacts/api-server/package.json ./package.json
COPY --from=builder /app/artifacts/api-server/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 5000
CMD ["node", "./dist/index.mjs"]
