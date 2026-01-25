# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies with pnpm
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

# Install curl for health checks only
RUN apk add --no-cache curl

# Copy everything from builder including node_modules
COPY --from=builder /app/package.json /app/pnpm-lock.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    mkdir -p /home/nodejs && \
    chown -R nodejs:nodejs /home/nodejs /app

# Set environment variables
ENV HOME="/home/nodejs"
ENV NODE_ENV="production"
ENV NODE_PATH="/app/node_modules"

USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/api/ping || exit 1

# Start application directly with node
CMD ["node", "dist/server/node-build.mjs"]
