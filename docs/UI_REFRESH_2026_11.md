# Giao diện sổ công nợ — 02/11/2026

## Mục tiêu
Web và APK dùng cùng giao diện React. Ưu tiên đọc và đối chiếu số tiền,
tiếng Việt đầy đủ, thao tác cảm ứng thoải mái. Giữ nguyên phép tính và API.

## Hợp đồng thiết kế
- Be Vietnam Pro tự lưu trong public/fonts, 400/500/600/700. Số tiền dùng
  chữ số đều chiều rộng, căn phải trong bảng, không rút gọn hoặc cắt dấu ba chấm.
- Nền #F8FAFC, bề mặt trắng, chữ #0F172A / #475569, thao tác chính xanh #2563EB.
- Nhãn 13–14px, nội dung 15–16px, tiền tổng 28–36px; không viết hoa giãn chữ ở form.
- Công nợ: tổng còn phải thu, gốc/lãi riêng; lịch sử giữ số tiền của khoản đã trả.
- Bảng trên desktop, thẻ trên điện thoại; tablet giữ diện tích đọc dữ liệu.
- Nút cảm ứng tối thiểu 48px; bàn phím và focus phải dùng được.
- Phân biệt dữ liệu đang tải/lỗi với số 0. Không thêm nhãn quá hạn khi thiếu ngày đến hạn.
- Không thay markup báo cáo in, phép tính tiền hoặc cơ chế tải/chia sẻ của APK.

## Các phần triển khai
1. Font cục bộ và kiểu chữ/bảng/form dùng chung.
2. Chi tiết công nợ, tổng quan, giao dịch và danh sách khách hàng.
3. Kiểm tra build, lint so với ban đầu, trình duyệt ở 320/375/768/1024/1440px.
   Dữ liệu kiểm thử là giả lập cục bộ, không ghi vào dữ liệu thật.

## Nguồn
- Font: @fontsource/be-vietnam-pro 5.3.0 (SIL OFL, giấy phép lưu cùng font).
- Giữ Open Sans 5.3.0 cục bộ cho bản in/xem trước, không đổi markup báo cáo in.
- https://github.com/bettergui/BeVietnamPro
- https://support.google.com/accessibility/android/answer/7101858

## Kiểm chứng đã chạy
- `npm run build`: đạt. Còn cảnh báo bundle lớn hơn 500 kB và dữ liệu Browserslist cũ.
- ESLint: 119 findings trước và sau; không có finding mới (so sánh theo rule và nội dung,
  bỏ qua số dòng bị dịch chuyển). Không hạ quy tắc lint.
- `scripts/ui-review.cjs`: 4 trang × 5 chiều rộng 320/375/768/1024/1440px;
  kiểm tra tràn trang và cắt số tiền; số tiền khoản đã trả; chọn/đóng giao dịch;
  form cảm ứng với tiền 12 chữ số và nút 48px; preview rộng 794px; lỗi API tổng hợp.
- Trình duyệt Chromium, API giả lập, đăng nhập giả lập; không kết nối dữ liệu thật.
- Đã xem ảnh desktop, điện thoại và form cảm ứng. Chưa thử bàn phím Android thật,
  in/chia sẻ native hoặc triển khai production.

Chạy lại: khởi động Vite tại `http://127.0.0.1:5173` với `VITE_API_URL=/api`,
sau đó chạy `node scripts/ui-review.cjs` trong `client/`. Script cần Playwright + Chromium;
có thể đặt `PLAYWRIGHT_MODULE` trỏ tới gói Playwright cục bộ đã cài.
`UI_BASE_URL` và `UI_OUTPUT` cho phép đổi URL localhost và nơi lưu ảnh.
Script chặn toàn bộ request bên ngoài localhost, mọi API đều được giả lập.
