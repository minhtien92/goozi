# DevOps (Ubuntu bootstrap)

Thư mục này chứa script cài đặt các service/phần mềm cần thiết để chạy project trên **Ubuntu mới tinh** (chưa cài gì).

## 1) Cài dependencies trên Ubuntu

Chạy script (khuyến nghị Ubuntu 20.04/22.04/24.04):

```bash
sudo bash devops/setup-ubuntu.sh
```

Script sẽ cài:
- Docker Engine
- Docker Compose plugin (`docker compose`)
- Tạo wrapper `docker-compose` (để tương thích với repo đang dùng `docker-compose`)
- Các tool cơ bản: `git`, `curl`, `jq`, `htop`, `ca-certificates`

Sau khi chạy xong, **đăng xuất/đăng nhập lại** (hoặc `newgrp docker`) để user hiện tại dùng Docker không cần `sudo`.

## 2) Chạy project bằng Docker Compose

### Production

```bash
docker-compose up -d --build
```

### Development (hot reload)

```bash
docker-compose -f docker-compose.dev.yml up -d --build
```

## 3) Kiểm tra nhanh services

```bash
chmod +x check-services.sh
./check-services.sh
```

## 4) Mở port firewall (nếu truy cập trực tiếp 3000/3001/3002)

```bash
sudo bash devops/open-ports.sh
```

## 5) Cài Nginx reverse proxy (dùng domain, port 80)

```bash
sudo bash devops/setup-nginx.sh
```

Script sẽ:
- Cài `nginx`
- Hỏi domain cho Web, CMS, API (ví dụ: `example.com`, `cms.example.com`, `api.example.com`)
- Tạo file cấu hình `/etc/nginx/sites-available/goozi` reverse proxy:
  - Web → `http://127.0.0.1:3000`
  - CMS → `http://127.0.0.1:3002`
  - API → `http://127.0.0.1:3001`
- Kích hoạt site, reload Nginx, mở port 80 qua `ufw` (nếu có)

Bạn chỉ cần trỏ DNS (record A/AAAA) của các domain về IP server là truy cập được.

## 6) Setup SSL/HTTPS với Let's Encrypt

Sau khi đã setup Nginx và DNS đã trỏ đúng, setup SSL:

```bash
sudo bash devops/setup-ssl.sh
```

Script sẽ:
- Cài đặt Certbot
- Lấy SSL certificates từ Let's Encrypt cho cả 3 domains
- Cấu hình Nginx tự động cho HTTPS
- Setup auto-renewal

**Lưu ý:**
- DNS phải đã trỏ đúng về server IP
- Port 80 và 443 phải mở
- Sau khi có HTTPS, cần rebuild frontend containers với URLs mới

**Fix lỗi renewal:**
```bash
# Chạy lại setup-ssl.sh - script sẽ tự động detect và fix certificates có vấn đề
sudo bash devops/setup-ssl.sh
```

Xem chi tiết: [devops/SSL.md](devops/SSL.md)

## 7) Fix Google OAuth Issues

Nếu gặp lỗi Google OAuth (401, COOP policy, etc.):

```bash
# Check và fix configuration
bash scripts/fix_db/fix-google-oauth.sh
```

Script sẽ hướng dẫn bạn:
- Kiểm tra GOOGLE_CLIENT_ID trong .env
- Cập nhật Google Cloud Console với đúng origins
- Troubleshooting các lỗi thường gặp

Xem chi tiết: [docs/GOOGLE_OAUTH_SETUP.md](docs/GOOGLE_OAUTH_SETUP.md)

## 8) Triển khai production với domain `*.goozi.org`

Với các domain:
- Web: `web.goozi.org`
- CMS: `cms.goozi.org`
- API: `api.goozi.org`

Bạn có thể dùng script sau để build & chạy Docker production + tạo file `.env` đúng URL:

```bash
sudo bash devops/setup-prod.sh
```

Script sẽ:
- Hỏi lại 3 URL (mặc định lần lượt là `https://web.goozi.org`, `https://cms.goozi.org`, `https://api.goozi.org`)
- Tạo/ghi file `.env` với:
  - `FRONTEND_URL`, `CMS_URL`
  - `VITE_API_URL=https://api.goozi.org/api` (hoặc theo URL bạn nhập)
  - `JWT_SECRET` ngẫu nhiên, các biến DB mặc định
- Chạy:
  - `docker-compose build`
  - `docker-compose up -d`
  - `docker-compose exec backend npm run migrate`
  - `docker-compose exec backend npm run create-admin`

Kết hợp với `devops/setup-nginx.sh` và `devops/setup-ssl.sh`, bạn sẽ có:
- Người dùng truy cập qua domain: `web.goozi.org`, `cms.goozi.org`, `api.goozi.org`
- HTTPS/SSL tự động với Let's Encrypt
- Docker chỉ mở port nội bộ: 3000/3001/3002, Nginx public port 80/443

## 8) Cài Node.js + sequelize-cli (chạy backend ngoài Docker)

Nếu bạn muốn chạy backend trực tiếp trên host (không dùng Docker), có thể cài Node.js 18.x và `sequelize-cli` global:

```bash
sudo bash devops/setup-node.sh
```

Script sẽ:
- Cài Node.js 18.x (qua NodeSource)
- Cài global:
  - `npm` (cập nhật)
  - `sequelize-cli`

Sau đó bạn có thể:

```bash
cd backend
npm install
npm run migrate
npm run dev
```
