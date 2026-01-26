# Project Structure

Overview of the KubeChart project directory structure and important files.

## Directory Layout

```
kubechart/
├── client/                    # Frontend React application
│   ├── pages/                 # Route pages (components for each page)
│   │   ├── Index.tsx          # Home page
│   │   ├── Login.tsx          # Login page
│   │   ├── Auth.tsx           # Authentication page
│   │   ├── Account.tsx        # Account management
│   │   ├── CreateChart.tsx    # Create deployment form
│   │   ├── Deployments.tsx    # List deployments
│   │   ├── EditDeployment.tsx # Edit deployment
│   │   ├── NotFound.tsx       # 404 page
│   │   └── ...
│   │
│   ├── components/            # Reusable React components
│   │   ├── ui/                # Pre-built UI library
│   │   │   ├── toaster.tsx
│   │   │   └── ...
│   │   ├── Layout.tsx         # Main layout component
│   │   ├── GlobalConfigurationForm.tsx
│   │   ├── DeploymentConfiguration.tsx
│   │   ├── ContainerConfiguration.tsx
│   │   ├── DeploymentConfirmModal.tsx
│   │   ├── AffinityConfiguration.tsx
│   │   └── ...
│   │
│   ├── hooks/                 # Custom React hooks
│   │   ├── use-auth.tsx       # Authentication hook
│   │   ├── use-mobile.tsx     # Mobile detection
│   │   └── use-toast.ts       # Toast notifications
│   │
│   ├── lib/                   # Utility libraries
│   │   ├── template-generator.ts  # YAML template generation
│   │   ├── yaml-builder.ts        # YAML building utilities
│   │   ├── utils.ts               # Helper functions
│   │   ├── debug-deployment.ts    # Debugging utilities
│   │   └── utils.spec.ts          # Unit tests
│   │
│   ├── App.tsx                # Main app component and routes
│   ├── main.tsx               # React entry point
│   ├── vite-env.d.ts          # Vite environment types
│   ├── global.css             # Global styles and theme
│   └── index.html             # HTML template
│
├── server/                    # Backend Express server
│   ├── routes/                # API route handlers
│   │   ├── deployments.ts     # Deployment API endpoints
│   │   ├── advanced-deploy.ts # Advanced deployment logic
│   │   ├── auth.ts            # Authentication endpoints
│   │   ├── deploy.ts          # Deploy handler
│   │   └── demo.ts            # Demo endpoint
│   │
│   ├── index.ts               # Express server setup
│   ├── db.ts                  # Database connection
│   ├── auth.ts                # Authentication utilities
│   ├── security-validator.ts  # Input validation
│   ├── yaml-generator.ts      # YAML generation
│   └── node-build.ts          # Build utilities
│
├── shared/                    # Shared types and interfaces
│   └── api.ts                 # Shared API types
│
├── kubernetes/                # Kubernetes manifests
│   ├── deployment.yaml        # KubeChart deployment
│   ├── service.yaml           # KubeChart service
│   ├── ingress.yaml           # Ingress configuration
│   ├── gateway.yaml           # Envoy Gateway config
│   ├── httproute.yaml         # HTTPRoute examples
│   ├── configmap.yaml         # ConfigMap examples
│   ├── hpa.yaml               # Horizontal Pod Autoscaler
│   ├── kustomization.yaml     # Kustomize config
│   └── ...
│
├── YAML samples/              # YAML example templates
│   ├── System/                # System-level configs
│   │   ├── BackupSys.sh
│   │   ├── cert-issuer-*.yaml
│   │   ├── DataBase.sh
│   │   ├── gateway.yaml
│   │   └── ...
│   │
│   ├── Templates/             # Deployment templates
│   │   ├── For Deploy Standard/
│   │   │   ├── client-app.yaml
│   │   │   ├── client-httproute.yaml
│   │   │   ├── client-ratelimit.yaml
│   │   │   └── ...
│   │   ├── Resources/
│   │   │   ├── ConfigMap.yaml
│   │   │   ├── Secret.yaml
│   │   │   └── ...
│   │   ├── Deployment.yaml
│   │   ├── CronJob.yaml
│   │   └── ...
│   │
│   └── ...
│
├── docs/                      # Documentation
│   ├── README.md              # Documentation index
│   ├── GETTING_STARTED.md     # Quick start guide
│   ├── INSTALLATION.md        # Installation guide
│   ├── ARCHITECTURE.md        # System architecture
│   ├── FEATURES.md            # Feature overview
│   ├── DEPLOYMENT.md          # Deployment guide
│   ├── KUBERNETES.md          # Kubernetes integration
│   ├── RBAC.md                # RBAC configuration
│   ├── RESOURCES.md           # Resource management
│   ├── API.md                 # API reference
│   ├── PROJECT_STRUCTURE.md   # This file
│   ├── DEVELOPMENT.md         # Development guide
│   ├── DOCKER.md              # Docker guide
│   ├── TROUBLESHOOTING.md     # Troubleshooting
│   └── ...
│
├── public/                    # Static assets
│   ├── placeholder.svg        # Placeholder image
│   └── robots.txt             # Robot exclusion
│
├── .dockerignore              # Docker ignore patterns
├── .gitignore                 # Git ignore patterns
├── Dockerfile                 # Docker image definition
├── docker-compose.yml         # Docker Compose setup
├── docker-build.sh            # Docker build script
├── docker-build2.sh           # Alternative build script
├── k8s-deploy.sh              # Kubernetes deployment script
├── k8s-deploy2.sh             # Alternative K8s script
├── deploy.sh                  # Generic deployment script
├── deploy-with-gateway.sh     # Gateway deployment script
├── x1.sh                      # Utility script
│
├── tsconfig.json              # TypeScript configuration
├── vite.config.ts             # Vite configuration
├── vite.config.server.ts      # Vite server configuration
├── tailwind.config.ts         # Tailwind CSS configuration
├── postcss.config.js          # PostCSS configuration
├── components.json            # Shadcn/ui components config
│
├── package.json               # Project dependencies
├── pnpm-lock.yaml             # pnpm lock file
│
├── README.md                  # Project README
├── LICENCE                    # License file
│
└── ...

```

