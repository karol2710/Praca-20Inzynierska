# External Integrations and System Dependencies

Complete list of all elements **outside the KubeChart app** that it interacts with.

## External Systems Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    KubeChart Application                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │            Core App (React + Express + DB)               │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           │                                     │
└───────────────────────────┼─────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
    Browser          PostgreSQL         Kubernetes
    (Client)         (Database)         (Cluster)
        │                   │                   │
        ├─ HTTP/HTTPS       ├─ TCP/5432        ├─ HTTP/HTTPS
        │                   │                   │
        └─ WebSocket        └─ SSL/TLS          └─ REST API
```

---

## 1. **Kubernetes Cluster**

**What it is:** Container orchestration platform

**Interactions:**
```
KubeChart ←→ Kubernetes API Server
   ├─ Create resources (Deployment, Pod, Service, etc.)
   ├─ Read resource status
   ├─ Update existing resources
   ├─ Delete resources
   └─ Watch for changes
```

**Communication:**
- **Protocol**: HTTPS REST API
- **Authentication**: ServiceAccount token (in-cluster) or kubeconfig
- **Port**: 6443 (default)
- **Endpoint**: `https://kubernetes.default.svc.cluster.local:6443`

**Resources Managed:**
```
Workloads:
├─ Deployment
├─ StatefulSet
├─ Pod
├─ Job
├─ CronJob
└─ ReplicaSet

Networking:
├─ Service
├─ Ingress
├─ HTTPRoute
└─ NetworkPolicy

Configuration:
├─ ConfigMap
├─ Secret
└─ ResourceQuota

RBAC:
├─ Role
├─ RoleBinding
├─ ClusterRole
└─ ClusterRoleBinding

Storage:
├─ PersistentVolume
└─ PersistentVolumeClaim

Advanced:
├─ BackendTrafficPolicy
├─ Namespace
└─ Certificate
```

**Data Flow:**
```
User Form Input
    ↓
YAML Generation (in app)
    ↓
REST API Call to K8s
    ↓
K8s creates resources
    ↓
K8s returns status
    ↓
App stores in database
```

---

## 2. **PostgreSQL Database**

**What it is:** Relational database for persistent storage

**Interactions:**
```
KubeChart ←→ PostgreSQL Database
   ├─ Create user records
   ├─ Store deployments
   ├─ Query user data
   ├─ Update deployment status
   └─ Delete records
```

**Communication:**
- **Protocol**: PostgreSQL wire protocol
- **Authentication**: Username/Password
- **Port**: 5432 (default)
- **Connection**: TCP socket or Unix socket
- **Encryption**: SSL/TLS (recommended)

**Stored Data:**
```
users table:
├─ User credentials (hashed passwords)
├─ User profile info
└─ Kubernetes integration tokens

deployments table:
├─ Deployment YAML configs
├─ Form input data (JSON)
├─ Deployment status
├─ Resource counts
└─ Timestamps
```

**Data Flow:**
```
User Action (Web UI)
    ↓
Express Server receives request
    ↓
Database query via pg driver
    ↓
PostgreSQL executes SQL
    ↓
Returns result
    ↓
Send response to client
```

---

## 3. **Browser (Client)**

**What it is:** User's web browser running React SPA

**Interactions:**
```
Browser ←→ KubeChart Server
   ├─ Load HTML/CSS/JavaScript
   ├─ Fetch API requests
   ├─ WebSocket (optional, for real-time)
   └─ Local storage (session tokens)
```

**Communication:**
- **Protocol**: HTTP/HTTPS
- **Port**: 8080 (development) or 80/443 (production)
- **Methods**: GET, POST, PUT, DELETE

**Data Exchange:**
```
Browser → Server:
├─ Form data (JSON)
├─ Authentication token
├─ Query parameters
└─ File uploads

Server → Browser:
├─ HTML (initial load)
├─ JavaScript bundles
├─ CSS stylesheets
├─ API responses (JSON)
└─ Deployment status
```

**Local Storage:**
- **JWT Token** - Stored in browser localStorage
- **User info** - Cached locally
- **Preferences** - Theme, layout settings (optional)

