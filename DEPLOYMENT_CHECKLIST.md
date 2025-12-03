# Docker and Kubernetes Deployment Checklist

## Files Created

### Docker Files
- ✅ `Dockerfile` - Multi-stage Docker build configuration
- ✅ `.dockerignore` - Files to exclude from Docker build context
- ✅ `docker-compose.yml` - Local development environment setup

### Kubernetes Files
- ✅ `kubernetes/namespace.yaml` - Kubernetes namespace
- ✅ `kubernetes/configmap.yaml` - Application configuration
- ✅ `kubernetes/secret.yaml` - Sensitive configuration (database, secrets)
- ✅ `kubernetes/serviceaccount.yaml` - Service account and RBAC rules
- ✅ `kubernetes/deployment.yaml` - Application deployment (3 replicas)
- ✅ `kubernetes/service.yaml` - ClusterIP and LoadBalancer services
- ✅ `kubernetes/ingress.yaml` - HTTP/HTTPS routing
- ✅ `kubernetes/hpa.yaml` - Horizontal Pod Autoscaler
- ✅ `kubernetes/network-policy.yaml` - Network security policies
- ✅ `kubernetes/kustomization.yaml` - Kustomize configuration
- ✅ `kubernetes/secrets.env` - Environment file for secrets (DO NOT COMMIT)

### Documentation Files
- ✅ `DOCKER_KUBERNETES_DEPLOYMENT.md` - Comprehensive deployment guide
- ✅ `KUBERNETES_QUICK_REFERENCE.md` - Quick reference for common commands
- ✅ `DEPLOYMENT_CHECKLIST.md` - This file

---

## Pre-Deployment Checklist

### 1. Docker Build and Push

- [ ] Install Docker locally
- [ ] Create container registry account (Docker Hub, ECR, GCR, etc.)
- [ ] Build Docker image: `docker build -t your-registry/kubechart:latest .`
- [ ] Test Docker image locally:
  ```bash
  docker run -p 3000:3000 \
    -e NODE_ENV=development \
    -e DATABASE_URL="postgresql://localhost/kubechart" \
    -e JWT_SECRET="test-secret" \
    your-registry/kubechart:latest
  ```
- [ ] Push to registry: `docker push your-registry/kubechart:latest`

### 2. Kubernetes Cluster Preparation

- [ ] Have access to a Kubernetes cluster (1.24+)
- [ ] Install kubectl and configure cluster access
- [ ] Verify cluster connectivity: `kubectl get nodes`
- [ ] Create namespace: `kubectl create namespace kubechart`
- [ ] (Optional) Install ingress controller (nginx-ingress for ingress support)
- [ ] (Optional) Install cert-manager for TLS certificates

### 3. Configuration Management

#### ConfigMap (Non-sensitive)
- [ ] Review `kubernetes/configmap.yaml`
- [ ] Update if needed for your environment
- [ ] Default values are suitable for most cases

#### Secret (Sensitive)
- [ ] Open `kubernetes/secrets.env`
- [ ] Update DATABASE_URL with your PostgreSQL connection string
- [ ] Update JWT_SECRET with a secure random string
  ```bash
  # Generate secure random string
  openssl rand -base64 32
  ```
- [ ] **DO NOT commit `secrets.env` to git** - add to .gitignore

#### Secret.yaml
- [ ] Option 1: Update `kubernetes/secret.yaml` directly
  ```bash
  kubectl create secret generic kubechart-secrets \
    --from-literal=DATABASE_URL="postgresql://user:password@host:5432/db" \
    --from-literal=JWT_SECRET="secure-secret-key" \
    -n kubechart \
    --dry-run=client -o yaml > kubernetes/secret-generated.yaml
  ```
- [ ] Option 2: Use Sealed Secrets for GitOps
- [ ] Option 3: Use External Secrets Operator

### 4. Container Registry Configuration

- [ ] Update container image in `kubernetes/deployment.yaml`
  - [ ] Change `image: your-registry/kubechart:latest`
  - [ ] Change `imagePullPolicy` if needed (IfNotPresent for private registries)
- [ ] If using private registry, create image pull secret:
  ```bash
  kubectl create secret docker-registry regcred \
    --docker-server=your-registry \
    --docker-username=your-username \
    --docker-password=your-password \
    -n kubechart
  ```
- [ ] Add to deployment if needed:
  ```yaml
  imagePullSecrets:
    - name: regcred
  ```

### 5. Ingress Configuration

- [ ] Decide on ingress setup:
  - [ ] LoadBalancer service only (simple)
  - [ ] Ingress with nginx-ingress controller (recommended)
  - [ ] Ingress with TLS/cert-manager (production)

- [ ] If using Ingress:
  - [ ] Update domain in `kubernetes/ingress.yaml`
  - [ ] Replace `kubechart.example.com` with your domain
  - [ ] Ensure DNS is configured to point to ingress IP

### 6. Database Setup

- [ ] Choose database option:
  - [ ] Use managed PostgreSQL (AWS RDS, Cloud SQL, etc.)
  - [ ] Deploy PostgreSQL in Kubernetes cluster
  - [ ] Use existing database