## Key Files

### Configuration Files

| File                 | Purpose                                |
| -------------------- | -------------------------------------- |
| `.env`               | Environment variables (create locally) |
| `tsconfig.json`      | TypeScript settings                    |
| `vite.config.ts`     | Frontend build configuration           |
| `tailwind.config.ts` | Tailwind CSS theme                     |
| `package.json`       | Project dependencies                   |

### Frontend Entry Points

| File              | Purpose                       |
| ----------------- | ----------------------------- |
| `client/main.tsx` | React app entry point         |
| `client/App.tsx`  | Main app component and routes |
| `index.html`      | HTML template                 |

### Backend Entry Points

| File              | Purpose              |
| ----------------- | -------------------- |
| `server/index.ts` | Express server setup |
| `server/db.ts`    | Database connection  |

### Important Utilities

| File                               | Purpose                          |
| ---------------------------------- | -------------------------------- |
| `client/lib/template-generator.ts` | Generates YAML from form input   |
| `client/lib/yaml-builder.ts`       | Builds Kubernetes YAML documents |
| `server/security-validator.ts`     | Validates user inputs            |
| `shared/api.ts`                    | Shared TypeScript interfaces     |

## File Naming Conventions

### React Components

```
// Single file for small components
MyComponent.tsx

// Directory for complex components with related files
MyComplexComponent/
├── MyComplexComponent.tsx
├── MyComplexComponent.module.css
├── useMyHook.ts
└── utils.ts
```

### TypeScript Files

```
// Utilities and helpers
my-util.ts
my-utility.ts

// Hooks
use-my-hook.ts
use-feature.ts

// Type definitions
types.ts
interfaces.ts
```

### YAML Files

```
# Kubernetes manifests
deployment.yaml
service.yaml
ingress.yaml

# Examples
example-deployment.yaml
sample-config.yaml
```

## Important Directories

### `client/pages/`

Contains page components that map to routes:

- Each file represents a route
- `Index.tsx` = home page (`/`)
- `Login.tsx` = login page (`/login`)
- `CreateChart.tsx` = create deployment (`/create-chart`)

### `client/components/`

Reusable components:

- `ui/` - Basic UI components (buttons, modals, forms)
- Other files - Feature-specific components

### `server/routes/`

API endpoint handlers:

- Each file handles related endpoints
- Implements request/response logic
- Handles database operations

### `kubernetes/`

Kubernetes manifests for KubeChart itself:

- `deployment.yaml` - KubeChart deployment
- `service.yaml` - KubeChart service
- Example configurations

## Dependency Tree

```
App
├── Pages (client/pages/)
│   ├── Deployments.tsx
│   ├── CreateChart.tsx
│   ├── EditDeployment.tsx
│   └── ...
├── Components (client/components/)
│   ├── UI Components (client/components/ui/)
│   ├── Configuration Forms
│   ├── Modals
│   └── Layout
├── Hooks (client/hooks/)
│   ├── useAuth
│   ├── useMobile
│   └── useToast
└── Utilities (client/lib/)
    ├── template-generator.ts
    ├── yaml-builder.ts
    └── utils.ts

Express Server (server/index.ts)
├── Routes (server/routes/)
│   ├── deployments.ts
│   ├── auth.ts
│   └── ...
├── Database (server/db.ts)
├── Auth (server/auth.ts)
└── Utilities (server/*.ts)
```

## Environment Variables

Create `.env` file in root:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/kubechart

# Server
NODE_ENV=development
PORT=8080

# Security
API_SECRET=your-secret-key

# Kubernetes (optional)
KUBECONFIG=/path/to/kubeconfig
```

## Build Output

### Development

```
Dev server runs on port 8080
No build artifacts created
Assets served from memory
```

### Production Build

```
dist/
├── index.html              # Main HTML file
├── assets/
│   ├── index-*.js          # Bundled JavaScript
│   ├── index-*.css         # Bundled CSS
│   └── ...                 # Other assets
└── server/                 # Backend server code
```

## Development Workflow

1. **Make changes** to `client/` or `server/` files
2. **HMR reloads** frontend automatically
3. **Server reloads** automatically on save
4. **Test** in browser at `http://localhost:8080`

## Production Workflow

1. **Build** with `pnpm build`
2. **Create Docker image** with `docker build .`
3. **Deploy to Kubernetes** with `./k8s-deploy2.sh`
4. **Verify** with `kubectl get pods -n kubechart`

## Code Organization Principles

1. **Co-locate related code** - Keep components with their utilities
2. **Shared utilities** in `lib/` - DRY principle
3. **Type safety** - Use TypeScript throughout
4. **Clear naming** - Descriptive file and variable names
5. **Modularity** - Small, focused components

## Related Documentation

- [Architecture](ARCHITECTURE.md)
- [Development Guide](DEVELOPMENT.md)
- [Getting Started](GETTING_STARTED.md)

---

For detailed information on any component or module, check the respective documentation.
