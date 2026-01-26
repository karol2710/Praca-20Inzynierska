# Envoy Gateway Integration

Complete guide to using Envoy Gateway with KubeChart.

## Overview

Envoy Gateway is a modern, extensible proxy that manages ingress traffic. KubeChart integrates with Envoy Gateway through HTTPRoute resources for advanced traffic management.

## What is Envoy Gateway

Envoy Gateway provides:

- **Modern API Gateway**: Based on Kubernetes Gateway API
- **Traffic Routing**: URL-based and header-based routing
- **Rate Limiting**: Per-route and global limits
- **Load Balancing**: Multiple backends and algorithms
- **TLS Termination**: HTTPS support
- **Circuit Breaking**: Fault tolerance

## Architecture

```
Internet
   ↓
Envoy Gateway (Load Balancer)
   ├─ HTTP
   └─ HTTPS (TLS)
        ↓
   Gateway Resource
        ↓
   HTTPRoute Resources
        ↓
   Backend Services
        ↓
   Pods
```

## Installation

### Prerequisites

- Kubernetes 1.24+
- KubeChart with gateway support

### Install Envoy Gateway

```bash
# Install the Gateway API CRDs
kubectl apply -f https://github.com/kubernetes-sigs/gateway-api/releases/download/v0.7.1/experimental-install.yaml

# Install Envoy Gateway controller
helm repo add envoyproxy https://envoyproxy.io/charts
helm repo update
helm install eg envoyproxy/gateway-helm -n envoy-gateway-system --create-namespace
```

### Verify Installation

```bash
# Check Envoy Gateway pod
kubectl get pods -n envoy-gateway-system

# Check Gateway API CRDs
kubectl get crds | grep gateway

# Check service
kubectl get svc -n envoy-gateway-system
```

## Gateway Configuration

### Create Gateway Resource

KubeChart typically creates gateway in `kubernetes/gateway.yaml`:

```yaml
apiVersion: gateway.networking.k8s.io/v1beta1
kind: Gateway
metadata:
  name: envoy-gateway
  namespace: envoy-gateway-system
spec:
  gatewayClassName: envoy
  listeners:
    - name: http
      protocol: HTTP
      port: 80
      allowedRoutes:
        namespaces:
          from: All
    - name: https
      protocol: HTTPS
      port: 443
      tls:
        mode: Terminate
        certificateRefs:
          - name: tls-secret
      allowedRoutes:
        namespaces:
          from: All
```

### Apply Gateway

```bash
kubectl apply -f kubernetes/gateway.yaml

# Verify gateway
kubectl get gateway -n envoy-gateway-system
kubectl describe gateway envoy-gateway -n envoy-gateway-system
```

## HTTPRoute Configuration

### Create HTTPRoute for Application

KubeChart auto-generates HTTPRoute when you specify a domain:

```yaml
apiVersion: gateway.networking.k8s.io/v1beta1
kind: HTTPRoute
metadata:
  name: myapp-route
  namespace: my-namespace
spec:
  # Connect to gateway
  parentRefs:
    - name: envoy-gateway
      namespace: envoy-gateway-system

  # Hostnames
  hostnames:
    - app.example.com

  # Routing rules
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /
      backendRefs:
        - name: myapp-service
          port: 8080
```

### Route with Multiple Backends

```yaml
apiVersion: gateway.networking.k8s.io/v1beta1
kind: HTTPRoute
metadata:
  name: traffic-split
spec:
  parentRefs:
    - name: envoy-gateway
  hostnames:
    - app.example.com
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /api
      backendRefs:
        - name: api-service
          port: 8080
          weight: 80
        - name: api-service-canary
          port: 8080
          weight: 20
    - matches:
        - path:
            type: PathPrefix
            value: /
      backendRefs:
        - name: web-service
          port: 3000
```

### Route with Headers

