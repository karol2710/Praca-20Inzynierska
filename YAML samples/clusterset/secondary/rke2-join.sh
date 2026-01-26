#!/bin/bash
set -e

### KONFIGURACJA ###
NODE_IP="192.168.91.166"          # IP TEGO serwera
SERVER_IP="192.168.88.176"        # IP serwera głównego
TOKEN="/etc/rancher/rke2/node-token"

echo "==> Instalacja RKE2 (server JOIN)"

curl -sfL https://get.rke2.io | sudo sh -

mkdir -p /etc/rancher/rke2

cat <<EOF > /etc/rancher/rke2/config.yaml
node-ip: ${NODE_IP}
node-name: serwerb
server: https://${SERVER_IP}:9345
token: ${TOKEN}
write-kubeconfig-mode: "0644"
tls-san:
  - ${SERVER_IP}
  - ${NODE_IP}
EOF

echo "==> Włączanie i uruchamianie rke2-server"
systemctl enable rke2-server
systemctl start rke2-server

echo "==> Czekanie na synchronizację z klastrem..."
sleep 30

systemctl status rke2-server --no-pager
