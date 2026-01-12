# Tài liệu CMS - Goozi

## Tổng quan

CMS (Content Management System) của Goozi là một ứng dụng web quản trị được xây dựng bằng **React** và **TypeScript**, cho phép admin quản lý nội dung hệ thống học ngôn ngữ.

## Công nghệ sử dụng

- **Framework**: React 18.2.0
- **Language**: TypeScript 5.2.2
- **Build Tool**: Vite 5.1.4
- **Routing**: React Router DOM 6.22.0
- **HTTP Client**: Axios 1.6.7
- **State Management**: Zustand 4.5.0
- **Styling**: Tailwind CSS 3.4.1
- **UI Framework**: AdminLTE (sử dụng qua CDN)

## Cấu trúc thư mục

```
cms/
├── src/
│   ├── assets/
│   │   └── img/
│   │       └── logo.svg
│   ├── components/
│   │   ├── Layout.tsx          # Layout chính với sidebar, navbar
│   │   └── Pagination.tsx      # Component phân trang
│   ├── config/
│   │   └── api.ts              # Cấu hình Axios instance
│   ├── pages/
│   │   ├── Login.tsx           # Trang đăng nhập
│   │   ├── Dashboard.tsx       # Trang dashboard thống kê
│   │   ├── Users.tsx           # Quản lý users
│   │   ├── Topics.tsx          # Quản lý topics
│   │   ├── Vocabularies.tsx    # Quản lý từ vựng
│   │   ├── Languages.tsx       # Quản lý ngôn ngữ
│   │   ├── Slogan.tsx          # Quản lý slogan trang chủ
│   │   ├── Picture.tsx         # Quản lý hình ảnh trang chủ
│   │   ├── Testimonials.tsx    # Quản lý testimonials
│   │   └── Feedback.tsx        # Quản lý feedback
│   ├── store/
│   │   └── authStore.ts        # Zustand store cho authentication
│   ├── App.tsx                 # Component chính, routing
│   ├── main.tsx                # Entry point
│   └── index.css               # Global styles
├── index.html
├── vite.config.ts
├── tailwind.config.js
└── package.json
```

## Tính năng chính

### 1. Authentication & Authorization
- Đăng nhập với email/password
- JWT token-based authentication
- Chỉ admin mới có thể truy cập CMS
- Auto redirect nếu chưa đăng nhập hoặc không phải admin
- Lưu token trong localStorage

### 2. Dashboard
- Thống kê tổng quan:
  - Tổng số Users
  - Tổng số Topics
  - Tổng số Vocabularies
  - Tổng số Languages
- Quick actions để điều hướng nhanh đến các trang quản lý

### 3. User Management (`/users`)
- Xem danh sách users (có phân trang)
- Tìm kiếm users
- Xem chi tiết user
- Cập nhật thông tin user:
  - Tên
  - Email
  - Role (user/admin)
  - Permissions (topics, vocabularies, home, users)
  - Native language
- Xóa user

### 4. Topic Management (`/topics`)
- Xem danh sách topics
- Tạo topic mới:
  - Thứ tự (order)
  - Translations cho nhiều ngôn ngữ (name, description)
- Cập nhật topic
- Xóa topic
- Xem danh sách vocabularies thuộc topic

### 5. Vocabulary Management (`/vocabularies`)
- Xem danh sách từ vựng (có filter theo topic)
- Tạo từ vựng mới:
  - Chọn topic
  - Từ gốc (word)
  - Nghĩa gốc (meaning)
  - Hình ảnh (avatar) - upload file
  - Thứ tự (order)
  - Translations cho nhiều ngôn ngữ (translation, phonetic)
- Cập nhật từ vựng
- Xóa từ vựng
- Upload hình ảnh

### 6. Language Management (`/languages`)
- Xem danh sách ngôn ngữ
- Tạo ngôn ngữ mới:
  - Code (mã ngôn ngữ: vi, en, ja, ...)
  - Name (tên ngôn ngữ)
- Cập nhật ngôn ngữ
- Xóa ngôn ngữ

### 7. Home Settings

#### Slogan Management (`/home-settings/slogan`)
- Quản lý slogan trang chủ theo từng ngôn ngữ
- Cập nhật slogan cho các ngôn ngữ khác nhau

#### Picture Management (`/home-settings/picture`)
- Quản lý hình ảnh trang chủ
- Upload và cập nhật hình ảnh

### 8. Testimonial Management (`/testimonials`)
- Xem danh sách testimonials
- Tạo testimonial mới:
  - Tên người đánh giá
  - Nội dung đánh giá
  - Hình ảnh đại diện (avatar)
  - Ngôn ngữ
  - Thứ tự hiển thị
- Cập nhật testimonial
- Xóa testimonial

### 9. Feedback Management (`/feedback`)
- Xem danh sách feedback từ users
- (Tính năng có thể mở rộng)

## Routing

### Public Routes
- `/login` - Trang đăng nhập

