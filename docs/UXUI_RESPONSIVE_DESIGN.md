# Thiết kế kỹ thuật — Responsive UX/UI cho `client/`

**Phạm vi:** chỉ `FastAccounting/client` (web app). Không đụng `client-tablet/` (bản đóng gói APK riêng).
**Ngày:** 2026-09-07 · **Trạng thái:** đã triển khai — xem §7 để biết phần nào đi lệch thiết kế và vì sao.

---

## 0. Ràng buộc

### 0.1 Vùng cấm sửa (PDF preview / print)

| Đường dẫn | Lý do |
|---|---|
| `client/src/components/PrintableReport.jsx` | markup A4 chuẩn của phiếu nợ |
| `client/src/components/PrintableAllTransactions.jsx` | markup A4 bản kê giao dịch |
| `client/src/index.css:55-64` (`@media print`) | reset print hiện hành |
| `api/utils/pdf.js`, `api/fonts/*` | sinh PDF phía server |

Mọi cải thiện liên quan tới preview/print phải nằm **bên ngoài** các file này: wrapper component mới, rule CSS `@media print` **mới** (thêm, không sửa block cũ).

### 0.2 Nguyên tắc "không phá vỡ cấu trúc component"

Responsive được đẩy xuống **token + class primitive + container**, không vào JSX của từng page.
Cụ thể: đổi `--field-h` một chỗ → toàn bộ form của 13 page tự đúng trên mobile/tablet mà không sửa một dòng JSX nào.

Chỉ 3 loại thay đổi được phép chạm vào page:

1. Thay chuỗi utility dài bằng 1 class primitive tương đương (thay thế 1–1, cây DOM không đổi).
2. Thêm/đổi prefix breakpoint trên class có sẵn.
3. Bọc thêm một container wrapper — không tách/gộp component.

---

## 1. Hiện trạng — kết quả audit

### 1.1 Hệ thống thiết kế bị đứt gãy

**F1. `tailwind.config.js` là dead config.**
`index.css:1` dùng `@import "tailwindcss"` (Tailwind v4). v4 **không** tự đọc file JS config nếu thiếu `@config`. Toàn bộ `theme.extend` (`fontFamily.heading/body`, `colors.primary/cta`, `spacing.18/22`, `zIndex.dropdown…toast`) đang bị bỏ qua.
Không class nào trong `src/` dùng tới chúng (`bg-primary`, `z-modal`, `font-heading` — 0 kết quả), nên chưa vỡ gì, nhưng file này đang đánh lừa người đọc.

**F2. Design system có nhưng không được dùng.**
`index.css` `@layer components` (dòng 73–1118) đã định nghĩa `.card`, `.input`, `.select`, `.textarea`, `.btn-*`, `.table-*`, `.badge-*`, `.modal-*`. Nhưng phần lớn page bỏ qua và viết inline:

- `Customers.jsx:750-757` — chuỗi 14 utility thay vì `.input`
- `Transactions.jsx:1069-1075`, `1090-1096`, `1226-1232` — tương tự

Hệ quả: chiều cao/cỡ chữ ô nhập khác nhau giữa các page → không thể chỉnh responsive tập trung.

**F3. `Modal.jsx` (192 dòng) là dead code** — không file nào import.
Thay vào đó có **13 modal viết tay** `fixed inset-0` rải ở 5 file:
`CustomerDebtDetail.jsx` ×4, `Transactions.jsx` ×4, `Customers.jsx` ×3, `InterestConfigs.jsx` ×1, `UserManagement.jsx` ×1.
Mỗi cái xử lý mobile theo cách riêng → không có một điểm để sửa.

### 1.2 Lỗi responsive cụ thể

**F4. `useZoom()` — `App.jsx:22-67`** set `document.body.style.zoom`.
`zoom` là thuộc tính phi chuẩn: nó làm sai gốc toạ độ của `position:fixed`, sai phép tính `dvh`, sai `getBoundingClientRect()` mà popover đang dựa vào. Listener `wheel` đăng ký `{ passive:false }` + `preventDefault()` → chặn momentum scroll trên trackpad/touch.

