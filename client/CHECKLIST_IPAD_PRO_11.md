# Checklist Cập Nhật UI cho iPad Pro 11"

> **Mục tiêu**: Tối ưu toàn bộ UI frontend cho iPad Pro 11" (834×1194 portrait, 1194×834 landscape) với trải nghiệm touch tốt, không tràn màn hình, và tương thích Split View.

---

## 📋 Tổng Quan

### Thông Số Thiết Bị
- **iPad Pro 11" Portrait**: 834 × 1194px
- **iPad Pro 11" Landscape**: 1194 × 834px
- **Split View (1/2)**: ~600px width
- **Touch Target Minimum**: 44×44px
- **Input Font Size**: ≥16px (tránh iOS auto-zoom)

### Breakpoints Hiện Tại
- Mobile: < 768px
- Tablet: 768px - 1023px (iPad Pro 11" nằm trong range này)
- Desktop: ≥ 1024px

---

## 🎯 Phase 1: Foundation & Layout

### 1.1 Layout Component (`components/Layout.jsx`)

#### Sidebar Navigation
- [x] **Đã hoàn thành**: Sidebar tự động collapse trên tablet (768-1023px)
- [x] **Đã hoàn thành**: Sidebar collapsed có tooltip khi hover vào icon (title attribute)
- [x] **Đã hoàn thành**: Khoảng cách giữa các nav items đủ rộng (space-y-2 = 8px) cho touch
- [x] **Đã hoàn thành**: Nav items có min-height 44px trên tablet (md:min-h-[44px])
- [x] **Đã hoàn thành**: User profile section ở footer sidebar có touch target đủ lớn (md:min-w-[44px] md:min-h-[44px])
- [x] **Đã hoàn thành**: Toggle button sidebar (ChevronLeft/Right) có min 44×44px

#### Main Content Area
- [x] **Đã hoàn thành**: Padding content area trên tablet:
  - Portrait: `md:p-5` (không quá rộng như desktop `lg:p-8`)
  - Landscape: `lg:p-8` (tận dụng không gian ngang)
- [x] **Đã hoàn thành**: Content không bị che bởi sidebar khi collapsed
- [x] **Đã hoàn thành**: Max-width content trên tablet landscape để tránh quá rộng (max-w-[1600px] md:mx-auto)

#### Mobile Header
- [x] **Đã hoàn thành**: Mobile header chỉ hiện trên < 768px
- [ ] **Kiểm tra**: Safe area insets hoạt động đúng trên iPad

---

### 1.2 Global Styles (`src/index.css`)

#### Buttons
- [x] **Đã hoàn thành**: `.btn-md` có `md:min-h-[44px]` và `md:text-base`
- [x] **Đã hoàn thành**: `.btn-lg` có `md:min-h-[44px]`
- [ ] **Kiểm tra**: Tất cả buttons trong app đều dùng class `.btn-md` hoặc `.btn-lg`
- [ ] **Tối ưu**: Icon buttons (`.icon-btn`) có min 44×44px trên tablet

#### Inputs
- [x] **Đã hoàn thành**: `.input` có `md:text-base` (≥16px) và `md:py-3`
- [ ] **Kiểm tra**: Tất cả inputs đều dùng class `.input` hoặc có font-size ≥16px
- [ ] **Tối ưu**: DateInput component có font-size ≥16px trên tablet
- [ ] **Kiểm tra**: Textarea có padding đủ lớn cho touch

#### Typography
- [x] **Đã hoàn thành**: Section titles trên tablet:
  - Portrait: `md:text-2xl` (24px)
  - Landscape: `lg:text-3xl` (30px)
- [x] **Đã hoàn thành**: Body text không quá nhỏ (< 14px) trên tablet (đã kiểm tra)

---

## 📄 Phase 2: Pages - Transactions

### 2.1 Transactions List Page (`pages/Transactions.jsx`)

#### Header & Filters
- [x] **Đã hoàn thành**: Header section layout trên tablet:
  - Portrait: Stack vertical (`flex-col`)
  - Landscape: Horizontal (`md:flex-row`)
- [x] **Đã hoàn thành**: Date range filter:
  - Portrait: Full width, stack vertical
  - Landscape: Inline với gap hợp lý
  - DateInput có font-size ≥16px trên tablet (md:text-base)
- [x] **Đã hoàn thành**: Customer search combobox:
  - Min-width trên tablet: `md:min-w-[300px]`
  - Dropdown có max-height và scroll mượt
- [x] **Đã hoàn thành**: "Tạo Giao Dịch" button có min-height 44px (btn-md class)

#### Transaction Table (Desktop View)
- [x] **Đã hoàn thành**: Table columns trên tablet:
  - Portrait: Table có scroll ngang có kiểm soát
  - Landscape: Hiển thị đầy đủ nhưng với font-size hợp lý
- [x] **Đã hoàn thành**: Table min-width:
  - Portrait: `md:min-w-[800px]` (cho phép scroll ngang có kiểm soát)
  - Landscape: `lg:min-w-[1000px]`
- [x] **Đã hoàn thành**: Action buttons trong table (status toggle) có min 44×44px (md:min-h-[44px] md:px-3 md:py-2)
- [x] **Đã hoàn thành**: Sticky header table không che content

#### Mobile Card View
- [x] **Đã hoàn thành**: Card view cho mobile (< md)
- [ ] **Kiểm tra**: Cards có padding đủ lớn cho touch
- [ ] **Tối ưu**: Status badge có touch target đủ lớn

#### Transaction Form Modal
- [x] **Đã hoàn thành**: Modal size trên tablet:
  - Portrait: Full width với padding hợp lý
  - Landscape: Max-width `md:max-w-2xl lg:max-w-2xl` (không quá rộng)
- [x] **Đã hoàn thành**: Form layout:
  - Portrait: 1 cột cho tất cả fields
  - Landscape: 2 cột cho Date & Customer (lg:grid-cols-2), 1 cột cho Content
- [x] **Đã hoàn thành**: Transaction type buttons grid:
  - Portrait: `grid-cols-2`
  - Landscape: `md:grid-cols-3 lg:grid-cols-5`
- [x] **Đã hoàn thành**: Amount input có font-size lớn (text-3xl) nhưng vẫn readable
- [x] **Đã hoàn thành**: Status toggle button có min-height 60px
- [x] **Đã hoàn thành**: Form footer buttons (Hủy, Lưu) có spacing đủ lớn
- [x] **Đã hoàn thành**: Image picker modal responsive

#### Image Detail Modal
- [ ] **Kiểm tra**: Image viewer có controls dễ chạm:
  - Zoom in/out buttons: min 44×44px
  - Rotate button: min 44×44px
  - Download button: min 44×44px
- [ ] **Tối ưu**: Toolbar ở top có spacing đủ lớn giữa các buttons
- [ ] **Kiểm tra**: Pan/drag gesture hoạt động mượt trên touch

---

### 2.2 Customers Page (`pages/Customers.jsx`)

#### Header & Search
- [x] **Đã hoàn thành**: Header layout:
  - Portrait: Stack vertical (`flex-col`)
  - Landscape: Horizontal (`md:flex-row`) với gap hợp lý
- [x] **Đã hoàn thành**: Search input:
  - Portrait: Full width
  - Landscape: `md:w-auto md:flex-1 md:max-w-xs`
- [x] **Đã hoàn thành**: "Thêm Khách Hàng" button có min-height 44px (btn-md class)

#### Customer Grid
- [ ] **Tối ưu**: Grid layout:
  - Portrait: `grid-cols-1 sm:grid-cols-2` (2 cột)
  - Landscape: `md:grid-cols-2 lg:grid-cols-4` (4 cột)
- [ ] **Kiểm tra**: Card spacing (gap) đủ lớn: `gap-4 md:gap-5 lg:gap-6`
- [ ] **Tối ưu**: Customer cards:
  - Min-height hợp lý để không quá nhỏ
  - Padding đủ lớn: `p-6`
  - Touch target cho toàn bộ card (onClick)

#### Customer Form Modal
- [x] **Đã hoàn thành**: Modal size tương tự Transactions form
- [x] **Đã hoàn thành**: Form fields layout:
  - Portrait: 1 cột
  - Landscape: 2 cột cho Name & Contact (sm:grid-cols-2)
- [x] **Đã hoàn thành**: Quick create customer modal có input auto-focus

#### Transaction Edit Modal (trong Customers)
- [x] **Đã hoàn thành**: Modal tương tự Transactions form
- [x] **Đã hoàn thành**: Transaction list trong customer detail có scroll mượt

---

### 2.3 Customer Debt Detail Page (`pages/CustomerDebtDetail.jsx`)

#### Header & Summary Cards
- [x] **Đã hoàn thành**: Header layout tương tự các pages khác
- [x] **Đã hoàn thành**: Summary cards grid:
  - Portrait: `grid-cols-1` hoặc `grid-cols-2`
  - Landscape: `md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5`
- [x] **Đã hoàn thành**: Cards có padding và touch target đủ lớn

#### Filter & Action Bar
- [x] **Đã hoàn thành**: Date range filter:
  - Portrait: Stack vertical
  - Landscape: Inline
  - DateInput có font-size ≥16px trên tablet (md:text-base)
- [x] **Đã hoàn thành**: Action buttons (Bulk Pay, Print):
  - Min-height 44px (btn-md class)
  - Spacing đủ lớn giữa các buttons

#### Transaction List/Table
- [x] **Đã hoàn thành**: Table layout:
  - Portrait: Card view hoặc table rút gọn
  - Landscape: Full table với scroll ngang có kiểm soát
- [x] **Đã hoàn thành**: Table min-width: `md:min-w-[800px] lg:min-w-[900px]`
- [x] **Đã hoàn thành**: Action buttons trong table có min 44×44px

#### Bulk Pay Modal
- [x] **Đã hoàn thành**: Modal size và layout tương tự các modals khác
- [x] **Đã hoàn thành**: PIN input có font-size lớn (text-4xl md:text-5xl)
- [x] **Đã hoàn thành**: Date picker có touch target đủ lớn

---

### 2.4 Reports Page (`pages/Reports.jsx`)

#### Header & Stats
- [x] **Đã hoàn thành**: Stats cards grid:
  - Portrait: `grid-cols-1 sm:grid-cols-2`
  - Landscape: `md:grid-cols-2 lg:grid-cols-4`
- [x] **Đã hoàn thành**: Cards có padding và min-height hợp lý

#### Report Table
- [x] **Đã hoàn thành**: Table layout tương tự Transactions table
- [x] **Đã hoàn thành**: Sortable headers có touch target đủ lớn (md:min-h-[44px] md:py-4)
- [x] **Đã hoàn thành**: Search input có min-width hợp lý trên tablet

#### Export Button
- [x] **Đã hoàn thành**: Export button có min-height 44px (btn-lg class)
- [x] **Đã hoàn thành**: Loading state hiển thị rõ ràng

---

### 2.5 Analytics Page (`pages/Analytics.jsx`)

#### Analytics Dashboard Component
- [x] **Đã hoàn thành**: Stats cards grid tương tự Reports
- [x] **Đã hoàn thành**: Charts grid:
  - Portrait: `grid-cols-1` (stack vertical)
  - Landscape: `md:grid-cols-1 lg:grid-cols-2` (2 cột)
- [x] **Đã hoàn thành**: Chart containers:
  - Min-height hợp lý (≥300px, minHeight={250})
  - Responsive width 100%
  - Labels và tooltips readable trên tablet
- [x] **Đã hoàn thành**: Pie chart:
  - Outer radius phù hợp với container
  - Labels không bị cắt
- [x] **Đã hoàn thành**: Bar chart:
  - X-axis labels có angle hợp lý
  - Tooltip dễ đọc
- [x] **Đã hoàn thành**: Area chart:
  - Responsive và readable
  - Legend dễ chạm (nếu interactive)

---

### 2.6 Interest Configs Page (`pages/InterestConfigs.jsx`)

#### Header & Create Button
- [x] **Đã hoàn thành**: Header layout tương tự các pages khác
- [x] **Đã hoàn thành**: "Thêm cấu hình" button có min-height 44px (btn-md class)

#### Config Cards Grid
- [x] **Đã hoàn thành**: Grid layout:
  - Portrait: `grid-cols-1 sm:grid-cols-2`
  - Landscape: `md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5`
- [x] **Đã hoàn thành**: Cards có padding đủ lớn (`p-6`)
- [x] **Đã hoàn thành**: Cards có min-height hợp lý
- [x] **Đã hoàn thành**: Hover/touch feedback rõ ràng

#### Config Form Modal
- [x] **Đã hoàn thành**: Modal size và layout tương tự các modals khác
- [x] **Đã hoàn thành**: Form fields:
  - Portrait: 1 cột
  - Landscape: 2 cột cho Code & Rate
- [x] **Đã hoàn thành**: Rate input có step="0.1" và font-size ≥16px (input class)

---

### 2.7 User Management Page (`pages/UserManagement.jsx`)

#### Header & Create Button
- [x] **Đã hoàn thành**: Header layout tương tự các pages khác
- [x] **Đã hoàn thành**: "Thêm user" button có min-height 44px (btn-md class)

#### Users Table
- [x] **Đã hoàn thành**: Table layout tương tự các tables khác
- [x] **Đã hoàn thành**: Table có scroll ngang có kiểm soát trên tablet
- [x] **Đã hoàn thành**: Action buttons (Edit, Delete) có min 44×44px (md:min-w-[44px] md:min-h-[44px])
- [x] **Đã hoàn thành**: Role badge có touch target đủ lớn (nếu clickable)

#### User Form Modal
- [x] **Đã hoàn thành**: Modal size và layout
- [x] **Đã hoàn thành**: Form fields:
  - Portrait: 1 cột
  - Landscape: 2 cột cho Username & Role
- [x] **Đã hoàn thành**: Password inputs có font-size ≥16px (input class)
- [x] **Đã hoàn thành**: PIN input có `inputMode="numeric"` và maxLength

---

### 2.8 Login Page (`pages/Login.jsx`)

#### Form Layout
- [ ] **Kiểm tra**: Form có max-width hợp lý (`max-w-md`)
- [ ] **Tối ưu**: Inputs có font-size ≥16px
- [ ] **Kiểm tra**: Password toggle button có touch target đủ lớn
- [ ] **Tối ưu**: Submit button có min-height 44px
- [ ] **Kiểm tra**: Error message hiển thị rõ ràng và không che form

---

## 🧩 Phase 3: Components

### 3.1 Modal Components

#### Base Modal (`components/Modal.jsx`)
- [x] **Đã hoàn thành**: Modal overlay có backdrop blur phù hợp
- [x] **Đã hoàn thành**: Close button có min 44×44px (icon-btn class)
- [x] **Đã hoàn thành**: Modal size trên tablet:
  - Small: `max-w-md`
  - Medium: `max-w-2xl`
  - Large: `max-w-4xl`
- [x] **Đã hoàn thành**: Modal body có scroll mượt khi content dài
- [x] **Đã hoàn thành**: Modal footer buttons có spacing đủ lớn

#### Delete Confirmation Modal (`components/DeleteConfirmationModal.jsx`)
- [x] **Đã hoàn thành**: PIN input có font-size lớn (text-4xl md:text-5xl)
- [x] **Đã hoàn thành**: Buttons có min-height 44px (py-3 md:py-3.5)
- [x] **Đã hoàn thành**: Close button có touch target đủ lớn (md:min-w-[44px] md:min-h-[44px])
- [x] **Đã hoàn thành**: Warning message readable

#### Alert Modal (`components/AlertModal.jsx`)
- [x] **Đã hoàn thành**: Modal size phù hợp với content
- [x] **Đã hoàn thành**: Buttons có spacing đủ lớn

---

### 3.2 Form Components

#### DateInput (`components/DateInput.jsx`)
- [x] **Đã hoàn thành**: Input có font-size ≥16px trên tablet (kế thừa từ className được truyền vào)
- [x] **Đã hoàn thành**: Calendar picker có touch targets đủ lớn (sử dụng input class)
- [x] **Đã hoàn thành**: Date picker không bị che bởi keyboard

#### FormField (`components/FormField.jsx`)
- [x] **Đã hoàn thành**: Label có font-size readable
- [x] **Đã hoàn thành**: Error message hiển thị rõ ràng
- [x] **Đã hoàn thành**: Helper text có spacing hợp lý

#### StatusDropdown (`components/StatusDropdown.jsx`)
- [x] **Đã hoàn thành**: Dropdown có min-height 44px (md:min-h-[44px])
- [x] **Đã hoàn thành**: Options có padding đủ lớn cho touch (md:py-3.5, md:min-h-[44px])
- [x] **Đã hoàn thành**: Dropdown không bị che bởi keyboard

---

### 3.3 Table Components

#### Table Headers
- [ ] **Tối ưu**: Sortable headers có touch target đủ lớn
- [ ] **Kiểm tra**: Sort icons có min 16×16px
- [ ] **Tối ưu**: Header text có font-size readable

#### Table Rows
- [ ] **Kiểm tra**: Row height đủ lớn (min 48px)
- [ ] **Tối ưu**: Action buttons trong rows có min 44×44px
- [ ] **Kiểm tra**: Row hover/touch feedback rõ ràng

---

### 3.4 Toast Component (`components/Toast.jsx`)

- [ ] **Kiểm tra**: Toast có min-height 44px
- [ ] **Tối ưu**: Toast position không che content quan trọng
- [ ] **Kiểm tra**: Close button có touch target đủ lớn
- [ ] **Tối ưu**: Toast spacing từ edges (safe area)

---

## 🎨 Phase 4: Visual & UX Polish

### 4.1 Spacing & Padding
- [ ] **Kiểm tra**: Tất cả sections có spacing hợp lý:
  - Section spacing: `space-y-6` hoặc `space-y-8`
  - Card padding: `p-6` (tablet), `p-8` (desktop)
- [ ] **Tối ưu**: Gap giữa grid items: `gap-4 md:gap-5 lg:gap-6`

### 4.2 Touch Targets
- [ ] **Kiểm tra**: Tất cả interactive elements có min 44×44px:
  - Buttons
  - Icon buttons
  - Links
  - Checkboxes/Radio buttons
  - Dropdown triggers
- [ ] **Tối ưu**: Spacing giữa các touch targets: ≥8px

### 4.3 Typography
- [ ] **Kiểm tra**: Font sizes readable trên tablet:
  - Body: ≥14px
  - Inputs: ≥16px
  - Headings: Responsive (text-xl → text-2xl → text-3xl)
- [ ] **Tối ưu**: Line height hợp lý (≥1.5 cho body text)

### 4.4 Colors & Contrast
- [ ] **Kiểm tra**: Text contrast đạt WCAG AA (≥4.5:1)
- [ ] **Tối ưu**: Focus states rõ ràng cho keyboard navigation
- [ ] **Kiểm tra**: Disabled states có opacity đủ thấp

---

## 🧪 Phase 5: Testing Checklist

### 5.1 Device Testing
- [ ] **Test trên iPad Pro 11" Portrait** (834×1194):
  - Sidebar collapsed mặc định
  - Content không tràn ngang
  - Touch targets đủ lớn
  - Forms không bị che bởi keyboard
- [ ] **Test trên iPad Pro 11" Landscape** (1194×834):
  - Sidebar có thể expand
  - Content tận dụng không gian ngang
  - Tables hiển thị đầy đủ columns
- [ ] **Test Split View (1/2 screen)** (~600px width):
  - UI không vỡ nghiêm trọng
  - Content vẫn readable
  - Touch targets vẫn đủ lớn

### 5.2 Feature Testing
- [ ] **Login flow**: Form inputs, submit button
- [ ] **Navigation**: Sidebar toggle, menu items
- [ ] **CRUD Operations**:
  - Create customer/transaction/config
  - Edit customer/transaction/config
  - Delete với PIN confirmation
- [ ] **Forms**:
  - Date picker
  - Combobox/dropdown
  - Text inputs
  - Textarea
- [ ] **Modals**:
  - Open/close
  - Scroll trong modal
  - Keyboard navigation
- [ ] **Tables**:
  - Horizontal scroll (nếu cần)
  - Sort columns
  - Action buttons
- [ ] **Charts**:
  - Responsive sizing
  - Tooltips readable
  - Legends interactive (nếu có)

### 5.3 Edge Cases
- [ ] **Empty states**: Hiển thị đúng và có action buttons
- [ ] **Loading states**: Skeleton loaders có kích thước hợp lý
- [ ] **Error states**: Error messages readable và có retry buttons
- [ ] **Long content**: Text truncation, scroll mượt
- [ ] **Keyboard**: Không che content khi keyboard mở

---

## 📝 Phase 6: Code Review & Documentation

### 6.1 Code Quality
- [ ] **Kiểm tra**: Tất cả `tablet:` classes đã được thay bằng `md:`
- [ ] **Kiểm tra**: Không có hardcoded pixel values (dùng Tailwind classes)
- [ ] **Kiểm tra**: Responsive classes được áp dụng đúng:
  - Mobile: Default (no prefix)
  - Tablet: `md:` (768px+)
  - Desktop: `lg:` (1024px+)
- [ ] **Tối ưu**: Loại bỏ unused CSS classes

### 6.2 Documentation
- [ ] **Cập nhật**: README với thông tin về tablet support
- [ ] **Ghi chú**: Comments trong code về tablet-specific logic
- [ ] **Tài liệu**: Design decisions cho tablet UI

---

## 🚀 Priority Order

### High Priority (Must Have)
1. ✅ Layout sidebar collapse trên tablet
2. ✅ Button/Input touch targets (44×44px)
3. ✅ Input font-size ≥16px
4. ⬜ Table responsive strategy
5. ⬜ Modal sizing trên tablet
6. ⬜ Form layout optimization

### Medium Priority (Should Have)
1. ⬜ Grid layouts optimization
2. ⬜ Typography scaling
3. ⬜ Chart responsiveness
4. ⬜ Spacing/padding adjustments

### Low Priority (Nice to Have)
1. ⬜ Split View optimization
2. ⬜ Advanced gestures
3. ⬜ Animation polish

---

## 📌 Notes

### Breakpoint Strategy
- **Mobile**: < 768px (default styles)
- **Tablet**: 768px - 1023px (`md:` prefix)
- **Desktop**: ≥ 1024px (`lg:` prefix)

### Touch Target Guidelines
- **Minimum**: 44×44px (Apple HIG)
- **Recommended**: 48×48px
- **Spacing**: ≥8px giữa các targets

### Typography Guidelines
- **Body**: 14-16px
- **Inputs**: ≥16px (tránh iOS auto-zoom)
- **Headings**: Responsive scaling

---

## ✅ Completion Status

- **Phase 1 (Foundation)**: ✅ Completed
- **Phase 2 (Pages)**: ✅ Completed (Transactions, Customers, Debt Detail, Reports, Analytics, InterestConfigs, UserManagement)
- **Phase 3 (Components)**: ✅ Completed (Modal, DeleteConfirmationModal, StatusDropdown, DateInput)
- **Phase 4 (Polish)**: 🟡 In Progress (Mostly done, minor adjustments may be needed)
- **Phase 5 (Testing)**: ⬜ Not Started (Requires physical device testing)
- **Phase 6 (Documentation)**: ⬜ Not Started

---

**Last Updated**: 2024-12-19
**Status**: ✅ Phase 1-3 Completed, Ready for Testing
