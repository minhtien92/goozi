# 🔧 Khắc phục lỗi "password authentication failed" sau khi restart Docker

## Nguyên nhân:
Khi restart Docker, PostgreSQL volume đã tồn tại với password cũ, nhưng environment variables có password mới (hoặc không có .env file), dẫn đến không khớp.

## Giải pháp:

### Cách 1: Reset database volume (Mất dữ liệu - chỉ dùng khi không cần giữ dữ liệu)

**Windows:**
```bash
fix-database-password.bat
# Chọn 'y' khi được hỏi
```

**Linux/Mac:**
```bash
chmod +x fix-database-password.sh
./fix-database-password.sh
# Chọn 'y' khi được hỏi
```

**Hoặc thủ công:**
```bash
docker-compose down -v  # Xóa volume
docker-compose up -d    # Tạo lại
```

### Cách 2: Đảm bảo password trong .env khớp với database đã tồn tại

1. **Tạo file `.env`** trong thư mục gốc (nếu chưa có):
```env
DB_USER=postgres
DB_PASSWORD=postgres  # Đổi thành password đã được set trong database
DB_NAME=goozi_db
DB_PORT=5432
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

2. **Kiểm tra password hiện tại trong database:**
```bash
# Kết nối vào database container
docker exec -it goozi-postgres psql -U postgres

# Trong psql, kiểm tra user
\du

# Nếu cần, đổi password
ALTER USER postgres WITH PASSWORD 'your_new_password';
\q
```

3. **Cập nhật `.env` với password đúng**

4. **Restart services:**
```bash
docker-compose down
docker-compose up -d
```

### Cách 3: Đổi password trong database để khớp với .env

Nếu bạn muốn giữ dữ liệu và đổi password trong database:

```bash
# 1. Kết nối vào database (dùng password cũ nếu biết)
docker exec -it goozi-postgres psql -U postgres

# 2. Đổi password
ALTER USER postgres WITH PASSWORD 'postgres';  # Hoặc password trong .env của bạn

# 3. Thoát
\q

# 4. Restart services
docker-compose down
docker-compose up -d
```

## Kiểm tra kết nối:

```bash
# Xem logs backend
docker-compose logs backend

# Kiểm tra database
docker exec -it goozi-postgres psql -U postgres -d goozi_db -c "SELECT 1;"
```

## Lưu ý:

- **Luôn có file `.env`** với password nhất quán
- **Backup dữ liệu** trước khi reset volume
- **Password mạnh** trong production (ít nhất 20 ký tự)

