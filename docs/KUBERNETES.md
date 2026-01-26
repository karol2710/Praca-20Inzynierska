# Kubernetes Integration

Complete guide to using KubeChart with Kubernetes.

## Prerequisites

### Cluster Requirements

- **Kubernetes Version**: 1.24 or higher
- **API Server Access**: Public or internal access
- **Service Account**: With appropriate permissions
- **Storage**: For PostgreSQL data (if using persistent volumes)

### CLI Tools

```bash
# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x kubectl
sudo mv kubectl /usr/local/bin/

# Verify installation
kubectl version --client
kubectl cluster-info
```

### Verify Cluster Access

```bash
# Check cluster connectivity
kubectl cluster-info

# Check current context
kubectl config current-context

# List available contexts
kubectl config get-contexts

# Verify permissions
kubectl auth can-i create deployments
```

## Kubernetes Architecture in KubeChart

### Namespace Organization

KubeChart uses the following namespace strategy:

```
Cluster
├── kubechart
│   ├── Deployment: kubechart (app)
│   ├── Service: kubechart (expose app)
│   ├── ServiceAccount: kubechart
│   ├── ClusterRole: kubechart
│   └── ClusterRoleBinding: kubechart
│
└── User Namespaces (auto-created)
    ├── namespace1 (user deployment 1)
    ├── namespace2 (user deployment 2)
    └── namespaceN (user deployment N)
```

### Service Account & RBAC

KubeChart uses a ClusterRole with specific permissions:

```yaml
rules:
  - apiGroups: [""]
    resources: ["pods", "services", "configmaps", "secrets"]
    verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]

  - apiGroups: ["apps"]
    resources: ["deployments", "statefulsets", "replicasets"]
    verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]

  - apiGroups: ["batch"]
    resources: ["jobs", "cronjobs"]
    verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]

  - apiGroups: ["networking.k8s.io"]
    resources: ["networkpolicies", "ingresses"]
    verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]

  - apiGroups: ["gateway.networking.k8s.io"]
    resources: ["httproutes", "backendtrafficpolicies"]
    verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
```

## Deploying to Kubernetes

### Automated Deployment

```bash
# Run deployment script
./k8s-deploy2.sh

# This script:
# 1. Creates 'kubechart' namespace
# 2. Sets up service account
# 3. Creates ClusterRole and ClusterRoleBinding
# 4. Deploys KubeChart application
# 5. Configures networking
```

### What the Script Does

```bash
#!/bin/bash

# 1. Create namespace
kubectl create namespace kubechart

# 2. Create service account
kubectl create serviceaccount kubechart -n kubechart

# 3. Create ClusterRole
kubectl apply -f - <<EOF
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: kubechart
rules:
  # ... (as shown above)
EOF

# 4. Bind role to service account
kubectl create clusterrolebinding kubechart \
  --clusterrole=kubechart \
  --serviceaccount=kubechart:kubechart

# 5. Deploy application
kubectl apply -f kubernetes/deployment.yaml -n kubechart

# 6. Create service
kubectl apply -f kubernetes/service.yaml -n kubechart

# 7. Apply ingress (if configured)
kubectl apply -f kubernetes/ingress.yaml -n kubechart
```

## Accessing KubeChart in Kubernetes

### Port Forwarding

```bash
# Forward local port to service
kubectl port-forward -n kubechart svc/kubechart 8080:8080

# Access at http://localhost:8080
```

### Expose via Service

```bash
# Change service type to LoadBalancer
kubectl patch svc kubechart -n kubechart \
  -p '{"spec":{"type":"LoadBalancer"}}'

# Get external IP
kubectl get svc -n kubechart
```

### Using Ingress

```bash
# Apply ingress configuration
kubectl apply -f kubernetes/ingress.yaml -n kubechart

# Get ingress details
kubectl get ingress -n kubechart

# Check ingress status
kubectl describe ingress kubechart -n kubechart
```

## Managing User Deployments

### From UI to Kubernetes

When you deploy an application via KubeChart UI:

1. **Form Input** → User fills deployment form
2. **Validation** → Server validates inputs
3. **YAML Generation** → Backend generates Kubernetes YAML
4. **API Submission** → YAML sent to Kubernetes API
5. **Creation** → Resources created in cluster
6. **DB Storage** → Configuration saved to database

### View Deployed Resources

```bash
# List all namespaces
kubectl get ns

# List deployments in user namespace
kubectl get deployments -n <namespace>

# View pods
kubectl get pods -n <namespace>

# View services
kubectl get svc -n <namespace>

# View all resources
kubectl get all -n <namespace>

# Describe resource
kubectl describe deployment <name> -n <namespace>
```

### Delete User Resources

KubeChart provides UI for deleting resources, but you can also use kubectl:

```bash
# Delete specific resource
kubectl delete deployment <name> -n <namespace>

# Delete entire namespace (all resources)
kubectl delete namespace <namespace>

# Verify deletion
kubectl get ns
```

## Kubernetes Networking

### Service Discovery

KubeChart automatically creates ClusterIP services:

```bash
# List services
kubectl get svc -n <namespace>

# Service DNS name (within cluster)
<service-name>.<namespace>.svc.cluster.local
```

### HTTPRoute Configuration

For Envoy Gateway integration:

```yaml
apiVersion: gateway.networking.k8s.io/v1beta1
kind: HTTPRoute
metadata:
  name: app-route
  namespace: user-namespace
spec:
  hostnames:
    - app.example.com
  parentRefs:
    - name: envoy-gateway
      namespace: envoy-gateway-system
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /
      backendRefs:
        - name: app-service
          port: 8080
```

### Gateway Configuration

```bash
# Check gateway controller
kubectl get gateway -A

# View HTTPRoutes
kubectl get httproutes -A

# Test route
curl -H "Host: app.example.com" http://<gateway-ip>
```

## RBAC & Security

### Service Account Verification

```bash
# Check service account
kubectl get sa -n kubechart

# Check ClusterRole
kubectl get clusterrole kubechart

# Check ClusterRoleBinding
kubectl get clusterrolebinding kubechart

# Verify permissions
kubectl auth can-i create deployments \
  --as=system:serviceaccount:kubechart:kubechart
```

### Network Policies

```bash
# Check network policies
kubectl get networkpolicies -A

# View policy details
kubectl describe networkpolicy <name> -n <namespace>

# Test connectivity
kubectl run -it --rm debug --image=busybox --restart=Never -- \
  wget -O- http://<service>:<port>
```

## Monitoring & Debugging

### Check Pod Status

```bash
# View pod details
kubectl describe pod <pod-name> -n kubechart

# Check pod logs
kubectl logs <pod-name> -n kubechart

# Stream logs
kubectl logs -f <pod-name> -n kubechart

# View logs from all replicas
kubectl logs -f deployment/kubechart -n kubechart
```

### Resource Usage

```bash
# Node resource usage
kubectl top nodes

# Pod resource usage
kubectl top pods -n kubechart

# Detailed metrics
kubectl describe node <node-name>
```

### Events

```bash
# View cluster events
kubectl get events -A

# View namespace events
kubectl get events -n kubechart

# Watch events
kubectl get events -n kubechart --watch
```

## Scaling & High Availability

### Scale Deployment

```bash
# Scale to 3 replicas
kubectl scale deployment kubechart \
  --replicas=3 \
  -n kubechart

# Verify scaling
kubectl get pods -n kubechart
```

### Horizontal Pod Autoscaler

```bash
# Create HPA
kubectl apply -f kubernetes/hpa.yaml -n kubechart

# View HPA status
kubectl get hpa -n kubechart

# Watch scaling in action
kubectl get hpa -n kubechart --watch
```

### Pod Distribution

```bash
# View pod distribution across nodes
kubectl get pods -o wide -n kubechart

# Set node affinity
kubectl label nodes <node-name> app=kubechart
```

## Storage Management

### PersistentVolumes

```bash
# List PVs
kubectl get pv

# List PVCs
kubectl get pvc -A

# View PVC details
kubectl describe pvc <name> -n kubechart

# Delete PVC
kubectl delete pvc <name> -n kubechart
```

### Data Backup

```bash
# Backup database
kubectl exec -it deployment/kubechart -n kubechart -- \
  pg_dump $DATABASE_URL > backup.sql

# List backups
ls -la *.sql
```

## Troubleshooting

### Issue: Pod Fails to Start

```bash
# Check pod status
kubectl describe pod <pod-name> -n kubechart

# Check logs
kubectl logs <pod-name> -n kubechart

# Check events
kubectl get events -n kubechart --sort-by='.lastTimestamp'
```

### Issue: Service Unreachable

```bash
# Check service
kubectl get svc -n kubechart

# Check endpoints
kubectl get endpoints -n kubechart

# Check DNS resolution
kubectl run -it --rm debug --image=busybox --restart=Never -- \
  nslookup kubechart.kubechart.svc.cluster.local
```

### Issue: No Permission to Create Resources

```bash
# Check current user permissions
kubectl auth can-i create deployments --as=system:serviceaccount:kubechart:kubechart

# Check role binding
kubectl describe clusterrolebinding kubechart

# Check RBAC rules
kubectl describe clusterrole kubechart
```

### Issue: Network Policy Blocking Traffic

```bash
# Check network policies
kubectl get networkpolicies -n <namespace>

# Describe policy
kubectl describe networkpolicy <name> -n <namespace>

# Temporarily remove policy to test
kubectl delete networkpolicy <name> -n <namespace>
```

## Kubernetes Commands Reference

| Command                                        | Purpose            |
| ---------------------------------------------- | ------------------ |
| `kubectl apply -f file.yaml`                   | Apply manifest     |
| `kubectl get <resource> -A`                    | List all resources |
| `kubectl describe <resource> <name>`           | Show details       |
| `kubectl logs <pod>`                           | View pod logs      |
| `kubectl exec -it <pod> -- sh`                 | Shell into pod     |
| `kubectl port-forward <service> 8080:8080`     | Port forward       |
| `kubectl scale deployment <name> --replicas=3` | Scale              |
| `kubectl rollout history deployment/<name>`    | View history       |
| `kubectl rollout undo deployment/<name>`       | Rollback           |
| `kubectl delete <resource> <name>`             | Delete resource    |

## Related Documentation

- [RBAC Configuration](RBAC.md)
- [Resource Management](RESOURCES.md)
- [Deployment Guide](DEPLOYMENT.md)
- [Troubleshooting](TROUBLESHOOTING.md)

---

For more information, see [Kubernetes Official Docs](https://kubernetes.io/docs/)
