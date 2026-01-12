# Tài liệu Backend - Goozi

## Tổng quan

Backend của Goozi được xây dựng bằng **Node.js** với framework **Fastify**, sử dụng **Sequelize ORM** để quản lý database **PostgreSQL**. Hệ thống được thiết kế theo mô hình **Controller-Service** để tách biệt rõ ràng các tầng logic.

## Công nghệ sử dụng

- **Runtime**: Node.js (ES Modules)
- **Framework**: Fastify v4.26.2
- **ORM**: Sequelize v6.35.2
- **Database**: PostgreSQL
- **Authentication**: JWT (@fastify/jwt)
- **File Upload**: @fastify/multipart
- **Password Hashing**: bcryptjs

## Cấu trúc thư mục

```
backend/
├── src/
│   ├── config/              # Cấu hình database
│   │   └── database.js
│   ├── controllers/         # Xử lý HTTP request/response
│   │   ├── AuthController.js
│   │   ├── HomeSettingController.js
│   │   ├── LanguageController.js
│   │   ├── TestimonialController.js
│   │   ├── TopicController.js
│   │   ├── UploadController.js
│   │   ├── UserController.js
│   │   └── VocabularyController.js
│   ├── services/            # Business logic
│   │   ├── AuthService.js
│   │   ├── HomeSettingService.js
│   │   ├── LanguageService.js
│   │   ├── TestimonialService.js
│   │   ├── TopicService.js
│   │   ├── UserService.js
│   │   └── VocabularyService.js
│   ├── models/              # Sequelize models
│   │   ├── index.js
│   │   ├── User.js
│   │   ├── Topic.js
│   │   ├── TopicTranslation.js
│   │   ├── Vocabulary.js
│   │   ├── VocabularyTranslation.js
│   │   ├── Language.js
│   │   ├── HomeSetting.js
│   │   └── Testimonial.js
│   ├── routes/              # API routes
│   │   ├── auth.js
│   │   ├── topics.js
│   │   ├── vocabularies.js
│   │   ├── users.js
│   │   ├── languages.js
│   │   ├── upload.js
│   │   ├── home-settings.js
│   │   └── testimonials.js
│   ├── middleware/          # Middleware functions
│   │   └── auth.js
│   ├── migrations/          # Database migrations
│   │   ├── 001-create-users.js
│   │   ├── 002-create-topics.js
│   │   ├── 003-create-vocabularies.js
│   │   └── ...
│   ├── scripts/             # Utility scripts
│   │   ├── migrate.js
│   │   ├── create-admin.js
│   │   └── reset-admin-password.js
│   └── server.js            # Entry point
├── uploads/                 # Thư mục lưu file upload
├── package.json
└── Dockerfile
```

## Kiến trúc

### Mô hình Controller-Service

Luồng xử lý request:
```
HTTP Request 
  → Route (định nghĩa endpoint)
  → Controller (xử lý request/response, validation)
  → Service (business logic)
  → Model (database operations)
  → Database
```

**Ưu điểm:**
- Tách biệt rõ ràng các tầng
- Dễ bảo trì và mở rộng
- Business logic tập trung ở Service layer
- Controller chỉ lo xử lý HTTP concerns

### Middleware

- **authenticate**: Xác thực JWT token (tất cả user đã đăng nhập)
- **requireAdmin**: Yêu cầu role admin

## Database Models

### User
- **id**: UUID (primary key)
- **email**: String (unique, required)
- **password**: String (hashed với bcrypt)
- **name**: String (required)
- **role**: ENUM('user', 'admin')
- **permissions**: JSONB (các quyền chi tiết: topics, vocabularies, home, users)
- **nativeLanguageId**: UUID (foreign key → Language)

**Hooks:**
- `beforeCreate`: Hash password tự động
- `beforeUpdate`: Hash password nếu có thay đổi

**Methods:**
- `comparePassword()`: So sánh password với hash
- `toJSON()`: Loại bỏ password khỏi response

### Language
- **id**: UUID (primary key)
- **code**: String (unique, required) - mã ngôn ngữ (vi, en, ja, ...)
- **name**: String (required) - tên ngôn ngữ

### Topic
- **id**: UUID (primary key)
- **order**: Integer - thứ tự hiển thị
- **Relationships**:
  - `hasMany` Vocabulary
  - `hasMany` TopicTranslation

### TopicTranslation
- **id**: UUID (primary key)
- **topicId**: UUID (foreign key → Topic)
- **languageId**: UUID (foreign key → Language)
- **name**: String - tên chủ đề theo ngôn ngữ
- **description**: Text - mô tả chủ đề

