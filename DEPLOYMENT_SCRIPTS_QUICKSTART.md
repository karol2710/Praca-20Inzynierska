# KubeChart Deployment Scripts - Quick Start

Two separate scripts for container building and Kubernetes deployment.

## Files

| File                             | Purpose                      |
| -------------------------------- | ---------------------------- |
| `docker-build.sh`                | Build Docker container image |
| `k8s-deploy.sh`                  | Deploy to Kubernetes cluster |
| `DOCKER_K8S_DEPLOYMENT_GUIDE.md` | Complete guide with examples |

## 5-Minute Setup

### 1. Edit docker-build.sh

```bash
vi docker-build.sh
```

Update lines 7-16:

```bash
REGISTRY_URL="docker.io"              # Your registry
REGISTRY_USERNAME="your-username"
REGISTRY_PASSWORD="your-token"
IMAGE_TAG="latest"                    # Or: v1.0.0
```

### 2. Build Container

```bash
chmod +x docker-build.sh
./docker-build.sh
```

Answer prompts:

- Test image? → `y` (optional)
- Push to registry? → `y` (optional)

Result: Docker image ready at `docker.io/your-username/kubechart:latest`

### 3. Edit k8s-deploy.sh

```bash
vi k8s-deploy.sh
```

Update lines 7-32 (critical ones):

```bash
KUBECHART_IMAGE="docker.io/your-username/kubechart:latest"  # ← Must match above
DATABASE_HOST="your-postgres-host"    # Or: postgres.kubechart.svc.cluster.local
DATABASE_PASSWORD="your-db-password"
JWT_SECRET="your-secret-key"
```

### 4. Deploy to Kubernetes

```bash
chmod +x k8s-deploy.sh
./k8s-deploy.sh
```

Script will:

- ✅ Create namespace
- ✅ Create secrets
- ✅ Deploy application
- ✅ Wait for pods to be ready
- ✅ Show access information

Done! Application is now running in Kubernetes.

## Typical Flow

```bash
# 1. Clone repository
git clone <repo-url>
cd kubechart

# 2. Build container
./docker-build.sh

# 3. Deploy to Kubernetes
./k8s-deploy.sh

# 4. Verify
kubectl get pods -n kubechart
kubectl port-forward -n kubechart svc/kubechart 3000:3000

# Access: http://localhost:3000
```

## Configuration Comparison

### docker-build.sh

Controls what image is **built and pushed**:

```bash
REGISTRY_URL="docker.io"
REGISTRY_USERNAME="user"
IMAGE_NAME="kubechart"
IMAGE_TAG="v1.0.0"
# Result: docker.io/user/kubechart:v1.0.0
```

### k8s-deploy.sh

Controls what image is **deployed** and how:

```bash
KUBECHART_IMAGE="docker.io/user/kubechart:v1.0.0"  # ← Must match above
REPLICAS=3
KUBE_NAMESPACE="kubechart"
# Deploys that image with 3 replicas
```

**Important:** The image names must match!

## Common Scenarios

### Scenario 1: Local Development

```bash
# Build with local image
IMAGE_TAG="dev" ./docker-build.sh

# Deploy to minikube/local cluster
KUBECHART_IMAGE="docker.io/user/kubechart:dev" ./k8s-deploy.sh
```

### Scenario 2: Staging Deployment

```bash
# Build staging image
IMAGE_TAG="staging" ./docker-build.sh

# Deploy to staging namespace
KUBECHART_IMAGE="docker.io/user/kubechart:staging" \
KUBE_NAMESPACE="kubechart-staging" \
REPLICAS=2 \
./k8s-deploy.sh
```

### Scenario 3: Production Deployment

```bash
# Build with version tag
IMAGE_TAG="v1.2.3" ./docker-build.sh

# Deploy to production
KUBECHART_IMAGE="docker.io/user/kubechart:v1.2.3" \
KUBE_NAMESPACE="kubechart-prod" \
REPLICAS=3 \
./k8s-deploy.sh
```

### Scenario 4: Private Registry (AWS ECR)

```bash
# Build for ECR
REGISTRY_URL="123456789.dkr.ecr.us-east-1.amazonaws.com" \
IMAGE_TAG="latest" \
./docker-build.sh

# Deploy
KUBECHART_IMAGE="123456789.dkr.ecr.us-east-1.amazonaws.com/kubechart:latest" \
./k8s-deploy.sh
```

## Required Information Before Starting

### For docker-build.sh:

