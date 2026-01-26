# API Reference

Complete API documentation for KubeChart.

## Base URL

```
http://localhost:8080/api
```

## Authentication

All API requests require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

### Obtaining a Token

See Authentication endpoints below.

## Response Format

All responses are JSON with the following structure:

**Success (2xx)**:
```json
{
  "data": {},
  "success": true,
  "message": "Optional message"
}
```

**Error (4xx, 5xx)**:
```json
{
  "error": "Error description",
  "details": {}
}
```

## API Endpoints

### Authentication

#### Register User

```
POST /auth/register
Content-Type: application/json

{
  "username": "user@example.com",
  "password": "securepassword"
}

Response:
{
  "success": true,
  "token": "jwt_token_here"
}
```

#### Login

```
POST /auth/login
Content-Type: application/json

{
  "username": "user@example.com",
  "password": "securepassword"
}

Response:
{
  "success": true,
  "token": "jwt_token_here"
}
```

### Deployments

#### List All Deployments

```
GET /deployments
Authorization: Bearer <token>

Response:
{
  "deployments": [
    {
      "id": "uuid",
      "name": "my-app",
      "namespace": "default",
      "status": "active",
      "environment": "production",
      "createdAt": "2024-01-01T00:00:00Z",
      "workloads": 1,
      "resources": 5
    }
  ]
}
```

#### Get Deployment YAML

```
GET /deployments/<deploymentId>/yaml
Authorization: Bearer <token>

Response:
{
  "yaml": "apiVersion: v1\nkind: ...\n"
}
```

#### Create Deployment

```
POST /deployments
Authorization: Bearer <token>
Content-Type: application/json

{
  "workloads": [
    {
      "id": "unique-id",
      "name": "my-deployment",
      "type": "Deployment",
      "containers": [...],
      "config": {...}
    }
  ],
  "resources": [],
  "globalNamespace": "default",
  "globalDomain": "example.com",
  "requestsPerSecond": "100",
  "resourceQuota": {},
  "_fullYaml": ""
}

Response:
{
  "success": true,
  "deploymentId": "new-id",
  "message": "Deployment created successfully"
}
```

#### Update Deployment

```
PUT /deployments/<deploymentId>
Authorization: Bearer <token>
Content-Type: application/json

{
  "workloads": [...],
  "resources": [],
  "globalNamespace": "default",
  "globalDomain": "example.com",
  "requestsPerSecond": "100",
  "resourceQuota": {},
  "_fullYaml": ""
}

Response:
{
  "success": true,
  "message": "Deployment updated successfully",
  "deploymentId": "id"
}
```

#### Delete Deployment

```
DELETE /deployments/<deploymentId>
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "Deployment deleted successfully"
}
```

#### Get Deployment for Editing

```
GET /deployments/<deploymentId>/edit
Authorization: Bearer <token>

Response:
{
  "workloads": [...],
  "resources": [],
  "globalNamespace": "default",
  "globalDomain": "example.com"
}
```

### Deployment Resources

#### Get All Resources in Deployment

```
GET /deployments/<deploymentId>/resources
Authorization: Bearer <token>

Response:
{
  "resources": [
    {
      "kind": "Deployment",
      "name": "my-app",
      "namespace": "default",
      "apiVersion": "apps/v1",
      "deletable": true
    },
    {
      "kind": "Service",
      "name": "my-app",
      "namespace": "default",
      "apiVersion": "v1",
      "deletable": true
    }
  ]
}
```

#### Delete Specific Resource

```
DELETE /deployments/<deploymentId>/resources
Authorization: Bearer <token>
Content-Type: application/json

{
  "kind": "Deployment",
  "name": "my-app",
  "namespace": "default"
}

Response:
{
  "success": true,
  "message": "Resource Deployment/my-app deleted successfully"
}
```

### Advanced Deployment

#### Advanced Deploy with Custom Settings

```
POST /advanced-deploy
Authorization: Bearer <token>
Content-Type: application/json

{
  "workloads": [...],
  "resources": [],
  "globalNamespace": "namespace",
  "globalDomain": "example.com",
  "requestsPerSecond": "100",
  "resourceQuota": {}
}

Response:
{
  "success": true,
  "message": "Resources deployed successfully",
  "results": [...]
}
```

