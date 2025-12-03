# KubeChart - Technology Dependency Graph

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    KubeChart Application                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴────────┐
                    │                  │
            ┌───────▼────────┐  ┌─────▼──────────┐
            │    Frontend     │  │    Backend     │
            │    (React SPA)  │  │  (Express API) │
            └────────────────┘  └────────────────┘
                    │                  │
                    │                  │
         ┌──────────┴──────────┐       │
         │                     │       │
         ▼                     ▼       ▼
    ┌─────────┐       ┌─────────────────────┐
    │ Browser │◄──────│  PostgreSQL (Port   │
    │ (Client)│  API  │  5432)              │
    └─────────┘       └─────────────────────┘
```

---

## Frontend Dependency Tree

```
React 18.3.1 (Core)
├─ React DOM 18.3.1 (Browser rendering)
├─ React Router DOM 6.30.1 (Navigation)
│  └─ Used for: Multi-page routing
│
├─ UI Components (Radix UI) - 25+ Primitives
│  ├─ @radix-ui/react-dialog (Modal windows)
│  ├─ @radix-ui/react-select (Dropdowns)
│  ├─ @radix-ui/react-tabs (Tabbed content)
│  ├─ @radix-ui/react-accordion (Collapsible)
│  ├─ @radix-ui/react-alert-dialog (Alerts)
│  ├─ @radix-ui/react-popover (Tooltips)
│  ├─ @radix-ui/react-checkbox (Forms)
│  ├─ @radix-ui/react-radio-group (Forms)
│  ├─ @radix-ui/react-slider (Range input)
│  ├─ @radix-ui/react-switch (Toggle)
│  ├─ @radix-ui/react-dropdown-menu (Menus)
│  ├─ @radix-ui/react-scroll-area (Scrolling)
│  ├─ @radix-ui/react-label (Form labels)
│  ├─ @radix-ui/react-separator (Dividers)
│  └─ ... (8 more components)
│
├─ Styling System
│  ├─ Tailwind CSS 3.4.17 (Utility-first CSS)
│  │  ├─ Tailwind Merge 2.6.0 (Class merging)
│  │  ├─ Class Variance Authority 0.7.1 (Variants)
│  │  ├─ @tailwindcss/typography 0.5.16 (Typography)
│  │  ├─ Tailwind Animate 1.0.7 (Animations)
│  │  └─ AutoPrefixer 10.4.21 (Browser prefixes)
│  │
│  ├─ PostCSS 8.5.6 (CSS processing)
│  │  └─ Used with: Tailwind, AutoPrefixer
│  │
│  ├─ Framer Motion 12.23.12 (Advanced animations)
│  │  └─ Used for: Smooth transitions, interactions
│  │
│  └─ clsx 2.1.1 (Conditional className logic)
│
├─ Form Management
│  ├─ React Hook Form 7.62.0 (Form state)
│  │  ├─ @hookform/resolvers 5.2.1 (Validation)
│  │  └─ Integrated with Zod
│  │
│  ├─ Zod 3.25.76 (Type-safe validation)
│  │  └─ Used for: API contracts, form validation
│  │
│  └─ Input OTP 1.4.2 (OTP inputs)
│
├─ Data & State Management
│  └─ @tanstack/react-query 5.84.2 (Server state)
│      ├─ Data fetching
│      ├─ Caching
│      └─ Synchronization
│
├─ Data Display
│  ├─ Recharts 2.12.7 (Data visualization)
│  │  └─ Used for: Metrics, charts, graphs
│  │
│  ├─ Lucide React 0.539.0 (Icons)
│  │  └─ 500+ SVG icons for UI
│  │
│  └─ Embla Carousel 8.6.0 (Carousels)
│
├─ Date/Time Management
│  ├─ date-fns 4.1.0 (Date utilities)
│  └─ react-day-picker 9.8.1 (Date picker UI)
│
├─ Theme Management
│  ├─ next-themes 0.4.6 (Dark/light mode)
│  └─ Sonner 1.7.4 (Notifications)
│
├─ Layout Components
│  ├─ react-resizable-panels 3.0.4 (Resizable areas)
│  └─ Vaul 1.1.2 (Drawer/sidebar)
│
├─ Interactive Features
│  └─ cmdk 1.1.1 (Command palette)
│
├─ 3D Graphics
│  ├─ Three.js 0.176.0 (3D library)
│  │  ├─ @react-three/fiber 8.18.0 (React renderer)
│  │  └─ @react-three/drei 9.122.0 (Helpers)
│  └─ Used for: 3D visualizations
│
├─ Build & Bundling
│  ├─ Vite 7.1.2 (Build tool, dev server)
│  │  ├─ @vitejs/plugin-react-swc 4.0.0
│  │  │  └─ @swc/core 1.13.3 (Rust compiler)
│  │  │
│  │  └─ Features: HMR, optimization, ESM
│  │
│  └─ Used for: Development and production builds
│
├─ Type System
│  ├─ TypeScript 5.9.2 (Type checking)
│  │  ├─ @types/react 18.3.23
│  │  ├─ @types/react-dom 18.3.7
│  │  ├─ @types/three 0.176.0
│  │  └─ Code quality & autocomplete
│  │
│  └─ Used for: Compile-time type safety
│
└─ Development Tools
   ├─ Prettier 3.6.2 (Code formatting)
   ├─ Vitest 3.2.4 (Testing)
   └─ tsx 4.20.3 (TypeScript executor)
