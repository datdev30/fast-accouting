# Kiến trúc cơ bản của Web App Tính Tiền Cho Vay và Nợ Mua Hàng

## 1. Yêu cầu hệ thống

Hệ thống Web App này sẽ giúp quản lý các khoản vay tiền mặt, chuyển khoản, và các giao dịch mua hàng hóa, đồng thời tính toán lãi suất cho từng loại giao dịch. Các yêu cầu cơ bản bao gồm:

- **Quản lý các khoản vay và nợ:** 
  - Cho vay tiền mặt, chuyển khoản (lãi suất 2%/tháng).
  - Mua hàng (phân bón, thuốc trừ sâu, ...) (lãi suất 1.5%/tháng).
  - Các thể loại giao dịch khác có thể mở rộng sau này.

- **Nhập liệu giao dịch:** 
  - Cho phép người dùng nhập vào ngày cho vay, người vay, nội dung giao dịch, thể loại giao dịch, và số tiền giao dịch.
  
- **Tính toán lãi suất:**
  - Hệ thống sẽ tính toán lãi suất cho từng giao dịch và hiển thị số tiền gốc và lãi.

- **Báo cáo công nợ:**
  - Cung cấp báo cáo về công nợ của khách hàng theo từng tháng hoặc năm, giúp minh bạch các giao dịch và tình trạng thanh toán.

---

## 2. Kiến trúc cơ bản của Web App

### Frontend (Giao diện người dùng)
Frontend là phần giao diện mà người dùng sẽ tương tác trực tiếp để nhập dữ liệu và xem báo cáo. Các tính năng chính bao gồm:
  
- **Form nhập liệu:** Cho phép nhập thông tin giao dịch (ngày cho vay, người vay, nội dung, thể loại, số tiền).
- **Danh sách giao dịch:** Hiển thị các giao dịch đã nhập (gồm ngày cho vay, người vay, số tiền, thể loại, lãi suất áp dụng).
- **Báo cáo công nợ:** Hiển thị tình trạng nợ và lãi của khách hàng theo từng tháng hoặc năm.
- **Bảng tính lãi:** Cho phép tính toán số tiền gốc và lãi cho từng giao dịch vay nợ.

**Công nghệ sử dụng:**
- **HTML/CSS/JavaScript:** Để xây dựng giao diện.
- **ReactJS hoặc VueJS:** Thư viện JavaScript để xây dựng giao diện động và tương tác tốt với người dùng.
- **Bootstrap hoặc Tailwind CSS:** Để tạo giao diện đẹp mắt và responsive (tương thích với cả thiết bị di động).

---

### Backend (Máy chủ xử lý và lưu trữ dữ liệu)
Backend sẽ xử lý các logic tính toán, lưu trữ dữ liệu và gửi dữ liệu cho frontend để hiển thị.

- **API quản lý giao dịch:** Các endpoint API để thêm, sửa, xóa giao dịch và tính toán lãi suất.
- **Tính toán lãi suất:** Tính toán số tiền gốc + lãi cho từng giao dịch, với các lãi suất khác nhau (tiền mặt, chuyển khoản, mua hàng, v.v.).
- **Báo cáo tài chính:** Cung cấp API để lấy báo cáo công nợ theo tháng, quý, năm.

**Công nghệ sử dụng:**
- **Node.js với Express.js:** Một framework phổ biến cho backend với JavaScript.
- **Python Flask hoặc Django (tùy theo sở thích):** Nếu bạn muốn sử dụng Python cho backend.
- **RESTful API hoặc GraphQL:** Để cung cấp các dịch vụ web.
- **JWT:** Để xác thực người dùng (nếu cần bảo mật).

---

### Database (Cơ sở dữ liệu)
Cơ sở dữ liệu sẽ lưu trữ tất cả các giao dịch cho vay, nợ, lãi suất và các báo cáo.

**Các bảng chính trong cơ sở dữ liệu:**

1. **Transactions (Giao dịch):** Lưu thông tin về các khoản vay/nợ.
   - **TransactionID:** ID giao dịch
   - **Ngày cho vay**
   - **Người vay**
   - **Nội dung**
   - **Thể loại giao dịch** (Tiền mặt, chuyển khoản, mua hàng...)
   - **Số tiền giao dịch**
   - **Lãi suất**
   - **Ngày thanh toán kỳ tiếp theo**

2. **Customers (Khách hàng):** Lưu thông tin khách hàng (nếu cần).
   - **CustomerID**
   - **Tên khách hàng**
   - **Thông tin liên hệ**

3. **InterestRates (Lãi suất):** Lưu các loại lãi suất cho từng thể loại giao dịch.
   - **InterestRateID**
   - **Thể loại giao dịch**
   - **Lãi suất** (ví dụ: 2%/tháng)

**Công nghệ sử dụng:**
- **MySQL hoặc PostgreSQL:** Cơ sở dữ liệu quan hệ để lưu trữ thông tin giao dịch, khách hàng và lãi suất.
- **MongoDB (NoSQL):** Nếu bạn cần một hệ thống lưu trữ linh hoạt hơn cho các giao dịch, có thể thay thế cơ sở dữ liệu quan hệ.

---

## 3. Quy trình hoạt động của hệ thống

### Nhập liệu giao dịch
- Người dùng nhập vào thông tin giao dịch (ngày cho vay, số tiền, thể loại, nội dung) vào form.
- Chọn thể loại giao dịch (tiền mặt, chuyển khoản, mua hàng).
- Hệ thống tự động tính lãi suất dựa trên thể loại giao dịch và lưu vào cơ sở dữ liệu.

### Tính toán lãi suất
- Hệ thống sẽ tính lãi hàng tháng cho mỗi giao dịch dựa trên lãi suất cố định đã được nhập.
- Ví dụ: Nếu giao dịch là tiền mặt (lãi suất 2%/tháng), thì lãi sẽ được tính và cộng vào mỗi tháng.

### Báo cáo công nợ
- Cuối tháng, hoặc khi cần thiết, hệ thống có thể tạo báo cáo chi tiết về công nợ của từng khách hàng.
- Báo cáo sẽ bao gồm tổng số tiền vay/nợ, lãi suất, và tổng tiền phải trả (gốc + lãi).

---
