# Global Configuration

Guide to configuring global settings in KubeChart.

## Overview

Global configuration allows you to set namespace-wide, domain, and resource settings for deployments.

## Configuration Form

The Global Configuration form appears when creating or editing a deployment.

### Fields

#### 1. Namespace

**Purpose**: Kubernetes namespace for deployment

```
Namespace: my-app-prod
```

**Rules**:

- Lowercase alphanumeric and hyphens
- Maximum 63 characters
- Cannot be changed after creation (immutable)

**Auto-Creation**: If namespace doesn't exist, KubeChart creates it automatically

#### 2. Domain

**Purpose**: Base domain for application ingress

```
Domain: example.com
```

**Usage**:

- Used for HTTPRoute creation
- Creates TLS certificates if cert-manager is configured
- Enables domain-based routing

**Examples**:

- `example.com`
- `app.example.com`
- `staging.example.com`

#### 3. Requests Per Second (Rate Limiting)

**Purpose**: Rate limit for incoming requests

```
Requests Per Second: 1000
```

**What it does**:

- Creates BackendTrafficPolicy resource
- Limits traffic to specified requests per second
- Applies to entire namespace
- Uses Envoy Gateway rate limiting

**When to use**:

- Protect against DDoS
- Manage API quotas
- Control resource usage

**Example values**:

- `100` - Low traffic applications
- `1000` - Medium traffic
- `10000` - High traffic

#### 4. Resource Quota

**Purpose**: Set resource limits for entire namespace

```
CPU Request: 100m
Memory Request: 128Mi
CPU Limit: 2000m
Memory Limit: 2Gi
```

**What it does**:

- Creates ResourceQuota resource
- Limits total CPU/memory for all pods
- Prevents resource exhaustion
- Enforces hard limits

**Request vs Limit**:

- **Request**: Minimum guaranteed resources
- **Limit**: Maximum allowed resources

**Resource Units**:

- CPU: `m` (millicores), e.g., `100m` = 0.1 CPU
- Memory: `Mi` (mebibytes), `Gi` (gibibytes)

**Example configurations**:

_Small namespace_:

```
CPU Request: 500m (0.5 CPU)
Memory Request: 512Mi
CPU Limit: 2000m (2 CPUs)
Memory Limit: 4Gi
```

_Medium namespace_:

```
CPU Request: 2000m (2 CPUs)
Memory Request: 2Gi
CPU Limit: 8000m (8 CPUs)
Memory Limit: 16Gi
```

_Large namespace_:

```
CPU Request: 4000m (4 CPUs)
Memory Request: 4Gi
CPU Limit: 16000m (16 CPUs)
Memory Limit: 32Gi
```

## Kubernetes Resources Created

### Namespace

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: my-namespace
```

### ResourceQuota (if configured)

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: quota
  namespace: my-namespace
spec:
  hard:
    requests.cpu: "2"
    requests.memory: "2Gi"
    limits.cpu: "8"
    limits.memory: "16Gi"
```

### BackendTrafficPolicy (if rate limit configured)

```yaml
apiVersion: gateway.envoyproxy.io/v1alpha1
kind: BackendTrafficPolicy
metadata:
  name: rate-limit
  namespace: my-namespace
spec:
  rateLimit:
    local:
      rules:
        - limit:
            requests: 1000
            unit: Second
```

## Configuration Examples

### Example 1: Small Development Namespace

```
Namespace: app-dev
Domain: dev.example.com
Requests Per Second: 100
Resource Quota:
  CPU Request: 100m
  Memory Request: 128Mi
  CPU Limit: 500m
  Memory Limit: 512Mi
```

**Use case**: Development environment, testing, low traffic

### Example 2: Production Namespace

```
Namespace: app-prod
Domain: app.example.com
Requests Per Second: 10000
Resource Quota:
  CPU Request: 4000m
  Memory Request: 4Gi
  CPU Limit: 16000m
  Memory Limit: 32Gi
```

**Use case**: Production environment, high traffic, guaranteed resources

### Example 3: Staging Namespace

```
Namespace: app-staging
Domain: staging.example.com
Requests Per Second: 1000
Resource Quota:
  CPU Request: 1000m
  Memory Request: 1Gi
  CPU Limit: 4000m
  Memory Limit: 8Gi
```

**Use case**: Staging environment, pre-production testing

## Modifying Global Configuration

### Change via UI

