# Rate Limiting

Guide to configuring rate limiting in KubeChart.

## Overview

Rate limiting controls the number of requests allowed per unit of time. KubeChart uses Envoy Gateway's `BackendTrafficPolicy` for rate limiting.

## How Rate Limiting Works

```
Request → Envoy Gateway → Rate Limiter → Check Quota → Allow/Deny
```

### Request Flow

1. **Request arrives** at Envoy Gateway
2. **Rate limiter checks** current request count
3. **Quota available**: Request forwarded to application
4. **Quota exceeded**: Request rejected with 429 (Too Many Requests)
5. **After time window**: Counter resets

## Configuration

### Setting Rate Limit

**In Global Configuration Form**:

```
Requests Per Second: 1000
```

This creates a rate limit of 1000 requests per second for the namespace.

### Example Configurations

| Use Case | Requests/Sec | Notes |
|----------|-------------|-------|
| API (low traffic) | 100 | Small or test API |
| Web app (medium) | 1000 | Typical web application |
| High-traffic API | 5000-10000 | Popular service |
| Real-time service | 50000+ | High-frequency updates |
| Test/dev | 10000-100000 | Development environment |

## Kubernetes BackendTrafficPolicy

KubeChart generates this policy:

```yaml
apiVersion: gateway.envoyproxy.io/v1alpha1
kind: BackendTrafficPolicy
metadata:
  name: rate-limit
  namespace: my-namespace
spec:
  rateLimit:
    local:
      rules:
      - limit:
          requests: 1000  # 1000 requests per second
          unit: Second
```

### Viewing Policy

```bash
# List rate limit policies
kubectl get backendtrafficpolicies -n <namespace>

# View policy details
kubectl describe backendtrafficpolicy rate-limit -n <namespace>

# View YAML
kubectl get backendtrafficpolicy rate-limit -n <namespace> -o yaml
```

## Rate Limiting Behavior

### Success Response

**When quota available**:
```
HTTP/1.1 200 OK
Content-Type: application/json
```

### Rate Limited Response

**When quota exceeded**:
```
HTTP/1.1 429 Too Many Requests
Content-Type: application/json
{
  "error": "Rate limit exceeded"
}
```

### Response Headers

```
X-RateLimit-Limit: 1000       # Max requests per second
X-RateLimit-Remaining: 950    # Requests remaining this second
X-RateLimit-Reset: 1234567890 # Unix timestamp when counter resets
```

## Testing Rate Limits

### Generate Load

```bash
# Using Apache Bench
ab -n 1000 -c 10 http://app.example.com/

# Using wrk
wrk -t4 -c100 -d30s http://app.example.com/

# Using curl loop
for i in {1..100}; do curl http://app.example.com/ & done
```

### Monitor Rate Limiting

```bash
# Check current requests per second
kubectl top pods -n <namespace>

# View rate limit policy
kubectl describe backendtrafficpolicy rate-limit -n <namespace>

# Check Envoy Gateway logs
kubectl logs -f -n envoy-gateway-system
```

## Advanced Configuration

### Multiple Rate Limit Rules

```yaml
spec:
  rateLimit:
    local:
      rules:
      # Rule 1: 1000 requests per second globally
      - limit:
          requests: 1000
          unit: Second
      # Rule 2: 10000 requests per minute
      - limit:
          requests: 10000
          unit: Minute
```

### Per-Route Rate Limiting

```yaml
apiVersion: gateway.networking.k8s.io/v1beta1
kind: HTTPRoute
metadata:
  name: api-route
spec:
  rules:
  - matches:
    - path:
        type: PathPrefix
        value: /api
    backendRefs:
    - name: api-service
      port: 8080
```

Then apply rate limit to specific route.

## Handling Rate Limits in Applications

### Client-Side Handling

```javascript
// JavaScript example
async function fetchWithRetry(url, options = {}) {
  const maxRetries = 3;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      const response = await fetch(url, options);
      
      if (response.status === 429) {
        // Rate limited, wait before retry
        const resetTime = response.headers.get('X-RateLimit-Reset');
        const waitMs = (resetTime - Date.now() / 1000) * 1000;
        console.log(`Rate limited, waiting ${waitMs}ms`);
        await new Promise(resolve => setTimeout(resolve, waitMs));
        retries++;
        continue;
      }
      
      return response;
    } catch (error) {
      console.error('Request failed:', error);
      throw error;
    }
  }

  throw new Error('Max retries exceeded');
}
```

### Exponential Backoff

