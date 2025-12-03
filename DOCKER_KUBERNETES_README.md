# KubeChart - Docker and Kubernetes Deployment

Complete containerization and Kubernetes deployment setup for the KubeChart application.

## What's Included

### Docker Configuration
- ✅ **Dockerfile** - Multi-stage build optimized for production
  - Build stage: Builds client + server with all dependencies
  - Production stage: Only runtime dependencies (optimized image size ~200MB)
  - Non-root user for security
  - Health checks built-in

- ✅ **.dockerignore** - Excludes unnecessary files from build context

- ✅ **docker-compose.yml** - Local development environment
  - PostgreSQL database (port 5432)
  - KubeChart app (port 3000)
  - Automatic service linking
  - Volume management

### Kubernetes Deployment
Complete production-ready Kubernetes setup in `kubernetes/` directory:

| File | Purpose |
|------|---------|
| `namespace.yaml` | Isolate resources in `kubechart` namespace |
| `configmap.yaml` | Non-sensitive configuration (NODE_ENV, PORT, LOG_LEVEL) |
| `secret.yaml` | Sensitive data (DATABASE_URL, JWT_SECRET) |
| `serviceaccount.yaml` | Service account + RBAC permissions |
| `deployment.yaml` | Main app deployment (3 replicas, health checks, resource limits) |
| `service.yaml` | ClusterIP + LoadBalancer services |
| `ingress.yaml` | HTTPS routing with cert-manager support |
| `hpa.yaml` | Auto-scaling (3-10 replicas based on CPU/Memory) |
| `network-policy.yaml` | Network security policies |
| `kustomization.yaml` | Kustomize configuration for simplified management |
| `secrets.env` | Environment file for secrets (⚠️ DO NOT COMMIT) |

### Documentation
- ✅ **DOCKER_KUBERNETES_DEPLOYMENT.md** (679 lines)
  - Complete setup guide
  - Docker configuration details
  - Kubernetes architecture overview
  - Step-by-step deployment instructions
  - Troubleshooting guide
  - Advanced configuration options

- ✅ **KUBERNETES_QUICK_REFERENCE.md** (355 lines)
  - Quick reference for common commands
  - Copy-paste ready commands
  - Useful aliases
  - Quick setup script

- ✅ **DEPLOYMENT_CHECKLIST.md** (543 lines)
  - Pre-deployment checklist
  - Step-by-step deployment procedure
  - Post-deployment verification
  - Troubleshooting guide
  - Security hardening checklist
  - Go-live checklist

---

## Quick Start

### 1. Local Development with Docker Compose

```bash
# Start PostgreSQL + App
docker-compose up -d

# View logs
docker-compose logs -f app

# Access application
# http://localhost:3000
```

### 2. Build and Push Docker Image

```bash
# Build image
docker build -t your-registry/kubechart:latest .

# Push to registry
docker push your-registry/kubechart:latest
```

### 3. Deploy to Kubernetes (One Command)

```bash
# Update secrets first
nano kubernetes/secrets.env  # Set DATABASE_URL and JWT_SECRET

# Deploy
kubectl apply -k kubernetes/

# Check status
kubectl get pods -n kubechart
kubectl logs -f -n kubechart -l app=kubechart
```

---

## Architecture

### Docker Image Build Process

```
┌─────────────────────────────┐
│   Build Stage               │
│                             │
│ - node:22-alpine base       │
│ - Install build tools       │
│ - Install dependencies      │
│ - Build client (Vite)       │
│ - Build server (Node)       │
│ - Size: ~800MB              │
└──────────┬──────────────────┘
           │
           │ Copy artifacts
           │
┌──────────▼──────────────────┐
│   Production Stage          │
│                             │
│ - node:22-alpine base       │
│ - Install production deps   │
│ - Non-root user (nodejs)    │
│ - Health checks             │
│ - Size: ~200MB ✓            │
└─────────────────────────────┘
```

### Kubernetes Architecture

