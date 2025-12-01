# KubeChart - Architecture Documentation

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Component Architecture](#component-architecture)
3. [Data Architecture](#data-architecture)
4. [Security Architecture](#security-architecture)
5. [Deployment Architecture](#deployment-architecture)
6. [Development Architecture](#development-architecture)

## System Architecture

### Overall System Design

KubeChart is a three-tier web application:

```
┌─────────────────────────────────────────────────────────┐
│                  Presentation Layer                      │
│  React + TypeScript + Vite                               │
│  ├─ Pages (Index, Login, Signup, CreateChart, etc.)     │
│  ├─ Components (UI, Forms, Modals)                      │
│  ├─ Hooks (Custom React hooks)                          │
│  └─ Utilities (YAML builders, validators)               │
└─────────────────────────────────────┬───────────────────┘
                                      │
                         (HTTP/REST API)
                                      │
┌─────────────────────────────────────▼───────────────────┐
│                   Application Layer                      │
│  Express.js + TypeScript                                 │
│  ├─ Authentication (JWT)                                │
│  ├─ Route Handlers                                      │
│  │  ├─ /api/auth/* (Login, Signup)                      │
│  │  ├─ /api/deploy (Standard Helm deployment)           │
│  │  ├─ /api/deploy-advanced (kubectl deployment)        │
│  │  ├�� /api/check-security (Helm validation)            │
│  │  └─ /api/deployments/* (History management)          │
│  ├─ Business Logic (Validators, Generators)             │
│  └─ Error Handling & Middleware                         │
└─────────────────────────────────────┬───────────────────┘
                                      │
                     (SQL / TCP Connection)
                                      │
┌─────────────────────────────────────▼───────────────────┐
│                    Data Layer                            │
│  PostgreSQL                                              │
│  ├─ Users Table                                         │
│  ├─ Deployments Table                                   │
│  └─ Indexes & Relationships                             │
└─────────────────────────────────────────────────────────┘
```

### External Dependencies

```
┌─────────────────────────┐         ┌──────────────────┐
│    KubeChart Server     │         │  Kubernetes API  │
│  (Express + Node.js)    │         │   (kubectl)      │
└────────────┬────────────┘         └────────┬─────────┘
             │                               │
             └───────────┬───────────────────┘
                         │
            ┌────────────┼────────────┐
            │            │            │
            ▼            ▼            ▼
        kubectl      Helm CLI    kubeconfig
        (CLI)       (CLI)        (Credentials)
```

## Component Architecture

### Frontend Architecture

#### Page Components

1. **Index.tsx** - Landing page
   - Hero section
   - Feature highlights
   - Call-to-action buttons
   - No state management

2. **Login.tsx** - Authentication
   - Email/password form
   - Validation and error handling
   - JWT token storage
   - Redirect to dashboard on success

3. **Signup.tsx** - User registration
   - Form validation
   - Password strength checking
   - Email uniqueness validation
   - Account creation

4. **CreateChart.tsx** - Main deployment builder
   - Largest component in the application
   - State management for:
     - Workloads (Pod, Deployment, ReplicaSet, etc.)
     - Resources (Service, HTTPRoute, ConfigMap, etc.)
     - Global configuration (namespace, domain)
   - Two modes: Standard and Advanced
   - YAML generation and validation
   - Deployment submission

5. **Deployments.tsx** - Deployment history
   - Lists user's deployments
   - View deployment details
   - Download/copy YAML
   - Delete deployments

#### Component Tree (CreateChart.tsx)

```
CreateChart
├── GlobalConfigurationForm
│   ├── Namespace input
│   ├── Domain input
│   ├── Rate limiting configuration
│   └── Resource quota configuration
├── Standard Deployment Mode
│   ├── Repository input
│   ├── Helm install command textarea
│   └── Security validation display
├── Advanced Deployment Mode
│   ├── Workload Builder
│   │   ├── Workload selection
│   │   ├── Container configuration
│   │   ├── Resource configuration
│   │   └── Affinity configuration
│   ├── Resource Builder
│   │   ├── Service configuration
│   │   ├── HTTPRoute configuration
│   │   ├── ConfigMap/Secret configuration
│   │   └── Other resource types
│   ├── YAML Preview
│   │   └── Generated YAML display
│   └── Deployment confirmation
└── Deployment Results
    ├── Success output display
    ├── Error display
    └── Security report display
```

### Backend Architecture

#### Route Handler Organization

```
server/index.ts
├── Middleware
│   ├── CORS
│   ├── JSON parsing
│   ├── Security headers
│   └── Authentication
├── Routes
│   ├── /api/ping (demo)
│   ├── /api/demo (demo)
│   ├── /api/auth/* (routes/auth.ts)
│   ├── /api/deploy (routes/deploy.ts)
│   ├── /api/check-security (routes/deploy.ts)
│   ├── /api/deploy-advanced (routes/advanced-deploy.ts)
│   └── /api/deployments/* (routes/deployments.ts)
└── Database
    └── Initialized on startup
```

#### Authentication Flow

```
User Input (username/password)
    │
    ▼
POST /api/auth/login
    │
    ├─ Validate input format
    ├─ Query users table
    ├─ Compare password hash (bcryptjs)
    └─ Generate JWT token (7-day expiry)
    │
    ▼
Return token + user data
    │
    ▼
Client stores token in localStorage
    │
    ▼
Subsequent requests include: Authorization: Bearer <token>
    │
    ▼
authMiddleware verifies token
    ├─ Extract token from header
    ├─ Verify signature with JWT_SECRET
    ├─ Attach decoded user to req.user
    └─ Proceed if valid, return 401 if invalid
```

#### Standard Deployment Flow

```
User submits form
    │
    ├─ Repository: "stable https://charts.helm.sh/stable"
    ├─ Helm Install: "helm upgrade --install my-release stable/nginx"
    └─ POST /api/check-security
    │
    ▼
Security Validation
    ├─ validateRepository()
    │   └─ Verify format: "name https://url"
    ├─ validateInput()
    │   └─ Block dangerous characters
    ├─ parseHelmValues()
    │   └─ Extract --set arguments
    └─ validateHelmChart()
        ├─ Image security
        ├─ Security context
        ├─ Resource limits
        ├─ Health checks
        ├─ Secret detection
        └─ Return report
    │
    ▼
User reviews report
    │
    ├─ If errors: block deployment
    ├─ If warnings: show confirmation
    └─ If clean: proceed
    │
    ▼
POST /api/deploy
    │
    ├─ Add helm repository
    │   └─ helm repo add stable https://charts.helm.sh/stable
    ├─ Update repositories
    │   └─ helm repo update
    ├─ Install/upgrade chart
    │   └─ helm upgrade --install my-release stable/nginx
    └─ Capture output
    │
    ▼
Return deployment output
    │
    ▼
Client displays results
```

#### Advanced Deployment Flow

```
User builds configuration
    │
    ├─ Creates workloads
    │   └─ Deployment (nginx, 3 replicas)
    │       └─ Container: image, ports, env vars
    ├─ Creates resources
    │   ├─ Service (expose deployment)
    │   └─ HTTPRoute (ingress)
    ├─ Configures global settings
    │   ├─ Namespace: production
    │   ├─ Domain: example.com
    │   └─ Resource quotas
    └─ Reviews YAML
    │
    ▼
Client generates YAML
    │
    ├─ template-generator.ts
    │   ├─ generateNamespace()
    │   ├─ generateClusterIPService()
    │   ├─ generateHTTPRoute()
    │   ├─ generateRateLimit()
    │   ├─ generateResourceQuota()
    │   ├─ generateNetworkPolicy()
    │   ├─ generateRBAC()
    │   └─ generateCertificate()
    │
    ├─ yaml-builder.ts
    │   ├─ generateDeploymentYAML()
    │   ├─ generateServiceYAML()
    │   └─ ... (for all resource types)
    │
    └─ combineAllYamlDocuments()
        └─ Returns complete YAML with separators
    │
    ▼
User edits YAML (optional)
    │
    ▼
POST /api/deploy-advanced
    │
    ├─ Request body includes:
    │   ├─ workloads array
    │   ├─ resources array
    │   ├─ globalNamespace
    │   ├─ generatedYaml (user-edited)
    │   └─ _fullYaml (complete for backend)
    │
    ▼
Server validation
    │
    ├─ Authenticate user
    ├─ Verify user has Rancher credentials
    │   └─ Query: rancher_api_url, rancher_api_token, rancher_cluster_id
    └─ Validate YAML structure
    │
    ▼
Write YAML files
    │
    ├─ Create temp directory: /tmp/deployment-<namespace>-<timestamp>
    ├─ Split YAML by "---" separator
    ├─ Write each document: <number>-<kind>-<name>.yaml
    └─ Log file creation
    │
    ▼
Generate kubeconfig
    │
    ├─ Create config object
    │   ├─ API server: rancher_api_url
    │   ├─ Token: rancher_api_token
    │   ├─ Cluster: rancher_cluster_id
    │   └─ Context: rancher-context
    ├─ Write to temp file: /tmp/kubeconfig-<timestamp>
    └─ Prepare kubectl command
    │
    ▼
Apply to cluster
    │
    ├─ Execute: KUBECONFIG=<kubeconfig> kubectl apply -f <deploymentDir>
    ├─ Capture stdout/stderr
    └─ Clean up temp files
    │
    ▼
Save deployment record
    │
    ├─ INSERT deployments (
    │   user_id, name, type, namespace, 
    │   yaml_config, status, ...
    │ )
    ├─ Status: 'deployed' or 'pending'
    └─ Store full YAML for future reference
    │
    ▼
Return deployment status
    │
    └─ Client displays output and status
```

## Data Architecture

### Database Schema

#### Users Table

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  
  -- Rancher integration
  rancher_api_url VARCHAR(500),
  rancher_api_token VARCHAR(500),
  rancher_cluster_id VARCHAR(255),
  
  -- Utilities
  namespace_counter INT DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Purpose:** Stores user authentication and Kubernetes cluster credentials.

#### Deployments Table

```sql
CREATE TABLE deployments (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Metadata
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,  -- 'standard' or 'advanced'
  namespace VARCHAR(255) NOT NULL,
  
  -- Content
  yaml_config TEXT NOT NULL,  -- Full YAML for persistence
  
  -- Status tracking
  status VARCHAR(50) DEFAULT 'pending',
  environment VARCHAR(50) DEFAULT 'production',
  
  -- Statistics
  workloads_count INT DEFAULT 0,
  resources_count INT DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Index
  INDEX idx_deployments_user_id (user_id)
);
```

**Purpose:** Persists deployment records for audit trail and management.

### State Management - Frontend

#### React Component State (CreateChart.tsx)

```typescript
// Workloads management
const [workloads, setWorkloads] = useState<Workload[]>([]);
const [activeWorkloadId, setActiveWorkloadId] = useState<string>("");

// Resources management
const [resources, setResources] = useState<Resource[]>([]);
const [activeResourceId, setActiveResourceId] = useState<string>("");

// Global configuration
const [globalNamespace, setGlobalNamespace] = useState("default");
const [globalDomain, setGlobalDomain] = useState("");
const [requestsPerSecond, setRequestsPerSecond] = useState("");
const [resourceQuota, setResourceQuota] = useState({});

// Standard deployment
const [repository, setRepository] = useState("");
const [helmInstall, setHelmInstall] = useState("");

// Deployment state
const [mode, setMode] = useState<"standard" | "advanced">("standard");
const [isCreating, setIsCreating] = useState(false);
const [deploymentResult, setDeploymentResult] = useState("");
const [deploymentError, setDeploymentError] = useState("");

// Security validation
const [securityReport, setSecurityReport] = useState<any>(null);
const [showSecurityWarning, setShowSecurityWarning] = useState(false);
```

### Client-Side Data Models

#### Workload Interface

```typescript
interface Workload {
  id: string;
  name: string;
  type: "Pod" | "Deployment" | "ReplicaSet" | "StatefulSet" | "Job" | "CronJob";
  containers?: WorkloadContainer[];
  replicas?: number;
  scheduling?: SchedulingConfig;
  affinity?: AffinityConfig;
  // ... other pod spec fields
}

interface WorkloadContainer {
  id: string;
  name: string;
  image: string;
  ports?: ContainerPort[];
  env?: EnvironmentVariable[];
  resources?: ResourceRequirements;
  volumeMounts?: VolumeMount[];
  // ... other container spec fields
}
```

#### Resource Interface

```typescript
interface Resource {
  id: string;
  name: string;
  type: "Service" | "HTTPRoute" | "GRPCRoute" | "ConfigMap" | "Secret" | "etc";
  metadata?: Record<string, any>;
  spec?: Record<string, any>;
}
```

## Security Architecture

### Authentication & Authorization

#### JWT Token Structure

```typescript
// Payload
{
  userId: number,
  username: string,
  iat: number,  // issued at
  exp: number   // expires at
}

// Signing
const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

// Verification
const decoded = jwt.verify(token, process.env.JWT_SECRET);
```

#### Authorization Model

```
┌─────────────────────────────────────┐
│  Request with JWT Token             │
└────────────────┬────────────────────┘
                 │
                 ▼
        ┌────────────────────┐
        │ authMiddleware     │
        ├────────────────────┤
        │ 1. Extract header  │
        │ 2. Verify sig      │
        │ 3. Decode payload  │
        │ 4. Attach to req   │
        └─────────┬──────────┘
                  │
        ┌─────────▼──────────┐
        │ Route Handler      │
        ├────────────────────┤
        │ 1. Check auth      │
        │ 2. Verify resource │
        │    ownership       │
        │ 3. Process request │
        └────────────────────┘
```

#### Deployment Resource Ownership

```sql
-- Only user can access their deployments
SELECT * FROM deployments 
WHERE user_id = $1 
  AND id = $2;

-- Cascade delete on user deletion
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
```

### Input Validation

#### Repository Input

```typescript
function validateRepository(input: string): { valid: boolean; error?: string; } {
  // Format check: "name https://url"
  const match = input.match(/^([a-zA-Z0-9-_]+)\s+(https:\/\/[^\s]+)$/);
  if (!match) {
    return { valid: false, error: "Format: 'name https://url'" };
  }
  
  // Name validation: alphanumeric, hyphen, underscore
  const [, name] = match;
  if (!/^[a-zA-Z0-9-_]+$/.test(name)) {
    return { valid: false, error: "Invalid repository name" };
  }
  
  // URL must use HTTPS
  if (!input.includes("https://")) {
    return { valid: false, error: "URL must use HTTPS" };
  }
  
  return { valid: true };
}
```

#### Helm Command Input

```typescript
function validateInput(input: string, maxLength: number): { valid: boolean; error?: string } {
  // Check length
  if (input.length > maxLength) {
    return { valid: false, error: "Input too long" };
  }
  
  // Block dangerous patterns
  const dangerousPatterns = [
    "&", "|", ";", "$", "`", "\n", "\r",
    "$(", "$()", ">", "<", "rm ", "kill "
  ];
  
  for (const pattern of dangerousPatterns) {
    if (input.includes(pattern)) {
      return { valid: false, error: "Invalid characters detected" };
    }
  }
  
  return { valid: true };
}
```

### Security Validation (Helm Charts)

#### Validation Rules

```typescript
validateHelmChart(chartPath: string, helmValues: Record<string, any>): SecurityReport {
  // 1. Image Security
  // - Check if image.tag is 'latest'
  // - Verify registry is trusted
  
  // 2. Security Context
  // - Validate runAsNonRoot: true
  // - Check readOnlyRootFilesystem
  // - Verify allowPrivilegeEscalation: false
  
  // 3. Resource Limits
  // - Require CPU limits
  // - Require memory limits
  // - Check requests are reasonable
  
  // 4. Health Checks
  // - Validate liveness probe
  // - Validate readiness probe
  
  // 5. Secret Detection
  // - Scan for hardcoded passwords
  // - Check for API keys in env vars
  
  // 6. High Availability
  // - Check replica count >= 2
  // - Verify pod disruption budget
  
  // 7. Image Pull Secrets
  // - For private registries, verify secrets
  
  // 8. Service Configuration
  // - Validate service type
  // - Check port configuration
}
```

## Deployment Architecture

### Standard Deployment (Helm-based)

```
┌──────────────────────────────────────────┐
│ Client Browser                           │
│ ├─ User fills form                       │
│ ├─ Local validation                      │
│ └─ Submit to server                      │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│ Server: /api/check-security              │
│ ├─ Parse helm values                     │
│ ├─ Run security checks                   │
│ └─ Return report                         │
└──────────────┬───────────────────��───────┘
               │
               ▼
┌──────────────────────────────────────────┐
│ Client: Review Report                    │
│ ├─ Show errors (blocks deployment)       │
│ ├─ Show warnings (requires confirmation) │
│ └─ Proceed if user confirms              │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│ Server: /api/deploy                      │
│ ├─ Validate inputs again                 │
│ ├─ Execute: helm repo add                │
│ ├─ Execute: helm repo update             │
│ ├─ Execute: helm upgrade --install       │
│ ├─ Capture output                        │
│ └─ Clean up repo                         │
└──────────────┬───────────────────────────┘
               │
               ▼
┌────────────────────────��─────────────────┐
│ Client: Display Results                  │
│ ├─ Show deployment output                │
│ ├─ Show any errors                       │
│ └─ Offer next actions                    │
└──────────────────────────────────────────┘
```

### Advanced Deployment (kubectl-based)

```
┌──────────────────────────────────────────┐
│ Client: Build Configuration              │
│ ├─ Create workloads                      │
│ ├─ Create resources                      │
│ ├─ Configure global settings             │
│ └─ Review generated YAML                 │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│ Server: /api/deploy-advanced             │
│ ├─ Authenticate user                     │
│ ├─ Fetch Rancher credentials from DB     │
│ ├─ Validate YAML structure               │
│ ├─ Write YAML files to /tmp              │
│ ├─ Generate kubeconfig                   │
│ ├─ Execute: kubectl apply -f             │
│ ├─ Save deployment record                │
│ └─ Clean up temp files                   │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│ Kubernetes Cluster                       │
│ ├─ Create namespace                      │
│ ├─ Deploy workloads                      │
│ ├─ Create services/routes                │
│ ├─ Apply policies/RBAC                   │
│ └─ Start monitoring                      │
└──────────────────────────────────────────┘
```

### Kubernetes Resources Generated

#### Standard Deployment

For Helm-based deployments, the chart itself defines all resources. The server only:
1. Validates the helm command
2. Adds the repository
3. Installs the release

#### Advanced Deployment

The system generates multiple Kubernetes manifests:

```
1. Namespace
   └─ Isolate workloads in separate namespace

2. ServiceAccount + RBAC
   ├─ ServiceAccount
   ├─ Role
   └─ RoleBinding

3. Workloads (one or more)
   ├─ Deployment/StatefulSet/etc
   ├─ Containers with security context
   ├─ Resource requests/limits
   └─ Health checks

4. Services
   ├─ ClusterIP services for internal communication
   └─ Configured based on workload ports

5. Ingress/Routes
   ├─ HTTPRoute (Kubernetes Gateway API)
   ├─ Hostnames from global domain
   └─ Backend references to services

6. ConfigMaps/Secrets
   └─ Application configuration

7. Network Policies
   ├─ Pod-to-pod isolation
   ├─ Ingress rules
   └─ Egress rules

8. RBAC (Role-Based Access Control)
   ├─ Default service account
   ├─ Minimal required permissions
   └─ Pod log/exec access

9. Resource Quota
   ├─ CPU limits
   ├─ Memory limits
   └─ Storage limits

10. Certificates (optional)
    ├─ Let's Encrypt integration
    ├─ TLS certificates
    └─ Secret storage
```

## Development Architecture

### Build & Development Setup

#### Development Workflow

```
┌─────────────────────────────────┐
│ pnpm install                    │
│ Install dependencies            │
└────────────┬────────────────────┘
             │
┌────────────▼────────────────────┐
│ pnpm run dev                    │
│ ├─ Vite (frontend dev server)   │
│ ├─ Express (backend server)     │
│ └─ HMR enabled for fast refresh │
└────────────┬────────────────────┘
             │
┌────────────▼────────────────────┐
│ http://localhost:5173           │
│ Frontend dev server             │
└────────────┬────────────────────┘
             │
┌────────────▼────────────────────┐
│ /api/* proxied to localhost:3000│
│ Backend server                  │
└─────────────────────────────────┘
```

#### Build Process

```
┌──────────────���───────────────────┐
│ pnpm run build                   │
└────────────┬─────────────────────┘
             │
      ┌──────┴──────┐
      │             │
      ▼             ▼
┌──────────┐   ┌──────────────┐
│Vite Build│   │TSC Typecheck │
│Frontend  │   │Backend       │
└────┬─────┘   └──────┬───────┘
     │                │
     │         ┌──────▼────────┐
     │         │esbuild        │
     │         │Bundle backend │
     │         └──────┬────────┘
     │                │
     └────────┬───────┘
              │
      ┌───────▼────────┐
      │ dist/          │
      ├─ spa/         │ (Frontend)
      ├─ server/      │ (Backend)
      └─ node_build.mjs
```

### Project Organization

#### Frontend Structure

```
client/
├── pages/              # Route-level components
│   ├── Index.tsx
│   ├── Login.tsx
│   ├── Signup.tsx
│   ├── CreateChart.tsx
│   ├── Deployments.tsx
│   ├── Auth.tsx
│   └── NotFound.tsx
│
├── components/         # Reusable UI components
│   ├── ui/             # Primitive components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── textarea.tsx
│   │   ├── dialog.tsx
│   │   ├── toast.tsx
│   │   └── ...
│   ├── Layout.tsx
│   ├── GlobalConfigurationForm.tsx
│   ├── DeploymentConfirmModal.tsx
│   ├── PodConfiguration.tsx
│   ├── ContainerConfiguration.tsx
│   ├── DeploymentConfiguration.tsx
│   └── ... (many more)
│
├── hooks/              # Custom React hooks
│   └── use-mobile.tsx
│
├── lib/                # Utility functions
│   ├── yaml-builder.ts
│   ├── template-generator.ts
│   ├── utils.ts
│   └── utils.spec.ts
│
├── App.tsx             # Router setup
├── main.tsx            # React entry point
└── global.css          # Global styles
```

#### Backend Structure

```
server/
├── routes/             # API route handlers
│   ├── auth.ts        # Authentication endpoints
│   ├── deploy.ts      # Standard deployment
│   ├── advanced-deploy.ts
│   ├── deployments.ts # History management
│   └── demo.ts
│
├── auth.ts            # Auth utilities
├── db.ts              # Database setup
├── security-validator.ts  # Helm validation
├── yaml-generator.ts  # Server-side YAML gen
└── index.ts           # Express app setup
```

### Code Patterns

#### Component Pattern (Frontend)

```typescript
// Props interface
interface ComponentProps {
  config: WorkloadConfig;
  onConfigChange: (field: string, value: any) => void;
}

// Component
export default function Component({ config, onConfigChange }: ComponentProps) {
  // State
  const [expanded, setExpanded] = useState(false);
  
  // Handlers
  const handleChange = (field: string, value: any) => {
    onConfigChange(field, value);
  };
  
  // Render
  return (
    <div className="space-y-4">
      {/* Form fields */}
    </div>
  );
}
```

#### Route Handler Pattern (Backend)

```typescript
// Type definitions
interface RequestPayload {
  field1: string;
  field2: number;
}