1. **Navigate to Deployments page**
2. **Click "Edit" on deployment**
3. **Scroll to Global Configuration section**
4. **Modify values**
5. **Save changes**

**Note**: Namespace cannot be changed (immutable)

### Verify Configuration

```bash
# Check namespace
kubectl get namespace <namespace-name>
kubectl describe namespace <namespace-name>

# Check ResourceQuota
kubectl get resourcequota -n <namespace-name>
kubectl describe resourcequota quota -n <namespace-name>

# Check BackendTrafficPolicy
kubectl get backendtrafficpolicies -n <namespace-name>
kubectl describe backendtrafficpolicy rate-limit -n <namespace-name>
```

## Best Practices

### 1. Right-size Resource Quotas

```bash
# Analyze current usage
kubectl top pods -n <namespace-name>

# Set limits 20-30% higher than usage
# For example, if using 1.5 CPUs, set limit to 2 CPUs
```

### 2. Set Request Limits

```yaml
# Always set BOTH request and limit
# Request: guaranteed minimum
# Limit: maximum allowed
requests:
  cpu: 100m
  memory: 128Mi
limits:
  cpu: 500m
  memory: 512Mi
```

### 3. Progressive Rate Limiting

```
Start with high limit: 10000 req/s
Monitor actual traffic: 4000 req/s
Set limit to 5000 req/s (25% buffer)
```

### 4. Separate Environments

```
dev-namespace:
  - Lower resource quotas
  - Higher rate limits (for testing)

staging-namespace:
  - Medium resource quotas
  - Production-like limits

prod-namespace:
  - High resource quotas
  - Strict rate limits
```

## Troubleshooting

### Issue: Resource Quota Exceeded

**Symptom**: Pods failing to start with quota exceeded error

**Solution**:

```bash
# Check quota usage
kubectl describe resourcequota -n <namespace>

# Increase quota
kubectl patch resourcequota quota -n <namespace> \
  -p '{"spec":{"hard":{"requests.cpu":"4"}}}'
```

### Issue: Rate Limiting Too Strict

**Symptom**: Valid requests being rejected with 429 Too Many Requests

**Solution**:

1. Check current traffic: `kubectl logs deployment -n <namespace>`
2. Increase rate limit via UI or kubectl
3. Monitor and adjust

### Issue: Namespace Already Exists

**Symptom**: Error when creating deployment in existing namespace

**Solution**:

```bash
# List existing namespaces
kubectl get namespaces

# Use different namespace name
# Or modify existing namespace resources manually
```

## Resource Quotas and Limits

### Default Limits (if not specified)

```
CPU Request: 100m
Memory Request: 128Mi
CPU Limit: 500m
Memory Limit: 512Mi
```

### Recommended Values by Workload Type

**Deployment (stateless web app)**:

```
CPU Request: 100m - 500m
Memory Request: 128Mi - 512Mi
CPU Limit: 500m - 1000m
Memory Limit: 512Mi - 1Gi
```

**StatefulSet (database)**:

```
CPU Request: 500m - 2000m
Memory Request: 512Mi - 2Gi
CPU Limit: 2000m - 4000m
Memory Limit: 2Gi - 8Gi
```

**Job (batch processing)**:

```
CPU Request: 500m - 2000m
Memory Request: 256Mi - 1Gi
CPU Limit: 2000m - 4000m
Memory Limit: 1Gi - 4Gi
```

## Environment Variables

Global configuration affects environment:

```bash
# Check applied configuration
kubectl env deployment/<name> -n <namespace>

# Environment variables set by KubeChart
APP_NAMESPACE=my-namespace
APP_DOMAIN=example.com
```

## Editing Configuration Files

### Direct YAML Edit

```bash
# Edit ResourceQuota directly
kubectl edit resourcequota quota -n <namespace>

# Edit BackendTrafficPolicy
kubectl edit backendtrafficpolicy rate-limit -n <namespace>
```

### Replace Configuration

```bash
# Apply new YAML
kubectl apply -f new-config.yaml -n <namespace>

# Verify changes
kubectl describe resourcequota quota -n <namespace>
```

## Related Documentation

- [Deployment Guide](DEPLOYMENT.md)
- [Resources Management](RESOURCES.md)
- [Rate Limiting](RATE_LIMITING.md)
- [Kubernetes Integration](KUBERNETES.md)

---

For more information, see [Kubernetes Quotas](https://kubernetes.io/docs/concepts/policy/resource-quotas/)