**F5. iOS Safari auto-zoom khi focus ô nhập.**
`.input` (`index.css:150`) dùng `text-sm` = 14px. iOS zoom màn hình mỗi khi focus input có `font-size < 16px`. `index.html:9` để `maximum-scale=5.0, user-scalable=yes` nên iOS được phép zoom → **mỗi lần chạm ô nhập là màn hình nhảy**, và không tự zoom lại.

**F6. Khóa scroll nền khi mở modal không hoạt động.**
`a11y.js:136 preventBodyScroll()` set `document.body.style.overflow='hidden'`, nhưng `index.css:45-53` đã đặt `html, body, #root { overflow: hidden }` từ trước; scroller thật là `<div>` trong `Layout.jsx:280`. Set lại `body` là no-op.

**F7. `max-h-[90vh]` trong 5 modal** (`Transactions.jsx:1002`, `Customers.jsx:433,668,828`, …).
Trên mobile, `vh` **không co lại** khi bàn phím ảo bật → footer và nút submit bị đẩy khuất dưới bàn phím.

**F8. 3 bảng không có card fallback cho mobile.**

| File | Bảng | Số cột | Mobile view |
|---|---|---|---|
| `CustomerDebtDetail.jsx:715` | giao dịch theo tháng | 8 | ❌ scroll ngang |
| `Reports.jsx:236` | công nợ theo khách | 7 (`min-w-[1000px]`) | ❌ scroll ngang |
| `UserManagement.jsx:230` | user | 4 | ❌ scroll ngang |
| `Transactions.jsx:1465 / 1557` | giao dịch | 8 | ✅ nhưng **markup lặp 2 lần** |

**F9. Popover DatePicker tràn và bị cắt.**
`DatePicker.jsx:126` — popover `position:absolute`, `min-w-[320px]`. Trong `.date-range-inline` có 2 picker `flex-1`; ở màn 375px mỗi ô ≈ 150px → popover 320px tràn mép phải. `Layout.jsx:280` có `overflow-x-hidden` nên popover bị **cắt cụt**, người dùng không scroll tới được. Cùng lỗi ở combobox khách hàng (`Transactions.jsx:913`, `1111`).

**F10. Toast tràn ở màn hẹp.**
`Toast.jsx:43` container `fixed top-4 left-1/2 -translate-x-1/2` không có padding hai bên; `Toast.jsx:48` panel `min-w-[320px]` → tràn ở 320–360px.

**F11. Grid cứng trong modal.**
`grid grid-cols-2` (`Transactions.jsx:1064`, `1252`; `Customers.jsx:743`) và `grid grid-cols-4` (`Transactions.jsx:1209`) không có prefix breakpoint. Ở 375px, 4 nút loại giao dịch với nhãn tiếng Việt + `whitespace-nowrap` → chữ tràn khỏi nút.

**F12. Header trang chi tiết công nợ ép chật.**
`CustomerDebtDetail.jsx:352` dùng `flex flex-row` (không có `flex-col` cho mobile) chứa tiêu đề + 4 nút hành động ("Thanh toán", "In Phiếu Nợ", "Tải PDF", "In tất cả GD").

**F13. Safe-area chưa phủ.**
Chỉ sidebar có `env(safe-area-inset-bottom)` (`Layout.jsx:201`). Header mobile, modal, toast chưa có. `index.html:9` thiếu `viewport-fit=cover`.

**F14. Tablet không có chiến lược riêng.**

- iPad portrait (768/834px) → rơi vào `md`: có bảng desktop nhưng nav vẫn là drawer ⇒ mỗi lần điều hướng tốn 2 chạm.
- iPad landscape (1194px) → rơi vào `lg`: nhận **toàn bộ** style desktop kể cả `hover:` và nút cao 40px, trong khi đây là thiết bị cảm ứng (khuyến nghị ≥44px).
- Không có điều kiện `(pointer: coarse)` ở bất kỳ đâu trong codebase.

### 1.3 Print / PDF — ranh giới hiện tại

**F15. Preview A4 tràn trên mobile.**
`PrintableReport.jsx:19` cố định `max-w-[210mm] min-h-[297mm]` (≈794px). Vùng preview (`CustomerDebtDetail.jsx:564`) là `p-8 flex justify-center` — không scale. Ở 375px, khối 794px tràn ngang và bị cắt.
→ Sửa **không đụng file cấm**: bọc bằng wrapper có `transform: scale()`.

