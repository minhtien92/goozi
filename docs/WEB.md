# Tài liệu Web - Goozi

## Tổng quan

Web application của Goozi là ứng dụng frontend dành cho người dùng cuối, được xây dựng bằng **React** và **TypeScript**. Người dùng có thể đăng ký, đăng nhập, xem các chủ đề học, và học từ vựng bằng flashcard.

## Công nghệ sử dụng

- **Framework**: React 18.2.0
- **Language**: TypeScript 5.2.2
- **Build Tool**: Vite 5.1.4
- **Routing**: React Router DOM 6.22.0
- **HTTP Client**: Axios 1.6.7
- **State Management**: Zustand 4.5.0
- **Styling**: Tailwind CSS 3.4.1

## Cấu trúc thư mục

```
web/
├── src/
│   ├── components/
│   │   ├── Layout.tsx              # Layout chính
│   │   ├── LanguageSelector.tsx    # Component chọn ngôn ngữ
│   │   └── UserMenu.tsx            # Menu user (profile, logout)
│   ├── config/
│   │   └── api.ts                  # Cấu hình Axios instance
│   ├── pages/
│   │   ├── Login.tsx               # Trang đăng nhập
│   │   ├── Register.tsx            # Trang đăng ký
│   │   ├── Home.tsx                # Trang chủ
│   │   ├── Topics.tsx              # Danh sách chủ đề
│   │   ├── TopicDetail.tsx         # Chi tiết chủ đề và từ vựng
│   │   └── Flashcard.tsx           # Học với flashcard
│   ├── store/
│   │   └── authStore.ts            # Zustand store cho authentication
│   ├── App.tsx                     # Component chính, routing
│   ├── main.tsx                    # Entry point
│   └── index.css                   # Global styles với Tailwind
├── index.html
├── vite.config.ts
├── tailwind.config.js
└── package.json
```

## Tính năng chính

### 1. Authentication
- **Đăng ký**: Tạo tài khoản mới với email, password, tên
- **Đăng nhập**: Đăng nhập với email/password
- **JWT Authentication**: Lưu token trong localStorage
- **Auto redirect**: Tự động chuyển hướng nếu chưa đăng nhập
- **Persistent session**: Giữ đăng nhập khi reload page

### 2. Home Page (`/`)
- Hiển thị nội dung trang chủ:
  - Slogan (theo ngôn ngữ đã chọn)
  - Hình ảnh trang chủ
  - Testimonials
- Language selector để chọn ngôn ngữ hiển thị
- Navigation đến các phần khác

### 3. Topics Page (`/topics`)
- Xem danh sách tất cả chủ đề học
- Hiển thị theo ngôn ngữ đã chọn
- Click vào topic để xem chi tiết
- Design overlay trên Home page background

### 4. Topic Detail Page (`/topics/:id`)
- Hiển thị chi tiết chủ đề:
  - Tên chủ đề
  - Mô tả
  - Danh sách từ vựng trong chủ đề
- Mỗi từ vựng hiển thị:
  - Từ gốc
  - Bản dịch (theo ngôn ngữ đã chọn)
  - Hình ảnh (nếu có)
  - Phát âm (phonetic)
- Nút "Học với Flashcard" để bắt đầu học
- Design overlay trên Home page background

### 5. Flashcard Page (`/topics/:id/flashcard`)
- **Flashcard learning mode**:
  - Hiển thị từ vựng dạng card
  - Flip card để xem nghĩa/phát âm
  - Navigation giữa các card (Previous/Next)
  - Progress indicator
- **Text-to-Speech**:
  - Phát âm từ vựng khi click
  - Sử dụng Web Speech API
- **Card features**:
  - Mặt trước: Từ gốc, hình ảnh
  - Mặt sau: Bản dịch, phiên âm
  - Animation khi flip
- Design overlay trên Home page background

