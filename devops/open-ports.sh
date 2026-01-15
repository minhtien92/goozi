#!/usr/bin/env bash
set -euo pipefail

# Open Goozi app ports (3000, 3001, 3002) via UFW firewall on Ubuntu

if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
  echo "[ERROR] Please run as root (use: sudo bash devops/open-ports.sh)"
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive

echo "==> Installing ufw (if missing)..."
apt-get update -y
apt-get install -y ufw

echo "==> Allowing SSH (port 22) to avoid lockout..."
ufw allow 22/tcp || true

echo "==> Allowing Goozi ports..."
ufw allow 3000/tcp
ufw allow 3001/tcp
ufw allow 3002/tcp

echo "==> Enabling UFW firewall (if not already enabled)..."
ufw --force enable

echo ""
echo "[OK] Ports 3000, 3001, 3002 are now open (TCP)."
echo "Current status:"
ufw status verbose