**F16. `@media print` tối giản.**
`index.css:55-64` chỉ reset `height/overflow/overscroll-behavior` cho `html, body, #root`. Không có `@page`, không có quy ước `.no-print`. Giữ nguyên; chỉ **thêm** rule mới cho UI mới.

---

## 2. Kiến trúc responsive đề xuất

### 2.1 Ba tầng

```
Tầng 3 — Pattern     DataTable · AppModal · PrintPreviewFrame · Toolbar
                     (component MỚI, thêm chứ không sửa cái cũ)
        ▲
Tầng 2 — Primitive   .card .input .btn-* .table-* .modal-* .toolbar .sheet
                     (@layer components — JSX không đổi khi sửa)
        ▲
Tầng 1 — Token       breakpoint · --field-h · --field-fs · --tap-min · --gutter · z-index
                     (@theme + :root, một điểm điều khiển duy nhất)
```

Toàn bộ quyết định responsive nằm ở tầng 1 và 2. Tầng 3 chỉ tồn tại cho hai thứ mà CSS thuần không làm được: đổi *hình thái* bảng (table ↔ card) và scale preview theo bề rộng đo được.

### 2.2 Breakpoint contract

Giữ nguyên các mốc mặc định Tailwind (không đổi để code cũ không vỡ), nhưng **đặt vai trò rõ ràng**:

| Mốc | px | Thiết bị đại diện | Vai trò layout |
|---|---|---|---|
| base | <640 | phone portrait | 1 cột · card list · drawer + bottom tab · modal = bottom sheet |
| `sm` | ≥640 | phone landscape | toolbar xếp ngang · modal = dialog |
| `md` | ≥768 | iPad portrait (768/834) | bảng rút gọn (cột priority 1–2) · sidebar **rail** 72px |
| `lg` | ≥1024 | iPad landscape / laptop | bảng đầy đủ · sidebar cố định 224px |
| `xl` | ≥1280 | desktop | KPI 4 cột · sidebar 240px |
| `2xl` | ≥1536 | màn lớn | giữ `max-w-[1400px]` hiện có |

**Hai media feature độc lập với bề rộng** — đây là mảnh còn thiếu của bài toán tablet:

```css
@media (pointer: coarse) { /* tăng vùng chạm, cỡ chữ ô nhập */ }
@media (hover: hover)    { /* CHỈ khi đó mới bật hover state */ }
```

iPad landscape 1194px hiện đang ăn full style desktop kể cả `hover:`. Bọc mọi hover trong `@media (hover: hover)` sửa được điều này ở tầng CSS, JSX không đổi.

### 2.3 Container query cho khối lặp

Thẻ khách hàng, thẻ KPI, thẻ chart phản ứng theo bề rộng **của chính nó**, không theo viewport. Tailwind v4 có `@container` sẵn.

Lý do: cùng một thẻ KPI xuất hiện ở grid 4 cột (desktop), grid 2 cột (tablet), và trong modal. Media query trả lời sai ở trường hợp thứ ba; container query luôn đúng. Cũng đúng khi người dùng thu/mở sidebar — viewport không đổi nhưng vùng nội dung đổi 168px.

```jsx
<section className="@container reports-page__kpi-grid">
  <article className="reports-page__kpi-card">…</article>
</section>
```

```css
.reports-page__kpi-value { font-size: 1.125rem; }
@container (min-width: 22rem) {
  .reports-page__kpi-value { font-size: 1.5rem; }
}
```

### 2.4 Tầng token — viết vào `index.css`, xóa `tailwind.config.js`

