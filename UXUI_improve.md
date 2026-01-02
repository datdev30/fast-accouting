# UX/UI Improve Plan — FastAccounting (React + Tailwind)

> Mục tiêu của tài liệu này: giúp dự án đạt mức “UI hoàn chỉnh” (nhất quán, dễ dùng, ít lỗi UX, responsive tốt, in/PDF ổn định, accessible cơ bản) **mà không phá cấu trúc hiện có**.

## 0) Tóm tắt hiện trạng (đã quan sát trong code)

**Điểm mạnh**
- Layout sidebar + mobile header rõ ràng, dùng Tailwind tốt, có trạng thái active, có collapse.
- Hầu hết màn hình đã có “card”/border/rounded tương đối hiện đại.
- Có Toast và DeleteConfirmationModal theo 2 bước (WARNING → PIN) giảm rủi ro xoá nhầm.
- Có luồng in/preview báo cáo công nợ (PrintableReport) và xuất PDF batch (Reports).

**Vấn đề UX/UI nổi bật**
- **Thiếu Design System thống nhất**: màu, button styles, input styles, spacing, typography đang “tự do” theo từng page.
- **Thiếu chuẩn hoá trạng thái**: loading/empty/error, disabled, focus ring, skeleton.
- **Form & table lớn**: Customers/Transactions rất dài; thiếu “visual hierarchy” rõ giữa filter, table, actions.
- **A11y**: modal focus trap, ESC close, aria-labels, keyboard navigation cho combobox/date mask còn thiếu.
- **DateInput**: mask dd/mm/yyyy tốt nhưng blur/invalid feedback chưa rõ ràng, dễ gây bối rối.
- **In/PDF**: PrintableReport dùng Times New Roman (tốt cho in), nhưng “preview mode”/chuyển đổi giữa UI screen và print cần quy tắc rõ để tránh lệch.

---

## 1) Nguyên tắc UX mục tiêu (định hướng)

### 1.1. 5 nguyên tắc cho app kế toán/công nợ
1. **Tối thiểu sai sót nhập liệu**: input có format, placeholder rõ, validate sớm, cảnh báo thân thiện.
2. **Tối ưu thao tác lặp lại**: tạo giao dịch/khách hàng nhanh, lọc nhanh, thao tác hàng loạt có xác nhận.
3. **Tính minh bạch & truy vết**: trạng thái giao dịch, lịch sử, tổng hợp theo tháng rõ ràng.
4. **Tính nhất quán**: cùng một loại nút/field phải giống nhau ở mọi trang.
5. **Tốc độ cảm nhận**: skeleton/placeholder giúp cảm giác nhanh hơn, tránh layout shift.

### 1.2. “Definition of Done” cho UI
- Mọi trang có: **Header**, **Primary action**, **Filter (nếu cần)**, **State: loading/empty/error**, **content**.
- Tất cả input có label rõ, focus visible, lỗi hiển thị tại field.
- Modal: ESC đóng, click backdrop đóng (nếu phù hợp), focus trap, không scroll nền.
- Mobile: thao tác lọc/nhập liệu không bị “chật”, button không quá nhỏ.

---

## 2) Information Architecture (IA) & Navigation

### 2.1. Sơ đồ điều hướng đề xuất
- Tổng quan (Overview) → danh sách khách + tổng nợ + CTA xuất PDF
- Giao dịch (Transactions) → nhập/tra cứu/điều chỉnh
- Khách hàng (Customers) → danh sách → chi tiết công nợ (Debt Detail)
- Cấu hình lãi suất (Interest Configs)
- Báo cáo/Phân tích (Reports/Analytics)

**Gợi ý nhỏ**
- Hiện tại route `/reports` đang map sang `Analytics`, còn `/overview` map sang `Reports`. Cần chuẩn hoá tên hiển thị:
  - Sidebar “Báo cáo” nên trỏ đúng trang “Analytics” hoặc đổi label “Phân tích”.
  - “Tổng quan” nên là Reports tổng hợp (đang đúng).

### 2.2. Breadcrumb
Trang Debt Detail đã có breadcrumb dạng “Khách hàng > Chi tiết công nợ” (tốt). Nên áp dụng cho:
- Transactions (Giao dịch)
- Interest Configs
- Reports/Analytics