- [ ] Update DATABASE_URL in secrets with correct connection string:
  ```
  postgresql://username:password@hostname:5432/database_name
  ```

- [ ] Verify database connectivity before deployment

### 7. Resource Planning

- [ ] Verify cluster resource availability:
  ```bash
  kubectl top nodes
  kubectl describe nodes
  ```

- [ ] Review resource requests/limits in `kubernetes/deployment.yaml`
  - Default: requests 250m CPU / 512Mi memory
  - Default: limits 500m CPU / 1Gi memory
  - Adjust based on your needs and cluster capacity

- [ ] Review HPA settings in `kubernetes/hpa.yaml`
  - Min replicas: 3
  - Max replicas: 10
  - CPU trigger: 70%
  - Memory trigger: 80%

### 8. Security Review

- [ ] Review RBAC permissions in `kubernetes/serviceaccount.yaml`
- [ ] Review NetworkPolicy in `kubernetes/network-policy.yaml`
- [ ] Verify security context settings in `kubernetes/deployment.yaml`
  - Non-root user: ✓
  - Read-only filesystem: ✓
  - No privilege escalation: ✓
- [ ] Check secret protection:
  - Not in git: ✓
  - Encrypted at rest (if using managed K8s): ✓
  - Limited RBAC access: ✓

---

## Deployment Steps

### Step 1: Prepare Configuration Files

```bash
# 1. Update secrets
nano kubernetes/secrets.env
# Set DATABASE_URL and JWT_SECRET

# 2. Update deployment image
nano kubernetes/deployment.yaml
# Update: image: your-registry/kubechart:latest

# 3. Update ingress domain (if using ingress)
nano kubernetes/ingress.yaml
# Replace kubechart.example.com with your domain
```

### Step 2: Build and Push Docker Image

```bash
# Build
docker build -t your-registry/kubechart:latest .

# Push to registry
docker push your-registry/kubechart:latest

# Verify
docker pull your-registry/kubechart:latest
```

### Step 3: Deploy to Kubernetes

**Option A: Using Kustomize (Recommended)**

```bash
# Create namespace and deploy all resources
kubectl apply -k kubernetes/

# Verify deployment
kubectl get all -n kubechart
```

**Option B: Using kubectl directly**

```bash
# Create namespace
kubectl apply -f kubernetes/namespace.yaml

# Create ConfigMap and Secrets
kubectl apply -f kubernetes/configmap.yaml
kubectl apply -f kubernetes/secret.yaml

# Create RBAC
kubectl apply -f kubernetes/serviceaccount.yaml

# Create network policies
kubectl apply -f kubernetes/network-policy.yaml

# Deploy application
kubectl apply -f kubernetes/deployment.yaml
kubectl apply -f kubernetes/service.yaml
kubectl apply -f kubernetes/hpa.yaml

# Deploy ingress (optional)
kubectl apply -f kubernetes/ingress.yaml
```

### Step 4: Verify Deployment

```bash
# Check deployment status
kubectl rollout status deployment/kubechart -n kubechart

# Check all pods are running
kubectl get pods -n kubechart

# Check services
kubectl get svc -n kubechart

# Check ingress (if deployed)
kubectl get ingress -n kubechart

# View logs
kubectl logs -f -n kubechart -l app=kubechart
```

### Step 5: Access the Application

**Get Access Information:**

```bash
# If using LoadBalancer service
kubectl get svc kubechart-lb -n kubechart
# Access at: http://<EXTERNAL-IP>

# If using Ingress
kubectl get ingress -n kubechart
# Access at: https://kubechart.example.com (after DNS configured)

# For local testing
kubectl port-forward svc/kubechart 3000:80 -n kubechart
# Access at: http://localhost:3000
```

---

## Post-Deployment Verification

- [ ] Application is responding to requests
  ```bash
  kubectl port-forward svc/kubechart 3000:80 -n kubechart
  curl http://localhost:3000/api/ping
  # Should return: {"message":"ping"}
  ```

- [ ] Health checks are passing
  ```bash
  kubectl get pods -n kubechart
  # Status should be "Running"
  # Ready should be "1/1"
  ```

- [ ] HPA is working
  ```bash
  kubectl get hpa -n kubechart
  # View target CPU and memory usage
  ```

- [ ] Logs are normal
  ```bash
  kubectl logs -n kubechart -l app=kubechart
  # No error messages in logs
  ```

- [ ] Database connectivity verified
  - Application should be able to connect to database
  - Check logs for any database errors

- [ ] Environment variables are set correctly
  ```bash
  kubectl exec -it -n kubechart <pod-name> -- env | grep NODE_ENV
  kubectl exec -it -n kubechart <pod-name> -- env | grep DATABASE_URL
  ```

---

## Troubleshooting

### Issue: Pod not starting

```bash
# Check logs
kubectl logs -n kubechart <pod-name>

# Check events
kubectl describe pod -n kubechart <pod-name>

# Common causes:
# - Image not found: Check docker push succeeded
# - Secrets not set: Check secret is created
# - Database unreachable: Verify DATABASE_URL
```

