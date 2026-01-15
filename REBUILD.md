# 🔧 Rebuild Guide

Hướng dẫn rebuild các services trong Goozi.

## 🚀 Quick Start

### Development Environment

```bash
chmod +x rebuild-dev.sh
./rebuild-dev.sh
```

### Production Environment

```bash
chmod +x rebuild-prod.sh
./rebuild-prod.sh
```

## 📖 Cách sử dụng

### Interactive Menu

Khi chạy script, bạn sẽ thấy menu:

```
Available services to rebuild:

  1) Backend API (backend)
  2) Frontend Web (web)
  3) CMS Admin (cms)
  4) PostgreSQL Database (postgres)
  a) All services
  q) Quit
```

### Chọn services

Bạn có thể chọn services theo nhiều cách:

1. **Chọn một service:** Nhập số (ví dụ: `1`)
2. **Chọn nhiều services:** Nhập số cách nhau bởi dấu phẩy (ví dụ: `1,2,3`)
3. **Chọn tất cả:** Nhập `a`
4. **Hoàn tất:** Nhập `d` sau khi đã chọn xong
5. **Hủy:** Nhập `q`

### Ví dụ

```bash
# Chọn backend và web
Select service(s) to rebuild: 1,2
✓ Added: Backend API
✓ Added: Frontend Web
Select service(s) to rebuild: d

# Chọn tất cả
Select service(s) to rebuild: a
```

## 📁 Cấu trúc

```
goozi/
├── rebuild-dev.sh              # Script rebuild cho Development
├── rebuild-prod.sh              # Script rebuild cho Production
└── scripts/
    └── rebuild/
        ├── rebuild-service.sh   # Script nội bộ (không chạy trực tiếp)
        ├── rebuild-docker.sh    # Script cũ (deprecated)
        ├── rebuild-backend.sh   # Script cũ (deprecated)
        ├── rebuild-web.sh       # Script cũ (deprecated)
        ├── rebuild-cms.sh       # Script cũ (deprecated)
        └── rebuild-all.sh       # Script cũ (deprecated)
```

## ⚠️ Lưu ý

1. **Scripts cũ:** Các script trong `scripts/rebuild/` (trừ `rebuild-service.sh`) là deprecated. Vẫn có thể dùng nhưng khuyến nghị dùng `rebuild-dev.sh` hoặc `rebuild-prod.sh`.

2. **PostgreSQL:** Rebuild PostgreSQL sẽ xóa toàn bộ dữ liệu! Chỉ rebuild khi thực sự cần thiết.

3. **Build time:** Rebuild có thể mất vài phút, đặc biệt là frontend (web, cms) vì phải build lại toàn bộ.

4. **Hot reload (Development):** Trong development mode, sau khi rebuild, code changes sẽ tự động reload.

## 🔍 Troubleshooting

### Lỗi: Permission denied

```bash
chmod +x rebuild-dev.sh rebuild-prod.sh
```

### Lỗi: Service không rebuild được

1. Kiểm tra Docker đang chạy: `docker ps`
2. Kiểm tra container status: `docker-compose ps`
3. Xem logs: `docker-compose logs [service]`

### Rebuild thủ công

Nếu script không hoạt động, bạn có thể rebuild thủ công:

**Development:**
```bash
docker-compose -f docker-compose.dev.yml build --no-cache [service]
docker-compose -f docker-compose.dev.yml up -d [service]
```

**Production:**
```bash
docker-compose build --no-cache [service]
docker-compose up -d [service]
```

## 📝 Commands sau khi rebuild

```bash
# Xem logs
docker-compose logs -f [service]

# Kiểm tra status
docker-compose ps

# Restart service
docker-compose restart [service]
```
