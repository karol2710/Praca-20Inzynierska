# Deployment Guide

Complete guide to deploying KubeChart and managing Kubernetes deployments.

## Pre-Deployment Checklist

Before deploying, ensure you have:

- [ ] Node.js v18+ installed
- [ ] pnpm v8+ installed
- [ ] PostgreSQL database set up
- [ ] Kubernetes cluster accessible (v1.24+)
- [ ] kubectl configured
- [ ] Sufficient cluster permissions (cluster-admin or equivalent)
- [ ] Docker installed (for containerization)

## Environment Setup

### 1. Configure Environment Variables

Create `.env` file in root directory:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/kubechart

# Server
NODE_ENV=production
PORT=8080

# Security
API_SECRET=your_secret_key_here

# Optional: Kubernetes Config
KUBECONFIG=/path/to/kubeconfig
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Build for Production

```bash
pnpm build
```

This creates optimized build in `dist/` directory.

## Local Deployment

### Development Environment

```bash
# Start development server
pnpm dev

# Access at http://localhost:8080
```

### Production Environment (Local)

```bash
# Build application
pnpm build

# Start production server
pnpm start

# Access at http://localhost:8080
```

## Docker Deployment

### Build Docker Image

```bash
# Using build script
./docker-build.sh

# Or manually
docker build -t kubechart:latest .
```

### Run Docker Container

```bash
# Basic run
docker run -p 8080:8080 kubechart:latest

# With environment variables
docker run \
  -e DATABASE_URL=postgresql://user:pass@db:5432/kubechart \
  -e NODE_ENV=production \
  -p 8080:8080 \
  kubechart:latest

# With volume mounting
docker run \
  -v ~/.kube/config:/home/app/.kube/config:ro \
  -e KUBECONFIG=/home/app/.kube/config \
  -p 8080:8080 \
  kubechart:latest
```

### Docker Compose

```bash
# Start services
docker-compose up -d

# Check services
docker-compose ps

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Kubernetes Deployment

### Prerequisites for K8s Deployment

1. **Kubernetes Cluster Access**
   ```bash
   kubectl cluster-info
   kubectl auth can-i create deployments
   ```

2. **Create ConfigMap/Secret** (optional)
   ```bash
   kubectl create configmap kubechart-config \
     --from-literal=NODE_ENV=production \
     --namespace kubechart
   ```

3. **Create Database Secret**
   ```bash
   kubectl create secret generic kubechart-db \
     --from-literal=DATABASE_URL=postgresql://user:pass@db:5432/kubechart \
     --namespace kubechart
   ```

### Automated Deployment

Use the provided deployment script:

```bash
# Deploy KubeChart to Kubernetes
./k8s-deploy2.sh

# This script will:
# - Create 'kubechart' namespace
# - Set up service accounts and RBAC
# - Deploy KubeChart application
# - Configure ingress and networking
```

### Manual Deployment

If you prefer manual deployment:

```bash
# 1. Create namespace
kubectl create namespace kubechart

# 2. Apply deployment manifest
kubectl apply -f kubernetes/deployment.yaml -n kubechart

# 3. Apply service
kubectl apply -f kubernetes/service.yaml -n kubechart

# 4. Apply ingress (if using)
kubectl apply -f kubernetes/ingress.yaml -n kubechart

# 5. Verify deployment
kubectl get all -n kubechart
```

### Verify Kubernetes Deployment

```bash
# Check pods
kubectl get pods -n kubechart
kubectl logs -n kubechart deployment/kubechart

# Check services
kubectl get svc -n kubechart

# Check ingress
kubectl get ingress -n kubechart

# Test connectivity
kubectl port-forward -n kubechart svc/kubechart 8080:8080
# Access http://localhost:8080
```

## Deployment Verification

### Application Health Check

```bash
# Check if application is running
curl http://localhost:8080

# Check API health
curl http://localhost:8080/api/ping

# Check logs
# Docker
docker logs <container_id>

# Kubernetes
kubectl logs -n kubechart deployment/kubechart
```

### Database Connectivity

```bash
# Test database connection
psql $DATABASE_URL -c "SELECT 1"

# For Kubernetes deployment
kubectl run -it --rm debug --image=postgres --restart=Never -- \
  psql $DATABASE_URL -c "SELECT 1"
```

## Application Startup

### First Time Setup

When you first access KubeChart:

1. **Create Account**
   ```
   Navigate to http://localhost:8080
   Click "Create Account"
   Enter username and password
   Click "Create Account"
   ```

2. **Login**
   ```
   Enter your username
   Enter your password
   Click "Sign In"
   ```

3. **Create Your First Deployment**
   ```
   Click "Create Chart" in sidebar
   Fill in deployment details
   Configure workloads
   Click "Deploy"
   ```

## Updating Deployments

### Edit Existing Deployment

```bash
# Via UI
1. Go to "Deployments" page
2. Click "Edit" button on deployment
3. Modify settings
4. Save changes
```

### Update in Kubernetes

Changes made in KubeChart are automatically applied to Kubernetes cluster. No manual kubectl commands needed.

## Deployment Troubleshooting

### Issue: Database Connection Failed

```bash
# Check environment variables
echo $DATABASE_URL

