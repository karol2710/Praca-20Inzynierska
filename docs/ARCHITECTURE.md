# KubeChart Architecture

This document describes the system architecture, components, and data flow of KubeChart.

## System Overview

KubeChart is a web application designed to simplify Kubernetes deployment management. It provides a user-friendly interface for creating, managing, and monitoring Kubernetes resources.

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser / UI Layer                        │
├─────────────────────────────────────────────────────────────────┤
│                    React SPA (Vite + TypeScript)                 │
│  ┌──────────────┬──────────────┬──────────────┬──────────────┐  │
│  │   Pages      │  Components  │    Hooks     │    Utils     │  │
│  │              │              │              │              │  │
│  │ - Create     │ - Config     │ - useAuth    │ - YAML       │  │
│  │ - Deploy     │   Forms      │ - useMobile  │   Builder    │  │
│  │ - Manage     │ - Modals     │ - useToast   │ - Utils      │  │
│  └──────────────┴──────────────┴──────────────┴──────────────┘  │
└──────────────────────┬──────────────────────────────────────────┘
                       │ HTTP/REST API
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Express Server (API)                         │
├─────────────────────────────────────────────────────────────────┤
│         ┌──────────────────────────────────────────────────┐     │
│         │         Authentication & Authorization           │     │
│         │  (JWT tokens, user verification, middleware)    │     │
│         └───────────┬──────────────────────────────────────┘     │
│                     │                                             │
│  ┌──────────────────▼──────────────────┬───────────────────┐    │
│  │         API Routes / Handlers       │  Utilities        │    │
│  ├────────────────────────────────────┤                   │    │
│  │ POST   /api/deployments            │ - YAML Generator │    │
│  │ GET    /api/deployments            │ - Security Val   │    │
│  │ PUT    /api/deployments/:id        │ - DB Query       │    │
│  │ DELETE /api/deployments/:id        │ - K8s Client     │    │
│  │ GET    /api/deployments/:id/yaml   │ - Auth Handler   │    │
│  │ GET    /api/deployments/:id/res    │                  │    │
│  │ DELETE /api/deployments/:id/res    │                  │    │
│  │ POST   /api/auth/login             │                  │    │
│  │ POST   /api/auth/register          │                  │    │
│  └────────────────────────────────────┴───────────────────┘    │
└──────────┬──────────────────────────────────────────────┬────────┘
           │                                              │
           │ SQL                                          │ K8s API
           ▼                                              ▼
┌──────────────────────┐                    ┌──────────────────────┐
│   PostgreSQL DB      │                    │  Kubernetes Cluster  │
├──────────────────────┤                    ├──────────────────────┤
│ - Users              │                    │ - Deployments        │
│ - Deployments        │                    │ - Services           │
│ - Config             │                    │ - ConfigMaps         │
│ - YAML Configs       │                    │ - Secrets            │
└──────────────────────┘                    │ - RBAC Resources     │
                                            │ - Network Policies   │
                                            │ - Resource Quotas    │
                                            └──────────────────────┘
```

## Core Components

### Frontend (React SPA)

**Location**: `client/`

#### Key Directories

- `pages/` - Route components (Auth, Deployments, CreateChart, etc.)
- `components/` - Reusable UI components
- `components/ui/` - Pre-built UI component library
- `hooks/` - Custom React hooks
- `lib/` - Utilities (template generator, YAML builder)

#### Key Features

- **React Router 6** - Client-side routing
- **Vite** - Fast build tool and dev server
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **Lucide Icons** - Icon library

### Backend (Express Server)

**Location**: `server/`

#### Key Components

1. **Authentication (`auth.ts`)**
   - JWT token generation and verification
   - User registration and login
   - Password hashing and validation

2. **API Routes**
   - `routes/deployments.ts` - Deployment CRUD and resource management
   - `routes/advanced-deploy.ts` - Advanced deployment operations
   - `routes/auth.ts` - Authentication endpoints
   - `routes/deploy.ts` - Initial deployment handler

3. **Database (`db.ts`)**
   - PostgreSQL connection pool
   - Query execution and error handling
   - Connection management

4. **Kubernetes Integration**
   - K8s client library (@kubernetes/client-node)
   - Resource creation/deletion via REST API
   - YAML parsing and validation

5. **Utilities**
   - `security-validator.ts` - Input validation
   - `yaml-generator.ts` - YAML template generation
   - `node-build.ts` - Build orchestration

### Database Schema

**PostgreSQL**

```sql
-- Users Table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Deployments Table
CREATE TABLE deployments (
  id UUID PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  namespace VARCHAR(255) NOT NULL,
  yaml_config TEXT NOT NULL,
  deployment_config JSONB,
  status VARCHAR(50),
  environment VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  workloads_count INT DEFAULT 0,
  resources_count INT DEFAULT 0
);
```

### Kubernetes Integration

KubeChart interacts with Kubernetes through:

1. **In-Cluster Authentication** (when running in K8s)
   - Uses service account token at `/var/run/secrets/kubernetes.io/serviceaccount/token`
   - Loads cluster config automatically

2. **RBAC Integration**
   - ClusterRole with permissions for key resources
   - Service account binding for pod permissions
   - Namespace-scoped RBAC for user deployments

3. **API Interactions**
   - REST API calls to Kubernetes API server
   - YAML parsing and validation
   - Dynamic resource type handling

## Data Flow

### Deployment Creation Flow

```
User Input (UI)
    ↓