### 6. Language Selection
- Chọn ngôn ngữ hiển thị (vi, en, ja, ...)
- Lưu preference trong localStorage
- Ảnh hưởng đến:
  - Nội dung trang chủ (slogan, testimonials)
  - Tên và mô tả chủ đề
  - Bản dịch từ vựng

### 7. User Menu
- Hiển thị thông tin user
- Dropdown menu:
  - Profile
  - Logout
- Hiển thị ở header/navbar

## Routing

### Public Routes
- `/login` - Trang đăng nhập
- `/register` - Trang đăng ký

### Protected Routes (Yêu cầu đăng nhập)
- `/` - Home page
- `/topics` - Danh sách chủ đề
- `/topics/:id` - Chi tiết chủ đề
- `/topics/:id/flashcard` - Học với flashcard

### Route Guards
- `PrivateRoute` component kiểm tra `isAuthenticated`
- Tự động redirect về `/login` nếu chưa đăng nhập

## Components

### Layout Component
Component chính với:
- **Header/Navbar**: 
  - Logo
  - Language selector
  - User menu
  - Navigation links
- **Background handling**:
  - Home page hiển thị full background
  - Topics/Detail/Flashcard pages hiển thị overlay trên Home background (blur effect)
  - Tạo hiệu ứng overlay mượt mà

### LanguageSelector Component
- Dropdown để chọn ngôn ngữ
- Load danh sách ngôn ngữ từ API
- Hiển thị flag/icon nếu có
- Lưu selection vào localStorage

### UserMenu Component
- Avatar hoặc icon user
- Dropdown menu:
  - User info
  - Logout button
- Chỉ hiển thị khi đã đăng nhập

## State Management (Zustand)

### authStore
Store quản lý authentication:

```typescript
{
  user: User | null,
  token: string | null,
  login: (email, password) => Promise<void>,
  register: (email, password, name) => Promise<void>,
  logout: () => void,
  isAuthenticated: () => boolean,
  setUser: (user) => void,
  setToken: (token) => void
}
```

**Persistence:**
- Token và user info lưu trong `localStorage`
- Tự động restore khi app khởi động

## API Integration

### Axios Configuration (`config/api.ts`)
- Base URL: `VITE_API_URL`
- Interceptor để thêm JWT token
- Error handling:
  - 401 → logout và redirect to login
  - Hiển thị error messages

### API Endpoints sử dụng:

#### Authentication
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

#### Topics
- `GET /api/topics?language=vi`
- `GET /api/topics/:id?language=vi`

#### Vocabularies
- `GET /api/vocabularies?topicId=xxx&language=vi`

#### Home Settings
- `GET /api/home-settings?key=slogan&languageId=xxx`
- `GET /api/home-settings?key=picture&languageId=xxx`

#### Testimonials
- `GET /api/testimonials?languageId=xxx`

#### Languages
- `GET /api/languages`

## UI/UX Features

### Design System
- **Tailwind CSS**: Utility-first CSS framework
- **Gradient backgrounds**: Modern gradient designs
- **Card-based UI**: Clean card layouts
- **Responsive**: Mobile-first approach

### Visual Effects
- **Blur overlay**: Topics pages hiển thị trên blurred Home background
- **Card flip animation**: Smooth flip animation cho flashcard
- **Transitions**: Smooth transitions giữa các pages
- **Loading states**: Spinners và skeleton screens

### Flashcard Features
- **Flip animation**: CSS 3D transform để flip card
- **Progress tracking**: Hiển thị tiến độ học
- **Navigation**: Previous/Next buttons
- **Speech synthesis**: Web Speech API để phát âm

### Text-to-Speech
Sử dụng Web Speech API:

```typescript
const speak = (text: string, language: string) => {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = language; // e.g., 'en-US', 'vi-VN'
  window.speechSynthesis.speak(utterance);
};
```

## Environment Variables

File `.env`:

```env
VITE_API_URL=http://localhost:3001/api
```

## Pages chi tiết

### Home Page
- Fetch và hiển thị:
  - Slogan (theo ngôn ngữ đã chọn)
  - Picture (hình ảnh trang chủ)
  - Testimonials (đánh giá từ users)
