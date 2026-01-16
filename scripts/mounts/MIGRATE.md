# 🔄 Migrate to Bind Mounts (Production Only)

Hướng dẫn chuyển từ Docker volumes sang bind mounts cho uploads trong môi trường Production.

**Lưu ý:** Development vẫn sử dụng Docker volumes, chỉ Production dùng bind mounts.

## 🎯 Tại sao chuyển sang Bind Mounts?

**Ưu điểm:**
- ✅ Dễ truy cập files trực tiếp trên host
- ✅ Backup đơn giản (chỉ cần copy folder)
- ✅ Không cần quản lý Docker volumes
- ✅ Dễ debug và kiểm tra files

**Nhược điểm:**
- ⚠️ Files trên host filesystem (cần quản lý permissions)
- ⚠️ Ít portable hơn volumes (nhưng thực tế không ảnh hưởng nhiều)

## 🚀 Migration Steps

### 1. Backup dữ liệu hiện tại (nếu có)

```bash
# Backup từ volume trước khi migrate
./scripts/backup/backup-uploads.sh prod
```

### 2. Chạy migration script (chỉ Production)

```bash
# Production only
chmod +x scripts/mounts/migrate.sh
./scripts/mounts/migrate.sh prod
```

**Lưu ý:** Development không cần migrate, vẫn dùng volumes.

Script sẽ:
1. Tạo directory `/home/goozi_upload/` trên host
2. Copy dữ liệu từ volume sang bind mount
3. Set permissions đúng
4. Hướng dẫn next steps

### 3. Restart containers (Production)

```bash
# Production only
docker-compose up -d
```

### 4. Verify

```bash
# Kiểm tra uploads directory
ls -la backend/uploads/

# Test upload một file mới
# Sau đó kiểm tra file có trong backend/uploads/ không
```

### 5. Xóa volume cũ (sau khi verify)

```bash
# Chỉ xóa sau khi đã verify mọi thứ hoạt động đúng
docker volume rm goozi_backend_uploads
```

## 📋 Thay đổi trong docker-compose.yml (Production)

**Production - Trước (Volume):**
```yaml
volumes:
  - backend_uploads:/app/uploads

volumes:
  backend_uploads:
```

**Production - Sau (Bind Mount):**
```yaml
volumes:
  - /home/goozi_upload:/app/uploads
```

**Development:** Vẫn dùng volumes (không thay đổi)

## 🔍 Verify Migration

1. **Check directory exists:**
   ```bash
   ls -la /home/goozi_upload/
   ```

2. **Check files copied:**
   ```bash
   ls -la /home/goozi_upload/images/
   ls -la /home/goozi_upload/audio/
   ```

3. **Test upload:**
   - Upload một file mới qua CMS
   - Kiểm tra file có trong `/home/goozi_upload/` không

4. **Check permissions:**
   ```bash
   # Files should be readable by container
   ls -la backend/uploads/
   ```

## ⚠️ Lưu ý

1. **Permissions:**
   - Container chạy với user ID 1000 (thường là user đầu tiên)
   - Nếu có lỗi permission, chạy:
     ```bash
     sudo mkdir -p /home/goozi_upload
     sudo chown -R 1000:1000 /home/goozi_upload
     sudo chmod -R 755 /home/goozi_upload
     ```

2. **Backup:**
   - Sau khi migrate, backup scripts sẽ tự động detect bind mount
   - Backup sẽ đơn giản hơn (copy trực tiếp từ folder)

3. **Git:**
   - Uploaded files được ignore trong `.gitignore`
   - Chỉ giữ directory structure (`.gitkeep` files)

## 🐛 Troubleshooting

### Lỗi: Permission denied

```bash
# Fix permissions
sudo chown -R 1000:1000 backend/uploads
# hoặc
sudo chmod -R 755 backend/uploads
```

### Lỗi: Directory not found

```bash
# Tạo directory manually
sudo mkdir -p /home/goozi_upload/images
sudo mkdir -p /home/goozi_upload/audio
sudo chown -R 1000:1000 /home/goozi_upload
```

### Lỗi: Files not copied

```bash
# Copy manually từ container
docker cp goozi-backend:/app/uploads /home/goozi_upload
```

## ✅ Sau khi migrate

- ✅ Uploads được lưu tại `/home/goozi_upload/`
- ✅ Backup đơn giản: `tar -czf backups/uploads.tar.gz /home/goozi_upload`
- ✅ Có thể truy cập files trực tiếp
- ✅ Không cần quản lý Docker volumes
