# Development Guide

Complete guide to developing features and contributing to KubeChart.

## Setup Development Environment

### Prerequisites

- Node.js v18+
- pnpm v8+
- Git
- PostgreSQL
- Docker (optional)

### Initial Setup

```bash
# Clone repository
git clone <repository-url>
cd kubechart

# Install dependencies
pnpm install

# Create .env file
cat > .env <<EOF
DATABASE_URL=postgresql://user:password@localhost:5432/kubechart
NODE_ENV=development
PORT=8080
API_SECRET=dev-secret-key
EOF

# Start development server
pnpm dev
```

Application will be available at `http://localhost:8080`

## Development Commands

```bash
# Start development server with hot reload
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run tests
pnpm test

# Run tests in watch mode
pnpm test --watch

# Type checking
pnpm typecheck

# Format code
pnpm format

# Lint code
pnpm lint
```

## Project Structure

See [Project Structure Guide](PROJECT_STRUCTURE.md) for detailed directory layout.

Quick reference:

- `client/` - React frontend
- `server/` - Express backend
- `shared/` - Shared types
- `kubernetes/` - K8s manifests
- `docs/` - Documentation

## Frontend Development

### React & TypeScript

The frontend is built with:

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Fast build tool
- **React Router 6** - Client-side routing
- **Tailwind CSS** - Styling

### Creating a New Page

1. **Create page component**:

   ```typescript
   // client/pages/MyPage.tsx
   import Layout from "@/components/Layout";

   export default function MyPage() {
     return (
       <Layout>
         <div className="max-w-6xl mx-auto px-4 py-12">
           <h1>My Page</h1>
         </div>
       </Layout>
     );
   }
   ```

2. **Add route**:

   ```typescript
   // client/App.tsx
   import MyPage from "@/pages/MyPage";

   <Routes>
     <Route path="/my-page" element={<MyPage />} />
   </Routes>
   ```

3. **Test in browser**:
   ```
   http://localhost:8080/my-page
   ```

### Creating a New Component

```typescript
// client/components/MyComponent.tsx
interface MyComponentProps {
  title: string;
  onClick: () => void;
}

export default function MyComponent({ title, onClick }: MyComponentProps) {
  return (
    <button onClick={onClick} className="px-4 py-2 bg-blue-600 text-white rounded">
      {title}
    </button>
  );
}
```

### Styling with Tailwind

```typescript
// Use Tailwind utility classes
<div className="flex items-center justify-between gap-4 p-6 bg-white rounded-lg border border-gray-200">
  <h2 className="text-xl font-semibold text-gray-900">Title</h2>
  <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
    Action
  </button>
</div>
```

### Using Hooks

```typescript
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";

export default function MyComponent() {
  const { user, token } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    // Fetch data
    fetch("/api/endpoint", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(setData);
  }, [token]);

  if (!user) return <div>Not authenticated</div>;

  return <div>{data && <pre>{JSON.stringify(data)}</pre>}</div>;
}
```

## Backend Development

### Express & TypeScript

The backend is built with:

- **Express** - Web framework
- **TypeScript** - Type safety
- **PostgreSQL** - Database
- **@kubernetes/client-node** - K8s integration

### Creating a New API Route

1. **Create route handler**:

   ```typescript
   // server/routes/my-route.ts
   import { RequestHandler } from "express";

   export const handleMyRoute: RequestHandler = async (req, res) => {
     const user = (req as any).user;

     if (!user) {
       return res.status(401).json({ error: "Not authenticated" });
     }

     try {
       // Your logic here
       res.status(200).json({ success: true, data: {} });
     } catch (error) {
       console.error("Error:", error);
       res.status(500).json({ error: "Internal server error" });
     }
   };
   ```

2. **Register route**:

   ```typescript
   // server/index.ts
   import { handleMyRoute } from "./routes/my-route";

   // In createServer function:
   app.get("/api/my-route", handleMyRoute);
   ```

3. **Test with curl**:
   ```bash
   curl -H "Authorization: Bearer <token>" \
     http://localhost:8080/api/my-route
   ```

### Database Operations

```typescript
import { query } from "../db";

export const handleGetData: RequestHandler = async (req, res) => {
  try {
    const result = await query("SELECT * FROM deployments WHERE user_id = $1", [
      userId,
    ]);

    res.json({ data: result.rows });
  } catch (error) {
    console.error("Query error:", error);
    res.status(500).json({ error: "Database error" });
  }
};
```

### Kubernetes Integration

```typescript
import * as k8s from "@kubernetes/client-node";

const kc = new k8s.KubeConfig();
kc.loadFromCluster(); // In-cluster auth

// Use K8s client...
```

## Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test MyComponent.test.tsx

# Watch mode
pnpm test --watch

# Coverage report
pnpm test --coverage
```

### Writing Tests

```typescript
// client/components/MyComponent.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import MyComponent from "./MyComponent";