- Language selector
- Call-to-action buttons (Xem chủ đề, Đăng ký, ...)

### Topics Page
- Fetch danh sách topics với translations
- Hiển thị dạng grid/list
- Click để navigate đến detail
- Background overlay effect

### Topic Detail Page
- Fetch topic detail với vocabularies
- Hiển thị danh sách từ vựng
- Each vocabulary card hiển thị:
  - Word (từ gốc)
  - Translation (bản dịch)
  - Image (nếu có)
  - Phonetic (nếu có)
- Button "Học với Flashcard"

### Flashcard Page
- Fetch vocabularies của topic
- Hiển thị flashcard:
  - Front: Word + Image
  - Back: Translation + Phonetic
- Controls:
  - Flip button
  - Previous/Next
  - Speak button (TTS)
- Progress indicator (1/10, 2/10, ...)

## Development

### Chạy development server
```bash
npm run dev
```

Server chạy tại: `http://localhost:3000`

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
- Cấu hình cache headers

## Responsive Design

- **Mobile-first**: Tối ưu cho mobile
- **Breakpoints**: Sử dụng Tailwind breakpoints
- **Touch-friendly**: Buttons và controls dễ touch
- **Adaptive layout**: Layout thay đổi theo screen size

## Accessibility

- Semantic HTML
- ARIA labels khi cần
- Keyboard navigation
- Focus management

## Performance Optimization

1. **Code splitting**: Vite tự động split code
2. **Lazy loading**: Có thể lazy load routes
3. **Image optimization**: Optimize images
4. **API caching**: Cache API responses khi có thể

## Best Practices

1. **TypeScript**: Strict type checking
2. **Component reusability**: Tách component reusable
3. **Error boundaries**: Xử lý lỗi gracefully
4. **Loading states**: Hiển thị feedback khi loading
5. **Form validation**: Validate forms trước khi submit
6. **Clean code**: Code dễ đọc, dễ maintain

## User Flow

### Đăng ký/Đăng nhập
1. User vào `/register` hoặc `/login`
2. Nhập thông tin và submit
3. Nhận token từ API
4. Lưu token và user info
5. Redirect đến Home page

### Học từ vựng
1. User xem danh sách Topics
2. Chọn một Topic
3. Xem danh sách từ vựng trong Topic
4. Click "Học với Flashcard"
5. Học từng từ bằng flashcard
6. Sử dụng TTS để nghe phát âm

### Chọn ngôn ngữ
1. User click Language selector
2. Chọn ngôn ngữ mong muốn
3. Lưu vào localStorage
4. Reload nội dung theo ngôn ngữ mới

## Mở rộng

### Tính năng có thể thêm:
1. **Progress tracking**: Lưu tiến độ học
2. **Quiz mode**: Làm bài quiz từ vựng
3. **Favorites**: Đánh dấu từ vựng yêu thích
4. **Statistics**: Thống kê số từ đã học
5. **Gamification**: Điểm số, badges
6. **Social features**: Chia sẻ tiến độ
7. **Offline mode**: Học offline với Service Worker

### Để thêm tính năng mới:
1. Tạo page component trong `pages/`
2. Thêm route trong `App.tsx`
3. Tạo API calls nếu cần
4. Update navigation trong Layout
5. Add state management nếu cần

## Troubleshooting

### Không đăng nhập được
- Kiểm tra `VITE_API_URL`
- Kiểm tra backend có chạy không
- Kiểm tra network requests trong DevTools

### Flashcard không flip
- Kiểm tra CSS transform support
- Kiểm tra browser compatibility

### TTS không hoạt động
- Kiểm tra browser support (Chrome, Edge OK)
- Kiểm tra language code format
- Có thể cần HTTPS trong production

### Language không thay đổi
- Kiểm tra API có trả về translations không
- Kiểm tra languageId trong requests
- Kiểm tra localStorage có lưu không
