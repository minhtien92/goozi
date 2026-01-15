# Environment Management Guide

Hướng dẫn quản lý môi trường Production và Development/Test cho Goozi.

## 📁 Cấu trúc File

```
goozi/
├── docker-compose.yml          # Production Docker Compose
├── docker-compose.dev.yml      # Development Docker Compose
├── .env                        # Environment variables (không commit)
├── .env.production.example     # Template cho Production
├── .env.development.example    # Template cho Development
├── build-prod.sh              # Script build/deploy Production
└── build-dev.sh               # Script build/deploy Development
```

## 🏭 Production Environment

### Setup Production

1. **Copy template và cấu hình:**
   ```bash
   cp .env.production.example .env
   nano .env  # Sửa các giá trị production
   ```

2. **Build và deploy:**
   ```bash
   chmod +x build-prod.sh
   ./build-prod.sh
   ```

3. **Hoặc build thủ công:**
   ```bash
   docker-compose build --no-cache
   docker-compose up -d
   docker-compose exec backend npm run migrate
   docker-compose exec backend npm run create-admin
   ```

### Production URLs

Cập nhật trong `.env`:
- `FRONTEND_URL=https://web.goozi.org`
- `CMS_URL=https://cms.goozi.org`
- `VITE_API_URL=https://api.goozi.org/api`

### Production Commands

```bash
# Xem logs
docker-compose logs -f

# Restart service
docker-compose restart [service]

# Rebuild một service
docker-compose build --no-cache [service]
docker-compose up -d [service]

# Stop tất cả
docker-compose down

# Xem status
docker-compose ps
```

## 🧪 Development/Test Environment

### Setup Development

1. **Copy template và cấu hình:**
   ```bash
   cp .env.development.example .env
   nano .env  # Sửa nếu cần
   ```

2. **Build và deploy:**
   ```bash
   chmod +x build-dev.sh
   ./build-dev.sh
   ```

3. **Hoặc build thủ công:**
   ```bash
   docker-compose -f docker-compose.dev.yml build --no-cache
   docker-compose -f docker-compose.dev.yml up -d
   docker-compose -f docker-compose.dev.yml exec backend npm run migrate
   docker-compose -f docker-compose.dev.yml exec backend npm run create-admin
   ```

### Development URLs

Mặc định (localhost):
- Frontend Web: `http://localhost:3000`
- CMS Admin: `http://localhost:3002`
- Backend API: `http://localhost:3001/api`

### Development Features

- ✅ Hot reload cho frontend (React)
- ✅ Hot reload cho backend (nodemon)
- ✅ Volume mounts để code changes tự động sync
- ✅ Development Dockerfiles với dev dependencies

### Development Commands

```bash
# Xem logs
docker-compose -f docker-compose.dev.yml logs -f

# Restart service
docker-compose -f docker-compose.dev.yml restart [service]

# Rebuild một service
docker-compose -f docker-compose.dev.yml build --no-cache [service]
docker-compose -f docker-compose.dev.yml up -d [service]

# Stop tất cả
docker-compose -f docker-compose.dev.yml down

# Xem status
docker-compose -f docker-compose.dev.yml ps
```

## 🔄 Chuyển đổi giữa Production và Development

### Từ Production sang Development

```bash
# 1. Stop production
docker-compose down

# 2. Backup .env nếu cần
cp .env .env.production.backup

# 3. Tạo .env cho development
cp .env.development.example .env

# 4. Start development
./build-dev.sh
```

### Từ Development sang Production

```bash
# 1. Stop development
docker-compose -f docker-compose.dev.yml down

# 2. Backup .env nếu cần
cp .env .env.development.backup

# 3. Tạo .env cho production
cp .env.production.example .env
nano .env  # Cập nhật production URLs

# 4. Start production
./build-prod.sh
```

## ⚠️ Lưu ý quan trọng

1. **File `.env` không được commit:**
   - Luôn có trong `.gitignore`
   - Chỉ commit `.env.*.example` files

2. **Database riêng biệt:**
   - Production và Development dùng volumes khác nhau
   - Production: `postgres_data`
   - Development: `postgres_data_dev`

3. **Container names khác nhau:**
   - Production: `goozi-postgres`, `goozi-backend`, `goozi-web`, `goozi-cms`
   - Development: `goozi-postgres-dev`, `goozi-backend-dev`, `goozi-web-dev`, `goozi-cms-dev`

4. **Network riêng biệt:**
   - Production: `goozi-network`
   - Development: `goozi-network-dev`

5. **Build arguments:**
   - Production: Build args từ `.env` được bake vào images
   - Development: Environment variables được inject runtime

## 🐛 Troubleshooting

### Lỗi: Port đã được sử dụng

Nếu port 3000, 3001, 3002 đã được sử dụng:

```bash
# Kiểm tra process đang dùng port
lsof -i :3000
lsof -i :3001
lsof -i :3002

# Hoặc dừng tất cả containers
docker-compose down
docker-compose -f docker-compose.dev.yml down
```

### Lỗi: Database connection failed

Kiểm tra:
1. Database container đang chạy: `docker-compose ps`
2. `.env` có đúng DB credentials
3. Đợi database ready (15-20 giây sau khi start)

### Lỗi: CORS policy

Đảm bảo `.env` có đúng:
- `FRONTEND_URL` và `CMS_URL` match với domain bạn đang dùng
- Backend đã được rebuild sau khi thay đổi `.env`

### Rebuild sau khi thay đổi .env

**Production:**
```bash
docker-compose build --no-cache web cms backend
docker-compose up -d
```

**Development:**
```bash
docker-compose -f docker-compose.dev.yml restart backend
# Frontend sẽ tự reload
```
