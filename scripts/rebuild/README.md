# Rebuild Scripts

Thư mục chứa các script rebuild nội bộ.

## Cấu trúc

- `rebuild-service.sh` - Script nội bộ để rebuild một service cụ thể

## Sử dụng

**Không chạy trực tiếp các script trong thư mục này.**

Thay vào đó, sử dụng các script ở root:
- `rebuild-dev.sh` - Rebuild cho Development (interactive menu)
- `rebuild-prod.sh` - Rebuild cho Production (interactive menu)

## Ví dụ

```bash
# Development
./rebuild-dev.sh
# Chọn services: 1,2,3 hoặc a (all)

# Production
./rebuild-prod.sh
# Chọn services: 1,2 hoặc a (all)
```