```css
@import "tailwindcss";

@theme {
  --font-heading: 'Poppins', system-ui, sans-serif;
  --font-body:    'Open Sans', system-ui, sans-serif;

  --color-primary:       #2563EB;
  --color-primary-hover: #1D4ED8;
  --color-cta:           #F97316;
  --color-cta-hover:     #EA580C;
}

:root {
  /* Chiều cao chạm & ô nhập — đổi theo LOẠI CON TRỎ, không theo bề rộng */
  --tap-min:  40px;
  --field-h:  40px;
  --field-fs: 0.875rem;   /* 14px */
  --gutter:   0.75rem;
  --modal-max-h: 90dvh;
}

/* Thiết bị cảm ứng: phone + MỌI tablet, kể cả iPad landscape 1194px */
@media (pointer: coarse) {
  :root {
    --tap-min:  44px;
    --field-h:  48px;
    --field-fs: 1rem;     /* 16px — chặn iOS auto-zoom (F5) */
  }
}

@media (min-width: 640px)  { :root { --gutter: 1rem; } }
@media (min-width: 1024px) { :root { --gutter: 1.5rem; } }
```

Rồi các primitive tiêu thụ token:

```css
@layer components {
  .input, .select, .textarea, .input-filter {
    min-height: var(--field-h);
    font-size:  var(--field-fs);
  }
  .btn-primary, .btn-secondary, .btn-danger, .btn-success, .btn-ghost {
    min-height: var(--tap-min);
  }
  .icon-btn, .filter-clear-btn {
    min-width:  var(--tap-min);
    min-height: var(--tap-min);
  }
}
```

**Đây là đòn bẩy chính của cả thiết kế.** Ba dòng token giải quyết F5 (iOS auto-zoom) và F14 (vùng chạm tablet) cho toàn bộ 13 page, JSX không đổi một ký tự — với điều kiện F2 đã được dọn (page dùng `.input` thay vì chuỗi inline).

### 2.5 Kiến trúc scroll (giải F6 tận gốc)

Hiện: `html, body, #root { overflow: hidden }`, scroller là `<div>` lồng trong Layout. Kiểu app-shell này đúng cho desktop nhưng gây 3 vấn đề trên mobile:

- Safari/Chrome không tự ẩn address bar → mất ~60px chiều cao vĩnh viễn.
- `preventBodyScroll()` vô hiệu (F6).
- `position: sticky` của `<thead>` (`Transactions.jsx:1560`) tính sai gốc.

Đề xuất — **trả scroll về document ở dưới `lg`**, giữ app-shell từ `lg` trở lên:

```css
@media (max-width: 63.9375rem) {
  html, body, #root { height: auto; overflow: visible; }
}
```

Sidebar ở `<lg` đã là `position: fixed` (`Layout.jsx:124`) nên không ảnh hưởng. Header mobile (`Layout.jsx:254`) chuyển `sticky top-0`.
Thay đổi khoanh gọn trong `Layout.jsx` + `index.css`, không lan ra page nào.

### 2.6 Pattern — `DataTable` (giải F8)

Bảng và card **sinh ra từ cùng một định nghĩa cột**, không viết markup 2 lần như `Transactions.jsx` đang làm.

```jsx
// client/src/components/DataTable.jsx  (MỚI — không sửa file nào có sẵn)
<DataTable
  rows={report}
  getRowKey={(r) => r.customer_id}
  onRowClick={openDetail}
  columns={[
    { id: 'name',      header: 'Khách hàng',    priority: 1, align: 'left',  cell: r => r.customer_name },
    { id: 'debt',      header: 'Còn nợ',        priority: 1, align: 'right', cell: r => money(r.total_debt) },
    { id: 'collected', header: 'Đã thanh toán', priority: 2, align: 'right', cell: r => money(r.total_collected) },
    { id: 'interest',  header: 'Tổng lãi',      priority: 3, align: 'right', cell: r => money(r.total_interest) },
  ]}
/>
```

| `priority` | <768 (card) | 768–1023 | ≥1024 |
|---|---|---|---|
| 1 | dòng tiêu đề của card | cột | cột |
| 2 | cặp nhãn–giá trị trong card | cột | cột |
| 3 | trong phần "Chi tiết" (mở rộng) | ẩn | cột |

- `<768px`: render danh sách card — cột priority 1 đầu tiên làm tiêu đề, phần còn lại thành cặp nhãn–giá trị.
- `≥768px`: render `<table>`; mỗi `<th>/<td>` gắn class ẩn/hiện theo `priority` (CSS thuần, không remount).

**Lợi ích:** xóa ~90 dòng markup mobile lặp trong `Transactions.jsx`, và 3 bảng còn lại (F8) có mobile view mà không phải viết thêm markup.

