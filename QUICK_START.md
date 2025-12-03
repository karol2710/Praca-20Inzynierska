# Quick Start - Deploy KubeChart in 5 Minutes

This is the fastest way to get KubeChart running in Kubernetes.

## Prerequisites

- Docker installed (`docker --version`)
- kubectl installed (`kubectl version --client`)
- Kubernetes cluster running (`kubectl cluster-info`)
- Container registry account (Docker Hub, ECR, GCR, etc.)

## Option A: Automated Deployment (Recommended)

### 1. Prepare Secrets (1 minute)

```bash
# Edit the secrets file
nano kubernetes/secrets.env

# Update these two lines:
DATABASE_URL=postgresql://user:password@postgres.example.com:5432/kubechart
JWT_SECRET=your-secure-jwt-secret-key
```

### 2. Run Deployment Script (4 minutes)

```bash
# Make script executable
chmod +x deploy.sh

# Run deployment (replace with your registry)
./deploy.sh docker.io/myusername v1.0.0

# Or with GCR
./deploy.sh gcr.io/my-project v1.0.0

# Or with ECR
./deploy.sh 123456789.dkr.ecr.us-east-1.amazonaws.com/kubechart v1.0.0
```

**Done!** Your app is now deployed. The script will:
- ✅ Build Docker image
- ✅ Push to registry
- ✅ Update Kubernetes manifests
- ✅ Deploy to your cluster
- ✅ Wait for pods to be ready

---

## Option B: Manual Deployment

### 1. Prepare Secrets (1 minute)

```bash
nano kubernetes/secrets.env
```

Update:
```
DATABASE_URL=postgresql://user:password@host:5432/db
JWT_SECRET=your-secure-secret
```

### 2. Update Image Registry (1 minute)

```bash
# Edit deployment
nano kubernetes/deployment.yaml

# Change this line:
image: your-registry/kubechart:latest
# To:
image: docker.io/myusername/kubechart:latest
```

### 3. Build and Push Docker Image (2 minutes)

```bash
# Build
docker build -t docker.io/myusername/kubechart:latest .

# Push
docker push docker.io/myusername/kubechart:latest
```

### 4. Deploy to Kubernetes (1 minute)

```bash
# Deploy everything
kubectl apply -k kubernetes/

# Or manually:
# kubectl apply -f kubernetes/namespace.yaml
# kubectl apply -f kubernetes/configmap.yaml
# kubectl apply -f kubernetes/secret.yaml
# kubectl apply -f kubernetes/serviceaccount.yaml
# kubectl apply -f kubernetes/deployment.yaml
# kubectl apply -f kubernetes/service.yaml
# kubectl apply -f kubernetes/hpa.yaml
```

---

## Verify Deployment

```bash
# Check if pods are running
kubectl get pods -n kubechart

# Expected output:
# NAME                        READY   STATUS    RESTARTS   AGE
# kubechart-xxxxx-xxxxx       1/1     Running   0          10s
# kubechart-xxxxx-xxxxx       1/1     Running   0          10s
# kubechart-xxxxx-xxxxx       1/1     Running   0          10s

# View logs
kubectl logs -f -n kubechart -l app=kubechart

# Access the app
kubectl port-forward -n kubechart svc/kubechart 3000:80
# Then visit: http://localhost:3000
```

---

## Common Next Steps

### 1. Set Up Ingress (HTTPS)

```bash
# Update domain in kubernetes/ingress.yaml
nano kubernetes/ingress.yaml

# Change:
# - kubechart.example.com
# To your actual domain

# Deploy ingress
kubectl apply -f kubernetes/ingress.yaml

# Check status
kubectl get ingress -n kubechart
```

### 2. Get External IP (Load Balancer)

```bash
# For LoadBalancer service
kubectl get svc kubechart-lb -n kubechart

# Wait for EXTERNAL-IP to be assigned
# Then access at: http://<EXTERNAL-IP>
```

### 3. View Application Logs

```bash
# Real-time logs
kubectl logs -f -n kubechart -l app=kubechart

# Logs from specific pod
kubectl logs -f -n kubechart <pod-name>

# Last 100 lines
kubectl logs -n kubechart -l app=kubechart --tail=100
```

### 4. Update Application

```bash
# 1. Build new image
docker build -t docker.io/myusername/kubechart:v1.1.0 .

# 2. Push new image
docker push docker.io/myusername/kubechart:v1.1.0

# 3. Update deployment
kubectl set image deployment/kubechart \
  kubechart=docker.io/myusername/kubechart:v1.1.0 \
  -n kubechart

# 4. Check rollout
kubectl rollout status deployment/kubechart -n kubechart
```

---

## Troubleshooting

### Pod won't start

```bash
# Check logs
kubectl logs -f -n kubechart <pod-name>

# Common issues:
# - DATABASE_URL is wrong
# - JWT_SECRET is missing
# - Image doesn't exist in registry
```

### Can't push Docker image

```bash
# Login to registry
docker login docker.io

# Or for other registries
docker login gcr.io
docker login -u AWS amazon.dkr.ecr.us-east-1.amazonaws.com

# Then try push again
docker push docker.io/myusername/kubechart:latest
```

### Can't access application

```bash
# Check if pods are running
kubectl get pods -n kubechart

# Check if service exists
kubectl get svc -n kubechart

# Try port-forward
kubectl port-forward -n kubechart svc/kubechart 3000:80

# In another terminal, test:
curl http://localhost:3000/api/ping
```

---

## What Was Created

### Docker Setup
- `Dockerfile` - Multi-stage build
- `.dockerignore` - Build context optimization
- `docker-compose.yml` - Local development

### Kubernetes Setup
- `kubernetes/` directory with all manifests
  - Deployment (3 replicas)
  - Service (ClusterIP + LoadBalancer)
  - ConfigMap (configuration)
  - Secret (sensitive data)
  - Ingress (HTTPS routing)
  - HPA (auto-scaling)
  - And more...

### Deployment Tools
- `deploy.sh` - Automated deployment script
- Complete documentation guides

---

## Detailed Documentation

For more detailed information:

1. **Quick Reference**: `KUBERNETES_QUICK_REFERENCE.md`
   - Copy-paste ready commands
   - Common operations

2. **Comprehensive Guide**: `DOCKER_KUBERNETES_DEPLOYMENT.md`
   - Complete setup instructions
   - Architecture overview
   - Advanced configuration

3. **Deployment Checklist**: `DEPLOYMENT_CHECKLIST.md`
   - Pre-flight checks
   - Step-by-step procedures
   - Troubleshooting

---

## Support

**Issue with Docker?**
- See: DOCKER_KUBERNETES_DEPLOYMENT.md → "Building Docker Images"

**Issue with Kubernetes?**
- See: KUBERNETES_QUICK_REFERENCE.md → "Common Issues"

**Need detailed setup?**
- See: DOCKER_KUBERNETES_DEPLOYMENT.md → Full guide

**Quick commands?**
- See: KUBERNETES_QUICK_REFERENCE.md

---

## That's It! 🎉

You now have:
- ✅ Containerized application (Docker)
- ✅ Kubernetes-ready manifests
- ✅ Scalable deployment (3-10 replicas)
- ✅ Auto-healing (restarts failed pods)
- ✅ Load balancing
- ✅ Automatic scaling (HPA)
- ✅ HTTPS support (Ingress + TLS)
- ✅ Security (RBAC, NetworkPolicy, non-root)

Continue with the detailed documentation for advanced configuration!