# Test database
psql $DATABASE_URL -c "SELECT 1"

# For Docker
docker exec <container_id> psql $DATABASE_URL -c "SELECT 1"

# Fix: Update .env or set env vars
export DATABASE_URL=postgresql://user:pass@host:5432/db
```

### Issue: Kubernetes API Connection Error

```bash
# Verify kubeconfig
kubectl config current-context
kubectl cluster-info

# Check service account permissions
kubectl auth can-i create deployments

# For Kubernetes deployment, check pod logs
kubectl logs -n kubechart deployment/kubechart
```

### Issue: Port Already in Use

```bash
# Find process using port
lsof -i :8080

# Kill process
kill -9 <PID>

# Or use different port
PORT=3000 pnpm start
```

### Issue: Application Won't Start

```bash
# Check logs
docker logs <container_id>
# or
kubectl logs -n kubechart deployment/kubechart

# Check application status
docker ps
# or
kubectl get pods -n kubechart

# Check resource availability
docker system df
# or
kubectl top nodes
```

## Production Deployment Best Practices

### 1. Use Environment Variables
```bash
# Don't hardcode secrets
# Use environment variables for all sensitive data
```

### 2. Database Backup
```bash
# Regular backups
pg_dump $DATABASE_URL > backup.sql

# For Kubernetes, use managed database service
# (Cloud SQL, RDS, etc.)
```

### 3. Monitoring
```bash
# Monitor application logs
kubectl logs -f -n kubechart deployment/kubechart

# Monitor resource usage
kubectl top nodes
kubectl top pods -n kubechart
```

### 4. Scaling
```bash
# Scale deployment to multiple replicas
kubectl scale deployment kubechart \
  --replicas=3 \
  -n kubechart

# Set up horizontal pod autoscaling
kubectl apply -f kubernetes/hpa.yaml -n kubechart
```

### 5. TLS/HTTPS

```bash
# Create TLS secret
kubectl create secret tls kubechart-tls \
  --cert=path/to/cert.crt \
  --key=path/to/key.key \
  -n kubechart

# Update ingress to use TLS
kubectl patch ingress kubechart -p \
  '{"spec":{"tls":[{"hosts":["example.com"],"secretName":"kubechart-tls"}]}}' \
  -n kubechart
```

## Rollback & Disaster Recovery

### Rollback Deployment

```bash
# View deployment history
kubectl rollout history deployment/kubechart -n kubechart

# Rollback to previous version
kubectl rollout undo deployment/kubechart -n kubechart

# Rollback to specific revision
kubectl rollout undo deployment/kubechart \
  --to-revision=2 \
  -n kubechart
```

### Data Recovery

```bash
# Restore from backup
psql $DATABASE_URL < backup.sql

# Verify data
psql $DATABASE_URL -c "SELECT COUNT(*) FROM deployments"
```

## Maintenance

### Regular Tasks

| Task | Frequency | Command |
|---|---|---|
| Database backup | Daily | `pg_dump > backup.sql` |
| Log rotation | Weekly | Check logging config |
| Dependency updates | Monthly | `pnpm update` |
| Security patches | As needed | `pnpm audit` |
| Capacity monitoring | Weekly | `kubectl top` |

### Update KubeChart

```bash
# Pull latest changes
git pull origin main

# Install dependencies
pnpm install

# Build new version
pnpm build

# For Kubernetes, update image
kubectl set image deployment/kubechart \
  kubechart=kubechart:new-version \
  -n kubechart
```

## Deployment Scenarios

### Scenario 1: Development

```bash
# Single container, local database
pnpm dev

# Access at http://localhost:8080
```

### Scenario 2: Staging on Docker

```bash
# Build image
docker build -t kubechart:latest .

# Run with Docker Compose
docker-compose up -d

# Access at http://localhost:8080
```

### Scenario 3: Production on Kubernetes

```bash
# Deploy using script
./k8s-deploy2.sh

# Verify
kubectl get all -n kubechart

# Monitor
kubectl logs -f -n kubechart deployment/kubechart
```

## Security Considerations

1. **Use HTTPS** - Always use TLS in production
2. **Secrets Management** - Never commit secrets to git
3. **RBAC** - Limit Kubernetes permissions
4. **Network Policies** - Restrict pod communication
5. **Regular Updates** - Keep dependencies updated
6. **Monitoring** - Track and log all access

---

See also:
- [Getting Started](GETTING_STARTED.md)
- [Kubernetes Integration](KUBERNETES.md)
- [Troubleshooting](TROUBLESHOOTING.md)