**Cách di trú an toàn:** làm từng page, mỗi page phải cho ra kết quả **thị giác không đổi ở ≥1024px** trước khi merge. Thứ tự: `Reports` → `UserManagement` → `CustomerDebtDetail` → `Transactions` (cuối, vì phức tạp nhất).

### 2.7 Pattern — `AppModal` (giải F3, F6, F7)

Hồi sinh `Modal.jsx` (đang chết) thành `AppModal`, rồi di trú 13 modal viết tay về nó.

```css
.modal-panel {
  max-height: min(var(--modal-max-h), 100dvh - 2rem);
  padding-bottom: env(safe-area-inset-bottom);
}

/* nút submit không bị bàn phím che (F7) */
.modal-footer { position: sticky; bottom: 0; }

/* <640px → bottom sheet */
@media (max-width: 39.9375rem) {
  .modal-panel {
    margin-top: auto;
    width: 100%;
    max-height: 92dvh;
    border-radius: 1.25rem 1.25rem 0 0;
  }
}
```

- `dvh` thay `vh` → co đúng khi bàn phím ảo bật.
- Scroll lock: khóa `#app-scroll` (scroller thật) hoặc — nếu §2.5 đã áp dụng — `preventBodyScroll()` tự nhiên hoạt động đúng.
- `<640px` modal thành bottom sheet; `≥640px` giữ dialog giữa như hiện tại.

### 2.8 Pattern — `PrintPreviewFrame` (giải F15, **không đụng file cấm**)

```jsx
// client/src/components/PrintPreviewFrame.jsx  (MỚI)
// Đo bề rộng khả dụng, scale = min(1, width / 794)   // 794px = 210mm @96dpi
<PrintPreviewFrame>
  <PrintableReport ref={printRef} … />   {/* NGUYÊN VẸN — ref vẫn nằm trên nó */}
</PrintPreviewFrame>
```

```css
.print-preview-frame        { overflow: auto; }
.print-preview-frame__scale { transform: scale(var(--pv-scale, 1)); transform-origin: top center; }

/* Rule MỚI — không sửa block @media print ở index.css:55-64 */
@media print {
  .print-preview-frame        { overflow: visible !important; }
  .print-preview-frame__scale { transform: none !important; }
}
```

**Ràng buộc bắt buộc:** `printRef` phải tiếp tục trỏ vào `PrintableReport`, **không** vào wrapper. `react-to-print` clone node của ref → transform của wrapper không lọt vào bản in. Wrapper không được nhận ref, không được thêm class lên con.

Bổ sung: thanh zoom `−` / `100%` / `+` để xem chi tiết trên tablet — thuộc wrapper, không thuộc component in.

**Kiểm thử bắt buộc:** in ra PDF trước và sau thay đổi, so pixel-diff. Khác 1 pixel ⇒ revert.

### 2.9 Popover thoát khỏi vùng bị cắt (giải F9)

`DatePicker` và combobox khách hàng chuyển sang:

- **≥640px:** portal ra `document.body`, `position: fixed`, toạ độ tính từ anchor, có flip khi chạm mép — thoát khỏi `overflow-x-hidden` của `Layout.jsx:280`.
- **<640px:** popover trở thành **bottom sheet full-width** (dùng lại `.sheet` của §2.7) — hết tràn, và lịch tháng đủ chỗ để chạm.

Kèm theo: `main` đổi `overflow-x-hidden` → `overflow-x-clip` (không tạo containing block cho `position: fixed`).

### 2.10 Điều hướng

| Mốc | Nav |
|---|---|
| <768 | drawer (giữ nguyên) **+ bottom tab bar 5 mục**: Tổng quan · Giao dịch · Khách hàng · Báo cáo · Thêm |
| 768–1023 | **sidebar rail 72px** (icon-only, có tooltip) thay drawer |
| ≥1024 | giữ nguyên hiện tại |

- Bottom tab: mọi điều hướng chính từ 2 chạm (mở drawer → chọn) xuống **1 chạm**. `padding-bottom: env(safe-area-inset-bottom)`.
- Rail tablet: `Layout.jsx` đã có sẵn state `isSidebarOpen` / `navCollapsed` và nhánh render collapsed — chỉ cần thêm điều kiện breakpoint, không thêm cấu trúc mới.

