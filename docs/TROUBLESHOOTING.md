# Troubleshooting Guide

Common issues and solutions for KubeChart.

## Connection Issues

### Issue: Cannot Connect to Application

**Symptoms**: Browser shows "Connection refused" or timeout

**Solutions**:

1. **Check if application is running**:

   ```bash
   # For local development
   pnpm dev

   # For Docker
   docker ps | grep kubechart

   # For Kubernetes
   kubectl get pods -n kubechart
   ```

2. **Check port is correct**:

   ```bash
   # Default port is 8080
   curl http://localhost:8080

   # For Kubernetes
   kubectl port-forward -n kubechart svc/kubechart 8080:8080
   curl http://localhost:8080
   ```

3. **Check firewall**:

   ```bash
   # Linux
   sudo ufw status
   sudo ufw allow 8080

   # macOS
   # System Preferences > Security & Privacy > Firewall
   ```

## Authentication Issues

### Issue: Cannot Login

**Symptoms**: "Invalid credentials" error on login page

**Solutions**:

1. **Verify user exists**:

   ```bash
   # Connect to database
   psql $DATABASE_URL

   # Check users table
   SELECT * FROM users WHERE username = 'your_username';
   ```

2. **Reset password**:

   ```bash
   # Create new account with different username
   # Or delete user and recreate
   DELETE FROM users WHERE username = 'your_username';
   ```

3. **Check JWT secret**:
   ```bash
   echo $API_SECRET
   # Should be set in environment
   ```

### Issue: JWT Token Expired

**Symptoms**: "Unauthorized" error on page refresh

**Solutions**:

1. **Clear localStorage**:

   ```javascript
   // In browser console
   localStorage.clear();
   // Refresh page and login again
   ```

2. **Check token in browser**:
   ```javascript
   // In console
   console.log(localStorage.getItem("token"));
   ```

## Database Issues

### Issue: Database Connection Failed

**Symptoms**: Error connecting to PostgreSQL

**Solutions**:

1. **Verify database is running**:

   ```bash
   # Check if PostgreSQL is running
   psql --version
   psql -U postgres -c "SELECT 1;"
   ```

2. **Check connection string**:

   ```bash
   echo $DATABASE_URL
   # Should be: postgresql://user:password@host:port/database
   ```

3. **Test connection**:

   ```bash
   psql $DATABASE_URL -c "SELECT 1;"
   ```

4. **For Docker**:

   ```bash
   # Check if db container is running
   docker ps | grep postgres

   # Check container logs
   docker logs <container_id>

   # Try connecting
   docker exec -it <container_id> psql -U kubechart
   ```

### Issue: Database Tables Not Found

**Symptoms**: "Relation not found" error

**Solutions**:

1. **Check if database exists**:

   ```bash
   psql $DATABASE_URL -c "\dt"
   # Should list tables
   ```

