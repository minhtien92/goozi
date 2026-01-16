# 💾 Backup & Restore Guide

Hướng dẫn backup và restore database và uploads để tránh mất dữ liệu khi Docker container bị xóa.

## 🎯 Vấn đề

Khi sử dụng Docker, nếu container bị xóa mà không có backup, bạn sẽ mất:
- ✅ **Database**: Đã được bảo vệ bằng Docker volumes (an toàn)
- ⚠️ **Uploads (images, audio)**: Cần backup thủ công hoặc tự động

## 📦 Giải pháp hiện tại

**Production:** Sử dụng **Bind Mounts** cho uploads:
- Directory: `/home/goozi_upload/`
- Dữ liệu được lưu trực tiếp trên host filesystem
- **Ưu điểm**:
  - ✅ Dễ truy cập và quản lý
  - ✅ Backup đơn giản (chỉ cần copy folder)
  - ✅ Không cần Docker volume management

**Development:** Sử dụng **Docker Volumes**:
- Volume: `backend_uploads`
- Dữ liệu được lưu trong Docker volume

**Cần backup để tránh mất khi**:
- Server bị lỗi/crash
- Xóa nhầm folder/volume
- Reinstall system

## 🚀 Quick Start

### Backup Uploads

```bash
# Development
chmod +x scripts/backup/backup-uploads.sh
./scripts/backup/backup-uploads.sh dev

# Production
./scripts/backup/backup-uploads.sh prod
```

### Backup Tất cả (Database + Uploads)

```bash
# Development
chmod +x scripts/backup/backup-all.sh
./scripts/backup/backup-all.sh dev

# Production
./scripts/backup/backup-all.sh prod
```

### Restore Uploads

```bash
# Development
./scripts/backup/restore-uploads.sh backups/uploads/uploads_20240115_120000.tar.gz dev

# Production
./scripts/backup/restore-uploads.sh backups/uploads/uploads_20240115_120000.tar.gz prod
```

## 📋 Chi tiết

### 1. Backup Uploads

**Script:** `scripts/backup/backup-uploads.sh`

```bash
# Development
./scripts/backup/backup-uploads.sh dev

# Production
./scripts/backup/backup-uploads.sh prod
```

**Output:**
- `./backups/uploads/uploads_YYYYMMDD_HHMMSS.tar.gz`

**Cách hoạt động:**
1. Tạo temporary container để truy cập volume
2. Nén toàn bộ uploads thành tar.gz
3. Lưu vào `./backups/uploads/`

### 2. Backup Database

**Manual:**
```bash
# Development
docker exec goozi-postgres-dev pg_dump -U postgres goozi_db > backup.sql
gzip backup.sql

# Production
docker exec goozi-postgres pg_dump -U postgres goozi_db > backup.sql
gzip backup.sql
```

**Output:**
- `backup.sql.gz`

### 3. Backup Tất cả

**Script:** `scripts/backup/backup-all.sh`

```bash
./scripts/backup/backup-all.sh prod
```

**Output:**
- `./backups/database/db_YYYYMMDD_HHMMSS.sql.gz`
- `./backups/uploads/uploads_YYYYMMDD_HHMMSS.tar.gz`

### 4. Restore Uploads

**Script:** `scripts/backup/restore-uploads.sh`

```bash
./scripts/backup/restore-uploads.sh backups/uploads/uploads_20240115_120000.tar.gz prod
```

**Lưu ý:**
- Script sẽ dừng container backend trước khi restore
- Tất cả uploads hiện tại sẽ bị thay thế
- Container sẽ được restart sau khi restore xong

### 5. Restore Database

```bash
# Development
gunzip -c backups/database/db_20240115_120000.sql.gz | \
  docker exec -i goozi-postgres-dev psql -U postgres goozi_db

# Production
gunzip -c backups/database/db_20240115_120000.sql.gz | \
  docker exec -i goozi-postgres psql -U postgres goozi_db
```

