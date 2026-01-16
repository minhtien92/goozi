# Hướng Dẫn Rebuild Docker Containers (Deprecated)

> ⚠️ **Deprecated**: Tài liệu này đã được thay thế. Vui lòng xem [REBUILD.md](REBUILD.md) để biết cách sử dụng script rebuild mới với interactive menu.

---

**Khuyến nghị:** Sử dụng `rebuild-dev.sh` hoặc `rebuild-prod.sh` với interactive menu để rebuild services.

Các script cũ đã được di chuyển vào `scripts/rebuild/` và không còn được khuyến nghị sử dụng.

## 🚀 Cách Sử Dụng

### Windows

#### Cách 1: Sử dụng script nhanh (Khuyến nghị)

```cmd
# Rebuild backend
rebuild-backend.bat

# Rebuild web
rebuild-web.bat

# Rebuild CMS
rebuild-cms.bat
```

#### Cách 2: Sử dụng script chính với tùy chọn

```cmd
# Rebuild backend (development mode - mặc định)
rebuild-docker.bat backend dev

# Rebuild web (development mode)
rebuild-docker.bat web dev

# Rebuild CMS (development mode)
rebuild-docker.bat cms dev

# Rebuild tất cả (development mode)
rebuild-docker.bat all dev

# Rebuild backend (production mode)
rebuild-docker.bat backend prod

# Rebuild tất cả (production mode)
rebuild-docker.bat all prod
```

### Linux/Mac

#### Cách 1: Sử dụng script nhanh (Khuyến nghị)

```bash
# Cấp quyền thực thi (chỉ cần chạy 1 lần)
chmod +x rebuild-*.sh

# Rebuild backend
./rebuild-backend.sh

# Rebuild web
./rebuild-web.sh

# Rebuild CMS
./rebuild-cms.sh
```

#### Cách 2: Sử dụng script chính với tùy chọn

```bash
# Cấp quyền thực thi (chỉ cần chạy 1 lần)
chmod +x rebuild-docker.sh

# Rebuild backend (development mode - mặc định)
./rebuild-docker.sh backend dev

# Rebuild web (development mode)
./rebuild-docker.sh web dev

# Rebuild CMS (development mode)
./rebuild-docker.sh cms dev

# Rebuild tất cả (development mode)
./rebuild-docker.sh all dev

# Rebuild backend (production mode)
./rebuild-docker.sh backend prod

# Rebuild tất cả (production mode)
./rebuild-docker.sh all prod
```

## 📝 Tham Số

### Service (Tham số 1)
- `backend` - Chỉ rebuild backend API
- `web` - Chỉ rebuild frontend web
- `cms` - Chỉ rebuild CMS admin
- `all` - Rebuild tất cả services (mặc định)

### Mode (Tham số 2)
- `dev` - Development mode (sử dụng `docker-compose.dev.yml`) - **Mặc định**
- `prod` - Production mode (sử dụng `docker-compose.yml`)

## 💡 Ví Dụ Sử Dụng

### Khi cập nhật Backend code

```bash
# Windows
rebuild-backend.bat

# Linux/Mac
./rebuild-backend.sh
```

### Khi cập nhật Frontend Web

```bash
# Windows
rebuild-web.bat

# Linux/Mac
./rebuild-web.sh
```

### Khi cập nhật CMS

```bash
# Windows
rebuild-cms.bat

# Linux/Mac
./rebuild-cms.sh
```

### Khi cập nhật nhiều services

```bash
# Windows
rebuild-docker.bat all dev

# Linux/Mac
./rebuild-docker.sh all dev
```

## 🔍 Xem Logs Sau Khi Rebuild

Sau khi rebuild, bạn có thể xem logs:

```bash
# Development mode
docker-compose -f docker-compose.dev.yml logs -f [service]

# Production mode
docker-compose -f docker-compose.yml logs -f [service]

# Ví dụ: Xem logs backend
docker-compose -f docker-compose.dev.yml logs -f backend
```

## ⚠️ Lưu Ý

1. **Development Mode**: 
   - Sử dụng `docker-compose.dev.yml`
   - Có hot reload, không cần rebuild thường xuyên
   - Chỉ rebuild khi thay đổi dependencies (package.json)

2. **Production Mode**:
   - Sử dụng `docker-compose.yml`
   - Cần rebuild mỗi khi có thay đổi code
   - Build tối ưu cho production

3. **Rebuild với `--no-cache`**:
   - Script tự động sử dụng `--no-cache` để đảm bảo build mới hoàn toàn
   - Build sẽ lâu hơn nhưng đảm bảo không có cache cũ

4. **Database không bị ảnh hưởng**:
   - Rebuild containers không ảnh hưởng đến database
   - Data được lưu trong volumes, không bị mất

## 🐛 Troubleshooting

### Lỗi "Permission denied" (Linux/Mac)

```bash
chmod +x rebuild-*.sh
```

### Lỗi "Container already exists"

Script tự động restart container, không cần xóa thủ công.

### Build bị lỗi

Kiểm tra:
1. Docker đang chạy
2. Port không bị conflict
3. Xem logs chi tiết: `docker-compose -f docker-compose.dev.yml logs [service]`

## 📚 Xem Thêm

- `README.md` - Hướng dẫn tổng quan
- `TROUBLESHOOTING.md` - Khắc phục sự cố

