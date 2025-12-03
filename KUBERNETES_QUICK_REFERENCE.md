# Kubernetes Deployment Quick Reference

## Build and Push Docker Image

```bash
# Build Docker image
docker build -t your-registry/kubechart:latest .

# Push to registry
docker push your-registry/kubechart:latest

# Build and push in one command
docker build -t your-registry/kubechart:latest . && docker push your-registry/kubechart:latest
```

## Deploy to Kubernetes

### Using Kustomize (Recommended - One Command)

```bash
# Deploy all manifests
kubectl apply -k kubernetes/

# Dry-run (preview changes without applying)
kubectl apply -k kubernetes/ --dry-run=client -o yaml

# Delete everything
kubectl delete -k kubernetes/
```

### Using Individual Kubectl Commands

```bash
# Create namespace
kubectl apply -f kubernetes/namespace.yaml

# Create configs and secrets
kubectl apply -f kubernetes/configmap.yaml
kubectl apply -f kubernetes/secret.yaml

# Create RBAC
kubectl apply -f kubernetes/serviceaccount.yaml

# Create network policies
kubectl apply -f kubernetes/network-policy.yaml

# Deploy application
kubectl apply -f kubernetes/deployment.yaml
kubectl apply -f kubernetes/service.yaml
kubectl apply -f kubernetes/ingress.yaml
kubectl apply -f kubernetes/hpa.yaml
```

## Verify Deployment

```bash
# Check deployment status
kubectl get deployment -n kubechart

# Check pods
kubectl get pods -n kubechart

# Check services
kubectl get svc -n kubechart

# Check ingress
kubectl get ingress -n kubechart

# View all resources
kubectl get all -n kubechart
```

## View Logs

```bash
# View logs from all pods
kubectl logs -f -n kubechart -l app=kubechart

# View logs from specific pod
kubectl logs -f -n kubechart <pod-name>

# View logs from previous crashed pod
kubectl logs -n kubechart <pod-name> --previous

# Tail last 100 lines
kubectl logs -n kubechart -l app=kubechart --tail=100
```

## Debugging

```bash
# Describe pod for events
kubectl describe pod -n kubechart <pod-name>

# Execute command in pod
kubectl exec -it -n kubechart <pod-name> -- /bin/sh

# Port forward to access service locally
kubectl port-forward -n kubechart svc/kubechart 3000:80

# Check resource usage
kubectl top pods -n kubechart
kubectl top nodes
```

## Configuration Updates

```bash
# Update ConfigMap
kubectl set env configmap/kubechart-config NODE_ENV=production -n kubechart

# Update image (trigger rollout)
kubectl set image deployment/kubechart kubechart=your-registry/kubechart:v2.0.0 -n kubechart

# Restart deployment
kubectl rollout restart deployment/kubechart -n kubechart

# Check rollout status
kubectl rollout status deployment/kubechart -n kubechart

# Rollback to previous version
kubectl rollout undo deployment/kubechart -n kubechart
```

## Secrets Management

```bash
# Create secret
kubectl create secret generic kubechart-secrets \
  --from-literal=DATABASE_URL="postgresql://..." \
  --from-literal=JWT_SECRET="secret" \
  -n kubechart

# Update secret
kubectl patch secret kubechart-secrets -n kubechart \
  -p '{"data":{"DATABASE_URL":"'$(echo -n 'new-url' | base64)'"}}'

# Delete and recreate secret
kubectl delete secret kubechart-secrets -n kubechart
kubectl create secret generic kubechart-secrets \
  --from-literal=DATABASE_URL="postgresql://..." \
  -n kubechart

# View secret (base64 encoded)
kubectl get secret kubechart-secrets -n kubechart -o yaml
```

## Scaling

```bash
# Manual scaling
kubectl scale deployment kubechart --replicas=5 -n kubechart

# View HPA status
kubectl get hpa -n kubechart

# Describe HPA for detailed info
kubectl describe hpa kubechart -n kubechart

# Edit HPA
kubectl edit hpa kubechart -n kubechart
```

## Health & Monitoring

```bash
# View pod status
kubectl get pods -n kubechart -o wide

# View deployment health
kubectl get deployment -n kubechart -o wide

# Check service endpoints
kubectl get endpoints -n kubechart

# Monitor HPA scaling
kubectl get hpa -n kubechart -w
```

