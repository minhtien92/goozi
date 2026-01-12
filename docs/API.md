# Goozi API Documentation

## 📚 Tổng Quan

Goozi API là RESTful API được xây dựng với Fastify framework, cung cấp các endpoints để quản lý người dùng, topics, vocabularies, languages và các tính năng khác của nền tảng học ngôn ngữ Goozi.

## 🚀 Truy Cập API Documentation

### Swagger UI (Khuyến nghị)

API documentation được tự động generate và hiển thị qua Swagger UI:

**URL**: `http://localhost:3001/api-docs`

Tại đây bạn có thể:
- Xem tất cả các endpoints
- Xem request/response schemas
- Test API trực tiếp trên browser
- Xem examples và descriptions

### OpenAPI JSON

OpenAPI specification (JSON format):
**URL**: `http://localhost:3001/api-docs/json`

**Có thể import vào:**
- **Postman**: File → Import → Link → Paste URL
- **Insomnia**: Application → Preferences → Data → Import Data → From URL
- **Swagger Editor**: https://editor.swagger.io/ → File → Import File → From URL
- **Các API client generators**: Generate code cho nhiều ngôn ngữ

## 🔐 Authentication

API sử dụng JWT (JSON Web Token) để xác thực. Có 2 cách đăng nhập:

### 1. Email/Password Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user"
  }
}
```

### 2. Google OAuth Login

```http
POST /api/auth/google
Content-Type: application/json

{
  "idToken": "google-id-token-here"
}
```

### Sử dụng Token

Sau khi đăng nhập thành công, sử dụng token trong header:

```http
Authorization: Bearer <your-jwt-token>
```

**Ví dụ:**
```http
GET /api/auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 📋 Các Endpoints Chính

### Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/register` | Đăng ký tài khoản mới | No |
| POST | `/login` | Đăng nhập với email/password | No |
| POST | `/google` | Đăng nhập với Google OAuth | No |
| GET | `/me` | Lấy thông tin user hiện tại | Yes |

### Topics (`/api/topics`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Lấy danh sách topics | No |
| GET | `/:id` | Lấy chi tiết topic | No |
| POST | `/` | Tạo topic mới | Admin |
| PUT | `/:id` | Cập nhật topic | Admin |
| DELETE | `/:id` | Xóa topic | Admin |

### Vocabularies (`/api/vocabularies`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Lấy danh sách vocabularies | No |
| GET | `/:id` | Lấy chi tiết vocabulary | No |
| POST | `/` | Tạo vocabulary mới | Admin |
| PUT | `/:id` | Cập nhật vocabulary | Admin |
| DELETE | `/:id` | Xóa vocabulary | Admin |

### Languages (`/api/languages`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Lấy danh sách languages | No |
| GET | `/:id` | Lấy chi tiết language | No |
| POST | `/` | Tạo language mới | Admin |
| PUT | `/:id` | Cập nhật language | Admin |
| DELETE | `/:id` | Xóa language | Admin |

### Users (`/api/users`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Lấy danh sách users | Admin |
| GET | `/:id` | Lấy chi tiết user | Admin |
| PUT | `/:id` | Cập nhật user | User/Admin |
| DELETE | `/:id` | Xóa user | Admin |

### Home Settings (`/api/home-settings`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/active` | Lấy settings đang active | No |
| GET | `/` | Lấy tất cả settings | Admin |
| POST | `/` | Tạo setting mới | Admin |
| PUT | `/:id` | Cập nhật setting | Admin |
| DELETE | `/:id` | Xóa setting | Admin |

### Testimonials (`/api/testimonials`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/active` | Lấy testimonials đang active | No |
| GET | `/` | Lấy tất cả testimonials | Admin |
| POST | `/` | Tạo testimonial mới | Admin |
| PUT | `/:id` | Cập nhật testimonial | Admin |
| DELETE | `/:id` | Xóa testimonial | Admin |

### Upload (`/api/upload`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/` | Upload file (image/audio) | Admin |

## 📝 Ví Dụ Sử Dụng

### 1. Đăng ký và Đăng nhập