```

---

## Backend Dependency Tree

```
Node.js 22+ Runtime
│
└─ Express 5.1.0 (Web framework)
   ├─ HTTP server & routing
   ├─ Middleware system
   │  ├─ CORS 2.8.5 (Cross-origin requests)
   │  ├─ bodyparser (JSON parsing - built-in)
   │  └─ urlencoded (Form parsing - built-in)
   │
   ├─ API Routes
   │  ├─ Auth Routes
   │  │  ├─ jsonwebtoken 9.0.2 (JWT tokens)
   │  │  │  └─ Used for: Token generation/verification
   │  │  │
   │  │  └─ bcryptjs 3.0.3 (Password hashing)
   │  │     └─ Used for: Secure password storage
   │  │
   │  ├─ Deployment Routes
   │  │  └─ js-yaml 4.1.1 (YAML parsing)
   │  │     └─ Used for: Kubernetes manifest handling
   │  │
   │  └─ Data Routes
   │     └─ pg 8.16.3 (PostgreSQL driver)
   │        └─ Used for: Database queries
   │
   ├─ Configuration
   │  └─ dotenv 17.2.1 (Environment variables)
   │     └─ Used for: .env file loading
   │
   ├─ Deployment Options
   │  └─ serverless-http 3.2.0 (Serverless adapter)
   │     └─ Used for: AWS Lambda, Netlify Functions
   │
   ├─ Validation
   │  └─ Zod 3.25.76 (Type-safe validation)
   │     └─ Used for: Request validation, type safety
   │
   └─ Type System
      ├─ TypeScript 5.9.2 (Type checking)
      │  ├─ @types/node 24.2.1
      │  ├─ @types/express 5.0.3
      │  └─ @types/cors 2.8.19
      │
      └─ Development Tools
         ├─ Prettier 3.6.2 (Code formatting)
         ├─ Vitest 3.2.4 (Testing)
         └─ tsx 4.20.3 (TypeScript execution)
```

---

## Database Layer

```
PostgreSQL 16
│
└─ Node.js pg 8.16.3 (Client)
   ├─ Connection pooling
   ├─ Query execution
   ├─ Parameterized queries (SQL injection prevention)
   │
   └─ Tables (Typical schema)
      ├─ users (Authentication)
      ├─ deployments (Deployment records)
      ├─ configurations (Saved configs)
      └─ audit_logs (Activity tracking)
