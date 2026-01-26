# RBAC Configuration

Complete guide to Role-Based Access Control in KubeChart.

## Overview

RBAC (Role-Based Access Control) is Kubernetes' native access control mechanism. KubeChart uses RBAC to:

- Authenticate users with JWT tokens
- Authorize API requests
- Control Kubernetes resource creation permissions
- Limit service account capabilities

## Architecture

### User Authentication Flow

```
User (UI)
    ↓
Login Request (username/password)
    ↓
Server Verification
    ↓
JWT Token Generation
    ↓
Token Storage (localStorage)
    ↓
Authenticated Requests (Authorization: Bearer <token>)
    ↓
Token Verification Middleware
    ↓
Allow/Deny Request
```

### Kubernetes Service Account

KubeChart runs as a service account with specific permissions:

```
KubeChart Pod (kubechart namespace)
    ↓
Service Account: kubechart
    ↓
ClusterRole: kubechart
    ↓
Specific Permissions (create, update, delete resources)
```

## KubeChart RBAC Configuration

### Service Account

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: kubechart
  namespace: kubechart
```

### ClusterRole

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: kubechart
rules:
  # Core API group
  - apiGroups: [""]
    resources: 
      - pods
      - services
      - configmaps
      - secrets
      - serviceaccounts
    verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]

  # Apps API group
  - apiGroups: ["apps"]
    resources:
      - deployments
      - statefulsets
      - replicasets
      - daemonsets
    verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]

  # Batch API group
  - apiGroups: ["batch"]
    resources:
      - jobs
      - cronjobs
    verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]

  # Networking API group
  - apiGroups: ["networking.k8s.io"]
    resources:
      - networkpolicies
      - ingresses
    verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]

  # RBAC API group
  - apiGroups: ["rbac.authorization.k8s.io"]
    resources:
      - roles
      - rolebindings
    verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]

  # Gateway API group
  - apiGroups: ["gateway.networking.k8s.io"]
    resources:
      - httproutes
      - grpcroutes
      - backendtrafficpolicies
    verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]

  # Cert-manager API group
  - apiGroups: ["cert-manager.io"]
    resources:
      - certificates
      - issuers
    verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]

  # Core API - Namespace operations
  - apiGroups: [""]
    resources:
      - namespaces
    verbs: ["get", "list", "watch", "create"]

  # Core API - ResourceQuota
  - apiGroups: [""]
    resources:
      - resourcequotas
    verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
```

### ClusterRoleBinding

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: kubechart
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: kubechart
subjects:
  - kind: ServiceAccount
    name: kubechart
    namespace: kubechart
```

## Application-Level RBAC

### User Authentication

Users authenticate with username and password. The system:

1. **Registration**: Creates new user account
2. **Login**: Verifies credentials and generates JWT token
3. **API Access**: Validates JWT for each request

### User Isolation

Each user can only access their own deployments:

```typescript
// Backend verification
if (deployment.user_id !== authenticatedUser.userId) {
  return res.status(403).json({ error: "Unauthorized" });
}
```

### JWT Token Flow

```
Login Request
    ↓
Password Verification
    ↓
JWT Generation
    ↓
Token Returned to Client
    ↓
Stored in localStorage
    ↓
Sent in Authorization header
    ↓
Verified on each request
```

## Kubernetes RBAC for User Deployments

### Auto-Generated RBAC Resources

When users create deployments, KubeChart can auto-generate basic RBAC resources:

```yaml
# Generated Service Account
apiVersion: v1
kind: ServiceAccount
metadata:
  name: user-deployment
  namespace: user-namespace

---
# Generated Role (minimal permissions)
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: user-deployment
  namespace: user-namespace
rules:
  - apiGroups: [""]
    resources: ["pods"]
    verbs: ["get", "list", "watch"]

---
# Generated RoleBinding
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: user-deployment
  namespace: user-namespace
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: user-deployment
subjects:
  - kind: ServiceAccount
    name: user-deployment
    namespace: user-namespace
```

## Permission Levels

### KubeChart Service Account Permissions

**Unrestricted Access**:
- ✅ View all resource types
- ✅ Create/update/delete in any namespace
- ✅ Manage RBAC resources
- ✅ Manage network policies
- ✅ Manage storage resources

**Why**:
- Needs to deploy user workloads
- Needs to manage user namespaces
- Needs to create/update/delete user resources

### User Application Permissions (If Generated)

**Limited Access**:
- ✅ View pods in own namespace
- ❌ Cannot create resources
- ❌ Cannot access other namespaces
- ❌ Cannot manage RBAC

**Why**:
- Least privilege principle
- Security isolation
- Prevent privilege escalation

## Verifying RBAC Setup

### Check Service Account

```bash
# List service accounts
kubectl get sa -n kubechart

