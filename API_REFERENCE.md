# KubeChart API Reference

Complete API documentation for all KubeChart endpoints with examples, request/response formats, and error codes.

## Table of Contents

1. [Authentication API](#authentication-api)
2. [Deployment API](#deployment-api)
3. [History API](#history-api)
4. [Error Handling](#error-handling)
5. [Security](#security)
6. [Rate Limiting](#rate-limiting)

## Base URL

```
http://localhost:3000/api   (Development)
https://api.example.com/api (Production)
```

## Authentication API

### POST /api/auth/signup

Create a new user account.

**Endpoint:** `POST /api/auth/signup`

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

**Request Parameters:**

| Parameter | Type | Required | Description | Constraints |
|-----------|------|----------|-------------|-------------|
| username | string | Yes | Unique username | 3-50 chars, alphanumeric + underscore |
| email | string | Yes | Valid email address | Must be unique, valid email format |
| password | string | Yes | User password | Min 8 chars, must have uppercase, number, special char |

**Success Response (201):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInVzZXJuYW1lIjoiam9obl9kb2UiLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6MTYwMDYwNDgwMH0.signature",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com"
  }
}
```

**Error Responses:**

```json
// 400: Username already exists
{
  "success": false,
  "error": "Username already exists"
}

// 400: Email already exists
{
  "success": false,
  "error": "Email already exists"
}

// 400: Invalid email format
{
  "success": false,
  "error": "Invalid email format"
}

// 400: Password too weak
{
  "success": false,
  "error": "Password must be at least 8 characters"
}

// 500: Server error
{
  "success": false,
  "error": "Failed to create account"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "SecurePassword123!"
  }'
```

**JavaScript Example:**
```javascript
const response = await fetch('http://localhost:3000/api/auth/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'john_doe',
    email: 'john@example.com',
    password: 'SecurePassword123!'
  })
});
const data = await response.json();
// Store token: localStorage.setItem('token', data.token);
```

---

### POST /api/auth/login

Authenticate user and obtain JWT token.

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "username": "john_doe",
  "password": "SecurePassword123!"
}
```

**Request Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| username | string | Yes | Username or email |
| password | string | Yes | User password |

**Success Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com"
  }
}
```

**Token Details:**
- **Type:** JWT (JSON Web Token)
- **Expiry:** 7 days from issue time
- **Signing Algorithm:** HS256
- **Secret:** From `JWT_SECRET` environment variable

**Error Responses:**

```json
// 401: Invalid credentials
{
  "success": false,
  "error": "Invalid username or password"
}

// 400: Missing parameters
{
  "success": false,
  "error": "Username and password are required"
}

// 500: Server error
{
  "success": false,
  "error": "Login failed"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "password": "SecurePassword123!"
  }'
```

---

### GET /api/auth/me

Get current authenticated user information.

**Endpoint:** `GET /api/auth/me`

**Authentication:** Required (Bearer Token)

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200):**
```json
{
  "id": 1,
  "username": "john_doe",
  "email": "john@example.com",
  "created_at": "2024-01-15T10:30:00Z"
}
```

**Error Responses:**

```json
// 401: Missing or invalid token
{
  "error": "Unauthorized"
}

