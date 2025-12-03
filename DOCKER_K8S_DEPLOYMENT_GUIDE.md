# Docker & Kubernetes Deployment Guide

This guide explains how to use the two separate deployment scripts:
1. **`docker-build.sh`** - Builds and pushes Docker container
2. **`k8s-deploy.sh`** - Deploys container to Kubernetes cluster

## Prerequisites

### For Docker Build
- Docker installed and running
- (Optional) Docker registry account (Docker Hub, ECR, GCR, etc.)
- Git with the KubeChart repository cloned

### For Kubernetes Deployment
- kubectl installed and configured
- Active Kubernetes cluster connection (`kubectl cluster-info`)
- Access to the cluster (admin or deployment permissions)
- PostgreSQL database running (or connection details)

## Quick Start

### Step 1: Build Docker Container

```bash
# Make script executable
chmod +x docker-build.sh

# Edit configuration (top of file)
vi docker-build.sh
# Update: REGISTRY_URL, REGISTRY_USERNAME, REGISTRY_PASSWORD, IMAGE_TAG

# Run build script
./docker-build.sh
```

### Step 2: Deploy to Kubernetes

```bash
# Make script executable
chmod +x k8s-deploy.sh

# Edit configuration (top of file)
vi k8s-deploy.sh
# Update: KUBECHART_IMAGE, DATABASE_HOST, DATABASE_PASSWORD, JWT_SECRET

# Run deployment script
./k8s-deploy.sh
```

## Detailed Workflow

### Phase 1: Docker Container Build

#### 1.1 Configure docker-build.sh

Open `docker-build.sh` and update these variables:

```bash
# Line 7-16: Docker Build Configuration
REGISTRY_URL="your-registry.com"          # e.g., docker.io, gcr.io, ecr.aws
REGISTRY_USERNAME="your-username"
REGISTRY_PASSWORD="your-password"
IMAGE_NAME="kubechart"
IMAGE_TAG="latest"                        # Or use semantic versioning: v1.0.0
DOCKERFILE="Dockerfile"
BUILD_CONTEXT="."
```

**Common Registry URLs:**
- Docker Hub: `docker.io`
- Google Container Registry: `gcr.io/your-project`
- AWS ECR: `your-account.dkr.ecr.region.amazonaws.com`
- Azure: `yourregistry.azurecr.io`

#### 1.2 Run Build Script

```bash
chmod +x docker-build.sh
./docker-build.sh
```

**What the script does:**
1. ✅ Verifies Docker installation
2. ✅ Checks Dockerfile exists
3. ✅ Builds multi-architecture image (if buildx available)
4. ✅ Verifies image integrity
5. ✅ (Optional) Tests image with health check
6. ✅ (Optional) Logs into registry and pushes image

#### 1.3 Build Output

After successful build, you'll have:
- Local Docker image: `your-registry.com/kubechart:latest`
- (Optional) Image pushed to registry
- Image metadata available for deployment

**Example output:**
```
Size: 245000000 bytes
Created: 2024-01-15T10:30:45Z
Health Check: PASS
✓ Image pushed successfully
```

### Phase 2: Kubernetes Deployment

#### 2.1 Configure k8s-deploy.sh

Open `k8s-deploy.sh` and update these variables:

```bash
# Line 7-32: Kubernetes Deployment Configuration
KUBE_CONTEXT=""                           # Leave empty for current context
KUBE_NAMESPACE="kubechart"
KUBECHART_IMAGE="your-registry.com/kubechart:latest"  # MUST match docker-build.sh
DEPLOYMENT_NAME="kubechart"
REPLICAS=3

# Database Configuration
DATABASE_HOST="postgres.kubechart.svc.cluster.local"  # Your PostgreSQL host
DATABASE_PORT=5432
DATABASE_NAME="kubechart"
DATABASE_USER="deployer_user"
DATABASE_PASSWORD="deployer_password"    # Change this!
JWT_SECRET="your-secret-jwt-key"         # Change this!

# Resource Configuration
CPU_REQUEST="100m"
CPU_LIMIT="500m"
MEMORY_REQUEST="256Mi"
MEMORY_LIMIT="512Mi"
```

