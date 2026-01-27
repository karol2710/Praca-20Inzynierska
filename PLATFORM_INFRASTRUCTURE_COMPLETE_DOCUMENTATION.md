# KubeChart Platform Infrastructure - Complete Documentation

**Version:** 1.0  
**Date:** January 2026  
**Scope:** Platform.sh, BackupSys.sh, DataBase.sh, and k8s-deploy2.sh infrastructure setup and management

---

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Prerequisites & Requirements](#prerequisites--requirements)
4. [DataBase.sh - PostgreSQL Setup](#databasesh---postgresql-setup)
5. [Platform.sh - Kubernetes Infrastructure](#platformsh---kubernetes-infrastructure)
6. [BackupSys.sh - Backup System](#backupsyssh---backup-system)
7. [k8s-deploy2.sh - Application Deployment](#k8s-deploy2sh---application-deployment)
8. [Integration & Networking](#integration--networking)
9. [Configuration Management](#configuration-management)
10. [Security Architecture](#security-architecture)
11. [Monitoring & Observability](#monitoring--observability)
12. [Troubleshooting Guide](#troubleshooting-guide)
13. [Maintenance Procedures](#maintenance-procedures)
14. [Disaster Recovery](#disaster-recovery)
15. [Performance Tuning](#performance-tuning)
16. [Upgrade Procedures](#upgrade-procedures)

---

## Overview

The KubeChart platform consists of a four-stage infrastructure deployment:

### Deployment Stages

```
Stage 1: DataBase.sh
  └─ Install PostgreSQL on host
  └─ Create deployer user and database
  └─ Set environment variables

Stage 2: Platform.sh
  └─ Install Helm
  └─ Deploy MetalLB (LoadBalancer)
  └─ Deploy Envoy Gateway (API Gateway)
  └─ Deploy cert-manager (TLS Certificates)
  └─ Deploy Longhorn (Persistent Storage)

Stage 3: BackupSys.sh
  └─ Deploy MinIO (Object Storage)
  └─ Deploy Velero (Backup/Restore)
  └─ Create backup schedules

Stage 4: k8s-deploy2.sh
  └─ Deploy PostgreSQL in cluster
  └─ Deploy KubeChart application
  └─ Configure networking
  └─ Setup auto-scaling
  └─ Configure monitoring
```

### Key Components

| Component | Purpose | Stage | Namespace |
|-----------|---------|-------|-----------|
| PostgreSQL | Database for users & deployments | 1 & 4 | `kubechart` |
| MetalLB | Load balancer IP allocation | 2 | `metallb-system` |
| Envoy Gateway | API gateway & traffic routing | 2 | `envoy-gateway-system` |
| cert-manager | TLS certificate automation | 2 | `cert-manager` |
| Longhorn | Persistent volume management | 2 | `longhorn-system` |
| MinIO | Object storage for backups | 3 | `minio` |
| Velero | Backup & disaster recovery | 3 | `velero` |
| KubeChart App | Application deployment | 4 | `kubechart` |

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Host Machine                             │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                   PostgreSQL Database                      │ │
│  │  (Port 5432, deployer_user, deployer database)           │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              Kubernetes Cluster (RKE2/Native)             │ │
│  │                                                            │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │            Network Infrastructure                   │ │ │
│  │  │  ┌──────────────────────────────────────────────┐  │ │ │
│  │  │  │  MetalLB (metallb-system)                   │  │ │ │
│  │  │  │  - LoadBalancer service IP allocation       │  │ │ │
│  │  │  │  - AddressPool: 192.168.x.x/24 (example)   │  │ │ │
│  │  │  └──────────────────────────────────────────────┘  │ │ │
│  │  │                         ↓                           │ │ │
│  │  │  ┌──────────────────────────────────────────────┐  │ │ │
│  │  │  │  Envoy Gateway (envoy-gateway-system)       │  │ │ │
│  │  │  │  - HTTPRoute/GRPCRoute support              │  │ │ │
│  │  │  │  - TLS termination                          │  │ │ │
│  │  │  │  - Traffic routing & filtering              │  │ │ │
│  │  │  └──────────────────────────────────────────────┘  │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  │                                                            │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │            Storage Infrastructure                   │ │ │
│  │  │  ┌──────────────────────────────────────────────┐  │ │ │
│  │  │  │  Longhorn (longhorn-system)                 │  │ │ │
│  │  │  │  - Persistent volumes                       │  │ │ │
│  │  │  │  - Snapshots & replication                  │  │ │ │
│  │  │  │  - Encryption                               │  │ │ │
│  │  │  │  - StorageClass: platform-storageclass     │  │ │ │
│  │  │  └──────────────────────────────────────────────┘  │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  │                                                            │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │            Security & Certificates                 │ │ │
│  │  │  ┌──────────────────────────────────────────────┐  │ │ │
│  │  │  │  cert-manager (cert-manager)                │  │ │ │
│  │  │  │  - Let's Encrypt ACME integration           │  │ │ │
│  │  │  │  - Self-signed certificates                 │  │ │ │
│  │  │  │  - Auto-renewal                             │  │ │ │
│  │  │  │  - Webhook for validation                   │  │ │ │
│  │  │  └──────────────────────────────────────────────┘  │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  │                                                            │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │            Backup Infrastructure                    │ │ │
│  │  │  ┌──────────────────────────────────────────────┐  │ │ │
│  │  │  │  MinIO (minio)                              │  │ │ │
│  │  │  │  - S3-compatible object storage             │  │ │ │
│  │  │  │  - Velero bucket                            │  │ │ │
│  │  │  │  - Access credentials                       │  │ │ │
│  │  │  └──────────────────────────────────────────────┘  │ │ │
│  │  │                         ↓                           │ │ │
│  │  │  ┌──────────────────────────────────────────────┐  │ │ │
│  │  │  │  Velero (velero)                            │  │ │ │
│  │  │  │  - Cluster backup/restore                   │  │ │ │
│  │  │  │  - Volume snapshots                         │  │ │ │
│  │  │  │  - Scheduled backups                        │  │ │ │
│  │  │  │  - Disaster recovery                        │  │ │ │
│  │  │  └──────────────────────────────────────────────┘  │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  │                                                            │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │            Application Namespace                    │ │ │
│  │  │  ┌──────────────────────────────────────────────┐  │ │ │
│  │  │  │  kubechart                                  │  │ │ │
│  │  │  │  - PostgreSQL StatefulSet                  │  │ │ │
│  │  │  │  - KubeChart Deployment (3 replicas)      │  │ │ │
│  │  │  │  - Services, ConfigMaps, Secrets          │  │ │ │
│  │  │  │  - HPA for auto-scaling                   │  │ │ │
│  │  │  └──────────────────────────────────────────────┘  │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  │                                                            │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
User Browser
    ↓ HTTP/HTTPS
Envoy Gateway (Public IP via MetalLB)
    ↓
KubeChart Service (ClusterIP)
    ↓
KubeChart Pods (3 replicas, balanced)
    ├─→ PostgreSQL (kubechart namespace) ← Database operations
    ├─→ Kubernetes API Server ← Resource management
    └─→ Longhorn Storage ← Persistent volumes
    
Backup Flow:
KubeChart Resources
    ↓
Velero (scheduled or manual)
    ↓
MinIO (object storage)
    ↓
Long-term storage/archival
```

---

## Prerequisites & Requirements

### Hardware Requirements

#### Minimum (Single Node)
- **CPU:** 4 cores minimum (8+ recommended)
- **RAM:** 16 GB minimum (32 GB recommended)
- **Disk:** 100 GB SSD (500 GB+ for production)
- **Network:** 1 Gbps network interface

#### Production (Multi-Node)
- **Nodes:** 3+ for redundancy
- **CPU per node:** 8+ cores
- **RAM per node:** 32+ GB
- **Disk per node:** 500+ GB SSD
- **Network:** Dedicated 10 Gbps or multi-1 Gbps

### Software Prerequisites

```bash
# Required on host
- Linux OS (Ubuntu 20.04 LTS+ recommended)
- Kubernetes cluster (RKE2, kubeadm, or managed)
- kubectl (v1.25+)
- Helm (v3.10+)
- Docker (v20.10+) or containerd
- PostgreSQL client (psql)
- bash (v5+)

# For monitoring (optional but recommended)
- Prometheus
- Grafana
- Loki/ELK for logging
```

### Network Requirements

```
Required Ports:

Host Level:
  5432/tcp    - PostgreSQL

Kubernetes Services:
  6443/tcp    - Kubernetes API
  80/tcp      - HTTP (via LoadBalancer)
  443/tcp     - HTTPS (via LoadBalancer)
  9000/tcp    - MinIO (internal)
  53/udp      - DNS (CoreDNS)
  
Ingress (MetalLB):
  External IPs required (configurable range)
  
Domain Requirements:
  - DNS resolvable domain for TLS certificates
  - Wildcard subdomain recommended (*.example.com)
```

### Kubeconfig & Authentication

```bash
# Set kubeconfig location
export KUBECONFIG=/etc/rancher/rke2/rke2.yaml

# Verify cluster connection
kubectl get nodes
kubectl cluster-info

# Required permissions:
- cluster-admin role (for initial setup)
- Reduced permissions for application (created by k8s-deploy2.sh)
```

---

## DataBase.sh - PostgreSQL Setup

### Purpose

Set up PostgreSQL database on the host machine that will serve as the backend for the KubeChart application and the PostgreSQL instance in the cluster.

### What It Does

```bash
1. Updates system packages
2. Installs PostgreSQL and contrib packages
3. Starts and enables PostgreSQL service
4. Creates database user: deployer_user
5. Creates database: deployer
6. Sets DATABASE_URL environment variable
7. Verifies database connectivity
```

### Execution

```bash
# Make script executable
chmod +x YAML\ samples/System/DataBase.sh

# Run as root (required for systemctl commands)
sudo bash YAML\ samples/System/DataBase.sh

# Expected output:
# ✓ PostgreSQL installed
# ✓ Service started
# ✓ User created
# ✓ Database created
# ✓ Environment variable set
# DATABASE_URL: postgresql://deployer_user:deployer_password@localhost:5432/deployer
```

### Configuration Details

#### Default Credentials
```
Username: deployer_user
Password: deployer_password
Database: deployer
Host: localhost
Port: 5432
```

**⚠️ Important:** Change these passwords in production!

#### Database Location

```
Data directory: /var/lib/postgresql/{version}/main
Configuration: /etc/postgresql/{version}/main/
Logs: /var/log/postgresql/
Service: postgresql (systemd)
```

#### PostgreSQL Configuration

```
# /etc/postgresql/xx/main/postgresql.conf
listen_addresses = 'localhost'
port = 5432
max_connections = 200
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 64MB
```

#### Environment Variable Setup

File: `/etc/profile.d/deployer-db.sh`
```bash
export DATABASE_URL="postgresql://deployer_user:deployer_password@localhost:5432/deployer"
```

Sourced automatically on new shell session.

### Database Schema

```
deployer database:
  ├── users table (created by k8s-deploy2.sh on first run)
  │   ├── id (SERIAL PRIMARY KEY)
  │   ├── username (VARCHAR UNIQUE)
  │   ├── email (VARCHAR UNIQUE)
  │   ├── password_hash (VARCHAR)
  │   ├── created_at (TIMESTAMP)
  │   └── [more fields...]
  │
  └── deployments table (created by k8s-deploy2.sh on first run)
      ├── id (SERIAL PRIMARY KEY)
      ├── user_id (FOREIGN KEY → users.id)
      ├── name (VARCHAR)
      ├── namespace (VARCHAR)
      ├── yaml_config (TEXT)
      ├── status (VARCHAR)
      └── [more fields...]
```

### Verification

```bash
# Check service status
sudo systemctl status postgresql

# Connect to database
psql -U deployer_user -d deployer -h localhost

# List databases
psql -U postgres -l

# List users
psql -U postgres -c "\du"

# List tables in deployer db
psql -U deployer_user -d deployer -c "\dt"
```

### Troubleshooting

#### Port Already in Use
```bash
# Check what's using port 5432
sudo lsof -i :5432

# PostgreSQL not listening
sudo systemctl restart postgresql
```

#### Connection Refused
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check listen_addresses in postgresql.conf
sudo grep listen_addresses /etc/postgresql/*/main/postgresql.conf

# Must be 'localhost' or '*'
```

#### Authentication Failed
```bash
# Check authentication method in pg_hba.conf
sudo cat /etc/postgresql/*/main/pg_hba.conf

# Reload configuration
sudo systemctl reload postgresql
```

#### Insufficient Permissions
```bash
# Grant all privileges to deployer_user
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE deployer TO deployer_user;"

# Grant schema permissions
sudo -u postgres psql -d deployer -c "GRANT ALL PRIVILEGES ON SCHEMA public TO deployer_user;"
```

### Backup & Recovery

#### Backup Database
```bash
# Backup specific database
pg_dump -U deployer_user -d deployer > deployer_backup.sql

# Backup all databases
pg_dumpall -U postgres > full_backup.sql

# Compressed backup
pg_dump -U deployer_user -d deployer | gzip > deployer_backup.sql.gz
```

#### Restore Database
```bash
# Restore from dump file
psql -U deployer_user -d deployer < deployer_backup.sql

# Restore full backup
psql -U postgres < full_backup.sql
```

### Performance Tuning

```
For small deployments:
  shared_buffers = 256MB
  effective_cache_size = 1GB
  work_mem = 64MB

For medium deployments:
  shared_buffers = 1GB
  effective_cache_size = 4GB
  work_mem = 256MB

For large deployments:
  shared_buffers = 4GB
  effective_cache_size = 16GB
  work_mem = 1GB

Adjust in: /etc/postgresql/xx/main/postgresql.conf
Then: sudo systemctl reload postgresql
```

---

## Platform.sh - Kubernetes Infrastructure

### Purpose

Deploy core Kubernetes infrastructure components needed for the platform:
- MetalLB (Load balancer)
- Envoy Gateway (API gateway)
- cert-manager (TLS certificates)
- Longhorn (Storage)

### What It Does

```
1. Verifies kubectl connectivity to cluster
2. Installs Helm (if not present)
3. Deploys MetalLB with AddressPool
4. Deploys Envoy Gateway
5. Deploys cert-manager with CRDs
6. Creates certificate issuers (ACME, self-signed)
7. Deploys Longhorn with StorageClass
8. Validates all components are running
```

### Execution

```bash
# Verify cluster connection first
kubectl cluster-info

# Make script executable
chmod +x YAML\ samples/System/Platform.sh

# Run script
bash YAML\ samples/System/Platform.sh

# Expected output shows each component:
# ✓ Helm installed
# ✓ MetalLB deployed
# ✓ Envoy Gateway deployed
# ✓ cert-manager deployed
# ✓ Longhorn deployed
# EXTERNAL-IP: 192.168.x.x (assigned by MetalLB)
```

### Component Details

#### 1. MetalLB (Load Balancer)

**Purpose:** Provide LoadBalancer service IP addresses in non-cloud environments

```yaml
Namespace: metallb-system
Components:
  - MetalLB Controller (Deployment)
  - MetalLB Speaker (DaemonSet)
  - MetalLB Webhook (Service)
  
Configuration:
  - AddressPool: IP range for LoadBalancer services
  - BGP/L2 Mode: How IPs are advertised to network
```

**AddressPool Configuration** (from metallb-pool.yaml)
```yaml
apiVersion: metallb.io/v1beta1
kind: AddressPool
metadata:
  name: default
  namespace: metallb-system
spec:
  addresses:
  - 192.168.1.100-192.168.1.200  # Example range
  autoAssign: true
```

**Verify MetalLB:**
```bash
# Check pods
kubectl -n metallb-system get pods

# Check services with LoadBalancer type
kubectl get svc -A | grep LoadBalancer

# Test IP allocation
kubectl create service loadbalancer test --tcp=80:8080
kubectl get svc test
# Should show EXTERNAL-IP assigned
```

#### 2. Envoy Gateway

**Purpose:** API gateway for HTTP/HTTPS routing with HTTPRoute support

```yaml
Namespace: envoy-gateway-system
Components:
  - Envoy Gateway Controller (Deployment)
  - Envoy Proxy (DaemonSet or Deployment)
  - Webhook for Gateway API validation
  
Configuration:
  - GatewayClass: Defines gateway configuration
  - Gateway: Ingress point for traffic
  - HTTPRoute: Define routing rules
  - TLS settings for HTTPS
```

**Gateway Configuration** (from gateway.yaml)
```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: platform-gateway
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
      - name: platform-tls
    allowedRoutes:
      namespaces:
        from: All
```

**HTTPRoute Example:**
```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: kubechart-route
  namespace: kubechart
spec:
  parentRefs:
  - name: platform-gateway
    namespace: envoy-gateway-system
  hostnames:
  - api.example.com
  rules:
  - backendRefs:
    - name: kubechart
      port: 3000
```

**Verify Envoy Gateway:**
```bash
# Check gateway pod
kubectl -n envoy-gateway-system get pods

# Check gateway status
kubectl get gateway -A

# Check HTTPRoutes
kubectl get httproute -A

# Test routing
curl http://{EXTERNAL-IP}/

# Check TLS certificate
openssl s_client -connect {EXTERNAL-IP}:443
```

#### 3. cert-manager

**Purpose:** Automate TLS certificate management with Let's Encrypt

```yaml
Namespace: cert-manager
Components:
  - cert-manager Controller (Deployment)
  - Webhook (Service + Deployment)
  - CA Injector (Deployment)
  
CRDs:
  - Certificate: Request for a certificate
  - Issuer: Local certificate issuer
  - ClusterIssuer: Cluster-wide certificate issuer
```

**Certificate Issuers** (from cert-issuer-*.yaml)

Production (Let's Encrypt):
```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: cert-issuer-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@example.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: envoy
```

Staging (Let's Encrypt staging, for testing):
```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: cert-issuer-staging
spec:
  acme:
    server: https://acme-staging-v02.api.letsencrypt.org/directory
    email: admin@example.com
    privateKeySecretRef:
      name: letsencrypt-staging
    solvers:
    - http01:
        ingress:
          class: envoy
```

**Certificate Creation:**
```yaml
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: platform-tls
  namespace: kubechart
spec:
  secretName: platform-tls-secret
  commonName: api.example.com
  dnsNames:
  - api.example.com
  - "*.api.example.com"
  issuerRef:
    name: cert-issuer-prod
    kind: ClusterIssuer
```

**Verify cert-manager:**
```bash
# Check cert-manager pods
kubectl -n cert-manager get pods

# Check certificates
kubectl get certificate -A

# Check certificate status
kubectl describe certificate platform-tls -n kubechart

# Check secret
kubectl get secret platform-tls-secret -n kubechart

# Manual renewal
kubectl annotate certificate platform-tls -n kubechart \
  cert-manager.io/issue-temporary-certificate="true" \
  --overwrite
```

#### 4. Longhorn

**Purpose:** Persistent volume management with snapshots and replication

```yaml
Namespace: longhorn-system
Components:
  - longhorn-manager (DaemonSet)
  - longhorn-ui (Service + Deployment)
  - longhorn-driver-deployer (Deployment)
  - longhorn-instance-manager (DaemonSet)
  
Features:
  - Persistent volumes
  - Snapshots & backups
  - Replication (fault tolerance)
  - Encryption
  - Auto-expansion
```

**StorageClass Configuration** (from StorageClass.yaml)
```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: platform-storageclass
provisioner: driver.longhorn.io
parameters:
  numberOfReplicas: "3"        # Replicate across 3 nodes
  staleReplicaTimeout: "2880"  # 48 hours
  fromBackup: ""
  encrypted: "true"            # Encryption enabled
  encryptionCipher: "aes-xts"
  encryptionKey: "encrypted-key"
allowVolumeExpansion: true
```

**PVC Example:**
```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-storage
spec:
  accessModes:
  - ReadWriteOnce
  storageClassName: platform-storageclass
  resources:
    requests:
      storage: 10Gi
```

**Encryption Configuration** (from LonghornEncrypt.yaml)
```yaml
apiVersion: longhorn.io/v1beta1
kind: Setting
metadata:
  name: encryption-status
  namespace: longhorn-system
value: "enabled"
---
apiVersion: longhorn.io/v1beta1
kind: Setting
metadata:
  name: encryption-key
  namespace: longhorn-system
value: "your-secure-key-here"
```

**Verify Longhorn:**
```bash
# Check Longhorn pods
kubectl -n longhorn-system get pods

# Access Longhorn UI
kubectl port-forward -n longhorn-system svc/longhorn-frontend 8080:80

# Check volumes
kubectl -n longhorn-system get volumes

# Check PVCs
kubectl get pvc -A

# Verify encryption
kubectl -n longhorn-system get setting encryption-status
```

### Network Configuration

#### MetalLB AddressPool

Edit `YAML samples/System/metallb-pool.yaml`:
```yaml
spec:
  addresses:
  - 192.168.1.100-192.168.1.200
```

Replace with your network range:
- For 10.x.x.x networks: `10.0.0.100-10.0.0.200`
- For 172.x.x.x networks: `172.16.0.100-172.16.0.200`

#### Domain Configuration

For TLS certificates, update:
- `cert-issuer-prod.yaml` - domain and email
- `cert-issuer-staging.yaml` - domain and email
- `gateway.yaml` - hostnames

Example:
```yaml
# In cert issuers
email: admin@yourdomain.com

# In gateway.yaml
hostnames:
- api.yourdomain.com
- yourdomain.com
```

### Troubleshooting

#### MetalLB IP Not Assigned

```bash
# Check MetalLB status
kubectl -n metallb-system get pods

# Check controller logs
kubectl -n metallb-system logs -l app=metallb,component=controller

# Verify AddressPool exists
kubectl -n metallb-system get addresspool

# Check service
kubectl get svc | grep LoadBalancer

# If stuck in pending, check MetalLB webhook
kubectl -n metallb-system get svc metallb-webhook-service
```

#### Envoy Gateway Not Ready

```bash
# Check gateway
kubectl get gateway -A

# Check conditions
kubectl describe gateway platform-gateway -n envoy-gateway-system

# Check controller logs
kubectl -n envoy-gateway-system logs -l app=envoy-gateway

# Verify GatewayClass
kubectl get gatewayclass
```

#### Certificate Issues

```bash
# Check certificate
kubectl describe certificate platform-tls -n kubechart

# Check issuers
kubectl get issuer -A
kubectl get clusterissuer

# Check webhook
kubectl -n cert-manager get svc cert-manager-webhook

# Manual trigger renewal
kubectl annotate certificate platform-tls -n kubechart \
  cert-manager.io/issue-temporary-certificate="true" --overwrite

# Check logs
kubectl -n cert-manager logs -l app=cert-manager
```

#### Longhorn Storage Issues

```bash
# Check Longhorn status
kubectl -n longhorn-system get pods

# Check volumes
kubectl -n longhorn-system get volumes

# Check replicas
kubectl -n longhorn-system get replicas

# Access Longhorn UI for GUI debugging
kubectl port-forward -n longhorn-system svc/longhorn-frontend 8080:80
# Open http://localhost:8080

# Check PVC status
kubectl get pvc -A
kubectl describe pvc {pvc-name} -n {namespace}
```

### Performance Tuning

#### MetalLB
```bash
# Tune speaker daemonset replicas
kubectl -n metallb-system scale daemonset/speaker --replicas=3
```

#### Envoy Gateway
```bash
# Scale envoy deployment
kubectl -n envoy-gateway-system scale deployment envoy-gateway \
  --replicas=3
```

#### cert-manager
```bash
# Increase webhook concurrency
kubectl -n cert-manager patch deployment cert-manager-webhook \
  -p '{"spec":{"template":{"spec":{"containers":[{"name":"cert-manager-webhook","args":["--v=2","--secure-port=10250"]}]}}}}'
```

#### Longhorn
```bash
# Adjust replica count in StorageClass
# Lower = faster writes, higher = more redundancy
numberOfReplicas: "2"  # Minimum for production
numberOfReplicas: "3"  # Recommended
numberOfReplicas: "1"  # Development only
```

---

## BackupSys.sh - Backup System

### Purpose

Deploy backup infrastructure using MinIO and Velero for cluster-wide backup and disaster recovery.

### What It Does

```
1. Creates MinIO namespace and deploys MinIO
2. Waits for MinIO to be ready
3. Creates velero bucket in MinIO
4. Creates Velero credentials secret
5. Installs Velero CLI (if not present)
6. Deploys Velero controller
7. Configures BackupStorageLocation
8. Verifies backup system is operational
```

### Execution

```bash
# Make script executable
chmod +x YAML\ samples/System/BackupSys.sh

# Run script
bash YAML\ samples/System/BackupSys.sh

# Expected output:
# ✓ MinIO deployed
# ✓ velero bucket created
# ✓ Velero credentials configured
# ✓ Velero deployed
# ✓ Backup system ready
```

### Component Details

#### 1. MinIO (Object Storage)

**Purpose:** S3-compatible object storage for backup data

```yaml
Namespace: minio
Deployment: Helm chart from minio/minio
Mode: Standalone (can be expanded to multi-node)
Storage: Longhorn persistent volume
Access: Credentials protected secret
```

**MinIO Configuration** (from BackupSys.sh)
```bash
MINIO_NAMESPACE="minio"
MINIO_RELEASE="minio"
MINIO_MODE="standalone"
MINIO_REPLICAS="1"
MINIO_ROOT_USER="admin"
MINIO_ROOT_PASSWORD="supersecretpassword"
MINIO_BUCKET="velero"
STORAGE_CLASS="platform-storageclass"   # Uses Longhorn
PERSISTENCE_SIZE="1Gi"                   # Expandable
```

⚠️ **Important:** Change MINIO_ROOT_PASSWORD in production!

**MinIO Access Methods:**

```bash
# Web UI (via port-forward)
kubectl port-forward -n minio svc/minio 9001:9001
# http://localhost:9001 (user: admin, password: supersecretpassword)

# CLI access
kubectl -n minio exec svc/minio -- mc alias set local \
  http://127.0.0.1:9000 admin supersecretpassword

# List buckets
kubectl -n minio exec svc/minio -- mc ls local/

# List bucket contents
kubectl -n minio exec svc/minio -- mc ls local/velero/
```

**Storage Configuration:**
```yaml
Persistence:
  size: 1Gi (can auto-expand)
  storageClassName: platform-storageclass
  
Volume will be backed by Longhorn with:
  - 3 replicas (fault tolerant)
  - Encryption enabled
  - Snapshots available
  - Auto-expansion on demand
```

**Verify MinIO:**
```bash
# Check pod
kubectl -n minio get pods

# Check service
kubectl -n minio get svc

# Check PVC
kubectl get pvc -n minio

# Check bucket exists
kubectl -n minio exec svc/minio -- mc ls local/velero/

# Test object upload
kubectl -n minio exec svc/minio -- mc cp /etc/hostname local/velero/test-file
kubectl -n minio exec svc/minio -- mc cat local/velero/test-file
```

#### 2. Velero (Backup & Restore)

**Purpose:** Cluster-wide backup and disaster recovery

```yaml
Namespace: velero
Deployment: Official Velero Helm chart
Plugins: velero-plugin-for-aws (for S3-compatible storage)
```

**Velero Features:**
- Full cluster backup/restore
- Selective namespace backup
- Scheduled backups
- Volume snapshots
- Disaster recovery
- Cross-cluster restore

**Credentials Configuration** (from BackupSys.sh)

File: `velero-credentials.txt`
```
[default]
aws_access_key_id=admin
aws_secret_access_key=supersecretpassword
```

This secret is stored in Kubernetes:
```bash
kubectl get secret cloud-credentials -n velero
kubectl describe secret cloud-credentials -n velero
```

**BackupStorageLocation Configuration:**
```yaml
apiVersion: velero.io/v1
kind: BackupStorageLocation
metadata:
  name: default
  namespace: velero
spec:
  provider: aws
  bucket: velero
  config:
    region: minio
    s3ForcePathStyle: true
    s3Url: http://minio.minio.svc.cluster.local:9000
    insecureSkipTLSVerify: true
  accessMode: ReadWrite
```

**Velero CLI Usage:**

```bash
# Check status
velero version
velero backup-location get
velero snapshot-location get

# Create backup
velero backup create my-backup
velero backup create my-backup --include-namespaces kubechart
velero backup create my-backup --wait

# List backups
velero backup get
velero backup describe my-backup
velero backup logs my-backup

# Restore from backup
velero restore create --from-backup my-backup
velero restore create --from-backup my-backup \
  --include-namespaces kubechart

# List restores
velero restore get
velero restore describe my-restore
velero restore logs my-restore

# Delete backup
velero backup delete my-backup

# Create schedule
velero schedule create daily-backup --schedule="0 2 * * *"
velero schedule get
velero schedule delete daily-backup
```

**Scheduled Backups:**

```bash
# Create daily backup at 2 AM
velero schedule create daily-backup \
  --schedule="0 2 * * *" \
  --wait

# Create backup with TTL (30 days)
velero schedule create daily-backup \
  --schedule="0 2 * * *" \
  --ttl 720h \
  --wait
```

**Backup with Included Resources:**

```bash
# Backup only deployments and pods
velero backup create my-backup \
  --include-resources=deployments,pods \
  --wait

# Backup excluding certain resources
velero backup create my-backup \
  --exclude-resources=events,secrets \
  --wait
```

**Verify Velero:**

```bash
# Check pod
kubectl -n velero get pods

# Check status
velero version

# Check backup locations
velero backup-location get

# Check credentials
kubectl -n velero get secret cloud-credentials -o yaml

# Check BackupStorageLocation
kubectl get backupStorageLocation -n velero

# Verify backups in MinIO
kubectl -n minio exec svc/minio -- mc ls local/velero/

# Check logs
kubectl -n velero logs -l app=velero
```

### Backup Strategy

#### Manual Backups
```bash
# Before major changes
velero backup create pre-upgrade-backup --wait

# Before deploying changes
velero backup create pre-deploy-backup --wait
```

#### Scheduled Backups
```bash
# Create daily backup
velero schedule create daily-backup --schedule="0 2 * * *" --ttl 168h

# Backup at specific times
# Format: minute hour day month weekday
# 0 2 * * * = 2 AM daily
# 0 */4 * * * = Every 4 hours
# 0 2 * * 0 = Sunday 2 AM
```

#### Backup Retention

```bash
# Keep backups for 30 days
velero schedule create daily-backup \
  --schedule="0 2 * * *" \
  --ttl 720h

# Keep backups for 7 days
velero schedule create daily-backup \
  --schedule="0 2 * * *" \
  --ttl 168h
```

### Disaster Recovery Procedures

#### Full Cluster Restore

```bash
# List available backups
velero backup get

# Restore from backup
velero restore create --from-backup my-backup --wait

# Monitor restore progress
velero restore get
velero restore describe my-restore

# Check if resources restored
kubectl get all -A
```

#### Namespace-Specific Restore

```bash
# Backup specific namespace
velero backup create kubechart-backup \
  --include-namespaces kubechart --wait

# Restore specific namespace
velero restore create --from-backup kubechart-backup \
  --include-namespaces kubechart --wait
```

#### Selective Resource Restore

```bash
# Backup with specific resources
velero backup create app-backup \
  --include-resources=deployments,services --wait

# Restore only deployments
velero restore create --from-backup app-backup \
  --include-resources=deployments --wait
```

#### Partial Data Recovery

```bash
# If only database corrupted, can restore volume snapshot
velero restore create --from-backup old-backup \
  --include-resources=persistentvolumeclaims --wait

# Then restore database from snapshot
kubectl get volumesnapshot -A
```

### Troubleshooting

#### Backup Fails to Complete

```bash
# Check Velero logs
kubectl -n velero logs -l app=velero --tail=100

# Check if MinIO is accessible
kubectl -n velero get secret cloud-credentials
kubectl -n minio get pods

# Verify backupStorageLocation
velero backup-location get

# Check bucket permissions
kubectl -n minio exec svc/minio -- mc ls local/velero/
```

#### Restore Fails

```bash
# Check restore logs
velero restore logs my-restore

# Verify backup is intact
velero backup describe my-backup

# Check cluster resources available
kubectl top nodes
kubectl get pvc

# Check if PVCs can be created
kubectl apply -f - <<EOF
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: test-pvc
spec:
  accessModes:
  - ReadWriteOnce
  storageClassName: platform-storageclass
  resources:
    requests:
      storage: 1Gi
EOF
```

#### MinIO Issues

```bash
# Check MinIO logs
kubectl -n minio logs -l app=minio

# Check storage
kubectl -n minio get pvc

# Verify bucket
kubectl -n minio exec svc/minio -- mc ls local/

# Check credentials
kubectl -n minio get secret minio-secret

# Recreate bucket if needed
kubectl -n minio exec svc/minio -- \
  mc mb local/velero || mc ls local/velero
```

### Performance Tuning

```bash
# Velero concurrent backups
kubectl -n velero patch deployment velero \
  -p '{"spec":{"template":{"spec":{"containers":[{"name":"velero","args":["--max-concurrent-items=10"]}]}}}}'

# MinIO request/response timeout
kubectl -n minio patch statefulset minio \
  -p '{"spec":{"template":{"spec":{"containers":[{"name":"minio","args":["server","/data","--request-timeout=30s"]}]}}}}'

# Volume snapshot concurrency
# Set in StorageClass
numberOfReplicas: "3"
```

---

## k8s-deploy2.sh - Application Deployment

### Purpose

Deploy the complete KubeChart application stack into the Kubernetes cluster with all required configurations.

### What It Does

```
1. Pre-flight validation (cluster connectivity, configuration)
2. Creates kubechart namespace
3. Sets up RBAC (ServiceAccount, ClusterRole, ClusterRoleBinding)
4. Creates credentials secrets (database, application)
5. Creates ConfigMap with environment variables
6. Deploys PostgreSQL StatefulSet (in-cluster database)
7. Deploys KubeChart application with 3 replicas
8. Creates Service and HTTPRoute for networking
9. Configures HPA (auto-scaling)
10. Waits for rollout and validates
```

### Execution

```bash
# Set kubeconfig if not already set
export KUBECONFIG=/etc/rancher/rke2/rke2.yaml

# Make script executable
chmod +x k8s-deploy2.sh

# Run script
bash k8s-deploy2.sh

# Expected output:
# ✓ Namespace created
# ✓ RBAC configured
# ✓ Secrets created
# ✓ ConfigMap created
# ✓ PostgreSQL deployed
# ✓ KubeChart deployed
# ✓ Service created
# ✓ HTTPRoute created
# ✓ HPA configured
# ✓ Deployment ready
# Access via: http://{EXTERNAL-IP}/
```

### Configuration Variables

Edit these in `k8s-deploy2.sh` before running:

```bash
# Kubernetes Configuration
KUBE_NAMESPACE="kubechart"
KUBECHART_IMAGE="yoghlol/pracainz:va1"
DEPLOYMENT_NAME="kubechart"
REPLICAS=3

# Database Configuration
DATABASE_HOST="postgres.kubechart.svc.cluster.local"
DATABASE_PORT=5432
DATABASE_NAME="kubechart"
DATABASE_USER="deployer_user"
DATABASE_PASSWORD="deployer_password"

# Application Configuration
JWT_SECRET="your-secret-jwt-key"  # Change this!
PORT=3000
LOG_LEVEL="info"

# Storage & Resources
STORAGE_CLASS="platform-storageclass"
CPU_REQUEST="100m"
CPU_LIMIT="500m"
MEMORY_REQUEST="256Mi"
MEMORY_LIMIT="512Mi"
```

### Namespace & RBAC

#### Namespace Creation

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: kubechart
```

#### ServiceAccount

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: kubechart
  namespace: kubechart
imagePullSecrets:
- name: dockerhub-secret
```

#### Docker Registry Secret

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: dockerhub-secret
  namespace: kubechart
type: kubernetes.io/dockercfg
data:
  .dockercfg: base64-encoded-credentials
```

#### ClusterRole (Permissions)

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: kubechart
rules:
# Pods
- apiGroups: [""]
  resources: ["pods", "pods/log", "pods/exec"]
  verbs: ["get", "list", "watch", "create", "delete"]

# ConfigMaps & Secrets
- apiGroups: [""]
  resources: ["configmaps", "secrets"]
  verbs: ["get", "list", "create", "patch", "update", "delete"]

# Services
- apiGroups: [""]
  resources: ["services"]
  verbs: ["get", "list", "create", "patch", "update", "delete"]

# Deployments
- apiGroups: ["apps"]
  resources: ["deployments", "statefulsets", "replicasets"]
  verbs: ["get", "list", "create", "patch", "update", "delete"]

# Jobs & CronJobs
- apiGroups: ["batch"]
  resources: ["jobs", "cronjobs"]
  verbs: ["get", "list", "create", "patch", "update", "delete"]

# Storage
- apiGroups: [""]
  resources: ["persistentvolumeclaims"]
  verbs: ["get", "list", "create", "patch", "update", "delete"]

# Networking
- apiGroups: ["networking.k8s.io"]
  resources: ["ingresses", "networkpolicies"]
  verbs: ["get", "list", "create", "patch", "update", "delete"]

# RBAC
- apiGroups: ["rbac.authorization.k8s.io"]
  resources: ["roles", "rolebindings", "clusterroles", "clusterrolebindings"]
  verbs: ["get", "list", "create", "patch", "update", "delete"]

# Cert-manager
- apiGroups: ["cert-manager.io"]
  resources: ["certificates", "issuers", "clusterissuers"]
  verbs: ["get", "list", "create", "patch", "update", "delete"]

# Gateway API
- apiGroups: ["gateway.networking.k8s.io"]
  resources: ["httproutes", "gateways"]
  verbs: ["get", "list", "create", "patch", "update", "delete"]

# And more...
```

#### ClusterRoleBinding

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: kubechart
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: kubechart
subjects:
- kind: ServiceAccount
  name: kubechart
  namespace: kubechart
```

### Secrets & ConfigMaps

#### Database Credentials Secret

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: kubechart-db-credentials
  namespace: kubechart
type: Opaque
data:
  database-url: base64(postgresql://deployer_user:password@postgres:5432/kubechart)
  database-host: base64(postgres.kubechart.svc.cluster.local)
  database-port: base64(5432)
  database-name: base64(kubechart)
  database-user: base64(deployer_user)
  database-password: base64(deployer_password)
```

#### Application Secrets

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: kubechart-app-secrets
  namespace: kubechart
type: Opaque
data:
  jwt-secret: base64(your-secret-jwt-key)
```

#### ConfigMap

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: kubechart-config
  namespace: kubechart
data:
  NODE_ENV: "production"
  PORT: "3000"
  LOG_LEVEL: "info"
  DATABASE_HOST: "postgres.kubechart.svc.cluster.local"
  DATABASE_PORT: "5432"
  DATABASE_NAME: "kubechart"
```

### PostgreSQL Deployment (In-Cluster)

#### StatefulSet

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: kubechart
spec:
  serviceName: postgres
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15-alpine
        ports:
        - containerPort: 5432
        env:
        - name: POSTGRES_DB
          value: kubechart
        - name: POSTGRES_USER
          value: deployer_user
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: kubechart-db-credentials
              key: database-password
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
  volumeClaimTemplates:
  - metadata:
      name: postgres-storage
    spec:
      accessModes: [ "ReadWriteOnce" ]
      storageClassName: platform-storageclass
      resources:
        requests:
          storage: 10Gi
```

#### Service

```yaml
apiVersion: v1
kind: Service
metadata:
  name: postgres
  namespace: kubechart
spec:
  clusterIP: None
  selector:
    app: postgres
  ports:
  - port: 5432
    targetPort: 5432
```

### KubeChart Deployment

#### Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: kubechart
  namespace: kubechart
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: kubechart
  template:
    metadata:
      labels:
        app: kubechart
    spec:
      serviceAccountName: kubechart
      automountServiceAccountToken: true
      securityContext:
        runAsNonRoot: true
        runAsUser: 1001
        fsGroup: 1001
      initContainers:
      - name: wait-for-postgres
        image: busybox:latest
        command: ['sh', '-c', 'until nc -z postgres 5432; do sleep 2; done']
      containers:
      - name: kubechart
        image: yoghlol/pracainz:va1
        imagePullPolicy: Always
        ports:
        - name: http
          containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: kubechart-db-credentials
              key: database-url
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: kubechart-app-secrets
              key: jwt-secret
        - name: NODE_ENV
          valueFrom:
            configMapKeyRef:
              name: kubechart-config
              key: NODE_ENV
        - name: PORT
          valueFrom:
            configMapKeyRef:
              name: kubechart-config
              key: PORT
        resources:
          requests:
            cpu: 100m
            memory: 256Mi
          limits:
            cpu: 500m
            memory: 512Mi
        livenessProbe:
          httpGet:
            path: /api/ping
            port: http
          initialDelaySeconds: 60
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /api/ping
            port: http
          initialDelaySeconds: 60
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
        securityContext:
          allowPrivilegeEscalation: false
          capabilities:
            drop:
            - ALL
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: app
                  operator: In
                  values:
                  - kubechart
              topologyKey: kubernetes.io/hostname
```

#### Service

```yaml
apiVersion: v1
kind: Service
metadata:
  name: kubechart
  namespace: kubechart
spec:
  type: ClusterIP
  selector:
    app: kubechart
  ports:
  - name: http
    port: 3000
    targetPort: 3000
```

#### HTTPRoute

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: kubechart-route
  namespace: kubechart
spec:
  parentRefs:
  - name: platform-gateway
    namespace: envoy-gateway-system
  hostnames:
  - api.example.com
  rules:
  - backendRefs:
    - name: kubechart
      port: 3000
      weight: 100
    timeouts:
      request: 30s
      backendRequest: 25s
```

#### HorizontalPodAutoscaler

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: kubechart
  namespace: kubechart
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: kubechart
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
      - type: Percent
        value: 100
        periodSeconds: 15
      - type: Pods
        value: 2
        periodSeconds: 15
      selectPolicy: Max
```

### Verification & Access

#### Verify Deployment

```bash
# Check namespace
kubectl get namespace kubechart

# Check RBAC
kubectl get serviceaccount -n kubechart
kubectl get clusterrole kubechart
kubectl get clusterrolebinding kubechart

# Check secrets and config
kubectl get secret -n kubechart
kubectl get configmap -n kubechart

# Check PostgreSQL
kubectl -n kubechart get statefulset postgres
kubectl -n kubechart wait --for=condition=ready pod postgres-0 --timeout=300s

# Check KubeChart pods
kubectl -n kubechart get pods
kubectl -n kubechart wait --for=condition=ready pod -l app=kubechart --timeout=300s

# Check services
kubectl -n kubechart get svc

# Check HTTPRoute
kubectl get httproute -A | grep kubechart

# Check HPA
kubectl -n kubechart get hpa
```

#### Access Application

```bash
# Get external IP (from Envoy Gateway)
kubectl -n envoy-gateway-system get svc | grep platform-gateway-lb
EXTERNAL_IP=$(kubectl -n envoy-gateway-system get svc platform-gateway-lb \
  -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

# Access via browser
https://${EXTERNAL_IP}/

# Or via curl
curl https://${EXTERNAL_IP}/api/ping

# Port forward if LoadBalancer IP not accessible
kubectl -n kubechart port-forward svc/kubechart 3000:3000
# http://localhost:3000
```

#### Check Logs

```bash
# Application logs
kubectl -n kubechart logs -l app=kubechart --tail=50 -f

# Specific pod logs
kubectl -n kubechart logs kubechart-0

# Previous logs (if pod restarted)
kubectl -n kubechart logs kubechart-0 --previous

# PostgreSQL logs
kubectl -n kubechart logs postgres-0

# Stream logs from multiple pods
kubectl -n kubechart logs -l app=kubechart --all-containers=true -f
```

### Troubleshooting

#### Application Pod Won't Start

```bash
# Check pod events
kubectl -n kubechart describe pod kubechart-0

# Check logs
kubectl -n kubechart logs kubechart-0

# Check if image can be pulled
kubectl -n kubechart describe pod kubechart-0 | grep -A 5 "Events:"

# Verify Docker credentials secret
kubectl -n kubechart get secret dockerhub-secret

# Check liveness/readiness probes
kubectl -n kubechart get pod kubechart-0 -o jsonpath='{.status.containerStatuses[0].state}'
```

#### Database Connection Fails

```bash
# Check PostgreSQL pod
kubectl -n kubechart get pod postgres-0

# Test connectivity from app pod
kubectl -n kubechart exec kubechart-0 -- \
  nc -zv postgres.kubechart.svc.cluster.local 5432

# Check database credentials
kubectl -n kubechart get secret kubechart-db-credentials -o yaml

# Connect to PostgreSQL directly
kubectl -n kubechart exec postgres-0 -- \
  psql -U deployer_user -d kubechart -c "SELECT 1;"

# Check PostgreSQL logs
kubectl -n kubechart logs postgres-0
```

#### Service Unreachable

```bash
# Check service
kubectl -n kubechart get svc kubechart

# Check endpoints
kubectl -n kubechart get endpoints kubechart

# Check if pods are ready
kubectl -n kubechart get pods -l app=kubechart

# Test connectivity from another pod
kubectl run -it --rm debug --image=curlimages/curl --restart=Never -- \
  curl http://kubechart.kubechart.svc.cluster.local:3000/api/ping

# Check network policies
kubectl get networkpolicy -A
```

#### HTTPRoute Not Working

```bash
# Check HTTPRoute
kubectl get httproute -A
kubectl describe httproute kubechart-route -n kubechart

# Check Gateway
kubectl get gateway -n envoy-gateway-system

# Check Envoy Gateway logs
kubectl -n envoy-gateway-system logs -l app=envoy-gateway

# Check if parent gateway exists
kubectl get gateway platform-gateway -n envoy-gateway-system

# Verify DNS resolution
kubectl run -it --rm debug --image=busybox --restart=Never -- \
  nslookup api.example.com
```

---

## Integration & Networking

### Complete Data Flow

```
User Request
    ↓
Envoy Gateway (EXTERNAL-IP:443)
    ↓
MetalLB Assigned IP
    ↓
Gateway Listener (HTTPS)
    ↓
TLS Termination (cert-manager issued certificate)
    ↓
HTTPRoute Matching (hostname + path rules)
    ↓
KubeChart Service (ClusterIP:3000)
    ↓
KubeChart Pod (port 3000)
    ├─→ PostgreSQL (kubechart namespace)
    │   └─→ Longhorn Persistent Volume
    ├─→ Kubernetes API (for resource operations)
    └─→ Return response
        ↓
        Response back through Envoy Gateway
        ↓
        User receives response
```

### Network Policies

Optional but recommended for security:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: kubechart-network-policy
  namespace: kubechart
spec:
  podSelector:
    matchLabels:
      app: kubechart
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: envoy-gateway-system
    ports:
    - protocol: TCP
      port: 3000
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: postgres
    ports:
    - protocol: TCP
      port: 5432
  - to:
    - namespaceSelector:
        matchLabels:
          name: kube-system
    ports:
    - protocol: TCP
      port: 53
    - protocol: UDP
      port: 53
```

### DNS & Service Discovery

#### Internal DNS

```
Service: kubechart.kubechart.svc.cluster.local
Port: 3000
Protocol: TCP

From within cluster:
curl http://kubechart.kubechart.svc.cluster.local:3000/api/ping

Short form (from same namespace):
curl http://kubechart:3000/api/ping

Short form (from different namespace):
curl http://kubechart.kubechart:3000/api/ping
```

#### External DNS

```
Hostname: api.example.com
IP: {EXTERNAL-IP from MetalLB}
Protocol: HTTPS (via TLS termination)

DNS record:
A api.example.com {EXTERNAL-IP}

Or for wildcard:
A *.example.com {EXTERNAL-IP}
```

### Proxy & Port Forwarding

```bash
# Access Envoy Gateway locally
kubectl port-forward -n envoy-gateway-system svc/platform-gateway-lb 9000:80

# Access KubeChart locally
kubectl port-forward -n kubechart svc/kubechart 3000:3000

# Access PostgreSQL locally
kubectl port-forward -n kubechart svc/postgres 5432:5432

# Access Longhorn UI
kubectl port-forward -n longhorn-system svc/longhorn-frontend 8080:80

# Access MinIO
kubectl port-forward -n minio svc/minio 9001:9001

# Access Prometheus
kubectl port-forward -n monitoring svc/prometheus 9090:9090

# Access Grafana
kubectl port-forward -n monitoring svc/grafana 3001:3000
```

---

## Configuration Management

### Environment Variables

**On Host (for DataBase.sh):**
```bash
# /etc/profile.d/deployer-db.sh
export DATABASE_URL="postgresql://deployer_user:deployer_password@localhost:5432/deployer"

# For automated scripts
source /etc/profile.d/deployer-db.sh
```

**In Kubernetes ConfigMap:**
```yaml
kubechart-config:
  NODE_ENV: "production"
  PORT: "3000"
  LOG_LEVEL: "info"
  DATABASE_HOST: "postgres.kubechart.svc.cluster.local"
  DATABASE_PORT: "5432"
  DATABASE_NAME: "kubechart"
```

**In Kubernetes Secrets:**
```yaml
kubechart-db-credentials:
  database-url: "postgresql://..."
  database-password: "..."

kubechart-app-secrets:
  jwt-secret: "..."
```

### Configuration Files

#### platform.yaml (for Platform.sh)
```yaml
MetalLB:
  addressPool:
    range: "192.168.1.100-192.168.1.200"

Envoy Gateway:
  domain: "api.example.com"
  tls: true

cert-manager:
  email: "admin@example.com"
  acme:
    server: "https://acme-v02.api.letsencrypt.org/directory"

Longhorn:
  replicas: 3
  encryption: true
```

#### deployment.yaml (for k8s-deploy2.sh)
```yaml
kubechart:
  replicas: 3
  image: "yoghlol/pracainz:va1"
  resources:
    cpu: "100m-500m"
    memory: "256Mi-512Mi"
  autoscaling:
    min: 3
    max: 10

database:
  host: "postgres.kubechart.svc.cluster.local"
  port: 5432
  name: "kubechart"
```

### Updating Configuration

#### Change Environment Variables

```bash
# Update ConfigMap
kubectl -n kubechart set env configmap/kubechart-config LOG_LEVEL=debug

# Or edit directly
kubectl -n kubechart edit configmap kubechart-config

# Pod restart needed for changes to take effect
kubectl -n kubechart rollout restart deployment kubechart
```

#### Update Secrets

```bash
# Update secret
kubectl -n kubechart set env secret/kubechart-app-secrets JWT_SECRET=new-secret

# Or delete and recreate
kubectl -n kubechart delete secret kubechart-app-secrets
kubectl -n kubechart create secret generic kubechart-app-secrets \
  --from-literal=jwt-secret=new-secret

# Pod restart needed
kubectl -n kubechart rollout restart deployment kubechart
```

#### Update Deployment Configuration

```bash
# Change replicas
kubectl -n kubechart scale deployment kubechart --replicas=5

# Update image
kubectl -n kubechart set image deployment/kubechart \
  kubechart=yoghlol/pracainz:v2

# Change resource limits
kubectl -n kubechart set resources deployment kubechart \
  --limits=cpu=1,memory=1Gi \
  --requests=cpu=500m,memory=512Mi
```

---

## Security Architecture

### Authentication & Authorization

#### Kubernetes API

```
ServiceAccount: kubechart
  └─ Token (mounted in pod)
      └─ Used for Kubernetes API calls
      
ClusterRole: kubechart
  └─ Permissions for resources
  
ClusterRoleBinding: kubechart
  └─ Binds ServiceAccount to ClusterRole
```

#### Application Level (JWT)

```
JWT Secret: Stored in kubechart-app-secrets
  └─ Used by application for:
      ├─ Sign user authentication tokens
      ├─ Validate session tokens
      └─ Secure API endpoints
```

### Secrets Management

#### Storage

```
Kubernetes Secrets:
  ├─ kubechart-db-credentials
  │   ├─ database-url
  │   ├─ database-host
  │   ├─ database-password
  │   └─ [stored in etcd, base64 encoded]
  │
  └─ kubechart-app-secrets
      └─ jwt-secret
          └─ [used for token signing]

Recommendations:
  1. Enable etcd encryption at rest
  2. Use external secrets manager (Vault, etc.)
  3. Rotate secrets regularly
  4. Restrict RBAC access to secrets
```

#### Best Practices

```bash
# Never commit secrets to Git
# Use ConfigMaps for non-sensitive config only

# Access secrets securely
# Don't output secrets
kubectl get secret kubechart-db-credentials -o yaml  # Bad
kubectl get secret kubechart-db-credentials -o jsonpath='{.data}'  # Better
kubectl get secret kubechart-db-credentials  # Best

# Rotate secrets
# 1. Create new secret with new values
# 2. Update deployment to use new secret
# 3. Restart pods
# 4. Delete old secret

# Audit secret access
kubectl get events -A | grep Secret
```

### Network Security

#### Egress Control

Only allow necessary outbound connections:
- PostgreSQL (port 5432)
- Kubernetes API (port 6443)
- DNS (port 53)
- External HTTPS (port 443) if needed

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: kubechart-egress
  namespace: kubechart
spec:
  podSelector:
    matchLabels:
      app: kubechart
  policyTypes:
  - Egress
  egress:
  # PostgreSQL
  - to:
    - podSelector:
        matchLabels:
          app: postgres
    ports:
    - protocol: TCP
      port: 5432
  # DNS
  - to:
    - namespaceSelector:
        matchLabels:
          name: kube-system
    ports:
    - protocol: UDP
      port: 53
  # Kubernetes API
  - to:
    - namespaceSelector:
        matchLabels:
          name: default
    ports:
    - protocol: TCP
      port: 6443
```

#### TLS/HTTPS

```
Certificate Management:
  ├─ cert-manager creates and renews certificates
  ├─ Let's Encrypt (production)
  ├─ Self-signed (testing)
  └─ Auto-renewal 30 days before expiration

Verification:
  openssl s_client -connect api.example.com:443
  # Should show valid certificate chain
```

### Pod Security

#### Security Context

```yaml
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 1001
    fsGroup: 1001
    seccompProfile:
      type: RuntimeDefault
  containers:
  - name: kubechart
    securityContext:
      allowPrivilegeEscalation: false
      readOnlyRootFilesystem: false
      capabilities:
        drop:
        - ALL
```

#### Resource Limits

```yaml
resources:
  requests:
    cpu: 100m
    memory: 256Mi
  limits:
    cpu: 500m
    memory: 512Mi
```

### RBAC (Role-Based Access Control)

#### Principle of Least Privilege

KubeChart service account has only needed permissions:
- Create/read/delete Pods, Deployments, Services
- Create/read Secrets, ConfigMaps
- Read/write PersistentVolumeClaims
- Create Certificates
- Create HTTPRoutes

**Does NOT have:**
- Cluster admin
- Namespace admin (outside kubechart)
- Delete ClusterRoles/ClusterRoleBindings
- Access to kube-system resources

#### Verification

```bash
# Check what kubechart can do
kubectl auth can-i list pods --as=system:serviceaccount:kubechart:kubechart -n kubechart
# yes

kubectl auth can-i list pods --as=system:serviceaccount:kubechart:kubechart -n kube-system
# no

kubectl auth can-i get secret --as=system:serviceaccount:kubechart:kubechart -n kubechart
# yes

kubectl auth can-i delete clusterrole --as=system:serviceaccount:kubechart:kubechart
# no
```

---

## Monitoring & Observability

### Health Checks

#### Liveness Probe

```yaml
livenessProbe:
  httpGet:
    path: /api/ping
    port: 3000
  initialDelaySeconds: 60
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3
```

If pod fails 3 consecutive checks, Kubernetes restarts it.

#### Readiness Probe

```yaml
readinessProbe:
  httpGet:
    path: /api/ping
    port: 3000
  initialDelaySeconds: 60
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 3
```

Pod won't receive traffic until ready.

#### Manual Health Check

```bash
# From host
curl http://kubechart-pod-ip:3000/api/ping

# Via port-forward
kubectl port-forward -n kubechart svc/kubechart 3000:3000
curl http://localhost:3000/api/ping

# From another pod
kubectl run -it --rm debug --image=curlimages/curl --restart=Never -- \
  curl http://kubechart.kubechart.svc.cluster.local:3000/api/ping
```

### Metrics Collection

#### Prometheus Targets

If Prometheus is deployed:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: kubechart-metrics
  namespace: kubechart
  labels:
    prometheus: "true"
spec:
  ports:
  - name: metrics
    port: 9090
    targetPort: 9090
  selector:
    app: kubechart
```

### Logging

#### Log Collection

```bash
# View logs in real-time
kubectl -n kubechart logs -f deployment/kubechart

# View specific pod logs
kubectl -n kubechart logs kubechart-0

# View logs from last hour
kubectl -n kubechart logs deployment/kubechart --timestamps=true --since=1h

# View logs with specific keyword
kubectl -n kubechart logs deployment/kubechart | grep ERROR

# Stream logs from multiple pods
kubectl -n kubechart logs -f -l app=kubechart --all-containers=true
```

#### Log Format

```
ISO8601 Timestamp [Level] Component: Message
2024-01-27T10:30:45.123Z [INFO] database: Connected to PostgreSQL
2024-01-27T10:30:46.456Z [WARN] auth: Invalid login attempt from 192.168.1.100
2024-01-27T10:30:47.789Z [ERROR] deployment: Failed to create deployment
```

#### Centralized Logging (Optional)

```bash
# Deploy ELK or Loki stack
kubectl apply -f loki-stack.yaml

# Configure log aggregation
# All container logs automatically collected
# Query via Grafana or Kibana
```

### Alerting

#### Alert Examples

```yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: kubechart-alerts
spec:
  groups:
  - name: kubechart
    rules:
    - alert: KubeChartPodCrashing
      expr: rate(kube_pod_container_status_restarts_total{pod=~"kubechart-.*"}[15m]) > 0.1
      for: 5m
      annotations:
        summary: "KubeChart pod is crashing"
    
    - alert: DatabaseConnectionError
      expr: increase(app_db_connection_errors_total[5m]) > 0
      for: 5m
      annotations:
        summary: "Database connection errors detected"
    
    - alert: HighMemoryUsage
      expr: container_memory_usage_bytes{pod=~"kubechart-.*"} / 512000000 > 0.85
      for: 5m
      annotations:
        summary: "High memory usage in kubechart pod"
```

---

## Troubleshooting Guide

### Common Issues & Solutions

#### Cluster Connection Issues

```bash
# Error: Unable to connect to the server
# Solution:
export KUBECONFIG=/etc/rancher/rke2/rke2.yaml
kubectl cluster-info

# Check kubeconfig file exists
ls -la /etc/rancher/rke2/rke2.yaml

# Check cluster connectivity
kubectl get nodes
kubectl get ns
```

#### Pod Stuck in Pending

```bash
# Check pod events
kubectl describe pod kubechart-0 -n kubechart

# Common causes:
# 1. Insufficient resources
kubectl top nodes
kubectl describe node {node-name}

# 2. PVC not bound
kubectl get pvc -n kubechart

# 3. Image pull errors
kubectl describe pod {pod-name} | grep -A 5 "Events:"

# 4. ServiceAccount missing
kubectl get sa -n kubechart
```

#### Pod CrashLoopBackOff

```bash
# Check logs
kubectl logs kubechart-0 -n kubechart

# Check previous logs
kubectl logs kubechart-0 -n kubechart --previous

# Check liveness probe
kubectl describe pod kubechart-0 -n kubechart | grep -A 5 "Liveness"

# Check resource limits
kubectl top pod kubechart-0 -n kubechart

# Common causes:
# 1. Application crash (check logs)
# 2. Liveness probe failing (increase initialDelaySeconds)
# 3. Out of memory (increase memory limit)
# 4. Port already in use (check for port conflicts)
```

#### Service Not Accessible

```bash
# Check service exists
kubectl get svc kubechart -n kubechart

# Check endpoints
kubectl get endpoints kubechart -n kubechart

# Check if pods are ready
kubectl get pods -n kubechart -l app=kubechart

# Test connectivity
kubectl run -it --rm debug --image=busybox --restart=Never -- \
  nc -zv kubechart.kubechart.svc.cluster.local 3000

# Check NetworkPolicy
kubectl get networkpolicy -A
```

#### Database Connection Failed

```bash
# Check PostgreSQL pod
kubectl get pod postgres-0 -n kubechart
kubectl logs postgres-0 -n kubechart

# Check credentials
kubectl get secret kubechart-db-credentials -n kubechart -o yaml

# Test connection
kubectl exec -it kubechart-0 -n kubechart -- \
  psql -h postgres.kubechart.svc.cluster.local \
       -U deployer_user \
       -d kubechart \
       -c "SELECT 1;"

# Check PVC
kubectl get pvc -n kubechart
kubectl describe pvc postgres-storage-postgres-0 -n kubechart
```

#### Insufficient Storage

```bash
# Check PVC usage
kubectl get pvc -A
kubectl describe pvc {pvc-name} -n kubechart

# Check Longhorn volumes
kubectl -n longhorn-system get volumes

# Expand PVC
kubectl patch pvc postgres-storage-postgres-0 -n kubechart \
  -p '{"spec":{"resources":{"requests":{"storage":"20Gi"}}}}'

# Monitor expansion
kubectl get pvc postgres-storage-postgres-0 -n kubechart -w
```

#### Certificate Issues

```bash
# Check certificate
kubectl get certificate -n kubechart
kubectl describe certificate platform-tls -n kubechart

# Check issuer status
kubectl get clusterissuer cert-issuer-prod -o yaml

# Check cert-manager logs
kubectl -n cert-manager logs -l app=cert-manager

# Manually trigger renewal
kubectl annotate certificate platform-tls -n kubechart \
  cert-manager.io/issue-temporary-certificate="true" --overwrite

# Verify certificate in secret
kubectl get secret platform-tls-secret -n kubechart -o yaml
```

#### MetalLB IP Not Assigned

```bash
# Check MetalLB status
kubectl -n metallb-system get pods

# Check AddressPool
kubectl -n metallb-system get addresspool

# Check service
kubectl get svc | grep LoadBalancer

# Check MetalLB logs
kubectl -n metallb-system logs -l app=metallb,component=controller

# Verify IP range is available and not in use
kubectl -n metallb-system get addresspool -o yaml | grep addresses
```

---

## Maintenance Procedures

### Backup Procedures

#### Manual Backup

```bash
# Create backup before updates
velero backup create pre-update-backup --wait

# Verify backup completed
velero backup describe pre-update-backup
velero backup logs pre-update-backup
```

#### Automated Backups

```bash
# Create daily backup schedule
velero schedule create daily-backup --schedule="0 2 * * *" --ttl 168h

# Create backup before weekend
velero schedule create weekend-backup --schedule="0 2 * * 0" --ttl 720h

# List schedules
velero schedule get
```

### Database Maintenance

#### Backup PostgreSQL

```bash
# Within cluster
kubectl -n kubechart exec postgres-0 -- \
  pg_dump -U deployer_user kubechart > /tmp/backup.sql

# Copy backup from pod
kubectl cp kubechart/postgres-0:/tmp/backup.sql ./backup.sql

# Compressed backup
kubectl -n kubechart exec postgres-0 -- \
  pg_dump -U deployer_user kubechart | gzip > backup.sql.gz
```

#### Optimize Database

```bash
# Vacuum (reclaim space, update statistics)
kubectl -n kubechart exec postgres-0 -- \
  psql -U deployer_user -d kubechart -c "VACUUM ANALYZE;"

# Reindex
kubectl -n kubechart exec postgres-0 -- \
  psql -U deployer_user -d kubechart -c "REINDEX DATABASE kubechart;"

# Check database size
kubectl -n kubechart exec postgres-0 -- \
  psql -U deployer_user -d kubechart -c "SELECT pg_size_pretty(pg_database_size('kubechart'));"
```

### Certificate Rotation

#### Manual Rotation

```bash
# Check certificate expiration
kubectl get certificate -n kubechart
kubectl describe certificate platform-tls -n kubechart

# Trigger renewal
kubectl annotate certificate platform-tls -n kubechart \
  cert-manager.io/issue-temporary-certificate="true" --overwrite

# Verify new certificate issued
kubectl describe certificate platform-tls -n kubechart
```

#### Automatic Renewal

cert-manager automatically renews certificates 30 days before expiration. No manual action needed.

### Kubernetes Cluster Maintenance

#### Node Maintenance

```bash
# Drain node (safely evict all pods)
kubectl drain {node-name} --ignore-daemonsets --delete-emptydir-data

# Perform maintenance (updates, repairs, etc.)
# ...

# Uncordon node (allow pods to schedule again)
kubectl uncordon {node-name}

# Verify node is ready
kubectl get nodes
```

#### Cluster Upgrades

```bash
# For RKE2 clusters
sudo systemctl stop rke2-server.service  # On server nodes
sudo systemctl stop rke2-agent.service   # On agent nodes

# Download new RKE2 version
curl -sfL https://get.rke2.io | INSTALL_RKE2_VERSION=v1.28.0 sh -

# Start upgraded version
sudo systemctl start rke2-server.service
sudo systemctl start rke2-agent.service

# Verify upgrade
kubectl get nodes
kubectl version
```

### Storage Maintenance

#### Longhorn Snapshots

```bash
# Create snapshot
kubectl -n longhorn-system exec -it longhorn-instance-manager-pod -- \
  longhorn snapshot create volume-name

# List snapshots
kubectl get volumesnapshot -A

# Delete snapshot
kubectl delete volumesnapshot {snapshot-name} -n kubechart
```

#### Longhorn Backup

```bash
# Create backup
kubectl -n longhorn-system exec -it longhorn-instance-manager-pod -- \
  longhorn backup create volume-name

# List backups
kubectl -n longhorn-system exec svc/longhorn-backend-service -- \
  longhorn backup list
```

---

## Disaster Recovery

### Backup & Restore Procedures

#### Full Cluster Backup

```bash
# Create comprehensive backup
velero backup create cluster-backup \
  --wait \
  --ttl 720h

# Verify backup
velero backup describe cluster-backup
velero backup logs cluster-backup
```

#### Full Cluster Restore

```bash
# Restore entire cluster
velero restore create --from-backup cluster-backup \
  --wait

# Monitor restore
velero restore get
velero restore describe {restore-name}

# Verify restoration
kubectl get all -A
kubectl -n kubechart get deployments
kubectl -n kubechart get statefulsets
```

#### Namespace-Specific Recovery

```bash
# Backup specific namespace
velero backup create kubechart-backup \
  --include-namespaces kubechart \
  --wait

# Restore to different namespace (if original lost)
velero restore create --from-backup kubechart-backup \
  --namespace-mappings kubechart:kubechart-restored \
  --wait
```

#### Database Recovery

```bash
# If only database corrupted:
# 1. Keep pod running, don't delete
# 2. Restore volume snapshot from Longhorn

# Or restore full backup
velero restore create --from-backup cluster-backup \
  --include-resources=persistentvolumeclaims \
  --wait

# Restore database from backup file
kubectl -n kubechart exec postgres-0 -- \
  psql -U deployer_user kubechart < backup.sql
```

### High Availability Setup

For production, ensure:

```bash
# Multi-node cluster
kubectl get nodes
# Should have 3+ nodes

# Pod replicas
kubectl -n kubechart get deployment kubechart
# replicas: 3 (minimum)

# Pod anti-affinity (spread across nodes)
kubectl get deployment kubechart -n kubechart -o yaml | grep -A 10 affinity

# Database replication (Longhorn)
numberOfReplicas: "3"

# Backup redundancy
velero backup get
# Multiple backups over time

# Network redundancy
# Multiple network interfaces if available
kubectl get nodes -o wide
```

### RTO & RPO Goals

```
RTO (Recovery Time Objective):
  - Full cluster restore: < 30 minutes
  - Single pod restart: < 1 minute
  - Database restore: < 10 minutes

RPO (Recovery Point Objective):
  - Daily backups: 24 hours max data loss
  - Hourly backups: 1 hour max data loss
  - Continuous replication: 0 hours (zero data loss)
```

---

## Performance Tuning

### Database Performance

```bash
# Check query performance
kubectl -n kubechart exec postgres-0 -- \
  psql -U deployer_user -d kubechart -c "EXPLAIN ANALYZE SELECT * FROM deployments LIMIT 10;"

# Create indexes for common queries
kubectl -n kubechart exec postgres-0 -- \
  psql -U deployer_user -d kubechart -c "CREATE INDEX idx_deployments_user_id ON deployments(user_id);"

# Monitor slow queries (enable logging)
kubectl -n kubechart exec postgres-0 -- \
  psql -U postgres -d kubechart -c "ALTER SYSTEM SET log_min_duration_statement = 1000;" # 1 second

# Reload config
kubectl -n kubechart exec postgres-0 -- \
  psql -U postgres -c "SELECT pg_reload_conf();"
```

### Application Performance

#### Resource Tuning

```bash
# Monitor current usage
kubectl top pod -n kubechart

# Adjust requests/limits based on usage
kubectl -n kubechart set resources deployment kubechart \
  --requests=cpu=200m,memory=384Mi \
  --limits=cpu=1000m,memory=768Mi
```

#### Replicas & Scaling

```bash
# Manual scaling
kubectl -n kubechart scale deployment kubechart --replicas=5

# HPA configuration
minReplicas: 3
maxReplicas: 10
targetCPUUtilizationPercentage: 70
targetMemoryUtilizationPercentage: 80
```

### Storage Performance

```bash
# Check Longhorn performance
kubectl -n longhorn-system exec longhorn-instance-manager-pod -- \
  fio --name=randread --ioengine=libaio --rw=randread --bs=4k --runtime=30

# Adjust replica count (trade-off: speed vs redundancy)
numberOfReplicas: "1" # Fastest, least safe
numberOfReplicas: "2" # Balanced
numberOfReplicas: "3" # Safest
```

### Network Performance

```bash
# Test latency
kubectl run -it --rm netperf --image=netperf --restart=Never -- \
  netperf -H kubernetes.default.svc.cluster.local

# Monitor bandwidth
kubectl exec -it pod-name -- iftop
```

---

## Upgrade Procedures

### Application Upgrade (KubeChart Image)

```bash
# Check current image
kubectl -n kubechart get deployment kubechart -o jsonpath='{.spec.template.spec.containers[0].image}'

# Update image
kubectl -n kubechart set image deployment/kubechart \
  kubechart=yoghlol/pracainz:v2

# Monitor rollout
kubectl -n kubechart rollout status deployment/kubechart -w

# Rollback if needed
kubectl -n kubechart rollout undo deployment/kubechart
```

### Kubernetes Upgrade

```bash
# For RKE2 (latest patch)
curl -sfL https://get.rke2.io | sh -

# For specific version
curl -sfL https://get.rke2.io | INSTALL_RKE2_VERSION=v1.28.5 sh -

# Restart services
sudo systemctl restart rke2-server.service
sudo systemctl restart rke2-agent.service

# Verify
kubectl version
kubectl get nodes
```

### Component Upgrades

```bash
# MetalLB upgrade
helm upgrade metallb metallb/metallb -n metallb-system

# Envoy Gateway upgrade
helm upgrade eg oci://docker.io/envoyproxy/gateway-helm -n envoy-gateway-system

# cert-manager upgrade
helm upgrade cert-manager jetstack/cert-manager -n cert-manager

# Longhorn upgrade
helm upgrade longhorn longhorn/longhorn -n longhorn-system

# Velero upgrade
velero plugin get  # Check current plugins
helm upgrade velero vmware-tanzu/velero -n velero
```

---

## Conclusion

This comprehensive documentation covers all aspects of the KubeChart platform infrastructure from installation through production operation. Key points:

### Quick Reference

```
Stage 1: DataBase.sh
  └─ PostgreSQL on host
  └─ ~15 minutes

Stage 2: Platform.sh
  └─ Kubernetes infrastructure
  └─ ~60 minutes

Stage 3: BackupSys.sh
  └─ Backup system
  └─ ~30 minutes

Stage 4: k8s-deploy2.sh
  └─ Application deployment
  └─ ~30 minutes

Total: ~2 hours for complete setup
```

### Production Checklist

- [ ] All 4 stages deployed successfully
- [ ] Backups configured and tested
- [ ] Monitoring/logging active
- [ ] TLS certificates issued
- [ ] DNS configured
- [ ] RBAC properly restricted
- [ ] Network policies applied
- [ ] Resource limits set
- [ ] High availability configured (3+ nodes)
- [ ] Disaster recovery tested
- [ ] Documentation reviewed

### Support Resources

- Kubernetes Docs: https://kubernetes.io/docs/
- Helm: https://helm.sh/docs/
- MetalLB: https://metallb.universe.tf/
- Envoy Gateway: https://gateway.envoyproxy.io/
- cert-manager: https://cert-manager.io/docs/
- Longhorn: https://longhorn.io/docs/
- Velero: https://velero.io/docs/
- PostgreSQL: https://www.postgresql.org/docs/

Last Updated: January 2026
