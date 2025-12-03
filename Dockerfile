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

# Build application (client and server)
RUN pnpm run build

# Production stage
FROM node:22-alpine

WORKDIR /app

# Install pnpm and curl for health checks
RUN apk add --no-cache pnpm curl

# Copy only necessary files from builder
COPY package.json pnpm-lock.yaml ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

# Install only production dependencies
RUN pnpm install --prod --frozen-lockfile

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/api/ping || exit 1

# Start application
CMD ["pnpm", "start"]