### 2.11 Typography theo `clamp()`

Bỏ nhảy bậc `lg:text-2xl` rải rác; tablet 834px nhận cỡ trung gian đúng thay vì nhảy nấc:

```css
.section-title           { font-size: clamp(1.125rem, 1rem   + 0.6vw, 1.5rem); }
.reports-page__kpi-value { font-size: clamp(1.125rem, 0.9rem + 1.0vw, 1.5rem); }
```

---

## 3. Kế hoạch triển khai

| Phase | Nội dung | Rủi ro | Giao diện đổi? |
|---|---|---|---|
| **0. Nền** | `tailwind.config.js` → `@theme` trong `index.css` (xóa file cũ) · thêm token §2.4 · gỡ `useZoom()` (`App.jsx:22-67`) · sửa viewport meta: thêm `viewport-fit=cover`, bỏ `maximum-scale` (giữ `user-scalable=yes` cho a11y) | thấp | không |
| **1. Primitive** | `.input/.select/.textarea/.btn-*/.table-*` dùng token · thêm `.modal-panel`, `.sheet`, `.toolbar` · bọc **mọi** hover state trong `@media (hover: hover)` · `clamp()` cho typography | thấp | chỉ mobile/tablet |
| **2. Shell** | kiến trúc scroll §2.5 · bottom tab bar · rail tablet · safe-area cho header/modal/toast · fix Toast `min-w` (F10) | trung bình | có, ở <1024 |
| **3. Pattern** | `DataTable` · `AppModal` · `PrintPreviewFrame` · portal popover | trung bình | không (component mới) |
| **4. Di trú page** | `Reports` → `UserManagement` → `CustomerDebtDetail` → `Customers` → `InterestConfigs` → `Transactions`. Mỗi page: thay inline utility bằng primitive, gắn `DataTable`/`AppModal`, sửa grid cứng (F11), header (F12) | trung bình–cao | có |
| **5. Verify** | ma trận thiết bị §4 · print regression · CI guard §5 | — | — |

Phase 0–1 nên đi chung một PR: chúng vô hại và đã giải quyết F1, F4, F5, F14 — phần lớn "đau" trên mobile/tablet.

---

## 4. Ma trận kiểm thử

**Bề rộng:** 320 · 375 · 390 · 414 · 768 (iPad portrait) · 834 (iPad Pro 11″ portrait) · 1024 · 1194 (iPad Pro landscape) · 1280 · 1440 · 1920

**Trục phụ:** portrait/landscape · `pointer: coarse` vs `fine` · bàn phím ảo bật/tắt · zoom trình duyệt 100%/125%/150%

**Route:** `/login` `/overview` `/transactions` `/customers` `/customers/:id/debt` `/interest-configs` `/reports` `/users` `/backup-data` `/settings` `/bank-account-config` `/info` `/guide`

**Trạng thái mỗi route:** loading · empty · error · có dữ liệu · modal mở · popover mở

---

## 5. Definition of Done & hàng rào bảo vệ PDF

### 5.1 Checklist nghiệm thu

- [ ] `document.documentElement.scrollWidth <= window.innerWidth` ở **mọi route × mọi bề rộng** trong §4
- [ ] Khi `pointer: coarse`, mọi phần tử tương tác có hộp chạm ≥ 44×44px
- [ ] Trên iOS, focus ô nhập **không** làm màn hình zoom
- [ ] Nút submit của modal luôn nhìn thấy khi bàn phím ảo bật
- [ ] Mở modal ⇒ nền không scroll
- [ ] Popover lịch/combobox không bị cắt ở 320px
- [ ] Không có hover-only affordance trên thiết bị cảm ứng
- [ ] **Bản in/PDF khớp 100% với baseline trước thay đổi**

### 5.2 CI guard

```js
// e2e/no-horizontal-overflow.spec.js
for (const w of [320, 375, 768, 834, 1024, 1194, 1440]) {
  for (const route of ROUTES) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.goto(route);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth
    );
    expect(overflow, `${route} @ ${w}px`).toBeLessThanOrEqual(0);
  }
}
```

### 5.3 Khóa vùng PDF

Thêm pre-commit hook / CODEOWNERS chặn diff vào:

