# Backup & Restore Scripts

Scripts để backup và restore database và uploads cho Goozi.

## 🗄️ Cơ chế backup Database (khi DB có vấn đề vẫn có dữ liệu)

**Backup nhanh (chỉ DB):**
```bash
# Dev
./scripts/backup/backup-database.sh dev

# Prod
./scripts/backup/backup-database.sh prod
```
→ Tạo file: `backups/database/db_YYYYMMDD_HHMMSS.sql.gz`

**Backup đầy đủ (DB + uploads):**
```bash
./scripts/backup/backup-all.sh prod
```

**Restore khi DB lỗi:**
```bash
# Xem danh sách backup
ls -la backups/database/

# Restore (chọn file .sql.gz mới nhất hoặc thời điểm cần)
./scripts/backup/restore-database.sh backups/database/db_20240115_120000.sql.gz prod
```
→ Script sẽ **drop DB hiện tại**, tạo lại và restore từ file. Cần xác nhận trước khi chạy.

**Tự động backup định kỳ (khuyến nghị):**
```bash
chmod +x scripts/backup/setup-auto-backup.sh
./scripts/backup/setup-auto-backup.sh prod daily 30
```
→ Backup mỗi ngày 2h sáng, giữ 30 bản.

---

## 📦 Backup Scripts

### 1. Backup Uploads

```bash
# Development
./scripts/backup/backup-uploads.sh dev

# Production
./scripts/backup/backup-uploads.sh prod
```

**Output:** `./backups/uploads/uploads_YYYYMMDD_HHMMSS.tar.gz`

### 2. Backup Database (chỉ DB)

```bash
# Development
./scripts/backup/backup-database.sh dev

# Production
./scripts/backup/backup-database.sh prod
```
**Output:** `./backups/database/db_YYYYMMDD_HHMMSS.sql.gz`

### 3. Backup All (Database + Uploads)

```bash
# Development
./scripts/backup/backup-all.sh dev

# Production
./scripts/backup/backup-all.sh prod
```

## 📥 Restore Scripts

### 1. Restore Uploads

```bash
# Development
./scripts/backup/restore-uploads.sh backups/uploads/uploads_20240115_120000.tar.gz dev

# Production
./scripts/backup/restore-uploads.sh backups/uploads/uploads_20240115_120000.tar.gz prod
```

### 2. Restore Database

```bash
# Development (file .sql.gz bất kỳ trong backups/database/)
./scripts/backup/restore-database.sh backups/database/db_20240115_120000.sql.gz dev

# Production
./scripts/backup/restore-database.sh backups/database/db_20240115_120000.sql.gz prod
```
Script sẽ hỏi xác nhận, drop DB hiện tại, tạo lại và restore. Sau khi restore nên restart backend: `docker compose restart backend`.

**Cách thủ công (nếu cần):**
```bash
gunzip -c backups/database/db_20240115_120000.sql.gz | docker exec -i goozi-postgres psql -U postgres goozi_db
```

## 🔄 Automated Backup (Cron Job)

### Setup tự động (Khuyến nghị)

**Cách dễ nhất:**

```bash
# Production - backup hàng ngày, giữ 30 ngày
chmod +x scripts/backup/setup-auto-backup.sh
./scripts/backup/setup-auto-backup.sh prod daily 30
```

**Các tùy chọn:**
- `daily` - Mỗi ngày lúc 2:00 AM
- `weekly` - Mỗi Chủ nhật lúc 2:00 AM  
- `hourly` - Mỗi giờ
- Custom cron expression

**Kiểm tra trạng thái:**
```bash
./scripts/backup/check-backup-status.sh
```

**Xóa automated backup:**
```bash
./scripts/backup/remove-auto-backup.sh
```

### Setup thủ công (nếu cần)

```bash
# Edit crontab
crontab -e

# Add this line (runs daily at 2 AM)
0 2 * * * cd /path/to/goozi && ./scripts/backup/backup-with-retention.sh prod 7 >> logs/backup.log 2>&1
```

## 📁 Backup Structure

```
backups/
├── database/
│   ├── db_20240115_120000.sql.gz
│   ├── db_20240116_120000.sql.gz
│   └── ...
└── uploads/
    ├── uploads_20240115_120000.tar.gz
    ├── uploads_20240116_120000.tar.gz
    └── ...
```

## ⚠️ Important Notes

1. **Backup Location**: Backups are stored in `./backups/` directory. Make sure to:
   - Backup this directory regularly
   - Store backups off-server (S3, Google Drive, etc.)
   - Test restore process periodically

2. **Volume vs Bind Mount**:
   - Current setup uses Docker named volumes (persistent)
   - For easier access, consider using bind mounts (see `docker-compose.backup.yml.example`)

3. **Backup Size**: 
   - Database backups are usually small (< 100MB)
   - Uploads can be large (GBs), compress before storing off-server

4. **Restore Process**:
   - Always stop containers before restore
   - Test restore on staging environment first
   - Keep multiple backup versions

## 🔧 Alternative: Use Bind Mounts

For easier backup access, you can use bind mounts instead of volumes:

```yaml
# In docker-compose.yml
volumes:
  - ./backend/uploads:/app/uploads  # Bind mount instead of named volume
```

**Pros:**
- Easy to access files directly
- Simple backup (just copy directory)
- No need for special restore scripts

**Cons:**
- Files are on host filesystem
- Need to manage permissions
- Less portable
