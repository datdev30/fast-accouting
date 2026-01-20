# Checklist - Tính năng Cấu hình STK

## ✅ Đã hoàn thành

### 1. UI/UX Implementation
- [x] Tạo trang `BankAccountConfig.jsx` với UI form đẹp, responsive
- [x] Form nhập thông tin với 3 trường:
  - [x] Tên ngân hàng (với icon Building2)
  - [x] Số tài khoản (chỉ nhập số, font mono)
  - [x] Chủ tài khoản (với icon User)
- [x] Layout 2 cột: Form bên trái, QR Code display bên phải
- [x] QR Code placeholder section (sẽ hiển thị QR code khi có)
- [x] Validation form (chỉ validate khi submit, không real-time)
- [x] Error messages rõ ràng cho từng trường
- [x] Responsive design cho tablet (portrait/landscape)
- [x] **Role-based access control:**
  - [x] ADMIN: Có thể edit và save
  - [x] SALE: Chỉ xem (readonly), inputs disabled
  - [x] Badge "Chỉ xem" hiển thị cho SALE
  - [x] Banner thông báo cho SALE
  - [x] Ẩn nút Save và Tạo QR cho SALE

### 2. Routing & Navigation
- [x] Thêm route `/bank-account-config` trong `App.jsx`
- [x] Thêm link "Cấu hình STK" trong `Settings.jsx` với icon CreditCard
- [x] Link hiển thị cho tất cả user (không chỉ admin)

### 3. Validation Rules
- [x] **Tên ngân hàng**: 
  - Required
  - Min: 2 ký tự
  - Max: 100 ký tự
- [x] **Số tài khoản**: 
  - Required
  - Chỉ chứa số (tự động filter)
  - Min: 8 chữ số
  - Max: 20 chữ số
- [x] **Chủ tài khoản**: 
  - Required
  - Min: 2 ký tự
  - Max: 100 ký tự

### 4. Features
- [x] Nút "Lưu cấu hình" (Save)
- [x] Nút "Tạo mã QR" (Generate QR Code)
- [x] Placeholder cho QR code display
- [x] Empty state khi chưa có QR code
- [x] Hiển thị thông tin ngân hàng dưới QR code
- [x] Nút "Xóa mã QR" để reset

## 🔄 Cần tích hợp API (Sau khi có tài liệu)

### 1. API Endpoints cần tạo
- [ ] `GET /api/bank-account-config` - Lấy cấu hình của user hiện tại (tự động lấy user_id từ token)
- [ ] `POST /api/bank-account-config` - Lưu cấu hình với user_id của user hiện tại
- [ ] `POST /api/bank-account-config/generate-qr` - Tạo mã QR từ thông tin ngân hàng
- [ ] **Lưu ý**: Mỗi user có cấu hình riêng, lưu với `user_id` trong database

### 2. Integration Points
- [ ] Thay thế placeholder `saveMutation` bằng API call thực tế (lưu với user_id)
- [ ] Thay thế placeholder `generateQRCode` bằng API call thực tế
- [ ] Thêm `getBankAccountConfig(userId)` function trong `services/api.js`
- [ ] Thêm `saveBankAccountConfig(data)` function trong `services/api.js` (tự động lấy user_id từ token)
- [ ] Thêm `generateBankQRCode(data)` function trong `services/api.js`
- [ ] Load dữ liệu hiện tại khi vào trang (useQuery với user?.id)
- [ ] Hiển thị QR code thực tế từ API response
- [ ] **Backend**: Kiểm tra quyền ADMIN trước khi cho phép save (nếu cần)

### 3. Backend Requirements
- [ ] Model/Table để lưu thông tin ngân hàng với `user_id` (mỗi user có cấu hình riêng)
- [ ] API endpoint để lưu/load cấu hình (tự động lấy user_id từ token/session)
- [ ] API endpoint để tạo QR code (có thể dùng thư viện như `qrcode`)
- [ ] Validation phía server cho các trường
- [ ] **Authorization**: Chỉ ADMIN mới được save (backend check role)

## 📝 Notes

### UI Design
- Form sử dụng style nhất quán với các trang khác (InterestConfigs, UserManagement)
- QR Code display section có empty state đẹp
- Responsive: 2 cột trên desktop/landscape, 1 cột trên mobile/portrait
- Validation errors hiển thị với icon AlertCircle

### Code Structure
- File: `client-tablet/src/pages/BankAccountConfig.jsx`
- Route: `/bank-account-config`
- Accessible từ: Settings -> Cấu hình STK

### Validation Strategy
- Không validate real-time (theo yêu cầu UX optimization)
- Chỉ validate khi submit hoặc click "Tạo mã QR"
- Error messages rõ ràng, chỉ ra chỗ cần sửa

## 🎯 Next Steps

1. **Chờ tài liệu API** từ người dùng
2. **Tích hợp API calls** vào các placeholder
3. **Test flow hoàn chỉnh**: Nhập -> Lưu -> Tạo QR -> Hiển thị
4. **Backend implementation** (nếu chưa có)

---

**Status**: ✅ UI/UX hoàn thành, chờ tích hợp API
