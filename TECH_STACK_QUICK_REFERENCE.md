# KubeChart - Technology Stack Quick Reference

## At a Glance

| Category               | Technology           | Version        |
| ---------------------- | -------------------- | -------------- |
| **Runtime**            | Node.js              | 22+            |
| **Language**           | TypeScript           | 5.9.2          |
| **Frontend Framework** | React                | 18.3.1         |
| **Backend Framework**  | Express              | 5.1.0          |
| **Database**           | PostgreSQL           | 16             |
| **Build Tool**         | Vite                 | 7.1.2          |
| **CSS Framework**      | Tailwind CSS         | 3.4.17         |
| **UI Library**         | Radix UI             | 25+ components |
| **Form Management**    | React Hook Form      | 7.62.0         |
| **State Management**   | TanStack React Query | 5.84.2         |
| **Charting**           | Recharts             | 2.12.7         |
| **Authentication**     | JWT + bcryptjs       | 9.0.2, 3.0.3   |
| **Package Manager**    | pnpm                 | 10.14.0        |
| **Containerization**   | Docker               | 20.10+         |
| **Orchestration**      | Kubernetes           | 1.24+          |
| **Testing**            | Vitest               | 3.2.4          |

---

## Frontend Stack (Client)

### Core

```
React 18.3.1 → React Router 6.30.1 → Vite 7.1.2
TypeScript 5.9.2 (Type Safety)
```

### UI Components

- **Radix UI** - 25+ accessible components
- **Lucide React** - 500+ icons
- **Framer Motion** - Animations
- **Embla Carousel** - Carousels
- **Recharts** - Charts & graphs

### Styling

```
Tailwind CSS 3.4.17
  + Tailwind Merge
  + Class Variance Authority
  + AutoPrefixer
```

### Forms

```
React Hook Form 7.62.0
  + Input OTP for multi-step inputs
```

### Data Management

```
TanStack React Query 5.84.2 (Server state)
```

### Build & Compilation

```
Vite 7.1.2
  + SWC (@swc/core 1.13.3)
  + React SWC Plugin
```

---

## Backend Stack (Server)

### Framework & Runtime

```
Node.js 22+
  └─ Express 5.1.0
```

### Database

```
PostgreSQL 16
  └─ pg 8.16.3 (Node.js driver)
```

### Authentication

```
JWT (jsonwebtoken 9.0.2)
  + Bcryptjs 3.0.3 (Password hashing)
```

### Middleware

```
CORS 2.8.5 (Cross-Origin Resource Sharing)
Express JSON parser (built-in)
```

### Configuration

```
dotenv 17.2.1 (Environment variables)
```

### Data Processing

```
js-yaml 4.1.1 (Kubernetes YAML parsing)
```

### Deployment

```
serverless-http 3.2.0 (Serverless functions)
```

---

## Development Tools

### Type System

```
TypeScript 5.9.2
  + @types/react
  + @types/node
  + @types/express
```

### Testing

```
Vitest 3.2.4 (Unit tests)
```

### Code Quality

```
Prettier 3.6.2 (Code formatting)
ESLint (via TypeScript)
```

### Package Management

```
pnpm 10.14.0 (Fast package manager)
```

---

## Infrastructure & DevOps

### Containerization

```
Docker
  └─ Base: node:22-alpine
  └─ Multi-stage build
  └─ Final size: ~200MB
```

### Orchestration

```
Kubernetes 1.24+
  ├─ Deployments (3-10 replicas)
  ├─ Services (ClusterIP + LoadBalancer)
  ├─ Ingress (HTTPS + TLS)
  ├─ HPA (Auto-scaling)
  ├─ ConfigMap (Configuration)
  ├─ Secrets (Sensitive data)
  └─ NetworkPolicy (Security)
```

### Deployment Tools

```
Kustomize (Manifest management)
kubectl (Kubernetes CLI)
```

---

## Dependency Counts

| Category                 | Count    |
| ------------------------ | -------- |
| Production Dependencies  | 7        |
| Frontend Dependencies    | 45+      |
| Development Dependencies | 25+      |
| **Total Direct**         | **73**   |
| **Total Transitive**     | **500+** |

---

## Key Features Enabled by Tech Stack

### Frontend

- ✅ Type-safe components (TypeScript)
- ✅ Accessible UI (Radix UI)
- ✅ Smooth animations (Framer Motion)
- ✅ Real-time data updates (React Query)
- ✅ Form validation (Zod + React Hook Form)
- ✅ Dark mode support (next-themes)
- ✅ Mobile responsive (Tailwind CSS)
- ✅ 3D visualizations (Three.js)

### Backend

- ✅ RESTful API (Express)
- ✅ JWT authentication
- ✅ Secure password storage (bcryptjs)
- ✅ PostgreSQL data persistence
- ✅ YAML configuration parsing
- ✅ Serverless compatible
- ✅ CORS support
- ✅ Type-safe validation (Zod)

### Deployment

- ✅ Containerized (Docker)
- ✅ Kubernetes-native
- ✅ Auto-scaling
- ✅ Self-healing
- ✅ Rolling updates
- ✅ HTTPS ready
- ✅ Health checks
- ✅ Resource limits

