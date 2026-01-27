# KubeChart Platform Testing Methodology & Schema

**Version:** 1.0  
**Last Updated:** January 2026  
**Scope:** Testing for Platform.sh, BackupSys.sh, DataBase.sh, and k8s-deploy2.sh deployments

---

## Table of Contents

1. [Overview](#overview)
2. [Tools Required](#tools-required)
3. [Pre-Deployment Tests](#pre-deployment-tests)
4. [Component Installation Tests](#component-installation-tests)
5. [Integration Tests](#integration-tests)
6. [Performance & Load Tests](#performance--load-tests)
7. [Security Tests](#security-tests)
8. [Backup & Disaster Recovery Tests](#backup--disaster-recovery-tests)
9. [Monitoring & Health Checks](#monitoring--health-checks)
10. [Periodic/Automated Tests](#periodicautomated-tests)
11. [Test Execution Reports](#test-execution-reports)
12. [Rollback Procedures](#rollback-procedures)

---

## Overview

The KubeChart platform consists of 4 main deployment phases:

1. **DataBase.sh** - PostgreSQL setup on host machine
2. **Platform.sh** - Kubernetes infrastructure (MetalLB, Envoy Gateway, cert-manager, Longhorn)
3. **BackupSys.sh** - Backup infrastructure (MinIO, Velero)
4. **k8s-deploy2.sh** - KubeChart application deployment

Testing must validate each phase and their interactions.

---

## Tools Required

### System Tools
- **kubectl** (v1.25+) - Kubernetes CLI
- **helm** (v3.10+) - Kubernetes package manager
- **docker** (v20.10+) - Container runtime
- **psql** (PostgreSQL client) - Database testing
- **curl** - HTTP requests testing
- **nc/netcat** - Network connectivity testing
- **bash** (v5+) - Scripting and automation
- **jq** (v1.6+) - JSON parsing and filtering
- **awk/sed** - Text processing

### Testing & Monitoring Tools
- **k9s** - Kubernetes dashboard (optional but recommended)
- **kubctl-debug** - Pod debugging
- **prometheus** - Metrics collection
- **grafana** - Metrics visualization
- **velero CLI** - Backup testing
- **minio CLI (mc)** - Object storage testing
- **Apache Bench (ab)** - Load testing (HTTP)
- **wrk** - HTTP benchmarking tool
- **sysbench** - Database benchmarking
- **openssl** - SSL/TLS testing
- **helm lint** - Helm chart validation

### Scripts & Automation
- **Custom test scripts** (bash)
- **Kubernetes manifests** (YAML)
- **Helm values** files

---

## Pre-Deployment Tests

### 1.1 Environment Verification
**Purpose:** Ensure host meets minimum requirements  
**Run Before:** Any deployment script  
**Expected Duration:** 5 minutes

```bash
# Test 1.1.1: Kubernetes Cluster Connectivity
TEST_NAME="Cluster Connectivity Check"
TEST_COMMAND="kubectl cluster-info"
EXPECTED_OUTPUT="Kubernetes master is running"
TIMEOUT="30s"

# Test 1.1.2: Node Availability
TEST_NAME="Node Ready Status"
TEST_COMMAND="kubectl get nodes -o jsonpath='{.items[*].status.conditions[?(@.type==\"Ready\")].status}'"
EXPECTED_OUTPUT="True" (for all nodes)
TIMEOUT="10s"

# Test 1.1.3: Sufficient Resources
TEST_NAME="Cluster Resource Check"
TEST_COMMAND="kubectl top nodes"
MINIMUM_CPU="2000m available per node"
MINIMUM_MEMORY="4Gi available per node"
TIMEOUT="15s"

# Test 1.1.4: Required CRDs Check
TEST_NAME="CRD Availability"
TEST_COMMAND="kubectl get crd"
REQUIRED_CRDS="None (checked after Platform.sh)"
TIMEOUT="10s"

# Test 1.1.5: Network Connectivity
TEST_NAME="Network Reachability"
TEST_COMMAND="kubectl run --image=alpine test-net -- sh -c 'ping -c 1 8.8.8.8'"
EXPECTED_OUTPUT="Successful ping response"
TIMEOUT="20s"
```

### 1.2 Prerequisites Validation
**Purpose:** Check all scripts and dependencies exist  
**Run Before:** Each deployment script

```bash
# Test 1.2.1: Script File Existence
REQUIRED_FILES=(
  "YAML samples/System/Platform.sh"
  "YAML samples/System/BackupSys.sh"
  "YAML samples/System/DataBase.sh"
  "k8s-deploy2.sh"
  "kubernetes/deployment.yaml"
  "kubernetes/postgres-statefulset.yaml"
  "kubernetes/service.yaml"
)
FOR EACH FILE:
  TEST: [ -f "$FILE" ] && echo "✓ File exists" || echo "✗ File missing"

# Test 1.2.2: Required Commands
REQUIRED_COMMANDS=("kubectl" "helm" "docker" "psql" "curl" "nc" "jq")
FOR EACH COMMAND:
  TEST: command -v $COMMAND >/dev/null 2>&1

# Test 1.2.3: Script Syntax Validation
FOR EACH SCRIPT:
  TEST: bash -n script.sh  # Syntax check without execution

# Test 1.2.4: Root Privileges Check
TEST: [ "$EUID" -eq 0 ] || echo "⚠ Root privileges may be required"

# Test 1.2.5: Disk Space Validation
MINIMUM_DISK_SPACE="50Gi"
TEST: df -BG / | awk 'NR==2 {print $4}'
```

---

## Component Installation Tests

### 2.1 DataBase.sh Tests (PostgreSQL Setup)

**Purpose:** Validate PostgreSQL installation and database creation  
**Expected Duration:** 15 minutes  
**Dependencies:** None (host-level setup)

```bash
# Test 2.1.1: PostgreSQL Service Status
TEST_NAME="PostgreSQL Service Running"
TEST_COMMAND="systemctl status postgresql"
EXPECTED_OUTPUT="active (running)"
TIMEOUT="10s"
PASS_CRITERIA="Exit code 0"

# Test 2.1.2: PostgreSQL Connection
TEST_NAME="PostgreSQL TCP Connectivity"
TEST_COMMAND="nc -zv localhost 5432"
EXPECTED_OUTPUT="Connection successful"
TIMEOUT="5s"

# Test 2.1.3: Database Exists
TEST_NAME="Database Creation"
TEST_COMMAND="psql -U deployer_user -d deployer -h localhost -c '\l'"
EXPECTED_OUTPUT="deployer database listed"
TIMEOUT="5s"

# Test 2.1.4: Test User Exists
TEST_NAME="Database User Creation"
TEST_COMMAND="psql -U postgres -d template1 -c '\du' | grep deployer_user"
EXPECTED_OUTPUT="deployer_user role exists"
TIMEOUT="5s"

# Test 2.1.5: Environment Variable Set
TEST_NAME="DATABASE_URL Environment Variable"
TEST_COMMAND="source /etc/profile.d/deployer-db.sh && echo $DATABASE_URL"
EXPECTED_OUTPUT="postgresql://deployer_user:deployer_password@localhost:5432/deployer"
TIMEOUT="5s"

# Test 2.1.6: Database User Permissions
TEST_NAME="User Has Required Permissions"
TEST_COMMAND="psql -U deployer_user -d deployer -c 'CREATE TABLE test (id INT); DROP TABLE test;'"
EXPECTED_OUTPUT="Success (no error)"
TIMEOUT="5s"

# Test 2.1.7: Connection Pool
TEST_NAME="Multiple Simultaneous Connections"
NUM_CONNECTIONS=10
TEST_COMMAND="for i in {1..10}; do psql -U deployer_user -d deployer -c 'SELECT 1' & done"
EXPECTED_OUTPUT="All 10 connections successful"
TIMEOUT="15s"

# Test 2.1.8: Data Persistence
TEST_NAME="Data Persists After Service Restart"
STEPS:
  1. Create test table: psql -U deployer_user -d deployer -c "CREATE TABLE persist_test (data TEXT);"
  2. Insert data: psql -U deployer_user -d deployer -c "INSERT INTO persist_test VALUES ('test_data');"
  3. Restart service: systemctl restart postgresql
  4. Query data: psql -U deployer_user -d deployer -c "SELECT * FROM persist_test;"
EXPECTED_OUTPUT="test_data retrieved after restart"
TIMEOUT="30s"
```

### 2.2 Platform.sh Tests (Infrastructure Setup)

**Purpose:** Validate Kubernetes components installation  
**Expected Duration:** 45 minutes  
**Dependencies:** DataBase.sh must be running

#### 2.2.1 Helm Installation
```bash
# Test 2.2.1.1: Helm Version
TEST_NAME="Helm Installed Correctly"
TEST_COMMAND="helm version --short"
EXPECTED_OUTPUT="v3.10+ (semantic versioning)"
TIMEOUT="5s"

# Test 2.2.1.2: Helm Repositories
TEST_NAME="Helm Repositories Added"
TEST_COMMAND="helm repo list | grep -E 'metallb|jetstack|envoyproxy'"
EXPECTED_OUTPUT="All three repos listed"
TIMEOUT="10s"
```

#### 2.2.2 MetalLB Installation
```bash
# Test 2.2.2.1: MetalLB Namespace
TEST_NAME="MetalLB Namespace Created"
TEST_COMMAND="kubectl get namespace metallb-system"
EXPECTED_OUTPUT="Active"
TIMEOUT="5s"

# Test 2.2.2.2: MetalLB Pods Running
TEST_NAME="MetalLB Controller & Speaker Pods"
TEST_COMMAND="kubectl -n metallb-system get pods | grep -E 'controller|speaker'"
EXPECTED_OUTPUT="2 pods running (controller and speaker)"
TIMEOUT="60s"

# Test 2.2.2.3: MetalLB CRDs
TEST_NAME="MetalLB CRDs Installed"
TEST_COMMAND="kubectl get crd | grep metallb"
EXPECTED_OUTPUT="addresspools.metallb.io, bfdprofiles.metallb.io, etc."
TIMEOUT="10s"

# Test 2.2.2.4: AddressPool Applied
TEST_NAME="MetalLB AddressPool Configuration"
TEST_COMMAND="kubectl -n metallb-system get addresspool"
EXPECTED_OUTPUT="At least 1 AddressPool configured"
TIMEOUT="10s"

# Test 2.2.2.5: IP Assignment Capability
TEST_NAME="MetalLB Can Assign LoadBalancer IPs"
STEPS:
  1. Create test service: kubectl apply -f - <<EOF
     apiVersion: v1
     kind: Service
     metadata:
       name: metallb-test
     spec:
       type: LoadBalancer
       selector:
         app: dummy
       ports:
       - port: 80
     EOF
  2. Wait for EXTERNAL-IP: kubectl get svc metallb-test -o jsonpath='{.status.loadBalancer.ingress[0].ip}'
EXPECTED_OUTPUT="Valid IP address (not <pending>)"
TIMEOUT="30s"
CLEANUP: kubectl delete svc metallb-test
```

#### 2.2.3 Envoy Gateway Installation
```bash
# Test 2.2.3.1: Envoy Gateway Namespace
TEST_NAME="Envoy Gateway Namespace"
TEST_COMMAND="kubectl get namespace envoy-gateway-system"
EXPECTED_OUTPUT="Active"
TIMEOUT="5s"

# Test 2.2.3.2: Envoy Gateway Pods
TEST_NAME="Envoy Gateway Controller Running"
TEST_COMMAND="kubectl -n envoy-gateway-system get pods | grep envoy-gateway"
EXPECTED_OUTPUT="Running (1+ pods)"
TIMEOUT="60s"

# Test 2.2.3.3: Envoy Gateway CRDs
TEST_NAME="Gateway API CRDs"
TEST_COMMAND="kubectl get crd | grep -E 'gateway|httproute|grpcroute'"
EXPECTED_OUTPUT="Multiple GatewayAPI CRDs listed"
TIMEOUT="10s"

# Test 2.2.3.4: Gateway Service Type
TEST_NAME="Gateway Service Has LoadBalancer Type"
TEST_COMMAND="kubectl -n envoy-gateway-system get svc | grep gateway-lb"
EXPECTED_OUTPUT="LoadBalancer type with EXTERNAL-IP assigned"
TIMEOUT="30s"

# Test 2.2.3.5: HTTPRoute Support
TEST_NAME="HTTPRoute CRD Functional"
TEST_COMMAND="kubectl apply --dry-run=server -f - <<EOF
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: test-route
spec:
  parentRefs:
  - name: platform-gateway
  hostnames:
  - test.example.com
  rules:
  - backendRefs:
    - name: test-backend
      port: 80
EOF"
EXPECTED_OUTPUT="Successfully validated (exit 0)"
TIMEOUT="10s"

# Test 2.2.3.6: Traffic Routing
TEST_NAME="Gateway Routes Traffic Correctly"
STEPS:
  1. Create test deployment: kubectl run test-app --image=nginx --port=80
  2. Expose: kubectl expose pod test-app --type=ClusterIP --port=80
  3. Create HTTPRoute pointing to test-app service
  4. Test curl via gateway IP
EXPECTED_OUTPUT="HTTP 200 response from gateway IP"
TIMEOUT="30s"
CLEANUP: kubectl delete pod test-app, svc test-app, httproute test-route
```

#### 2.2.4 cert-manager Installation
```bash
# Test 2.2.4.1: cert-manager Namespace
TEST_NAME="cert-manager Namespace"
TEST_COMMAND="kubectl get namespace cert-manager"
EXPECTED_OUTPUT="Active"
TIMEOUT="5s"

# Test 2.2.4.2: cert-manager Pods
TEST_NAME="cert-manager Deployments Running"
TEST_COMMAND="kubectl -n cert-manager get pods | grep -E 'cert-manager|webhook|cainjector'"
EXPECTED_OUTPUT="All 3 deployments running"
TIMEOUT="60s"

# Test 2.2.4.3: CRDs Installed
TEST_NAME="cert-manager CRDs"
TEST_COMMAND="kubectl get crd | grep cert-manager.io"
EXPECTED_OUTPUT="Certificate, Issuer, ClusterIssuer CRDs"
TIMEOUT="10s"

# Test 2.2.4.4: Webhook Ready
TEST_NAME="cert-manager Webhook Service"
TEST_COMMAND="kubectl -n cert-manager get svc cert-manager-webhook"
EXPECTED_OUTPUT="ClusterIP service available"
TIMEOUT="10s"

# Test 2.2.4.5: Certificate Creation
TEST_NAME="Can Create Self-Signed Certificate"
TEST_COMMAND="kubectl apply -f - <<EOF
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: self-signed-issuer
spec:
  selfSigned: {}
---
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: test-cert
spec:
  secretName: test-cert-secret
  commonName: example.com
  issuerRef:
    name: self-signed-issuer
    kind: ClusterIssuer
EOF"
EXPECTED_OUTPUT="Certificate ready in 30s"
TIMEOUT="45s"
CLEANUP: Delete Certificate and ClusterIssuer

# Test 2.2.4.6: Let's Encrypt Integration
TEST_NAME="ACME Issuer Configuration"
TEST_COMMAND="kubectl get clusterissuer cert-issuer-prod -o jsonpath='{.spec.acme.server}'"
EXPECTED_OUTPUT="https://acme-v02.api.letsencrypt.org/directory"
TIMEOUT="10s"

# Test 2.2.4.7: Certificate Auto-Renewal
TEST_NAME="Certificate Renewal Capability"
STEPS:
  1. Create certificate valid for short duration
  2. Wait 80% of validity period
  3. Check if renewed before expiration
EXPECTED_OUTPUT="Certificate renewed before expiration"
TIMEOUT="300s"
```

#### 2.2.5 Longhorn Installation
```bash
# Test 2.2.5.1: Longhorn Namespace
TEST_NAME="Longhorn Namespace"
TEST_COMMAND="kubectl get namespace longhorn-system"
EXPECTED_OUTPUT="Active"
TIMEOUT="5s"

# Test 2.2.5.2: Longhorn Components
TEST_NAME="Longhorn Manager & Engine Running"
TEST_COMMAND="kubectl -n longhorn-system get pods | grep -E 'longhorn-manager|longhorn-driver'"
EXPECTED_OUTPUT="Running pods found"
TIMEOUT="60s"

# Test 2.2.5.3: Longhorn CRDs
TEST_NAME="Longhorn CRDs"
TEST_COMMAND="kubectl get crd | grep longhorn.io"
EXPECTED_OUTPUT="volumes, engines, replicas, nodes CRDs"
TIMEOUT="10s"

# Test 2.2.5.4: StorageClass Created
TEST_NAME="Longhorn StorageClass"
TEST_COMMAND="kubectl get storageclass | grep -E 'longhorn|platform-storageclass'"
EXPECTED_OUTPUT="StorageClass with provisioner longhorn.io"
TIMEOUT="10s"

# Test 2.2.5.5: PVC Creation
TEST_NAME="Can Create Persistent Volume Claim"
TEST_COMMAND="kubectl apply -f - <<EOF
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: longhorn-test-pvc
spec:
  accessModes:
  - ReadWriteOnce
  storageClassName: platform-storageclass
  resources:
    requests:
      storage: 1Gi
EOF"
EXPECTED_OUTPUT="PVC bound within 30s"
TIMEOUT="45s"
CLEANUP: kubectl delete pvc longhorn-test-pvc

# Test 2.2.5.6: Pod Mount Volume
TEST_NAME="Pod Can Mount Longhorn Volume"
STEPS:
  1. Create PVC
  2. Create pod with volumeMount: kubectl run test-disk --image=alpine --overrides='...'
  3. Write file to mounted volume
  4. Delete and recreate pod
  5. Verify file still exists
EXPECTED_OUTPUT="Data persists after pod recreation"
TIMEOUT="60s"

# Test 2.2.5.7: Encryption Enabled
TEST_NAME="Longhorn Encryption Configuration"
TEST_COMMAND="kubectl -n longhorn-system get settings encryption-status"
EXPECTED_OUTPUT="Encryption enabled status shown"
TIMEOUT="10s"
```

### 2.3 BackupSys.sh Tests (Backup Infrastructure)

**Purpose:** Validate backup system installation  
**Expected Duration:** 30 minutes  
**Dependencies:** Platform.sh must be running

#### 2.3.1 MinIO Installation
```bash
# Test 2.3.1.1: MinIO Namespace
TEST_NAME="MinIO Namespace"
TEST_COMMAND="kubectl get namespace minio"
EXPECTED_OUTPUT="Active"
TIMEOUT="5s"

# Test 2.3.1.2: MinIO Pods
TEST_NAME="MinIO Server Running"
TEST_COMMAND="kubectl -n minio get pods | grep minio"
EXPECTED_OUTPUT="Running pod"
TIMEOUT="60s"

# Test 2.3.1.3: MinIO Service
TEST_NAME="MinIO Service"
TEST_COMMAND="kubectl -n minio get svc minio"
EXPECTED_OUTPUT="ClusterIP service available"
TIMEOUT="10s"

# Test 2.3.1.4: MinIO Connectivity
TEST_NAME="Can Connect to MinIO"
TEST_COMMAND="kubectl -n minio exec svc/minio -- mc admin info local"
EXPECTED_OUTPUT="MinIO admin info displayed"
TIMEOUT="15s"

# Test 2.3.1.5: Bucket Creation
TEST_NAME="Velero Bucket Exists"
TEST_COMMAND="kubectl -n minio exec svc/minio -- mc ls local/velero"
EXPECTED_OUTPUT="Bucket exists"
TIMEOUT="10s"

# Test 2.3.1.6: Object Upload/Download
TEST_NAME="MinIO Read/Write Capability"
STEPS:
  1. Put object: kubectl -n minio exec svc/minio -- mc cp /etc/hostname local/velero/test-file
  2. Get object: kubectl -n minio exec svc/minio -- mc cat local/velero/test-file
  3. Remove object: kubectl -n minio exec svc/minio -- mc rm local/velero/test-file
EXPECTED_OUTPUT="All operations successful"
TIMEOUT="20s"

# Test 2.3.1.7: MinIO Persistence
TEST_NAME="MinIO Data Persists"
STEPS:
  1. Create file in bucket
  2. Delete MinIO pod
  3. Wait for pod to restart
  4. Verify file still exists
EXPECTED_OUTPUT="Data persists after pod restart"
TIMEOUT="60s"
```

#### 2.3.2 Velero Installation
```bash
# Test 2.3.2.1: Velero Namespace
TEST_NAME="Velero Namespace"
TEST_COMMAND="kubectl get namespace velero"
EXPECTED_OUTPUT="Active"
TIMEOUT="5s"

# Test 2.3.2.2: Velero Pod
TEST_NAME="Velero Server Running"
TEST_COMMAND="kubectl -n velero get pods | grep velero"
EXPECTED_OUTPUT="Running pod"
TIMEOUT="60s"

# Test 2.3.2.3: Velero CLI
TEST_NAME="Velero CLI Installed"
TEST_COMMAND="velero version --client-only"
EXPECTED_OUTPUT="Version string (e.g., v1.17.0)"
TIMEOUT="5s"

# Test 2.3.2.4: BackupStorageLocation
TEST_NAME="BackupStorageLocation Configured"
TEST_COMMAND="velero backup-location get"
EXPECTED_OUTPUT="At least one location with Available=true"
TIMEOUT="10s"

# Test 2.3.2.5: Credentials Secret
TEST_NAME="Cloud Credentials Secret"
TEST_COMMAND="kubectl -n velero get secret cloud-credentials"
EXPECTED_OUTPUT="Secret exists"
TIMEOUT="5s"

# Test 2.3.2.6: Backup Creation
TEST_NAME="Can Create Backup"
STEPS:
  1. Create test namespace: kubectl create ns backup-test
  2. Create test resource: kubectl -n backup-test run test-app --image=alpine
  3. Start backup: velero backup create test-backup --include-namespaces backup-test
  4. Wait for completion: velero backup get test-backup
EXPECTED_OUTPUT="Backup status = Completed"
TIMEOUT="120s"

# Test 2.3.2.7: Backup Storage
TEST_NAME="Backup Stored in MinIO"
TEST_COMMAND="kubectl -n minio exec svc/minio -- mc ls local/velero"
EXPECTED_OUTPUT="Backup files visible in MinIO bucket"
TIMEOUT="15s"

# Test 2.3.2.8: Restore Capability
TEST_NAME="Can Restore from Backup"
STEPS:
  1. Delete test namespace: kubectl delete ns backup-test
  2. Start restore: velero restore create --from-backup test-backup
  3. Wait for completion: velero restore get <restore-name>
  4. Verify namespace restored: kubectl get ns backup-test
EXPECTED_OUTPUT="Namespace restored with resources"
TIMEOUT="120s"
CLEANUP: velero backup delete test-backup, kubectl delete ns backup-test
```

### 2.4 k8s-deploy2.sh Tests (Application Deployment)

**Purpose:** Validate KubeChart application deployment  
**Expected Duration:** 30 minutes  
**Dependencies:** DataBase.sh, Platform.sh, BackupSys.sh must be running

```bash
# Test 2.4.1: Namespace Creation
TEST_NAME="KubeChart Namespace"
TEST_COMMAND="kubectl get namespace kubechart"
EXPECTED_OUTPUT="Active"
TIMEOUT="5s"

# Test 2.4.2: ServiceAccount
TEST_NAME="ServiceAccount Created"
TEST_COMMAND="kubectl -n kubechart get serviceaccount kubechart"
EXPECTED_OUTPUT="ServiceAccount exists"
TIMEOUT="5s"

# Test 2.4.3: RBAC Resources
TEST_NAME="ClusterRole Created"
TEST_COMMAND="kubectl get clusterrole kubechart"
EXPECTED_OUTPUT="ClusterRole exists"
TIMEOUT="5s"

# Test 2.4.4: Secrets Created
TEST_NAME="Database Credentials Secret"
TEST_COMMAND="kubectl -n kubechart get secret kubechart-db-credentials"
EXPECTED_OUTPUT="Secret exists with keys: database-url, database-host, etc."
TIMEOUT="5s"

# Test 2.4.5: ConfigMap
TEST_NAME="Application ConfigMap"
TEST_COMMAND="kubectl -n kubechart get configmap kubechart-config"
EXPECTED_OUTPUT="ConfigMap exists with NODE_ENV, PORT, LOG_LEVEL"
TIMEOUT="5s"

# Test 2.4.6: PostgreSQL StatefulSet
TEST_NAME="PostgreSQL Deployment"
TEST_COMMAND="kubectl -n kubechart get statefulset postgres"
EXPECTED_OUTPUT="PostgreSQL StatefulSet running"
TIMEOUT="60s"

# Test 2.4.7: PostgreSQL Pod Ready
TEST_NAME="PostgreSQL Pod Readiness"
TEST_COMMAND="kubectl -n kubechart wait --for=condition=ready pod postgres-0 --timeout=300s"
EXPECTED_OUTPUT="Condition met"
TIMEOUT="300s"

# Test 2.4.8: Database Connection from App
TEST_NAME="Database Accessible from Deployment"
TEST_COMMAND="kubectl -n kubechart exec postgres-0 -- psql -U deployer_user -d kubechart -c 'SELECT 1' "
EXPECTED_OUTPUT="Query returns 1"
TIMEOUT="10s"

# Test 2.4.9: KubeChart Deployment
TEST_NAME="KubeChart Deployment Created"
TEST_COMMAND="kubectl -n kubechart get deployment kubechart"
EXPECTED_OUTPUT="Deployment with 3 replicas"
TIMEOUT="5s"

# Test 2.4.10: KubeChart Pods Running
TEST_NAME="KubeChart Pods Ready"
TEST_COMMAND="kubectl -n kubechart wait --for=condition=ready pod -l app=kubechart --timeout=300s"
EXPECTED_OUTPUT="3 pods ready"
TIMEOUT="300s"

# Test 2.4.11: Service Created
TEST_NAME="KubeChart Service"
TEST_COMMAND="kubectl -n kubechart get svc kubechart"
EXPECTED_OUTPUT="ClusterIP service"
TIMEOUT="5s"

# Test 2.4.12: HTTPRoute Created
TEST_NAME="HTTPRoute for KubeChart"
TEST_COMMAND="kubectl get httproute -A | grep kubechart"
EXPECTED_OUTPUT="HTTPRoute in kubechart namespace"
TIMEOUT="10s"

# Test 2.4.13: Application Health
TEST_NAME="Health Check Endpoint"
TEST_COMMAND="kubectl -n kubechart port-forward svc/kubechart 3000:3000 &
sleep 2
curl -s http://localhost:3000/api/ping"
EXPECTED_OUTPUT="200 OK response"
TIMEOUT="15s"

# Test 2.4.14: HPA Created
TEST_NAME="Horizontal Pod Autoscaler"
TEST_COMMAND="kubectl -n kubechart get hpa kubechart"
EXPECTED_OUTPUT="HPA configured with min/max replicas"
TIMEOUT="5s"

# Test 2.4.15: PVC for PostgreSQL
TEST_NAME="PostgreSQL Storage"
TEST_COMMAND="kubectl -n kubechart get pvc postgres-storage-postgres-0"
EXPECTED_OUTPUT="PVC bound with Longhorn storage"
TIMEOUT="10s"

# Test 2.4.16: Application Logs
TEST_NAME="No Critical Errors in Logs"
TEST_COMMAND="kubectl -n kubechart logs -l app=kubechart --tail=100 | grep -iE 'error|fatal|exception'"
EXPECTED_OUTPUT="No critical errors (exit code 1 = good)"
TIMEOUT="10s"

# Test 2.4.17: Database Tables Created
TEST_NAME="Tables Initialize on Startup"
TEST_COMMAND="kubectl -n kubechart exec postgres-0 -- psql -U deployer_user -d kubechart -c '\dt'"
EXPECTED_OUTPUT="users and deployments tables"
TIMEOUT="15s"

# Test 2.4.18: API Endpoints
TEST_NAME="REST API Endpoints"
ENDPOINTS=(
  "/api/auth/signup"
  "/api/auth/login"
  "/api/deployments"
  "/api/health"
)
FOR EACH ENDPOINT:
  TEST: curl -s -X GET http://localhost:3000$ENDPOINT
  EXPECTED: Response code 200, 400, or 401 (not 500)

# Test 2.4.19: Resource Limits Enforced
TEST_NAME="Resource Quotas Applied"
TEST_COMMAND="kubectl -n kubechart get resourcequota"
EXPECTED_OUTPUT="ResourceQuota created if specified"
TIMEOUT="5s"

# Test 2.4.20: Pod Anti-Affinity
TEST_NAME="Pods Spread Across Nodes"
TEST_COMMAND="kubectl -n kubechart get pods -l app=kubechart -o wide"
EXPECTED_OUTPUT="Pods on different nodes (if multi-node cluster)"
TIMEOUT="5s"
```

---

## Integration Tests

**Purpose:** Test interactions between components  
**Expected Duration:** 60 minutes

### 3.1 Database to Application
```bash
# Test 3.1.1: Application Can Read from Database
TEST_NAME="App DB Read Access"
STEPS:
  1. Create test user via API: curl -X POST /api/auth/signup -d '{"username":"testuser","email":"test@example.com","password":"pass123"}'
  2. Verify in database: psql -U deployer_user -d kubechart -c "SELECT COUNT(*) FROM users;"
EXPECTED: User count incremented

# Test 3.1.2: Application Can Write to Database
TEST_NAME="App DB Write Access"
STEPS:
  1. Create deployment via API
  2. Check database: SELECT COUNT(*) FROM deployments
EXPECTED: Deployment count incremented

# Test 3.1.3: Data Integrity
TEST_NAME="Database Data Consistency"
STEPS:
  1. Create multiple resources simultaneously
  2. Verify all recorded in database
  3. Check for duplicates or missing records
EXPECTED: All records present, no duplicates
```

### 3.2 Storage to Application
```bash
# Test 3.2.1: Application Can Use Persistent Storage
TEST_NAME="Volume Mount Access"
STEPS:
  1. Deployment has volumes mounted
  2. Write file to mounted volume
  3. Kill and recreate pod
  4. Verify file exists
EXPECTED: File persists after pod recreation

# Test 3.2.2: Storage Auto-Expansion
TEST_NAME="PVC Auto-Expansion"
STEPS:
  1. Monitor PVC usage
  2. Fill storage to threshold
  3. Check if PVC auto-expands (if configured)
EXPECTED: PVC expands or reaches max capacity gracefully
```

### 3.3 Gateway to Application
```bash
# Test 3.3.1: Traffic Routes Through Gateway
TEST_NAME="Requests Reach Application"
STEPS:
  1. Identify gateway EXTERNAL-IP
  2. curl http://{EXTERNAL-IP}/ (via HTTPRoute)
  3. Verify response from KubeChart
EXPECTED: HTTP 200 with KubeChart response

# Test 3.3.2: TLS/HTTPS Works
TEST_NAME="HTTPS Connectivity"
STEPS:
  1. Certificate should be valid
  2. curl -k https://{EXTERNAL-IP}/
  3. Check certificate chain
EXPECTED: Valid certificate, HTTP 200 response

# Test 3.3.3: Multiple Instances Load Balance
TEST_NAME="Load Balancing"
STEPS:
  1. Make 30 requests to /api/health
  2. Log pod name handling each request
  3. Verify requests distributed across replicas
EXPECTED: Requests distributed fairly

# Test 3.3.4: Health Check Probes
TEST_NAME="Liveness & Readiness Probes"
STEPS:
  1. Kill application process in pod
  2. Observe pod restart (liveness probe)
  3. Verify 30s startup wait (readiness delay)
EXPECTED: Pod restarts within 30s
```

### 3.4 Backup to Storage
```bash
# Test 3.4.1: Backup Integration
TEST_NAME="Backup Can Access Storage"
STEPS:
  1. Trigger manual backup
  2. Verify backup stored in MinIO
  3. Check backup size > 1MB
EXPECTED: Backup successfully stored

# Test 3.4.2: Backup Encryption
TEST_NAME="Backup Data Encrypted"
STEPS:
  1. Create backup
  2. Check file in MinIO bucket
  3. Attempt to read raw: mc cat local/velero/backup-file
EXPECTED: Binary/encrypted content (not readable text)
```

---

## Performance & Load Tests

**Purpose:** Validate system under load  
**Expected Duration:** 90 minutes

### 4.1 API Load Testing
```bash
# Test 4.1.1: HTTP Throughput
TEST_TOOL="Apache Bench (ab) or wrk"
TEST_COMMAND="ab -n 10000 -c 100 http://localhost:3000/api/health"
METRICS:
  - Requests per second
  - Average response time
  - 95th percentile latency
  - Error rate
EXPECTATIONS:
  - RPS: >100 requests/second
  - Avg latency: <100ms
  - P95 latency: <500ms
  - Error rate: <1%

# Test 4.1.2: Concurrent Connections
TEST_COMMAND="wrk -t4 -c100 -d30s http://localhost:3000/api/health"
EXPECTATIONS:
  - Stable response times
  - <1% error rate
  - No connection timeouts

# Test 4.1.3: Application Scaling
STEPS:
  1. Start with 1 replica
  2. Increase load with ab/wrk
  3. Monitor HPA metrics
  4. Verify new replicas spawn
EXPECTATIONS:
  - New pods created when CPU/memory threshold reached
  - Response times remain consistent
```

### 4.2 Database Performance
```bash
# Test 4.2.1: Query Performance
TEST_TOOL="sysbench or custom script"
TEST_COMMAND="sysbench /usr/share/sysbench/oltp_prepare.lua --tables=10 --table-size=100000 run"
METRICS:
  - Queries per second
  - Average query time
  - 99th percentile latency
EXPECTATIONS:
  - QPS: >1000 for simple queries
  - Avg latency: <10ms

# Test 4.2.2: Connection Pool
STEPS:
  1. 50 simultaneous connections
  2. Each executing simple query
  3. Monitor connection pool utilization
EXPECTATIONS:
  - All connections successful
  - No connection rejections
  - Pool properly balanced
```

### 4.3 Storage Performance
```bash
# Test 4.3.1: Disk I/O
TEST_COMMAND="fio --name=randread --ioengine=libaio --iodepth=16 --rw=randread --bs=4k --direct=1 --size=1G --numjobs=4 --runtime=30"
METRICS:
  - IOPS (Input/Output Per Second)
  - Bandwidth (MB/s)
EXPECTATIONS:
  - IOPS: >10000
  - Bandwidth: >200 MB/s

# Test 4.3.2: Pod Volume Mount
STEPS:
  1. Write large file to mounted volume
  2. Measure write speed
  3. Read file back
  4. Measure read speed
EXPECTATIONS:
  - Write: >100 MB/s
  - Read: >200 MB/s
```

### 4.4 Network Performance
```bash
# Test 4.4.1: Latency
TEST_COMMAND="ping kubernetes-service-ip -c 100"
EXPECTATIONS:
  - Average latency: <10ms
  - Packet loss: 0%

# Test 4.4.2: Throughput
TEST_TOOL="iperf3"
TEST_COMMAND="iperf3 -s  # server in pod
             iperf3 -c pod-ip -t 30"
EXPECTATIONS:
  - Throughput: >1 Gbps
```

---

## Security Tests

**Purpose:** Validate security posture  
**Expected Duration:** 60 minutes

### 5.1 Authentication & Authorization
```bash
# Test 5.1.1: Invalid Credentials Rejected
TEST_COMMAND="curl -X POST /api/auth/login -d '{\"username\":\"wrong\",\"password\":\"wrong\"}'"
EXPECTED: HTTP 401, no token returned

# Test 5.1.2: JWT Token Validation
STEPS:
  1. Obtain valid token
  2. Modify token payload
  3. Use modified token in request
EXPECTED: HTTP 401, request rejected

# Test 5.1.3: Token Expiration
STEPS:
  1. Obtain token
  2. Wait for expiration (or set short TTL)
  3. Use expired token
EXPECTED: HTTP 401, token rejected

# Test 5.1.4: RBAC Enforcement
STEPS:
  1. User A creates deployment
  2. User B attempts to delete User A's deployment
EXPECTED: HTTP 403, deletion denied

# Test 5.1.5: ServiceAccount Permissions
TEST_COMMAND="kubectl auth can-i create deployments --as=system:serviceaccount:kubechart:kubechart"
EXPECTED: yes

# Test 5.1.6: Cross-Namespace Access
STEPS:
  1. App in kubechart namespace
  2. Attempt to list resources in kube-system
EXPECTED: Denied or limited results
```

### 5.2 Data Security
```bash
# Test 5.2.1: Password Hashing
STEPS:
  1. Create user with password
  2. Check database: SELECT password_hash FROM users
EXPECTED: Hash != plaintext password (bcrypt format)

# Test 5.2.2: Secret Encryption
STEPS:
  1. Create secret: kubectl create secret generic test-secret --from-literal=password=test123
  2. Read raw etcd data (if accessible)
EXPECTED: Data encrypted at rest

# Test 5.2.3: Database Credentials
TEST_COMMAND="kubectl -n kubechart get secret kubechart-db-credentials -o yaml"
EXPECTED: Values base64 encoded (not exposed in logs/output)
```

### 5.3 Network Security
```bash
# Test 5.3.1: NetworkPolicy Enforcement
STEPS:
  1. Create two pods in different namespaces
  2. Attempt ping/connection
EXPECTED: Connection denied (if NetworkPolicy applied)

# Test 5.3.2: TLS Encryption
TEST_COMMAND="curl -v https://api.example.com/ 2>&1 | grep -E 'TLS|SSL|cipher'"
EXPECTED: TLS 1.2+ with strong cipher suite

# Test 5.3.3: Pod-to-API Server Communication
STEPS:
  1. From app pod: curl -k https://kubernetes.default.svc
  2. Check certificate chain
EXPECTED: Valid kubernetes CA certificate

# Test 5.3.4: Service Account Token
STEPS:
  1. Verify token mounted in pod
  2. Attempt unauthorized API call
EXPECTED: Authorization denied

# Test 5.3.5: API Rate Limiting
STEPS:
  1. Make 100+ requests rapidly
  2. Monitor for 429 responses
EXPECTED: Requests throttled after threshold
```

### 5.4 Container Security
```bash
# Test 5.4.1: Non-Root User
TEST_COMMAND="kubectl -n kubechart exec kubechart-pod -- id"
EXPECTED: uid != 0 (not running as root)

# Test 5.4.2: Read-Only Root Filesystem
STEPS:
  1. Attempt to write to root filesystem
  2. Check security context
EXPECTED: Write denied (if configured)

# Test 5.4.3: Capability Restrictions
TEST_COMMAND="kubectl -n kubechart exec kubechart-pod -- cat /proc/1/status | grep Cap"
EXPECTED: Only necessary capabilities enabled

# Test 5.4.4: Image Scanning
TEST_COMMAND="trivy image yoghlol/pracainz:va1"  (requires Trivy tool)
EXPECTED: <10 critical vulnerabilities

# Test 5.4.5: Privilege Escalation Prevention
TEST_COMMAND="kubectl -n kubechart get pod kubechart-0 -o jsonpath='{.spec.containers[0].securityContext.allowPrivilegeEscalation}'"
EXPECTED: false
```

### 5.5 RBAC & Audit
```bash
# Test 5.5.1: Audit Logging
TEST_COMMAND="kubectl get events -A | grep 'kubechart-pod'"
EXPECTED: Actions logged (if audit enabled)

# Test 5.5.2: Resource Deletion Audit
STEPS:
  1. Delete a resource
  2. Check audit logs
EXPECTED: Deletion action logged with user/timestamp

# Test 5.5.3: Unauthorized Access Attempt
STEPS:
  1. Attempt cluster admin operation without permission
  2. Check audit logs
EXPECTED: Denial logged
```

---

## Backup & Disaster Recovery Tests

**Purpose:** Validate backup/recovery procedures  
**Expected Duration:** 120 minutes

### 6.1 Backup Creation & Verification
```bash
# Test 6.1.1: Manual Backup
TEST_COMMAND="velero backup create pre-deployment-backup --include-namespaces kubechart"
EXPECTED: Backup completes successfully

# Test 6.1.2: Backup Verification
STEPS:
  1. Wait for backup to complete
  2. Check backup status: velero backup describe pre-deployment-backup
  3. Verify in MinIO: kubectl -n minio exec svc/minio -- mc ls local/velero
EXPECTED: Backup size > 100MB, status = Completed

# Test 6.1.3: Multiple Backups
STEPS:
  1. Create 3 backups sequentially
  2. List all: velero backup get
EXPECTED: All 3 present with different timestamps

# Test 6.1.4: Scheduled Backups
STEPS:
  1. Create schedule: velero schedule create daily-backup --schedule="0 2 * * *"
  2. Wait 24+ hours
EXPECTED: Automatic backups created on schedule

# Test 6.1.5: Backup Retention
STEPS:
  1. Create backup with TTL (time to live)
  2. Wait for TTL expiration
EXPECTED: Old backup automatically deleted

# Test 6.1.6: Backup with Included Resources
STEPS:
  1. Create backup with specific resources only
  2. Verify only those resources in backup
EXPECTED: Backup size smaller, contains only selected resources
```

### 6.2 Disaster Recovery Scenarios
```bash
# Test 6.2.1: Complete Namespace Restore
DISASTER_SCENARIO="Delete entire kubechart namespace"
RECOVERY_STEPS:
  1. kubectl delete namespace kubechart
  2. Verify namespace gone: kubectl get ns kubechart (should fail)
  3. Restore: velero restore create --from-backup pre-deployment-backup
  4. Verify: kubectl get all -n kubechart
EXPECTED: Namespace and all resources restored

# Test 6.2.2: Single Deployment Restore
DISASTER_SCENARIO="Delete specific deployment"
RECOVERY_STEPS:
  1. kubectl -n kubechart delete deployment kubechart
  2. Restore single resource: velero restore create --from-backup pre-deployment-backup --restore-only-resources=deployments
  3. Verify: kubectl -n kubechart get deployment kubechart
EXPECTED: Only deployment restored, other resources unchanged

# Test 6.2.3: Partial Data Loss Recovery
DISASTER_SCENARIO="Database corrupted/tables dropped"
RECOVERY_STEPS:
  1. Drop table: kubectl -n kubechart exec postgres-0 -- psql -U postgres -d kubechart -c "DROP TABLE users;"
  2. Verify lost: kubectl -n kubechart exec postgres-0 -- psql -U postgres -d kubechart -c "\dt" (table gone)
  3. Restore volume from snapshot (if snapshots enabled)
  4. Or restore full backup and migrate data
EXPECTED: Database restored to pre-disaster state

# Test 6.2.4: Multiple Node Failure
DISASTER_SCENARIO="Simulate node crash"
RECOVERY_STEPS:
  1. In multi-node cluster, simulate node failure
  2. Observe pods evicted from failed node
  3. Verify pods restart on healthy nodes
  4. Check data/services accessible
EXPECTED: Services continue, data not lost

# Test 6.2.5: Etcd Backup/Restore
STEPS:
  1. Backup etcd: kubectl exec -n kube-system etcd-<node> -- etcdctl snapshot save /backup/etcd.db
  2. Verify backup: etcdctl snapshot status /backup/etcd.db
  3. Simulate etcd corruption/failure
  4. Restore: etcdctl snapshot restore /backup/etcd.db
EXPECTED: Cluster state recovered

# Test 6.2.6: Storage Failure Recovery
STEPS:
  1. Simulate persistent volume failure
  2. Observe pod unable to mount
  3. Replace/restore volume from backup
  4. Verify pod mounts new volume
EXPECTED: Pod resumes with recovered data
```

### 6.3 Restore Validation
```bash
# Test 6.3.1: Data Integrity After Restore
STEPS:
  1. Perform full restore
  2. Run data validation queries
  3. Check row counts, checksums
EXPECTED: Data matches pre-disaster state

# Test 6.3.2: Application Functionality Post-Restore
STEPS:
  1. Restore from backup
  2. Run API health checks
  3. Create new deployment via API
  4. Verify database operations work
EXPECTED: All operations succeed

# Test 6.3.3: Performance After Restore
STEPS:
  1. Run load test before and after restore
  2. Compare metrics
EXPECTED: Performance within 10% of baseline

# Test 6.3.4: User Sessions After Restore
STEPS:
  1. Create user session before disaster
  2. Simulate disaster and restore
  3. Verify user can still access account
EXPECTED: Session/data persists
```

---

## Monitoring & Health Checks

**Purpose:** Continuous system health verification  
**Expected Duration:** 30 minutes setup + ongoing

### 7.1 Health Check Endpoints
```bash
# Test 7.1.1: Application Health Endpoint
ENDPOINT="/api/ping"
FREQUENCY="Every 10 seconds"
EXPECTED_RESPONSE="HTTP 200, 'OK' body"
ACTION_ON_FAILURE="Alert, log event"

# Test 7.1.2: Database Health
ENDPOINT="/api/health/db"
FREQUENCY="Every 30 seconds"
CHECK: Application can connect to database
EXPECTED_RESPONSE="HTTP 200 if database accessible"

# Test 7.1.3: Kubernetes API Health
FREQUENCY="Every 60 seconds"
CHECK: kubectl cluster-info
EXPECTED_RESPONSE="Kubernetes master available"

# Test 7.1.4: Persistent Storage Health
FREQUENCY="Every 120 seconds"
CHECK: PVC status, usage percentage
EXPECTED: All PVCs bound, <90% utilization

# Test 7.1.5: Certificate Expiration
FREQUENCY="Every 24 hours"
CHECK: kubectl get certificate -A -o jsonpath='{.items[*].status.expirationTime}'
EXPECTED: All certificates valid for >30 days
```

### 7.2 Metrics Collection
```bash
# Prometheus Targets
METRICS_TO_COLLECT:
  - Container CPU usage
  - Container memory usage
  - Pod creation/deletion rate
  - API request latency (p50, p95, p99)
  - API request count by endpoint
  - Database query latency
  - Database connection count
  - Disk usage (etcd, PostgreSQL volumes)
  - Network I/O (bytes in/out)
  - Node CPU, memory, disk availability

PROMETHEUS_SCRAPE_INTERVAL="30s"
RETENTION="30d"

# Grafana Dashboards
DASHBOARDS:
  - Cluster Overview (CPU, memory, disk, nodes)
  - Application Metrics (RPS, latency, errors)
  - Database Metrics (connections, queries, replication)
  - Storage Metrics (PVC usage, I/O performance)
  - Network Metrics (ingress/egress, latency)
  - Cost Metrics (resource allocation vs actual usage)
```

### 7.3 Alerting Rules
```bash
# Alert: High CPU Usage
CONDITION: "container_cpu_usage_seconds_total > 80% for 5 minutes"
SEVERITY: Warning
ACTION: Notify ops team, check HPA scaling

# Alert: High Memory Usage
CONDITION: "container_memory_usage_bytes / container_spec_memory_limit_bytes > 85% for 5 minutes"
SEVERITY: Warning
ACTION: Notify ops team, check for memory leak

# Alert: Pod Restart Loop
CONDITION: "rate(kube_pod_container_status_restarts_total[15m]) > 0.1"
SEVERITY: Critical
ACTION: Page oncall, restart pod investigation

# Alert: Database Connection Pool Exhausted
CONDITION: "postgresql_stat_activity_count > max_connections * 0.9"
SEVERITY: Critical
ACTION: Page oncall, increase connections or kill idle connections

# Alert: Disk Usage Critical
CONDITION: "kubelet_volume_stats_used_bytes / kubelet_volume_stats_capacity_bytes > 95%"
SEVERITY: Critical
ACTION: Page oncall, expand PVC or delete old data

# Alert: Certificate Expiring Soon
CONDITION: "certmanager_certificate_expiration_timestamp_seconds - now() < 604800"  (7 days)
SEVERITY: Warning
ACTION: Check cert renewal, manual intervention if needed

# Alert: Network Latency High
CONDITION: "histogram_quantile(0.99, request_duration_seconds) > 1"  (1 second)
SEVERITY: Warning
ACTION: Investigate gateway/network, check for congestion

# Alert: API Error Rate
CONDITION: "rate(http_requests_total{status=~'5..'}[5m]) / rate(http_requests_total[5m]) > 0.05"  (5%)
SEVERITY: Warning
ACTION: Check application logs, investigate error source

# Alert: Backup Failure
CONDITION: "velero_backup_success == 0"
SEVERITY: Critical
ACTION: Page oncall, check Velero logs, verify MinIO connectivity

# Alert: Cluster Node Down
CONDITION: "kube_node_status_condition{condition='Ready',status='true'} == 0"
SEVERITY: Critical
ACTION: Page oncall, investigate node, plan recovery
```

### 7.4 Logging
```bash
# Centralized Logging Stack
COMPONENTS:
  - Fluentd/Filebeat (log collection)
  - Elasticsearch/Loki (log storage)
  - Kibana/Grafana (log visualization)

LOG_LEVELS_TO_CAPTURE:
  - ERROR: Application errors
  - WARN: Warnings/degraded conditions
  - INFO: Key events (startup, shutdown, deployments)
  - DEBUG: Detailed operation flow (optional, verbose)

RETENTION_POLICY:
  - ERROR/WARN: 90 days
  - INFO: 30 days
  - DEBUG: 7 days

IMPORTANT_LOG_MESSAGES:
  - "ERROR.*database connection failed"
  - "ERROR.*authentication failure"
  - "ERROR.*deployment failed"
  - "WARN.*certificate expiring"
  - "WARN.*high memory usage"
  - "INFO.*user signup"
  - "INFO.*deployment created"
```

---

## Periodic/Automated Tests

**Purpose:** Scheduled validation of system health  
**Automation Tool:** Kubernetes CronJob + shell scripts

### 8.1 Hourly Tests (High Frequency)
```bash
SCHEDULE="0 * * * *"  # Every hour

TESTS:
  1. Health endpoint check (all components)
  2. API availability test
  3. Database connectivity test
  4. Certificate expiration check
  5. Pod restart monitoring

TIMEOUT: 5 minutes
FAILURE_ACTION: Log event, trigger if >3 consecutive failures
```

### 8.2 Daily Tests (Daily)
```bash
SCHEDULE="0 2 * * *"  # 2 AM daily

TESTS:
  1. Full integration test suite
  2. Data consistency check (database)
  3. Storage health check
  4. Backup completion verification
  5. Load test (100 requests/second for 5 minutes)
  6. Certificate renewal test
  7. Security posture check (permissions, policies)

TIMEOUT: 30 minutes
FAILURE_ACTION: Alert ops team, create incident
REPORTS: Generate daily health report
```

### 8.3 Weekly Tests (Weekly)
```bash
SCHEDULE="0 3 * * 0"  # Sunday 3 AM

TESTS:
  1. Disaster recovery drill (restore to staging)
  2. Database integrity check (fsck-like operation)
  3. Network performance baseline
  4. Full security audit
  5. Capacity planning analysis
  6. Upgrade readiness test
  7. Configuration drift detection

TIMEOUT: 60 minutes
FAILURE_ACTION: Alert security team, create issue
REPORTS: Generate weekly security/performance report
```

### 8.4 Monthly Tests (Monthly)
```bash
SCHEDULE="0 4 1 * *"  # 1st of month, 4 AM

TESTS:
  1. Full production backup/restore test
  2. Multi-node failure scenario simulation
  3. Disaster recovery full playbook test
  4. Vulnerability scanning
  5. Compliance audit
  6. Cost analysis
  7. Performance regression test

TIMEOUT: 120 minutes
FAILURE_ACTION: Executive notification, create critical issue
REPORTS: Generate comprehensive monthly report
```

### 8.5 Continuous Tests (Ongoing)
```bash
# These run constantly with results streamed

TESTS:
  1. Metrics collection (30s interval)
  2. Log aggregation (real-time)
  3. Pod monitoring (watch)
  4. Event tracking (real-time)
  5. Alerting system (real-time)

DASHBOARDS: Always-on display in monitoring room
```

### 8.6 Test Automation Script Structure
```bash
#!/bin/bash
# monitoring/periodic-tests.sh

REPORT_DIR="/var/log/kubechart/test-reports"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_FILE="$REPORT_DIR/test-report-$TIMESTAMP.log"

# Function to log test results
log_test() {
  local name=$1
  local status=$2
  local message=$3
  echo "[$(date)] [$status] $name: $message" >> "$REPORT_FILE"
  echo "[$status] $name" >> "$REPORT_FILE.summary"
}

# Function to alert on failure
alert_failure() {
  local test=$1
  local message=$2
  # Send to monitoring system, create incident, etc.
  curl -X POST https://alerting.example.com/api/alerts \
    -H "Content-Type: application/json" \
    -d "{\"test\":\"$test\",\"message\":\"$message\",\"severity\":\"critical\"}"
}

# Run tests
echo "Starting periodic tests at $(date)" >> "$REPORT_FILE"

# Hourly tests
if [ "$(date +%H)" = "*/1" ]; then
  test_health_endpoints
  test_database_connectivity
  test_api_availability
fi

# Daily tests
if [ "$(date +%H)" = "02" ]; then
  test_full_integration
  test_data_consistency
  test_backup_completion
fi

# Weekly tests
if [ "$(date +%A)" = "Sunday" ] && [ "$(date +%H)" = "03" ]; then
  test_disaster_recovery_drill
  test_database_integrity
  test_security_posture
fi

# Generate report
generate_report "$REPORT_FILE"
```

---

## Test Execution Reports

### 9.1 Report Format
```
KubeChart Platform Test Report
Generated: 2024-01-27 02:30:00 UTC
Duration: 45 minutes
Total Tests: 127
Passed: 125 (98.4%)
Failed: 2 (1.6%)
Skipped: 0

SUMMARY BY COMPONENT:
├── PostgreSQL Database: 15/15 PASSED
├── MetalLB: 7/7 PASSED
├── Envoy Gateway: 8/8 PASSED
├── cert-manager: 7/7 PASSED
├── Longhorn: 8/8 PASSED
├── MinIO: 7/7 PASSED
├── Velero: 8/8 PASSED
├── KubeChart App: 20/20 PASSED
├── Integration: 8/8 PASSED
├── Performance: 12/12 PASSED
├── Security: 15/13 FAILED  ← Review needed
└── Backup/Recovery: 7/6 FAILED  ← Review needed

FAILURES:
1. Test 5.2.2 (Secret Encryption): FAILED
   Expected: Data encrypted at rest
   Actual: Could not verify encryption
   Action Required: Investigate etcd encryption settings
   Severity: High
   
2. Test 6.1.2 (Backup Verification): FAILED
   Expected: Backup size > 100MB
   Actual: Backup size = 45MB
   Action Required: Check what's missing from backup
   Severity: Medium

PERFORMANCE METRICS:
- API Response Time (p95): 125ms (target: <500ms) ✓
- Database Query Time (avg): 8ms (target: <10ms) ✓
- Disk I/O Throughput: 220 MB/s (target: >200MB/s) ✓
- Pod Startup Time: 35s (target: <60s) ✓

SECURITY POSTURE:
- All pods running as non-root: ✓
- All secrets encrypted: Partial ✗
- RBAC properly enforced: ✓
- NetworkPolicies applied: ✓
- Certificates valid: ✓

RECOMMENDATIONS:
1. Enable etcd encryption immediately
2. Investigate Velero backup scope
3. Schedule follow-up security audit
4. Plan certificate renewal (due in 60 days)

Next Test: 2024-01-27 03:00:00 UTC (Hourly check)
```

### 9.2 Metrics Collection
```bash
METRICS_TO_REPORT:
  - Test execution time
  - Pass/fail rates by category
  - Performance metrics vs baselines
  - Error rates and types
  - Resource utilization during tests
  - Cost impact of test resources
  - Trend analysis (improving/degrading)

REPORTING_FREQUENCY:
  - Real-time: Dashboard updates
  - Hourly: Summary email
  - Daily: Detailed report
  - Weekly: Executive summary
  - Monthly: Comprehensive analysis
```

---

## Rollback Procedures

### 10.1 Rollback Decision Tree
```
Test Failure Detected
    ├─ Severity: Critical (system down)
    │  └─ Action: IMMEDIATE ROLLBACK
    │
    ├─ Severity: High (major functionality broken)
    │  └─ Action: ROLLBACK if can't fix in 30min
    │
    ├─ Severity: Medium (degraded performance)
    │  └─ Action: Gather info, escalate, consider rollback
    │
    └─ Severity: Low (minor issue)
       └─ Action: Log, plan fix, continue monitoring
```

### 10.2 Rollback Procedures by Component

#### 10.2.1 KubeChart Application Rollback
```bash
# Previous deployment still exists if using rolling update
kubectl rollout undo deployment/kubechart -n kubechart

# Or revert to previous image
kubectl set image deployment/kubechart \
  kubechart=yoghlol/pracainz:previous-tag \
  -n kubechart

# Verify rollback
kubectl rollout status deployment/kubechart -n kubechart
```

#### 10.2.2 Platform Component Rollback
```bash
# Helm rollback (for MetalLB, Envoy Gateway, etc.)
helm rollback metallb 0 -n metallb-system
helm rollback eg 0 -n envoy-gateway-system
helm rollback cert-manager 0 -n cert-manager

# Verify
kubectl get all -n metallb-system
```

#### 10.2.3 Database Rollback
```bash
# Restore from backup
velero restore create --from-backup pre-change-backup

# Verify
kubectl -n kubechart exec postgres-0 -- psql -U deployer_user -d kubechart -c "\dt"
```

#### 10.2.4 Complete Environment Rollback
```bash
# 1. Delete current deployment
kubectl delete namespace kubechart

# 2. Restore from full backup
velero restore create --from-backup full-environment-backup

# 3. Verify all components
kubectl get all -n kubechart
kubectl -n kubechart get statefulset postgres
velero backup-location get
```

### 10.3 Rollback Testing
```bash
# Test rollback procedures regularly
SCHEDULE="Monthly"
PROCEDURE:
  1. Deploy new version to staging
  2. Simulate failure
  3. Execute rollback procedure
  4. Verify system operational
  5. Document lessons learned
```

---

## Test Execution Checklist

Use this checklist to execute complete test suite:

```
PRE-DEPLOYMENT
  [ ] Environment validation (1.1)
  [ ] Prerequisites check (1.2)
  [ ] Backups of existing systems created

COMPONENT TESTS
  [ ] PostgreSQL tests (2.1) - 15min
  [ ] MetalLB tests (2.2.2) - 15min
  [ ] Envoy Gateway tests (2.2.3) - 15min
  [ ] cert-manager tests (2.2.4) - 15min
  [ ] Longhorn tests (2.2.5) - 15min
  [ ] MinIO tests (2.3.1) - 10min
  [ ] Velero tests (2.3.2) - 15min
  [ ] KubeChart App tests (2.4) - 20min

INTEGRATION TESTS
  [ ] Database integration (3.1) - 15min
  [ ] Storage integration (3.2) - 15min
  [ ] Gateway integration (3.3) - 20min
  [ ] Backup integration (3.4) - 15min

PERFORMANCE TESTS
  [ ] API load test (4.1) - 20min
  [ ] Database performance (4.2) - 20min
  [ ] Storage performance (4.3) - 20min
  [ ] Network performance (4.4) - 15min

SECURITY TESTS
  [ ] Authentication & Authorization (5.1) - 15min
  [ ] Data security (5.2) - 15min
  [ ] Network security (5.3) - 20min
  [ ] Container security (5.4) - 15min
  [ ] RBAC & Audit (5.5) - 10min

BACKUP & RECOVERY TESTS
  [ ] Backup creation (6.1) - 20min
  [ ] Disaster recovery (6.2) - 60min
  [ ] Restore validation (6.3) - 20min

MONITORING SETUP
  [ ] Health checks configured (7.1)
  [ ] Metrics collection active (7.2)
  [ ] Alerting rules deployed (7.3)
  [ ] Logging system active (7.4)

PERIODIC TESTS
  [ ] Hourly tests scheduled (8.1)
  [ ] Daily tests scheduled (8.2)
  [ ] Weekly tests scheduled (8.3)
  [ ] Monthly tests scheduled (8.4)

TOTAL ESTIMATED TIME: 8-10 hours for full suite
```

---

## Conclusion

This comprehensive testing methodology ensures KubeChart platform reliability, security, and performance. Regular execution of these tests, especially the periodic automated tests, will maintain system health and catch issues before they impact users.

**Key Success Metrics:**
- >95% test pass rate
- <100ms API p95 latency
- 99.9% uptime
- Zero critical security issues
- All backups successful
- <5 minute RTO (Recovery Time Objective)
- <1 hour RPO (Recovery Point Objective)

**Next Steps:**
1. Implement test automation scripts
2. Set up monitoring dashboards
3. Schedule periodic test execution
4. Create on-call playbooks for failures
5. Regular review and updates of test procedures
