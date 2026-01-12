# Goozi - Hệ thống học đa ngôn ngữ

Hệ thống học đa ngôn ngữ với flashcard, quản lý từ vựng và chủ đề.

## Cấu trúc dự án

```
goozi/
├── backend/                    # Backend API (Node.js + Fastify)
│   ├── src/
│   │   ├── config/             # Database configuration
│   │   ├── controllers/       # Controllers (xử lý HTTP request/response)
│   │   ├── services/          # Services (business logic)
│   │   ├── models/            # Sequelize models
│   │   ├── routes/            # API routes
│   │   ├── middleware/        # Middleware (auth, etc.)
│   │   └── migrations/        # Database migrations
│   └── server.js              # Entry point
├── web/                        # Frontend User (React + TypeScript)
└── cms/                        # Frontend CMS (React + TypeScript)
```

## Công nghệ sử dụng

### Backend
- Node.js
- Fastify
- Sequelize ORM
- PostgreSQL
- JWT Authentication
- Swagger/OpenAPI (API Documentation)

### Frontend (Web & CMS)
- React + TypeScript
- Tailwind CSS
- Axios
- Zustand (State Management)
- React Router

## Cài đặt

### Cách 1: Sử dụng Docker (Khuyến nghị)

#### Yêu cầu
- Docker Desktop đã được cài đặt
- Docker Compose đã được cài đặt

#### Cài đặt tự động

**Linux/Mac:**
```bash
chmod +x install.sh
./install.sh
```

**Windows:**
```cmd
install.bat
```

Script sẽ:
1. Kiểm tra Docker và Docker Compose
2. Tạo file `.env` nếu chưa có
3. Build và khởi động tất cả services
4. Chạy database migrations

#### Cài đặt thủ công

**Production:**
```bash
# Build và khởi động tất cả services
docker-compose up -d --build

# Chạy migrations
docker-compose exec backend npm run migrate

# Xem logs
docker-compose logs -f
```

**Development (với hot reload):**
```bash
# Build và khởi động development environment
docker-compose -f docker-compose.dev.yml up -d --build

# Chạy migrations
docker-compose -f docker-compose.dev.yml exec backend npm run migrate

# Xem logs
docker-compose -f docker-compose.dev.yml logs -f
```

**Dừng services:**
```bash
# Production
docker-compose down

# Development
docker-compose -f docker-compose.dev.yml down
```

**Xóa volumes (xóa database):**
```bash
docker-compose down -v
```

### Cách 2: Cài đặt thủ công (không dùng Docker)

#### 1. Backend

```bash
cd backend
npm install
```

Tạo file `.env` từ `.env.example` và cấu hình:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=goozi_db
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
CMS_URL=http://localhost:3002
```

Chạy migrations:

```bash
npm run migrate
```

Khởi động server:

```bash
npm run dev
```

#### 2. Frontend Web

```bash
cd web
npm install
```

Tạo file `.env`:

```env
VITE_API_URL=http://localhost:3001/api
```

Khởi động:

```bash
npm run dev
```

Truy cập: http://localhost:3000

#### 3. Frontend CMS

```bash
cd cms
npm install
```

Tạo file `.env`:

```env
VITE_API_URL=http://localhost:3001/api
```

Khởi động:

```bash
npm run dev
```

Truy cập: http://localhost:3002

## Tính năng

### User (Web)
- ✅ Đăng ký và đăng nhập
- ✅ Xem danh sách chủ đề
- ✅ Xem chi tiết chủ đề và từ vựng
- ✅ Học với flashcard (flip card)
- ✅ Phát âm từ vựng (Text-to-Speech)

### Admin (CMS)
- ✅ Đăng nhập (chỉ admin)
- ✅ Dashboard thống kê
- ✅ Quản lý người dùng (CRUD)
- ✅ Quản lý chủ đề (CRUD)
- ✅ Quản lý từ vựng (CRUD)

## Kiến trúc Backend

Backend được tổ chức theo mô hình **Controller-Service** để tách biệt rõ ràng các tầng:

- **Routes**: Định nghĩa các endpoint và middleware, gọi controllers
- **Controllers**: Xử lý HTTP request/response, validation, gọi services
- **Services**: Chứa business logic, tương tác với database models
- **Models**: Sequelize ORM models định nghĩa database schema

### Ví dụ luồng xử lý:

```
Request → Route → Controller → Service → Model → Database
                ↓
