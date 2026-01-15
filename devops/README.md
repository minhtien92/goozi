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