### Protected Routes (Yêu cầu admin)
- `/` - Dashboard
- `/users` - User Management
- `/topics` - Topic Management
- `/vocabularies` - Vocabulary Management
- `/languages` - Language Management
- `/home-settings/slogan` - Slogan Management
- `/home-settings/picture` - Picture Management
- `/testimonials` - Testimonial Management
- `/feedback` - Feedback Management

### Route Guards
- `PrivateRoute` component kiểm tra:
  1. User đã đăng nhập (`isAuthenticated`)
  2. User có role admin (`isAdmin`)
- Tự động redirect về `/login` nếu không thỏa mãn

## Components

### Layout Component
Component chính chứa:
- **Navbar**: Header với logo, menu toggle, user dropdown
- **Sidebar**: Menu điều hướng với các mục:
  - Dashboard
  - Language
  - Vocabulary (submenu: Topics, Word)
  - Phrase (chưa implement)
  - Sentence (chưa implement)
  - Web/Home (submenu: Slogan, Picture, Testimonial)
  - Feedback
  - Users (chỉ admin)
  - Logout
- **Content Wrapper**: Khu vực hiển thị nội dung
- **Footer**: Footer với copyright

**Features:**
- Responsive sidebar (collapse/expand)
- Active route highlighting
- Nested menu (treeview) cho Vocabulary và Web/Home
- User profile card ở đáy sidebar

### Pagination Component
Component phân trang reusable:
- Hiển thị số trang hiện tại
- Navigation: First, Previous, Next, Last
- Hiển thị số trang tối đa
- Props: `currentPage`, `totalPages`, `onPageChange`

## State Management (Zustand)

### authStore
Store quản lý authentication state:

```typescript
{
  user: User | null,
  token: string | null,
  login: (email, password) => Promise<void>,
  logout: () => void,
  isAuthenticated: () => boolean,
  isAdmin: () => boolean,
  setUser: (user) => void,
  setToken: (token) => void
}
```

**Persistence:**
- Token lưu trong `localStorage`
- User info lưu trong `localStorage`
- Tự động load khi app khởi động

## API Integration

### Axios Configuration (`config/api.ts`)
- Base URL từ environment variable `VITE_API_URL`
- Interceptor để thêm JWT token vào headers
- Interceptor để xử lý lỗi (401 → logout)

### API Calls
Tất cả API calls sử dụng Axios instance từ `config/api.ts`:

```typescript
import api from '../config/api';

// GET
const response = await api.get('/topics');

// POST
const response = await api.post('/topics', data);

// PUT
const response = await api.put(`/topics/${id}`, data);

// DELETE
const response = await api.delete(`/topics/${id}`);
```

## UI/UX Features

### AdminLTE Theme
- Sử dụng AdminLTE 3 theme (load từ CDN)
- Layout responsive
- Sidebar collapse/expand
- Treeview menu cho nested items
- Card-based UI
- Form styling với Bootstrap classes

### Tailwind CSS
- Kết hợp Tailwind với AdminLTE
- Custom styling khi cần

### Loading States
- Hiển thị spinner khi đang load data
- Disable buttons khi đang submit form

### Error Handling
- Hiển thị error messages
- Toast notifications (có thể thêm sau)

## Environment Variables

File `.env`:

```env
VITE_API_URL=http://localhost:3001/api
```

## Development

### Chạy development server
```bash
npm run dev
```

Server chạy tại: `http://localhost:3002`

### Build production
```bash
npm run build
```

Output: `dist/` folder

### Preview production build
```bash
npm run preview
```

## Docker

### Dockerfile
- Base image: `node:18-alpine`
- Build với Vite
- Serve với Nginx

### Nginx Configuration
- Serve static files từ `dist/`
- Fallback về `index.html` cho client-side routing

## File Upload

- Sử dụng FormData để upload files
- Endpoint: `POST /api/upload`
- Hiển thị preview trước khi upload
- Validate file type và size

## Permissions System

Admin có thể có permissions chi tiết:
```typescript
{
  topics: boolean,
  vocabularies: boolean,
  home: boolean,
  users: boolean
}
```

Menu items chỉ hiển thị nếu user có permission tương ứng.

## Best Practices

1. **TypeScript**: Sử dụng types cho props, state
2. **Error Handling**: Try-catch cho tất cả API calls
3. **Loading States**: Hiển thị feedback khi đang xử lý
4. **Form Validation**: Validate trước khi submit
5. **Reusable Components**: Tách component khi có thể tái sử dụng

## Mở rộng

Để thêm tính năng mới:
1. Tạo page component trong `pages/`
2. Thêm route trong `App.tsx`
3. Thêm menu item trong `Layout.tsx` (nếu cần)
4. Tạo API calls trong page component
5. Cập nhật permissions nếu cần

## Troubleshooting

### Không đăng nhập được
- Kiểm tra `VITE_API_URL` trong `.env`
- Kiểm tra backend có chạy không
- Kiểm tra CORS configuration ở backend

### Menu không hiển thị
- Kiểm tra user có role admin không
- Kiểm tra permissions trong user object
- Kiểm tra AdminLTE JS đã load chưa

### API calls fail
- Kiểm tra network tab trong DevTools
- Kiểm tra token có hợp lệ không
- Kiểm tra backend logs
