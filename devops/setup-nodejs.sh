#!/usr/bin/env bash
set -euo pipefail

# Install Node.js (18.x LTS) and useful global packages (sequelize-cli, npm check)
# For running backend/migrations directly on host (không dùng Docker)

if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
  echo "[ERROR] Please run as root (use: sudo bash devops/setup-node.sh)"
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive

echo "==> Installing prerequisites for NodeSource..."
apt-get update -y
apt-get install -y --no-install-recommends ca-certificates curl gnupg

echo "==> Adding NodeSource repo for Node.js 18.x..."
curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
NODE_MAJOR=18
echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_${NODE_MAJOR}.x nodistro main" \
  > /etc/apt/sources.list.d/nodesource.list

apt-get update -y

echo "==> Installing Node.js ${NODE_MAJOR}.x..."
apt-get install -y nodejs

echo "==> Node & npm versions:"
node -v
npm -v

echo "==> Installing useful global npm packages..."
npm install -g npm
npm install -g sequelize-cli

echo ""
echo "[OK] Node.js and global packages installed."
echo "Global packages:"
echo "  - sequelize-cli (run: sequelize --help)"
echo ""
echo "You can now run backend locally, ví dụ:"
echo "  cd backend"
echo "  npm install"
echo "  npm run migrate"
echo "  npm run dev"

