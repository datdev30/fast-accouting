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


## Kiểm tra bổ sung — 05/11/2026
- Thiết kế lại login, giữ nguyên API xác thực và xử lý lỗi.
- Sửa số tiền bị chật ở thẻ giao dịch 320px bằng các dòng nhãn/số tiền riêng.
- Sửa grid thông tin khách hàng bị rộng hơn viewport 320px (cột minmax thay cho cột auto).
- Lịch sử công nợ cho phép xuống hàng, có nhãn tổng cộng rõ ràng.
- Token vùng chạm và chiều cao input cảm ứng 48px; nút cộng nhanh số tiền dùng token chung.
- Kiểm thử Chromium với API giả lập: 4 trang × 5 chiều rộng 320/375/768/1024/1440;
  luồng đăng nhập → khách hàng → công nợ ở 320/375/768/1024/1194 với cảm ứng.
- Kiểm tra cả biên khối nội dung (không chỉ scrollWidth của trang), tiền đầy đủ,
  mở/đóng dialog, form tiền, preview A4 và lỗi API. Tất cả đạt.
- Vùng chạm 48px ở cả 5 kích thước cảm ứng; số tổng 22–28px tùy bề rộng.
- Build đạt; lint Login và DebtHistoryEntry đạt, Transactions và CustomerDebtDetail
  không thêm finding so với HEAD. Còn cảnh báo bundle lớn và Browserslist cũ.
- WebView trỏ https://fast-accounting-client.vercel.app. Build assembleDebug đạt,
  APK xác minh chữ ký v2 và URL đóng gói. Đây là APK debug, chưa thử trên Android thật.

- Kiểm tra production phát hiện base tương đối khiến reload URL công nợ tải sai JS/CSS.
  Đổi Vite base thành `/` để tài nguyên luôn tải từ gốc website.


## Android system-bar safe areas — 05/11/2026
- Cause: only the Overview mobile header applied `--safe-t`; other routes started
  at the top edge of the WebView. Move this inset to the shared application shell
  and remove the Overview-specific inset to avoid double padding.
- The inset stays outside the scrolling content, including sticky table headings.
- Bound modal height by available safe viewport height. Reset margins on fullscreen
  overlays so page `space-y` utilities cannot shrink/offset their viewport bounds.
- Image-preview toolbar now participates in the flex layout, wraps on narrow screens,
  and respects top inset; image content respects bottom inset.
- Regression test: `UI_SAFE_AREA_ONLY=1 node scripts/ui-review.cjs` with the same
  Playwright/Vite setup described above. Covers login plus every routed application
  screen (14 total) at 320×812, 412×915, 915×412, and 1194×834, with 24–36px top
  insets and 24px bottom inset. Checks headings and scroller bounds before/after scroll.
- Includes a 412×360 short-viewport transaction form and local image preview, without
  submitting a transaction. `UI_OVERLAYS_ONLY=1` isolates those overlay checks.
- Web-only fix: the existing WebView APK loads this update from the deployed site.
  Browser simulation does not replace checking status bars/keyboard on real Android.