## Cleanup

```bash
# Delete deployment
kubectl delete deployment kubechart -n kubechart

# Delete entire namespace
kubectl delete namespace kubechart

# Delete with Kustomize
kubectl delete -k kubernetes/

# Delete all resources matching label
kubectl delete all -n kubechart -l app=kubechart
```

## Network Debugging

```bash
# Check NetworkPolicy
kubectl get networkpolicy -n kubechart

# Test connectivity from pod
kubectl run -it --rm debug --image=busybox --restart=Never \
  -- wget -O- http://kubechart.kubechart.svc.cluster.local

# Check DNS
kubectl run -it --rm debug --image=busybox --restart=Never \
  -- nslookup kubechart.kubechart.svc.cluster.local

# Check service endpoints
kubectl get endpoints -n kubechart
```

## Environment Variables and Configuration

### Update ConfigMap

```bash
# Edit ConfigMap inline
kubectl set env configmap/kubechart-config \
  NODE_ENV=production \
  LOG_LEVEL=debug \
  -n kubechart

# Edit ConfigMap interactively
kubectl edit configmap kubechart-config -n kubechart

# Create new ConfigMap
kubectl create configmap kubechart-config \
  --from-literal=NODE_ENV=production \
  --from-literal=PORT=3000 \
  -n kubechart
```

### Update Secret

```bash
# Create new secret
kubectl create secret generic kubechart-secrets \
  --from-literal=DATABASE_URL='postgresql://user:pass@host/db' \
  --from-literal=JWT_SECRET='your-secret' \
  -n kubechart

# From environment file
kubectl create secret generic kubechart-secrets \
  --from-env-file=kubernetes/secrets.env \
  -n kubechart

# From files
kubectl create secret generic kubechart-secrets \
  --from-file=DATABASE_URL=./db-url.txt \
  --from-file=JWT_SECRET=./jwt-secret.txt \
  -n kubechart
```

## Common Issues

### Pod stuck in CrashLoopBackOff

```bash
# Check logs
kubectl logs -n kubechart <pod-name> --previous

# Check configuration
kubectl describe pod -n kubechart <pod-name>

# Restart pod
kubectl delete pod -n kubechart <pod-name>
```

### ImagePullBackOff

```bash
# Check if image exists
docker pull your-registry/kubechart:latest

# Check image pull secrets
kubectl get secrets -n kubechart

# Update image in deployment
kubectl set image deployment/kubechart \
  kubechart=your-registry/kubechart:latest \
  -n kubechart
```

### Service not responding

```bash
# Check service exists
kubectl get svc -n kubechart

# Check endpoints
kubectl get endpoints -n kubechart

# Check pods are running
kubectl get pods -n kubechart

# Port forward and test
kubectl port-forward svc/kubechart 3000:80 -n kubechart
# In another terminal: curl http://localhost:3000/api/ping
```

## Useful Aliases

```bash
# Add to your shell profile (~/.bashrc, ~/.zshrc, etc)
alias k=kubectl
alias kgp='kubectl get pods -n kubechart'
alias kl='kubectl logs -f -n kubechart'
alias kd='kubectl describe pod -n kubechart'
alias ke='kubectl exec -it -n kubechart'
alias kdel='kubectl delete -n kubechart'

# Usage examples:
# k get pods -n kubechart
# kgp
# kl -l app=kubechart
# kd <pod-name>
# ke <pod-name> -- /bin/sh
```

## Quick Setup Script

```bash
#!/bin/bash
set -e

REGISTRY=${1:-"your-registry"}
VERSION=${2:-"latest"}

echo "Building Docker image..."
docker build -t ${REGISTRY}/kubechart:${VERSION} .

echo "Pushing to registry..."
docker push ${REGISTRY}/kubechart:${VERSION}

echo "Updating Kubernetes manifests..."
sed -i "s|your-registry/kubechart:latest|${REGISTRY}/kubechart:${VERSION}|g" kubernetes/deployment.yaml

echo "Deploying to Kubernetes..."
kubectl apply -k kubernetes/

echo "Checking deployment status..."
kubectl rollout status deployment/kubechart -n kubechart

echo "Deployment complete!"
```

Save as `deploy.sh` and run:

```bash
chmod +x deploy.sh
./deploy.sh your-registry v1.0.0
```