```
client/src/components/PrintableReport.jsx
client/src/components/PrintableAllTransactions.jsx
api/utils/pdf.js
api/fonts/**
```

và cảnh báo khi diff chạm `client/src/index.css` trong khoảng `@media print` hiện hành.

---

## 6. Bảng truy vết finding → giải pháp

| # | Finding | Giải bởi | Phase |
|---|---|---|---|
| F1 | `tailwind.config.js` dead | §2.4 `@theme` | 0 |
| F2 | Inline utility thay primitive | §2.4 + di trú page | 1, 4 |
| F3 | 13 modal viết tay, `Modal.jsx` chết | §2.7 `AppModal` | 3, 4 |
| F4 | `useZoom()` phá layout | gỡ bỏ | 0 |
| F5 | iOS auto-zoom ô nhập | §2.4 `--field-fs: 1rem` @ coarse | 0–1 |
| F6 | Scroll lock vô hiệu | §2.5 kiến trúc scroll | 2 |
| F7 | `max-h-[90vh]` + bàn phím | §2.7 `dvh` + sticky footer | 3 |
| F8 | 3 bảng không có card view | §2.6 `DataTable` | 3, 4 |
| F9 | Popover bị cắt | §2.9 portal + sheet | 3 |
| F10 | Toast tràn 320px | §3 phase 2 | 2 |
| F11 | `grid-cols-2/4` cứng | di trú page | 4 |
| F12 | Header `flex-row` chật | di trú page | 4 |
| F13 | Safe-area chưa phủ | §3 phase 2 | 2 |
| F14 | Tablet không có chiến lược | §2.2 `pointer/hover` + §2.10 rail | 1–2 |
| F15 | Preview A4 tràn mobile | §2.8 `PrintPreviewFrame` | 3 |
| F16 | `@media print` tối giản | chỉ thêm rule mới | 3 |

---

## 7. Trạng thái triển khai

### 7.1 Bảng truy vết — kết quả

| # | Mức | Trạng thái | Ghi chú |
|---|---|---|---|
| F4 | cao | ✅ | Gỡ `useZoom()` khỏi `App.jsx` |
| F5 | cao | ✅ | Token `--field-fs` + rule không-layer ép mọi ô nhập ≥16px khi `pointer: coarse`. Đo lại: **0 ô dưới 16px** |
| F7 | cao | ✅ | Ghi đè `@supports` chuyển mọi `max-h-[90vh]`/`[80vh]`/`h-[90vh]` sang `dvh` — sửa cả 5 modal, **không đụng JSX** |
| F8 | cao | ✅ | `DataTable` dùng ở `Reports`, `UserManagement`, `CustomerDebtDetail` |
| F9 | cao | ✅ | `Popover` portal ra body; dưới 640px thành bottom sheet |
| F14 | cao | ✅ | Rail 72px ở 768–1023 · bottom tab dưới 768 · token theo `pointer: coarse` |
| F15 | cao | ✅ | `PrintPreviewFrame`; xác minh **0 rule `@media print` khớp vào 397 node** của `PrintableReport` |
| F2 | tb | ◐ | Xem 7.2 |
| F3 | tb | ◐ | Xem 7.2 |
| F6 | tb | ◐ | Xem 7.2 |
| F11 | tb | ✅ | Grid trong modal đã có breakpoint; nút loại giao dịch xuống 2×2 ở mobile |
| F12 | tb | ✅ | Header xếp dọc, nút hành động grid 2 cột ở mobile |
| F13 | tb | ✅ | Safe-area cho header, sidebar, tabbar, bottom sheet, overlay modal |
| F1 | thấp | ✅ | Xóa `tailwind.config.js` → `@theme`. CSS build **giữ nguyên hash**, chứng minh config vốn đã bị bỏ qua |
| F10 | thấp | ✅ | `.toast-viewport` giới hạn `min(28rem, 100vw - 1.5rem)` |
| F16 | thấp | ✅ | Chỉ thêm rule mới, block gốc `index.css:55-64` nguyên vẹn |

### 7.2 Ba chỗ đi lệch thiết kế — và lý do

