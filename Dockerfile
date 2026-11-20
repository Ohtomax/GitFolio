# =============================================================
# Stage 1: Build Environment
# =============================================================
FROM node:22-slim AS builder

WORKDIR /app

# Install OpenSSL for Prisma generation and CA certificates
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy configuration and package manifests across the workspaces
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY server/package.json ./server/
COPY client/package.json ./client/

# Install all dependencies for build steps
RUN npm ci

# Copy source trees needed for shared, server, and role-template compiling
COPY packages/shared/ ./packages/shared/
COPY server/ ./server/
COPY client/ ./client/

# 1. Build shared library
RUN npm run build --workspace=@gitfolio/shared

# 2. Ensure/generate Prisma Client
RUN npm run db:ensure --workspace=@gitfolio/server

# 3. Build server (runs build-role-templates.mjs and tsc)
RUN npm run build --workspace=@gitfolio/server

# Prune devDependencies to keep production image lightweight
RUN npm prune --omit=dev

# =============================================================
# Stage 2: Minimal Production Runtime (Render Free Tier)
# =============================================================
FROM node:22-slim AS runner

WORKDIR /app

# Install runtime dependencies:
# - openssl & ca-certificates: required by Prisma Client and secure outbound HTTPS (Supabase, GitHub API)
# - redis-server: embedded Redis daemon for 100% Free Tier hosting on Render (uses ~5MB RAM)
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    redis-server \
    && rm -rf /var/lib/apt/lists/*

# Production environment settings tuned for Render Free Tier (512MB RAM limit)
ENV NODE_ENV=production
ENV SERVER_HOST=0.0.0.0
ENV SERVER_PORT=3001
ENV NODE_OPTIONS="--max-old-space-size=384"

# Copy production node_modules and Prisma Client engine
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Copy compiled shared package
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/package.json

# Copy compiled server runtime, prisma schema/migrations, and helper scripts
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/prisma ./server/prisma
COPY --from=builder /app/server/scripts ./server/scripts
COPY --from=builder /app/server/package.json ./server/package.json

# Copy startup scripts
COPY scripts/docker-entrypoint.sh ./scripts/docker-entrypoint.sh
COPY scripts/start-runner.mjs ./scripts/start-runner.mjs

RUN chmod +x ./scripts/docker-entrypoint.sh

# Default port (Render automatically maps $PORT at runtime)
EXPOSE 3001

ENTRYPOINT ["/app/scripts/docker-entrypoint.sh"]
CMD ["node", "scripts/start-runner.mjs"]