```yaml
apiVersion: gateway.networking.k8s.io/v1beta1
kind: HTTPRoute
metadata:
  name: header-routing
spec:
  parentRefs:
    - name: envoy-gateway
  hostnames:
    - app.example.com
  rules:
    # Route requests with custom header to service
    - matches:
        - headers:
            - name: X-Version
              value: v2
      backendRefs:
        - name: app-service-v2
          port: 8080
    # Default route
    - backendRefs:
        - name: app-service-v1
          port: 8080
```

## Traffic Management

### Rate Limiting

Apply rate limiting via BackendTrafficPolicy:

```yaml
apiVersion: gateway.envoyproxy.io/v1alpha1
kind: BackendTrafficPolicy
metadata:
  name: rate-limit
  namespace: my-namespace
spec:
  targetRefs:
    - group: ""
      kind: Service
      name: myapp-service
  rateLimit:
    local:
      rules:
        - limit:
            requests: 1000
            unit: Second
```

### Timeout Configuration

```yaml
apiVersion: gateway.envoyproxy.io/v1alpha1
kind: BackendTrafficPolicy
metadata:
  name: timeout-policy
spec:
  targetRefs:
    - group: ""
      kind: Service
      name: myapp-service
  timeout:
    tcp:
      connect: 10s
    http:
      requestReceivedTimeout: 30s
```

### Circuit Breaker

```yaml
apiVersion: gateway.envoyproxy.io/v1alpha1
kind: BackendTrafficPolicy
metadata:
  name: circuit-breaker
spec:
  targetRefs:
    - group: ""
      kind: Service
      name: myapp-service
  circuitBreaker:
    consecutiveErrorThreshold: 5
    interval: 30s
    maxRequests: 1000
```

## TLS/HTTPS Configuration

### Create TLS Certificate Secret

```bash
# Generate self-signed certificate
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365

# Create secret
kubectl create secret tls myapp-tls \
  --cert=cert.pem \
  --key=key.pem \
  -n envoy-gateway-system
```

### Use Let's Encrypt with cert-manager

```bash
# Install cert-manager
helm repo add jetstack https://charts.jetstack.io
helm install cert-manager jetstack/cert-manager -n cert-manager --create-namespace --set installCRDs=true

# Create certificate
kubectl apply -f - <<EOF
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: myapp-cert
spec:
  secretName: myapp-tls
  issuerRef:
    name: letsencrypt-prod
    kind: ClusterIssuer
  dnsNames:
  - app.example.com
EOF
```

### Enable HTTPS in Gateway

```yaml
apiVersion: gateway.networking.k8s.io/v1beta1
kind: Gateway
metadata:
  name: envoy-gateway
spec:
  listeners:
    - name: https
      protocol: HTTPS
      port: 443
      tls:
        mode: Terminate
        certificateRefs:
          - name: myapp-tls
```

## Advanced Routing

### Canary Deployment

```yaml
apiVersion: gateway.networking.k8s.io/v1beta1
kind: HTTPRoute
metadata:
  name: canary-route
spec:
  parentRefs:
    - name: envoy-gateway
  hostnames:
    - app.example.com
  rules:
    # 90% traffic to stable
    - backendRefs:
        - name: app-stable
          port: 8080
          weight: 90
        # 10% traffic to canary
        - name: app-canary
          port: 8080
          weight: 10
```

### Blue-Green Deployment

```yaml
apiVersion: gateway.networking.k8s.io/v1beta1
kind: HTTPRoute
metadata:
  name: blue-green
spec:
  parentRefs:
  - name: envoy-gateway
  hostnames:
  - app.example.com
  rules:
  # Route with header to blue
  - matches:
    - headers:
      - name: X-Deployment
        value: blue
    backendRefs:
    - name: app-blue
      port: 8080
  # Route with header to green
  - matches:
    - headers:
    - name: X-Deployment
        value: green
    backendRefs:
    - name: app-green
      port: 8080
```

## Monitoring

### Check HTTPRoute Status

```bash
# List HTTPRoutes
kubectl get httproutes -A

# Get HTTPRoute details
kubectl describe httproute myapp-route -n my-namespace

# Watch status
kubectl get httproutes myapp-route -n my-namespace --watch
```

### Check Gateway Status

