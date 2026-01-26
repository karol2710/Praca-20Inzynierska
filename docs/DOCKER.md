# Docker Guide

Complete guide to using Docker with KubeChart.

## Docker Overview

Docker allows you to package KubeChart as a container for easy deployment.

### Benefits

- **Consistency** - Same environment everywhere
- **Portability** - Run on any Docker-supporting platform
- **Isolation** - Separate from host system
- **Easy Deployment** - Single image, any environment
- **Scaling** - Run multiple containers

## Dockerfile

The project includes a production-ready Dockerfile:

```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# Runtime stage
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
ENV NODE_ENV=production PORT=8080
EXPOSE 8080
CMD ["pnpm", "start"]
```

### Key Features

- **Multi-stage build** - Reduces image size
- **Alpine Linux** - Small base image
- **pnpm** - Fast package manager
- **Production optimization** - Only includes necessary files

## Building Docker Image

### Using Build Script

```bash
# Run build script
./docker-build.sh

# This script:
# - Checks Docker is installed
# - Builds image with tag kubechart:latest
# - Shows build progress
```

### Manual Build

```bash
# Build image
docker build -t kubechart:latest .

# Build with custom tag
docker build -t kubechart:1.0.0 .

# Build with multiple tags
docker build -t kubechart:latest -t kubechart:1.0.0 .

# View images
docker images | grep kubechart
```

### Build with Custom Base Image

```dockerfile
# Use different Node version
FROM node:18-alpine  # instead of node:20-alpine

# Build
docker build -t kubechart:node18 .
```

## Running Docker Container

### Basic Run

```bash
# Run container
docker run -p 8080:8080 kubechart:latest

# Access at http://localhost:8080
```

### With Environment Variables

```bash
# Using -e flag
docker run \
  -e DATABASE_URL=postgresql://user:pass@db:5432/kubechart \
  -e NODE_ENV=production \
  -p 8080:8080 \
  kubechart:latest

# Using .env file
docker run \
  --env-file .env \
  -p 8080:8080 \
  kubechart:latest
```

### With Volume Mounting

```bash
# Mount kubeconfig for Kubernetes access
docker run \
  -v ~/.kube/config:/home/app/.kube/config:ro \
  -e KUBECONFIG=/home/app/.kube/config \
  -p 8080:8080 \
  kubechart:latest

# Mount entire config directory
docker run \
  -v ~/.kube:/home/app/.kube:ro \
  -p 8080:8080 \
  kubechart:latest
```

### With Container Name and Logs

```bash
# Named container
docker run \
  --name kubechart-app \
  -p 8080:8080 \
  kubechart:latest

# Detached mode
docker run -d \
  --name kubechart-app \
  -p 8080:8080 \
  kubechart:latest

# View logs
docker logs kubechart-app
docker logs -f kubechart-app  # Follow logs

# Stop container
docker stop kubechart-app

# Remove container
docker rm kubechart-app
```

### Interactive Mode

```bash
# Run and connect shell
docker run -it \
  -p 8080:8080 \
  kubechart:latest /bin/sh

# Or run existing container
docker exec -it kubechart-app /bin/sh
```

## Docker Compose

Docker Compose allows running multiple containers together.

### docker-compose.yml

```yaml
version: "3.8"

services:
  app:
    build: .
    ports:
      - "8080:8080"
    environment:
      DATABASE_URL: postgresql://kubechart:password@db:5432/kubechart
      NODE_ENV: production
    depends_on:
      - db
    volumes:
      - ~/.kube:/home/app/.kube:ro

  db:
    image: postgres:15-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: kubechart
      POSTGRES_PASSWORD: password
      POSTGRES_DB: kubechart
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### Using Docker Compose

```bash
# Start services
docker-compose up

# Detached mode
docker-compose up -d

# View logs
docker-compose logs -f app
docker-compose logs -f db

# Stop services
docker-compose down

# Remove volumes
docker-compose down -v

# Rebuild images
docker-compose build
docker-compose up -d
```

### Accessing Services

```bash
# Access app
curl http://localhost:8080

# Connect to database
psql -h localhost -U kubechart -d kubechart

# Connect to app container
docker-compose exec app /bin/sh
```

## Docker Networking

### Container Communication

```yaml
# docker-compose.yml
services:
  app:
    networks:
      - kubechart-net
  db:
    networks:
      - kubechart-net

