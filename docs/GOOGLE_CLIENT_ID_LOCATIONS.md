# Vị trí GOOGLE_CLIENT_ID được set

Tài liệu này liệt kê tất cả các nơi mà `GOOGLE_CLIENT_ID` và `VITE_GOOGLE_CLIENT_ID` được sử dụng trong project.

## 📋 Tổng quan

Có **2 biến môi trường** liên quan đến Google OAuth:
- `GOOGLE_CLIENT_ID`: Dùng cho **backend** để verify Google token
- `VITE_GOOGLE_CLIENT_ID`: Dùng cho **frontend** (web) để khởi tạo Google Sign In

**⚠️ QUAN TRỌNG:** Cả 2 biến này **PHẢI CÓ CÙNG GIÁ TRỊ** (cùng một Google Client ID).

---

## 1️⃣ File `.env` (Root directory)

Đây là nơi chính để set các biến môi trường:

```bash
GOOGLE_CLIENT_ID=483760897478-nucm22cetrq7umdbofh7rqjvj6dueof9.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_ID=483760897478-nucm22cetrq7umdbofh7rqjvj6dueof9.apps.googleusercontent.com
```

**Lưu ý:** File `.env` không được commit vào git (nằm trong `.gitignore`).

---

## 2️⃣ Docker Compose Files

### `docker-compose.yml` (Production)

**Backend service:**
```yaml
backend:
  environment:
    GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID:-}  # Lấy từ .env
```

**Web service:**
```yaml
web:
  build:
    args:
      - VITE_GOOGLE_CLIENT_ID=${VITE_GOOGLE_CLIENT_ID:-}  # Lấy từ .env
```

### `docker-compose.dev.yml` (Development)

**Backend service:**
```yaml
backend:
  environment:
    GOOGLE_CLIENT_ID: 483760897478-nucm22cetrq7umdbofh7rqjvj6dueof9.apps.googleusercontent.com  # Hardcoded
```

**Web service:**
```yaml
web:
  environment:
    VITE_GOOGLE_CLIENT_ID: 483760897478-nucm22cetrq7umdbofh7rqjvj6dueof9.apps.googleusercontent.com  # Hardcoded
```

---

## 3️⃣ Build Scripts

Các script này sẽ hỏi và set vào `.env`:

### `build-prod.sh`
```bash
read -p "Google OAuth Client ID (optional, Enter to skip): " GOOGLE_CLIENT_ID
# Sau đó ghi vào .env:
echo "GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}" >> .env
echo "VITE_GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}" >> .env
```

### `build-dev.sh`
Tương tự như `build-prod.sh`

### `devops/setup-prod.sh`
Tương tự như `build-prod.sh`

### `install.sh`
Tương tự như `build-prod.sh`

---

## 4️⃣ Backend Code

### `backend/src/services/AuthService.js`

```javascript
import { OAuth2Client } from 'google-auth-library';

// Khởi tạo OAuth2Client với GOOGLE_CLIENT_ID từ .env
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Verify token với cùng Client ID
const ticket = await client.verifyIdToken({
  idToken,
  audience: process.env.GOOGLE_CLIENT_ID,  // Phải khớp với Client ID dùng ở frontend
});
```

**Lưu ý:** Backend đọc từ `process.env.GOOGLE_CLIENT_ID`, được truyền vào từ Docker Compose.

---

## 5️⃣ Frontend Code (Web)

### `web/src/pages/Login.tsx`
```typescript
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
// Sử dụng để khởi tạo Google Sign In button
```

### `web/src/components/LoginModal.tsx`
```typescript
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
// Sử dụng để khởi tạo Google Sign In button
```

**Lưu ý:** Frontend đọc từ `import.meta.env.VITE_GOOGLE_CLIENT_ID`, được build vào bundle khi build Docker image.

---

## 6️⃣ Dockerfile (Web)

### `web/Dockerfile`

```dockerfile
ARG VITE_GOOGLE_CLIENT_ID
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
```

**Lưu ý:** 
- `ARG` nhận giá trị từ Docker Compose build args
- `ENV` set biến môi trường trong container
- Vite sẽ đọc `VITE_GOOGLE_CLIENT_ID` và build vào bundle khi `npm run build`

---

## 7️⃣ Scripts khác

### `scripts/fix_db/fix-google-oauth.sh`
Script kiểm tra và fix Client ID:
- Kiểm tra `GOOGLE_CLIENT_ID` và `VITE_GOOGLE_CLIENT_ID` có khớp không
- Tự động sửa nếu không khớp

---

## 🔄 Flow hoạt động

### Production (docker-compose.yml):

1. **Set trong `.env`:**
   ```bash
   GOOGLE_CLIENT_ID=xxx
   VITE_GOOGLE_CLIENT_ID=xxx
   ```

2. **Docker Compose đọc từ `.env`:**
   - Backend: `GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID:-}`
   - Web build: `VITE_GOOGLE_CLIENT_ID=${VITE_GOOGLE_CLIENT_ID:-}`

3. **Backend runtime:**
   - Đọc `process.env.GOOGLE_CLIENT_ID` từ container environment

4. **Frontend build:**
   - Dockerfile nhận `ARG VITE_GOOGLE_CLIENT_ID`
   - Vite build bundle với giá trị này
   - Runtime đọc từ `import.meta.env.VITE_GOOGLE_CLIENT_ID`

### Development (docker-compose.dev.yml):

- Hardcoded trong file (không cần `.env`)
- Hoặc có thể override bằng `.env` nếu thêm `${GOOGLE_CLIENT_ID:-}`

---

## ✅ Checklist khi setup

- [ ] Set `GOOGLE_CLIENT_ID` trong `.env`
- [ ] Set `VITE_GOOGLE_CLIENT_ID` trong `.env` (cùng giá trị)
- [ ] Rebuild backend: `docker-compose build backend`
- [ ] Rebuild web: `docker-compose build web`
- [ ] Restart containers: `docker-compose up -d`
- [ ] Verify: Chạy `bash scripts/fix_db/fix-google-oauth.sh` để kiểm tra

---

## 🐛 Troubleshooting

### Lỗi: "Wrong recipient, payload audience != requiredAudience"

**Nguyên nhân:** `GOOGLE_CLIENT_ID` (backend) và `VITE_GOOGLE_CLIENT_ID` (frontend) không khớp.

**Fix:**
```bash
# 1. Kiểm tra
cat .env | grep GOOGLE_CLIENT_ID

# 2. Đảm bảo cả 2 có cùng giá trị
# 3. Rebuild cả backend và web
docker-compose build backend web
docker-compose up -d backend web
```

### Lỗi: Frontend không có Google Sign In button

**Nguyên nhân:** `VITE_GOOGLE_CLIENT_ID` không được build vào bundle.

**Fix:**
```bash
# Rebuild web với đúng environment variable
docker-compose build --no-cache web
docker-compose up -d web
```

---

## 📚 Xem thêm

- [GOOGLE_OAUTH_SETUP.md](GOOGLE_OAUTH_SETUP.md) - Hướng dẫn setup Google OAuth
- [scripts/fix_db/fix-google-oauth.sh](../scripts/fix_db/fix-google-oauth.sh) - Script kiểm tra và fix
