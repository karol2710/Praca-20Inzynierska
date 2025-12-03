#!/bin/bash

# KubeChart - Docker & Kubernetes Deployment Script
# This script automates the build, push, and deployment process

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REGISTRY="${1:-}"
VERSION="${2:-latest}"
NAMESPACE="kubechart"
APP_NAME="kubechart"

# Functions
log() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

error() {
  echo -e "${RED}[ERROR]${NC} $1"
  exit 1
}

warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_usage() {
  cat << EOF
Usage: $0 <registry> [version]

Arguments:
  registry    Container registry URL (e.g., docker.io/username, gcr.io/project)
  version     Image version tag (default: latest)

Examples:
  $0 docker.io/myusername
  $0 docker.io/myusername v1.0.0
  $0 gcr.io/my-project
  $0 gcr.io/my-project v2.1.0

Prerequisites:
  - Docker installed and running
  - kubectl installed and configured
  - Kubernetes cluster accessible
  - Container registry authenticated (docker login)
  - kubernetes/secrets.env file with DATABASE_URL and JWT_SECRET

EOF
}

check_prerequisites() {
  log "Checking prerequisites..."

  # Check Docker
  if ! command -v docker &> /dev/null; then
    error "Docker is not installed. Please install Docker."
  fi
  log "✓ Docker found: $(docker --version)"

  # Check kubectl
  if ! command -v kubectl &> /dev/null; then
    error "kubectl is not installed. Please install kubectl."
  fi
  log "✓ kubectl found: $(kubectl version --client --short)"

  # Check Kubernetes cluster connectivity
  if ! kubectl cluster-info &> /dev/null; then
    error "Cannot connect to Kubernetes cluster. Please configure kubectl."
  fi
  log "✓ Kubernetes cluster connected"

  # Check if Dockerfile exists
  if [ ! -f "Dockerfile" ]; then
    error "Dockerfile not found in current directory."
  fi
  log "✓ Dockerfile found"

  # Check if kubernetes manifests exist
  if [ ! -d "kubernetes" ]; then
    error "kubernetes/ directory not found."
  fi
  log "✓ kubernetes/ directory found"

  # Check if secrets.env exists
  if [ ! -f "kubernetes/secrets.env" ]; then
    warning "kubernetes/secrets.env not found. You'll need to update secrets manually."
  fi

  log "✓ All prerequisites satisfied"
}

build_docker_image() {
  local image_name="${REGISTRY}/${APP_NAME}:${VERSION}"

  log "Building Docker image: $image_name"
  log "This may take a few minutes..."

  if docker build -t "$image_name" .; then
    success "Docker image built successfully"
    echo "  Image: $image_name"
  else
    error "Failed to build Docker image"
  fi
}

push_docker_image() {
  local image_name="${REGISTRY}/${APP_NAME}:${VERSION}"

  log "Pushing Docker image to registry: $image_name"
  log "Ensure you are logged in to the container registry (docker login)"

  if docker push "$image_name"; then
    success "Docker image pushed successfully"
    echo "  Image: $image_name"
  else
    error "Failed to push Docker image"
  fi
}

update_kubernetes_manifests() {
  local image_name="${REGISTRY}/${APP_NAME}:${VERSION}"

  log "Updating Kubernetes manifests with new image: $image_name"

  # Update deployment.yaml
  if [ -f "kubernetes/deployment.yaml" ]; then
    sed -i.bak "s|image: .*${APP_NAME}:.*|image: $image_name|g" kubernetes/deployment.yaml
    rm -f kubernetes/deployment.yaml.bak
    success "Updated kubernetes/deployment.yaml"
  fi

  # Update kustomization.yaml
  if [ -f "kubernetes/kustomization.yaml" ]; then
    sed -i.bak "s|newTag: .*|newTag: $VERSION|g" kubernetes/kustomization.yaml
    rm -f kubernetes/kustomization.yaml.bak
    success "Updated kubernetes/kustomization.yaml"
  fi
}

create_namespace() {
  log "Creating Kubernetes namespace: $NAMESPACE"

  if kubectl get namespace "$NAMESPACE" &> /dev/null; then
    log "Namespace $NAMESPACE already exists"
  else
    kubectl create namespace "$NAMESPACE"
    success "Namespace $NAMESPACE created"
  fi
}

