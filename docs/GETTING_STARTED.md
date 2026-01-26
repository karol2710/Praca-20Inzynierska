# Getting Started with KubeChart

This guide will help you set up and run KubeChart in less than 5 minutes.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** v18 or higher
- **pnpm** v8 or higher
- **Git**
- **Docker** (optional, for containerization)
- **Kubernetes cluster** (optional, for actual deployments)

### Check Your Installation

```bash
node --version    # Should be v18+
pnpm --version    # Should be v8+
docker --version  # Optional
kubectl version   # Optional
```

## Installation Steps

### 1. Clone the Repository

```bash
git clone <repository-url>
cd kubechart
```

### 2. Install Dependencies

```bash
pnpm install
```

This will install all required packages for both frontend and backend.

### 3. Start Development Server

```bash
pnpm dev
```

The application will start on `http://localhost:8080`

### 4. Access the Application

Open your browser and navigate to:

```
http://localhost:8080
```

## First Steps After Installation

### 1. Create an Account

1. Click "Create Account" on the login page
2. Enter your username and password
3. Click "Create Account"

### 2. Create Your First Deployment

1. Navigate to "Create Chart" from the sidebar
2. Fill in the basic configuration:
   - **Name**: Give your deployment a name
   - **Namespace**: Kubernetes namespace (default: `default`)
   - **Domain**: Your application domain
3. Add a workload (Deployment, Pod, etc.)
4. Configure container settings
5. Click "Deploy" to create your first deployment

### 3. Manage Your Deployment

1. Go to "Deployments" page
2. You'll see your newly created deployment
3. Use the buttons to:
   - **Edit**: Modify deployment settings
   - **Resources**: View and delete individual resources
   - **View YAML**: See the generated Kubernetes YAML
   - **Delete**: Remove the entire deployment

## Running Locally

### Development Mode

```bash
pnpm dev
```

Features in development mode:

- ✅ Hot module reload
- ✅ Full source maps for debugging
- ✅ Development console logs
- ✅ API endpoint access

### Build for Production

```bash
pnpm build
```

Creates optimized production build in `dist/` directory.

### Run Production Build Locally

```bash
pnpm build
pnpm start
```

## Using with Kubernetes

### Prerequisites

- Kubernetes cluster running (v1.24+)
- `kubectl` configured to access your cluster
- Service account with appropriate permissions

### Deploy the Application to Kubernetes

```bash
./k8s-deploy2.sh
```

This script will:

- Create a namespace (`kubechart`)
- Set up service accounts and RBAC
- Deploy the KubeChart application
- Configure ingress and routing

### Check Deployment Status

```bash
kubectl get pods -n kubechart
kubectl logs -n kubechart deployment/kubechart
```

### Access KubeChart in Kubernetes

```bash
kubectl port-forward -n kubechart svc/kubechart 8080:8080
```

Then access at `http://localhost:8080`

## Docker Setup

### Build Docker Image

```bash
./docker-build.sh
```

Or manually:

```bash
docker build -t kubechart:latest .
```

### Run Docker Container

```bash
docker run -p 8080:8080 kubechart:latest
```

## Using with Docker Compose

```bash
docker-compose up -d
```

This will start KubeChart with all required services.

## Troubleshooting

### Port Already in Use

If port 8080 is already in use:

```bash
# Find the process using port 8080
lsof -i :8080

# Kill the process
kill -9 <PID>
```

Or use a different port:

```bash
PORT=3000 pnpm dev
```

### Module Not Found Errors

Clear cache and reinstall:

```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Kubernetes Connection Issues

Verify your kubeconfig:

```bash
kubectl config current-context
kubectl auth can-i create deployments --namespace=default
```

### Database Connection Errors

Check database environment variables:

```bash
echo $DATABASE_URL
```

If not set, configure your `.env` file with proper database credentials.

## Next Steps

- **[Deployment Guide](DEPLOYMENT.md)** - Learn how to deploy applications
- **[Kubernetes Integration](KUBERNETES.md)** - Set up Kubernetes integration
- **[Features](FEATURES.md)** - Explore all features
- **[Development Guide](DEVELOPMENT.md)** - Start developing

## Common Commands

| Command            | Purpose                  |
| ------------------ | ------------------------ |
| `pnpm dev`         | Start development server |
| `pnpm build`       | Build for production     |
| `pnpm start`       | Start production server  |
| `pnpm test`        | Run tests                |
| `pnpm typecheck`   | Check TypeScript types   |
| `./k8s-deploy2.sh` | Deploy to Kubernetes     |
| `docker build .`   | Build Docker image       |

## Getting Help

- Check [Troubleshooting](TROUBLESHOOTING.md) for common issues
- Review [API Reference](API.md) for endpoint details
- See [Architecture](ARCHITECTURE.md) to understand how it works

---

**You're all set!** Start with creating your first deployment, and explore the other documentation as needed.
