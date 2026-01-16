    # Hướng Dẫn Cấu Hình Google OAuth

## Vấn Đề: Lỗi 403 - Origin Not Allowed

Nếu bạn gặp lỗi:
```
[GSI_LOGGER]: The given origin is not allowed for the given client ID.
```

Điều này có nghĩa là domain/origin hiện tại chưa được thêm vào Google OAuth config.

## Cách Khắc Phục

### Bước 1: Truy Cập Google Cloud Console

1. Mở trình duyệt và truy cập: https://console.cloud.google.com/
2. Đăng nhập bằng tài khoản Google của bạn
3. Chọn project: **goozi-484104**

### Bước 2: Vào OAuth 2.0 Client IDs

1. Trong menu bên trái, chọn **APIs & Services** → **Credentials**
2. Tìm OAuth 2.0 Client ID có tên hoặc ID: `483760897478-nucm22cetrq7umdbofh7rqjvj6dueof9.apps.googleusercontent.com`
3. Click vào Client ID đó để chỉnh sửa

### Bước 3: Thêm Authorized JavaScript Origins

1. Trong phần **Authorized JavaScript origins**, click nút **+ ADD URI**
2. Thêm các origins sau:
   - `http://localhost:3000` (development)
   - `http://127.0.0.1:3000` (development)
   - `https://web.goozi.org` (production - nếu đã setup HTTPS)
   - `https://cms.goozi.org` (production - nếu đã setup HTTPS)
   - `http://web.goozi.org` (production - nếu chưa có HTTPS)
   - `http://cms.goozi.org` (production - nếu chưa có HTTPS)

3. **Lưu ý quan trọng**:
   - Không thêm dấu `/` ở cuối (ví dụ: `http://localhost:3000/` là SAI)
   - Phải đúng format: `http://` hoặc `https://` + domain + port (nếu có)

### Bước 4: Kiểm Tra Authorized Redirect URIs

Với Google Identity Services (GSI), bạn **KHÔNG CẦN** thêm Authorized redirect URIs. 
Tuy nhiên, nếu có phần này, có thể để trống hoặc thêm:
- `http://localhost:3000`
- `http://127.0.0.1:3000`

### Bước 5: Lưu và Đợi

1. Click nút **SAVE** ở cuối trang
2. Đợi 2-5 phút để Google cập nhật cấu hình
3. **Hard refresh** trình duyệt: `Ctrl + Shift + R` (Windows) hoặc `Cmd + Shift + R` (Mac)

### Bước 6: Kiểm Tra Lại

1. Mở trang Login: `http://localhost:3000/login`
2. Mở Developer Console (F12)
3. Kiểm tra xem còn lỗi 403 không
4. Nút Google Sign In sẽ hiển thị và hoạt động bình thường

## Cấu Hình Hiện Tại

- **Client ID**: `483760897478-nucm22cetrq7umdbofh7rqjvj6dueof9.apps.googleusercontent.com`
- **Project ID**: `goozi-484104`
- **Authorized JavaScript origins cần có**:
  - `http://localhost:3000`
  - `http://127.0.0.1:3000`

## Troubleshooting

### ⚠️ Vẫn gặp lỗi 403 sau khi thêm origin? (Origin đã được thêm đúng)

Nếu bạn đã thêm origin `http://localhost:3000` vào Google Cloud Console nhưng vẫn gặp lỗi 403, thử các bước sau:

1. **Xác nhận đã SAVE trong Google Cloud Console**:
   - Vào lại OAuth 2.0 Client ID
   - Xác nhận origin `http://localhost:3000` đã có trong danh sách
   - **QUAN TRỌNG**: Phải click nút **SAVE** ở cuối trang (không chỉ thêm vào input)
   - Đảm bảo không có dấu `/` ở cuối
   - Sau khi SAVE, đợi ít nhất 5-10 phút

2. **Kiểm tra OAuth Consent Screen**:
   - Vào **APIs & Services** → **OAuth consent screen**
   - Đảm bảo đã cấu hình ít nhất:
     - User Type (Internal hoặc External)
     - App name
     - User support email
     - Developer contact information
   - Click **SAVE AND CONTINUE** qua các bước
   - Quay lại **Credentials** và kiểm tra lại Client ID

3. **Thử dùng Incognito/Private mode**:
   - Chrome: `Ctrl + Shift + N`
   - Firefox: `Ctrl + Shift + P`
   - Edge: `Ctrl + Shift + N`
   - Truy cập `http://localhost:3000/login` trong incognito mode
   - Xem còn lỗi 403 không

4. **Kiểm tra origin thực tế đang được sử dụng**:
   - Mở Developer Console (F12)
   - Vào tab Network
   - Tìm request đến `accounts.google.com` hoặc `gsi/client`
   - Xem Request Headers → Origin hoặc Referer
   - Đảm bảo origin này đã được thêm vào Google Cloud Console

5. **Thử các origins khác**:
   - `http://localhost:3000` (chính xác với port)
   - `http://127.0.0.1:3000`
   - `http://localhost` (không có port - nếu cần)
   - Nếu chạy qua Docker, có thể cần thêm IP của container

6. **Xóa cache và thử lại**:
   - Chrome: `Ctrl + Shift + Delete` → Clear browsing data → Cached images and files
   - Hoặc dùng **Incognito mode** (Ctrl + Shift + N) để test
   - Hard refresh: `Ctrl + Shift + R`

7. **Đợi lâu hơn**: 
   - Google có thể cần 5-15 phút để cập nhật
   - Đôi khi cần đợi đến 30 phút

8. **Kiểm tra Client ID**:
   - Đảm bảo Client ID trong `.env` file khớp với Client ID trong Google Cloud Console
   - Không có khoảng trắng thừa hoặc ký tự lạ

9. **Thử tạo Client ID mới** (nếu vẫn không được):
   - Tạo OAuth 2.0 Client ID mới
   - Thêm origins ngay từ đầu
   - Cập nhật Client ID mới vào `.env` file
   - Restart web container

### Lỗi khác?

- **"Invalid client ID"**: Kiểm tra lại Client ID trong file `.env`
- **"Script failed to load"**: Kiểm tra kết nối internet và firewall
- **Button không hiển thị**: Kiểm tra console logs để xem có lỗi gì

## Tài Liệu Tham Khảo

- [Google Identity Services Documentation](https://developers.google.com/identity/gsi/web)
- [Google OAuth 2.0 Setup Guide](https://developers.google.com/identity/protocols/oauth2/javascript-implicit-flow)
