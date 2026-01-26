# Resource Management

Complete guide to managing Kubernetes resources in KubeChart.

## Overview

KubeChart manages various Kubernetes resource types. This guide covers resource lifecycle, management, and best practices.

## Supported Resource Types

### Workloads

| Type            | Purpose                            | Persistence |
| --------------- | ---------------------------------- | ----------- |
| **Pod**         | Single container instance          | No          |
| **Deployment**  | Stateless application scaling      | No          |
| **StatefulSet** | Stateful application with identity | Yes         |
| **ReplicaSet**  | Pod replication                    | No          |
| **Job**         | One-time batch job                 | No          |
| **CronJob**     | Scheduled recurring job            | No          |
| **DaemonSet**   | Run on every node                  | No          |

### Services & Networking

| Type                    | Purpose                    |
| ----------------------- | -------------------------- |
| **Service (ClusterIP)** | Internal service discovery |
| **HTTPRoute**           | Envoy Gateway routing      |
| **NetworkPolicy**       | Pod communication control  |

### Configuration & Storage

| Type                      | Purpose                     |
| ------------------------- | --------------------------- |
| **ConfigMap**             | Non-sensitive configuration |
| **Secret**                | Sensitive data storage      |
| **PersistentVolume**      | Cluster storage             |
| **PersistentVolumeClaim** | Storage request             |

### Policy & Control

| Type                     | Purpose                       |
| ------------------------ | ----------------------------- |
| **Role**                 | Namespace-scoped permissions  |
| **RoleBinding**          | Bind role to user/SA          |
| **ResourceQuota**        | Limit namespace resources     |
| **LimitRange**           | Limit pod/container resources |
| **BackendTrafficPolicy** | Rate limiting & policies      |

## Resource Lifecycle

### Creation

```
User Form Input
    ↓
Validation
    ↓
YAML Generation
    ↓
Kubernetes API Submission
    ↓
Resource Creation
    ↓
Database Storage
```

### Management

```
View Resource
    ↓
Edit Properties (if supported)
    ↓
Apply Changes to Cluster
    ↓
Update Database
    ↓
Confirm Success
```

### Deletion

```
User Selects Delete
    ↓
Confirmation Dialog
    ↓
API Call to Kubernetes
    ↓
Resource Removed from Cluster
    ↓
Database Record Updated
```

## Viewing Resources

### Via KubeChart UI

1. **Navigate to Deployments**

   ```
   Click "Deployments" in sidebar
   ```

2. **Select Deployment**

   ```
   Click on deployment card
   ```

3. **Click "Resources" Button**

   ```
   Shows modal with all resources
   ```

4. **View Resource Details**
   ```
   Displays:
   - Resource kind (Deployment, Service, etc.)
   - Resource name
   - Namespace
   - API version
   - Delete status
   ```

### Via kubectl

```bash
# List all resources in namespace
kubectl get all -n <namespace>

# List specific resource type
kubectl get deployments -n <namespace>
kubectl get services -n <namespace>
kubectl get pods -n <namespace>

# View resource details
kubectl describe pod <name> -n <namespace>
kubectl describe svc <name> -n <namespace>

# Get YAML
kubectl get pod <name> -n <namespace> -o yaml
```

## Managing Resources

### Deletable Resources

The following resources can be deleted through KubeChart UI:

✅ **User Workloads**

- Pod
- Deployment
- StatefulSet
- ReplicaSet
- Job
- CronJob

✅ **User-Exposed Services**

- Service (ClusterIP)
- HTTPRoute

### Protected Resources (Read-Only)

The following resources are auto-generated and marked as read-only:

❌ **RBAC**

- Role
- RoleBinding
- ClusterRole
- ClusterRoleBinding

❌ **Network Policies**

- NetworkPolicy

❌ **Quotas & Limits**

- ResourceQuota
- LimitRange

❌ **Advanced**

- BackendTrafficPolicy (rate limiting)
- Certificate (TLS)

**Reason**: These are auto-generated for configuration. Manage them through the respective configuration forms.

## Resource Deletion

### Delete via KubeChart UI

1. **Open Resources Modal**

   ```
   Deployment Card → Resources Button
   ```

2. **Find Resource**

   ```
   Locate in resource list
   ```

3. **Click Delete**

   ```
   Only shows for deletable resources
   ```

4. **Confirm Deletion**
   ```
   Click "Yes" in confirmation dialog
   ```

### Delete via kubectl

```bash
# Delete specific resource
kubectl delete pod <name> -n <namespace>
kubectl delete deployment <name> -n <namespace>

# Delete by type
kubectl delete pods --all -n <namespace>

# Delete using YAML file
kubectl delete -f resource.yaml

# Force delete (immediate)
kubectl delete pod <name> -n <namespace> --grace-period=0 --force

# Delete entire namespace (all resources)
kubectl delete namespace <namespace>
```

## Resource Limits & Quotas

### CPU & Memory Limits

Set per container:

```yaml
resources:
  requests:
    cpu: 100m # Minimum CPU
    memory: 128Mi # Minimum memory
  limits:
    cpu: 500m # Maximum CPU
    memory: 512Mi # Maximum memory
```

### Namespace ResourceQuota

Limit total resources per namespace:

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: quota
  namespace: user-namespace