Validation (Client + Server)
    ↓
Template Generation (YAML Builder)
    ↓
YAML Rendering
    ↓
Database Storage
    ↓
Kubernetes API Submission
    ↓
Resource Creation in Cluster
    ↓
Status Update to Database
```

### Authentication Flow

```
User Credentials
    ↓
Login Request
    ↓
Password Verification
    ↓
JWT Token Generation
    ↓
Token Storage (localStorage)
    ↓
Authenticated Requests
    ↓
Token Verification (Middleware)
```

## Technology Stack

### Frontend

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Router 6** - Client routing
- **Tailwind CSS 3** - Styling
- **Lucide React** - Icons
- **js-yaml** - YAML parsing

### Backend

- **Node.js** - Runtime
- **Express** - Web framework
- **TypeScript** - Type safety
- **pg** - PostgreSQL driver
- **@kubernetes/client-node** - K8s client
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT tokens

### Infrastructure

- **PostgreSQL 12+** - Relational database
- **Kubernetes 1.24+** - Container orchestration
- **Docker** - Containerization
- **Envoy Gateway** - Traffic management

## Security Architecture

### Authentication & Authorization

1. **User Authentication**
   - Username/password registration
   - JWT token-based sessions
   - Token stored in localStorage (client-side)

2. **API Authorization**
   - JWT verification middleware
   - User ownership verification (user_id check)
   - Permission checking for sensitive operations

3. **Input Validation**
   - Client-side validation (Zod)
   - Server-side validation
   - YAML schema validation

### Kubernetes Security

1. **RBAC**
   - ClusterRole for KubeChart service account
   - Limited permissions (least privilege principle)
   - Namespace isolation for user deployments

2. **Network Security**
   - NetworkPolicy for pod isolation
   - Ingress/Egress control
   - Service-to-service communication policies

## Deployment Topology

### Local Development

```
Browser (localhost:8080)
    ↓
Vite Dev Server (with Express API)
    ↓
PostgreSQL (localhost:5432)
```

### Docker Deployment

```
Docker Network
├── KubeChart Container (port 8080)
├── PostgreSQL Container (port 5432)
└── Optional: Other services
```

### Kubernetes Deployment

```
Kubernetes Cluster
├── kubechart Namespace
│   ├── KubeChart Deployment (pod with container)
│   ├── Service (ClusterIP)
│   ├── ConfigMap (configuration)
│   ├── Secret (credentials)
│   └── RBAC (Role, RoleBinding, ClusterRole)
└── User Namespaces
    ├── User Deployments
    ├── User Services
    ├── User ConfigMaps
    └── User RBAC Resources
```

## Resource Management

### Resource Types Supported

**Workloads**

- Pod
- Deployment
- StatefulSet
- ReplicaSet
- Job
- CronJob
- DaemonSet

**Networking**

- Service (ClusterIP)
- HTTPRoute (Envoy Gateway)
- NetworkPolicy

**Configuration**

- ConfigMap
- Secret
- ResourceQuota
- LimitRange

**RBAC**

- Role
- RoleBinding
- ClusterRole
- ClusterRoleBinding

### Resource Limitations

- **Rate Limiting**: Via BackendTrafficPolicy
- **Resource Quotas**: CPU, Memory limits per namespace
- **Network Policies**: Traffic filtering
- **RBAC**: Permission-based access control

## Scalability Considerations

### Horizontal Scaling

1. **Frontend**: Static SPA can be served by any web server
2. **Backend**: Multiple Express instances with load balancer
3. **Database**: PostgreSQL replication or managed service

### Performance Optimization

- Caching strategies for deployment data
- Lazy loading of resources
- Efficient YAML parsing
- Database query optimization

## High Availability

For production deployments:

1. **Multiple Replicas**
   - Run multiple KubeChart pods
   - Use Deployment with replicas: 3+

2. **Database HA**
   - PostgreSQL with replication
   - Or managed database service (RDS, Cloud SQL)

3. **Load Balancing**
   - Kubernetes Service load balancing
   - Optional: Ingress/LoadBalancer

## Monitoring and Observability

### Logs

- Application logs via stdout/stderr
- Kubernetes logs via `kubectl logs`
- Structured logging for debugging

### Metrics

- Pod CPU and memory usage
- Request latency
- Error rates
- Database query performance

### Health Checks

- Liveness probes
- Readiness probes
- Startup probes (optional)

## Extension Points

KubeChart can be extended through:

1. **Custom API Routes** - Add new endpoints
2. **Custom Components** - Add new UI elements
3. **Custom Validators** - Extend input validation
4. **Custom Handlers** - Add new operation types

---

See [Development Guide](DEVELOPMENT.md) for information on extending KubeChart.
