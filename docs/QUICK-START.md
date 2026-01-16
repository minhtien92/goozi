# 🚀 Quick Start Guide

Hướng dẫn nhanh để chạy Goozi trong Production hoặc Development.

## 🏭 Production

```bash
# 1. Build và deploy
chmod +x build-prod.sh
./build-prod.sh

# 2. Xem logs
docker-compose logs -f

# 3. Stop
docker-compose down
```

**URLs:** Cấu hình trong `.env` (ví dụ: `https://web.goozi.org`, `https://cms.goozi.org`, `https://api.goozi.org`)

## 🧪 Development/Test

```bash
# 1. Build và deploy
chmod +x build-dev.sh
./build-dev.sh

# 2. Xem logs
docker-compose -f docker-compose.dev.yml logs -f

# 3. Stop
docker-compose -f docker-compose.dev.yml down
```

**URLs:** 
- Frontend: `http://localhost:3000`
- CMS: `http://localhost:3002`
- API: `http://localhost:3001/api`

## 📝 File .env

**Production template:**
```env
DB_HOST=postgres
DB_PORT=5432
DB_NAME=goozi_db
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=<generate-with-openssl-rand-hex-32>
JWT_EXPIRES_IN=7d
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://web.goozi.org
CMS_URL=https://cms.goozi.org
GOOGLE_CLIENT_ID=your-client-id
VITE_API_URL=https://api.goozi.org/api
VITE_GOOGLE_CLIENT_ID=your-client-id
```

**Development template:**
```env
DB_HOST=postgres
DB_PORT=5432
DB_NAME=goozi_db
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=dev-secret
JWT_EXPIRES_IN=7d
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
CMS_URL=http://localhost:3002
GOOGLE_CLIENT_ID=your-client-id
VITE_API_URL=http://localhost:3001/api
VITE_GOOGLE_CLIENT_ID=your-client-id
```

## 🔄 Chuyển đổi môi trường

**Production → Development:**
```bash
docker-compose down
# Sửa .env (hoặc tạo mới)
./build-dev.sh
```

**Development → Production:**
```bash
docker-compose -f docker-compose.dev.yml down
# Sửa .env (hoặc tạo mới)
./build-prod.sh
```

## 🔧 Rebuild Services

Sau khi thay đổi code, rebuild services:

```bash
# Development
./rebuild-dev.sh

# Production
./rebuild-prod.sh
```

Script sẽ hỏi bạn chọn services cần rebuild (có thể chọn nhiều).

Xem chi tiết: [REBUILD.md](REBUILD.md)

## ⚠️ Lưu ý

- File `.env` không được commit vào git
- Production và Development dùng database riêng biệt
- Sau khi thay đổi `.env`, cần rebuild containers:
  - Production: `./rebuild-prod.sh` (chọn web, cms, backend)
  - Development: `./rebuild-dev.sh` (chọn backend) hoặc restart (frontend tự reload)

Xem chi tiết: [ENVIRONMENTS.md](ENVIRONMENTS.md)
