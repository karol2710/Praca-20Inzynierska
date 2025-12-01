# Global Configuration Feature

## Overview

This feature adds comprehensive resource quota and rate limiting configuration to the Global Configuration section of the Create Chart page.

## Components Added

### 1. GlobalConfigurationForm Component

**File:** `client/components/GlobalConfigurationForm.tsx`

A dedicated component that encapsulates all global configuration settings, following the organize-ui principle.

**Features:**

- Namespace configuration
- Rate limiting (requests per second)
- Resource quota settings
- Sub-component for Resource Quota section

**Props:**

```typescript
interface GlobalConfigurationFormProps {
  config: GlobalConfigState;
  onNamespaceChange: (value: string) => void;
  onRequestsPerSecondChange: (value: string) => void;
  onResourceQuotaChange: (quota: GlobalConfigState["resourceQuota"]) => void;
}
```

## Configuration Fields

### Rate Limiting

- **Requests per Second**: Maximum number of requests allowed per second across all workloads
  - Type: Number
  - Placeholder: "e.g., 1000"
  - Optional field

### Resource Quota

#### CPU Resources

- **Requests CPU**: Minimum CPU guaranteed to containers
  - Format: `100m` (millicores) or `1` (full core)
  - Example: `100m`, `2500m`, `1`

- **Limits CPU**: Maximum CPU allowed for containers
  - Format: `500m` (millicores) or `2` (full cores)
  - Example: `500m`, `5000m`, `2`

#### Memory Resources

- **Requests Memory**: Minimum memory guaranteed to containers
  - Format: `128Mi`, `1Gi`, `512M`
  - Example: `128Mi`, `1Gi`, `512M`

- **Limits Memory**: Maximum memory allowed for containers
  - Format: `512Mi`, `2Gi`, `1024M`
  - Example: `512Mi`, `2Gi`, `1024M`

#### Storage Resources

- **Persistent Volume Claims Limit**: Maximum number of PVCs in the namespace
  - Type: Number
  - Example: `10`

- **Requests Storage**: Total storage quota for the namespace
  - Format: Storage size (e.g., `100Gi`, `1Ti`)
  - Example: `100Gi`, `1Ti`, `500Gi`

## Kubernetes Resource Format Reference

### CPU Format

- `1` = 1 CPU (1000m)
- `500m` = 0.5 CPU (500 millicores)
- `100m` = 0.1 CPU (100 millicores)
- `2500m` = 2.5 CPUs

### Memory Format

- `1Gi` = 1 Gigabyte (1024 MiB)
- `1G` = 1 Gigabyte (1000 MB)
- `128Mi` = 128 Mebibytes
- `512M` = 512 Megabytes

### Storage Format

- `1Ti` = 1 Terabyte (1024 Gi)
- `100Gi` = 100 Gigabytes
- `1Gi` = 1 Gigabyte
- `500Mi` = 500 Megabytes

## State Management

### CreateChart.tsx State Variables

```typescript
// Rate Limiting
const [requestsPerSecond, setRequestsPerSecond] = useState<string>("");

// Resource Quota
const [resourceQuota, setResourceQuota] = useState<{
  requestsCPU?: string;
  requestsMemory?: string;
  limitsCPU?: string;
  limitsMemory?: string;
  persistentVolumeClaimsLimit?: string;
  requestsStorage?: string;
}>({});
```

## Integration Points

### Deployment Function

These global configuration values should be passed to deployment handlers:

- `handleStandardSubmit()` - For standard deployments
- `handleAdvancedSubmit()` - For advanced deployments

### Workload Configuration

Global namespace is already applied to all workloads via the `globalNamespace` prop.

## Usage Example

```typescript
<GlobalConfigurationForm
  config={{
    namespace: globalNamespace,
    requestsPerSecond,
    resourceQuota,
  }}
  onNamespaceChange={setGlobalNamespace}
  onRequestsPerSecondChange={setRequestsPerSecond}
  onResourceQuotaChange={setResourceQuota}
/>
```

## Validation Rules

### Input Validation

- **Namespace**: Should be lowercase alphanumeric with hyphens, max 63 characters (Kubernetes standard)
- **Requests per Second**: Non-negative integer
- **CPU values**: Must be valid Kubernetes CPU format
- **Memory values**: Must be valid Kubernetes memory format
- **Storage values**: Must be valid Kubernetes storage format
- **PVC Limit**: Non-negative integer

### Recommended Validation (Future Implementation)

```typescript
// Kubernetes resource name validation
const isValidNamespace = (name: string) =>
  /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/.test(name);

// CPU format validation
const isValidCPU = (cpu: string) => /^(\d+m|\d+(\.\d+)?)$/.test(cpu);

// Memory format validation
const isValidMemory = (mem: string) =>
  /^(\d+)([KMG]i|[KMG]|[KMGTPEZY]i?)$/.test(mem);

// Storage format validation
const isValidStorage = (storage: string) =>
  /^(\d+)([KMG]i|[KMG]|[KMGTPEZY]i?)$/.test(storage);
```

## Future Enhancements

1. **Input Validation**: Add format validation for resource values
2. **API Integration**: Pass these values to deployment endpoints
3. **Storage in Database**: Persist global configurations per user
4. **Default Presets**: Offer pre-configured quota templates (small, medium, large)
5. **YAML Preview**: Show generated ResourceQuota YAML in real-time
6. **Conflict Detection**: Warn if resource limits < resource requests
7. **Cost Estimation**: Calculate estimated resource costs

## Testing

### Manual Testing Checklist

- [ ] Namespace field accepts valid input
- [ ] Requests per Second accepts numeric input
- [ ] CPU fields accept valid Kubernetes formats (100m, 1, etc.)
- [ ] Memory fields accept valid Kubernetes formats (128Mi, 1Gi, etc.)
- [ ] Storage field accepts valid formats (100Gi, 1Ti, etc.)
- [ ] PVC Limit accepts numeric input
- [ ] Form layout is responsive on mobile/tablet/desktop
- [ ] Values persist during form interactions
- [ ] All placeholders and hints are visible

### Example Test Data

```
Namespace: production
Requests per Second: 1000
Resource Quota:
  - Requests CPU: 100m
  - Requests Memory: 128Mi
  - Limits CPU: 2
  - Limits Memory: 2Gi
  - PVC Limit: 10
  - Requests Storage: 100Gi
```

## Architecture Decisions

### Why a Separate Component?

Following the `organize-ui` principle:

- Keeps CreateChart.tsx focused on workload and resource orchestration
- Makes Global Configuration easier to test and maintain
- Allows reuse in other pages if needed
- Cleaner separation of concerns

### State Management

- Kept in CreateChart.tsx to maintain current architecture
- Could be moved to Context/Redux if global state management is needed
- State is passed as props to component for flexibility

## Related Files

- `client/pages/CreateChart.tsx` - Main page using the component
- `client/components/GlobalConfigurationForm.tsx` - New component
- `server/routes/deploy.ts` - Standard deployment handler (needs integration)
- `server/routes/advanced-deploy.ts` - Advanced deployment handler (needs integration)

---

**Version:** 1.0
**Last Updated:** 2024
**Status:** Ready for Integration