2. **Create tables**:

   ```sql
   -- Create users table
   CREATE TABLE users (
     id SERIAL PRIMARY KEY,
     username VARCHAR(255) UNIQUE NOT NULL,
     password_hash VARCHAR(255) NOT NULL,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );

   -- Create deployments table
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

### Issue: Cannot Create Account

**Symptoms**: "Username already exists" or database error

**Solutions**:

1. **Check if user exists**:

   ```bash
   psql $DATABASE_URL -c "SELECT * FROM users WHERE username = 'your_user';"
   ```

2. **Delete duplicate user**:

   ```bash
   psql $DATABASE_URL -c "DELETE FROM users WHERE username = 'your_user';"
   ```

3. **Check password requirements**:
   - Minimum 8 characters
   - Cannot be empty

## Kubernetes Issues

### Issue: Cannot Connect to Cluster

**Symptoms**: "Unable to connect to server" error

**Solutions**:

1. **Check kubectl configuration**:

   ```bash
   kubectl config current-context
   kubectl cluster-info
   ```

2. **Switch context**:

   ```bash
   kubectl config get-contexts
   kubectl config use-context <context-name>
   ```

3. **Verify kubeconfig path**:

   ```bash
   echo $KUBECONFIG
   # Should point to valid kubeconfig file
   ```

4. **Test cluster access**:
   ```bash
   kubectl auth can-i create deployments
   # Should return "yes"
   ```

### Issue: Permission Denied Creating Resources

**Symptoms**: "403 Forbidden" when deploying

**Solutions**:

1. **Check service account permissions**:

   ```bash
   kubectl auth can-i create deployments \
     --as=system:serviceaccount:kubechart:kubechart
   ```

2. **Check ClusterRole**:

   ```bash
   kubectl describe clusterrole kubechart
   ```

3. **Update permissions** (if using k8s-deploy2.sh):
   ```bash
   ./k8s-deploy2.sh
   ```

### Issue: Namespace Not Created

**Symptoms**: Deployment fails because namespace doesn't exist

**Solutions**:

1. **Create namespace manually**:

   ```bash
   kubectl create namespace <namespace-name>
   ```

2. **Grant permissions to create namespaces**:

   ```bash
   # Update ClusterRole to include:
   kubectl edit clusterrole kubechart

   # Add under "":
   # - apiGroups: [""]
   #   resources: ["namespaces"]
   #   verbs: ["get", "list", "watch", "create"]
   ```

### Issue: Pod Fails to Start

**Symptoms**: Pod in CrashLoopBackOff or Error state

**Solutions**:

1. **Check pod status**:

   ```bash
   kubectl describe pod <pod-name> -n <namespace>
   ```

2. **View pod logs**:

   ```bash
   kubectl logs <pod-name> -n <namespace>
   ```

3. **Check resource limits**:
   ```bash
   kubectl describe node
   # Check available resources
   ```

## Deployment Issues

### Issue: Deployment Won't Deploy

**Symptoms**: Error when clicking "Deploy" button

**Solutions**:

1. **Check form validation**:
   - All required fields filled
   - Valid namespace name (lowercase, alphanumeric, hyphens)
   - At least one workload configured

2. **Check browser console**:

   ```javascript
   // Open browser developer tools (F12)
   // Check Console tab for error messages
   ```

3. **Check server logs**:

   ```bash
   # For development
   pnpm dev  # Check terminal output

   # For Docker
   docker logs -f <container_id>

   # For Kubernetes
   kubectl logs -f -n kubechart deployment/kubechart
   ```

### Issue: Deployment Shows Failed Status

**Symptoms**: Deployment status shows "failed"

**Solutions**:

1. **Check deployment details**:

   ```bash
   kubectl describe deployment <name> -n <namespace>
   ```

2. **Check pod status**:

   ```bash
   kubectl get pods -n <namespace>
   kubectl logs <pod-name> -n <namespace>
   ```

3. **Check resource availability**:

   ```bash
   kubectl describe node
   ```

4. **Check YAML validity**:
   ```bash
   kubectl apply -f deployment.yaml --dry-run=client
   ```

### Issue: Cannot Delete Deployment

**Symptoms**: Deletion hangs or fails

**Solutions**:

1. **Check deletion status**:

   ```bash
   kubectl get deployment <name> -n <namespace>
   ```

2. **Force delete**:

   ```bash
   kubectl delete deployment <name> \
     --grace-period=0 --force -n <namespace>
   ```

3. **Delete entire namespace**:
   ```bash
   kubectl delete namespace <namespace>
   ```

## Resource Issues

### Issue: Cannot View Resources

**Symptoms**: Resources modal shows "No resources" or error

**Solutions**:

1. **Check YAML config in database**:

   ```bash
   psql $DATABASE_URL -c \
     "SELECT yaml_config FROM deployments WHERE name = 'your-deployment';" \
     | head -50
   ```

2. **Verify deployment exists**:

   ```bash
   kubectl get all -n <namespace>
   ```

3. **Check server logs**:
   ```bash
   # Check for parsing errors
   kubectl logs -f -n kubechart deployment/kubechart | grep error
   ```

### Issue: Cannot Delete Resource

**Symptoms**: Delete button disabled or error occurs

**Solutions**:

1. **Check if resource is deletable**:

   ```
   Only user workloads and HTTPRoute can be deleted:
   - Pod
   - Deployment
   - StatefulSet
   - ReplicaSet
   - Job
   - CronJob
   - Service
   - HTTPRoute
   ```

2. **For other resources, use kubectl**:
   ```bash
   kubectl delete networkpolicy <name> -n <namespace>
   kubectl delete resourcequota <name> -n <namespace>
   ```

## YAML Issues

### Issue: Invalid YAML Generated

**Symptoms**: Deployment fails with validation error

**Solutions**:

1. **View generated YAML**:

   ```
   UI: Click "View YAML" button
   ```

2. **Validate YAML**:

   ```bash
   kubectl apply -f deployment.yaml --dry-run=client
   ```

3. **Check YAML structure**:
   ```bash
   # Validate YAML syntax
   yaml-lint deployment.yaml
   ```

### Issue: Syntax Errors in YAML

**Symptoms**: "Invalid YAML" error

**Solutions**:

1. **Check indentation**:

   ```yaml
   # Correct
   spec:
     replicas: 3

   # Wrong
   spec:
    replicas: 3  # Only 1 space
   ```

2. **Check quotes**:

   ```yaml
   # Correct
   image: "nginx:latest"

   # Sometimes OK
   image: nginx:latest
   ```

3. **Use online YAML validator**:
   - https://yamllint.com/
   - https://www.jsonschema.net/

## Performance Issues

### Issue: Application is Slow

**Symptoms**: Page loads slowly or UI freezes

**Solutions**:

1. **Check server performance**:

   ```bash
   # For Kubernetes
   kubectl top pods -n kubechart
   kubectl top nodes
   ```

2. **Check database performance**:

   ```bash
   # Check slow queries
   psql $DATABASE_URL -c "SELECT * FROM pg_stat_statements;"
   ```

3. **Increase resources**:
   ```bash
   # For Kubernetes deployment
   kubectl set resources deployment kubechart \
     --requests=cpu=500m,memory=512Mi \
     --limits=cpu=1000m,memory=1Gi \
     -n kubechart
   ```

### Issue: High Memory Usage

**Symptoms**: Application crashes due to memory

**Solutions**:

1. **Check memory limits**:

   ```bash
   kubectl describe pod <pod-name> -n kubechart
   ```

2. **Increase memory limit**:

   ```bash
   # Edit deployment
   kubectl edit deployment kubechart -n kubechart
   # Increase limits.memory value
   ```

3. **Restart pod**:
   ```bash
   kubectl rollout restart deployment/kubechart -n kubechart
   ```

## Docker Issues

### Issue: Cannot Build Docker Image

**Symptoms**: `docker build` command fails

**Solutions**:

1. **Check Docker is running**:

   ```bash
   docker --version
   docker ps
   ```

2. **Build with verbose output**:

   ```bash
   docker build --progress=plain -t kubechart:latest .
   ```

3. **Check Dockerfile**:

   ```dockerfile
   # Verify Dockerfile exists and is correct
   cat Dockerfile
   ```

4. **Free up disk space**:
   ```bash
   docker system prune -a
   ```

### Issue: Container Won't Start

**Symptoms**: Container exits immediately

**Solutions**:

1. **Check container logs**:

   ```bash
   docker logs <container_id>
   ```

2. **Run with interactive terminal**:

   ```bash
   docker run -it kubechart:latest sh
   # Try to start application manually
   ```

3. **Check environment variables**:
   ```bash
   docker run -e DATABASE_URL=... kubechart:latest
   ```

## General Troubleshooting Steps

1. **Check Logs**:
   - Browser console (F12)
   - Server logs
   - Kubernetes logs
   - Docker logs

2. **Verify Configuration**:
   - Environment variables set
   - Database accessible
   - Kubernetes cluster accessible

3. **Check Permissions**:
   - User authentication
   - Kubernetes RBAC
   - File permissions

4. **Restart Services**:

   ```bash
   # Stop and restart
   Ctrl+C (for dev server)
   pnpm dev

   # Or for Kubernetes
   kubectl rollout restart deployment/kubechart -n kubechart
   ```

5. **Clear Cache**:

   ```bash
   # Browser
   Clear cache (Ctrl+Shift+Delete)

   # Application
   rm -rf node_modules pnpm-lock.yaml
   pnpm install
   ```

## Getting Help

If you can't resolve the issue:

1. **Check Logs** - Provide full error messages
2. **Document Steps** - What were you trying to do?
3. **Provide Context** - Environment (local/Docker/Kubernetes)
4. **Share Configuration** - Deployment settings, YAML
5. **Create Issue** - Include all above information

---

See also:

- [Getting Started](GETTING_STARTED.md)
- [Kubernetes Integration](KUBERNETES.md)
- [Deployment Guide](DEPLOYMENT.md)
