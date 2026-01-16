# 📁 Mounts Management

Quản lý bind mounts và volumes cho uploads trong Goozi.

## 📋 Tổng quan

- **Production**: Sử dụng bind mount tại `/home/goozi_upload`
- **Development**: Sử dụng Docker volume `backend_uploads`

## 🚀 Scripts

### migrate.sh

Migrate từ Docker volume sang bind mount (chỉ Production).

**Usage:**
```bash
chmod +x scripts/mounts/migrate.sh
./scripts/mounts/migrate.sh prod
```

**Chức năng:**
1. Tạo directory `/home/goozi_upload/` trên host
2. Copy dữ liệu từ volume sang bind mount
3. Set permissions đúng (user 1000:1000)
4. Hướng dẫn next steps

**Lưu ý:**
- Chỉ dùng cho Production
- Development không cần migrate (vẫn dùng volumes)
- Script sẽ tự động stop container trước khi migrate

## 📖 Hướng dẫn chi tiết

### Setup Production với Bind Mount

1. **Tạo directory và set permissions:**
   ```bash
   sudo mkdir -p /home/goozi_upload/images
   sudo mkdir -p /home/goozi_upload/audio
   sudo chown -R 1000:1000 /home/goozi_upload
   sudo chmod -R 755 /home/goozi_upload
   ```

2. **Migrate từ volume (nếu có):**
   ```bash
   ./scripts/mounts/migrate.sh prod
   ```

3. **Update docker-compose.yml:**
   ```yaml
   volumes:
     - /home/goozi_upload:/app/uploads
   ```

4. **Start containers:**
   ```bash
   docker-compose up -d
   ```

### Verify

```bash
# Kiểm tra directory
ls -la /home/goozi_upload/

# Kiểm tra files
ls -la /home/goozi_upload/images/
ls -la /home/goozi_upload/audio/

# Test upload một file mới qua CMS
# Sau đó kiểm tra file có trong /home/goozi_upload/ không
```

## ⚠️ Lưu ý

1. **Permissions:**
   - Container chạy với user ID 1000
   - Directory phải có quyền 755 và owner 1000:1000
   - Nếu có lỗi permission:
     ```bash
     sudo chown -R 1000:1000 /home/goozi_upload
     sudo chmod -R 755 /home/goozi_upload
     ```

2. **Backup:**
   - Với bind mount, backup đơn giản hơn:
     ```bash
     tar -czf backups/uploads.tar.gz /home/goozi_upload
     ```
   - Hoặc dùng script: `./scripts/backup/backup-uploads.sh prod`

3. **Development:**
   - Development vẫn dùng Docker volumes
   - Không cần migrate
   - Volume: `backend_uploads`

## 🔄 Migration từ Volume

Nếu đang dùng volumes và muốn chuyển sang bind mount:

1. **Backup trước:**
   ```bash
   ./scripts/backup/backup-uploads.sh prod
   ```

2. **Migrate:**
   ```bash
   ./scripts/mounts/migrate.sh prod
   ```

3. **Verify và xóa volume cũ:**
   ```bash
   # Sau khi verify mọi thứ hoạt động đúng
   docker volume rm goozi_backend_uploads
   ```

## 🐛 Troubleshooting

### Lỗi: Permission denied

```bash
sudo chown -R 1000:1000 /home/goozi_upload
sudo chmod -R 755 /home/goozi_upload
```

### Lỗi: Directory not found

```bash
sudo mkdir -p /home/goozi_upload/images
sudo mkdir -p /home/goozi_upload/audio
```

### Lỗi: Files not copied

```bash
# Copy manually từ container
docker cp goozi-backend:/app/uploads /home/goozi_upload
```

## 📚 Xem thêm

- [BACKUP.md](../../BACKUP.md) - Hướng dẫn backup/restore
- [ENVIRONMENTS.md](../../ENVIRONMENTS.md) - Quản lý môi trường
