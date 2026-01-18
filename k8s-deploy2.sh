#!/bin/bash
set -e

# ==========================================
# Kubernetes Deployment Configuration
# ==========================================
KUBE_CONTEXT=""                           # Kubernetes context (leave empty for current context)
KUBE_NAMESPACE="kubechart"                # Kubernetes namespace
KUBECHART_IMAGE="kubechart:latest"        # Docker image URL (use 'kubechart:latest' for local images)
DEPLOYMENT_NAME="kubechart"               # Deployment name
REPLICAS=3                                # Number of replicas
DATABASE_HOST="postgres.kubechart.svc.cluster.local"  # PostgreSQL host
DATABASE_PORT=5432                        # PostgreSQL port
DATABASE_NAME="kubechart"                 # PostgreSQL database name
DATABASE_USER="deployer_user"             # PostgreSQL user
DATABASE_PASSWORD="deployer_password"     # PostgreSQL password
JWT_SECRET="your-secret-jwt-key"          # JWT secret for authentication
PORT=3000                                 # Application port
LOG_LEVEL="info"                          # Log level (debug, info, warn, error)
STORAGE_CLASS="platform-storageclass"     # Longhorn storage class
CPU_REQUEST="100m"                        # CPU request
CPU_LIMIT="500m"                          # CPU limit
MEMORY_REQUEST="256Mi"                    # Memory request
MEMORY_LIMIT="512Mi"                      # Memory limit

# ==========================================
# Color codes
# ==========================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ==========================================
# Functions
# ==========================================
print_header() {
    echo ""
    echo -e "${BLUE}===============================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}===============================================${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}