interface ResponsePayload {
  success: boolean;
  data?: any;
  error?: string;
}

// Handler
export const handleEndpoint: RequestHandler = async (req, res) => {
  const user = (req as any).user;
  const { field1, field2 } = req.body as RequestPayload;
  
  // Validation
  if (!field1) {
    return res.status(400).json({
      success: false,
      error: "field1 is required"
    });
  }
  
  try {
    // Business logic
    const result = await someOperation();
    
    // Success response
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    // Error response
    res.status(500).json({
      success: false,
      error: "Operation failed"
    });
  }
};
```

## Scalability & Performance

### Database Optimization

1. **Indexing**
   - Primary key on `id`
   - Foreign key on `user_id`
   - Index on `deployments.user_id` for fast user queries

2. **Connection Pooling**
   - PostgreSQL connection pool with pg library
   - Pool size: 10-20 connections

3. **Query Optimization**
   - Use indexed columns in WHERE clauses
   - Pagination for large result sets
   - Avoid N+1 queries

### Frontend Optimization

1. **Code Splitting**
   - Vite handles automatic code splitting
   - Route-based splitting with React.lazy

2. **Component Memoization**
   - useMemo for expensive computations
   - React.memo for static components

3. **Asset Optimization**
   - Tree-shaking of unused code
   - CSS optimization with Tailwind

### API Rate Limiting

Currently not implemented. For production:
- Implement rate limiting middleware (express-rate-limit)
- Per-user rate limits (deployments per hour)
- Per-IP rate limits (auth attempts)

## Monitoring & Logging

### Current Logging

- Console.error() for runtime errors
- Standard error output from helm/kubectl commands

### Recommended Logging

1. **Structured Logging**
   - Winston or Bunyan for structured logs
   - Include request IDs for tracing

2. **Metrics**
   - Prometheus metrics for:
     - Deployment success/failure rates
     - API response times
     - Database query times

3. **Monitoring**
   - ELK stack (Elasticsearch, Logstash, Kibana)
   - Or: Datadog, New Relic, etc.

## Disaster Recovery

### Backup Strategy

1. **Database Backups**
   - Daily automated PostgreSQL backups
   - Retain 30 days of backups
   - Test restore procedures regularly

2. **YAML Preservation**
   - All deployment YAML stored in database
   - Can redeploy from stored YAML

3. **Deployment History**
   - Full audit trail of all deployments
   - Status tracking (deployed/pending/deleted)

### Recovery Procedures

1. **Database Corruption**
   - Restore from latest backup
   - Verify data integrity

2. **Lost Deployments**
   - Use stored YAML from deployments table
   - Redeploy to cluster

3. **Rancher Credentials Compromise**
   - Rotate tokens in Rancher
   - Update in users table
   - No re-deployment needed for existing resources
