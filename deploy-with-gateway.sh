#!/bin/bash

# Deploy KubeChart with Envoy Gateway Integration
# This script deploys the gateway configuration and KubeChart application

set -e

echo "=== KubeChart Deployment with Envoy Gateway ==="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check kubectl availability
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}Error: kubectl is not installed${NC}"
    exit 1
fi

# Function to print section headers
print_header() {
    echo ""
    echo -e "${YELLOW}>>> $1${NC}"
    echo ""
}

# Function to check resource status
check_status() {
    local kind=$1
    local name=$2
    local namespace=$3
    
    echo "Checking $kind/$name in namespace/$namespace..."
    kubectl get $kind $name -n $namespace 2>/dev/null || echo "Not yet ready"
}

# Step 1: Install Envoy Gateway (if not already installed)
print_header "Step 1: Checking Envoy Gateway Installation"

if kubectl get namespace envoy-gateway-system &> /dev/null; then
    echo -e "${GREEN}Envoy Gateway namespace already exists${NC}"
else
    echo "Installing Envoy Gateway..."
    kubectl create namespace envoy-gateway-system || true
    kubectl apply -f https://github.com/envoyproxy/gateway/releases/download/v0.6.0/install.yaml || {
        echo -e "${YELLOW}Note: Envoy Gateway installation failed. Please install manually:${NC}"
        echo "kubectl apply -f https://github.com/envoyproxy/gateway/releases/download/v0.6.0/install.yaml"
        read -p "Continue anyway? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    }
fi

# Step 2: Deploy Gateway Configuration
print_header "Step 2: Deploying Envoy Gateway Configuration"

echo "Applying Gateway configuration..."
if [ -f "kubernetes/gateway.yaml" ]; then
    kubectl apply -f kubernetes/gateway.yaml
    echo -e "${GREEN}Gateway configuration deployed${NC}"
else
    echo -e "${RED}gateway.yaml not found${NC}"
    exit 1
fi

# Wait for gateway to be ready
echo "Waiting for Gateway to be ready..."
sleep 2
check_status "gateway" "platform-gateway" "envoy-gateway-system"

# Step 3: Deploy KubeChart Application
print_header "Step 3: Deploying KubeChart Application"

echo "Applying Kustomize configuration..."
if [ -d "kubernetes" ] && [ -f "kubernetes/kustomization.yaml" ]; then
    kubectl apply -k kubernetes/
    echo -e "${GREEN}KubeChart application deployed${NC}"
else
    echo -e "${RED}Kustomization files not found${NC}"
    exit 1
fi

# Wait for deployment
echo "Waiting for deployment to be ready..."
sleep 5
kubectl rollout status deployment/kubechart -n kubechart --timeout=300s || {
    echo -e "${YELLOW}Deployment status check failed. This might be normal if pods are still starting.${NC}"
}

# Step 4: Verify Deployment
print_header "Step 4: Verifying Deployment"

echo "Gateway Status:"
kubectl get gateway -n envoy-gateway-system
echo ""

echo "HTTPRoute Status:"
kubectl get httproute -n kubechart
echo ""

echo "Service Status:"
kubectl get svc -n kubechart
echo ""

echo "Pod Status:"
kubectl get pods -n kubechart
echo ""

# Step 5: Get Gateway Information
print_header "Step 5: Gateway Access Information"

echo "Waiting for gateway to get external IP..."
sleep 5

GATEWAY_IP=$(kubectl get svc -n envoy-gateway-system -l app.kubernetes.io/name=envoy-gateway -o jsonpath='{.items[0].status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "pending")

if [ "$GATEWAY_IP" != "pending" ] && [ ! -z "$GATEWAY_IP" ]; then
    echo -e "${GREEN}Gateway External IP: $GATEWAY_IP${NC}"
    echo ""
    echo "Configure your DNS records:"
    echo "  kubechart.example.com -> $GATEWAY_IP"
    echo "  *.kubechart.example.com -> $GATEWAY_IP"
else
    echo -e "${YELLOW}Gateway external IP is pending. This might take a few minutes.${NC}"
    echo "Run this command to check the IP:"
    echo "  kubectl get svc -n envoy-gateway-system"
fi

# Step 6: Verify HTTPRoute
print_header "Step 6: HTTPRoute Details"

echo "HTTPRoute Configuration:"
kubectl get httproute kubechart -n kubechart -o yaml | grep -A 20 "spec:"
echo ""

# Step 7: Final Instructions
print_header "Step 7: Deployment Complete"

echo -e "${GREEN}KubeChart has been successfully deployed with Envoy Gateway!${NC}"
echo ""
echo "Next steps:"
echo "1. Wait for the gateway external IP to be assigned (2-5 minutes)"
echo "2. Update your DNS records to point to the gateway IP"
echo "3. Access KubeChart at: https://kubechart.example.com"
echo ""
echo "Useful commands:"
echo "  # Check gateway status"
echo "  kubectl get gateway -n envoy-gateway-system"
echo "  kubectl describe gateway platform-gateway -n envoy-gateway-system"
echo ""
echo "  # Check HTTPRoute status"
echo "  kubectl get httproute -n kubechart"
echo "  kubectl describe httproute kubechart -n kubechart"
echo ""
echo "  # View logs"
echo "  kubectl logs -n envoy-gateway-system -l app=envoy-gateway"
echo "  kubectl logs -n kubechart -l app=kubechart"
echo ""
echo "  # Monitor deployment"
echo "  kubectl get pods -n kubechart -w"
echo ""
echo "For more information, see ENVOY_GATEWAY_INTEGRATION.md"