// 401: Token expired
{
  "error": "Token expired"
}
```

**cURL Example:**
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

### POST /api/auth/logout

Logout user (client-side token removal).

**Endpoint:** `POST /api/auth/logout`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

> **Note:** Token removal is handled by the client (localStorage). The server endpoint is provided for completeness and future logging.

---

## Deployment API

### POST /api/check-security

Validate Helm chart security before deployment.

**Endpoint:** `POST /api/check-security`

**Authentication:** Required (Bearer Token)

**Request Body:**
```json
{
  "repository": "stable https://charts.helm.sh/stable",
  "helmInstall": "helm upgrade --install my-release stable/nginx --set replicaCount=3 --set image.tag=1.21.0"
}
```

**Request Parameters:**

| Parameter | Type | Required | Description | Constraints |
|-----------|------|----------|-------------|-------------|
| repository | string | Yes | Helm repository | Format: "name https://url" |
| helmInstall | string | Yes | Helm install command | Max 1000 chars, no shell metacharacters |

**Success Response (200):**
```json
{
  "success": true,
  "securityReport": {
    "valid": true,
    "summary": "Security check passed with 0 warning(s). All critical security checks passed.",
    "checks": [
      {
        "name": "image-tag",
        "severity": "info",
        "message": "Container image tag is specified",
        "description": "Image uses explicit version tag (not 'latest')"
      }
    ],
    "errors": [],
    "warnings": []
  }
}
```

**Example Response with Warnings:**
```json
{
  "success": true,
  "securityReport": {
    "valid": true,
    "summary": "Security check passed with 2 warning(s). Review recommendations for production readiness.",
    "checks": [ /* ... */ ],
    "errors": [],
    "warnings": [
      {
        "name": "security-context-user",
        "severity": "warning",
        "message": "Container may run as root user",
        "description": "Set securityContext.runAsNonRoot: true and specify a non-root user (uid > 1000)"
      },
      {
        "name": "resource-limits",
        "severity": "warning",
        "message": "Container resource limits not fully defined",
        "description": "Define both CPU and memory limits (e.g., limits.cpu: '500m', limits.memory: '512Mi')"
      }
    ]
  }
}
```

**Example Response with Errors:**
```json
{
  "success": true,
  "securityReport": {
    "valid": false,
    "summary": "Security check failed: 1 critical error(s) found. Fix these before deployment.",
    "checks": [ /* ... */ ],
    "errors": [
      {
        "name": "hardcoded-secret",
        "severity": "error",
        "message": "Hardcoded secret detected in environment variable: API_KEY",
        "description": "Use Kubernetes Secrets or external secret management solutions instead"
      }
    ],
    "warnings": []
  }
}
```

**Validation Checks:**

| Check | Severity | Description |
|-------|----------|-------------|
| image-tag | warning | 'latest' tag or unspecified |
| image-registry | warning | Docker Hub without explicit registry |
| image-missing | error | No image specified |
| security-context-user | warning | Not running as non-root |
| security-context-filesystem | warning | Root filesystem is writable |
| security-context-privilege | warning | Privilege escalation not disabled |
| resource-limits | warning | Missing CPU or memory limits |
| resource-requests | warning | Missing resource requests |
| liveness-probe | warning | Liveness probe not configured |
| readiness-probe | warning | Readiness probe not configured |
| service-account | info | Using default service account |
| hardcoded-secret | error | Hardcoded secrets detected |
| replica-count | warning | Single replica (no HA) |
| image-pull-secret | error | Private registry without auth |
| service-type | info | Service type not specified |
| ingress-hosts | warning | Ingress enabled without hosts |
| pod-disruption-budget | info | Pod Disruption Budget missing |

**Error Responses:**

```json
// 400: Invalid repository format
{
  "success": false,
  "securityReport": null,
  "error": "Invalid repository configuration"
}

// 400: Invalid helm command
{
  "success": false,
  "securityReport": null,
  "error": "Invalid helm install command"
}

// 401: Unauthorized
{
  "error": "Unauthorized"
}

// 500: Server error
{
  "success": false,
  "securityReport": null,
  "error": "Security check failed"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/check-security \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "repository": "stable https://charts.helm.sh/stable",
    "helmInstall": "helm upgrade --install my-release stable/nginx --set image.tag=1.21.0"
  }'
```

---

### POST /api/deploy

Deploy Helm chart with automatic security validation.

**Endpoint:** `POST /api/deploy`

**Authentication:** Required (Bearer Token)

**Request Body:**
```json
{
  "repository": "stable https://charts.helm.sh/stable",
  "helmInstall": "helm upgrade --install my-release stable/nginx --set replicaCount=3"
}
```

**Request Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| repository | string | Yes | Helm repository (format: "name https://url") |
| helmInstall | string | Yes | Helm install command |

**Success Response (200):**
```json
{
  "success": true,
  "output": "=== Starting Helm Deployment ===\n\n=== Security Validation Report ===\nSecurity check passed with 0 warning(s)...\n\n=== Helm Repository Setup ===\nadding repo stable https://charts.helm.sh/stable\nUpdating helm repository cache...\nSuccessfully added repository 'stable'\n\n=== Helm Upgrade/Install ===\nRelease \"my-release\" does not exist. Installing it now.\nNAME: my-release\nLAST DEPLOYED: Mon Jan 15 10:30:00 2024\nNAMESPACE: default\nSTATUS: deployed\nREVISION: 1\n\n=== Helm Deployment Completed Successfully ===",
  "securityReport": {
    "valid": true,
    "summary": "...",
    "checks": [],
    "errors": [],
    "warnings": []
  }
}
```

**Output Format:**

The `output` field contains a formatted log that includes:
1. Security validation report
2. Helm repository setup logs
3. Helm deployment output
4. Success/failure summary

**Error Responses:**

```json
// 400: Invalid input
{
  "success": false,
  "output": "",
  "error": "Invalid repository configuration"
}

