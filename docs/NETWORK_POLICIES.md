# Network Policies

Guide to configuring network policies in KubeChart.

## Overview

Network policies control traffic flow between pods and external endpoints. They provide network-level security through ingress and egress rules.

## How Network Policies Work

```
Pod A ──request──> Pod B
         ↓
    Network Policy
         ↓
    Allow/Deny based on rules
```

### Without Network Policy

- All pods can communicate with all other pods
- All outbound traffic is allowed
- Security relies on application level

### With Network Policy

- Only explicitly allowed traffic flows
- Fine-grained control per pod
- "Default Deny" principle

## Creating Network Policies

### Default Deny All Ingress

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-all-ingress
  namespace: my-namespace
spec:
  podSelector: {}
  policyTypes:
  - Ingress
```

**Effect**: No pod can receive traffic from any source

### Allow Specific Ingress

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-web
  namespace: my-namespace
spec:
  podSelector:
    matchLabels:
      app: web
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: frontend
    ports:
    - protocol: TCP
      port: 8080
```

**Effect**: Only pods with label `app: frontend` can access `app: web` on port 8080

### Allow External Traffic

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-external
  namespace: my-namespace
spec:
  podSelector:
    matchLabels:
      app: api
  policyTypes:
  - Ingress
  ingress:
  - from:
    - namespaceSelector: {}
    ports:
    - protocol: TCP
      port: 8080
```

**Effect**: Allow traffic from any namespace (external traffic through ingress)

### Allow Specific Egress

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-egress-dns
  namespace: my-namespace
spec:
  podSelector:
    matchLabels:
      app: web
  policyTypes:
  - Egress
  egress:
  # Allow DNS
  - to:
    - namespaceSelector: {}
    ports:
    - protocol: UDP
      port: 53
  # Allow HTTP/HTTPS
  - to:
    - namespaceSelector: {}
    ports:
    - protocol: TCP
      port: 80
    - protocol: TCP
      port: 443
```

**Effect**: Web pods can only access DNS, HTTP, and HTTPS traffic

## Network Policy Examples

### Example 1: Multi-tier Application

```yaml
# Frontend tier - allow from ingress
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-frontend
spec:
  podSelector:
    matchLabels:
      tier: frontend
  ingress:
  - from:
    - namespaceSelector: {}  # External traffic
    ports:
    - protocol: TCP
      port: 80
    - protocol: TCP
      port: 443

---
# Backend tier - allow from frontend only
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-backend
spec:
  podSelector:
    matchLabels:
      tier: backend
  ingress:
  - from:
    - podSelector:
        matchLabels:
          tier: frontend
    ports:
    - protocol: TCP
      port: 8080

---
# Database tier - allow from backend only
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-database
spec:
  podSelector:
    matchLabels:
      tier: database
  ingress:
  - from:
    - podSelector:
        matchLabels:
          tier: backend
    ports:
    - protocol: TCP
      port: 5432
```

### Example 2: Default Deny with Explicit Allow

```yaml
# Deny all ingress
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-ingress
spec:
  podSelector: {}
  policyTypes:
  - Ingress

---
# Deny all egress
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-egress
spec:
  podSelector: {}
  policyTypes:
  - Egress

---
# Allow specific service access
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-service
spec:
  podSelector:
    matchLabels:
      app: myapp
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          role: client
    ports:
    - protocol: TCP
      port: 8080
  egress:
  - to:
    - podSelector:
        matchLabels:
          role: database
    ports:
    - protocol: TCP
      port: 5432
  # Allow DNS
  - to:
    - namespaceSelector: {}
    ports:
    - protocol: UDP
      port: 53
```

### Example 3: Cross-Namespace Communication

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-cross-ns
  namespace: app-ns
spec:
  podSelector:
    matchLabels:
      app: service
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: client-ns
    ports:
    - protocol: TCP
      port: 8080
```

## Selectors

### Pod Selector

```yaml
# Select specific pod
podSelector:
  matchLabels:
    app: web

# Select all pods in namespace
podSelector: {}

# Select by multiple labels (AND logic)
podSelector:
  matchLabels:
    app: web
    version: v2
```

### Namespace Selector

```yaml
# Select specific namespace
namespaceSelector:
  matchLabels:
    name: production

# Select all namespaces
namespaceSelector: {}

# Select all namespaces except current
namespaceSelector:
  matchExpressions:
  - key: name
    operator: NotIn
    values:
    - default
