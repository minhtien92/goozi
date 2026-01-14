# Tài liệu dự án Goozi

Dự án Goozi là hệ thống học đa ngôn ngữ với flashcard, quản lý từ vựng và chủ đề.

## Cấu trúc tài liệu

Dự án được chia thành 3 phần chính, mỗi phần có tài liệu riêng:

### 📘 [Backend Documentation](./BACKEND.md)
Tài liệu chi tiết về backend API:
- Kiến trúc và cấu trúc thư mục
- Database models và relationships
- API endpoints chi tiết
- Authentication & Authorization
- Database migrations
- Utility scripts

### 🎨 [CMS Documentation](./CMS.md)
Tài liệu chi tiết về Content Management System:
- Tính năng quản trị
- Components và routing
- State management
- UI/UX features
- User permissions

### 🌐 [Web Documentation](./WEB.md)
Tài liệu chi tiết về Web Application:
- Tính năng người dùng
- Flashcard learning
- Text-to-Speech
- User flows

### 📚 Tài liệu chuyên sâu

#### [API Documentation](./API.md)
- API endpoints đầy đủ
- Swagger UI integration
- Request/Response examples
- Authentication flow

#### [Database Schema](./DATABASE_SCHEMA.md)
- Entity Relationship Diagram (ERD)
- Chi tiết tất cả tables
- Relationships và foreign keys
- JSONB fields và cách sử dụng
- Query examples

#### [User Preferences](./USER_PREFERENCES.md)
- Cấu trúc user preferences
- learningLanguageIds, voiceAccentVersion, nativeLanguage
- Data flow và synchronization
- API endpoints
- Common issues và solutions

#### [Multi-Language Support](./MULTI_LANGUAGE.md)
- Cấu trúc dữ liệu multi-language
- Slogans (JSON format)
- Topics và Vocabularies translations
- CMS và Frontend implementation
- Language selection flow

#### [Google OAuth Setup](./GOOGLE_OAUTH_SETUP.md)
- Cấu hình Google OAuth
- Troubleshooting
- Common issues

#### [Documentation Review](./DOCUMENTATION_REVIEW.md)
- Đánh giá mức độ đầy đủ của tài liệu
- Đề xuất bổ sung
- Priority list

## Tổng quan dự án

### Công nghệ chính

**Backend:**
- Node.js + Fastify
- PostgreSQL + Sequelize ORM
- JWT Authentication

**Frontend (Web & CMS):**
- React + TypeScript
- Vite
- Tailwind CSS
- Zustand (State Management)

### Kiến trúc tổng thể

```
┌─────────────┐     ┌─────────────┐
│   Web App   │────▶│             │
│ (Port 3000) │     │   Backend   │
└─────────────┘     │   API       │
                    │ (Port 3001) │
┌─────────────┐     │             │
│     CMS     │────▶│             │
│ (Port 3002) │     └──────┬──────┘
└─────────────┘            │
                           ▼
                    ┌─────────────┐
                    │ PostgreSQL  │
                    │  Database   │
                    └─────────────┘
```

### Luồng dữ liệu

1. **User Request** → Web/CMS frontend
2. **API Call** → Backend API với JWT token
3. **Authentication** → Verify token
4. **Authorization** → Check permissions
5. **Business Logic** → Service layer
6. **Database Query** → Sequelize ORM
7. **Response** → JSON data
8. **UI Update** → React components

## Quick Start

Xem [README.md](../README.md) ở thư mục gốc để biết hướng dẫn cài đặt và chạy dự án.

## Các tính năng chính

### Cho người dùng (Web)
- ✅ Đăng ký và đăng nhập
- ✅ Xem danh sách chủ đề
- ✅ Xem chi tiết chủ đề và từ vựng
- ✅ Học với flashcard (flip card)
- ✅ Phát âm từ vựng (Text-to-Speech)
- ✅ Chọn ngôn ngữ hiển thị

### Cho admin (CMS)
- ✅ Dashboard thống kê
- ✅ Quản lý người dùng (CRUD)
- ✅ Quản lý chủ đề (CRUD)
- ✅ Quản lý từ vựng (CRUD)
- ✅ Quản lý ngôn ngữ (CRUD)
- ✅ Quản lý cấu hình trang chủ
- ✅ Quản lý testimonials
- ✅ Permissions system

## Development Workflow

### Thêm tính năng mới

1. **Backend:**
   - Tạo migration nếu cần (database changes)
   - Tạo/update Model
   - Tạo/update Service (business logic)
   - Tạo/update Controller (HTTP handling)
   - Tạo/update Route
   - Đăng ký route trong `server.js`

2. **CMS (nếu cần):**
   - Tạo page component
   - Thêm route
   - Thêm menu item (nếu cần)
   - Tạo API calls

3. **Web (nếu cần):**
   - Tạo page component
   - Thêm route
   - Tạo API calls
   - Update navigation

## API Base URL

- **Development:** `http://localhost:3001/api`
- **Production:** Cấu hình trong environment variables

## Environment Variables

### Backend (.env)
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=goozi_db
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
PORT=3001
FRONTEND_URL=http://localhost:3000
CMS_URL=http://localhost:3002
```

### Web (.env)
```env
VITE_API_URL=http://localhost:3001/api
```

### CMS (.env)
```env
VITE_API_URL=http://localhost:3001/api
```

## Database Schema

### Core Tables
- `users` - Người dùng
- `languages` - Ngôn ngữ
- `topics` - Chủ đề
- `topic_translations` - Bản dịch chủ đề
- `vocabularies` - Từ vựng
- `vocabulary_translations` - Bản dịch từ vựng
- `home_settings` - Cấu hình trang chủ
- `testimonials` - Đánh giá

Xem chi tiết trong [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) và [BACKEND.md](./BACKEND.md)

## Authentication Flow

1. User đăng ký/đăng nhập
2. Backend tạo JWT token
3. Frontend lưu token vào localStorage
4. Mỗi API request gửi token trong header: `Authorization: Bearer <token>`
5. Backend verify token và lấy user info
6. Kiểm tra permissions nếu cần

## Testing

### Manual Testing
- Test API với Postman/Thunder Client
- Test UI với browser DevTools
- Test flows end-to-end

### Automated Testing
- Unit tests (có thể thêm)
- Integration tests (có thể thêm)
- E2E tests (có thể thêm)

## Deployment

### Docker
Xem `docker-compose.yml` và `REBUILD-DOCKER.md` để biết cách deploy với Docker.

### Manual Deployment
1. Build backend: `cd backend && npm install && npm start`
2. Build web: `cd web && npm install && npm run build`
3. Build CMS: `cd cms && npm install && npm run build`
4. Serve với Nginx hoặc web server khác

## Security Considerations

1. **JWT Secret**: Đổi secret key trong production
2. **Password Hashing**: Sử dụng bcrypt (đã implement)
3. **CORS**: Chỉ cho phép từ domain được cấu hình
4. **SQL Injection**: Sequelize tự động escape
5. **XSS**: React tự động escape
6. **File Upload**: Validate file type và size

## Troubleshooting

Xem [TROUBLESHOOTING.md](../TROUBLESHOOTING.md) trong thư mục gốc.

## Contributing

1. Tạo branch mới từ `main`
2. Implement tính năng
3. Test kỹ lưỡng
4. Tạo pull request
5. Review và merge

## License

Xem LICENSE file trong thư mục gốc.

## Support

Nếu có vấn đề, vui lòng tạo issue trên repository hoặc liên hệ team phát triển.