// 401: Unauthorized
{
  "error": "Unauthorized"
}

// 500: Deployment failed
{
  "success": false,
  "output": "=== Error Output ===\nhelm error: ...",
  "error": "Deployment failed. Please check your inputs and try again."
}
```

**Important Notes:**

- Security check is run automatically before deployment
- If security errors are present, deployment will still proceed (user was warned)
- Helm and helm repositories must be accessible on the server
- Deployment status is NOT saved to database for standard deployments

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/deploy \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "repository": "stable https://charts.helm.sh/stable",
    "helmInstall": "helm upgrade --install my-release stable/nginx"
  }'
```

---

### POST /api/deploy-advanced

Deploy custom Kubernetes YAML manifest using kubectl.

**Endpoint:** `POST /api/deploy-advanced`

**Authentication:** Required (Bearer Token)

**Prerequisites:**
- User must have Rancher credentials configured in database
- Rancher cluster must be accessible

**Request Body:**
```json
{
  "workloads": [
    {
      "id": "wld-uuid-1",
      "name": "my-app",
      "type": "Deployment",
      "replicas": 3,
      "containers": [
        {
          "id": "cnt-uuid-1",
          "name": "app",
          "image": "myrepo/app:1.0.0",
          "ports": [
            {
              "containerPort": 8080,
              "name": "http"
            }
          ],
          "env": [
            {
              "name": "LOG_LEVEL",
              "value": "info"
            }
          ],
          "resources": {
            "requests": {
              "cpu": "100m",
              "memory": "128Mi"
            },
            "limits": {
              "cpu": "500m",
              "memory": "512Mi"
            }
          }
        }
      ]
    }
  ],
  "resources": [
    {
      "id": "res-uuid-1",
      "name": "my-service",
      "type": "Service",
      "spec": {
        "type": "ClusterIP",
        "selector": {
          "app": "my-app"
        },
        "ports": [
          {
            "port": 80,
            "targetPort": 8080,
            "protocol": "TCP"
          }
        ]
      }
    }
  ],
  "globalNamespace": "production",
  "globalDomain": "example.com",
  "requestsPerSecond": "1000",
  "resourceQuota": {
    "requestsCPU": "10",
    "requestsMemory": "20Gi",
    "limitsCPU": "20",
    "limitsMemory": "40Gi"
  },
  "generatedYaml": "# User-edited YAML portion (optional edits)",
  "_fullYaml": "# Complete YAML for backend application"
}
```

**Request Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| workloads | array | Yes | Array of workload objects (Deployment, Pod, etc.) |
| resources | array | Yes | Array of resource objects (Service, HTTPRoute, etc.) |
| globalNamespace | string | Yes | Kubernetes namespace for deployment |
| globalDomain | string | No | Domain for HTTPRoute/GRPCRoute |
| requestsPerSecond | string | No | Rate limiting requests per second |
| resourceQuota | object | No | Resource quota configuration |
| generatedYaml | string | No | User-edited YAML (for reference) |
| _fullYaml | string | Yes | Complete YAML manifest for kubectl apply |

**Success Response (200):**
```json
{
  "success": true,
  "output": "=== Advanced Deployment Started ===\n\nNamespace: production\nWorkloads: 1\nResources: 2\n\nCreated directory: /tmp/deployment-production-1705318200000\n\n=== Writing 10 YAML files ===\n\n✓ Created: 1-namespace-production.yaml\n✓ Created: 2-serviceaccount-default.yaml\n✓ Created: 3-role-default-role.yaml\n✓ Created: 4-rolebinding-default-rolebinding.yaml\n✓ Created: 5-deployment-my-app.yaml\n✓ Created: 6-service-my-service.yaml\n✓ Created: 7-networkreourcepool-isolate-production.yaml\n✓ Created: 8-resourcequota-namespace-quota.yaml\n\n=== Applying to Kubernetes Cluster ===\n\nnamespace/production created\nserviceaccount/default created\nrole.rbac.authorization.k8s.io/default-role created\nrolebinding.rbac.authorization.k8s.io/default-rolebinding created\ndeployment.apps/my-app created\nservice/my-service created\nnetworkpolicy.networking.k8s.io/isolate-production created\nresourcequota/namespace-quota created\n\n=== Deployment Successful ===\n\nAll resources have been applied to namespace: production\nVerify with: kubectl get all -n production\n\n=== Deployment record saved to database ===",
  "namespace": "production"
}
```

**Deployment Record Created:**

After successful deployment, a record is saved to the database:

```json
{
  "id": 1,
  "user_id": 1,
  "name": "deployment-1705318200000",
  "type": "advanced",
  "namespace": "production",
  "yaml_config": "# Full YAML saved here",
  "status": "deployed",
  "environment": "production",
  "workloads_count": 1,
  "resources_count": 2,
  "created_at": "2024-01-15T10:30:00Z"
}
```

**Error Responses:**

```json
// 400: Missing workloads
{
  "error": "At least one workload is required"
}

// 400: User not authenticated
{
  "error": "Not authenticated"
}

// 400: Rancher credentials not configured
{
  "error": "Rancher RKE2 cluster credentials not configured. Please set up your cluster in settings."
}

// 500: kubectl apply failed
{
  "success": false,
  "output": "⚠ kubectl error: connection refused\n\nYAML files have been created at: /tmp/deployment-...\nYou can manually apply them with: kubectl apply -f /tmp/deployment-...",
  "error": "Failed to generate deployment"
}
```

**Deployment Steps:**

1. Validate user is authenticated
2. Fetch user's Rancher credentials from database
3. Validate YAML structure
4. Create temporary deployment directory
5. Split YAML by document separator ("---")
6. Write each YAML document to separate file
7. Generate kubeconfig file with Rancher credentials
8. Execute: `kubectl apply -f <deployment_dir>`
9. Save deployment record to database
10. Clean up temporary files
11. Return deployment output

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/deploy-advanced \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d @deployment-payload.json
```

---

## History API

### GET /api/deployments

List all deployments for the authenticated user.

**Endpoint:** `GET /api/deployments`

**Authentication:** Required (Bearer Token)

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| limit | integer | 50 | Number of deployments to return (max 100) |
| offset | integer | 0 | Number of deployments to skip |
| status | string | - | Filter by status (deployed, pending, deleted) |
| type | string | - | Filter by type (standard, advanced) |

**Success Response (200):**
```json
[
  {
    "id": 1,
    "name": "deployment-1705318200000",
    "namespace": "production",
    "type": "advanced",
    "status": "deployed",
    "environment": "production",
    "workloads_count": 1,
    "resources_count": 2,
    "createdAt": "2024-01-15T10:30:00Z"
  },
  {
    "id": 2,
    "name": "helm-nginx",
    "namespace": "default",
    "type": "standard",
    "status": "deployed",
    "environment": "production",
    "workloads_count": 0,
    "resources_count": 0,
    "createdAt": "2024-01-14T15:20:00Z"
  }
]
```

**Error Responses:**

```json
// 401: Unauthorized
{
  "error": "Unauthorized"
}

// 500: Server error
{
  "error": "Failed to retrieve deployments"
}
```

**cURL Example:**
```bash
# Get all deployments
curl -X GET "http://localhost:3000/api/deployments" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Get deployments with filter
curl -X GET "http://localhost:3000/api/deployments?status=deployed&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

### GET /api/deployments/{deploymentId}/yaml

Get the saved YAML configuration for a specific deployment.

**Endpoint:** `GET /api/deployments/{deploymentId}/yaml`

**Authentication:** Required (Bearer Token)

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| deploymentId | integer | ID of the deployment |

**Success Response (200):**
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: production
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: default
  namespace: production
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
  namespace: production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      serviceAccountName: default
      containers:
      - name: app
        image: myrepo/app:1.0.0
        ports:
        - containerPort: 8080
          name: http
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: 500m
            memory: 512Mi
---
apiVersion: v1
kind: Service
metadata:
  name: my-service
  namespace: production
spec:
  type: ClusterIP
  selector:
    app: my-app
  ports:
  - port: 80
    targetPort: 8080
```

**Response Headers:**
```
Content-Type: text/yaml
Content-Disposition: attachment; filename="deployment-1-yaml.yaml"
```

**Error Responses:**

```json
// 404: Deployment not found
{
  "error": "Deployment not found"
}

// 401: Unauthorized
{
  "error": "Unauthorized"
}

// 403: Access denied (belongs to different user)
{
  "error": "Access denied"
}
```

**cURL Example:**
```bash
# Download YAML to file
curl -X GET "http://localhost:3000/api/deployments/1/yaml" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -o deployment.yaml

# View YAML in terminal
curl -X GET "http://localhost:3000/api/deployments/1/yaml" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" | less
```

---

### DELETE /api/deployments/{deploymentId}

Soft-delete a deployment (marks as deleted, doesn't remove from database).

**Endpoint:** `DELETE /api/deployments/{deploymentId}`

**Authentication:** Required (Bearer Token)

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| deploymentId | integer | ID of the deployment to delete |

**Success Response (200):**
```json
{
  "success": true,
  "message": "Deployment marked as deleted"
}
```

**Error Responses:**

```json
// 404: Deployment not found
{
  "error": "Deployment not found"
}