```
┌─────────────────────────────────────┐
│   Kubernetes Cluster                │
│   Namespace: kubechart              │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ Ingress (HTTPS + TLS)         │  │
│  │ kubechart.example.com         │  │
│  └───────────┬───────────────────┘  │
│              │                       │
│  ┌───────────▼───────────────────┐  │
│  │ Service (ClusterIP)           │  │
│  │ Port: 80 → Container: 3000    │  │
│  └───────────┬───────────────────┘  │
│              │                       │
│  ┌───────────▼───────────────────┐  │
│  │ Deployment (3-10 replicas)    │  │
│  │ HPA: CPU 70% / Memory 80%     │  │
│  │                               │  │
│  │  Pod 1  ┌─────────────────┐   │  │
│  │         │ kubechart app   │   │  │
│  │         │ Node.js + React │   │  │
│  │         └─────────────────┘   │  │
│  │  Pod 2  ┌─────────────────┐   │  │
│  │         │ kubechart app   │   │  │
│  │         │ Node.js + React │   │  │
│  │         └─────────────────┘   │  │
│  │  Pod 3  ┌─────────────────┐   │  │
│  │         │ kubechart app   │   │  │
│  │         │ Node.js + React │   │  │
│  │         └─────────────────┘   │  │
│  └───────────────────────────────┘  │
│                                     │
│  ConfigMap: App Configuration       │
│  Secret: DB URL, JWT Secret         │
│  ServiceAccount: RBAC Permissions   │
│  NetworkPolicy: Security            │
│                                     │
└─────────────────────────────────────┘
```

---

## Key Features

### Security
- ✅ Non-root container user
- ✅ Read-only root filesystem option
- ✅ No privilege escalation
- ✅ Dropped unnecessary Linux capabilities
- ✅ RBAC with least privilege permissions
- ✅ Network policies for pod-to-pod communication
- ✅ Secrets management (ConfigMap + Secret)

### High Availability
- ✅ 3 default replicas for redundancy
- ✅ Pod anti-affinity for distribution across nodes
- ✅ Rolling update strategy
- ✅ Readiness and liveness probes
- ✅ Graceful shutdown on termination

### Scalability
- ✅ Horizontal Pod Autoscaler (3-10 replicas)
- ✅ CPU-based scaling (70% threshold)
- ✅ Memory-based scaling (80% threshold)
- ✅ Custom scaling policies

### Monitoring & Health
- ✅ Liveness probe (healthcheck)
- ✅ Readiness probe (traffic readiness)
- ✅ Prometheus-compatible metrics endpoint
- ✅ Structured logging ready

### Production Ready
- ✅ Multi-stage Docker build
- ✅ Minimal image size
- ✅ Resource requests and limits
- ✅ ConfigMap for configuration
- ✅ Secrets for sensitive data
- ✅ Ingress with TLS support
- ✅ Kustomize for easy customization

---

## Configuration

### Environment Variables

**ConfigMap (Non-sensitive):**
```yaml
NODE_ENV: production
PORT: 3000
LOG_LEVEL: info
```

**Secrets (Sensitive):**
```
DATABASE_URL: postgresql://user:password@host:5432/db
JWT_SECRET: your-secure-jwt-secret-key
```

### Update Configuration

**Before Deployment:**
```bash
# Edit secrets
nano kubernetes/secrets.env
# Set DATABASE_URL and JWT_SECRET

# Edit deployment image
nano kubernetes/deployment.yaml
# Change: image: your-registry/kubechart:latest
```

**After Deployment:**
```bash
# Update ConfigMap
kubectl set env configmap/kubechart-config NODE_ENV=production -n kubechart

# Restart deployment (picks up new ConfigMap)
kubectl rollout restart deployment/kubechart -n kubechart

# Update image (triggers rolling update)
kubectl set image deployment/kubechart \
  kubechart=your-registry/kubechart:v1.1.0 \
  -n kubechart
```

---

## Deployment Steps

### Prerequisites
- Kubernetes 1.24+ cluster
- kubectl configured
- Docker installed
- Container registry account

### Step 1: Prepare

```bash
# 1. Update secrets
nano kubernetes/secrets.env
# Set: DATABASE_URL and JWT_SECRET

# 2. Update image registry
nano kubernetes/deployment.yaml
# Change: image: your-registry/kubechart:latest
```

### Step 2: Build & Push

```bash
# Build Docker image
docker build -t your-registry/kubechart:latest .

# Push to registry
docker push your-registry/kubechart:latest
```

### Step 3: Deploy

```bash
# Option A: Kustomize (Recommended)
kubectl apply -k kubernetes/

# Option B: Individual files
kubectl apply -f kubernetes/namespace.yaml
kubectl apply -f kubernetes/configmap.yaml
kubectl apply -f kubernetes/secret.yaml
kubectl apply -f kubernetes/serviceaccount.yaml
kubectl apply -f kubernetes/deployment.yaml
kubectl apply -f kubernetes/service.yaml
kubectl apply -f kubernetes/hpa.yaml
kubectl apply -f kubernetes/ingress.yaml
```

### Step 4: Verify

```bash
# Check deployment
kubectl get deployment -n kubechart

# Check pods
kubectl get pods -n kubechart

# Check services
kubectl get svc -n kubechart

# View logs
kubectl logs -f -n kubechart -l app=kubechart
```

### Step 5: Access

