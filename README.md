# KubeChart - Kubernetes Configuration Manager

A web-based UI for building, validating, and deploying Kubernetes configurations. Deploy applications using Helm charts (Standard mode) or custom YAML manifests (Advanced mode) with built-in security validation.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Usage Guide](#usage-guide)
- [API Documentation](#api-documentation)
- [Configuration](#configuration)
- [Security](#security)
- [Troubleshooting](#troubleshooting)

## Overview

KubeChart is a full-stack Kubernetes deployment manager that provides two deployment paths:

1. **Standard Deployment** - Deploy pre-built Helm charts with automatic security validation
2. **Advanced Deployment** - Build custom Kubernetes manifests interactively with full control over workloads and resources

The application includes user authentication, deployment history tracking, and integration with Kubernetes clusters via Helm and Rancher.

## Features

### Standard Deployment

- Deploy Helm charts from any repository
- Automatic security validation before deployment
- Real-time security check reports with warnings and error handling
- One-click deployment with helm

### Advanced Deployment

- Interactive builder for multiple workloads (Pod, Deployment, ReplicaSet, StatefulSet, Job, CronJob)
- Support for Kubernetes resources (Service, HTTPRoute, GRPCRoute, ConfigMap, Secret, etc.)
- Auto-generated YAML templates with pre-configured security defaults
- Real-time YAML editing and preview
- Support for global configuration (namespace, domain, rate limiting, resource quotas)
- Deploy to Rancher-managed Kubernetes clusters with kubectl

### Common Features

- User accounts with JWT-based authentication
- Deployment history and management
- YAML download and copying
- Role-based access control (user owns their deployments)
- Responsive UI with Tailwind CSS and Radix components

## Technology Stack

### Frontend

- **React 18** - UI framework
- **TypeScript** - Type-safe development
- **Vite** - Fast module bundler
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS styling
- **Radix UI** - Accessible UI components
- **Lucide React** - Icon library
- **Sonner** - Toast notifications

### Backend

- **Node.js + Express** - HTTP server and routing
- **TypeScript** - Type-safe backend code
- **PostgreSQL** - Relational database
- **jsonwebtoken** - JWT authentication
- **bcryptjs** - Password hashing
- **Netlify Functions** - Serverless deployment option

### DevOps & Deployment

- **Docker/Kubernetes** - Container orchestration targets
- **Helm** - Package manager for Kubernetes
- **Rancher** - Kubernetes cluster management
- **Netlify** - Hosting and serverless functions

## Quick Start

### Prerequisites

- Node.js 16+ and pnpm
- PostgreSQL 12+ (for backend)
- Helm 3+ (for standard deployments)
- kubectl (for advanced deployments)

### Development Setup

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration
# Required: DATABASE_URL, JWT_SECRET

# Start development server
pnpm run dev

# The app will be available at http://localhost:5173
```

### Build for Production

```bash
# Build frontend and backend
pnpm run build

# Start production server
pnpm run start
```

### Docker Setup

```bash
# Build Docker image
docker build -t kubechart:latest .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL=postgresql://user:pass@host/db \
  -e JWT_SECRET=your-secret-key \
  kubechart:latest
```

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Web Browser                              │
│                  (React + Vite)                              │
└──────────────────────────┬──────────────────────────────────┘
                           ��� (HTTP/JSON)
┌──────────────────────────▼──────────────────────────────────┐
│                  Express Server                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Authentication (JWT)                                │    │
│  │ Standard Deploy (Helm)                              │    │
│  │ Advanced Deploy (kubectl + Rancher)                 │    │
│  │ Deployments Management                              │    │
│  └─────────────────────────────────────────────────────┘    │
└──────────────┬──────────────────┬──────────────────────────┘
               │                  │
        ┌──────▼──────┐    ┌──────▼──────┐
        │ PostgreSQL  │    │ Kubernetes  │
        │ Database    │    │ Cluster     │
        └─────────────┘    └─────────────┘
```

### Data Flow - Standard Deployment

```
User Input (Repo + Helm Command)
    │
    ▼
Security Validation (Server-side)
    │
    ├─ Parse Helm values
    ├─ Check image security
    ├─ Validate resource configs
    └─ Return report (errors/warnings)
    │
    ▼
User confirms deployment
    │
    ▼
Execute Helm Commands
    ├─ helm repo add
    ├─ helm repo update
    └─ helm upgrade --install
    │
    ▼
Return deployment output
```

### Data Flow - Advanced Deployment

```
User builds workloads & resources
    │
    ▼
Client generates YAML
    ├─ template-generator.ts (routes, services, RBAC)
    └─ yaml-builder.ts (pod, deployment specs)
    │
    ▼
User reviews & edits YAML
    │
    ▼
Submit deployment
    │
    ▼
Server receives YAML
    │
    ├─ Validate user has Rancher credentials
    ├─ Write YAML files to /tmp
    ├─ Generate kubeconfig from user's credentials
    └─ Run: kubectl apply -f <files>
    │
    ▼
Save deployment record to database
    │
    ▼
Return deployment status
```

### Database Schema

#### Users Table

```sql
id                    INT PRIMARY KEY
username              VARCHAR(255) UNIQUE NOT NULL
email                 VARCHAR(255) UNIQUE NOT NULL
password_hash         VARCHAR(255) NOT NULL
created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP
rancher_api_url       VARCHAR(500)
rancher_api_token     VARCHAR(500)
rancher_cluster_id    VARCHAR(255)
namespace_counter     INT DEFAULT 0
```

#### Deployments Table

```sql
id                INT PRIMARY KEY
user_id           INT NOT NULL REFERENCES users(id) ON DELETE CASCADE
name              VARCHAR(255) NOT NULL
type              VARCHAR(50) NOT NULL ('standard' or 'advanced')
namespace         VARCHAR(255) NOT NULL
yaml_config       TEXT NOT NULL
status            VARCHAR(50) DEFAULT 'pending' ('deployed', 'pending', 'deleted')
environment       VARCHAR(50) DEFAULT 'production'
workloads_count   INT DEFAULT 0
resources_count   INT DEFAULT 0
created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP

INDEX idx_deployments_user_id ON deployments(user_id)
```

## Usage Guide

### 1. User Registration and Login

```bash
# Sign up
POST /api/auth/signup
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "secure_password"
}

# Login
POST /api/auth/login
{
  "username": "john_doe",
  "password": "secure_password"
}

# Response
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com"
  }
}
```

### 2. Standard Deployment Workflow

**Step 1:** Fill in deployment form

- Repository: `stable https://charts.helm.sh/stable`
- Helm Install: `helm upgrade --install my-release stable/nginx --set replicaCount=3`

**Step 2:** Security check runs automatically

- Parser extracts helm values
- Validates image sources, security context, resource limits
- Reports warnings/errors

**Step 3:** Review security report

- Fix critical errors if any
- Optionally address warnings
- Click "Proceed with Deployment"

**Step 4:** Deployment executes

- Backend adds helm repository
- Runs helm upgrade --install command
- Returns deployment output

### 3. Advanced Deployment Workflow

**Step 1:** Configure global settings

- Namespace: `production`
- Domain: `example.com`
- Rate Limiting: `1000 requests/second`
- Resource Quota: CPU/Memory limits

**Step 2:** Create workloads

- Click "Create Workload"
- Select type (Deployment, StatefulSet, etc.)
- Configure containers, ports, environment variables
- Add affinity rules, health checks

**Step 3:** Create resources

- Click "Create Resource"
- Add Services, HTTPRoutes, ConfigMaps, Secrets
- Services auto-linked to workloads
- HTTPRoute uses global domain for hostnames

**Step 4:** Review and deploy

- View generated YAML
- Edit YAML if needed
- Click "Deploy Advanced Configuration"
- YAML applied via kubectl with your Rancher credentials

### 4. Managing Deployments

```bash
# List your deployments
GET /api/deployments
Authorization: Bearer <token>

# Get deployment YAML
GET /api/deployments/{deploymentId}/yaml
Authorization: Bearer <token>

# Delete deployment
DELETE /api/deployments/{deploymentId}
Authorization: Bearer <token>
```

## API Documentation

### Authentication Endpoints

#### POST /api/auth/signup

Create a new user account.

**Request:**

```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

**Response (200):**

```json
{
  "success": true,
  "token": "jwt_token_string",
  "user": {
    "id": 1,
    "username": "string",
    "email": "string"
  }
}
```

#### POST /api/auth/login

Authenticate user and get JWT token.

**Request:**

```json
{
  "username": "string",
  "password": "string"
}
```

**Response (200):**

```json
{
  "success": true,
  "token": "jwt_token_string",
  "user": {
    "id": 1,
    "username": "string",
    "email": "string"
  }
}
```

#### GET /api/auth/me

Get current authenticated user. Requires valid JWT token.

**Headers:**

```
Authorization: Bearer <token>
```

**Response (200):**

```json
{
  "id": 1,
  "username": "string",
  "email": "string"
}
```

### Deployment Endpoints

#### POST /api/check-security

Validate Helm chart before deployment. Returns security report.

**Request:**

```json
{
  "repository": "stable https://charts.helm.sh/stable",
  "helmInstall": "helm upgrade --install my-release stable/nginx --set image.tag=latest"
}
```

**Response (200):**

```json
{
  "success": true,
  "securityReport": {
    "valid": false,
    "summary": "Security check passed with 2 warning(s)...",
    "errors": [],
    "warnings": [
      {
        "name": "image-tag",
        "severity": "warning",
        "message": "Container image tag is 'latest' or unspecified",
        "description": "Using 'latest' tag can lead to unexpected behavior..."
      }
    ]
  }
}
```

#### POST /api/deploy

Deploy Helm chart with security validation.

**Request:**

```json
{
  "repository": "stable https://charts.helm.sh/stable",
  "helmInstall": "helm upgrade --install my-release stable/nginx"
}
```

**Response (200):**

```json
{
  "success": true,
  "output": "=== Security Validation Report ===\n...\n=== Helm Repository Setup ===\n...",
  "securityReport": {
    /* security report object */
  }
}
```

#### POST /api/deploy-advanced

Deploy custom Kubernetes YAML using kubectl and Rancher credentials.

**Request:**

```json
{
  "workloads": [
    {
      "id": "uuid",
      "name": "my-app",
      "type": "Deployment",
      "containers": [
        {
          "name": "app",
          "image": "myrepo/app:v1.0.0",
          "ports": [{ "containerPort": 8080 }]
        }
      ]
    }
  ],
  "resources": [
    {
      "id": "uuid",
      "name": "my-service",
      "type": "Service",
      "spec": {
        "type": "ClusterIP",
        "ports": [{ "port": 80, "targetPort": 8080 }]
      }
    }
  ],
  "globalNamespace": "production",
  "globalDomain": "example.com",
  "generatedYaml": "user-edited yaml",
  "_fullYaml": "complete yaml for backend"
}
```

**Response (200):**

```json
{
  "success": true,
  "output": "=== Advanced Deployment Started ===\n...",
  "namespace": "production"
}
```

#### GET /api/deployments

List all deployments for authenticated user.

**Response (200):**

```json
[
  {
    "id": 1,
    "name": "deployment-1234567890",
    "namespace": "production",
    "type": "advanced",
    "status": "deployed",
    "environment": "production",
    "workloads_count": 1,
    "resources_count": 2,
    "createdAt": "2024-01-15T10:30:00Z"
  }
]
```

#### GET /api/deployments/{id}/yaml

Get saved YAML configuration for a deployment.

**Response (200):**

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: production
---
apiVersion: apps/v1
kind: Deployment
```

#### DELETE /api/deployments/{id}

Soft-delete a deployment (sets status to 'deleted').

**Response (200):**

```json
{
  "success": true,
  "message": "Deployment marked as deleted"
}
```

## Configuration

### Environment Variables

| Variable       | Required | Default                                | Description                          |
| -------------- | -------- | -------------------------------------- | ------------------------------------ |
| `DATABASE_URL` | Yes      | -                                      | PostgreSQL connection string         |
| `JWT_SECRET`   | Yes      | `your-secret-key-change-in-production` | Secret key for JWT signing           |
| `PING_MESSAGE` | No       | `ping`                                 | Response message for /api/ping       |
| `NODE_ENV`     | No       | `development`                          | Environment (development/production) |

### Example .env File

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/kubechart

# Authentication
JWT_SECRET=your-very-secure-secret-key-min-32-chars

# Development
PING_MESSAGE=pong

# Deployment
NODE_ENV=development
```

### Rancher Configuration (for Advanced Deployment)

Users need to configure their Rancher cluster credentials in the database:

```sql
UPDATE users
SET
  rancher_api_url = 'https://your-rancher-instance.com',
  rancher_api_token = 'token-xxxxxxxxxx',
  rancher_cluster_id = 'c-xxxxx'
WHERE id = 1;
```

> **Note:** A UI for configuring these credentials should be added to the application. Currently, they must be set via direct database access or an admin interface.

## Security

### Security Features

1. **Input Validation**
   - Repository URL format validation (HTTPS required)
   - Helm command validation (blocks dangerous shell metacharacters)
   - YAML structure validation

2. **Authentication & Authorization**
   - JWT-based authentication with 7-day expiry
   - Password hashing with bcryptjs
   - User resource isolation (deployments are user-scoped)

3. **Security Validation (Standard Deployment)**
   - Image source validation
   - Security context checks (runAsNonRoot, readOnlyRootFilesystem)
   - Resource limits validation
   - Health check configuration
   - Secret hardcoding detection

4. **YAML Security Defaults (Advanced Deployment)**
   - `runAsNonRoot: true` by default
   - Dropped dangerous capabilities
   - `allowPrivilegeEscalation: false`
   - Read-only root filesystem
   - Network policies applied

### Security Considerations

⚠️ **Important:** Before deploying to production:

1. **Change JWT Secret**
   - Set `JWT_SECRET` to a strong, unique value (minimum 32 characters)
   - Rotate regularly in production

2. **Secure Database**
   - Use encrypted connections (SSL/TLS) for PostgreSQL
   - Implement proper firewall rules
   - Regular backups

3. **Rancher Credentials**
   - Encrypt Rancher tokens at rest
   - Consider using a secrets manager (Vault, AWS Secrets Manager)
   - Limit token permissions to necessary namespaces

4. **Helm/kubectl Execution**
   - These tools execute with server permissions
   - Run in a hardened environment
   - Consider using a dedicated deployment runner (CI/CD pipeline)
   - Audit all deployment operations

5. **HTTPS**
   - Always use HTTPS in production
   - Implement proper SSL/TLS certificates

6. **Rate Limiting**
   - Implement rate limiting on API endpoints
   - Prevent brute force attacks on auth endpoints

### Deployment Best Practices

1. Never store secrets in environment variables or config files
2. Use Kubernetes Secrets or external secret managers
3. Regularly audit deployment logs
4. Keep Helm and kubectl updated
5. Validate all YAML before deployment
6. Implement network policies
7. Use RBAC for cluster access control

## Troubleshooting

### Common Issues

#### "Database connection failed"

**Problem:** `DATABASE_URL` not set or PostgreSQL unreachable

**Solution:**

```bash
# Check DATABASE_URL is set
echo $DATABASE_URL

# Test PostgreSQL connection
psql $DATABASE_URL -c "SELECT 1"

# Ensure PostgreSQL is running
docker ps | grep postgres
```

#### "Cannot find helm/kubectl"

**Problem:** Tools not in PATH when running deployments

**Solution:**

```bash
# Install Helm
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x kubectl
sudo mv kubectl /usr/local/bin/

# Verify
helm version
kubectl version --client
```

#### "JWT_SECRET not set" or Token verification fails

**Problem:** Missing or incorrect JWT secret

**Solution:**

```bash
# Generate secure secret
openssl rand -base64 32

# Set in environment
export JWT_SECRET=$(openssl rand -base64 32)

# Restart server
pnpm run dev
```

#### "Rancher credentials not configured"

**Problem:** Advanced deployment fails with credential error

**Solution:**

```bash
# Set Rancher credentials in database
psql $DATABASE_URL << EOF
UPDATE users
SET
  rancher_api_url = 'https://your-rancher-url',
  rancher_api_token = 'token-xxxxx',
  rancher_cluster_id = 'c-xxxxx'
WHERE username = 'your-username';
EOF
```

#### "Permission denied" when running kubectl

**Problem:** Server process lacks permissions for cluster access

**Solution:**

- Ensure kubeconfig is readable by the server process
- Check kubectl configuration: `kubectl config view`
- Verify Rancher token has necessary permissions

### Debug Mode

Enable detailed logging:

```bash
# Frontend
DEBUG=* pnpm run dev

# Backend (Node)
DEBUG=express:* NODE_ENV=development pnpm run dev
```

### Performance Optimization

1. **Database Indexing**
   - Ensure `idx_deployments_user_id` index exists
   - Add indexes for frequently queried columns

2. **Caching**
   - Implement caching for Helm repository data
   - Cache validation rules

3. **Resource Limits**
   - Set memory limits on containers
   - Implement request timeouts

## Development Guide

### Project Structure

```
.
├── client/                    # React frontend
│   ├── components/           # React components
│   │   ├── ui/              # Reusable UI components
│   │   ├── Layout.tsx        # App layout
│   │   ├── GlobalConfigurationForm.tsx
│   │   └── ...
│   ├── pages/               # Page components
│   │   ├── Index.tsx        # Home page
│   │   ├── Login.tsx        # Login page
│   │   ├── CreateChart.tsx  # Main builder
│   │   ├── Deployments.tsx  # Deployment history
│   │   └── ...
│   ├── lib/                 # Utility functions
│   │   ├── yaml-builder.ts
│   │   ├── template-generator.ts
│   │   └── utils.ts
│   ├── App.tsx              # App router
│   ├── main.tsx             # Entry point
│   └── global.css           # Global styles
│
├── server/                   # Node.js backend
│   ├── routes/              # API route handlers
│   │   ├── auth.ts
│   │   ├── deploy.ts
│   │   ├── advanced-deploy.ts
│   │   ├── deployments.ts
│   │   └── demo.ts
│   ├── auth.ts              # Authentication utilities
│   ├── db.ts                # Database connection
│   ├── security-validator.ts # Helm chart validation
│   ├── yaml-generator.ts    # YAML generation for backend
│   └── index.ts             # Express app setup
│
├── netlify/                 # Serverless deployment
│   └── functions/api.ts     # Netlify function wrapper
│
├── package.json             # Dependencies and scripts
├── vite.config.ts           # Frontend bundler config
├── tsconfig.json            # TypeScript config
└── netlify.toml             # Netlify configuration
```

### Adding New Features

1. **Add a new API endpoint:**
   - Create handler in `server/routes/`
   - Register in `server/index.ts`
   - Add TypeScript interfaces for request/response

2. **Add a new workload type:**
   - Create component in `client/components/`
   - Add YAML generator in `client/lib/yaml-builder.ts`
   - Wire into `CreateChart.tsx`

3. **Add a new validation rule:**
   - Add to `server/security-validator.ts`
   - Update tests in `client/lib/utils.spec.ts`

### Testing

```bash
# Run tests
pnpm run test

# Type checking
pnpm run typecheck

# Linting
pnpm run lint

# Build
pnpm run build
```

## Support & Contributions

- **Issues & Bug Reports:** GitHub Issues
- **Documentation:** See `/docs` directory
- **Contributing:** See CONTRIBUTING.md

## License

MIT License - See LICENSE file for details

## Additional Resources

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Helm Documentation](https://helm.sh/docs/)
- [Rancher Documentation](https://rancher.com/docs/)
- [React Documentation](https://react.dev/)
- [Express.js Guide](https://expressjs.com/)