// 401: Unauthorized
{
  "error": "Unauthorized"
}

// 403: Access denied
{
  "error": "Access denied"
}

// 500: Server error
{
  "error": "Failed to delete deployment"
}
```

**Notes:**

- Deployment is soft-deleted (status set to 'deleted')
- YAML is preserved in database for audit purposes
- Can be restored by updating status in database if needed

**cURL Example:**
```bash
curl -X DELETE "http://localhost:3000/api/deployments/1" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Error Handling

### HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | Deployment successful |
| 201 | Created | User account created |
| 400 | Bad Request | Invalid input format |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Access to another user's resource |
| 404 | Not Found | Deployment ID doesn't exist |
| 500 | Server Error | Database connection failed |

### Error Response Format

All error responses follow this format:

```json
{
  "success": false,
  "error": "Human-readable error message",
  "details": "Additional details (optional)"
}
```

### Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "Unauthorized" | Missing or invalid JWT token | Log in again, check token expiry |
| "Username already exists" | Username taken | Choose different username |
| "Invalid repository configuration" | Bad repo format | Use "name https://url" format |
| "Rancher credentials not configured" | User hasn't set up cluster | Configure Rancher credentials in settings |
| "At least one workload is required" | No workloads in deployment | Create at least one workload |
| "Database connection failed" | PostgreSQL unreachable | Check DATABASE_URL, ensure PostgreSQL is running |

---

## Security

### Authentication

- **Method:** JWT (Bearer token in Authorization header)
- **Token Format:** `Authorization: Bearer <token>`
- **Token Expiry:** 7 days
- **Token Algorithm:** HS256

### Required Headers

All authenticated endpoints require:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### HTTPS

In production, all endpoints MUST use HTTPS:

```
https://api.example.com/api/auth/login
```

### Input Validation

All inputs are validated:

- **Repository:** Format validation, URL must use HTTPS
- **Helm Command:** Dangerous characters blocked, max 1000 chars
- **Email:** Valid email format, uniqueness checked
- **Password:** Min 8 chars, must include uppercase, number, special char
- **YAML:** Basic structure validation before kubectl apply

---

## Rate Limiting

Currently not implemented. Recommended for production:

```
- Login attempts: 5 per minute per IP
- API requests: 100 per minute per user
- Deployment operations: 10 per hour per user
```

Implement using middleware like `express-rate-limit`:

```javascript
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: 'Too many login attempts, please try again later'
});

app.post('/api/auth/login', loginLimiter, handleLogin);
```

---

## Examples

### Complete Standard Deployment Flow

```bash
# 1. Login
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"john_doe","password":"SecurePassword123!"}' \
  | jq -r '.token')

# 2. Check security
curl -X POST http://localhost:3000/api/check-security \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "repository": "stable https://charts.helm.sh/stable",
    "helmInstall": "helm upgrade --install my-release stable/nginx"
  }' | jq '.securityReport'

# 3. Deploy
curl -X POST http://localhost:3000/api/deploy \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "repository": "stable https://charts.helm.sh/stable",
    "helmInstall": "helm upgrade --install my-release stable/nginx"
  }' | jq '.output'
```

### Complete Deployment History Flow

```bash
# 1. Login
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"john_doe","password":"SecurePassword123!"}' \
  | jq -r '.token')

# 2. List deployments
DEPLOYMENTS=$(curl -X GET "http://localhost:3000/api/deployments?limit=10" \
  -H "Authorization: Bearer $TOKEN")

echo $DEPLOYMENTS | jq '.[0].id'

# 3. Get deployment YAML
DEPLOYMENT_ID=$(echo $DEPLOYMENTS | jq -r '.[0].id')
curl -X GET "http://localhost:3000/api/deployments/$DEPLOYMENT_ID/yaml" \
  -H "Authorization: Bearer $TOKEN" \
  -o deployment.yaml

# 4. Delete deployment
curl -X DELETE "http://localhost:3000/api/deployments/$DEPLOYMENT_ID" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Changelog

### Version 1.0.0 (Current)

- ✅ Authentication endpoints (signup, login, logout, me)
- ✅ Standard deployment with security validation
- ✅ Advanced deployment with kubectl
- ✅ Deployment history management
- ⏳ Planned: Rate limiting
- ⏳ Planned: Webhook integration
- ⏳ Planned: Multi-cluster support