## 🔄 Automated Backup (Cron Job)

### Setup Tự động (Khuyến nghị)

**Cách dễ nhất - dùng script setup:**

```bash
# Development - backup hàng ngày, giữ 7 ngày
chmod +x scripts/backup/setup-auto-backup.sh
./scripts/backup/setup-auto-backup.sh dev daily 7

# Production - backup hàng ngày, giữ 30 ngày
./scripts/backup/setup-auto-backup.sh prod daily 30

# Production - backup hàng tuần
./scripts/backup/setup-auto-backup.sh prod weekly 30
```

**Các tùy chọn schedule:**
- `daily` - Mỗi ngày lúc 2:00 AM (mặc định)
- `weekly` - Mỗi Chủ nhật lúc 2:00 AM
- `hourly` - Mỗi giờ
- Custom cron expression - Ví dụ: `0 3 * * 1` (mỗi thứ 2 lúc 3:00 AM)

### Kiểm tra trạng thái

```bash
./scripts/backup/check-backup-status.sh
```

Script sẽ hiển thị:
- ✅ Automated backup đã được setup chưa
- 📊 Số lượng backups hiện có
- 📝 Logs gần đây

### Xóa automated backup

```bash
./scripts/backup/remove-auto-backup.sh
```

### Setup thủ công (nếu cần)

Nếu muốn setup thủ công:

```bash
# 1. Tạo script backup
chmod +x scripts/backup/backup-with-retention.sh

# 2. Edit crontab
crontab -e

# 3. Thêm dòng này (chạy mỗi ngày lúc 2 giờ sáng)
0 2 * * * cd /path/to/goozi && ./scripts/backup/backup-with-retention.sh prod 7 >> logs/backup.log 2>&1
```

### Setup với Retention

Script `backup-with-retention.sh` tự động xóa backups cũ:

```bash
# Giữ lại 7 ngày
./scripts/backup/backup-with-retention.sh prod 7

# Giữ lại 30 ngày
./scripts/backup/backup-with-retention.sh prod 30
```

## 📁 Cấu trúc Backup

```
goozi/
├── backups/
│   ├── database/
│   │   ├── db_20240115_120000.sql.gz
│   │   ├── db_20240116_120000.sql.gz
│   │   └── ...
│   └── uploads/
│       ├── uploads_20240115_120000.tar.gz
│       ├── uploads_20240116_120000.tar.gz
│       └── ...
└── scripts/
    └── backup/
        ├── backup-uploads.sh
        ├── backup-all.sh
        ├── restore-uploads.sh
        └── backup-with-retention.sh
```


## ⚠️ Best Practices

1. **Backup thường xuyên:**
   - Production: Daily backup
   - Development: Weekly backup (hoặc trước khi thay đổi lớn)

2. **Lưu trữ off-server:**
   - Upload backups lên S3, Google Drive, hoặc server khác
   - Không chỉ dựa vào local backups

3. **Test restore:**
   - Định kỳ test restore process
   - Đảm bảo backups có thể restore được

4. **Giữ nhiều versions:**
   - Giữ ít nhất 7-30 ngày backups
   - Có weekly/monthly backups cho long-term

5. **Monitor backup size:**
   - Uploads có thể rất lớn (GBs)
   - Compress và cleanup định kỳ

## 🐛 Troubleshooting

### Lỗi: Volume not found

```bash
# Kiểm tra volumes
docker volume ls | grep goozi

# Nếu không có, tạo mới
docker volume create goozi_backend_uploads
```

### Lỗi: Permission denied

```bash
# Cấp quyền cho scripts
chmod +x scripts/backup/*.sh
```

### Lỗi: Container not running

```bash
# Start containers trước khi backup
docker-compose up -d
```

## 📚 Xem thêm

- [scripts/backup/README.md](scripts/backup/README.md) - Chi tiết về các scripts
- [ENVIRONMENTS.md](ENVIRONMENTS.md) - Quản lý môi trường
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Khắc phục sự cố
