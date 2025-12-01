# Kubernetes Deployment Architecture

## Overview

The KubeChart application now supports advanced multi-tenant Kubernetes deployments. This document outlines the complete architecture and implementation guide for deploying client applications to a Kubernetes cluster.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    KubeChart Web UI                          │
│  (Create Chart → Review → Deploy Confirmation → Deployments) │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│                    Server API Layer                          │
│  ✓ /api/deploy-advanced (create deployment)                │
│  ✓ /api/deployments (list deployments)                      │
│  ✓ /api/deployments/:id/yaml (view YAML)                    │
│  ✓ /api/deployments/:id (delete deployment)                 │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌──────────────────────────────��──────────────────────────────┐
│                  Kubernetes Integration                      │
│  - Kubeconfig (server-side only)                            │
│  - User namespace creation                                  │
│  - System files deployment                                  │
│  - Client workloads deployment                              │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│          Kubernetes Cluster (RKE2/EKS/AKS/GKE)              │
│  - User namespaces (user-0, user-1, etc.)                  │
│  - System resources (RBAC, NetworkPolicy, etc.)             │
│  - Client applications and services                         │
└─────────────────────────────────────────────────────────────┘
```

## Deployment Flow

### 1. User Creates Chart (Advanced Mode)

```
User inputs:
├── Global Configuration
│   ├── Namespace (auto-generated or custom)
│   ├── Rate Limiting (requests per second)
│   └── Resource Quota
│       ├── CPU (requests/limits)
│       ├── Memory (requests/limits)
│       └── Storage quota
├── Workloads
│   ├── Deployments
│   ├── StatefulSets
│   ├── Jobs
│   └── Services
└── Resources
    ├── ConfigMaps
    ├── Secrets
    ├── PersistentVolumeClaims
    └── Other K8s resources