networks:
  kubechart-net:
    driver: bridge
```

### Service Discovery

```bash
# Container can access other services by name
# DATABASE_URL=postgresql://db:5432/kubechart
# The 'db' hostname resolves to database container IP
```

## Image Management

### List Images

```bash
# List all images
docker images

# List specific images
docker images kubechart

# Show image details
docker inspect kubechart:latest
```

### Tag Images

```bash
# Tag local image for registry
docker tag kubechart:latest myregistry/kubechart:latest

# Tag as different version
docker tag kubechart:latest kubechart:1.0.0
```

### Push to Registry

```bash
# Login to Docker Hub
docker login

# Push image
docker push myregistry/kubechart:latest

# Push specific tag
docker push myregistry/kubechart:1.0.0
```

### Remove Images

```bash
# Remove specific image
docker rmi kubechart:latest

# Remove unused images
docker image prune

# Remove all images
docker rmi $(docker images -q)
```

## Optimization

### Reduce Image Size

```dockerfile
# Multi-stage build (already in Dockerfile)
FROM node:20-alpine AS builder
# ... build stage
FROM node:20-alpine
# ... runtime stage

# Alpine images are smaller than debian
# node:20-alpine vs node:20-slim vs node:20

# Remove unnecessary files
RUN npm cache clean --force
```

### Image Size Comparison

```bash
# Check image sizes
docker images --format "table {{.Repository}}\t{{.Size}}"

# Typical sizes:
# kubechart (multi-stage, Alpine): ~200-300MB
# kubechart (single-stage): ~600MB+
```

## Docker Security

### Run as Non-Root

```dockerfile
# Add non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs
```

### Read-Only Filesystem

```bash
docker run \
  --read-only \
  --tmpfs /tmp \
  kubechart:latest
```

### Resource Limits

```bash
docker run \
  --memory=512m \
  --cpus=1 \
  kubechart:latest
```

## Troubleshooting

### Image Won't Build

```bash
# Check Dockerfile syntax
docker build --progress=plain .

# View build output
docker build -t kubechart:debug . 2>&1 | tail -50

# Check Docker resources
docker system df
docker system prune -a
```

### Container Won't Start

```bash
# Check logs
docker logs <container_id>

# Run with verbose output
docker run --rm \
  --entrypoint /bin/sh \
  kubechart:latest

# Check environment variables
docker run --rm \
  --entrypoint /bin/sh \
  kubechart:latest -c "env | grep DATABASE"
```

### Cannot Connect to Database

```bash
# Check database service
docker ps | grep postgres

# Check network connectivity
docker exec <app_container> \
  ping db

# Check environment variable
docker exec <app_container> \
  echo $DATABASE_URL
```

### Port Already in Use

```bash
# Use different port
docker run -p 3000:8080 kubechart:latest

# Or find and kill process using port
lsof -i :8080
kill -9 <PID>
```

## Production Deployment

### Production Dockerfile

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
ENV NODE_ENV=production
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1
USER nobody
CMD ["node", "dist/server/index.js"]
```

### Production docker-compose

```yaml
version: "3.8"

services:
  app:
    image: myregistry/kubechart:1.0.0
    restart: always
    ports:
      - "8080:8080"
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://user:pass@db:5432/kubechart
    depends_on:
      db:
        condition: service_healthy
    healthcheck:
      test:
        [
          "CMD",
          "wget",
          "--quiet",
          "--tries=1",
          "--spider",
          "http://localhost:8080/",
        ]
      interval: 30s
      timeout: 3s
      retries: 3

  db:
    image: postgres:15-alpine
    restart: always
    environment:
      POSTGRES_USER: kubechart
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: kubechart
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U kubechart"]
      interval: 10s
      timeout: 5s

volumes:
  postgres_data:
```

## Docker Hub

### Build and Push

```bash
# Build with registry prefix
docker build -t myusername/kubechart:latest .

# Push to Docker Hub
docker push myusername/kubechart:latest

# Others can pull
docker pull myusername/kubechart:latest
docker run -p 8080:8080 myusername/kubechart:latest
```

## Related Documentation

- [Getting Started](GETTING_STARTED.md)
- [Deployment Guide](DEPLOYMENT.md)
- [Kubernetes Integration](KUBERNETES.md)
- [Troubleshooting](TROUBLESHOOTING.md)

---

For more information, see [Docker Documentation](https://docs.docker.com/)