---

## Build & Deploy Commands

```bash
# Development
npm run dev              # Start dev server
npm run build          # Build for production
npm run build:client   # Build client only
npm run build:server   # Build server only
npm run test           # Run tests
npm run format.fix     # Format code
npm run typecheck      # Check types

# Docker
docker build -t kubechart:latest .
docker push your-registry/kubechart:latest

# Kubernetes
kubectl apply -k kubernetes/
kubectl get pods -n kubechart
kubectl logs -f -n kubechart -l app=kubechart
```

---

## System Requirements

### Development

- **Node.js:** 22+ (LTS)
- **pnpm:** 10.14.0+
- **RAM:** 4GB minimum
- **Disk:** 2GB for node_modules

### Production

- **Node.js:** 22+
- **PostgreSQL:** 14+
- **Docker:** 20.10+
- **Kubernetes:** 1.24+

### Runtime (per pod)

- **CPU Request:** 250m
- **Memory Request:** 512Mi
- **CPU Limit:** 500m
- **Memory Limit:** 1Gi

---

## Environment Variables

### Backend Required

```
DATABASE_URL=postgresql://user:password@host:5432/db
JWT_SECRET=your-secure-secret-key
NODE_ENV=production
```

### Optional

```
PORT=3000
LOG_LEVEL=info
PING_MESSAGE=ping
```

---

## Package Manager: pnpm

**Why pnpm?**

- Faster than npm/yarn
- Monorepo support
- Better disk space efficiency
- Stricter dependency resolution
- Lockfile format: pnpm-lock.yaml

**Lock File:** `pnpm-lock.yaml` (managed automatically)

---

## Performance Metrics

### Load Time

- Page Load: <2s
- Time to Interactive: <3s
- Largest Contentful Paint: <1.5s

### Bundle Size

- Client JS: ~150KB (gzipped)
- Client CSS: ~50KB (gzipped)
- Total: ~200KB (optimized)

### API Response

- Average: <100ms
- P99: <500ms

### Docker Image

- Size: ~200MB
- Build Time: 2-3 minutes
- Startup Time: <5 seconds

---

## Validation & Type Safety

### Runtime Validation

- Zod for API request/response validation
- Type-safe form submission
- Database query type checking

### Compile-time Validation

- TypeScript strict mode (configurable)
- Type inference for React components
- Exhaustive checks for enums/unions

---

## Testing Strategy

### Unit Tests

- Vitest for component tests
- Test file pattern: `*.spec.ts` / `*.test.ts`
- Coverage target: 80%+

### Integration Tests

- API route testing
- Database integration tests
- End-to-end workflow tests

### Manual Testing

- Local dev server (npm run dev)
- Docker container testing
- Kubernetes deployment testing

---

## Security

### Authentication

- JWT tokens (httpOnly cookies)
- Session management
- CORS protection

### Password Security

- bcryptjs hashing (10 rounds)
- Salted password storage
- No plaintext in logs

### Data Validation

- Zod schema validation
- Input sanitization
- SQL injection prevention (pg parameterized queries)

### Deployment Security

- Non-root container user
- RBAC in Kubernetes
- NetworkPolicy enforcement
- Secret management

---

## Monitoring & Observability

### Built-in

- Health check endpoints (`/api/ping`)
- Request logging
- Error logging
- Performance metrics ready

### Optional

- Prometheus metrics
- DataDog integration
- Sentry error tracking
- ELK log aggregation

---

## Scaling Characteristics

### Horizontal Scaling

- Stateless API design
- Session stored in JWT
- Database connection pooling recommended
- Load balanced via Service/Ingress

### Vertical Scaling

- Node.js can use multiple cores
- Memory can be increased
- CPU limits adjustable
- Database performance depends on PostgreSQL

---

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS 12+, Android 9+)

---

## Version Upgrade Path

### Minor Version Upgrades (Safe)

- React 18.3 → 18.4
- Vite 7.1 → 7.2
- Express 5.1 → 5.2

### Major Version Upgrades (Review Required)

- React 18 → 19 (significant changes)
- TypeScript 5 → 6 (breaking changes)
- PostgreSQL 16 → 17 (test in dev first)

---

## Useful Links

- [React Docs](https://react.dev)
- [Express Docs](https://expressjs.com)
- [Kubernetes Docs](https://kubernetes.io/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Vite Guide](https://vitejs.dev/guide)
- [PostgreSQL Docs](https://www.postgresql.org/docs)
- [Radix UI Docs](https://www.radix-ui.com/docs/primitives/overview/introduction)
- [React Hook Form](https://react-hook-form.com)
- [Zod Documentation](https://zod.dev)

---

## Maintenance Schedule

### Weekly

- Check dependency security alerts
- Review logs for errors

### Monthly

- Update minor versions
- Test security patches
- Review performance metrics

### Quarterly

- Major version compatibility review
- Dependency audit
- Performance optimization review

### Annually

- Node.js version support review
- PostgreSQL version upgrade planning
- Kubernetes version compatibility check

---

**For detailed information, see:** `TECH_STACK.md`