**Important:** The `KUBECHART_IMAGE` must match the image name from `docker-build.sh`.

#### 2.2 Run Deployment Script

```bash
chmod +x k8s-deploy.sh
./k8s-deploy.sh
```

**What the script does:**
1. ✅ Verifies kubectl is installed and cluster is accessible
2. ✅ Creates namespace (if not exists)
3. ✅ Creates database credentials secret
4. ✅ Creates application secrets (JWT)
5. ✅ Creates ConfigMap with environment variables
6. ✅ Updates and applies deployment manifest
7. ✅ Applies service manifest
8. ✅ Applies HTTPRoute (Envoy Gateway integration)
9. ✅ Applies HorizontalPodAutoscaler
10. ✅ Waits for rollout (max 300 seconds)
11. ✅ Verifies deployment status
12. ✅ Displays access information

#### 2.3 Deployment Output

After successful deployment, you'll see:
```
Deployment Summary:
  Namespace:      kubechart
  Deployment:     kubechart
  Image:          your-registry.com/kubechart:latest
  Replicas:       3
  Status:         True

Useful commands:
  # View logs
  kubectl logs -n kubechart -l app=kubechart -f
  
  # Check pods
  kubectl get pods -n kubechart
  
  # Port forward
  kubectl port-forward -n kubechart svc/kubechart 3000:3000
```

## Configuration Details

### docker-build.sh Configuration

| Variable | Purpose | Example |
|----------|---------|---------|
| `REGISTRY_URL` | Docker registry hostname | `docker.io` or `gcr.io/project` |
| `REGISTRY_USERNAME` | Registry login username | `your-username` |
| `REGISTRY_PASSWORD` | Registry login password | `your-token-or-password` |
| `IMAGE_NAME` | Image name | `kubechart` |
| `IMAGE_TAG` | Image version tag | `latest`, `v1.0.0`, `prod` |
| `DOCKERFILE` | Path to Dockerfile | `./Dockerfile` |
| `BUILD_CONTEXT` | Build context directory | `.` (current dir) |

### k8s-deploy.sh Configuration

| Variable | Purpose | Example |
|----------|---------|---------|
| `KUBE_CONTEXT` | kubectl context to use | Leave empty for current |
| `KUBE_NAMESPACE` | Kubernetes namespace | `kubechart` |
| `KUBECHART_IMAGE` | Full image URL to deploy | `docker.io/user/kubechart:latest` |
| `REPLICAS` | Number of pod replicas | `3` |
| `DATABASE_HOST` | PostgreSQL hostname | `postgres.kubechart.svc.cluster.local` |
| `DATABASE_PORT` | PostgreSQL port | `5432` |
| `DATABASE_NAME` | Database name | `kubechart` |
| `DATABASE_USER` | Database user | `deployer_user` |
| `DATABASE_PASSWORD` | Database password | `secure-password` |
| `JWT_SECRET` | JWT signing secret | `your-secret-key` |
| `CPU_REQUEST` | Minimum CPU per pod | `100m` |
| `CPU_LIMIT` | Maximum CPU per pod | `500m` |
| `MEMORY_REQUEST` | Minimum memory per pod | `256Mi` |
| `MEMORY_LIMIT` | Maximum memory per pod | `512Mi` |

## Advanced Usage

### Using Environment Variables (Secrets)

Instead of hardcoding secrets in the script, use environment variables:

```bash
# Export before running script
export REGISTRY_PASSWORD="my-secret-token"
export DATABASE_PASSWORD="secure-db-password"
export JWT_SECRET="secure-jwt-secret"

# Run script (it will use environment variables)
./docker-build.sh
./k8s-deploy.sh
```

### Semantic Versioning

For production deployments, use version tags:

```bash
# In docker-build.sh
IMAGE_TAG="v1.2.3"

# Run build
./docker-build.sh

# This creates: docker.io/user/kubechart:v1.2.3
# And optionally: docker.io/user/kubechart:latest
```

### Multi-Stage Deployment

Deploy to multiple environments:

```bash
# Development deployment
KUBECHART_IMAGE="docker.io/user/kubechart:dev" \
KUBE_NAMESPACE="kubechart-dev" \
REPLICAS=1 \
./k8s-deploy.sh

# Staging deployment
KUBECHART_IMAGE="docker.io/user/kubechart:v1.0.0-rc1" \
KUBE_NAMESPACE="kubechart-staging" \
REPLICAS=2 \
./k8s-deploy.sh

# Production deployment
KUBECHART_IMAGE="docker.io/user/kubechart:v1.0.0" \
KUBE_NAMESPACE="kubechart-prod" \
REPLICAS=3 \
./k8s-deploy.sh
```

### Custom Health Checks

The scripts include built-in health checks:

**Docker Build:**
- Container health check: `curl http://localhost:3000/api/ping`

**Kubernetes Deployment:**
- Liveness probe: Checks `/api/ping` every 10 seconds
- Readiness probe: Checks `/api/ping` every 5 seconds
- Initial delay: 30s (liveness), 10s (readiness)

### Resource Limits

Adjust based on your cluster capacity:

```bash
# Light workload
CPU_REQUEST="50m"
CPU_LIMIT="200m"
MEMORY_REQUEST="128Mi"
MEMORY_LIMIT="256Mi"

# Medium workload
CPU_REQUEST="100m"
CPU_LIMIT="500m"
MEMORY_REQUEST="256Mi"
MEMORY_LIMIT="512Mi"

# Heavy workload
CPU_REQUEST="500m"
CPU_LIMIT="2000m"
MEMORY_REQUEST="1Gi"
MEMORY_LIMIT="2Gi"
```

## Troubleshooting

### Docker Build Issues

**Issue: "Dockerfile not found"**
```bash
# Verify Dockerfile exists
ls -la Dockerfile

# Update DOCKERFILE variable if in different location
DOCKERFILE="./path/to/Dockerfile"
```

**Issue: "Failed to build image"**
```bash
# Check Docker daemon
docker ps

# View build logs
docker build -f Dockerfile . --progress=plain

# Check for syntax errors
docker build --dry-run -f Dockerfile .
```

**Issue: "Failed to push image"**
```bash
# Verify registry credentials
docker login your-registry.com

# Check image name format
docker images | grep kubechart

# Manually push
docker push your-registry.com/kubechart:latest
```

### Kubernetes Deployment Issues

**Issue: "Cannot connect to cluster"**
```bash
# Verify kubectl config
kubectl config view
kubectl cluster-info

# Switch context if needed
kubectl config use-context your-context
```

**Issue: "ImagePullBackOff"**
```bash
# Verify image exists in registry
docker pull your-registry.com/kubechart:latest

# Check pod events
kubectl describe pod -n kubechart <pod-name>

# Verify image pull secrets (if private registry)
kubectl get secrets -n kubechart
```

**Issue: "Deployment not rolling out"**
```bash
# Check pod status
kubectl get pods -n kubechart -o wide

# View pod logs
kubectl logs -n kubechart <pod-name>

# Check deployment events
kubectl describe deployment kubechart -n kubechart

# View resource usage
kubectl top pods -n kubechart
```

**Issue: "Database connection failed"**
```bash
# Verify database secret
kubectl get secret kubechart-db-credentials -n kubechart -o yaml

# Test database connectivity from pod
kubectl exec -it <pod-name> -n kubechart -- bash
psql -h $DATABASE_HOST -U $DATABASE_USER -d $DATABASE_NAME
```

## Verification Commands

After deployment, use these commands to verify everything is working:

