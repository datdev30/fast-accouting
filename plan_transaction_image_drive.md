# Kế hoạch tích hợp: Ảnh cho Giao Dịch (lưu Google Drive)

## 1) Mục tiêu
- Mỗi giao dịch có thể đính kèm **1 ảnh** (bằng camera trên mobile/tablet hoặc upload file trên PC/laptop).
- Ảnh được **lưu trên Google Drive** thông qua backend (OAuth - refresh token).
- Khi mở **chi tiết giao dịch**, hệ thống tải ảnh từ Drive về để hiển thị.
- Không lộ access token/refresh token ra phía client.

## 2) Yêu cầu UI/UX
- Mobile/Tablet: ưu tiên mở camera để chụp (nếu thiết bị hỗ trợ).
- Laptop/PC: vẫn có nút chọn file upload (kể cả có/không có camera).
- Luồng tối thiểu:
  1) Người dùng tạo/sửa giao dịch
  2) Chọn/chụp ảnh
  3) Upload ảnh lên server
  4) Server đẩy ảnh lên Drive, lưu `drive_file_id` vào giao dịch
  5) Trang chi tiết giao dịch gọi API để hiển thị ảnh

Gợi ý triển khai đơn giản và đúng hành vi:
- Dùng `<input type="file" accept="image/*">` cho mọi nền tảng.
- Trên mobile/tablet, thêm `capture="environment"` để trình duyệt mở camera (khi hỗ trợ).
- Không cần “phát hiện có camera hay không” quá phức tạp; fallback tự nhiên là upload file.

## 3) Kiến trúc tổng thể
### 3.1 Nguyên tắc
- Client (React) **không** gọi Google Drive API trực tiếp.
- Backend chịu trách nhiệm:
  - Nhận file ảnh từ client
  - Upload lên Google Drive bằng OAuth (refresh token)
  - Lưu metadata vào DB
  - Khi client cần hiển thị ảnh: backend tải file từ Drive và **stream** về client

### 3.2 Drive lưu file ở đâu?
- Tạo 1 folder Drive cố định (ví dụ: `FastAccounting_Transaction_Images`).
- Lưu `DRIVE_FOLDER_ID` trong cấu hình backend.
- File naming gợi ý:
  - `TX-001__2026-01-03.jpg` hoặc `{transactionId}__{timestamp}.{ext}`

Lưu ý quan trọng (Tài khoản Google cá nhân):
- Với Google cá nhân (My Drive), nên dùng **OAuth (refresh token)** để backend upload/read file bằng chính tài khoản của bạn (dùng quota của user).
- Backend vẫn giữ nguyên API; chỉ đổi cơ chế xác thực Google Drive ở phía server.

### 3.3 Quyền truy cập
- File thuộc sở hữu tài khoản Google đã cấp OAuth.
- Mặc định **không public**.
- Client xem ảnh thông qua endpoint backend (đã auth) để tránh lộ link/token.

## 4) Thay đổi dữ liệu (DB Schema)
Hiện tại `Transaction` (Node/Mongoose) và `Transaction` (Python/Beanie) chưa có trường ảnh.

### 4.1 Field đề xuất
- `image_drive_file_id`: string | null
- `image_mime_type`: string | null
- `image_original_name`: string | null
- `image_uploaded_at`: datetime | null

Tối thiểu để chạy được: chỉ cần `image_drive_file_id`.

### 4.2 Vị trí code
- Node: `api/models/Transaction.js`
- Python: `server/models.py`

## 5) Thiết kế API (Backend)
Hệ thống có 2 backend (Node trong `api/` và Python trong `server/`). Cần chọn 1 backend “nguồn sự thật” để web client dùng.

Khuyến nghị:
- Web/Vercel (client) đang đi theo Node API (`api/`). Triển khai Drive ở **Node API** trước.
- Backend Python (desktop) có thể triển khai sau theo cùng chuẩn endpoint.

### 5.1 Node API (ưu tiên)
#### Endpoint A: Upload ảnh cho giao dịch
- `POST /api/transactions/:id/image`
- Auth: áp dụng middleware hiện có (nếu đang bật cho routes giao dịch).
- Request: `multipart/form-data` với field `image`.
- Server:
  1) Validate transaction tồn tại
  2) Validate file: type bắt đầu bằng `image/`, kích thước (ví dụ ≤ 5MB)
  3) Upload lên Drive vào folder `DRIVE_FOLDER_ID`
  4) Lưu `image_drive_file_id` (+ metadata) vào transaction
  5) Trả về transaction đã cập nhật hoặc payload `{ drive_file_id }`