---

## 4. **Container Registry**

**What it is:** Docker image repository (Docker Hub, private registry, etc.)

**Interactions:**
```
Kubernetes Node ←→ Container Registry
   └─ Pull container images
```

**When Needed:**
- User specifies container image: `nginx:latest`
- Kubernetes pulls image from registry
- Image runs as container

**Common Registries:**
- **Docker Hub** - `docker.io/nginx:latest`
- **Google Container Registry** - `gcr.io/...`
- **AWS ECR** - `123456.dkr.ecr.us-east-1.amazonaws.com/...`
- **Private Registry** - Your own container registry

**Communication:**
- **Protocol**: HTTPS
- **Authentication**: Pull secrets (credentials)
- **Interaction**: Kubernetes handles pulling, not KubeChart directly

---

## 5. **File System**

**What it is:** Operating system filesystem and files

**Files Used:**
```
Kubernetes cluster access:
├─ /etc/rancher/rke2/rke2.yaml (RKE2 kubeconfig)
├─ /etc/kubernetes/admin.conf (standard kubeconfig)
├─ /var/run/secrets/kubernetes.io/serviceaccount/ (in-cluster creds)
│  ├─ token
│  ├─ ca.crt
│  └─ namespace
└─ ~/.kube/config (local kubeconfig)

Database files:
├─ PostgreSQL data directory
├─ WAL logs (write-ahead logs)
└─ Backups

Application files:
├─ /app/dist/ (production build)
├─ /app/node_modules/ (dependencies)
├─ .env (environment variables)
└─ package.json
```

**File Operations:**
```
KubeChart uses files for:
├─ Reading kubeconfig for K8s auth
├─ Reading service account token (in-cluster)
├─ Storing certificates (if cert-manager)
└─ Logging (application logs)
```

---

## 6. **Certificate Manager (cert-manager)**

**What it is:** Kubernetes addon for TLS certificate management

**Interactions:**
```
KubeChart → Creates Certificate resource
    ↓
cert-manager watches for Certificate
    ↓
cert-manager requests certificate from CA
    ↓
CA issues certificate (Let's Encrypt, etc.)
    ↓
cert-manager stores in K8s Secret
    ↓
Ingress/HTTPRoute uses certificate
    ↓
HTTPS traffic encrypted
```

**External Dependency:**
- **Let's Encrypt API** (if using ACME)
- **DNS (for ACME challenges)**

**Communication:**
- **Protocol**: HTTPS REST API (to Certificate Authority)
- **Standard**: ACME protocol

---

## 7. **DNS System**

**What it is:** Domain Name System for hostname resolution

**Interactions:**
```
Browser ↓
User types: app.example.com
   ↓
DNS lookup: app.example.com → IP address
   ↓
Browser connects to IP
   ↓
Request reaches LoadBalancer/Ingress
   ↓
Traffic routed to KubeChart or user app
```

**In Kubernetes:**
```
Pod ↓
Needs to resolve: kubernetes.default.svc.cluster.local
   ↓
Kubernetes DNS (CoreDNS) resolves
   ↓
Returns ClusterIP
   ↓
Pod connects to service
```

**DNS Resolution Points:**
- **External**: `example.com` → LoadBalancer IP
- **Internal**: Service names within cluster
- **Pod-to-Pod**: `pod-name.namespace.svc.cluster.local`

---

## 8. **Kubernetes DNS (CoreDNS)**

**What it is:** Internal Kubernetes DNS server

**Interactions:**
```
Pod in cluster ↓
Needs to access service
   ↓
Query: myservice.default.svc.cluster.local
   ↓
CoreDNS (running in kube-system namespace)
   ↓
Returns ClusterIP
   ↓
Pod connects to service
```

**Communication:**
- **Protocol**: DNS (UDP/TCP port 53)
- **Service Name**: `kube-dns` or `coredns`
- **Namespace**: `kube-system`

---

## 9. **Envoy Gateway (Optional)**

**What it is:** Modern API Gateway for traffic management

