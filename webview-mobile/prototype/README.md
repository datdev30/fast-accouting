# Prototype FastAccounting — Android phone & tablet

Mở `index.html` trực tiếp bằng Chrome hoặc Edge. Không cần npm, máy chủ, internet hay build APK.

- `index.html`: khung duyệt với lựa chọn điện thoại 390×844, tablet dọc 768×1024, tablet ngang 1180×820.
- `app.html`: giao diện responsive thực tế; mở trực tiếp trên thiết bị hoặc thay đổi kích thước cửa sổ.
- `styles.css`, `app.js`: bố cục và tương tác, không dùng thư viện/CDN.

## Các luồng có thể duyệt

1. Tổng quan → khách hàng còn công nợ → chi tiết công nợ.
2. Giao dịch → tìm kiếm / lọc loại / lọc trạng thái.
3. Thêm giao dịch → nhập dữ liệu → lưu → giao dịch và tổng công nợ cập nhật trong phiên.
4. Khách hàng → tìm tên / điện thoại → lịch sử giao dịch.
5. Báo cáo → chọn khách hàng → In / Lưu PDF bằng trình duyệt.
6. Thêm → thông tin làm việc và lãi suất tham khảo.

## Quy ước thiết kế

Giữ màu xanh của client hiện tại. Ưu tiên tên khách hàng, tổng cần thu, tiền gốc, tiền lãi, trạng thái. Điện thoại dưới 768px dùng bottom navigation và thẻ giao dịch, form toàn màn hình. Tablet từ 768px dùng thanh điều hướng thu gọn và bảng; từ 1100px dùng sidebar đầy đủ và tổng quan hai cột. Vùng chạm tối thiểu khoảng 44px, nội dung biểu mẫu 16px. Có trạng thái không tìm thấy dữ liệu, focus bàn phím và dialog native.

Dữ liệu và tên khách hàng đều minh họa. Lãi là số mẫu cố định chốt ngày 02/11/2026, không phải bộ tính lãi thật. Giao dịch mới có lãi bằng 0, dữ liệu reset khi tải lại. Đính kèm chỉ hiển thị tên tệp, không upload. Cấu hình chỉ để duyệt thông tin. Chưa mô phỏng đăng nhập, chỉnh sửa/xóa, thu tiền, QR, offline, bàn phím Android hay tích hợp native WebView.

## Gợi ý góp ý

Ghi lại tên màn hình + thiết bị + thông tin cần đổi, ví dụ: “Giao dịch / điện thoại: muốn tổng gốc + lãi hiện ngay trên từng thẻ”. Kiểm tra thêm tên dài, số tiền nhiều chữ số, form nhập và độ dễ chạm.