```bash
# Đăng ký
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe"
  }'

# Đăng nhập
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### 2. Lấy danh sách Topics

```bash
# Lấy tất cả topics
curl http://localhost:3001/api/topics

# Lấy topics với pagination
curl "http://localhost:3001/api/topics?page=1&limit=10"

# Lọc theo active status
curl "http://localhost:3001/api/topics?isActive=true"
```

### 3. Lấy thông tin User hiện tại

```bash
curl http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4. Tạo Topic mới (Admin)

```bash
curl -X POST http://localhost:3001/api/topics \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Food & Drinks",
    "description": "Learn vocabulary about food and drinks",
    "isActive": true,
    "order": 1
  }'
```

## 🔧 Base URL

- **Development**: `http://localhost:3001`
- **Production**: (Cấu hình theo môi trường)

Tất cả API endpoints có prefix `/api`

## 📊 Response Format

### Success Response

```json
{
  "message": "Success message",
  "data": { ... }
}
```

### Error Response

```json
{
  "error": "Error message",
  "message": "Detailed error message (in development)"
}
```

### Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## 🛠️ Tools Khuyến Nghị

### 1. Swagger UI (Built-in)
- URL: `http://localhost:3001/api-docs`
- Test API trực tiếp trên browser
- Xem schema và examples

### 2. Postman
- Import OpenAPI spec từ `/api-docs/json`
- Tạo collection và test cases
- Share với team

### 3. Insomnia
- Import OpenAPI spec
- UI đẹp và dễ sử dụng
- Hỗ trợ environment variables

### 4. cURL / HTTPie
- Command line tools
- Dễ dàng script và automate

## 📖 Thêm Thông Tin

Để xem chi tiết đầy đủ về từng endpoint, request/response schemas, và examples:

1. **Truy cập Swagger UI**: http://localhost:3001/api-docs
   - Xem tất cả endpoints được tổ chức theo tags
   - Click vào endpoint để xem chi tiết
   - Sử dụng "Try it out" để test trực tiếp

2. **Xem code implementation**: `backend/src/routes/` để hiểu rõ hơn về logic

## 🎯 Quick Start với Swagger UI

### Bước 1: Mở Swagger UI
Truy cập: http://localhost:3001/api-docs

### Bước 2: Test Authentication
1. Mở section **auth**
2. Click vào **POST /api/auth/login**
3. Click **"Try it out"**
4. Điền email và password:
   ```json
   {
     "email": "user@example.com",
     "password": "password123"
   }
   ```
5. Click **"Execute"**
6. Copy token từ response

### Bước 3: Sử dụng Token
1. Click nút **"Authorize"** ở đầu trang (🔓 icon)
2. Paste token vào ô "Value"
3. Click **"Authorize"** → **"Close"**
4. Bây giờ tất cả requests sẽ tự động include token

### Bước 4: Test Protected Endpoints
1. Mở section **topics**
2. Click **GET /api/topics**
3. Click **"Try it out"**
4. Click **"Execute"**
5. Xem response với dữ liệu thực tế

## 💡 Tips

- **Authorize một lần**: Sau khi authorize, tất cả requests sẽ tự động dùng token
- **Xem Response Schema**: Scroll xuống để xem cấu trúc response
- **Copy cURL**: Swagger UI có thể generate cURL command cho bạn
- **Export OpenAPI**: Có thể export OpenAPI spec để import vào Postman/Insomnia

## 🔄 Cập Nhật Documentation

Documentation được tự động generate từ code. Khi thêm schema vào routes, documentation sẽ tự động cập nhật.

**Cách thêm schema cho route mới:**

```javascript
fastify.get('/endpoint', {
  schema: {
    tags: ['tag-name'],
    summary: 'Short description',
    description: 'Detailed description',
    querystring: {
      type: 'object',
      properties: {
        param: { type: 'string' }
      }
    },
    response: {
      200: {
        type: 'object',
        properties: {
          data: { type: 'object' }
        }
      }
    }
  }
}, handler);
```

## 📞 Hỗ Trợ

Nếu có câu hỏi hoặc cần hỗ trợ:
- Xem Swagger UI tại `/api-docs`
- Kiểm tra code trong `backend/src/routes/`
- Liên hệ team development