**Interactions:**
```
Internet Traffic
    ↓
Envoy Gateway (LoadBalancer)
    ↓
Reads HTTPRoute & BackendTrafficPolicy
    ↓
Routes to backend services
    ↓
Rate limiting applied
```

**When Used:**
- User deploys with HTTPRoute
- User configures rate limiting
- Advanced traffic management

**External Components:**
- **Gateway** - LoadBalancer service
- **HTTPRoute** - Created by KubeChart
- **BackendTrafficPolicy** - Rate limiting config

---

## 10. **Container Runtime**

**What it is:** Software that runs containers (Docker, containerd, etc.)

**Interactions:**
```
Kubernetes Node
    ↓
Container Runtime (Docker/containerd)
    ↓
Pulls images
    ↓
Runs containers
    ↓
Manages container lifecycle
```

**Kubernetes communicates with:**
- **Docker** - `docker.sock` socket
- **containerd** - CRI (Container Runtime Interface)
- **CRI-O** - Kubernetes-native container runtime

**Note:** KubeChart doesn't directly interact with container runtime; Kubernetes does.

---

## 11. **Load Balancer / Ingress Controller**

**What it is:** Manages external traffic entry to cluster

**Interactions:**
```
External User
    ↓
Load Balancer (Public IP)
    ↓
Ingress Controller (nginx, Envoy, etc.)
    ↓
Routes to Service
    ↓
Routes to Pod
```

**Types:**
- **External LoadBalancer** (cloud providers)
- **Ingress Controller** (nginx, Envoy)
- **NodePort** (direct node access)
- **MetalLB** (bare metal load balancing)

---

## 12. **Logging System (Optional)**

**What it is:** Centralized logging platform

**Interactions:**
```
KubeChart writes to stdout/stderr
    ↓
Kubernetes captures logs
    ↓
Logging system (ELK, Loki, etc.)
    ↓
Stores and indexes
    ↓
User views in logging dashboard
```

**Common Logging Stacks:**
- **ELK Stack** (Elasticsearch, Logstash, Kibana)
- **Loki** (Grafana Loki)
- **Splunk**
- **CloudWatch** (AWS)

---

## 13. **Monitoring / Metrics (Optional)**

**What it is:** Prometheus and Grafana for metrics

**Interactions:**
```
Kubernetes metrics
    ↓
Prometheus scrapes metrics
    ↓
Stores time-series data
    ↓
Grafana visualizes
    ↓
User views dashboards
```

**Metrics Collected:**
- CPU/Memory usage
- Request latency
- Error rates
- Pod count
- Network I/O

---

## 14. **Network Plugin (CNI)**

**What it is:** Kubernetes networking addon

**Examples:**
- **Flannel** - Simple overlay network
- **Calico** - Network policies
- **Weave** - Encrypted networking
- **Cilium** - eBPF-based networking

**Interactions:**
```
Pod networking
    ↓
CNI plugin assigns IP address
    ↓
Pod can communicate with other pods
    ↓
Network policies enforced
```

---

## 15. **Cloud Provider Integration (Optional)**

**What it is:** Integration with cloud platforms

**Providers:**
- **AWS** - LoadBalancer, EBS volumes, IAM
- **Google Cloud** - Kubernetes Engine, Cloud Storage
- **Azure** - AKS, managed services
- **DigitalOcean** - LoadBalancer, volumes

**Interactions:**
```
Kubernetes service type: LoadBalancer
    ↓
Cloud provider API called
    ↓
Cloud allocates external IP
    ↓
Traffic routed to service
```

---

## 16. **Custom CRDs (Custom Resource Definitions)**

**What it is:** Custom Kubernetes resource types

**Examples:**
- **BackendTrafficPolicy** - Envoy Gateway CRD
- **Certificate** - cert-manager CRD
- **VirtualService** - Istio CRD (if using service mesh)
- **PodMonitor** - Prometheus CRD

**Interactions:**
```
KubeChart creates custom resource
    ↓
Operator watches for it
    ↓
Operator creates supporting resources
    ↓
Feature enabled
```

---