- [ ] Docker registry URL
- [ ] Registry username
- [ ] Registry password/token
- [ ] Desired image tag

### For k8s-deploy.sh:

- [ ] Built image URL (from step above)
- [ ] Kubernetes cluster access
- [ ] Database host and credentials
- [ ] JWT secret key
- [ ] Deployment namespace

## Verification After Deployment

```bash
# Check pods are running
kubectl get pods -n kubechart

# Check deployment status
kubectl describe deployment kubechart -n kubechart

# View logs
kubectl logs -n kubechart -l app=kubechart

# Test locally
kubectl port-forward -n kubechart svc/kubechart 3000:3000
# Open: http://localhost:3000

# Check Envoy Gateway (if using)
kubectl get httproute -n kubechart
kubectl get svc -n envoy-gateway-system
```

## Troubleshooting

### Script won't run

```bash
chmod +x docker-build.sh
chmod +x k8s-deploy.sh
```

### Docker build fails

```bash
# Check Docker is running
docker ps

# Check Dockerfile exists
ls -la Dockerfile

# View build details
docker build -f Dockerfile . --progress=plain
```

### Kubernetes deployment fails

```bash
# Check cluster connection
kubectl cluster-info

# Check image exists
docker images | grep kubechart

# Check if image is in registry
docker pull your-registry/kubechart:tag
```

### Pods won't start

```bash
# View pod events
kubectl describe pod -n kubechart <pod-name>

# Check logs
kubectl logs -n kubechart <pod-name>

# Check image pull errors
kubectl get events -n kubechart

# Verify secrets exist
kubectl get secrets -n kubechart
```

## Environment Variables (Secure Method)

Instead of editing files:

```bash
# Set environment variables
export REGISTRY_PASSWORD="my-secret"
export DATABASE_PASSWORD="db-secret"
export JWT_SECRET="jwt-secret"

# Run scripts (they read env vars)
./docker-build.sh
./k8s-deploy.sh
```

## Next Steps

1. **Read full guide:** `DOCKER_K8S_DEPLOYMENT_GUIDE.md`
2. **Setup Platform:** Use `Platform.sh` for gateway/storage/load-balancer
3. **Setup Database:** Use `DataBase.sh` for PostgreSQL
4. **Setup Backup:** Use `BackupSys.sh` for Velero/MinIO backup
5. **Monitor:** Use `kubectl logs`, `kubectl top`, Prometheus

## Files Reference

```
├── docker-build.sh              ← Build container
├── k8s-deploy.sh                ← Deploy to Kubernetes
├── DOCKER_K8S_DEPLOYMENT_GUIDE.md  ← Full documentation
├── Dockerfile                   ← Container definition
├── kubernetes/                  ← K8s manifests
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── httproute.yaml
│   └── ...
└── System files:
    ├── Platform.sh              ← MetalLB, Envoy, cert-manager, Longhorn
    ├── DataBase.sh              ← PostgreSQL setup
    └── BackupSys.sh             ← Velero + MinIO backup
```

## Command Cheat Sheet

```bash
# Build
./docker-build.sh

# Deploy
./k8s-deploy.sh

# Monitor
kubectl get pods -n kubechart -w

# Logs
kubectl logs -n kubechart -l app=kubechart -f

# Access
kubectl port-forward -n kubechart svc/kubechart 3000:3000

# Rollout status
kubectl rollout status deployment/kubechart -n kubechart

# Rollback
kubectl rollout undo deployment/kubechart -n kubechart

# Restart
kubectl rollout restart deployment/kubechart -n kubechart

# Scale
kubectl scale deployment/kubechart --replicas=5 -n kubechart

# Delete
kubectl delete deployment kubechart -n kubechart
```

## System Integration

These scripts work with your system infrastructure:

```
Platform.sh (MetalLB + Envoy Gateway)
        ↓
k8s-deploy.sh (Deploys KubeChart)
        ↓
DataBase.sh (PostgreSQL connection)
        ↓
BackupSys.sh (Velero backups)
```

## Support Resources

- Full guide: [DOCKER_K8S_DEPLOYMENT_GUIDE.md](./DOCKER_K8S_DEPLOYMENT_GUIDE.md)
- Gateway setup: [ENVOY_GATEWAY_INTEGRATION.md](./ENVOY_GATEWAY_INTEGRATION.md)
- Security: [SECURITY.md](./SECURITY.md)
- System setup: Platform.sh, DataBase.sh, BackupSys.sh

---

**Ready to deploy?** Start with `./docker-build.sh` → then `./k8s-deploy.sh`