### Vocabulary
- **id**: UUID (primary key)
- **topicId**: UUID (foreign key → Topic)
- **word**: String (required) - từ vựng gốc
- **meaning**: String (nullable) - nghĩa gốc
- **avatar**: String - URL hình ảnh
- **order**: Integer - thứ tự hiển thị
- **Relationships**:
  - `belongsTo` Topic
  - `hasMany` VocabularyTranslation

### VocabularyTranslation
- **id**: UUID (primary key)
- **vocabularyId**: UUID (foreign key → Vocabulary)
- **languageId**: UUID (foreign key → Language)
- **translation**: String - bản dịch theo ngôn ngữ
- **phonetic**: String - phiên âm (nếu có)

### HomeSetting
- **id**: UUID (primary key)
- **key**: String - khóa cấu hình (slogan, picture, ...)
- **value**: JSONB - giá trị cấu hình
- **languageId**: UUID (foreign key → Language)

### Testimonial
- **id**: UUID (primary key)
- **name**: String - tên người đánh giá
- **content**: Text - nội dung đánh giá
- **avatar**: String - URL ảnh đại diện
- **languageId**: UUID (foreign key → Language)
- **order**: Integer - thứ tự hiển thị

## API Endpoints

### Authentication (`/api/auth`)

#### POST `/api/auth/register`
Đăng ký tài khoản mới

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "User Name"
}
```

**Response:**
```json
{
  "user": { ... },
  "token": "jwt_token_here"
}
```

#### POST `/api/auth/login`
Đăng nhập

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": { ... },
  "token": "jwt_token_here"
}
```

#### GET `/api/auth/me`
Lấy thông tin user hiện tại (yêu cầu authenticate)

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "user": { ... }
}
```

### Topics (`/api/topics`)

#### GET `/api/topics`
Lấy danh sách tất cả topics

**Query params:**
- `language`: Language code để filter translations

**Response:**
```json
{
  "topics": [
    {
      "id": "...",
      "order": 1,
      "translations": [...],
      "vocabularies": [...]
    }
  ]
}
```

#### GET `/api/topics/:id`
Lấy chi tiết topic

#### POST `/api/topics` (Admin only)
Tạo topic mới

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "order": 1,
  "translations": [
    {
      "languageId": "...",
      "name": "Topic Name",
      "description": "Topic Description"
    }
  ]
}
```

#### PUT `/api/topics/:id` (Admin only)
Cập nhật topic

#### DELETE `/api/topics/:id` (Admin only)
Xóa topic

### Vocabularies (`/api/vocabularies`)

#### GET `/api/vocabularies`
Lấy danh sách từ vựng

**Query params:**
- `topicId`: Filter theo topic
- `language`: Language code để filter translations

#### GET `/api/vocabularies/:id`
Lấy chi tiết từ vựng

#### POST `/api/vocabularies` (Admin only)
Tạo từ vựng mới

**Request Body:**
```json
{
  "topicId": "...",
  "word": "Hello",
  "meaning": "Xin chào",
  "order": 1,
  "translations": [
    {
      "languageId": "...",
      "translation": "Xin chào",
      "phonetic": "..."
    }
  ]
}
```

#### PUT `/api/vocabularies/:id` (Admin only)
Cập nhật từ vựng

#### DELETE `/api/vocabularies/:id` (Admin only)
Xóa từ vựng

### Users (`/api/users`) - Admin only

#### GET `/api/users`
Lấy danh sách users (phân trang)

#### GET `/api/users/:id`
Lấy chi tiết user

#### PUT `/api/users/:id`
Cập nhật user (có thể cập nhật role, permissions)

#### DELETE `/api/users/:id`
Xóa user

### Languages (`/api/languages`)

#### GET `/api/languages`
Lấy danh sách ngôn ngữ

#### POST `/api/languages` (Admin only)
Tạo ngôn ngữ mới

#### PUT `/api/languages/:id` (Admin only)
Cập nhật ngôn ngữ

#### DELETE `/api/languages/:id` (Admin only)
Xóa ngôn ngữ

### Upload (`/api/upload`)

#### POST `/api/upload`
Upload file (image)

**Request:** multipart/form-data
- `file`: File to upload

**Response:**
```json
{
  "url": "/uploads/filename.jpg"
}
```

### Home Settings (`/api/home-settings`) - Admin only

#### GET `/api/home-settings`
Lấy cấu hình trang chủ

**Query params:**
- `key`: Filter theo key (slogan, picture, ...)
- `languageId`: Filter theo ngôn ngữ

#### POST `/api/home-settings`
Tạo/cập nhật cấu hình

### Testimonials (`/api/testimonials`) - Admin only

#### GET `/api/testimonials`
Lấy danh sách testimonials

#### POST `/api/testimonials`
Tạo testimonial mới