```javascript
// Exponential backoff with jitter
async function fetchWithBackoff(url) {
  let retries = 0;
  const maxRetries = 5;

  while (retries < maxRetries) {
    try {
      const response = await fetch(url);
      
      if (response.status === 429) {
        // Calculate backoff with jitter
        const backoff = Math.pow(2, retries) * 1000 + Math.random() * 1000;
        console.log(`Retrying in ${backoff}ms`);
        await new Promise(resolve => setTimeout(resolve, backoff));
        retries++;
        continue;
      }
      
      return response;
    } catch (error) {
      retries++;
    }
  }

  throw new Error('Request failed after retries');
}
```

## Monitoring and Metrics

### Prometheus Metrics

Envoy Gateway exports rate limiting metrics:

```promql
# Rate limited requests
rate(envoy_http_local_rate_limit_ok[5m])
rate(envoy_http_local_rate_limit_ratelimit[5m])

# Check ratio of rate limited to total
rate(envoy_http_local_rate_limit_ratelimit[5m]) /
(rate(envoy_http_local_rate_limit_ok[5m]) + rate(envoy_http_local_rate_limit_ratelimit[5m]))
```

### View Metrics

```bash
# Port forward to Envoy Gateway
kubectl port-forward -n envoy-gateway-system svc/envoy-gateway 8001:8001

# Access metrics
curl http://localhost:8001/stats
```

## Troubleshooting

### Issue: All Requests Being Rate Limited

**Symptoms**: All requests return 429, even with low traffic

**Causes**:
1. Rate limit value is too low
2. Multiple containers counting against limit
3. Health checks consuming quota

**Solutions**:

```bash
# Check current rate limit
kubectl describe backendtrafficpolicy rate-limit -n <namespace>

# Increase rate limit via UI or:
kubectl patch backendtrafficpolicy rate-limit -n <namespace> \
  -p '{"spec":{"rateLimit":{"local":{"rules":[{"limit":{"requests":5000,"unit":"Second"}}]}}}}'

# Check requests per second
kubectl top pods -n <namespace>
```

### Issue: Rate Limit Not Working

**Symptoms**: No 429 responses even with high traffic

**Causes**:
1. BackendTrafficPolicy not applied
2. Policy not connected to route
3. Envoy Gateway not running

**Solutions**:

```bash
# Verify policy exists
kubectl get backendtrafficpolicies -n <namespace>

# Verify Envoy Gateway is running
kubectl get pods -n envoy-gateway-system

# Check policy status
kubectl describe backendtrafficpolicy rate-limit -n <namespace>
```

### Issue: Rate Limit Too Strict

**Symptoms**: Valid traffic being rejected

**Causes**:
1. Rate limit too low for actual traffic
2. Burst traffic exceeding limit
3. Connection pooling causing spikes

**Solutions**:

1. **Analyze traffic pattern**:
   ```bash
   # Check average requests per second
   kubectl logs -f deployment -n <namespace> | grep requests
   ```

2. **Increase rate limit**:
   ```
   UI: Edit deployment → Global Configuration → Increase Requests Per Second
   ```

3. **Implement client-side backoff** (see above)

## Best Practices

### 1. Set Conservative Limits

```
Start high (e.g., 10000 requests/sec)
Monitor actual usage
Gradually lower to target value
```

### 2. Monitor and Alert

```yaml
# Prometheus alert example
alert: HighRateLimitErrors
expr: |
  rate(envoy_http_local_rate_limit_ratelimit[5m]) > 0.1
for: 5m
```

### 3. Implement Client-Side Handling

- Retry with exponential backoff
- Check rate limit headers
- Implement circuit breaker pattern

### 4. Use Burst Allowance

For handling traffic spikes:

```yaml
spec:
  rateLimit:
    local:
      rules:
      - limit:
          requests: 1000
          unit: Second
```

Allow for 10-20% burst beyond this limit.

### 5. Different Limits for Different Routes

```yaml
# High-traffic public API
/api/public: 10000 requests/sec

# Internal API
/api/internal: 1000 requests/sec

# Webhooks
/webhooks: 100 requests/sec
```

## Performance Tuning

### Optimize for Low Latency

```
# Increase allowed requests to reduce rejections
Requests Per Second: 50000 (for high-traffic service)
```

### Optimize for Cost Control

```
# Lower rate limit to reduce resource usage
Requests Per Second: 100 (for low-traffic service)
```

## Related Documentation

- [Global Configuration](GLOBAL_CONFIG.md)
- [Gateway Integration](GATEWAY.md)
- [Kubernetes Integration](KUBERNETES.md)
- [Troubleshooting](TROUBLESHOOTING.md)

---

For more information:
- [Envoy Gateway Documentation](https://gateway.envoyproxy.io/)
- [BackendTrafficPolicy API](https://gateway.envoyproxy.io/latest/api/extension_types.html#backendtrafficpolicy)