---

## 3) Design System (chuẩn hoá UI)

> Vì Tailwind config hiện chưa extend token, nên Design System ở đây dùng **quy ước lớp** (utility conventions) + refactor dần.

### 3.1. Grid & spacing
- Page padding: `p-4 sm:p-6 md:p-8` (Layout đã áp dụng tốt)
- Section spacing: `space-y-6` chuẩn; với trang dài dùng `space-y-8`.

### 3.2. Typography
- H1: `text-2xl sm:text-3xl font-bold tracking-tight text-slate-900`
- H2: `text-xl sm:text-2xl font-bold tracking-tight`
- Subtitle: `text-slate-500 text-sm font-medium`
- Body: `text-slate-700`

### 3.3. Buttons (chuẩn 4 loại)
1. **Primary**: gradient xanh (đã dùng nhiều)
   - `bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg shadow-blue-200 active:scale-95`
2. **Secondary**: nền trắng + border
   - `bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-blue-200 hover:text-blue-600 rounded-xl shadow-sm`
3. **Danger**: đỏ
   - `bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-lg shadow-red-200`
4. **Ghost/Icon**: icon button
   - `p-2 text-slate-500 hover:bg-slate-100 rounded-lg`

**Chuẩn disabled**
- `disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100`

### 3.4. Inputs
- Wrapper: label uppercase nhỏ + input rõ ràng.
- Input base:
  - `w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-700`
- Input with left icon: thêm `pl-10` + icon tuyệt đối.

### 3.5. Cards
- Card base: `bg-white rounded-2xl border border-slate-100 shadow-sm`
- Card hover: `hover:shadow-md transition-all`

### 3.6. Tables
- Header sticky (nếu danh sách dài): `sticky top-0 bg-white/90 backdrop-blur`
- Row hover: `hover:bg-slate-50`
- Text align số: right; đơn vị `đ` consistently.

### 3.7. Colors & semantics
- Success: emerald
- Warning: amber
- Error: red
- Info: blue

Tránh dùng “màu tuỳ hứng” ngoài 4 nhóm trên để đảm bảo consistent.

---

## 4) Trạng thái hệ thống (Loading / Empty / Error)

### 4.1. Loading
Hiện một số trang dùng spinner đơn giản (OK). Để UI “hoàn chỉnh”, đề xuất:
- **Skeleton** cho bảng/list (Customers/Transactions/Reports): 5–8 dòng giả.
- Loading inline cho nút (Export PDF / Delete / Save): kèm text “Đang xử lý…”

### 4.2. Empty state
Mọi list nên có empty state chuẩn:
- Icon + tiêu đề + mô tả + CTA (ví dụ “Tạo giao dịch”).

### 4.3. Error state
- Lỗi API: hiển thị banner nhẹ trong trang + nút “Thử lại”.
- Không dùng alert() trình duyệt.

---

## 5) Accessibility (A11y) & Keyboard UX

### 5.1. Modal
Chuẩn yêu cầu:
- ESC đóng modal.
- Focus trap (tab không thoát ra nền).
- Focus initial vào input chính (PIN / field đầu).
- `aria-labelledby` và `aria-describedby`.

Hiện DeleteConfirmationModal đã khá tốt về UX flow, nhưng chưa thấy focus trap/ESC.

### 5.2. Toast
Toast hiện đặt top-center tốt. Khuyến nghị:
- Auto-dismiss theo type (success/info 2–4s), error 5–7s.
- `role="status"` cho success/info, `role="alert"` cho error.

### 5.3. Combobox/Dropdown
Transactions có combobox customer search.
- Hỗ trợ phím ↑ ↓ Enter Esc.
- Hiển thị trạng thái “Không tìm thấy khách hàng”.

### 5.4. DateInput
Hiện DateInput có mask nhưng feedback invalid chưa rõ.
- Khi user nhập sai, nên hiện viền đỏ + helper text “Ngày không hợp lệ (dd/mm/yyyy)”.
- Cho phép nhập partial nhưng blur phải “giữ lại” phần hợp lệ hoặc hướng dẫn.

---