#### PUT `/api/testimonials/:id`
Cập nhật testimonial

#### DELETE `/api/testimonials/:id`
Xóa testimonial

### Health Check

#### GET `/health`
Kiểm tra trạng thái server

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Authentication & Authorization

### JWT Token
- Token được tạo khi đăng nhập/đăng ký
- Token chứa: `userId`, `email`, `role`
- Mặc định expire: 7 ngày (có thể cấu hình qua `JWT_EXPIRES_IN`)

### Middleware
- `fastify.authenticate`: Xác thực token (cho user đã đăng nhập)
- `fastify.requireAdmin`: Yêu cầu role = 'admin'

### Permissions
User admin có thể có permissions chi tiết:
```json
{
  "topics": true,
  "vocabularies": true,
  "home": true,
  "users": true
}
```

## Database Migrations

### Chạy migrations
```bash
npm run migrate
```

### Rollback migration
```bash
npm run migrate:undo
```

### Danh sách migrations:
1. `001-create-users.js` - Tạo bảng users
2. `002-create-topics.js` - Tạo bảng topics
3. `003-create-vocabularies.js` - Tạo bảng vocabularies
4. `004-create-languages.js` - Tạo bảng languages
5. `005-add-languages-to-users.js` - Thêm nativeLanguageId cho users
6. `006-add-languages-to-topics.js` - Thêm languageId cho topics
7. `007-add-avatar-order-to-vocabularies.js` - Thêm avatar, order cho vocabularies
8. `008-create-vocabulary-translations.js` - Tạo bảng vocabulary_translations
9. `009-create-home-settings.js` - Tạo bảng home_settings
10. `010-remove-unique-key-from-home-settings.js` - Xóa unique constraint
11. `011-create-testimonials.js` - Tạo bảng testimonials
12. `012-add-permissions-to-users.js` - Thêm permissions cho users
13. `013-add-order-to-topics.js` - Thêm order cho topics
14. `014-create-topic-translations.js` - Tạo bảng topic_translations
15. `015-remove-language-fields-from-topics.js` - Xóa các trường language từ topics

## Utility Scripts

### Tạo admin account
```bash
npm run create-admin
```

Environment variables:
- `ADMIN_EMAIL`: Email admin (mặc định: admin@goozi.com)
- `ADMIN_PASSWORD`: Password (mặc định: admin123)
- `ADMIN_NAME`: Tên admin (mặc định: Admin)

### Reset admin password
```bash
npm run reset-admin
```

## Environment Variables

File `.env` cần có:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=goozi_db
DB_USER=postgres
DB_PASSWORD=postgres

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# Server
PORT=3001
NODE_ENV=development

# CORS
FRONTEND_URL=http://localhost:3000
CMS_URL=http://localhost:3002
```

## CORS Configuration

Backend cho phép CORS từ:
- `FRONTEND_URL` (từ .env)
- `CMS_URL` (từ .env)
- `http://localhost:3000` (web app)
- `http://localhost:3002` (CMS app)
- `http://web:3000` (Docker network)
- `http://cms:3002` (Docker network)

## File Upload

- Sử dụng `@fastify/multipart`
- Giới hạn file size: 10MB
- Files được lưu trong thư mục `uploads/`
- Serve static files tại `/uploads/` path

## Error Handling

Controllers sử dụng try-catch để xử lý lỗi:
- HTTP status codes phù hợp
- Error messages rõ ràng
- Logging lỗi với Fastify logger

## Development

### Chạy development server
```bash
npm run dev
```
Sử dụng `node --watch` để auto-reload khi có thay đổi

### Production build
```bash
npm start
```

## Docker

### Dockerfile
- Base image: `node:18-alpine`
- Install dependencies
- Copy source code
- Expose port 3001

### Health check
Endpoint `/health` được sử dụng để kiểm tra trạng thái container

## Security Best Practices

1. **Password Hashing**: Sử dụng bcrypt với salt rounds = 10
2. **JWT Secret**: Nên thay đổi trong production
3. **SQL Injection**: Sequelize tự động escape queries
4. **CORS**: Chỉ cho phép từ các domain được cấu hình
5. **File Upload**: Giới hạn file size và validate file types

## Tối ưu hóa

1. Database indexing trên các foreign keys
2. Eager loading relationships khi cần (include)
3. Pagination cho các danh sách lớn
4. Caching (có thể thêm sau)

## Mở rộng

Để thêm tính năng mới:
1. Tạo migration nếu cần bảng mới
2. Tạo Model trong `models/`
3. Tạo Service trong `services/`
4. Tạo Controller trong `controllers/`
5. Tạo Route trong `routes/`
6. Đăng ký route trong `server.js`
