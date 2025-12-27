# Kế hoạch Triển khai FastAccounting

## Mục tiêu
Xây dựng Web App quản lý khoản vay, nợ mua hàng và tính lãi suất tự động theo yêu cầu.

## Công nghệ Sử dụng (Đề xuất)
## Công nghệ Sử dụng (Đề xuất)
- **Backend**: Node.js, Express.js
- **Frontend**: React (Vite), Vanilla CSS (Custom styling)
- **Database**: MongoDB (Mongoose ODM).

## Kiến trúc Hệ thống

### 1. Database Schema
Sử dụng Mongoose Models:

**Customer**
```json
{
  "name": "String",
  "contact_info": "String",
  "created_at": "Date"
}
```

**InterestConfig**
```json
{
  "code": "String (TIEN_MAT, CHUYEN_KHOAN, MUA_HANG) [Unique]",
  "name": "String",
  "rate_per_month": "Number",
  "description": "String"
}
```

**Transaction**
```json
{
  "customer_id": "ObjectId (Ref -> Customer)",
  "type": "String (Ref -> InterestConfig.code)",
  "amount": "Number",
  "content": "String",
  "transaction_date": "Date",
  "interest_rate_snapshot": "Number",
  "status": "String (OPEN/CLOSED)"
}
```

### 2. Backend API Design
- `GET /api/customers`: Lấy danh sách khách hàng
- `POST /api/customers`: Tạo khách hàng mới
- `POST /api/transactions`: Tạo giao dịch mới (Tính toán lãi dự kiến)
- `GET /api/transactions`: Lấy lịch sử giao dịch (Filter theo tháng/khách hàng)
- `GET /api/reports/debt`: Báo cáo công nợ (Tổng hợp gốc + lãi tính đến hiện tại)

### 3. Frontend Architecture
- **Pages**:
  - `Dashboard`: Tổng quan nhanh.
  - `NewTransaction`: Form nhập liệu.
  - `TransactionHistory`: Bảng danh sách, filter.
  - `DebtReport`: Báo cáo.
  - `Settings`: Cấu hình lãi suất.
- **Components**:
  - `Layout`: Header, Sidebar.
  - `TransactionForm`: Form nhập liệu với validation.
  - `DebtTable`: Hiển thị dữ liệu dạng bảng.

## Các bước Triển khai
1. **Setup**: Khởi tạo thư mục `server` (Backend) và `client` (Frontend).
2. **Backend Base**: Cài đặt Express, Mongoose, dotenv.
3. **Database**: Kết nối MongoDB.
4. **Models**: Định nghĩa Schemas.
5. **API Core**: Viết API CRUD.
6. **Frontend Setup**: Vite + React Setup.
7. **UI Implementation**: Xây dựng các màn hình và kết nối API.

## User Review Required
> [!IMPORTANT]
> Vui lòng xác nhận việc sử dụng **SQLite** cho cơ sở dữ liệu để đơn giản hóa quá trình cài đặt và sao lưu file. Nếu cần MySQL/PostgreSQL cho môi trường Production lớn, vui lòng thông báo.