# View service account details
kubectl describe sa kubechart -n kubechart

# List service account tokens
kubectl get secrets -n kubechart | grep kubechart-token
```

### Check ClusterRole

```bash
# List ClusterRoles
kubectl get clusterrole | grep kubechart

# View ClusterRole rules
kubectl describe clusterrole kubechart

# View rules in JSON
kubectl get clusterrole kubechart -o json | jq '.rules'
```

### Check ClusterRoleBinding

```bash
# List ClusterRoleBindings
kubectl get clusterrolebinding | grep kubechart

# View binding details
kubectl describe clusterrolebinding kubechart

# Check which service accounts are bound
kubectl get clusterrolebinding kubechart -o json | jq '.subjects'
```

### Test Permissions

```bash
# Test if kubechart SA can create deployments
kubectl auth can-i create deployments \
  --as=system:serviceaccount:kubechart:kubechart

# Test specific action
kubectl auth can-i create httproutes \
  --as=system:serviceaccount:kubechart:kubechart \
  --namespace=user-namespace

# List all permissions
kubectl describe clusterrole kubechart
```

## RBAC Troubleshooting

### Issue: Permission Denied When Creating Resources

**Error**: `403 Forbidden - User cannot create resources`

**Cause**: Service account lacks required permissions

**Solution**:
```bash
# Check permissions
kubectl auth can-i create deployments \
  --as=system:serviceaccount:kubechart:kubechart

# Update ClusterRole
kubectl edit clusterrole kubechart
# Add missing resource to rules

# Or reapply with updated script
./k8s-deploy2.sh
```

### Issue: Cannot Manage HTTPRoutes/BackendTrafficPolicy

**Error**: `403 Forbidden - HTTPRoute not allowed`

**Cause**: Missing gateway.networking.k8s.io rules

**Solution**:
```bash
# Verify rule exists
kubectl describe clusterrole kubechart | grep -A5 "gateway.networking"

# If missing, update script
# Edit k8s-deploy2.sh and ensure these rules are included:
# - apiGroups: ["gateway.networking.k8s.io"]
#   resources: ["httproutes", "backendtrafficpolicies"]
#   verbs: ["create", "get", "list", "delete", "update", "patch"]
```

### Issue: Cannot Create ResourceQuota/NetworkPolicy

**Error**: `403 Forbidden - ResourceQuota not allowed`

**Cause**: Missing rules in ClusterRole

**Solution**:
```bash
# Verify rules
kubectl describe clusterrole kubechart | grep -E "resourcequotas|networkpolicies"

# Update ClusterRole
kubectl patch clusterrole kubechart \
  -p '{"rules":[{"apiGroups":[""],"resources":["resourcequotas"],"verbs":["*"]}]}'
```

## Security Best Practices

### 1. Least Privilege

- Grant only necessary permissions
- Use namespace-scoped Roles when possible
- Avoid wildcard (*) permissions

### 2. Service Account Isolation

- Use separate service accounts for different components
- Don't share service accounts
- Rotate tokens regularly

### 3. User Authentication

- Enforce strong passwords
- Use HTTPS for API communication
- Implement token expiration
- Securely store credentials

### 4. Audit Logging

```bash
# Enable audit logging in Kubernetes
# Check audit logs for permission denials
kubectl logs -n kube-system -l component=kube-apiserver | grep "Forbidden"
```

### 5. Regular Reviews

```bash
# Review all ClusterRoleBindings
kubectl get clusterrolebinding

# Review RoleBindings in namespaces
kubectl get rolebinding -A

# Audit service accounts
kubectl get sa -A
```

## Advanced RBAC Patterns

### Namespace Admin Role

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: namespace-admin
  namespace: user-namespace
rules:
  - apiGroups: ["*"]
    resources: ["*"]
    verbs: ["*"]
```

### Read-Only Role

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: reader
  namespace: user-namespace
rules:
  - apiGroups: [""]
    resources: ["pods", "services", "configmaps"]
    verbs: ["get", "list", "watch"]
```

### Custom Role

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: deployer
  namespace: user-namespace
rules:
  - apiGroups: ["apps"]
    resources: ["deployments"]
    verbs: ["get", "list", "watch", "create", "update", "patch"]
  - apiGroups: [""]
    resources: ["services", "configmaps"]
    verbs: ["get", "list"]
```

## Related Documentation

- [Kubernetes Integration](KUBERNETES.md)
- [Resource Management](RESOURCES.md)
- [Troubleshooting](TROUBLESHOOTING.md)

---

For more information, see [Kubernetes RBAC Documentation](https://kubernetes.io/docs/reference/access-authn-authz/rbac/)
