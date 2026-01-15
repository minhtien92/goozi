#!/usr/bin/env bash
set -euo pipefail

# Install and configure Nginx as reverse proxy for Goozi (web, cms, api)

if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
  echo "[ERROR] Please run as root (use: sudo bash devops/setup-nginx.sh)"
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive

echo "==> Installing nginx..."
apt-get update -y
apt-get install -y nginx

echo ""
echo "==> Configure domain / hostnames for reverse proxy"
read -rp "Main Web domain (e.g. example.com) [default: _]: " WEB_DOMAIN
WEB_DOMAIN=${WEB_DOMAIN:-_}

read -rp "CMS domain (e.g. cms.example.com) [default: _]: " CMS_DOMAIN
CMS_DOMAIN=${CMS_DOMAIN:-_}

read -rp "API domain (e.g. api.example.com) [default: _]: " API_DOMAIN
API_DOMAIN=${API_DOMAIN:-_}

NGINX_CONF="/etc/nginx/sites-available/goozi"

echo "==> Writing Nginx config to ${NGINX_CONF}..."
cat > "${NGINX_CONF}" <<EOF
# Goozi Nginx reverse proxy

map \$http_upgrade \$connection_upgrade {
    default upgrade;
    ''      close;
}

server {
    listen 80;
    server_name ${WEB_DOMAIN};

    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade \$http_upgrade;
        proxy_set_header   Connection \$connection_upgrade;
        proxy_set_header   Host \$host;
        proxy_set_header   X-Real-IP \$remote_addr;
        proxy_set_header   X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto \$scheme;
    }
}

server {
    listen 80;
    server_name ${CMS_DOMAIN};

    location / {
        proxy_pass         http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade \$http_upgrade;
        proxy_set_header   Connection \$connection_upgrade;
        proxy_set_header   Host \$host;
        proxy_set_header   X-Real-IP \$remote_addr;
        proxy_set_header   X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto \$scheme;
    }
}

server {
    listen 80;
    server_name ${API_DOMAIN};

    location / {
        proxy_pass         http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade \$http_upgrade;
        proxy_set_header   Connection \$connection_upgrade;
        proxy_set_header   Host \$host;
        proxy_set_header   X-Real-IP \$remote_addr;
        proxy_set_header   X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto \$scheme;
    }
}
EOF

echo "==> Enabling Nginx site..."
ln -sf "${NGINX_CONF}" /etc/nginx/sites-enabled/goozi

echo "==> Testing Nginx configuration..."
nginx -t

echo "==> Reloading Nginx..."
systemctl enable nginx
systemctl reload nginx

echo "==> Opening HTTP port 80 via ufw (if installed)..."
if command -v ufw >/dev/null 2>&1; then
  ufw allow 80/tcp || true
fi

cat <<EOF

[OK] Nginx is installed and configured as reverse proxy.

- Web: http://${WEB_DOMAIN:-<your-web-domain>}
- CMS: http://${CMS_DOMAIN:-<your-cms-domain>}
- API: http://${API_DOMAIN:-<your-api-domain>}

NOTE:
- Make sure your DNS records (A/AAAA) of those domains point to this server's IP.
- For HTTPS/SSL, you can later install certbot and obtain Let's Encrypt certificates.

EOF

