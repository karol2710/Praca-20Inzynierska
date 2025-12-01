# KubeChart - Deployment & Operations Guide

Complete guide for deploying, configuring, and operating KubeChart in development, staging, and production environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Docker Deployment](#docker-deployment)
4. [Production Deployment](#production-deployment)
5. [Configuration](#configuration)
6. [Database Setup](#database-setup)
7. [Backup & Recovery](#backup--recovery)
8. [Monitoring & Logging](#monitoring--logging)
9. [Troubleshooting](#troubleshooting)
10. [Operations Checklist](#operations-checklist)

## Prerequisites

### System Requirements

**Minimum:**
- CPU: 2 cores
- RAM: 2GB
- Disk: 10GB

**Recommended (Production):**
- CPU: 4 cores
- RAM: 8GB
- Disk: 50GB

### Software Requirements

| Software | Minimum | Recommended | Purpose |
|----------|---------|-------------|---------|
| Node.js | 16.0 | 18+ | Runtime |
| pnpm | 7.0 | 8+ | Package manager |
| PostgreSQL | 12 | 14+ | Database |
| Docker | 20.10 | 24+ | Containerization |
| kubectl | 1.20 | 1.27+ | Kubernetes access |
| Helm | 3.0 | 3.12+ | Package management |
| Git | 2.30 | 2.40+ | Version control |

### Required External Services

For full functionality:

1. **PostgreSQL Database**
   - Hosted: AWS RDS, Google Cloud SQL, Azure Database
   - Self-hosted: Docker, VM, or physical server

2. **Kubernetes Cluster** (for Advanced deployments)
   - Rancher-managed cluster
   - Direct kubectl access

3. **Container Registry** (optional)
   - Docker Hub
   - GitHub Container Registry
   - Private registry

### Credentials & API Keys

You'll need to generate/configure:

- `JWT_SECRET` - Generate with: `openssl rand -base64 32`
- `DATABASE_URL` - PostgreSQL connection string
- Rancher API credentials (for advanced deployments)

## Local Development Setup

### 1. Clone Repository

```bash
git clone https://github.com/your-org/kubechart.git
cd kubechart
```

### 2. Install Dependencies

```bash
# Install Node dependencies
pnpm install

# Verify installation
node --version
pnpm --version
```

### 3. Set Up PostgreSQL

**Option A: Docker (Recommended)**

```bash
# Start PostgreSQL container
docker run -d \
  --name kubechart-postgres \
  -e POSTGRES_USER=kubechart \
  -e POSTGRES_PASSWORD=dev_password \
  -e POSTGRES_DB=kubechart \
  -p 5432:5432 \
  postgres:14-alpine

# Verify connection
psql postgresql://kubechart:dev_password@localhost:5432/kubechart -c "SELECT version();"
```

**Option B: System PostgreSQL**

```bash
# Install (macOS)
brew install postgresql

# Install (Ubuntu)
sudo apt-get install postgresql postgresql-contrib

# Start service
sudo systemctl start postgresql

# Create database and user
createuser kubechart --password
createdb kubechart --owner kubechart
```

### 4. Configure Environment

Create `.env` file:

```bash
# Database
DATABASE_URL=postgresql://kubechart:dev_password@localhost:5432/kubechart

# Authentication
JWT_SECRET=$(openssl rand -base64 32)

# Development
NODE_ENV=development
PING_MESSAGE=pong

# Logging
DEBUG=express:*
```

### 5. Run Development Server

```bash
# Start all services
pnpm run dev

# Frontend: http://localhost:5173
# Backend: http://localhost:3000
# API: http://localhost:3000/api

# Open browser
open http://localhost:5173
```

### 6. Verify Setup

```bash
# Test API
curl http://localhost:3000/api/ping

# Test database
psql $DATABASE_URL -c "SELECT 1;"

# Test auth (signup)
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "TestPassword123!"
  }'
```

## Docker Deployment

### Building Docker Image

#### Dockerfile

Create `Dockerfile` in project root:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    curl \
    helm \
    kubectl

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build application
RUN pnpm run build

# Expose port
EXPOSE 3000 5173

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/ping || exit 1

# Start application
CMD ["pnpm", "start"]
```

#### Build Image

```bash
# Build image
docker build -t kubechart:latest .

# Tag for registry
docker tag kubechart:latest your-registry/kubechart:latest

# Push to registry
docker push your-registry/kubechart:latest

# Verify image
docker images kubechart
```

### Running Docker Container

```bash
# Run container
docker run -d \
  --name kubechart \
  -p 3000:3000 \
  -e DATABASE_URL=postgresql://user:pass@postgres:5432/kubechart \
  -e JWT_SECRET=$(openssl rand -base64 32) \
  -e NODE_ENV=production \
  --network kubechart-network \
  kubechart:latest

# View logs
docker logs -f kubechart

# Stop container
docker stop kubechart

# Remove container
docker rm kubechart
```

### Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14-alpine
    container_name: kubechart-postgres
    environment:
      POSTGRES_USER: kubechart
      POSTGRES_PASSWORD: ${DB_PASSWORD:-change_me}
      POSTGRES_DB: kubechart
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - kubechart-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U kubechart"]
      interval: 10s
      timeout: 5s
      retries: 5

  app:
    build: .
    container_name: kubechart-app
    environment:
      DATABASE_URL: postgresql://kubechart:${DB_PASSWORD:-change_me}@postgres:5432/kubechart
      JWT_SECRET: ${JWT_SECRET}
      NODE_ENV: ${NODE_ENV:-production}
    ports:
      - "3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - kubechart-network
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    container_name: kubechart-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - app
    networks:
      - kubechart-network

volumes:
  postgres_data:

networks:
  kubechart-network:
    driver: bridge
```

Run with Docker Compose:

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down

# View service status
docker-compose ps
```

## Production Deployment

### Kubernetes Deployment

Create `k8s/deployment.yaml`:

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: kubechart

---
apiVersion: v1
kind: ConfigMap
metadata:
  name: kubechart-config
  namespace: kubechart
data:
  NODE_ENV: "production"

---
apiVersion: v1
kind: Secret
metadata:
  name: kubechart-secrets
  namespace: kubechart
type: Opaque
stringData:
  DATABASE_URL: postgresql://user:password@postgres.example.com/kubechart
  JWT_SECRET: your-secure-secret-key-here

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: kubechart
  namespace: kubechart
  labels:
    app: kubechart
spec:
  replicas: 3
  selector:
    matchLabels:
      app: kubechart
  template:
    metadata:
      labels:
        app: kubechart
    spec:
      serviceAccountName: kubechart
      containers:
      - name: kubechart
        image: your-registry/kubechart:latest
        imagePullPolicy: Always
        ports:
        - name: http
          containerPort: 3000
        env:
        - name: NODE_ENV
          valueFrom:
            configMapKeyRef:
              name: kubechart-config
              key: NODE_ENV
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: kubechart-secrets
              key: DATABASE_URL
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: kubechart-secrets
              key: JWT_SECRET
        resources:
          requests:
            cpu: 250m
            memory: 512Mi
          limits:
            cpu: 500m
            memory: 1Gi
        livenessProbe:
          httpGet:
            path: /api/ping
            port: http
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/ping
            port: http
          initialDelaySeconds: 10
          periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: kubechart
  namespace: kubechart
spec:
  type: LoadBalancer
  selector:
    app: kubechart
  ports:
  - port: 80
    targetPort: 3000
    protocol: TCP

---
apiVersion: rbac.authorization.k8s.io/v1
kind: ServiceAccount
metadata:
  name: kubechart
  namespace: kubechart

---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: kubechart
  namespace: kubechart
rules:
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list"]

---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: kubechart
  namespace: kubechart
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: kubechart
subjects:
- kind: ServiceAccount
  name: kubechart
  namespace: kubechart
```

Deploy:

```bash
# Apply manifests
kubectl apply -f k8s/deployment.yaml

# Verify deployment
kubectl get deployments -n kubechart
kubectl get pods -n kubechart
kubectl get svc -n kubechart

# View logs
kubectl logs -f deployment/kubechart -n kubechart

# Port forward for testing
kubectl port-forward svc/kubechart 3000:80 -n kubechart
```

### Netlify Deployment

1. **Connect Repository**
   - Push code to GitHub
   - Connect repo to Netlify

2. **Configure Build Settings**
   ```
   Build command: pnpm run build
   Publish directory: dist/spa
   Functions directory: netlify/functions
   ```

3. **Set Environment Variables**
   ```
   DATABASE_URL = postgresql://...
   JWT_SECRET = your-secret-key
   NODE_ENV = production
   ```

4. **Deploy**
   ```bash
   # Deploy from CLI
   npm install -g netlify-cli
   netlify deploy --prod
   ```

### AWS Deployment

#### EC2 Instance

```bash
# 1. Launch EC2 instance (Ubuntu 22.04)
# Instance type: t3.medium or larger
# Security group: Allow 80, 443, 22

# 2. Connect to instance
ssh -i your-key.pem ubuntu@your-instance-ip

# 3. Install dependencies
sudo apt-get update
sudo apt-get install -y nodejs npm postgresql-client

# 4. Install pnpm
npm install -g pnpm

# 5. Clone repository
cd /opt
sudo git clone https://github.com/your-org/kubechart.git
cd kubechart

# 6. Configure environment
sudo nano .env
# Set: DATABASE_URL, JWT_SECRET, NODE_ENV=production

# 7. Install and build
sudo pnpm install
sudo pnpm run build

# 8. Install PM2 for process management
sudo npm install -g pm2

# 9. Start application
sudo pm2 start "pnpm start" --name kubechart
sudo pm2 save
sudo pm2 startup

# 10. Configure reverse proxy (Nginx)
sudo apt-get install nginx
# See Nginx configuration section below
```

#### RDS Database

```bash
# 1. Create RDS instance
# - Engine: PostgreSQL
# - Version: 14+
# - Instance: db.t3.small (minimum)
# - Storage: 20GB gp3

# 2. Get connection string
# Format: postgresql://user:password@endpoint:5432/dbname

# 3. Set in .env
DATABASE_URL=postgresql://user:password@your-rds-endpoint:5432/kubechart

# 4. Test connection
psql $DATABASE_URL -c "SELECT version();"
```

#### ELB/ALB Setup

```bash
# 1. Create Application Load Balancer
# - Target Group: EC2 instances on port 3000
# - Health check: /api/ping
# - Listeners: 80 -> 443 (HTTPS)

# 2. Attach SSL/TLS certificate
# Use AWS Certificate Manager (ACM)

# 3. Configure security groups
# ALB: Allow 80, 443 from 0.0.0.0/0
# EC2: Allow 3000 from ALB
```

## Configuration

### Environment Variables

#### Required Variables

```bash
# Database connection string
DATABASE_URL=postgresql://user:password@host:5432/database

# JWT signing secret (minimum 32 characters)
JWT_SECRET=your-very-secure-secret-key-change-in-production
```

#### Optional Variables

```bash
# Environment mode
NODE_ENV=development|production|staging

# API ping message
PING_MESSAGE=pong

# Logging level
LOG_LEVEL=debug|info|warn|error

# Server port
PORT=3000

# CORS configuration
CORS_ORIGIN=http://localhost:3000

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Generating Secure Secrets

```bash
# Generate JWT secret
openssl rand -base64 32

# Generate database password
openssl rand -base64 16

# Generate API key
openssl rand -hex 32
```

### Configuration Files

#### .env.example

```bash
# Database
DATABASE_URL=postgresql://kubechart:password@localhost:5432/kubechart

# Authentication  
JWT_SECRET=your-secret-key-min-32-chars

# Environment
NODE_ENV=development

# API
PING_MESSAGE=pong
PORT=3000
```

#### config/production.json

```json
{
  "database": {
    "min": 10,
    "max": 20,
    "idleTimeoutMillis": 30000,
    "connectionTimeoutMillis": 2000
  },
  "jwt": {
    "expiresIn": "7d",
    "algorithm": "HS256"
  },
  "logging": {
    "level": "info",
    "format": "json"
  },
  "security": {
    "bcryptRounds": 12,
    "maxInputLength": 10000
  }
}
```

## Database Setup

### Initial Setup

```bash
# Database is automatically initialized on first run
# Tables are created by server/db.ts

# Verify tables created
psql $DATABASE_URL << EOF
\dt  # List tables
SELECT * FROM users;
SELECT * FROM deployments;
EOF
```

### Manual Schema Creation

```sql
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  rancher_api_url VARCHAR(500),
  rancher_api_token VARCHAR(500),
  rancher_cluster_id VARCHAR(255),
  namespace_counter INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS deployments (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  namespace VARCHAR(255) NOT NULL,
  yaml_config TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  environment VARCHAR(50) DEFAULT 'production',
  workloads_count INT DEFAULT 0,
  resources_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_deployments_user_id ON deployments(user_id);

-- Optional: Create backup user for read-only access
CREATE ROLE backup LOGIN PASSWORD 'backup_password' NOSUPERUSER;
GRANT CONNECT ON DATABASE kubechart TO backup;
GRANT USAGE ON SCHEMA public TO backup;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO backup;
```

### Backup & Recovery

```bash
# Create backup
pg_dump $DATABASE_URL > kubechart-backup-$(date +%Y%m%d).sql

# Automated backups (cron)
0 2 * * * pg_dump $DATABASE_URL > /backups/kubechart-$(date +\%Y\%m\%d).sql

# Restore from backup
psql $DATABASE_URL < kubechart-backup-20240115.sql

# Verify backup
pg_dump --schema-only $DATABASE_URL | grep -E "^CREATE|^ALTER"
```

## Backup & Recovery

### Database Backups

```bash
# Backup script: scripts/backup.sh
#!/bin/bash
set -e

BACKUP_DIR="/backups/kubechart"
DB_URL=$DATABASE_URL
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/kubechart_$TIMESTAMP.sql"

mkdir -p $BACKUP_DIR

# Create backup
pg_dump $DB_URL > $BACKUP_FILE
gzip $BACKUP_FILE

# Keep only last 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE.gz"

# Upload to S3 (optional)
aws s3 cp $BACKUP_FILE.gz s3://your-bucket/backups/
```

Run backup daily:

```bash
# Add to crontab
0 2 * * * /opt/kubechart/scripts/backup.sh
```

### YAML Backups

All deployment YAML is stored in database. To export:

```bash
# Export all deployments for a user
psql $DATABASE_URL << EOF
\copy (SELECT yaml_config FROM deployments WHERE user_id = 1) TO 'deployments.sql'
EOF

# Create archive
tar czf backups-user1-$(date +%Y%m%d).tar.gz deployments.sql
```

### Restore Procedure

```bash
# 1. Stop application
docker stop kubechart

# 2. Restore database
psql $DATABASE_URL < kubechart-backup-20240115.sql

# 3. Verify data
psql $DATABASE_URL -c "SELECT COUNT(*) FROM deployments;"

# 4. Restart application
docker start kubechart

# 5. Test deployment retrieval
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/deployments
```

## Monitoring & Logging

### Application Logs

```bash
# Docker logs
docker logs -f kubechart

# Docker compose logs
docker-compose logs -f app

# Kubernetes logs
kubectl logs -f deployment/kubechart -n kubechart

# Tail last 100 lines
kubectl logs --tail=100 deployment/kubechart -n kubechart

# View logs with timestamps
kubectl logs deployment/kubechart -n kubechart --timestamps=true
```

### Health Checks

```bash
# API health
curl http://localhost:3000/api/ping

# Database health
psql $DATABASE_URL -c "SELECT 1;"

# Kubernetes health
kubectl describe pod <pod-name> -n kubechart

# Check recent errors
kubectl logs deployment/kubechart -n kubechart | grep -i error
```

### Metrics & Monitoring (Production)

Recommended monitoring setup:

```bash
# Prometheus metrics
npm install prom-client

# ELK Stack (Elasticsearch, Logstash, Kibana)
docker pull docker.elastic.co/kibana/kibana:8.0.0

# Datadog agent
npm install dd-trace

# New Relic
npm install newrelic
```

### Log Aggregation

Configure structured logging:

```javascript
// server/logging.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

export default logger;
```

## Troubleshooting

### Common Issues

#### Database Connection Failed

**Error:** `Error: connect ECONNREFUSED 127.0.0.1:5432`

**Solution:**
```bash
# Check PostgreSQL is running
pg_isready -h localhost -p 5432

# Check connection string
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1;"

# If using Docker
docker ps | grep postgres
docker logs kubechart-postgres
```

#### JWT Token Invalid

**Error:** `Error: invalid token` or `Error: jwt malformed`

**Solution:**
```bash
# Verify JWT_SECRET is set
echo $JWT_SECRET

# JWT_SECRET must be consistent across runs
# Change will invalidate all existing tokens

# Generate new secret
openssl rand -base64 32 > /tmp/jwt_secret
export JWT_SECRET=$(cat /tmp/jwt_secret)
```

#### Helm/kubectl Not Found

**Error:** `Error: command not found: helm` or `Error: command not found: kubectl`

**Solution:**
```bash
# Install Helm
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x kubectl
sudo mv kubectl /usr/local/bin/

# Verify
helm version
kubectl version --client
```

#### Rancher Credentials Not Set

**Error:** `Rancher RKE2 cluster credentials not configured`

**Solution:**
```sql
-- Set Rancher credentials in database
UPDATE users
SET 
  rancher_api_url = 'https://your-rancher-instance.com',
  rancher_api_token = 'token-xxxxxxxxxx',
  rancher_cluster_id = 'c-xxxxx'
WHERE id = 1;

-- Verify
SELECT rancher_api_url, rancher_cluster_id FROM users WHERE id = 1;
```

#### Insufficient Disk Space

**Error:** `Error: ENOSPC: no space left on device`

**Solution:**
```bash
# Check disk usage
df -h

# Free up space
docker system prune -a  # Remove unused Docker resources
rm /backups/kubechart-*.sql.gz  # Remove old backups

# Expand volume (for cloud deployments)
# AWS: Extend EBS volume size
# GCP: Expand persistent disk
```

#### Memory Issues

**Error:** `JavaScript heap out of memory` or `FATAL ERROR`

**Solution:**
```bash
# Increase Node.js memory
NODE_OPTIONS="--max-old-space-size=2048" pnpm start

# Docker: Set memory limit
docker run -m 2g kubechart:latest

# Kubernetes: Adjust resource limits
kubectl set resources deployment/kubechart \
  -n kubechart \
  --limits=memory=2Gi,cpu=1000m
```

### Performance Issues

#### Slow API Responses

```bash
# Check database performance
psql $DATABASE_URL << EOF
SELECT * FROM pg_stat_statements ORDER BY mean_time DESC;
EOF

# Enable query logging
ALTER SYSTEM SET log_min_duration_statement = 1000;
SELECT pg_reload_conf();

# Check indexes
psql $DATABASE_URL -c "\d+ deployments"
```

#### High CPU Usage

```bash
# Monitor Node.js process
top -p $(pgrep -f "node")

# Check for infinite loops
npm install clinic
clinic doctor -- node dist/server/node-build.mjs

# Profile with Chrome DevTools
node --inspect=0.0.0.0:9229 dist/server/node-build.mjs
# Open chrome://inspect
```

#### Memory Leaks

```bash
# Take heap snapshot
node --inspect dist/server/node-build.mjs
# Open chrome://inspect -> Memory -> Take snapshot

# Monitor memory usage over time
node --max-http-header-size=1024000 dist/server/node-build.mjs
```

## Operations Checklist

### Pre-Deployment

- [ ] All tests passing (`pnpm test`)
- [ ] No TypeScript errors (`pnpm typecheck`)
- [ ] No ESLint warnings (`pnpm lint`)
- [ ] Documentation updated
- [ ] CHANGELOG updated
- [ ] Security audit completed
- [ ] Database backups taken
- [ ] Staging environment tested

### Deployment

- [ ] Build artifacts generated (`pnpm build`)
- [ ] Docker image built and pushed
- [ ] Environment variables configured
- [ ] Database connection verified
- [ ] JWT_SECRET configured and secure
- [ ] Rancher credentials set (if using Advanced deployment)
- [ ] SSL/TLS certificates configured
- [ ] Health checks enabled
- [ ] Monitoring configured

### Post-Deployment

- [ ] Application started successfully
- [ ] API endpoints responding (`curl /api/ping`)
- [ ] Database queries working
- [ ] Authentication functional (test signup/login)
- [ ] Deployment functionality tested
- [ ] Logs monitored for errors
- [ ] Performance baseline established
- [ ] Alerts configured

### Regular Maintenance

- [ ] Database backups running daily
- [ ] Logs reviewed weekly
- [ ] Security updates applied monthly
- [ ] SSL certificates renewed
- [ ] Dependencies updated
- [ ] Performance monitored
- [ ] Capacity planning reviewed quarterly
- [ ] Disaster recovery tested annually

### Security Maintenance

- [ ] JWT_SECRET rotated periodically
- [ ] Database user passwords changed
- [ ] Rancher tokens validated
- [ ] Security patches applied
- [ ] Access logs reviewed
- [ ] SSL/TLS configuration updated
- [ ] Security scanning enabled
- [ ] Compliance audit performed

## Additional Resources

- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Kubernetes Deployment Guide](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)
- [Helm Best Practices](https://helm.sh/docs/chart_best_practices/)
- [Docker Security](https://docs.docker.com/engine/security/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
