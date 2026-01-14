# Goozi Project Template Guide

## Tổng Quan

Goozi project có thể được sử dụng như một template để tạo các project mới nhanh chóng. Script template generator sẽ copy toàn bộ project và thay thế các placeholders với tên project mới.

## Cách Sử Dụng

### Linux/Mac

```bash
# Cấp quyền thực thi (chỉ cần chạy 1 lần)
chmod +x create-project.sh

# Tạo project mới
./create-project.sh [project-name] [target-directory]

# Ví dụ:
./create-project.sh myapp ../myapp
./create-project.sh language-learning
```

### Windows

```cmd
# Tạo project mới
create-project.bat [project-name] [target-directory]

# Ví dụ:
create-project.bat myapp ..\myapp
create-project.bat language-learning
```

## Quy Trình

### 1. Chạy Script

Script sẽ:
- Prompt bạn nhập project name (nếu không cung cấp)
- Prompt bạn nhập target directory (nếu không cung cấp)
- Validate project name
- Kiểm tra target directory có tồn tại không

### 2. Copy Files

Script sẽ copy toàn bộ project, **trừ**:
- `node_modules/` - Dependencies (sẽ được install lại)
- `.git/` - Git repository (sẽ tạo mới)
- `.env` và `.env.*` - Environment files (sẽ tạo mới)
- `dist/` và `build/` - Build outputs
- `uploads/*` - Uploaded files
- `*.log` - Log files
- `.cache/` - Cache directories
- `coverage/` - Test coverage
- `.nyc_output/` - Test output

### 3. Replace Placeholders

Script sẽ thay thế các placeholders sau trong tất cả files:

| Placeholder | Replacement | Example |
|------------|-------------|---------|
| `goozi` | project name (lowercase) | `myapp` |
| `Goozi` | project name (capitalized) | `Myapp` |
| `GOOZI` | project name (uppercase) | `MYAPP` |
| `goozi_db` | project_name_db | `myapp_db` |
| `goozi-network` | project-name-network | `myapp-network` |
| `goozi-postgres` | project-name-postgres | `myapp-postgres` |
| `goozi-backend` | project-name-backend | `myapp-backend` |
| `goozi-web` | project-name-web | `myapp-web` |
| `goozi-cms` | project-name-cms | `myapp-cms` |

### 4. Initialize Git

Script sẽ:
- Xóa `.git` directory cũ (nếu có)
- Initialize git repository mới
- Add tất cả files
- Tạo initial commit

## Files Được Thay Thế

Các file types sau sẽ được scan và replace:
- `*.js` - JavaScript files
- `*.ts` - TypeScript files
- `*.tsx` - TypeScript React files
- `*.json` - JSON files
- `*.yml`, `*.yaml` - YAML files
- `*.md` - Markdown files
- `*.sh` - Shell scripts
- `*.bat` - Batch scripts
- `*.html` - HTML files
- `*.css` - CSS files
- `Dockerfile*` - Dockerfiles
- `nginx.conf` - Nginx config

## Ví Dụ

### Tạo Project "myapp"

```bash
./create-project.sh myapp ../myapp
```

**Kết quả:**
- Project name: `myapp`
- Database name: `myapp_db`
- Container names: `myapp-postgres`, `myapp-backend`, `myapp-web`, `myapp-cms`
- Network name: `myapp-network`
- Package names: `myapp-backend`, `myapp-web`, `myapp-cms`

### Tạo Project "language-learning"

```bash
./create-project.sh language-learning
```

**Kết quả:**
- Project name: `language-learning`
- Database name: `language-learning_db`
- Container names: `language-learning-postgres`, etc.

## Sau Khi Tạo Project

### 1. Navigate to Project

```bash
cd ../myapp  # hoặc target directory bạn đã chọn
```

### 2. Install Dependencies

**Linux/Mac:**
```bash
./install.sh
```

**Windows:**
```cmd
install.bat
```

### 3. Start Development

Script install sẽ tự động:
- Build Docker containers
- Run database migrations
- Start all services

### 4. Customize Project

Sau khi project được tạo, bạn có thể:
- Update README.md với mô tả project mới
- Update package.json với thông tin author
- Customize logo và branding
- Thêm/tùy chỉnh features

## Customization

### Thêm Placeholders Mới

Nếu bạn muốn thêm placeholders mới, edit `create-project.sh` hoặc `create-project.bat`:

**Linux/Mac (`create-project.sh`):**
```bash
# Thêm vào function replace_in_file()
sed -i '' "s/OLD_VALUE/NEW_VALUE/g" "$file"
```

**Windows (`create-project.bat`):**
```cmd
REM Thêm vào PowerShell command
$content = $content -replace 'OLD_VALUE', 'NEW_VALUE'
```

### Exclude Files/Directories

Để exclude thêm files/directories, edit script:

**Linux/Mac:**
```bash
rsync -av \
    --exclude='new-exclude-pattern' \
    ...
```

**Windows:**
```cmd
robocopy ... /XD new-exclude-pattern ...
```

## Troubleshooting

### Lỗi "Permission denied" (Linux/Mac)

```bash
chmod +x create-project.sh
```

### Lỗi "Target directory already exists"

Script sẽ hỏi bạn có muốn xóa directory cũ không. Chọn `y` để tiếp tục.

### Lỗi "Invalid project name"

Project name phải:
- Không rỗng
- Chỉ chứa chữ cái, số, và dấu gạch ngang
- Không bắt đầu hoặc kết thúc bằng dấu gạch ngang

### Files không được replace

Đảm bảo file không nằm trong:
- `node_modules/`
- `.git/`
- `dist/` hoặc `build/`
- Các directory bị exclude

### Git không được initialize

Đảm bảo Git đã được cài đặt:
```bash
git --version
```

## Best Practices

1. **Test template trước**: Tạo một test project để đảm bảo mọi thứ hoạt động
2. **Backup template**: Giữ một bản backup của template gốc
3. **Version control**: Commit template vào git để track changes
4. **Documentation**: Update docs khi thêm features mới vào template
5. **Clean template**: Đảm bảo template không chứa:
   - Sensitive data (passwords, API keys)
   - User-specific configs
   - Test data
   - Build artifacts

## Advanced Usage

### Tạo Multiple Projects

```bash
# Tạo nhiều projects cùng lúc
for name in project1 project2 project3; do
    ./create-project.sh $name ../$name
done
```

### Custom Script

Bạn có thể tạo script wrapper để customize thêm:

```bash
#!/bin/bash
# my-create-project.sh

PROJECT_NAME=$1
TARGET_DIR=$2

# Run template generator
./create-project.sh $PROJECT_NAME $TARGET_DIR

# Custom steps
cd $TARGET_DIR
# Add custom files
# Run custom commands
# etc.
```

## Related Documentation

- [README.md](../README.md) - Project overview
- [INSTALL.md](../install.sh) - Installation guide
- [BACKEND.md](./BACKEND.md) - Backend documentation
- [WEB.md](./WEB.md) - Web documentation
- [CMS.md](./CMS.md) - CMS documentation
