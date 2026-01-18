# FastAccounting API Documentation

Thư mục này chứa tài liệu cho FastAccounting API backend.

## Tài liệu có sẵn

1. **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - Tài liệu đầy đủ cho tất cả API endpoints
2. **[CODE_QUALITY_REPORT.md](./CODE_QUALITY_REPORT.md)** - Báo cáo đánh giá chất lượng code

## Cấu trúc API

```
/api
├── /auth          - Authentication (login, register, me)
├── /customers     - Quản lý khách hàng
├── /transactions  - Quản lý giao dịch
├── /interest-configs - Cấu hình lãi suất
├── /reports       - Báo cáo và PDF
├── /users         - Quản lý người dùng (ADMIN only)
├── /info          - Thông tin ứng dụng
└── /backup        - Backup/restore dữ liệu (ADMIN only)
```

## Quick Start

### Authentication

1. **Login:**
```bash
POST /api/auth/login
{
  "username": "admin",
  "password": "password"
}
```

2. **Sử dụng token:**
```bash
GET /api/customers
Authorization: Bearer <JWT_TOKEN>
```

### Example Requests

**Tạo khách hàng:**
```bash
POST /api/customers
Content-Type: application/json

{
  "name": "Nguyễn Văn A",
  "contact_info": "SĐT: 0123456789"
}
```

**Tạo giao dịch:**
```bash
POST /api/transactions
Content-Type: application/json

{
  "customer_id": "KH001",
  "type": "TIEN_MAT",
  "amount": 1000000,
  "content": "Vay tiền mặt",
  "transaction_date": "2025-01-01"
}
```

## Environment Variables

```env
# Database
MONGODB_URI=mongodb://localhost:27017/fastaccounting

# JWT
JWT_SECRET=your-secret-key

# CORS
CORS_ORIGIN=http://localhost:5173,https://appassets.androidplatform.net

# Google Drive (optional)
DRIVE_TRANSACTION_IMAGES_FOLDER_ID=...
DRIVE_OAUTH_CLIENT_ID=...
DRIVE_OAUTH_CLIENT_SECRET=...
DRIVE_OAUTH_REFRESH_TOKEN=...
```

## Error Codes

| Status Code | Mô tả |
|------------|-------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Dữ liệu không hợp lệ |
| 401 | Unauthorized - Chưa đăng nhập hoặc token không hợp lệ |
| 403 | Forbidden - Không có quyền (không phải ADMIN) |
| 404 | Not Found - Resource không tồn tại |
| 500 | Internal Server Error - Lỗi server |

## Security Notes

- Tất cả endpoints (trừ `/auth/login`, `/auth/register`) yêu cầu JWT token
- Các thao tác xóa dữ liệu yêu cầu ADMIN role + PIN verification
- Passwords được hash bằng bcrypt
- PIN được hash riêng biệt

## Development

```bash
cd api
npm install
npm start
```

Server chạy trên `http://localhost:3000`

## Production Deployment

API được deploy trên Vercel (serverless).

- Database connection: Lazy per request
- File system: Read-only (không thể ghi app_info.json)
- Environment variables: Cấu hình trên Vercel dashboard

## Support

Xem [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) để biết chi tiết về từng endpoint.