```bash
# Get external IP
kubectl get svc kubechart-lb -n kubechart

# Or use port forwarding
kubectl port-forward svc/kubechart 3000:80 -n kubechart
# Then: http://localhost:3000
```

---

## Troubleshooting

### Check pod status
```bash
kubectl get pods -n kubechart
kubectl describe pod -n kubechart <pod-name>
```

### View logs
```bash
kubectl logs -f -n kubechart <pod-name>
```

### Common issues and solutions are documented in:
- **DOCKER_KUBERNETES_DEPLOYMENT.md** → "Monitoring and Troubleshooting"
- **DEPLOYMENT_CHECKLIST.md** → "Troubleshooting"
- **KUBERNETES_QUICK_REFERENCE.md** → "Common Issues"

---

## Cleanup

```bash
# Delete entire namespace
kubectl delete namespace kubechart

# Or using Kustomize
kubectl delete -k kubernetes/
```

---

## Advanced Topics

### Database Setup
- See: DOCKER_KUBERNETES_DEPLOYMENT.md → "Configuration and Secrets"

### TLS/HTTPS
- See: DOCKER_KUBERNETES_DEPLOYMENT.md → "Advanced Configuration"

### Custom Domain
- See: DOCKER_KUBERNETES_DEPLOYMENT.md → "Custom Domain"

### Resource Tuning
- See: DOCKER_KUBERNETES_DEPLOYMENT.md → "Resource Management"

### Monitoring
- See: DOCKER_KUBERNETES_DEPLOYMENT.md → "Monitoring and Troubleshooting"

### GitOps Workflow
- Use Kustomize with ArgoCD
- Use Sealed Secrets for secrets management
- See: KUBERNETES_QUICK_REFERENCE.md → "Secrets Management"

---

## File Structure

```
root/
├── Dockerfile                           # Production-optimized multi-stage build
├── .dockerignore                        # Files to exclude from Docker context
├── docker-compose.yml                   # Local development environment
│
├── kubernetes/                          # Kubernetes manifests
│   ├── namespace.yaml                   # kubechart namespace
│   ├── configmap.yaml                   # Configuration
│   ├── secret.yaml                      # Sensitive data
│   ├── serviceaccount.yaml              # RBAC
│   ├── deployment.yaml                  # Main deployment
│   ├── service.yaml                     # Services (ClusterIP + LB)
│   ├── ingress.yaml                     # HTTP/HTTPS routing
│   ├── hpa.yaml                         # Horizontal Pod Autoscaler
│   ├── network-policy.yaml              # Network security
│   ├── kustomization.yaml               # Kustomize config
│   └── secrets.env                      # Secrets file (⚠️ DO NOT COMMIT)
│
├── DOCKER_KUBERNETES_DEPLOYMENT.md      # Comprehensive guide (679 lines)
├── KUBERNETES_QUICK_REFERENCE.md        # Quick reference (355 lines)
├── DEPLOYMENT_CHECKLIST.md              # Checklists (543 lines)
└── DOCKER_KUBERNETES_README.md          # This file
```

---

## Next Steps

1. **Read the guides:**
   - Quick start: KUBERNETES_QUICK_REFERENCE.md
   - Detailed setup: DOCKER_KUBERNETES_DEPLOYMENT.md
   - Pre-flight checks: DEPLOYMENT_CHECKLIST.md

2. **Prepare your environment:**
   - Set up Kubernetes cluster
   - Create container registry account
   - Update secrets in kubernetes/secrets.env

3. **Build and deploy:**
   - Build Docker image
   - Push to registry
   - Run `kubectl apply -k kubernetes/`

4. **Verify and test:**
   - Check pod status
   - View logs
   - Test application endpoints

5. **Configure monitoring:**
   - Set up Prometheus (optional)
   - Configure alerts
   - Enable log aggregation

---

## Support

For detailed information, refer to:
- **Docker issues**: See section in DOCKER_KUBERNETES_DEPLOYMENT.md
- **Kubernetes issues**: See troubleshooting sections
- **Quick commands**: See KUBERNETES_QUICK_REFERENCE.md
- **Deployment help**: See DEPLOYMENT_CHECKLIST.md

---

## Version Information

- **Kubernetes**: 1.24+
- **Docker**: 20.10+
- **Node.js**: 22
- **Base Image**: node:22-alpine
- **Final Image Size**: ~200MB

---

**Ready to deploy?** Start with the [KUBERNETES_QUICK_REFERENCE.md](KUBERNETES_QUICK_REFERENCE.md) for quick commands, or [DOCKER_KUBERNETES_DEPLOYMENT.md](DOCKER_KUBERNETES_DEPLOYMENT.md) for comprehensive setup instructions.