## 17. **Persistent Storage (Optional)**

**What it is:** External storage systems

**Types:**
- **Cloud Storage** - AWS EBS, Azure Disks, GCP Persistent Disks
- **Network Storage** - NFS, SMB
- **Block Storage** - iSCSI, Ceph
- **Object Storage** - S3, GCS

**Interactions:**
```
Pod requests PersistentVolumeClaim
    ↓
Kubernetes provisions volume
    ↓
Storage system allocates space
    ↓
Pod mounts volume
    ↓
Data persists across pod restarts
```

---

## 18. **Service Mesh (Optional)**

**What it is:** Advanced networking (Istio, Linkerd, etc.)

**Interactions:**
```
Pod-to-pod communication
    ↓
Service mesh sidecar proxy intercepts
    ↓
Applies policies:
├─ Traffic management
├─ Security policies
├─ Retry logic
└─ Circuit breaking
```

---

## Complete Integration Map

```
┌──────────────────────────────────────────────────────────────────┐
│                      KubeChart Application                       │
│                  (React + Express + PostgreSQL)                  │
└──────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
    Browser              PostgreSQL           Kubernetes
    HTTP/HTTPS            TCP/5432             HTTPS/6443
        │                     │                     │
        │                     │        ┌────────────┼────────────┐
        │                     │        │            │            │
        │                     │        ▼            ▼            ▼
        │                     │    CoreDNS    Container Mgmt   CRDs
        │                     │                                  │
        │                     │        ┌────────────┬───────────┘
        │                     │        │            │
        │                     │        ▼            ▼
        │                     │   kubelet       cert-manager
        │                     │      │               │
        │                     │      ▼               ▼
        │                     │  Container      Let's Encrypt
        │                     │  Runtime        (ACME)
        │                     │      │               │
        │                     │      ▼               ▼
        │                     │  Docker/      TLS Certificate
        │                     │  containerd        │
        │                     │      │             │
        │                     └──────┼─────────────┘
        │                            │
        ▼                            ▼
    LocalStorage          Container Registry
    (JWT, etc.)           (Docker Hub, ECR)
                                │
                                ▼
                          Container Image
                            nginx:latest
                                │
                                ▼
                          Running Container
```

---

## Summary Table

| External System | Type | Purpose | Protocol | Port |
|---|---|---|---|---|
| **Kubernetes** | Cluster | Orchestration | HTTPS | 6443 |
| **PostgreSQL** | Database | Data storage | TCP | 5432 |
| **Browser** | Client | User interface | HTTP/HTTPS | 8080/443 |
| **Container Registry** | Image storage | Container images | HTTPS | 443 |
| **DNS** | Network | Hostname resolution | UDP/TCP | 53 |
| **CoreDNS** | K8s addon | Internal DNS | UDP/TCP | 53 |
| **cert-manager** | K8s addon | Certificate management | - | - |
| **Envoy Gateway** | K8s addon | Traffic management | HTTP/HTTPS | 80/443 |
| **Container Runtime** | Node | Container execution | Socket | - |
| **Load Balancer** | Network | External access | TCP | 80/443 |
| **Logging** (Optional) | Addon | Log aggregation | HTTPS | Various |
| **Monitoring** (Optional) | Addon | Metrics collection | HTTPS | 9090 |
| **Storage** (Optional) | External | Persistent data | Various | Various |

---

## Data Flow Summary

```
1. User interacts with Browser
   ↓
2. Browser sends HTTP request to KubeChart Server
   ↓
3. Server processes request
   ├─ Queries PostgreSQL database
   └─ Creates YAML configuration
   ↓
4. Server sends REST API call to Kubernetes
   ↓
5. Kubernetes:
   ├─ Creates resources
   ├─ Uses Container Runtime to run containers
   ├─ Pulls images from Container Registry
   ├─ Uses DNS for service discovery
   └─ Manages networking with CNI
   ↓
6. LoadBalancer/Ingress exposes service externally
   ↓
7. User accesses deployed application
```

---

This comprehensive list shows all external systems KubeChart depends on and interacts with! 🔗