## Error Responses

### 400 Bad Request

```json
{
  "error": "Validation failed",
  "details": {
    "field": "error message"
  }
}
```

### 401 Unauthorized

```json
{
  "error": "Not authenticated"
}
```

### 403 Forbidden

```json
{
  "error": "Not authorized to perform this action"
}
```

### 404 Not Found

```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error

```json
{
  "error": "Internal server error",
  "details": "Error description"
}
```

## Request/Response Examples

### Example: Create Deployment

**Request**:
```bash
curl -X POST http://localhost:8080/api/deployments \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "workloads": [
      {
        "id": "1",
        "name": "web-app",
        "type": "Deployment",
        "containers": [
          {
            "name": "web",
            "image": "nginx:latest",
            "ports": [{"containerPort": 80}]
          }
        ],
        "config": {
          "replicas": 3
        }
      }
    ],
    "resources": [],
    "globalNamespace": "production",
    "globalDomain": "example.com"
  }'
```

**Response**:
```json
{
  "success": true,
  "deploymentId": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Deployment created successfully"
}
```

### Example: Get Deployments

**Request**:
```bash
curl -H "Authorization: Bearer eyJhbGc..." \
  http://localhost:8080/api/deployments
```

**Response**:
```json
{
  "deployments": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "web-app",
      "namespace": "production",
      "status": "active",
      "environment": "production",
      "createdAt": "2024-01-01T12:00:00Z",
      "workloads": 1,
      "resources": 5
    }
  ]
}
```

### Example: Delete Resource

**Request**:
```bash
curl -X DELETE http://localhost:8080/api/deployments/550e8400-e29b-41d4-a716-446655440000/resources \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "Pod",
    "name": "web-app-123",
    "namespace": "production"
  }'
```

**Response**:
```json
{
  "success": true,
  "message": "Resource Pod/web-app-123 deleted successfully"
}
```

## Data Types

### Deployment Object

```typescript
{
  id: string;              // UUID
  name: string;            // Deployment name
  namespace: string;       // Kubernetes namespace
  status: string;          // "active" | "failed" | "pending"
  environment: string;     // "staging" | "production"
  createdAt: string;       // ISO 8601 timestamp
  workloads: number;       // Number of workloads
  resources: number;       // Number of resources
}
```

### Workload Object

```typescript
{
  id: string;              // Unique ID
  name: string;            // Workload name
  type: string;            // "Pod" | "Deployment" | "StatefulSet" | etc.
  containers: Container[]; // Array of containers
  config: Record<string, any>; // Type-specific config
}
```

### Container Object

```typescript
{
  name: string;            // Container name
  image: string;           // Container image
  ports?: Port[];          // Exposed ports
  env?: EnvVar[];          // Environment variables
  resources?: Resources;   // CPU/memory limits
  volumeMounts?: VolumeMount[]; // Volume mounts
}
```

### Resource Object

```typescript
{
  kind: string;            // Resource kind
  name: string;            // Resource name
  namespace: string;       // Namespace
  apiVersion: string;      // API version
  deletable: boolean;      // Can be deleted via UI
}
```

## Rate Limiting

Currently no rate limiting is implemented. All authenticated requests are accepted.

## Pagination

Not implemented. All results are returned at once.

## Filtering

Not implemented. Use client-side filtering if needed.

## Versioning

API version is included in request paths where needed:
- Core API: `/api/v1/...`
- Extended API: `/api/extended/...`

Current version is implicitly `v1`.

## Deprecation Policy

Deprecated endpoints will be marked with:
```json
{
  "deprecated": true,
  "deprecatedIn": "1.1.0",
  "removedIn": "2.0.0",
  "replacement": "/api/new-endpoint"
}
```

## Related Documentation

- [Getting Started](GETTING_STARTED.md)
- [Deployment Guide](DEPLOYMENT.md)
- [Architecture](ARCHITECTURE.md)

---

For client libraries and more examples, see the source code in `client/` and `server/routes/`.