```

### 2. User Reviews & Confirms Deployment

Modal prompts:

- **Environment**: Staging or Production (determines certificate)
- **Networking**:
  - Create HTTPRoute? (expose via ingress)
  - Create ClusterIP Service? (internal service)
- Certificate is always created automatically

### 3. System Generates Deployment Package

```
/user-namespace/
├── 00-rbac.yaml                    # RBAC roles, bindings
├── 01-networkpolicy.yaml           # Network segmentation
├── 02-limits-quota.yaml            # ResourceQuota, LimitRange
├── 03-ratelimit.yaml               # Rate limiting rules
├── 04-certificate-{env}.yaml       # TLS certificate
├── 05-httproute.yaml               # (optional) HTTP ingress
├── 06-service-clusterip.yaml       # (optional) ClusterIP service
├── 07-backup-schedule.yaml         # Backup configuration
└── 08-user-workloads.yaml          # Client's workloads + resources
```

### 4. System Deploys to Kubernetes

```
kubectl apply -f /user-namespace/*.yaml --kubeconfig=$KUBECONFIG
```

### 5. Deployment Recorded in Database

```sql
INSERT INTO deployments (
  user_id, name, namespace, yaml_config,
  status, environment, workloads_count, resources_count, created_at
)
VALUES (...)
```

## Client-Side Components

### ✅ Implemented

1. **Deployments Page** (`client/pages/Deployments.tsx`)
   - List all deployments
   - View deployment YAML
   - Delete deployments
   - Status indicators

2. **DeploymentConfirmModal** (`client/components/DeploymentConfirmModal.tsx`)
   - Environment selection (staging/production)
   - Networking options
   - Deployment summary

3. **Layout Navigation** (`client/components/Layout.tsx`)
   - Links to Create Chart and Deployments
   - Navigation for authenticated users

4. **Routes** (`client/App.tsx`)
   - `/deployments` - Deployments management page

## Server-Side Components

### ✅ Implemented

1. **Deployments API** (`server/routes/deployments.ts`)
   - `GET /api/deployments` - List user's deployments
   - `GET /api/deployments/:id/yaml` - Get deployment YAML
   - `DELETE /api/deployments/:id` - Delete deployment

2. **Database Schema** (`server/db.ts`)
   ```sql
   CREATE TABLE deployments (
     id SERIAL PRIMARY KEY,
     user_id INT NOT NULL,
     name VARCHAR(255),
     type VARCHAR(50),
     namespace VARCHAR(255),
     yaml_config TEXT,
     status VARCHAR(50),
     environment VARCHAR(50),
     workloads_count INT,
     resources_count INT,
     created_at TIMESTAMP,
     updated_at TIMESTAMP
   );
   ```

### ⏳ TODO: Kubernetes Integration

The following needs to be implemented in `server/routes/advanced-deploy.ts`:

#### 1. System Templates Generation

```typescript
// Generate system configuration files
-generateRBACYaml(namespace, userId) - // RBAC roles
  generateNetworkPolicyYaml(namespace) - // Network isolation
  generateLimitsQuotaYaml(namespace, quota) - // Resource limits
  generateRateLimitYaml(namespace, rps) - // Rate limiting
  generateCertificateYaml(namespace, env) - // TLS certificate
  generateHTTPRouteYaml(namespace) - // (conditional) Ingress
  generateClusterIPServiceYaml(namespace) - // (conditional) Service
  generateBackupScheduleYaml(namespace); // Backup policy
```

#### 2. Kubernetes Client Integration

```typescript
// Dependencies to add
import {
  KubeConfig,
  CoreV1Api,
  AppsV1Api,
  CustomObjectsApi,
} from "@kubernetes/client-node";

// Initialize Kubernetes client
const kubeconfig = new KubeConfig();
kubeconfig.loadFromDefault(); // or loadFromFile(path)

const k8sApi = kubeconfig.makeApiClient(CoreV1Api);
const appsApi = kubeconfig.makeApiClient(AppsV1Api);
```

#### 3. Deployment Steps

```typescript
async function deployToKubernetes(namespace, yamls, deploymentOptions) {
  // Step 1: Create namespace
  await k8sApi.createNamespace(...);

  // Step 2: Apply system files (RBAC, NetworkPolicy, etc.)
  await applyYaml(yamls.rbac);
  await applyYaml(yamls.networkPolicy);
  await applyYaml(yamls.quota);
  await applyYaml(yamls.rateLimit);
  await applyYaml(yamls.certificate);

  // Step 3: Conditionally apply networking
  if (deploymentOptions.createHTTPRoute) {
    await applyYaml(yamls.httpRoute);
  }
  if (deploymentOptions.createClusterIPService) {
    await applyYaml(yamls.clusterIPService);
  }

  // Step 4: Apply backup schedule
  await applyYaml(yamls.backupSchedule);

  // Step 5: Apply user's workloads
  await applyYaml(yamls.userWorkloads);
}
```

## System Template Files (Provided by User)

The user has provided 9 system template files. These need to be:

1. **Stored** in `server/templates/` directory or database
2. **Templated** with placeholders for:
   - `${NAMESPACE}` - User's namespace
   - `${USER_ID}` - User ID (for RBAC)
   - `${RATE_LIMIT}` - From global config
   - `${CPU_LIMIT}` - From resource quota
   - `${MEMORY_LIMIT}` - From resource quota
   - `${STORAGE_LIMIT}` - From resource quota
   - `${ENVIRONMENT}` - staging or production
   - `${PVC_LIMIT}` - Persistent volume claims limit

3. **Rendered** with actual values during deployment

### Required Template Files

```
server/templates/
├── rbac.yaml
├── networkpolicy.yaml
├── limits-quota.yaml
├── ratelimit.yaml
├── certificate-staging.yaml
├── certificate-prod.yaml
├── httproute.yaml
├── service-clusterip.yaml
└── backup-schedule.yaml
```

## Environment Variables

```bash
# Kubernetes Configuration
KUBECONFIG=/path/to/kubeconfig.yaml  # or ~/.kube/config
KUBERNETES_NAMESPACE_PREFIX=user      # e.g., user-0, user-1

# Kubernetes API (optional, if not using kubeconfig)
KUBERNETES_API_URL=https://api.example.com:6443
KUBERNETES_API_TOKEN=<token>
```

## Database Updates

The deployments table has been enhanced with:

- `environment VARCHAR(50)` - staging or production
- `workloads_count INT` - number of workloads
- `resources_count INT` - number of resources

You may need to run:

```sql
ALTER TABLE deployments ADD COLUMN environment VARCHAR(50) DEFAULT 'production';
ALTER TABLE deployments ADD COLUMN workloads_count INT DEFAULT 0;
ALTER TABLE deployments ADD COLUMN resources_count INT DEFAULT 0;
```

## Implementation Checklist

### Phase 1: Core Kubernetes Integration (PRIORITY)

- [ ] Install kubernetes client-node package
- [ ] Create system template files (use provided YAML as base)
- [ ] Implement template rendering engine
- [ ] Implement kubectl/API client integration
- [ ] Update `/api/deploy-advanced` to deploy to K8s
- [ ] Test with a development cluster

### Phase 2: Production Readiness

- [ ] Implement certificate management
- [ ] Implement namespace isolation
- [ ] Implement RBAC enforcement
- [ ] Add deployment status monitoring
- [ ] Add rollback capability
- [ ] Implement audit logging

### Phase 3: Advanced Features

- [ ] GitOps integration (ArgoCD)
- [ ] Multi-cluster support
- [ ] Helm chart templating
- [ ] Auto-scaling based on resource usage
- [ ] Cost estimation
- [ ] Performance monitoring

## Security Considerations

### Current Security Measures

✅ Command injection prevention (input validation)
✅ HTTPS enforcement
✅ Bearer token authentication
✅ User namespace isolation

### Additional Security (TODO)

- [ ] RBAC role separation (admin, developer, viewer)
- [ ] Network policies enforcing segmentation
- [ ] Secret encryption in database
- [ ] Audit logging of all deployments
- [ ] Rate limiting on API endpoints
- [ ] Pod security policies
- [ ] Container image scanning

## Troubleshooting

### Common Issues

1. **Kubeconfig not found**

   ```
   Error: KUBECONFIG not set
   Solution: Set KUBECONFIG env var or ensure ~/.kube/config exists
   ```

2. **Permission denied**

   ```
   Error: namespaces is forbidden
   Solution: Ensure service account has appropriate RBAC permissions
   ```

3. **Insufficient resources**
   ```
   Error: exceeded memory limit
   Solution: Check cluster resource availability and adjust quotas
   ```

## Testing

### Unit Tests

```typescript
describe("Kubernetes Deployment", () => {
  it("should generate valid RBAC YAML", () => {});
  it("should create namespace with correct labels", () => {});
  it("should apply resource quotas", () => {});
});
```

### Integration Tests

- Deploy to minikube/kind cluster
- Verify namespace creation
- Verify workload deployment
- Verify service creation
- Verify network policies applied

### E2E Tests

- Complete user flow from chart creation to deployment
- Verify deployed app is accessible
- Test scaling and updates
- Test deletion and cleanup

## References

- [Kubernetes Client Node Documentation](https://github.com/kubernetes-client/javascript)
- [KubeConfig Format](https://kubernetes.io/docs/concepts/configuration/organize-cluster-access-kubeconfig/)
- [Kubernetes API Conventions](https://kubernetes.io/docs/reference/using-api/api-concepts/)
- [Namespace Best Practices](https://kubernetes.io/docs/concepts/overview/working-with-objects/namespaces/)

---

**Status**: Architecture complete, awaiting implementation
**Priority**: High - Core functionality for MVP
**Estimated Effort**: 3-5 days for Phase 1
