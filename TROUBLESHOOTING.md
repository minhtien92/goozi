# Troubleshooting Guide

## Không truy cập được vào web

### 1. Kiểm tra containers đang chạy

```bash
docker-compose ps
```

Tất cả containers phải có status `Up`. Nếu có container bị lỗi, xem logs:

```bash
docker-compose logs [service_name]
```

### 2. Kiểm tra logs

**Backend:**
```bash
docker-compose logs backend
```

**Frontend Web:**
```bash
docker-compose logs web
```

**CMS:**
```bash
docker-compose logs cms
```

### 3. Kiểm tra ports

Đảm bảo các ports không bị conflict:
- 3000: Frontend Web
- 3001: Backend API
- 3002: CMS Admin
- 5432: PostgreSQL

### 4. Rebuild containers

Nếu có thay đổi code hoặc config:

```bash
# Production
docker-compose down
docker-compose up -d --build

# Development
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up -d --build
```

### 5. Kiểm tra database connection

```bash
# Test database connection
docker-compose exec backend npm run migrate

# Truy cập database
docker-compose exec postgres psql -U postgres -d goozi_db
```

### 6. Kiểm tra CORS và API URL

**Vấn đề:** Frontend không thể gọi API

**Giải pháp:**
1. Kiểm tra `VITE_API_URL` trong `.env` hoặc docker-compose
2. Kiểm tra CORS config trong backend
3. Xem browser console để xem lỗi cụ thể

### 7. Clear và rebuild

```bash
# Xóa tất cả containers, volumes, và images
docker-compose down -v
docker system prune -a

# Rebuild từ đầu
docker-compose up -d --build
```

### 8. Kiểm tra network

```bash
# Xem network
docker network ls

# Inspect network
docker network inspect goozi_goozi-network
```

### 9. Common Issues

#### Issue: "Cannot GET /"
**Giải pháp:** Frontend chưa được build hoặc Nginx chưa được cấu hình đúng

#### Issue: "Network Error" hoặc "CORS Error"
**Giải pháp:** 
- Kiểm tra backend đang chạy: `curl http://localhost:3001/health`
- Kiểm tra CORS config trong backend
- Đảm bảo API URL đúng trong frontend

#### Issue: "Database connection failed"
**Giải pháp:**
- Đợi database khởi động hoàn toàn (healthcheck)
- Kiểm tra DB credentials trong `.env`
- Xem logs: `docker-compose logs postgres`

#### Issue: "Port already in use"
**Giải pháp:**
- Tìm process đang dùng port: `lsof -i :3000` (Mac/Linux) hoặc `netstat -ano | findstr :3000` (Windows)
- Dừng process hoặc đổi port trong docker-compose.yml

### 10. Development Mode

Nếu dùng development mode và code không update:

```bash
# Restart service
docker-compose -f docker-compose.dev.yml restart [service_name]

# Rebuild và restart
docker-compose -f docker-compose.dev.yml up -d --build [service_name]
```

### 11. Production Mode

Nếu frontend không load sau khi build:

1. Kiểm tra build output:
```bash
docker-compose exec web ls -la /usr/share/nginx/html
```

2. Kiểm tra Nginx config:
```bash
docker-compose exec web cat /etc/nginx/conf.d/default.conf
```

3. Restart Nginx:
```bash
docker-compose exec web nginx -s reload
```

## Liên hệ

Nếu vẫn gặp vấn đề, vui lòng:
1. Xem logs đầy đủ: `docker-compose logs`
2. Kiểm tra browser console
3. Kiểm tra network tab trong DevTools

