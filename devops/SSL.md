# 🔒 SSL/HTTPS Setup Guide

Hướng dẫn setup SSL/HTTPS với Let's Encrypt cho Goozi.

## 🚀 Quick Setup

```bash
# Chạy script tự động
sudo bash devops/setup-ssl.sh
```

Script sẽ:
1. Cài đặt Certbot
2. Lấy SSL certificates từ Let's Encrypt
3. Cấu hình Nginx cho HTTPS
4. Setup auto-renewal

## 📋 Yêu cầu

1. **DNS đã được cấu hình:**
   - `web.goozi.org` → Server IP
   - `cms.goozi.org` → Server IP
   - `api.goozi.org` → Server IP

2. **Nginx đã được cài đặt:**
   ```bash
   sudo bash devops/setup-nginx.sh
   ```

3. **Port 80 và 443 mở:**
   ```bash
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   ```

## 🔧 Manual Setup

### 1. Install Certbot

```bash
sudo apt-get update
sudo apt-get install -y certbot python3-certbot-nginx
```

### 2. Obtain Certificates

```bash
# Web domain
sudo certbot --nginx -d web.goozi.org --non-interactive --agree-tos --email your-email@example.com --redirect

# CMS domain
sudo certbot --nginx -d cms.goozi.org --non-interactive --agree-tos --email your-email@example.com --redirect

# API domain
sudo certbot --nginx -d api.goozi.org --non-interactive --agree-tos --email your-email@example.com --redirect
```

### 3. Setup Auto-Renewal

```bash
# Enable and start certbot timer
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Test renewal
sudo certbot renew --dry-run
```

## 📝 Nginx Config After SSL

Sau khi chạy Certbot, Nginx config sẽ được tự động cập nhật với:

```nginx
server {
    listen 80;
    server_name api.goozi.org;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.goozi.org;

    ssl_certificate /etc/letsencrypt/live/api.goozi.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.goozi.org/privkey.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    location / {
        proxy_pass http://127.0.0.1:3001;
        # ... proxy headers
    }
}
```

## ⚠️ Important Notes

1. **Update .env files:**
   Sau khi có HTTPS, cập nhật `.env`:
   ```env
   FRONTEND_URL=https://web.goozi.org
   CMS_URL=https://cms.goozi.org
   VITE_API_URL=https://api.goozi.org/api
   ```

2. **Rebuild frontend containers:**
   ```bash
   docker-compose build --no-cache web cms
   docker-compose up -d web cms
   ```

3. **Update CORS in backend:**
   Backend đã có `https://web.goozi.org` và `https://cms.goozi.org` trong CORS config.

4. **Update Google OAuth:**
   - Vào Google Cloud Console
   - Update Authorized JavaScript origins: `https://web.goozi.org`
   - Update Authorized redirect URIs nếu cần

## 🔄 Renewal

Certificates tự động renew mỗi 90 ngày. Kiểm tra:

```bash
# Check renewal status
sudo systemctl status certbot.timer

# Manual renewal test
sudo certbot renew --dry-run

# Manual renewal (if needed)
sudo certbot renew
```

## 🐛 Troubleshooting

### Lỗi: Domain not pointing to server

```bash
# Kiểm tra DNS
nslookup web.goozi.org
dig web.goozi.org

# Phải trả về IP của server
```

### Lỗi: Port 80/443 not accessible

```bash
# Check firewall
sudo ufw status
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Check if ports are listening
sudo ss -lntp | grep -E ':80|:443'
```

### Lỗi: Too many certificates

Let's Encrypt có giới hạn 5 certificates/domain/week. Nếu vượt quá, đợi 1 tuần hoặc dùng staging:

```bash
certbot --nginx --staging -d your-domain.com
```

### Lỗi: Certificate expired

```bash
# Renew manually
sudo certbot renew

# Check expiration
sudo certbot certificates
```

### Lỗi: Renewal failed - "No such authorization"

Lỗi này thường xảy ra khi certificate đã bị xóa hoặc không hợp lệ:

```bash
# Chạy lại setup-ssl.sh - script sẽ tự động detect và fix
sudo bash devops/setup-ssl.sh

# Hoặc thủ công:
# 1. Xóa certificate cũ
sudo certbot delete --cert-name api.goozi.org

# 2. Tạo lại
sudo certbot --nginx -d api.goozi.org --non-interactive --agree-tos --email your-email@example.com --redirect
```

## 📚 Xem thêm

- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Certbot Documentation](https://eff-certbot.readthedocs.io/)