## 6) Quy chuẩn nội dung (Microcopy)

### 6.1. Ngôn ngữ & thuật ngữ
- “Công nợ” vs “Nợ”: chọn 1 và dùng nhất quán.
- “Báo cáo” vs “Phân tích”: tách rõ.

### 6.2. Format tiền
- Dùng `toLocaleString('vi-VN')` đã tốt.
- Luôn hiển thị đơn vị `đ` nhất quán.

### 6.3. Format ngày
- UI nhập: dd/mm/yyyy (DateInput)
- Backend lưu: yyyy-mm-dd
- UI hiển thị: dd/mm/yyyy

Tài liệu hoá quy tắc này để tránh mix.

---

## 7) Review theo từng màn hình + đề xuất cải tiến

## 7.1. Login
**Hiện trạng**: nền gradient + glassmorphism đẹp.

**Cải tiến đề xuất**
- Thêm toggle “Hiện mật khẩu”.
- Khi lỗi đăng nhập: focus vào field lỗi, hiển thị message ngắn gọn.
- Button loading: disable + spinner (đã có isLoading).

## 7.2. Layout / Sidebar
**Hiện trạng**: sidebar collapse tốt; mobile header ok.

**Cải tiến đề xuất**
- Hiển thị “tên trang” trong header mobile (theo route) thay vì chỉ FastAccounting.
- Thêm trạng thái “active” rõ khi collapsed: tooltip đã có, tốt.
- Đồng bộ route + label (Overview/Reports/Analytics) để tránh nhầm.

## 7.3. Overview (Reports.jsx đang là Tổng quan)
**Hiện trạng**: summary cards đẹp; có search/sort; nút xuất PDF.

**Cải tiến đề xuất**
- Search box nên có placeholder “Tìm khách hàng…”.
- Sort headers có affordance rõ: clickable + hover.
- Ở mobile: table nên chuyển sang card list (mỗi khách 1 card) để đọc dễ.

## 7.4. Analytics
**Hiện trạng**: dùng recharts, card đẹp.

**Cải tiến đề xuất**
- Màu pie chart đang hardcode xanh/amber trong component; nên map theo semantics.
- Tooltip nên hiển thị format tiền `vi-VN` + đơn vị.

## 7.5. Customers
**Hiện trạng**: trang rất dài, nhiều modal/luồng (edit customer, xem transactions, edit tx, delete).

**Cải tiến đề xuất (ưu tiên cao)**
1. **Tách rõ 3 khu vực**
   - Header + CTA “Thêm khách hàng”
   - Search/filter bar
   - List khách hàng
2. **Card khách hàng**
   - Thống nhất layout: avatar/initial, tên, contact, tổng nợ (nếu có), action icons.
3. **Customer edit modal**
   - Khi edit, tab “Thông tin” và “Giao dịch” (hiện đang lồng rất nhiều nội dung) → giúp dễ hiểu.
4. **Transaction list trong modal**
   - Có filter nhanh (OPEN/PAID), sort theo ngày.
5. **Xoá**
   - DeleteConfirmationModal đang tốt; thêm nội dung “Bạn sẽ xoá: [Tên khách] + [số giao dịch liên quan]”.

## 7.6. CustomerDebtDetail
**Hiện trạng**: có filter ngày, bulk pay, preview/in. Group theo tháng.

**Cải tiến đề xuất**
- Filter bar (start/end) nên có nút “Reset” và preset “Tháng này / Năm này”.
- Bulk pay modal: thêm tóm tắt “Sẽ thanh toán: X giao dịch, tổng tiền Y”.
- Preview: cần UI chuẩn cho “Preview mode” (ẩn sidebar? dùng overlay full-screen?).

## 7.7. Transactions
**Hiện trạng**: rất nhiều state: filter theo customer, date range; combobox; quick create.

**Cải tiến đề xuất (ưu tiên rất cao)**
1. **Filter panel gọn**
   - Gom filter vào 1 card; trên mobile dùng accordion.
2. **Combobox chuẩn**
   - Keyboard nav, trạng thái empty, highlight match.
3. **Form tạo/sửa giao dịch**
   - Rõ ràng field bắt buộc: customer, type, amount, date.
   - Amount: format số, chặn ký tự không phải số.