```bash
# 1. Check deployment status
kubectl get deployment -n kubechart
kubectl describe deployment kubechart -n kubechart

# 2. Check pods
kubectl get pods -n kubechart
kubectl describe pod -n kubechart <pod-name>

# 3. Check services
kubectl get svc -n kubechart
kubectl describe svc kubechart -n kubechart

# 4. Check logs
kubectl logs -n kubechart -l app=kubechart
kubectl logs -n kubechart <pod-name> -f  # Follow logs

# 5. Check environment variables
kubectl exec -n kubechart <pod-name> -- env | grep DATABASE

# 6. Test health endpoint
kubectl exec -n kubechart <pod-name> -- curl http://localhost:3000/api/ping

# 7. Check resource usage
kubectl top nodes
kubectl top pods -n kubechart

# 8. View events
kubectl get events -n kubechart --sort-by='.lastTimestamp'

# 9. Port forward for local testing
kubectl port-forward -n kubechart svc/kubechart 3000:3000
# Access: http://localhost:3000

# 10. Check HTTPRoute status (if using Envoy Gateway)
kubectl get httproute -n kubechart
kubectl describe httproute kubechart -n kubechart
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Build and Deploy KubeChart

on:
  push:
    branches: [main, develop]
    tags: ['v*']

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker Image
        env:
          REGISTRY_URL: ${{ secrets.REGISTRY_URL }}
          REGISTRY_USERNAME: ${{ secrets.REGISTRY_USERNAME }}
          REGISTRY_PASSWORD: ${{ secrets.REGISTRY_PASSWORD }}
          IMAGE_TAG: ${{ github.ref_name }}
        run: chmod +x docker-build.sh && ./docker-build.sh
      
      - name: Deploy to Kubernetes
        env:
          KUBECHART_IMAGE: ${{ secrets.REGISTRY_URL }}/kubechart:${{ github.ref_name }}
          DATABASE_PASSWORD: ${{ secrets.DATABASE_PASSWORD }}
          JWT_SECRET: ${{ secrets.JWT_SECRET }}
        run: chmod +x k8s-deploy.sh && ./k8s-deploy.sh
```

## Security Best Practices

1. **Never commit secrets** to git
2. **Use environment variables** for sensitive data
3. **Enable RBAC** in Kubernetes
4. **Use private registries** for production images
5. **Scan images** for vulnerabilities
6. **Rotate secrets** regularly
7. **Use SecurityContext** (scripts include this)
8. **Enable network policies** (kubernetes/network-policy.yaml)

## Performance Optimization

1. **Adjust resource limits** based on load
2. **Enable HPA** for auto-scaling (included)
3. **Use node affinity** for pod distribution
4. **Enable caching** in Docker build
5. **Optimize base image** (using Alpine)
6. **Multi-stage build** (Dockerfile uses this)

## Rollback Procedures

### Rollback Docker Image

```bash
# Previous image tag
IMAGE_TAG="v1.0.0"
./docker-build.sh

# Deploy previous version
KUBECHART_IMAGE="your-registry.com/kubechart:v1.0.0" ./k8s-deploy.sh
```

### Rollback Kubernetes Deployment

```bash
# View rollout history
kubectl rollout history deployment/kubechart -n kubechart

# Rollback to previous version
kubectl rollout undo deployment/kubechart -n kubechart

# Rollback to specific revision
kubectl rollout undo deployment/kubechart -n kubechart --to-revision=3
```

## Related Documentation

- [ENVOY_GATEWAY_INTEGRATION.md](./ENVOY_GATEWAY_INTEGRATION.md) - Gateway routing setup
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Additional deployment info
- [SECURITY.md](./SECURITY.md) - Security considerations
- [DOCKER_KUBERNETES_DEPLOYMENT.md](./DOCKER_KUBERNETES_DEPLOYMENT.md) - Docker & K8s details

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review logs: `kubectl logs -n kubechart -l app=kubechart`
3. Check events: `kubectl get events -n kubechart`
4. Review system files: `Platform.sh`, `BackupSys.sh`, `DataBase.sh`

## Summary

**docker-build.sh workflow:**
```
docker-build.sh
├── Pre-flight checks (Docker, buildx)
├── Validate config & Dockerfile
├── Build image
├── Verify image
├── (Optional) Test image
└── (Optional) Push to registry
```

**k8s-deploy.sh workflow:**
```
k8s-deploy.sh
├── Pre-flight checks (kubectl, cluster)
├── Validate config
├── Create namespace
├── Create secrets (DB, JWT)
├── Create ConfigMap
├── Update deployment manifest
├── Apply deployment/service/httproute/hpa
├── Wait for rollout
├── Verify deployment
└── Display access information
```

Both scripts are **fully automated** and can be used in CI/CD pipelines!