```

## Testing Network Policies

### Test Pod-to-Pod Communication

```bash
# Deploy test pods
kubectl run test1 --image=busybox --restart=Never -- sleep 3600
kubectl run test2 --image=busybox --restart=Never -- sleep 3600

# Get pod IPs
kubectl get pods -o wide

# Test connectivity from test1 to test2
kubectl exec test1 -- wget -O- http://<test2-pod-ip>:80
```

### Verify Policies Are Applied

```bash
# List policies in namespace
kubectl get networkpolicies -n <namespace>

# View policy details
kubectl describe networkpolicy <policy-name> -n <namespace>

# View policy YAML
kubectl get networkpolicy <policy-name> -n <namespace> -o yaml
```

### Test with Debug Pod

```bash
# Create debug pod
kubectl run -it debug --image=nicolaka/netshoot --restart=Never -- /bin/bash

# Inside debug pod:
# Test DNS
nslookup <service-name>

# Test connectivity
curl http://<service-name>:<port>

# Test connectivity to specific pod
curl http://<pod-ip>:<port>
```

## Troubleshooting

### Issue: Pods Cannot Communicate

**Symptoms**: Connection timeout when pods try to reach each other

**Causes**:
1. Network policy blocking traffic
2. Incorrect labels in selectors
3. Network plugin not installed

**Solutions**:

```bash
# Check if CNI plugin installed
kubectl get nodes -o wide

# View all network policies
kubectl get networkpolicies -A

# Describe the problematic policy
kubectl describe networkpolicy <name> -n <namespace>

# Check pod labels
kubectl get pods --show-labels -n <namespace>

# Temporarily remove policy to test
kubectl delete networkpolicy <name> -n <namespace>
```

### Issue: Ingress Traffic Blocked

**Symptoms**: External traffic cannot reach pods

**Causes**:
1. Default deny ingress policy
2. Ingress controller not allowed
3. Incorrect port in policy

**Solutions**:

```bash
# Check policies
kubectl describe networkpolicy -n <namespace>

# Allow ingress controller namespace
# Add to policy:
from:
  - namespaceSelector:
      matchLabels:
        name: ingress-nginx
```

### Issue: DNS Not Working

**Symptoms**: Pods cannot resolve domain names

**Causes**:
1. DNS (UDP port 53) not allowed in egress policy
2. kube-dns pod unreachable

**Solutions**:

```yaml
# Add to network policy egress
- to:
  - namespaceSelector: {}
  ports:
  - protocol: UDP
    port: 53  # DNS
```

## Best Practices

### 1. Default Deny Approach

Start with deny all, then explicitly allow:

```yaml
# Deny all
podSelector: {}

# Then allow specific traffic
ingress:
  - from: [...]
```

### 2. Use Descriptive Names

```yaml
metadata:
  name: allow-frontend-to-backend
  namespace: production
```

### 3. Label Pods Consistently

```yaml
labels:
  app: myapp
  tier: web
  version: v1
```

### 4. Document Policies

```yaml
metadata:
  name: allow-web-to-api
  annotations:
    description: "Frontend web pods can access API pods"
    created-by: "devops@example.com"
    ticket: "SEC-123"
```

### 5. Test Before Applying

Use dry-run or test environments first

### 6. Monitor and Audit

```bash
# Regular policy reviews
kubectl get networkpolicies -A

# Check for unused policies
# Archive old policies
```

## Advanced Patterns

### Micro-segmentation

Create fine-grained policies for each service

```yaml
# api-service only talks to database and external APIs
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: api-service-egress
spec:
  podSelector:
    matchLabels:
      service: api
  egress:
  - to:
    - podSelector:
        matchLabels:
          service: database
    ports:
    - protocol: TCP
      port: 5432
  - to:
    - namespaceSelector: {}
    ports:
    - protocol: TCP
      port: 443  # HTTPS to external APIs
```

### Blue-Green Deployment

Use labels to control traffic between versions

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-to-blue-version
spec:
  podSelector:
    matchLabels:
      app: myapp
      version: blue
  ingress:
  - from:
    - podSelector:
        matchLabels:
          role: client
```

## Related Documentation

- [Kubernetes Integration](KUBERNETES.md)
- [RBAC Configuration](RBAC.md)
- [Resources Management](RESOURCES.md)
- [Troubleshooting](TROUBLESHOOTING.md)

---

For more information, see [Kubernetes Network Policies](https://kubernetes.io/docs/concepts/services-networking/network-policies/)
