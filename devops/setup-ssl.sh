#!/usr/bin/env bash
set -euo pipefail

# Setup SSL/HTTPS with Let's Encrypt for Goozi domains
# Usage: sudo bash devops/setup-ssl.sh

if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
  echo "[ERROR] Please run as root (use: sudo bash devops/setup-ssl.sh)"
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive

echo "🔒 Setup SSL/HTTPS with Let's Encrypt"
echo "======================================="
echo ""

# Check if Nginx is installed
if ! command -v nginx &> /dev/null; then
    echo "❌ Nginx is not installed. Please run devops/setup-nginx.sh first."
    exit 1
fi

# Install Certbot
echo "==> Installing Certbot..."
if ! command -v certbot &> /dev/null; then
    apt-get update -y
    apt-get install -y certbot python3-certbot-nginx
else
    echo "✅ Certbot already installed"
fi

# Function to validate domain
validate_domain() {
    local domain=$1
    # Check if domain contains only valid characters (letters, numbers, dots, hyphens)
    if [[ ! "$domain" =~ ^[a-zA-Z0-9][a-zA-Z0-9\.-]*[a-zA-Z0-9]$ ]] || [[ "$domain" =~ , ]]; then
        return 1
    fi
    # Check if domain has at least one dot
    if [[ ! "$domain" =~ \. ]]; then
        return 1
    fi
    return 0
}

# Get domains
echo ""
echo "==> Enter your domains:"
while true; do
    read -rp "Web domain (e.g., web.goozi.org): " WEB_DOMAIN
    WEB_DOMAIN=${WEB_DOMAIN:-web.goozi.org}
    if validate_domain "$WEB_DOMAIN"; then
        break
    else
        echo "❌ Invalid domain format. Please use format like: web.goozi.org"
    fi
done

while true; do
    read -rp "CMS domain (e.g., cms.goozi.org): " CMS_DOMAIN
    CMS_DOMAIN=${CMS_DOMAIN:-cms.goozi.org}
    if validate_domain "$CMS_DOMAIN"; then
        break
    else
        echo "❌ Invalid domain format. Please use format like: cms.goozi.org"
    fi
done

while true; do
    read -rp "API domain (e.g., api.goozi.org): " API_DOMAIN
    API_DOMAIN=${API_DOMAIN:-api.goozi.org}
    if validate_domain "$API_DOMAIN"; then
        break
    else
        echo "❌ Invalid domain format. Please use format like: api.goozi.org"
    fi
done

echo ""
echo "📋 Domains:"
echo "   Web: $WEB_DOMAIN"
echo "   CMS: $CMS_DOMAIN"
echo "   API: $API_DOMAIN"
echo ""

read -p "Continue with SSL setup? [y/N]: " confirm
if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
    echo "❌ Cancelled"
    exit 0
fi

# Ensure Nginx config exists
NGINX_CONF="/etc/nginx/sites-available/goozi"
if [ ! -f "$NGINX_CONF" ]; then
    echo "⚠️  Nginx config not found. Creating basic config..."
    
    cat > "$NGINX_CONF" <<EOF
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

    client_max_body_size 50M;

    location / {
        proxy_pass         http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade \$http_upgrade;
        proxy_set_header   Connection \$connection_upgrade;
        proxy_set_header   Host \$host;
        proxy_set_header   X-Real-IP \$remote_addr;
        proxy_set_header   X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto \$scheme;
        proxy_set_header   X-Forwarded-Host \$host;
    }
}
EOF

    ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/goozi
    nginx -t
    systemctl reload nginx
fi

# Open port 443
echo ""
echo "==> Opening port 443..."
if command -v ufw >/dev/null 2>&1; then
    ufw allow 443/tcp || true
    echo "✅ Port 443 opened"
fi

# Get email for Let's Encrypt
read -rp "Email for Let's Encrypt notifications: " EMAIL
EMAIL=${EMAIL:-admin@${WEB_DOMAIN#*.}}

# Obtain SSL certificates
echo ""
echo "==> Obtaining SSL certificates from Let's Encrypt..."
echo "Email: $EMAIL"
echo ""

# Function to get or fix certificate
get_certificate() {
    local domain=$1
    echo "Getting certificate for $domain..."
    
    # Check if certificate exists and is valid
    if [ -d "/etc/letsencrypt/live/$domain" ]; then
        # Try to renew first
        if certbot renew --cert-name "$domain" --dry-run &>/dev/null; then
            echo "✅ Certificate for $domain is valid"
            return 0
        else
            echo "⚠️  Certificate for $domain has issues. Recreating..."
            # Delete old certificate
            certbot delete --cert-name "$domain" --non-interactive 2>/dev/null || {
                rm -rf "/etc/letsencrypt/live/$domain" 2>/dev/null || true
                rm -rf "/etc/letsencrypt/archive/$domain" 2>/dev/null || true
                rm -f "/etc/letsencrypt/renewal/${domain}.conf" 2>/dev/null || true
            }
        fi
    fi
    
    # Create new certificate
    if certbot --nginx -d "$domain" --non-interactive --agree-tos --email "$EMAIL" --redirect; then
        echo "✅ Certificate for $domain created successfully"
        return 0
    else
        echo "❌ Failed to get certificate for $domain"
        echo "   Check DNS and try again"
        return 1
    fi
}

# Get certificates for each domain
get_certificate "$WEB_DOMAIN"

echo ""
get_certificate "$CMS_DOMAIN"

echo ""
get_certificate "$API_DOMAIN"

# Setup auto-renewal
echo ""
echo "==> Setting up auto-renewal..."
systemctl enable certbot.timer
systemctl start certbot.timer

# Test renewal
certbot renew --dry-run

echo ""
echo "✅ SSL setup complete!"
echo ""
echo "🌐 Your sites are now available at:"
echo "   - https://$WEB_DOMAIN"
echo "   - https://$CMS_DOMAIN"
echo "   - https://$API_DOMAIN"
echo ""
echo "📝 Next steps:"
echo "   1. Update .env file with HTTPS URLs:"
echo "      FRONTEND_URL=https://$WEB_DOMAIN"
echo "      CMS_URL=https://$CMS_DOMAIN"
echo "      VITE_API_URL=https://$API_DOMAIN/api"
echo ""
echo "   2. Rebuild frontend containers:"
echo "      cd /home/goozi"
echo "      docker-compose build --no-cache web cms"
echo "      docker-compose up -d web cms"
echo ""
echo "   3. Update Google OAuth redirect URIs in Google Cloud Console"
echo ""
echo "📝 Certificates will auto-renew. Test renewal: certbot renew --dry-run"
echo ""