4. **Bảng giao dịch**
   - Cột status (OPEN/PAID) dùng badge màu.
   - Row click mở detail/edit; icon actions vẫn giữ.

## 7.8. InterestConfigs
**Hiện trạng**: modal tạo/sửa đẹp.

**Cải tiến đề xuất**
- Rate: hiển thị “%/tháng” rõ ràng, validate min/max.
- Mã code: gợi ý format (VD `TIEN_MAT`).
- List configs: card/bảng với color scheme consistent.

---

## 8) Print/PDF UX

### 8.1. PrintableReport
PrintableReport hiện dùng A4 mm, Times New Roman (phù hợp in).

**Khuyến nghị**
- Chuẩn hoá header doanh nghiệp: hiện hardcode “ĐẠI LÝ CÔNG PHÚ”, SĐT. Nên đưa vào cấu hình (env hoặc settings) để tái sử dụng.
- Kiểm tra ngắt trang: `break-inside-avoid` đã có ở section; tốt.
- Tiền bằng chữ: đã có `readMoney()`, tốt.

### 8.2. Batch export
- Khi export: hiển thị tiến trình (x/y) và “có thể mất vài phút”.
- Sau export: toast success có đường dẫn folder (nếu có).

---

## 9) Consistency checklist (QA UI)

- [ ] Tất cả page có tiêu đề H1 + subtitle.
- [ ] Primary action đặt cùng vị trí (góc phải header).
- [ ] Mọi input có label + placeholder.
- [ ] Focus ring luôn thấy (không bị mất).
- [ ] Loading: không giật layout, có skeleton/list placeholder.
- [ ] Empty: có CTA.
- [ ] Error: message rõ, có “Thử lại”.
- [ ] Modal: ESC, focus trap, không scroll nền.
- [ ] Table: header sticky, số căn phải.
- [ ] Mobile: không overflow ngang, nút tối thiểu 44px.

---

## 10) Backlog ưu tiên (để đạt “UI hoàn chỉnh”)

### P0 — Làm ngay (giảm lỗi UX, tăng nhất quán)
1. Chuẩn hoá button/input/card classes (tạo “style constants” hoặc component nhỏ).
2. Chuẩn hoá loading/empty/error cho Customers, Transactions, Reports.
3. Modal accessibility: ESC + focus trap.
4. DateInput: hiển thị lỗi invalid rõ ràng.

### P1 — Nâng trải nghiệm (tối ưu thao tác)
1. Transactions combobox keyboard nav + empty state.
2. Customers: tách tab “Thông tin / Giao dịch” trong modal.
3. Debt detail: summary khi bulk pay + reset filters.

### P2 — Hoàn thiện polish
1. Mobile table → card layout cho Reports/Transactions.
2. Đồng bộ màu charts + tooltip format tiền.
3. Cấu hình hoá thông tin header in (tên đại lý, địa chỉ, SĐT).

---

## 11) Acceptance criteria (ví dụ để dev triển khai)

**A) DateInput invalid UX**
- Khi nhập ngày sai định dạng hoặc không tồn tại (31/02/2026), field hiển thị viền đỏ + helper text.
- Khi blur, nếu invalid: không push giá trị lên parent.

**B) Modal accessibility**
- Mở modal: focus vào element chính.
- ESC đóng modal.
- Tab không thoát ra ngoài modal.

**C) Transactions filter**
- Có thể lọc theo customer + date range.
- Trên mobile, filter không chiếm quá nhiều chiều cao, vẫn thao tác được.

---

## 12) Gợi ý triển khai kỹ thuật (không bắt buộc)

- Tạo các component “base” nhỏ trong `client/src/components/ui/`:
  - `Button`, `Input`, `Card`, `Badge`, `ModalShell`
- Hoặc giữ nguyên component hiện có và chỉ tạo `uiClasses.js` (export string className) để tránh refactor lớn.

---

Nếu bạn muốn, mình có thể tiếp tục **triển khai các cải tiến P0** trực tiếp trong code (chuẩn hoá button/input + modal ESC/focus trap + loading/empty states) theo đúng style Tailwind hiện tại.