spec:
  hard:
    requests.cpu: "10"
    requests.memory: "20Gi"
    limits.cpu: "20"
    limits.memory: "40Gi"
    pods: "100"
```

### LimitRange

Set default limits for resources:

```yaml
apiVersion: v1
kind: LimitRange
metadata:
  name: limits
  namespace: user-namespace
spec:
  limits:
    - max:
        cpu: "2"
        memory: "2Gi"
      min:
        cpu: "100m"
        memory: "128Mi"
      type: Container
```

## Storage Management

### PersistentVolumes

```bash
# List PVs
kubectl get pv

# View PV details
kubectl describe pv <name>

# Create PV
kubectl apply -f pv.yaml

# Delete PV
kubectl delete pv <name>
```

### PersistentVolumeClaims

```bash
# List PVCs
kubectl get pvc -A

# View PVC details
kubectl describe pvc <name> -n <namespace>

# Create PVC
kubectl apply -f pvc.yaml

# Delete PVC
kubectl delete pvc <name> -n <namespace>
```

### Storage Example

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: app-storage
  namespace: user-namespace
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
```

## Configuration Management

### ConfigMap Usage

Store non-sensitive configuration:

```bash
# Create ConfigMap from literal
kubectl create configmap app-config \
  --from-literal=LOG_LEVEL=debug \
  -n <namespace>

# Create from file
kubectl create configmap app-config \
  --from-file=config.yml \
  -n <namespace>

# View ConfigMap
kubectl get configmap -n <namespace>
kubectl describe configmap app-config -n <namespace>
```

### Secret Usage

Store sensitive data:

```bash
# Create Secret from literal
kubectl create secret generic db-creds \
  --from-literal=username=admin \
  --from-literal=password=secret \
  -n <namespace>

# Create from file
kubectl create secret generic tls-cert \
  --from-file=cert.crt \
  --from-file=cert.key \
  -n <namespace>

# View Secret (base64 encoded)
kubectl get secret -n <namespace>
kubectl describe secret app-secret -n <namespace>
```

## Monitoring Resource Status

### Pod Status

```bash
# View pod status
kubectl get pods -n <namespace>

# Watch pod creation
kubectl get pods -n <namespace> --watch

# Get pod details
kubectl describe pod <name> -n <namespace>

# View pod events
kubectl get events -n <namespace>
```

### Deployment Status

```bash
# View deployment status
kubectl get deployment -n <namespace>

# Watch deployment rollout
kubectl rollout status deployment/<name> -n <namespace>

# View rollout history
kubectl rollout history deployment/<name> -n <namespace>

# View replica set status
kubectl get rs -n <namespace>
```

### Service Status

```bash
# View services
kubectl get svc -n <namespace>

# View service details
kubectl describe svc <name> -n <namespace>

# Check endpoints
kubectl get endpoints -n <namespace>
```

## Resource Cleanup

### Delete Unused Resources

```bash
# Delete pods in Failed state
kubectl delete pods --field-selector=status.phase=Failed \
  -n <namespace>

# Delete completed jobs
kubectl delete job <name> \
  --cascade=background \
  -n <namespace>

# Delete old replicaSets
kubectl delete rs <name> -n <namespace>
```

### Namespace Cleanup

```bash
# Delete entire namespace (all resources deleted)
kubectl delete namespace <namespace>

# Verify deletion
kubectl get ns
```

## Best Practices

### Resource Naming

- Use lowercase alphanumeric and hyphens
- Start with letter
- Max 63 characters
- Be descriptive

```
Good:  app-frontend-prod
Bad:   App_Frontend_PROD
```

### Resource Organization

```
Namespace per application/environment
├── namespace-prod
│   ├── Deployment: app-api
│   ├── Deployment: app-web
│   ├── Service: app-api
│   └── Service: app-web
└── namespace-staging
    ├── Deployment: app-api
    └── Service: app-api
```

### Resource Limits

**Always set limits:**

```yaml
resources:
  requests:
    cpu: 100m
    memory: 128Mi
  limits:
    cpu: 500m
    memory: 512Mi
```

### Health Checks

**Implement probes:**

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8080
readinessProbe:
  httpGet:
    path: /ready
    port: 8080
```

## Troubleshooting

### Issue: Cannot Delete Resource

**Check permissions**:

```bash
kubectl auth can-i delete pods
kubectl auth can-i delete deployments
```

**Check resource locks**:

```bash
kubectl describe pod <name> -n <namespace>
# Look for finalizers or owner references
```

### Issue: Resource in Terminating State

```bash
# Force delete
kubectl delete pod <name> --grace-period=0 --force -n <namespace>

# Remove finalizers (advanced)
kubectl patch pod <name> -p '{"metadata":{"finalizers":[]}}' -n <namespace>
```

### Issue: Pod not starting

```bash
# Check pod status
kubectl describe pod <name> -n <namespace>

# Check logs
kubectl logs <name> -n <namespace>

# Check resource quota
kubectl describe resourcequota -n <namespace>
```

## Related Documentation

- [RBAC Configuration](RBAC.md)
- [Kubernetes Integration](KUBERNETES.md)
- [Resource Limits](RESOURCES.md#resource-limits--quotas)
- [Troubleshooting](TROUBLESHOOTING.md)

---

See [Kubernetes Resource Docs](https://kubernetes.io/docs/concepts/workloads/) for more information.