```

---

## Build & Development Pipeline

```
Source Code
│
├─ TypeScript 5.9.2 (Compilation)
│  └─ tsc (Type checking)
│
├─ Frontend Build
│  └─ Vite 7.1.2
│     ├─ @vitejs/plugin-react-swc 4.0.0
│     │  └─ @swc/core 1.13.3 (Compilation)
│     │
│     ├─ Code Splitting
│     ├─ CSS Processing (Tailwind)
│     ├─ Asset Optimization
│     └─ Output: dist/spa/
│
├─ Backend Build
│  └─ Vite 7.1.2 (--config vite.config.server.ts)
│     ├─ Node target
│     ├─ ESM output
│     ├─ External dependencies
│     └─ Output: dist/server/
│
├─ Code Quality
│  └─ Prettier 3.6.2 (Formatting)
│     └─ prettier --write .
│
├─ Testing
│  └─ Vitest 3.2.4
│     └─ vitest --run
│
└─ Production Output
   ├─ dist/spa/ (Frontend)
   ├─ dist/server/ (Backend)
   └─ node_modules/ (Dependencies)
```

---

## Package Management

```
pnpm 10.14.0
│
├─ Lock File
│  └─ pnpm-lock.yaml (Deterministic)
│
├─ Monorepo Support
│  └─ workspace structure (optional)
│
├─ Fast Installation
│  └─ Content-addressable store
│
└─ Dependencies
   ├─ Direct: 73 packages
   └─ Transitive: 500+ packages
```

---

## Deployment & Infrastructure Stack

```
Source Code (Git)
│
├─ Docker Build
│  ├─ Dockerfile (Multi-stage)
│  ├─ Build Stage
│  │  ├─ node:22-alpine
│  │  ├─ pnpm install
│  │  ├─ npm run build:client
│  │  └─ npm run build:server
│  │
│  └─ Production Stage
│     ├─ node:22-alpine (slim)
│     ├─ Copy dist/ (from build)
│     ├─ Health checks
│     └─ Output: ~200MB image
│
├─ Container Registry
│  └─ Docker Hub / ECR / GCR / Private
│
└─ Kubernetes Deployment
   ├─ Kustomization (Manifest management)
   │  └─ kustomization.yaml
   │
   ├─ Core Resources
   │  ├─ Namespace (kubechart)
   │  ├─ ConfigMap (configuration)
   │  ├─ Secret (sensitive data)
   │  └─ ServiceAccount (RBAC)
   │
   ├─ Application
   │  └─ Deployment (3-10 replicas)
   │     ├─ Rolling update strategy
   │     ├─ Health probes (liveness, readiness)
   │     ├─ Resource limits
   │     └─ Security context
   │
   ├─ Networking
   │  ├─ Service (ClusterIP + LoadBalancer)
   │  ├─ Ingress (HTTPS routing)
   │  │  └─ cert-manager integration
   │  │
   │  └─ NetworkPolicy (Security)
   │
   └─ Scaling & Monitoring
      ├─ HPA (Horizontal Pod Autoscaler)
      │  └─ CPU/Memory based scaling
      │
      └─ Prometheus annotations (optional)
```

---

## Dependency Version Relationships

```
TypeScript 5.9.2
├─ React 18.3.1 (TSX syntax)
├─ Vite 7.1.2 (TypeScript compilation)
├─ Express 5.1.0 (@types/express)
├─ Node 22+ (@types/node)
└─ All other packages (Type definitions)

React 18.3.1
├─ @vitejs/plugin-react-swc 4.0.0
├─ react-dom 18.3.1
├─ react-router-dom 6.30.1
├─ React Hook Form 7.62.0
└─ All Radix UI components (peer dep)

Vite 7.1.2
├─ @vitejs/plugin-react-swc 4.0.0
├─ @swc/core 1.13.3
└─ esbuild (built-in)

Express 5.1.0
├─ cors 2.8.5
├─ pg 8.16.3
├─ jsonwebtoken 9.0.2
├─ bcryptjs 3.0.3
└─ js-yaml 4.1.1

