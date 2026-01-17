#!/bin/bash
set -e

export KUBECONFIG=/etc/rancher/rke2/rke2.yaml

if ! kubectl get nodes >/dev/null 2>&1; then
  echo "❌ kubectl nie ma połączenia z klastrem"
  echo "➡ Sprawdź czy RKE2 działa i kubeconfig istnieje:"
  echo "   /etc/rancher/rke2/rke2.yaml"
  exit 1
fi

echo "==> Połączenie z klastrem Kubernetes OK"

echo "=========================="
echo "==> Instalacja Helm"
echo "=========================="

if command -v helm >/dev/null 2>&1; then
  echo "==> Helm już zainstalowany"
  helm version
else
  sudo apt-get install curl gpg apt-transport-https --yes
  curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
fi

echo "=========================="
echo " INSTALLACJA MetalLB"
echo "=========================="

kubectl create namespace metallb-system --dry-run=client -o yaml | kubectl apply -f -

if helm status metallb -n metallb-system >/dev/null 2>&1; then
  echo "==> MetalLB już zainstalowany"
else
  echo "==> Instalacja MetalLB"
  helm repo add metallb https://metallb.github.io/metallb
  helm repo update

  helm upgrade --install metallb metallb/metallb -n metallb-system
fi

echo "==> Czekanie na MetalLB controller..."
kubectl wait --for=condition=available deployment/metallb-controller \
  -n metallb-system --timeout=180s

echo "==> Czekanie na webhook MetalLB (endpointy)..."
for i in {1..30}; do
  ENDPOINTS=$(kubectl -n metallb-system get endpoints metallb-webhook-service \
    -o jsonpath='{.subsets[*].addresses[*].ip}' 2>/dev/null || echo "")
  if [[ -n "$ENDPOINTS" ]]; then
    echo "==> Webhook MetalLB gotowy: $ENDPOINTS"
    break
  fi
  echo "Czekam na webhook MetalLB..."
  sleep 5
done

echo "==> Tworzenie AddressPool dla MetalLB"
kubectl apply -f - <<EOF
apiVersion: metallb.io/v1beta1
kind: IPAddressPool
metadata:
  name: default
  namespace: metallb-system
spec:
  addresses:
  - 172.18.255.1-172.18.255.250
---
apiVersion: metallb.io/v1beta1
kind: L2Advertisement
metadata:
  name: l2advertisement
  namespace: metallb-system
EOF

echo "==> Sprawdzanie MetalLB"
kubectl -n metallb-system get all

echo "=========================="
echo " INSTALLACJA Envoy Gateway"
echo "=========================="

kubectl create namespace envoy-gateway-system --dry-run=client -o yaml | kubectl apply -f -

if helm status eg -n envoy-gateway-system >/dev/null 2>&1; then
  echo "==> Envoy Gateway już zainstalowany"
else
  echo "==> Instalacja Envoy Gateway"
  helm install eg oci://docker.io/envoyproxy/gateway-helm \
    --version 1.6.2 \
    -n envoy-gateway-system \
    --set config.provider.kubernetes.service.type=LoadBalancer
fi

echo "==> Czekanie na gotowość Envoy Gateway..."
kubectl wait \
  --timeout=5m \
  -n envoy-gateway-system \
  deployment/envoy-gateway \
  --for=condition=Available

echo "==> Envoy Gateway gotowy"

echo "==============================="
echo " Envoy Gateway zainstalowany ✔"
echo "==============================="

echo ""
echo "==> Service Envoy Gateway:"
kubectl -n envoy-gateway-system get svc

echo "=========================="
echo " INSTALLACJA cert-manager"
echo "=========================="

CERT_MANAGER_VERSION="v1.19.2"

kubectl create namespace cert-manager --dry-run=client -o yaml | kubectl apply -f -

echo "==> Instalacja / aktualizacja CRD cert-manager"
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/${CERT_MANAGER_VERSION}/cert-manager.crds.yaml

helm repo add jetstack https://charts.jetstack.io
helm repo update

helm upgrade --install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --version ${CERT_MANAGER_VERSION}

echo "==> Oczekiwanie na gotowość cert-manager..."