#### Endpoint B: Lấy ảnh để hiển thị
- `GET /api/transactions/:id/image`
- Auth: bắt buộc (vì ảnh private)
- Server:
  1) Lấy transaction
  2) Nếu không có `image_drive_file_id` → 404
  3) Download file từ Drive (alt=media) và stream về client
  4) Set header `Content-Type` theo mime thực
  5) Có thể set cache (ETag) nếu cần, nhưng MVP có thể bỏ qua

#### Endpoint C (tuỳ chọn): Xoá ảnh
- `DELETE /api/transactions/:id/image`
- Xoá link trong DB; có thể xoá file Drive hoặc giữ lại (tuỳ chính sách)

### 5.2 Python backend (triển khai sau)
- Tương tự 2 endpoint `POST /transactions/{id}/image` và `GET /transactions/{id}/image`.
- Dùng `google-api-python-client` + `UploadFile` của FastAPI.

## 6) Frontend (React) thay đổi
### 6.1 UI nơi upload
- Chỗ hợp lý: trang chi tiết giao dịch hoặc form tạo/sửa giao dịch.
- Bổ sung khu vực:
  - Nếu chưa có ảnh: nút “Chụp/Chọn ảnh”
  - Nếu có ảnh: hiển thị thumbnail + nút “Đổi ảnh” (và tuỳ chọn “Xoá ảnh” nếu cần)

### 6.2 Logic chọn/chụp ảnh
- Dùng input file:
  - Mobile/Tablet: `accept="image/*" capture="environment"`
  - Desktop: `accept="image/*"` (không cần capture)

### 6.3 Gọi API
- Upload: gọi `POST /api/transactions/:id/image`.
- Hiển thị: `<img src="/api/transactions/:id/image" ...>` (kèm auth header nếu app không dùng cookie; nếu đang dùng token header, cần fetch blob rồi `URL.createObjectURL`).

## 7) Bảo mật & quản lý secrets (bắt buộc)
### 7.1 OAuth (refresh token)
- Tạo OAuth Client trong Google Cloud Console và lấy:
  - `GOOGLE_DRIVE_OAUTH_CLIENT_ID`
  - `GOOGLE_DRIVE_OAUTH_CLIENT_SECRET`
  - `GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN`
- Dùng script tạo refresh token: `api/scripts/drive-oauth-generate-refresh-token.js`
- Lưu ý: refresh token là “chìa khoá dài hạn”, cần bảo vệ như mật khẩu.

### 7.2 Scope tối thiểu
- Ưu tiên scope `https://www.googleapis.com/auth/drive.file` (thay vì full drive) nếu phù hợp.

### 7.3 Kiểm soát truy cập
- Endpoint upload/view ảnh phải yêu cầu auth.
- Validate file type + size.

## 8) Ảnh hưởng Backup/Restore
Hiện backup hiện tại đang export dữ liệu DB ra JSON. Ảnh nằm trên Drive nên:
- Backup DB sẽ chỉ chứa `image_drive_file_id`.
- Cần quyết định policy:
  - MVP: backup/restore chỉ giữ fileId (không kéo ảnh về).
  - Nâng cao: thêm script export/import ảnh Drive kèm theo.

## 9) Checklist triển khai (theo thứ tự)
1. Chọn backend chính (khuyến nghị: Node API trong `api/`).
2. Thêm fields ảnh vào Transaction schema.
3. Tạo module Drive client (OAuth) + đọc env.
4. Thêm endpoint upload ảnh.
5. Thêm endpoint stream ảnh.
6. Cập nhật UI upload + hiển thị ảnh ở trang chi tiết giao dịch.
7. Thêm kiểm tra giới hạn size/type + xử lý lỗi UX.
8. Test thủ công:
   - Mobile: chụp ảnh → upload → mở lại chi tiết
   - Desktop: chọn file → upload → mở lại chi tiết
   - Auth: user không đăng nhập không xem được ảnh

## 10) Test cases tối thiểu
- Upload ảnh hợp lệ (jpg/png/heic nếu muốn hỗ trợ) → lưu fileId → xem lại OK.
- Upload file không phải ảnh → 400.
- Upload ảnh quá dung lượng → 413 hoặc 400.
- Transaction không tồn tại → 404.
- Transaction có `image_drive_file_id` sai/đã bị xoá trên Drive → hiển thị lỗi hợp lý.

## 11) Câu hỏi cần chốt nhanh (để implement đúng)
- 1 giao dịch có **1 ảnh** hay **nhiều ảnh**?
- Khi đổi ảnh: có xoá file cũ trên Drive không?
- Web client hiện đang dùng backend Node (`api/`) hay Python (`server/`) làm API chính trong production?