**F6 — không tái kiến trúc scroll.**
Thiết kế đề xuất trả scroll về document ở dưới `lg`. Thay vào đó chỉ sửa đúng khiếm khuyết: `preventBodyScroll()` giờ khóa `#app-scroll` (scroller thật), và hook `useScrollLock` được gắn vào toàn bộ modal.
*Vì sao:* khiếm khuyết người dùng thấy được là "mở modal mà nền vẫn cuộn" — cách này sửa trọn vẹn với vài dòng, trong khi đổi kiến trúc app-shell là thay đổi rủi ro nhất trong cả kế hoạch. **Đánh đổi:** chưa lấy được lợi ích address bar tự ẩn trên Safari/Chrome mobile.

**F3 — chưa di trú 13 modal sang `AppModal`.**
Hai khiếm khuyết chức năng của chúng (khóa scroll, `vh` gặp bàn phím) đã được xử lý ở tầng dưới nên không còn lỗi. Phần còn lại thuần về khả năng bảo trì.
*Vì sao:* viết lại 13 modal đang chạy tốt để đổi lấy sự gọn gàng là rủi ro không tương xứng trong cùng một đợt.

**F2 — chỉ thay primitive ở nơi đáng thay.**
Phần chức năng (16px trên iOS, vùng chạm) đã được giải bằng rule không-layer, áp dụng cho **mọi** ô nhập bất kể có dùng `.input` hay không. Chỉ các nút ở `Settings` được đổi sang `.btn-*`.
*Vì sao:* `.input` là nền trắng viền `slate-200` bo `lg`, còn form hiện tại là nền `slate-50` viền `slate-100` bo `xl` `shadow-inner`. Thay đồng loạt là **đổi thiết kế thị giác của form**, không phải sửa responsive — đó là quyết định của bạn, không phải của tôi.

### 7.3 Khác biệt nhỏ so với bản thiết kế

- **`DataTable` priority 3 trên mobile:** hiển thị như cặp nhãn–giá trị bình thường, không giấu sau mục "Chi tiết" mở rộng. Giấu số liệu công nợ sau một cú chạm là bất lợi cho người dùng kế toán.
- **`Transactions` chưa dùng `DataTable`:** trang này vốn đã có card view riêng và là chỗ phức tạp nhất; giữ nguyên, chỉ sửa grid và vùng chạm. Markup thẻ vẫn còn lặp — đây là món nợ kỹ thuật còn lại của F8.

### 7.4 Hai lỗi phát hiện thêm trong lúc làm

- **`.input-icon` bị vô hiệu:** khai báo *trước* `.input-filter`, nên `px-3` của `.input-filter` đè mất `pl-10` → icon kính lúp chồng lên placeholder ở mọi ô tìm kiếm. Đã khai báo lại sau để thắng theo thứ tự nguồn.
- **`PrintPreviewFrame` vòng lặp bề rộng:** đo bề rộng nội dung trong khi nội dung lại co theo khung đã scale → bản xem trước dồn chữ một từ mỗi dòng, không giống bản in. Đã khóa bề rộng bằng hằng số khổ A4 (794px) và chỉ đo chiều cao.

### 7.5 Kiểm chứng đã chạy

- **Không tràn ngang:** 12 route × 320/375/768/834/1194/1440 → `scrollWidth - innerWidth === 0` ở mọi tổ hợp.
- **Vùng chạm khi `pointer: coarse`:** từ 43 phần tử dưới 44px xuống còn **1** — link breadcrumb dạng chữ inline, thuộc diện miễn trừ của WCAG 2.5.8.
- **Cỡ chữ ô nhập:** 0 ô dưới 16px.
- **Bản in:** 0/6 rule `@media print` khớp vào cây `PrintableReport`; `printRef` vẫn trỏ đúng component, `transform: none`, class gốc `bg-white p-8 max-w-[210mm] mx-auto min-h-[297mm] text-base` không đổi.
- **Lint:** so với `HEAD`, toàn repo chỉ tăng **1** finding — cùng false-positive `'Icon' is defined but never used` như `NavItem` sẵn có.
- **Build:** `vite build` sạch.

> Kiểm chứng chạy trên **mock API cục bộ**, không kết nối MongoDB Atlas thật. Cần chạy lại đối chiếu bản in với dữ liệu thật trước khi phát hành.