kubectl rollout status deployment cert-manager -n cert-manager --timeout=180s
kubectl rollout status deployment cert-manager-webhook -n cert-manager --timeout=180s
kubectl rollout status deployment cert-manager-cainjector -n cert-manager --timeout=180s

echo "==> cert-manager gotowy"

echo "=========================="
echo " TWORZENIE GATEWAY"
echo "=========================="

kubectl apply -f - <<EOF
apiVersion: gateway.networking.k8s.io/v1
kind: GatewayClass
metadata:
  name: eg
spec:
  controllerName: gateway.envoyproxy.io/gatewayclass-controller
---
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: platform-gateway
  namespace: envoy-gateway-system
spec:
  gatewayClassName: eg
  listeners:
  - name: http
    protocol: HTTP
    port: 80
  - name: https
    protocol: HTTPS
    port: 443
    tls:
      mode: Terminate
      certificateRefs:
      - name: platform-tls
EOF

echo "==> Gateway utworzony"

echo "=========================="
echo " OCZEKIWANIE NA EXTERNAL-IP"
echo "=========================="

for i in {1..60}; do
  IP=$(kubectl -n envoy-gateway-system get svc -l gateway.networking.k8s.io/gateway-name=platform-gateway \
    -o jsonpath='{.items[0].status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "")
  
  if [[ -n "$IP" && "$IP" != "<pending>" ]]; then
    echo "==> EXTERNAL-IP przydzielony: $IP"
    GATEWAY_IP=$IP
    break
  fi
  echo "Czekam na przydzielenie IP..."
  sleep 5
done

if [[ -z "$GATEWAY_IP" ]]; then
  echo "❌ ERROR: MetalLB nie przydzielił IP!"
  exit 1
fi

echo "=========================="
echo " INSTALACJA LONGHORN"
echo "=========================="

kubectl create namespace longhorn-system --dry-run=client -o yaml | kubectl apply -f -

if helm status longhorn -n longhorn-system >/dev/null 2>&1; then
  echo "==> Longhorn już zainstalowany"
else
  helm repo add longhorn https://charts.longhorn.io
  helm repo update

  helm upgrade --install longhorn longhorn/longhorn \
    -n longhorn-system \
    --set defaultSettings.replicaAutoBalance=least-effort \
    --set persistence.defaultClassReplicaCount=3
fi

echo "==> Czekanie na Longhorn komponenty..."

kubectl wait --for=condition=available deployment/longhorn-ui -n longhorn-system --timeout=600s
kubectl wait --for=condition=available deployment/longhorn-driver-deployer -n longhorn-system --timeout=600s

echo "==> Tworzenie StorageClass dla Longhorn"
kubectl apply -f - <<EOF
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: longhorn
provisioner: driver.longhorn.io
allowVolumeExpansion: true
parameters:
  numberOfReplicas: "3"
  staleReplicaTimeout: "2880"
EOF

echo "==> Longhorn + StorageClass skonfigurowane!"

echo "=========================="
echo " WALIDACJA INSTALACJI"
echo "=========================="

echo "==> Sprawdzanie Helm"
helm version

echo "==> Sprawdzanie MetalLB pods:"
kubectl -n metallb-system get pods

echo "==> Sprawdzanie Envoy Gateway pods:"
kubectl -n envoy-gateway-system get pods

echo "==> Sprawdzanie cert-manager pods:"
kubectl -n cert-manager get pods

echo "==> Sprawdzanie Longhorn:"
kubectl -n longhorn-system get pods

echo "=========================="
echo " INSTALACJA ZAKOŃCZONA ✔"
echo "=========================="
echo "Gateway IP: $GATEWAY_IP"
echo "StorageClass: longhorn"
echo ""
echo "Następne kroki:"
echo "1. Dodaj do /etc/hosts:"
echo "   $GATEWAY_IP yourdomain.com"
echo "2. Zaaplikuj cert-issuer:"
echo "   kubectl apply -f cert-issuer-staging.yaml"
echo "   kubectl apply -f cert-issuer-prod.yaml"
echo "3. Zaaplikuj HTTPRoute dla Twojej aplikacji"