### Issue: CrashLoopBackOff

```bash
# Check previous logs
kubectl logs -n kubechart <pod-name> --previous

# Check environment variables
kubectl exec -it -n kubechart <pod-name> -- env

# Common causes:
# - Wrong DATABASE_URL
# - Missing JWT_SECRET
# - Node.js startup error
```

### Issue: ImagePullBackOff

```bash
# Verify image was pushed
docker pull your-registry/kubechart:latest

# Check image registry settings
kubectl describe pod -n kubechart <pod-name>

# Common causes:
# - Image doesn't exist in registry
# - Private registry - missing image pull secret
# - Wrong registry URL in deployment.yaml
```

### Issue: Service unreachable

```bash
# Check service endpoints
kubectl get endpoints -n kubechart

# Check pod logs
kubectl logs -n kubechart -l app=kubechart

# Test connectivity from pod
kubectl run -it --rm debug --image=busybox --restart=Never \
  -- wget -O- http://kubechart.kubechart.svc.cluster.local/api/ping
```

---

## Rollback Procedure

```bash
# Check deployment history
kubectl rollout history deployment/kubechart -n kubechart

# Rollback to previous version
kubectl rollout undo deployment/kubechart -n kubechart

# Rollback to specific revision
kubectl rollout undo deployment/kubechart --to-revision=2 -n kubechart

# Check rollback status
kubectl rollout status deployment/kubechart -n kubechart
```

---

## Performance Tuning

### Resource Limits

Adjust in `kubernetes/deployment.yaml` based on monitoring:

```yaml
resources:
  requests:
    cpu: 250m      # Increase if frequently hitting limits
    memory: 512Mi  # Increase if OOMKilled
  limits:
    cpu: 500m
    memory: 1Gi
```

### Scaling

Manual or automatic scaling in `kubernetes/hpa.yaml`:

```yaml
minReplicas: 3      # Increase for high availability
maxReplicas: 10     # Increase if expecting traffic spikes
```

### Database Optimization

- Enable connection pooling if supported
- Increase pool size if seeing connection errors
- Monitor slow queries

---

## Security Hardening

- [ ] Secrets management:
  - [ ] Use sealed-secrets or external-secrets
  - [ ] Never commit secrets.env to git
  - [ ] Rotate JWT_SECRET regularly

- [ ] RBAC:
  - [ ] Review role permissions
  - [ ] Use least privilege principle
  - [ ] Regularly audit access

- [ ] Network:
  - [ ] Keep NetworkPolicy restrictive
  - [ ] Use TLS for all communications
  - [ ] Monitor network traffic

- [ ] Image:
  - [ ] Use minimal base images (alpine)
  - [ ] Scan images for vulnerabilities
  - [ ] Use signed images in production

- [ ] Pod Security:
  - [ ] Run as non-root user
  - [ ] Use read-only root filesystem
  - [ ] Drop unnecessary capabilities
  - [ ] Set resource limits

---

## Monitoring Setup

### Prometheus (Optional)

```bash
# Install Prometheus
kubectl apply -f https://github.com/prometheus-operator/prometheus-operator/releases/download/v0.70.0/bundle.yaml

# Pod already has prometheus annotations:
# prometheus.io/scrape: "true"
# prometheus.io/port: "3000"
# prometheus.io/path: "/api/metrics"
```

### Log Aggregation (Optional)

- Use ELK Stack
- Use Splunk
- Use CloudWatch
- Use Datadog

### Alerting (Optional)

Set up alerts for:
- Pod CrashLoopBackOff
- High CPU/Memory usage
- Service unreachable
- Database connection errors

---

## Maintenance Tasks

### Regular Updates

```bash
# Check for updates to base image
docker pull node:22-alpine

# Rebuild and deploy new version
docker build -t your-registry/kubechart:v1.1.0 .
docker push your-registry/kubechart:v1.1.0

# Update deployment
kubectl set image deployment/kubechart \
  kubechart=your-registry/kubechart:v1.1.0 \
  -n kubechart
```

### Backup

- Database backups (daily)
- ConfigMap and Secret backups
- Application code versioning in git

### Log Rotation

Configure based on your logging setup:
- Kubernetes logs: Usually handled by container runtime
- Application logs: Configure in application
- Aggregated logs: Depends on logging solution

---

## Go-Live Checklist

- [ ] All configuration verified
- [ ] Database backup taken
- [ ] Monitoring and alerts configured
- [ ] Disaster recovery plan documented
- [ ] Team trained on operations
- [ ] Runbook created for common issues
- [ ] Rollback procedure tested
- [ ] Load testing completed
- [ ] Security audit passed
- [ ] DNS records updated (for ingress)
- [ ] TLS certificates configured
- [ ] Documentation up to date
- [ ] Team on-call schedule established

---

## Support and Resources

- **Kubernetes Docs**: https://kubernetes.io/docs/
- **Docker Docs**: https://docs.docker.com/
- **Quick Reference**: See `KUBERNETES_QUICK_REFERENCE.md`
- **Detailed Guide**: See `DOCKER_KUBERNETES_DEPLOYMENT.md`