Tailwind CSS 3.4.17
├─ PostCSS 8.5.6
├─ AutoPrefixer 10.4.21
├─ Tailwind Merge 2.6.0
├─ class-variance-authority 0.7.1
└─ clsx 2.1.1
```

---

## Data Flow

```
User Request
│
├─ Frontend (React)
│  ├─ User Input (Forms)
│  │  └─ React Hook Form + Zod validation
│  │
│  ├─ API Call (fetch)
│  │  └─ @tanstack/react-query (caching)
│  │
│  └─ Component Rendering
│     ├─ Radix UI + Tailwind CSS
│     ├─ Framer Motion (animations)
│     └─ Three.js (3D graphics)
│
└─ Backend (Express)
   │
   ├─ Request Validation
   │  ├─ CORS check
   │  └─ Zod schema validation
   │
   ├─ Authentication
   │  ├─ JWT verification (jsonwebtoken)
   │  └─ bcryptjs password check
   │
   ├─ Business Logic
   │  └─ YAML parsing (js-yaml)
   │
   ├─ Database Query
   │  └─ PostgreSQL (pg driver)
   │
   └─ Response
      └─ JSON response to frontend
         └─ TanStack Query caching
```

---

## Security Layers

```
Network Layer (Kubernetes)
├─ NetworkPolicy (Pod communication rules)
├─ Ingress TLS (HTTPS with cert-manager)
└─ LoadBalancer (External access control)

Application Layer
├─ CORS 2.8.5 (Cross-origin requests)
├─ Security Headers (Express middleware)
├─ JWT 9.0.2 (Token-based auth)
└─ Zod (Input validation)

Data Layer
├─ bcryptjs 3.0.3 (Password hashing)
├─ pg parameterized queries (SQL injection)
└─ dotenv (Secret management)

Container Layer
├─ Non-root user (Security context)
├─ Read-only filesystem (Optional)
├─ Resource limits (CPU/Memory)
└─ Health checks
```

---

## Key Integration Points

### Frontend ↔ Backend
```
HTTP/REST API (Fetch)
├─ Request: JSON (React Hook Form + Zod)
├─ Response: JSON (TanStack React Query)
└─ Authentication: Bearer Token (JWT)
```

### Backend ↔ Database
```
PostgreSQL Protocol
├─ Connection: TCP/IP (pg driver)
├─ Queries: Parameterized (SQL safety)
├─ Transactions: ACID compliance
└─ Data: Persistent storage
```

### App ↔ Kubernetes
```
Container Image
├─ Docker: Multi-stage build
├─ Registry: Docker Hub/ECR/GCR
├─ Deployment: kubectl/Kustomize
└─ Monitoring: Health probes
```

---

## Optional Extensions

```
If adding in future:

Analytics
├─ Sentry (Error tracking)
├─ Datadog (Infrastructure)
└─ Custom metrics (Prometheus)

Database Enhancements
├─ Prisma (ORM + Type safety)
├─ Redis (Caching layer)
└─ Connection pooling (PgBouncer)

API Enhancements
├─ GraphQL (Apollo Server)
├─ WebSockets (Socket.io)
└─ Rate limiting (express-rate-limit)

Frontend Enhancements
├─ Next.js (SSR/SSG)
├─ Service Workers (PWA)
└─ Internationalization (i18n)

Authentication
├─ OAuth 2.0 (Google, GitHub, etc.)
├─ Magic links (Email auth)
└─ Multi-factor authentication (MFA)
```

---

## Summary Statistics

| Metric | Value |
|--------|-------|
| **Direct Dependencies** | 73 |
| **Transitive Dependencies** | 500+ |
| **Frontend Packages** | 45+ |
| **Backend Packages** | 7 |
| **Dev Tools** | 21+ |
| **Radix UI Components** | 25+ |
| **TypeScript Definitions** | 10+ |
| **Vite Plugins** | 2 |
| **Build Artifacts** | 2 (client + server) |
| **Docker Image Size** | ~200MB |
| **Node Modules Size** | ~1.2GB |
| **TypeScript Files** | 50+ |
| **CSS Classes** | Generated from Tailwind |
| **Kubernetes Manifests** | 10 |

---

**Comprehensive reference:** See `TECH_STACK.md` for detailed documentation
