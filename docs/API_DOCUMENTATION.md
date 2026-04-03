# FastAccounting API Documentation

## Tổng quan

FastAccounting API là RESTful API backend cho hệ thống quản lý công nợ. API được xây dựng bằng Node.js/Express và MongoDB.

**Base URL:** `http://localhost:3000/api` (development) hoặc production URL

**Authentication:** JWT Token (Bearer Token)

---

## Mục lục

1. [Authentication](#authentication)
2. [Customers](#customers)
3. [Transactions](#transactions)
4. [Interest Configs](#interest-configs)
5. [Reports](#reports)
6. [Users](#users)
7. [Info](#info)
8. [Backup](#backup)

---

## Authentication

### POST /api/auth/register

Đăng ký user mới (thường chỉ dùng trong development).

**Request Body:**
```json
{
  "username": "string (required)",
  "password": "string (required)",
  "display_name": "string (optional)"
}
```

**Response:**
- `201 Created`: User đã được tạo
- `400 Bad Request`: Username đã tồn tại hoặc thiếu thông tin

**Example:**
```bash
POST /api/auth/register
Content-Type: application/json

{
  "username": "admin2",
  "password": "password123",
  "display_name": "Admin 2"
}
```

---

### POST /api/auth/login

Đăng nhập và nhận JWT token.

**Request Body:**
```json
{
  "username": "string (required)",
  "password": "string (required)"
}
```

**Response:**
```json
{
  "token": "JWT_TOKEN",
  "username": "admin",
  "display_name": "Admin",
  "role": "ADMIN"
}
```

**Status Codes:**
- `200 OK`: Đăng nhập thành công
- `400 Bad Request`: Thiếu username/password
- `401 Unauthorized`: Tên đăng nhập hoặc mật khẩu không đúng

**Example:**
```bash
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "password123"
}
```

---

### POST /api/auth/logout

Logout (client-side token removal, stateless).

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

**Note:** Với JWT, logout được xử lý ở client bằng cách xóa token.

---

### GET /api/auth/me

Lấy thông tin user hiện tại (protected route).

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response:**
```json
{
  "username": "admin",
  "display_name": "Admin",
  "role": "ADMIN"
}
```

**Status Codes:**
- `200 OK`: Thành công
- `401 Unauthorized`: Token không hợp lệ hoặc hết hạn
- `404 Not Found`: User không tồn tại

---

## Customers

### GET /api/customers

Lấy danh sách tất cả khách hàng với thông tin trạng thái và tổng nợ.

**Response:**
```json
[
  {
    "_id": "ObjectId",
    "id": "KH001",
    "name": "Nguyễn Văn A",
    "contact_info": "SĐT: 0123456789",
    "created_at": "2025-01-01T00:00:00.000Z",
    "is_paid_in_full": false,
    "has_history": true,
    "transaction_count": 5,
    "total_debt": 1500000.50
  }
]
```

**Status Codes:**
- `200 OK`: Thành công

**Note:** 
- `is_paid_in_full`: true nếu tất cả giao dịch đã được thanh toán
- `total_debt`: Tổng số nợ còn lại (principal + interest - collected)

---

### POST /api/customers

Tạo khách hàng mới.

**Request Body:**
```json
{
  "name": "string (required)",
  "contact_info": "string (optional)"
}
```

**Response:**
```json
{
  "_id": "ObjectId",
  "id": "KH001",
  "name": "Nguyễn Văn A",
  "contact_info": "SĐT: 0123456789",
  "created_at": "2025-01-01T00:00:00.000Z"
}
```

**Status Codes:**
- `201 Created`: Khách hàng đã được tạo
- `400 Bad Request`: Thiếu tên khách hàng
- `403 Forbidden`: Hệ thống đang ở chế độ read-only

---

### GET /api/customers/:id

Lấy thông tin chi tiết một khách hàng.

**Parameters:**
- `id`: Customer ID (KHxxx) hoặc MongoDB _id

**Response:**
```json
{
  "_id": "ObjectId",
  "id": "KH001",
  "name": "Nguyễn Văn A",
  "contact_info": "SĐT: 0123456789",
  "created_at": "2025-01-01T00:00:00.000Z"
}
```

**Status Codes:**
- `200 OK`: Thành công
- `404 Not Found`: Khách hàng không tồn tại

---

### PATCH /api/customers/:id

Cập nhật thông tin khách hàng.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Request Body:**
```json
{
  "name": "string (optional)",
  "contact_info": "string (optional)"
}
```

**Response:**
```json
{
  "_id": "ObjectId",
  "id": "KH001",
  "name": "Nguyễn Văn A (Updated)",
  "contact_info": "SĐT: 0987654321",
  "created_at": "2025-01-01T00:00:00.000Z"
}
```

**Status Codes:**
- `200 OK`: Cập nhật thành công
- `404 Not Found`: Khách hàng không tồn tại

---

### POST /api/customers/delete-secure

Xóa khách hàng và toàn bộ giao dịch liên quan (cascade delete). Yêu cầu ADMIN và PIN xác thực.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Request Body:**
```json
{
  "id": "KH001",
  "pin": "1234"
}
```

**Response:**
```json
{
  "message": "Đã xóa khách hàng và toàn bộ dữ liệu liên quan"
}
```

**Status Codes:**
- `200 OK`: Xóa thành công
- `401 Unauthorized`: Chưa đăng nhập
- `403 Forbidden`: Không phải ADMIN hoặc PIN sai
- `404 Not Found`: Khách hàng không tồn tại

**Warning:** Hành động này không thể hoàn tác!

---

## Transactions

### GET /api/transactions

Lấy danh sách giao dịch với filters và tính toán lãi suất.

**Query Parameters:**
- `customer_id` (optional): Lọc theo khách hàng
- `start_date` (optional): Ngày bắt đầu (ISO format)
- `end_date` (optional): Ngày kết thúc (ISO format)

**Response:**
```json
[
  {
    "_id": "GD001",
    "customer_id": "KH001",
    "customer_name": "Nguyễn Văn A",
    "type": "TIEN_MAT",
    "amount": 1000000,
    "content": "Vay tiền mặt",
    "transaction_date": "2025-01-01T00:00:00.000Z",
    "status": "OPEN",
    "interest_rate_snapshot": 2.5,
    "interest_calculation": {
      "months": 3.5,
      "rounded_interest": 87500,
      "total": 1087500
    }
  }
]
```

**Status Codes:**
- `200 OK`: Thành công

**Note:** 
- Giao dịch `OPEN`: `interest_calculation` được tính real-time
- Giao dịch `PAID`: `interest_calculation` lấy từ `final_interest` và `final_months`

---

### POST /api/transactions

Tạo giao dịch mới.

**Request Body:**
```json
{
  "customer_id": "KH001 (required)",
  "type": "TIEN_MAT (required)",
  "amount": 1000000 (required, number),
  "content": "string (required)",
  "transaction_date": "2025-01-01 (optional, ISO date string)"
}
```

**Response:**
```json
{
  "_id": "ObjectId",
  "id": "GD001",
  "customer_id": "KH001",
  "type": "TIEN_MAT",
  "amount": 1000000,
  "content": "Vay tiền mặt",
  "transaction_date": "2025-01-01T00:00:00.000Z",
  "status": "OPEN",
  "interest_rate_snapshot": 2.5
}
```

**Status Codes:**
- `201 Created`: Giao dịch đã được tạo
- `400 Bad Request`: Dữ liệu không hợp lệ
- `404 Not Found`: Customer hoặc transaction type không tồn tại

---

### PATCH /api/transactions/:id

Cập nhật giao dịch.

**Request Body:**
```json
{
  "customer_id": "string (optional)",
  "type": "string (optional)",
  "amount": "number (optional)",
  "content": "string (optional)",
  "transaction_date": "ISO date string (optional)",
  "status": "OPEN | PAID (optional)",
  "closed_at": "ISO date string (optional, required if status=PAID)"
}
```

**Response:**
```json
{
  "_id": "ObjectId",
  "id": "GD001",
  "customer_id": "KH001",
  "type": "TIEN_MAT",
  "amount": 1000000,
  "content": "Vay tiền mặt",
  "transaction_date": "2025-01-01T00:00:00.000Z",
  "status": "PAID",
  "closed_at": "2025-04-15T00:00:00.000Z",
  "final_interest": 87500,
  "final_months": 3.5,
  "final_total": 1087500
}
```

**Status Codes:**
- `200 OK`: Cập nhật thành công
- `400 Bad Request`: Dữ liệu không hợp lệ (ví dụ: closed_at < transaction_date)
- `404 Not Found`: Giao dịch không tồn tại

**Note:**
- Khi `status` = `PAID`, hệ thống tự động tính `final_interest`, `final_months`, `final_total`
- Nếu không cung cấp `closed_at`, mặc định dùng `new Date()`

---

### POST /api/transactions/bulk-pay

Thanh toán hàng loạt tất cả giao dịch OPEN của một khách hàng. Yêu cầu ADMIN và PIN.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Request Body:**
```json
{
  "customer_id": "KH001 (required)",
  "payment_date": "2025-04-15 (required, ISO date string)",
  "pin": "1234 (required)"
}
```

**Response:**
```json
{
  "message": "Đã thanh toán 5 giao dịch",
  "count": 5
}
```

**Status Codes:**
- `200 OK`: Thành công
- `400 Bad Request`: Dữ liệu không hợp lệ
- `401 Unauthorized`: Chưa đăng nhập
- `403 Forbidden`: Không phải ADMIN hoặc PIN sai

---

### POST /api/transactions/delete-secure

Xóa giao dịch. Yêu cầu ADMIN và PIN.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Request Body:**
```json
{
  "id": "GD001",
  "pin": "1234"
}
```

**Response:**
```json
{
  "message": "Đã xóa giao dịch"
}
```

**Status Codes:**
- `200 OK`: Xóa thành công
- `401 Unauthorized`: Chưa đăng nhập
- `403 Forbidden`: Không phải ADMIN hoặc PIN sai
- `404 Not Found`: Giao dịch không tồn tại

---

### POST /api/transactions/:id/image

Upload ảnh cho giao dịch (lưu trên Google Drive).

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: multipart/form-data
```

**Request:**
- `image`: File ảnh (max 5MB)

**Response:**
```json
{
  "ok": true,
  "image_drive_file_id": "drive_file_id",
  "image_mime_type": "image/jpeg",
  "image_original_name": "receipt.jpg",
  "image_uploaded_at": "2025-01-01T00:00:00.000Z"
}
```

**Status Codes:**
- `200 OK`: Upload thành công
- `400 Bad Request`: File không hợp lệ hoặc không phải ảnh
- `413 Payload Too Large`: File > 5MB
- `404 Not Found`: Giao dịch không tồn tại
- `502 Bad Gateway`: Lỗi Google Drive (quota, permissions)

---

### GET /api/transactions/:id/image

Lấy ảnh giao dịch từ Google Drive (stream).

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response:**
- `200 OK`: Stream ảnh (Content-Type: image/jpeg, image/png, etc.)
- `404 Not Found`: Giao dịch không có ảnh hoặc không tồn tại

**Example:**
```bash
GET /api/transactions/GD001/image
Authorization: Bearer <JWT_TOKEN>
```

---

### DELETE /api/transactions/:id/image

Xóa ảnh giao dịch (xóa trên Drive và xóa metadata trong DB).

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response:**
```json
{
  "ok": true,
  "removed": true,
  "drive_deleted": true
}
```

**Status Codes:**
- `200 OK`: Xóa thành công

---

### GET /api/transactions/drive-status

Kiểm tra cấu hình Google Drive (chỉ trả về boolean, không lộ secret).

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response:**
```json
{
  "drive_configured": true,
  "folderId_present": true,
  "oauth_client_id_present": true,
  "oauth_client_secret_present": true,
  "oauth_refresh_token_present": true
}
```

---

### GET /api/transactions/reports/monthly-count

Lấy số lượng giao dịch theo tháng trong năm.

**Query Parameters:**
- `year` (optional): Năm (default: năm hiện tại)

**Response:**
```json
[
  { "month": 1, "count": 5 },
  { "month": 2, "count": 8 },
  ...
]
```

---

### GET /api/transactions/reports/debt

Lấy báo cáo tổng hợp công nợ.

**Response:**
```json
{
  "total_customers": 10,
  "customers_with_debt": 5,
  "total_debt": 5000000.50,
  "total_principal": 4000000,
  "total_interest": 1000000.50
}
```

---

## Interest Configs

### GET /api/interest-configs

Lấy danh sách tất cả cấu hình lãi suất.

**Response:**
```json
[
  {
    "_id": "ObjectId",
    "code": "TIEN_MAT",
    "name": "Tiền Mặt",
    "rate_per_month": 2.5,
    "description": "Lãi suất cho vay tiền mặt"
  }
]
```

---

### POST /api/interest-configs

Tạo cấu hình lãi suất mới.

**Request Body:**
```json
{
  "code": "TIEN_MAT (required, unique)",
  "name": "Tiền Mặt (required)",
  "rate_per_month": 2.5 (required, number),
  "description": "string (optional)"
}
```

**Response:**
```json
{
  "_id": "ObjectId",
  "code": "TIEN_MAT",
  "name": "Tiền Mặt",
  "rate_per_month": 2.5,
  "description": "Lãi suất cho vay tiền mặt"
}
```

**Status Codes:**
- `201 Created`: Tạo thành công
- `400 Bad Request`: Code đã tồn tại hoặc thiếu thông tin

---

### GET /api/interest-configs/:code

Lấy thông tin một cấu hình lãi suất.

**Response:**
```json
{
  "_id": "ObjectId",
  "code": "TIEN_MAT",
  "name": "Tiền Mặt",
  "rate_per_month": 2.5,
  "description": "Lãi suất cho vay tiền mặt"
}
```

**Status Codes:**
- `200 OK`: Thành công
- `404 Not Found`: Cấu hình không tồn tại

---

### PATCH /api/interest-configs/:code

Cập nhật cấu hình lãi suất.

**Request Body:**
```json
{
  "name": "string (optional)",
  "rate_per_month": "number (optional)",
  "description": "string (optional)"
}
```

**Response:**
```json
{
  "_id": "ObjectId",
  "code": "TIEN_MAT",
  "name": "Tiền Mặt (Updated)",
  "rate_per_month": 3.0,
  "description": "Mô tả mới"
}
```

**Status Codes:**
- `200 OK`: Cập nhật thành công
- `404 Not Found`: Cấu hình không tồn tại

**Note:** `code` không thể thay đổi sau khi tạo.

---

### POST /api/interest-configs/delete-secure

Xóa cấu hình lãi suất. Yêu cầu ADMIN và PIN.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Request Body:**
```json
{
  "code": "TIEN_MAT",
  "pin": "1234"
}
```

**Response:**
```json
{
  "message": "Đã xóa cấu hình"
}
```

**Status Codes:**
- `200 OK`: Xóa thành công
- `401 Unauthorized`: Chưa đăng nhập
- `403 Forbidden`: Không phải ADMIN hoặc PIN sai
- `404 Not Found`: Cấu hình không tồn tại

---

## Reports

### GET /api/reports/:customer_id/pdf

Tạo PDF báo cáo công nợ cho một khách hàng.

**Query Parameters:**
- `start_date` (optional): Ngày bắt đầu (ISO format)
- `end_date` (optional): Ngày kết thúc (ISO format)

**Response:**
- `200 OK`: PDF file (Content-Type: application/pdf)
- `404 Not Found`: Khách hàng không tồn tại

**Example:**
```bash
GET /api/reports/KH001/pdf?start_date=2025-01-01&end_date=2025-12-31
```

**Download:** File được tải xuống với tên `Phieu_TTCN_<tên_khách_hàng>.pdf`

---

### POST /api/reports/batch-export

Xuất PDF hàng loạt cho tất cả khách hàng có nợ OPEN.

**Request Body:**
```json
{
  "output_path": "string (optional)"
}
```

**Nếu có `output_path`:**
- Ghi PDFs vào thư mục đó
- Response: JSON với `mode: "filesystem"`, `output_path`, `count`

**Nếu không có `output_path`:**
- Trả về ZIP file chứa tất cả PDFs
- Response: ZIP file (Content-Type: application/zip)
- Filename: `reports_YYYYMMDD_HHMM.zip`

**Status Codes:**
- `200 OK`: Thành công

---

## Users

Tất cả endpoints yêu cầu ADMIN role.

### GET /api/users

Lấy danh sách tất cả users.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response:**
```json
[
  {
    "_id": "ObjectId",
    "username": "admin",
    "display_name": "Admin",
    "role": "ADMIN",
    "legacy_password": false
  }
]
```

**Status Codes:**
- `200 OK`: Thành công
- `401 Unauthorized`: Chưa đăng nhập
- `403 Forbidden`: Không phải ADMIN

---

### POST /api/users

Tạo user mới (ADMIN only).

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Request Body:**
```json
{
  "username": "string (required)",
  "password": "string (required)",
  "display_name": "string (optional)",
  "role": "ADMIN | SALE (optional, default: SALE)",
  "pin": "string (optional, 6 digits)"
}
```

**Response:**
```json
{
  "_id": "ObjectId",
  "username": "user2",
  "display_name": "User 2",
  "role": "SALE",
  "legacy_password": false
}
```

**Status Codes:**
- `201 Created`: User đã được tạo
- `400 Bad Request`: Username đã tồn tại hoặc thiếu thông tin
- `401 Unauthorized`: Chưa đăng nhập
- `403 Forbidden`: Không phải ADMIN

---

### PATCH /api/users/:id

Cập nhật user (ADMIN only).

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Request Body:**
```json
{
  "display_name": "string (optional)",
  "role": "ADMIN | SALE (optional)",
  "password": "string (optional, để trống nếu không đổi)",
  "pin": "string (optional, để trống nếu không đổi)"
}
```

**Response:**
```json
{
  "_id": "ObjectId",
  "username": "user2",
  "display_name": "User 2 (Updated)",
  "role": "ADMIN",
  "legacy_password": false
}
```

**Status Codes:**
- `200 OK`: Cập nhật thành công
- `400 Bad Request`: Role không hợp lệ
- `401 Unauthorized`: Chưa đăng nhập
- `403 Forbidden`: Không phải ADMIN
- `404 Not Found`: User không tồn tại

---

### POST /api/users/delete-secure

Xóa user (ADMIN only, yêu cầu PIN).

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Request Body:**
```json
{
  "id": "ObjectId",
  "pin": "1234"
}
```

**Response:**
```json
{
  "message": "Đã xóa user"
}
```

**Status Codes:**
- `200 OK`: Xóa thành công
- `401 Unauthorized`: Chưa đăng nhập
- `403 Forbidden`: Không phải ADMIN hoặc PIN sai
- `404 Not Found`: User không tồn tại

---

## Info

### GET /api/info

Lấy thông tin ứng dụng từ `app_info.json`.

**Response:**
```json
{
  "name": "FastAccounting",
  "version": "1.0.0",
  "description": "Hệ thống quản lý công nợ",
  "updated_at": "2025-01-01",
  "author": "Đại lý Công Phú",
  "summary": []
}
```

---

### PUT /api/info

Cập nhật thông tin ứng dụng (ADMIN only).

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Request Body:**
```json
{
  "name": "string (optional)",
  "version": "string (optional)",
  "description": "string (optional)",
  "updated_at": "string (optional, ISO date)",
  "author": "string (optional)",
  "summary": ["array of strings (optional)"]
}
```

**Response:**
```json
{
  "name": "FastAccounting",
  "version": "1.1.0",
  ...
}
```

**Status Codes:**
- `200 OK`: Cập nhật thành công
- `409 Conflict`: Môi trường read-only (Vercel/serverless)
- `401 Unauthorized`: Chưa đăng nhập
- `403 Forbidden`: Không phải ADMIN

---

## Backup

Tất cả endpoints yêu cầu ADMIN role.

### GET /api/backup/export

Xuất backup toàn bộ dữ liệu (EJSON format).

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response:**
- `200 OK`: EJSON file (Content-Type: application/json)
- Filename: `fastaccounting-backup-YYYYMMDD-HHMMSS.ejson.json`

**Format:**
```json
{
  "meta": {
    "app": "FastAccounting",
    "format": "ejson-bundle",
    "created_at": "2025-01-01T00:00:00.000Z",
    "counts": {
      "customers": 10,
      "transactions": 50,
      "interest_configs": 3,
      "users": 2,
      "counters": 2
    }
  },
  "collections": {
    "customers": [...],
    "transactions": [...],
    "interest_configs": [...],
    "users": [...],
    "counters": [...]
  }
}
```

**Status Codes:**
- `200 OK`: Export thành công
- `401 Unauthorized`: Chưa đăng nhập
- `403 Forbidden`: Không phải ADMIN

---

### POST /api/backup/import

Import backup từ EJSON file (UPSERT by _id).

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: text/plain
```

**Request Body:**
- EJSON string (max 50MB)

**Response:**
```json
{
  "ok": true,
  "imported_at": "2025-01-01T00:00:00.000Z",
  "results": {
    "customers": { "count": 10, "affected": 10 },
    "transactions": { "count": 50, "affected": 50 },
    "interest_configs": { "count": 3, "affected": 3 },
    "users": { "count": 2, "affected": 2 },
    "counters": { "count": 2, "affected": 2 }
  }
}
```

**Status Codes:**
- `200 OK`: Import thành công
- `400 Bad Request`: Format không hợp lệ
- `401 Unauthorized`: Chưa đăng nhập
- `403 Forbidden`: Không phải ADMIN

**Warning:** Import sẽ ghi đè dữ liệu hiện có nếu `_id` trùng!

---

## Error Handling

Tất cả endpoints trả về error theo format:

```json
{
  "error": "Error message"
}
```

**Status Codes:**
- `400 Bad Request`: Dữ liệu không hợp lệ
- `401 Unauthorized`: Chưa đăng nhập hoặc token không hợp lệ
- `403 Forbidden`: Không có quyền (không phải ADMIN)
- `404 Not Found`: Resource không tồn tại
- `500 Internal Server Error`: Lỗi server

**Development Mode:** Error response có thể bao gồm `stack` trace.

---

## Authentication Flow

1. **Login:** `POST /api/auth/login` → Nhận JWT token
2. **Sử dụng token:** Thêm header `Authorization: Bearer <token>` vào mọi request
3. **Token hết hạn:** Nhận `401 Unauthorized` → Login lại

**Token Format:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Rate Limiting

Hiện tại API không có rate limiting. Có thể thêm trong tương lai.

---

## CORS

API hỗ trợ CORS với cấu hình từ biến môi trường `CORS_ORIGIN`.

**Default:** Cho phép tất cả origins (`*`)

**Production:** Nên cấu hình cụ thể:
```
CORS_ORIGIN=https://yourdomain.com,https://appassets.androidplatform.net
```

---

## Notes

- Tất cả dates sử dụng ISO 8601 format
- IDs có thể là custom ID (KH001, GD001) hoặc MongoDB ObjectId
- Hệ thống hỗ trợ read-only mode (kiểm tra qua `isMongoWriteForbidden`)
- Google Drive integration cho transaction images (yêu cầu cấu hình OAuth)