Response ← Route ← Controller ← Service ← Model
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/me` - Lấy thông tin user hiện tại

### Topics
- `GET /api/topics` - Lấy danh sách chủ đề
- `GET /api/topics/:id` - Lấy chi tiết chủ đề
- `POST /api/topics` - Tạo chủ đề (admin)
- `PUT /api/topics/:id` - Cập nhật chủ đề (admin)
- `DELETE /api/topics/:id` - Xóa chủ đề (admin)

### Vocabularies
- `GET /api/vocabularies` - Lấy danh sách từ vựng
- `GET /api/vocabularies/:id` - Lấy chi tiết từ vựng
- `POST /api/vocabularies` - Tạo từ vựng (admin)
- `PUT /api/vocabularies/:id` - Cập nhật từ vựng (admin)
- `DELETE /api/vocabularies/:id` - Xóa từ vựng (admin)

### Users (Admin only)
- `GET /api/users` - Lấy danh sách users
- `GET /api/users/:id` - Lấy chi tiết user
- `PUT /api/users/:id` - Cập nhật user
- `DELETE /api/users/:id` - Xóa user

## Tạo tài khoản Admin

### Cách 1: Sử dụng script (Khuyến nghị)

Script sẽ tự động tạo tài khoản admin với thông tin mặc định:

**Với Docker:**
```bash
docker-compose exec backend npm run create-admin
```

**Không dùng Docker:**
```bash
cd backend
npm run create-admin
```

**Thông tin đăng nhập mặc định:**
- Email: `admin@goozi.com`
- Password: `admin123`

⚠️ **Lưu ý:** Vui lòng đổi mật khẩu sau lần đăng nhập đầu tiên!

### Tùy chỉnh thông tin admin

Bạn có thể set environment variables trước khi chạy script:

```bash
# Với Docker
docker-compose exec -e ADMIN_EMAIL=your-email@example.com -e ADMIN_PASSWORD=your-password backend npm run create-admin

# Hoặc thêm vào .env file
ADMIN_EMAIL=your-email@example.com
ADMIN_PASSWORD=your-password
ADMIN_NAME=Your Name
```

### Cách 2: Tạo thủ công qua database

**Với Docker:**
```bash
docker-compose exec postgres psql -U postgres -d goozi_db -c "UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';"
```

**Không dùng Docker:**
```sql
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
```

### Cách 3: Đăng ký và nâng cấp

1. Đăng ký tài khoản thông thường qua web tại http://localhost:3000
2. Sau đó nâng cấp thành admin bằng cách 2 ở trên

## Docker Commands

### Quản lý containers

```bash
# Xem trạng thái containers
docker-compose ps

# Xem logs
docker-compose logs -f [service_name]

# Restart service
docker-compose restart [service_name]

# Stop tất cả services
docker-compose down

# Stop và xóa volumes
docker-compose down -v

# Rebuild và restart
docker-compose up -d --build
```

### Kiểm tra services

```bash
# Linux/Mac
chmod +x check-services.sh
./check-services.sh

# Windows
check-services.bat
```

### Khắc phục sự cố

Nếu không truy cập được web:

1. **Rebuild containers:**
```bash
docker-compose down
docker-compose up -d --build
```

2. **Kiểm tra logs:**
```bash
docker-compose logs backend
docker-compose logs web
docker-compose logs cms
```

3. **Kiểm tra backend API:**
```bash
curl http://localhost:3001/health
```

4. **Kiểm tra ports:**
```bash
# Linux/Mac
lsof -i :3000
lsof -i :3001
lsof -i :3002

# Windows
netstat -ano | findstr :3000
netstat -ano | findstr :3001
netstat -ano | findstr :3002
```

Xem thêm chi tiết trong file `TROUBLESHOOTING.md`

### Database

```bash
# Truy cập PostgreSQL
docker-compose exec postgres psql -U postgres -d goozi_db

# Backup database
docker-compose exec postgres pg_dump -U postgres goozi_db > backup.sql

# Restore database
docker-compose exec -T postgres psql -U postgres goozi_db < backup.sql
```

## Lưu ý

- Đảm bảo PostgreSQL đã được cài đặt và chạy
- Thay đổi JWT_SECRET trong production
- Cấu hình CORS phù hợp với domain của bạn
- File `.env` không được commit lên git



docker-compose exec backend npm run migrate


Hướng dẫn lấy Google Client ID:
Truy cập Google Cloud Console
Tạo project mới hoặc chọn project hiện có
Enable Google+ API hoặc Google Identity Services
Tạo OAuth 2.0 Client ID:
Credentials → Create Credentials → OAuth client ID
Application type: Web application
Authorized JavaScript origins: http://localhost:3000 (dev), domain production (prod)
Authorized redirect URIs: không cần (vì dùng Google Identity Services)
Copy Client ID vào .env files

⚠️ QUAN TRỌNG: Nếu gặp lỗi 403 "The given origin is not allowed", xem chi tiết trong docs/GOOGLE_OAUTH_SETUP.md

## 📚 API Documentation

API documentation được tự động generate và có thể truy cập tại:

- **Swagger UI**: http://localhost:3001/api-docs
- **OpenAPI JSON**: http://localhost:3001/api-docs/json

Xem hướng dẫn chi tiết trong [docs/API.md](docs/API.md)

### Tính năng:
- ✅ Tự động generate từ code
- ✅ Test API trực tiếp trên browser
- ✅ Xem request/response schemas
- ✅ Examples và descriptions đầy đủ
- ✅ Import vào Postman/Insomnia
