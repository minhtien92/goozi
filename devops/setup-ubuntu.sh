#!/usr/bin/env bash
set -euo pipefail

# Bootstrap Ubuntu host for Goozi: installs Docker Engine + Docker Compose plugin
# and provides a docker-compose wrapper for compatibility with existing scripts.

if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
  echo "[ERROR] Please run as root (use: sudo bash devops/setup-ubuntu.sh)"
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive

echo "==> Updating apt index..."
apt-get update -y

echo "==> Installing base packages..."
apt-get install -y --no-install-recommends \
  ca-certificates \
  curl \
  gnupg \
  htop \
  lsb-release \
  git \
  jq

echo "==> Setting up Docker apt repo..."
install -m 0755 -d /etc/apt/keyrings
if [[ ! -f /etc/apt/keyrings/docker.gpg ]]; then
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
fi

ARCH="$(dpkg --print-architecture)"
CODENAME="$(. /etc/os-release && echo "${VERSION_CODENAME}")"
echo \
  "deb [arch=${ARCH} signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu ${CODENAME} stable" \
  > /etc/apt/sources.list.d/docker.list

apt-get update -y

echo "==> Installing Docker Engine + Compose plugin..."
apt-get install -y --no-install-recommends \
  docker-ce \
  docker-ce-cli \
  containerd.io \
  docker-buildx-plugin \
  docker-compose-plugin

echo "==> Enabling and starting docker service..."
systemctl enable --now docker

echo "==> Ensuring 'docker' group exists..."
groupadd -f docker

if [[ -n "${SUDO_USER:-}" && "${SUDO_USER}" != "root" ]]; then
  echo "==> Adding user '${SUDO_USER}' to docker group..."
  usermod -aG docker "${SUDO_USER}"
  TARGET_USER="${SUDO_USER}"
else
  TARGET_USER="root"
fi

echo "==> Creating docker-compose compatibility wrapper (if needed)..."
# Many existing scripts use `docker-compose`, while new installs use `docker compose`.
if ! command -v docker-compose >/dev/null 2>&1; then
  cat >/usr/local/bin/docker-compose <<'EOF'
#!/usr/bin/env bash
exec docker compose "$@"
EOF
  chmod +x /usr/local/bin/docker-compose
fi

echo "==> Verifying installation..."
docker --version
docker compose version
docker-compose version || true

cat <<EOF

[OK] Ubuntu bootstrap completed.

Next steps:
- IMPORTANT: log out & log back in so '${TARGET_USER}' can run docker without sudo
  (or run: newgrp docker)
- Then from project root, run:
    docker-compose up -d --build
  or (dev):
    docker-compose -f docker-compose.dev.yml up -d --build

EOF