```bash
# Get gateway status
kubectl get gateway -n envoy-gateway-system

# Detailed status
kubectl describe gateway envoy-gateway -n envoy-gateway-system
```

### View Envoy Gateway Logs

```bash
# Gateway controller logs
kubectl logs -f -n envoy-gateway-system \
  deployment/envoy-gateway

# Proxy logs
kubectl logs -f -n envoy-gateway-system \
  pod/envoy-<pod-id>

# Check metrics
kubectl port-forward -n envoy-gateway-system \
  svc/envoy-gateway 8001:8001
curl http://localhost:8001/stats
```

## Testing Gateway

### Access Application

```bash
# Get gateway IP
kubectl get service -n envoy-gateway-system \
  -o jsonpath='{.items[0].status.loadBalancer.ingress[0].ip}'

# Add to hosts file
echo "1.2.3.4 app.example.com" >> /etc/hosts

# Access application
curl http://app.example.com
curl https://app.example.com  # If HTTPS configured
```

### Test Rate Limiting

```bash
# Generate load
ab -n 1000 -c 10 http://app.example.com/

# Check for 429 responses
wrk -t4 -c100 -d30s http://app.example.com/
```

### Test Header Routing

```bash
# Route with header
curl -H "X-Version: v2" http://app.example.com/

# Without header
curl http://app.example.com/
```

## Troubleshooting

### Issue: HTTPRoute Not Working

**Symptoms**: Traffic not routing through HTTPRoute

**Solutions**:

```bash
# Check HTTPRoute status
kubectl describe httproute <name> -n <namespace>

# Verify parent gateway exists
kubectl get gateway -A

# Check HTTPRoute YAML
kubectl get httproute <name> -n <namespace> -o yaml

# View gateway status
kubectl describe gateway envoy-gateway -n envoy-gateway-system
```

### Issue: Certificate Not Loading

**Symptoms**: TLS handshake fails

**Solutions**:

```bash
# Check secret exists
kubectl get secret -n envoy-gateway-system | grep tls

# Verify certificate
kubectl get secret myapp-tls -n envoy-gateway-system -o jsonpath='{.data.tls\.crt}' | base64 -d | openssl x509 -text

# Check cert-manager (if used)
kubectl describe certificate myapp-cert
kubectl describe clusterissuer letsencrypt-prod
```

### Issue: Rate Limiting Not Applied

**Symptoms**: No 429 responses even with high traffic

**Solutions**:

```bash
# Verify policy exists
kubectl get backendtrafficpolicies -n <namespace>

# Check policy status
kubectl describe backendtrafficpolicy <name> -n <namespace>

# Verify target service
kubectl get svc -n <namespace>
```

## Best Practices

### 1. Use HTTPRoute for Public APIs

Instead of exposing services directly, use HTTPRoute for:

- Central traffic control
- Rate limiting
- Authentication/authorization
- Traffic shifting

### 2. Separate HTTP and HTTPS

```yaml
listeners:
  - name: http
    protocol: HTTP
    port: 80
  - name: https
    protocol: HTTPS
    port: 443
```

### 3. Use Meaningful Hostnames

```yaml
hostnames:
  - api.example.com # APIs
  - app.example.com # Web app
  - admin.example.com # Admin panel
```

### 4. Implement Health Checks

Envoy Gateway automatically uses service endpoints. Ensure pods have:

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8080
readinessProbe:
  httpGet:
    path: /ready
    port: 8080
```

### 5. Monitor Traffic

Use metrics and logs to track:

- Request rate
- Error rate
- Latency
- Backend health

## Related Documentation

- [Rate Limiting](RATE_LIMITING.md)
- [Kubernetes Integration](KUBERNETES.md)
- [Deployment Guide](DEPLOYMENT.md)
- [Troubleshooting](TROUBLESHOOTING.md)

---

For more information:

- [Envoy Gateway Documentation](https://gateway.envoyproxy.io/)
- [Gateway API](https://gateway.api.kubernetes.io/)
- [HTTPRoute API](https://gateway.networking.k8s.io/v1beta1/httproute)