describe("MyComponent", () => {
  it("renders the title", () => {
    render(<MyComponent title="Test" onClick={() => {}} />);
    expect(screen.getByText("Test")).toBeInTheDocument();
  });
});
```

## Code Style

### TypeScript

```typescript
// Use interfaces for props
interface ComponentProps {
  title: string;
  value: number;
  onComplete?: () => void;
}

// Use const for components
const MyComponent: React.FC<ComponentProps> = ({ title, value, onComplete }) => {
  return <div>{title}: {value}</div>;
};

// Export as default if single export
export default MyComponent;
```

### File Organization

```typescript
// 1. Imports
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import MyComponent from "./MyComponent";

// 2. Types/Interfaces
interface MyType {
  id: string;
  name: string;
}

// 3. Component
export default function MyPage() {
  const { user } = useAuth();

  return <div>{/* Component JSX */}</div>;
}
```

### CSS Classes

```typescript
// Use Tailwind utilities
className = "flex items-center justify-between gap-4 p-6 bg-white rounded-lg";

// For complex styles, use CSS modules or tailwind @apply
```

## Git Workflow

### Branch Naming

```
feature/add-user-authentication
bugfix/fix-deployment-error
docs/update-readme
```

### Commit Messages

```
feat: add deployment editing feature
fix: correct RBAC permission handling
docs: update installation guide
refactor: simplify template generator
```

### Making a Pull Request

1. **Create branch**:

   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make changes** and test locally

3. **Commit changes**:

   ```bash
   git add .
   git commit -m "feat: add my feature"
   ```

4. **Push and create PR**:
   ```bash
   git push origin feature/my-feature
   # Create PR on GitHub
   ```

## Debugging

### Frontend Debugging

1. **Open browser DevTools** (F12)
2. **Console tab** - Check for errors
3. **Network tab** - Check API calls
4. **React DevTools** - Inspect components
5. **Source Maps** - Debug TypeScript in browser

### Backend Debugging

```typescript
// Add debug logs
console.log("Variable:", variable);
console.error("Error:", error);

// Use debugger in code
debugger; // Browser will pause here when DevTools open
```

### Check Logs

```bash
# Development server logs
# Terminal where pnpm dev is running

# Docker logs
docker logs <container_id>

# Kubernetes logs
kubectl logs -f -n kubechart deployment/kubechart
```

## Common Development Tasks

### Adding a New Database Table

1. **Create migration** (or SQL directly):

   ```sql
   CREATE TABLE new_table (
     id UUID PRIMARY KEY,
     user_id INT NOT NULL REFERENCES users(id),
     data JSONB,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
   ```

2. **Execute in database**:

   ```bash
   psql $DATABASE_URL < migration.sql
   ```

3. **Update types** in `shared/api.ts`

### Adding a Configuration Option

1. **Add to global form** in `client/components/GlobalConfigurationForm.tsx`
2. **Update backend** to handle new config
3. **Generate YAML** in `client/lib/template-generator.ts`
4. **Test** end-to-end

### Adding a New Workload Type

1. **Add type** to workload configuration
2. **Create YAML generator** in `client/lib/yaml-builder.ts`
3. **Add form** in configuration components
4. **Test deployment**

## Performance Optimization

### Frontend

- Code splitting with React.lazy()
- Memoization with useMemo/useCallback
- Virtual scrolling for large lists
- Image optimization

### Backend

- Database query optimization
- Connection pooling
- Caching strategies
- Response compression

## Security Best Practices

1. **Input Validation** - Validate all user inputs
2. **Authorization** - Check user ownership
3. **Environment Variables** - Store secrets securely
4. **HTTPS** - Use HTTPS in production
5. **CORS** - Configure properly
6. **SQL Injection** - Use parameterized queries
7. **XSS Prevention** - Sanitize output

## Deployment

### Development

```bash
pnpm dev
```

### Production Build

```bash
pnpm build
pnpm start
```

### Docker

```bash
docker build -t kubechart:latest .
docker run -p 8080:8080 kubechart:latest
```

### Kubernetes

```bash
./k8s-deploy2.sh
```

## Troubleshooting Development

### Module not found error

```bash
# Clear cache and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm dev
```

### Port already in use

```bash
# Use different port
PORT=3000 pnpm dev
```

### Database connection error

```bash
# Check connection string
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1;"
```

### HMR not working

```bash
# Restart dev server
# Ctrl+C to stop
pnpm dev
```

## Resources

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Express Documentation](https://expressjs.com/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Tailwind CSS](https://tailwindcss.com/)

## Related Documentation

- [Getting Started](GETTING_STARTED.md)
- [Project Structure](PROJECT_STRUCTURE.md)
- [Architecture](ARCHITECTURE.md)
- [API Reference](API.md)

---

Happy developing! 🚀