deploy_to_kubernetes() {
  log "Deploying to Kubernetes cluster..."

  if kubectl apply -k kubernetes/; then
    success "Kubernetes deployment successful"
  else
    error "Failed to deploy to Kubernetes"
  fi
}

wait_for_deployment() {
  log "Waiting for deployment to be ready..."
  log "This may take a minute or two..."

  if kubectl rollout status deployment/"$APP_NAME" -n "$NAMESPACE" --timeout=5m; then
    success "Deployment is ready"
  else
    error "Deployment rollout failed or timed out"
  fi
}

show_deployment_info() {
  log "Deployment Information:"
  echo ""
  echo "Namespace: $NAMESPACE"
  echo "App Name: $APP_NAME"
  echo "Image: ${REGISTRY}/${APP_NAME}:${VERSION}"
  echo ""

  echo "Pods:"
  kubectl get pods -n "$NAMESPACE" -l app="$APP_NAME" --no-headers

  echo ""
  echo "Services:"
  kubectl get svc -n "$NAMESPACE" --no-headers | grep -E "$APP_NAME|kubechart"

  echo ""
  echo "Access the application:"
  echo "  Option 1 - Port Forward:"
  echo "    kubectl port-forward -n $NAMESPACE svc/$APP_NAME 3000:80"
  echo "    Then visit: http://localhost:3000"
  echo ""
  echo "  Option 2 - LoadBalancer (if available):"
  echo "    kubectl get svc -n $NAMESPACE kubechart-lb"
  echo ""
  echo "  Option 3 - Ingress (if configured):"
  echo "    kubectl get ingress -n $NAMESPACE"
  echo ""

  echo "Useful commands:"
  echo "  View logs:      kubectl logs -f -n $NAMESPACE -l app=$APP_NAME"
  echo "  Describe pod:   kubectl describe pod -n $NAMESPACE <pod-name>"
  echo "  Check status:   kubectl get pods -n $NAMESPACE"
  echo "  Restart:        kubectl rollout restart deployment/$APP_NAME -n $NAMESPACE"
}

main() {
  # Print banner
  cat << 'EOF'
╔═══════════════════════════════════════════════════════════════╗
║         KubeChart - Docker & Kubernetes Deployment           ║
║                                                               ║
║   Automated Build, Push, and Kubernetes Deployment Script    ║
╚═══════════════════════════════════════════════════════════════╝
EOF

  echo ""

  # Validate inputs
  if [ -z "$REGISTRY" ]; then
    echo "❌ Container registry not specified"
    echo ""
    print_usage
    exit 1
  fi

  log "Configuration:"
  echo "  Registry: $REGISTRY"
  echo "  Version: $VERSION"
  echo "  Namespace: $NAMESPACE"
  echo "  App Name: $APP_NAME"
  echo ""

  # Check prerequisites
  check_prerequisites
  echo ""

  # Build Docker image
  build_docker_image
  echo ""

  # Push Docker image
  push_docker_image
  echo ""

  # Update manifests
  update_kubernetes_manifests
  echo ""

  # Create namespace
  create_namespace
  echo ""

  # Deploy to Kubernetes
  deploy_to_kubernetes
  echo ""

  # Wait for deployment
  wait_for_deployment
  echo ""

  # Show deployment info
  show_deployment_info
  echo ""

  # Final success message
  success "Deployment completed successfully!"
  echo ""
  cat << 'EOF'
Next steps:
  1. Monitor logs: kubectl logs -f -n kubechart -l app=kubechart
  2. Test the application: kubectl port-forward svc/kubechart 3000:80
  3. Check pod status: kubectl get pods -n kubechart
  4. View deployment details: kubectl describe deployment kubechart -n kubechart

For more information, see:
  - DOCKER_KUBERNETES_DEPLOYMENT.md (comprehensive guide)
  - KUBERNETES_QUICK_REFERENCE.md (quick commands)
  - DEPLOYMENT_CHECKLIST.md (pre-flight checks)

EOF
}

# Run main function
main "$@"
