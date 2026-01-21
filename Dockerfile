# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Verify critical config files exist
RUN ls -la vite.config.ts tsconfig.json || echo "Config files missing!"

# Clear Vite cache and build application
RUN rm -rf .vite node_modules/.vite && pnpm run build

# Production stage
FROM node:22-alpine

WORKDIR /app

# Install pnpm and curl for health checks
RUN apk add --no-cache pnpm curl

# Copy package files and all dependencies from builder
COPY package.json pnpm-lock.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/server/index.ts ./server/index.ts

# Create a non-root user for security with proper home directory
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    mkdir -p /home/nodejs && \
    mkdir -p /home/nodejs/.local/share/pnpm && \
    mkdir -p /home/nodejs/.cache && \
    chown -R nodejs:nodejs /home/nodejs /app && \
    chmod -R 775 /home/nodejs && \
    chmod -R 777 /home/nodejs/.local/share/pnpm && \
    chmod -R 777 /home/nodejs/.cache

# Set environment variables
ENV HOME="/home/nodejs"
ENV NODE_ENV="production"

USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/api/ping || exit 1

# Start application directly with node (bypasses pnpm cache issues)
CMD ["node", "dist/server/node-build.mjs"]
