# Kế Hoạch Thiết Kế UX/UI - FastAccounting Desktop Web App

## 📋 Tổng Quan

**Loại sản phẩm:** SaaS Dashboard - Financial/Accounting System  
**Platform:** Desktop Web App Only  
**Stack:** React + Tailwind CSS  
**Mục tiêu:** Professional, Trustworthy, Efficient, Accessible

---

## 🎨 1. Design System Foundation

### 1.1 Color Palette (Fintech/SaaS)

**Primary Colors:**
- Primary: `#2563EB` (Trust Blue)
- Primary Hover: `#1D4ED8`
- Secondary: `#3B82F6` (Light Blue)
- CTA/Accent: `#F97316` (Orange - for actions)

**Background & Surface:**
- Background: `#F8FAFC` (Slate-50)
- Surface/Card: `#FFFFFF` (White)
- Surface Hover: `#F1F5F9` (Slate-100)

**Text Colors:**
- Primary Text: `#1E293B` (Slate-800)
- Secondary Text: `#64748B` (Slate-500)
- Muted Text: `#94A3B8` (Slate-400)
- Disabled: `#CBD5E1` (Slate-300)

**Semantic Colors:**
- Success: `#10B981` (Green-500)
- Warning: `#F59E0B` (Amber-500)
- Error: `#EF4444` (Red-500)
- Info: `#3B82F6` (Blue-500)

**Border Colors:**
- Default: `#E2E8F0` (Slate-200)
- Hover: `#CBD5E1` (Slate-300)
- Focus: `#3B82F6` (Blue-500)

### 1.2 Typography

**Font Pairing:** Modern Professional
- **Heading Font:** Poppins (400, 500, 600, 700)
- **Body Font:** Open Sans (300, 400, 500, 600, 700)

**Alternative (Single Font):** Plus Jakarta Sans (300, 400, 500, 600, 700)

**Type Scale:**
- Display: `3rem` (48px) - Hero titles
- H1: `2.25rem` (36px) - Page titles
- H2: `1.875rem` (30px) - Section titles
- H3: `1.5rem` (24px) - Subsection titles
- H4: `1.25rem` (20px) - Card titles
- Body Large: `1.125rem` (18px) - Important text
- Body: `1rem` (16px) - Default text
- Body Small: `0.875rem` (14px) - Secondary text
- Caption: `0.75rem` (12px) - Labels, metadata

**Line Height:**
- Headings: `1.2` (tight)
- Body: `1.6` (relaxed)
- Small: `1.5`

### 1.3 Spacing System

**Base Unit:** 4px

**Scale:**
- xs: `0.5rem` (8px)
- sm: `0.75rem` (12px)
- md: `1rem` (16px)
- lg: `1.5rem` (24px)
- xl: `2rem` (32px)
- 2xl: `3rem` (48px)
- 3xl: `4rem` (64px)

**Component Spacing:**
- Card padding: `1.5rem` (24px)
- Section gap: `2rem` (32px)
- Form field gap: `1rem` (16px)
- Button padding: `0.75rem 1.5rem` (12px 24px)

### 1.4 Border Radius

- Small: `0.5rem` (8px) - Buttons, inputs
- Medium: `0.75rem` (12px) - Cards, modals
- Large: `1rem` (16px) - Large cards
- XL: `1.5rem` (24px) - Hero sections

### 1.5 Shadows

- sm: `0 1px 2px 0 rgba(0, 0, 0, 0.05)`
- md: `0 4px 6px -1px rgba(0, 0, 0, 0.1)`
- lg: `0 10px 15px -3px rgba(0, 0, 0, 0.1)`
- xl: `0 20px 25px -5px rgba(0, 0, 0, 0.1)`
- Colored (Blue): `0 10px 15px -3px rgba(59, 130, 246, 0.3)`

---

## 🏗️ 2. Layout Architecture

### 2.1 Desktop Layout Structure

```
┌─────────────────────────────────────────────────┐
│  Sidebar (Fixed, 320px)  │  Main Content Area   │
│  - Logo                  │  - Header Bar        │
│  - Navigation            │  - Breadcrumbs       │
│  - User Profile          │  - Page Content      │
│                          │  - Footer (optional) │
└─────────────────────────────────────────────────┘
```

**Sidebar Specifications:**
- Width: `320px` (expanded) / `80px` (collapsed)
- Background: `#FFFFFF`
- Border: Right border `1px solid #E2E8F0`
- Shadow: `4px 0 24px -12px rgba(0,0,0,0.1)`
- Z-index: `50`
- Transition: `300ms ease-in-out`

**Main Content Area:**
- Padding: `2.5rem` (40px)
- Max-width: `2000px` (centered)
- Background: `#F8FAFC`

### 2.2 Grid System

**Container:**
- Max-width: `2000px`
- Padding: `2.5rem` (40px)
- Margin: Auto (centered)

**Grid Layouts:**
- 2 columns: `grid-cols-2` (Forms, side-by-side)
- 3 columns: `grid-cols-3` (Feature cards)
- 4 columns: `grid-cols-4` (Stats, customer cards)
- 5 columns: `grid-cols-5` (Summary cards)
- Auto-fit: `grid-cols-[repeat(auto-fit,minmax(300px,1fr))]`

---

## 🧩 3. Component Design Specifications

### 3.1 Navigation (Sidebar)

**Structure:**
- Logo section (top)
- Navigation items (middle, scrollable)
- User profile section (bottom, fixed)

**Nav Item States:**
- Default: `text-slate-600`, `hover:bg-slate-50`, `hover:text-blue-600`
- Active: `bg-blue-600`, `text-white`, `shadow-lg shadow-blue-200`
- Icon size: `24px`
- Padding: `1rem 1.5rem` (16px 24px)
- Border radius: `0.75rem` (12px)
- Min height: `52px` (touch target)

**Collapsed State:**
- Width: `80px`
- Icons only, centered
- Tooltip on hover (show label)

### 3.2 Buttons

**Primary Button:**
- Background: `#2563EB`
- Hover: `#1D4ED8`
- Text: White
- Shadow: `0 4px 6px -1px rgba(37, 99, 235, 0.3)`
- Padding: `0.75rem 1.5rem`
- Border radius: `0.75rem`
- Font weight: `600`
- Transition: `150ms ease-in-out`
- Min height: `44px`

**Secondary Button:**
- Background: Transparent
- Border: `1px solid #E2E8F0`
- Text: `#1E293B`
- Hover: `bg-slate-50`, `border-slate-300`

**Danger Button:**
- Background: `#EF4444`
- Hover: `#DC2626`
- Text: White

**Button Sizes:**
- Small: `px-4 py-2 text-sm`
- Medium: `px-6 py-3 text-base` (default)
- Large: `px-8 py-4 text-lg`

**Button States:**
- Loading: Spinner + disabled
- Disabled: `opacity-50`, `cursor-not-allowed`
- Active: `scale-95` (pressed effect)

### 3.3 Forms

**Input Fields:**
- Background: `#F8FAFC`
- Border: `1px solid #E2E8F0`
- Border radius: `0.75rem` (12px)
- Padding: `0.875rem 1rem` (14px 16px)
- Focus: `ring-4 ring-blue-500/10`, `border-blue-500`
- Error: `border-red-500`, `bg-red-50`
- Min height: `44px`

**Labels:**
- Font: `text-xs font-bold uppercase tracking-wider`
- Color: `#64748B`
- Margin bottom: `0.5rem`
- Required indicator: `*` in red

**Form Groups:**
- Gap between fields: `1rem` (16px)
- Section spacing: `1.5rem` (24px)

**Validation:**
- Error message: Red text, below field
- Success indicator: Green checkmark icon
- Inline validation: On blur

### 3.4 Cards

**Card Structure:**
- Background: `#FFFFFF`
- Border: `1px solid #E2E8F0`
- Border radius: `1.5rem` (24px)
- Shadow: `0 1px 3px 0 rgba(0, 0, 0, 0.1)`
- Padding: `1.5rem` (24px)
- Hover: `shadow-lg`, `border-blue-200` (if interactive)

**Card Variants:**
- Default: White background
- Highlighted: `bg-blue-50`, `border-blue-200`
- Success: `bg-emerald-50`, `border-emerald-200`
- Warning: `bg-amber-50`, `border-amber-200`

### 3.5 Tables

**Table Structure:**
- Background: `#FFFFFF`
- Border: `1px solid #E2E8F0`
- Border radius: `1rem` (16px)
- Overflow: `overflow-x-auto` (horizontal scroll on mobile)

**Table Header:**
- Background: `#F8FAFC`
- Padding: `1rem 1.5rem`
- Font: `text-xs font-bold uppercase tracking-wider`
- Text color: `#64748B`
- Border bottom: `1px solid #E2E8F0`
- Min height: `44px`

**Table Rows:**
- Padding: `1rem 1.5rem`
- Border bottom: `1px solid #F1F5F9`
- Hover: `bg-slate-50`
- Cursor: `pointer` (if clickable)
- Min height: `52px`

**Table Cells:**
- Vertical align: `middle`
- Font: `text-sm`
- Text color: `#1E293B`

**Sortable Columns:**
- Hover: `bg-slate-50`
- Cursor: `pointer`
- Icon: Arrow up/down indicator

### 3.6 Modals

**Modal Overlay:**
- Background: `rgba(15, 23, 42, 0.6)` (Slate-900/60)
- Backdrop blur: `backdrop-blur-md`
- Z-index: `50`

**Modal Container:**
- Background: `#FFFFFF`
- Border radius: `2rem` (32px)
- Shadow: `0 20px 25px -5px rgba(0, 0, 0, 0.1)`
- Max width: `90vw`, `max-w-2xl`
- Max height: `90vh`
- Overflow: `overflow-hidden flex flex-col`

**Modal Header:**
- Padding: `2rem 3rem` (32px 48px)
- Border bottom: `1px solid #E2E8F0`
- Background: `#FFFFFF`
- Title: `text-2xl font-bold`
- Close button: Top right, `44x44px` min

**Modal Body:**
- Padding: `3rem` (48px)
- Overflow: `overflow-y-auto`
- Flex: `flex-1`

**Modal Footer:**
- Padding: `1.5rem 3rem`
- Border top: `1px solid #E2E8F0`
- Background: `#F8FAFC`
- Button group: Right-aligned, gap `0.75rem`

**Focus Management:**
- Focus trap: First focusable element
- ESC key: Close modal
- Return focus: To trigger element on close

### 3.7 Toast Notifications

**Position:** Top center, fixed
**Z-index:** `100`

**Toast Container:**
- Background: `#FFFFFF`
- Border: `2px solid` (color-coded)
- Border radius: `0.75rem` (12px)
- Shadow: `0 10px 15px -3px rgba(0, 0, 0, 0.1)`
- Padding: `1rem 1.25rem`
- Min width: `320px`
- Max width: `28rem` (448px)

**Toast Types:**
- Success: Green border, green icon
- Error: Red border, red icon
- Warning: Amber border, amber icon
- Info: Blue border, blue icon

**Animation:**
- Entrance: Slide down + fade in (300ms)
- Exit: Slide up + fade out (300ms)
- Auto-dismiss: 3-5 seconds

### 3.8 Loading States

**Skeleton Loaders:**
- Background: `#F1F5F9`
- Border radius: `0.5rem` (8px)
- Animation: `animate-pulse`
- Match content shape

**Spinner:**
- Size: `32px` (large), `24px` (medium), `16px` (small)
- Color: `#3B82F6`
- Border: `4px solid #E2E8F0`, `border-t-blue-600`
- Animation: `animate-spin`

**Loading Overlay:**
- Background: `rgba(255, 255, 255, 0.9)`
- Backdrop blur: `backdrop-blur-sm`
- Centered spinner

### 3.9 Empty States

**Empty State Container:**
- Padding: `3rem` (48px)
- Text align: Center
- Icon: Large, muted color
- Message: `text-slate-500`
- Action button: Primary CTA

**Empty State Variants:**
- No data: "Chưa có dữ liệu"
- No results: "Không tìm thấy kết quả"
- Error: "Đã xảy ra lỗi" + retry button

### 3.10 Search & Filters

**Search Input:**
- Icon: Left side, `#94A3B8`
- Focus: Icon turns `#3B82F6`
- Clear button: Right side (X icon)
- Placeholder: `#94A3B8`
- Border radius: `0.75rem` (12px)

**Filter Dropdown:**
- Position: Below input
- Background: `#FFFFFF`
- Border: `1px solid #E2E8F0`
- Border radius: `0.75rem` (12px)
- Shadow: `0 10px 15px -3px rgba(0, 0, 0, 0.1)`
- Max height: `320px`
- Overflow: `overflow-y-auto`

**Filter Options:**
- Padding: `0.875rem 1.25rem`
- Hover: `bg-blue-50`
- Selected: `bg-blue-100`, `text-blue-700`
- Min height: `44px`

---

## 🎯 4. Page-Specific Design Guidelines

### 4.1 Dashboard/Overview (Reports.jsx)

**Layout:**
- Header: Title + Export button (right)
- Stats cards: 4-column grid
- Data table: Full width, sortable columns
- Search: Top right of table

**Stats Cards:**
- Background: White or gradient (for highlight)
- Icon: Top left, colored background
- Value: Large, bold
- Label: Small, muted
- Hover: Subtle lift (`translate-y-[-2px]`)

**Data Table:**
- Row hover: `bg-slate-50`
- Clickable rows: `cursor-pointer`
- Status badges: Color-coded (green/amber)

### 4.2 Customers Page

**Layout:**
- Header: Title + Search + Create button
- Grid: 4-column card grid
- Cards: Customer info cards

**Customer Cards:**
- Background: `#FFFFFF`
- Border: `1px solid #E2E8F0`
- Border radius: `2rem` (32px)
- Padding: `1.25rem` (20px)
- Hover: `shadow-xl`, `shadow-blue-500/10`
- Cursor: `pointer`
- Min height: `200px`

**Card Content:**
- Avatar: Circular, `56px`
- Name: `text-2xl font-bold`
- Contact: `text-sm text-slate-500`
- Action button: Bottom, full width

**Modal (Create/Edit):**
- Split layout: Form (left 1/3) + Transaction history (right 2/3)
- Form: Vertical layout
- History: Scrollable list

### 4.3 Transactions Page

**Layout:**
- Header: Title + Filters + Create button
- Filters: Date range + Customer search (inline)
- Table: Full width, sortable
- Actions: Edit, Delete per row

**Transaction Table:**
- Status column: Badge (PAID/OPEN)
- Amount: Right-aligned, monospace font
- Date: Formatted (DD/MM/YYYY)
- Row click: Edit transaction
- Double-click: Toggle status

**Transaction Modal:**
- Form layout: Vertical
- Image upload: Preview area
- Status toggle: Dropdown
- Date validation: Paid date >= Transaction date

### 4.4 Customer Debt Detail Page

**Layout:**
- Header: Customer name + Actions (Bulk pay, Print)
- Summary cards: 5-column grid
- Filters: Date range (inline)
- Transaction list: Grouped by month
- Print preview: Modal

**Summary Cards:**
- Gradient card: Primary metric (Total debt)
- Other cards: White background
- Icons: Large, colored
- Values: `text-2xl font-bold`

**Transaction Groups:**
- Month headers: Sticky, `bg-slate-50`
- Transactions: Expandable sections
- Totals: Per month, bold

### 4.5 Interest Configs Page

**Layout:**
- Header: Title + Create button
- Grid: 4-column card grid
- Cards: Config cards with color coding

**Config Cards:**
- Color scheme: Based on config code
- Icon: Percent symbol
- Rate: Large, bold
- Badge: Type indicator (Thanh lý/Định kỳ)
- Hover: Scale up slightly

### 4.6 User Management Page

**Layout:**
- Header: Title + Create button
- Table: User list
- Actions: Edit, Delete per row

**User Table:**
- Avatar: Circular, colored background
- Role badge: Color-coded (ADMIN/Purple, SALE/Grey)
- Legacy indicator: Amber badge

### 4.7 Login Page

**Layout:**
- Centered card: `max-w-xl`
- Background: Gradient (`from-slate-900 via-blue-900 to-slate-900`)
- Card: Glassmorphism effect
- Logo: Large, centered
- Form: Vertical layout

**Form Elements:**
- Inputs: Dark background (`bg-slate-800/50`)
- Labels: Light text
- Button: Full width, large
- Error: Red alert box

---

## ♿ 5. Accessibility Requirements

### 5.1 Keyboard Navigation

**Tab Order:**
1. Navigation items (sidebar)
2. Main content (forms, buttons, links)
3. Modals (when open)
4. Focus trap in modals

**Keyboard Shortcuts:**
- `ESC`: Close modals
- `Enter`: Submit forms
- `Tab`: Navigate forward
- `Shift+Tab`: Navigate backward
- `Ctrl+/`: Search (if implemented)

**Focus Indicators:**
- Ring: `2px solid #3B82F6`
- Outline: `2px solid #3B82F6`, `2px offset`
- Visible on all interactive elements

### 5.2 Screen Reader Support

**Semantic HTML:**
- `<nav>` for navigation
- `<main>` for main content
- `<article>` for content sections
- `<button>` for all clickable actions
- `<label>` for all form inputs

**ARIA Labels:**
- Icon-only buttons: `aria-label`
- Modal: `aria-modal="true"`, `aria-labelledby`
- Form errors: `aria-live="polite"`
- Loading states: `aria-busy="true"`

**Heading Hierarchy:**
- H1: Page title (one per page)
- H2: Major sections
- H3: Subsections
- No skipping levels

### 5.3 Color Contrast

**Minimum Ratios:**
- Normal text: 4.5:1
- Large text (18px+): 3:1
- UI components: 3:1

**Color Combinations:**
- Primary text on white: `#1E293B` on `#FFFFFF` (12.6:1) ✓
- Secondary text on white: `#64748B` on `#FFFFFF` (4.7:1) ✓
- Primary button: `#FFFFFF` on `#2563EB` (4.5:1) ✓

### 5.4 Motion & Animation

**Reduced Motion:**
- Respect `prefers-reduced-motion`
- Disable animations for sensitive users
- Code: `@media (prefers-reduced-motion: reduce) { animation: none; }`

**Animation Duration:**
- Micro-interactions: `150-200ms`
- Transitions: `200-300ms`
- Page transitions: `300ms`
- No infinite animations (except loaders)

---

## 📱 6. Responsive Considerations (Desktop Only)

**Minimum Viewport:**
- Width: `1024px` (desktop minimum)
- Height: `768px`

**Breakpoints (for future mobile if needed):**
- sm: `640px`
- md: `768px`
- lg: `1024px`
- xl: `1280px`
- 2xl: `1536px`

**Current Focus:**
- Optimize for `1280px - 1920px` width
- Sidebar: Fixed, always visible
- Content: Scrollable, max-width container

---

## 🎭 7. Interaction Patterns

### 7.1 Hover States

**Buttons:**
- Color shift: `10% darker`
- Shadow: Increase
- Transform: None (no layout shift)

**Cards:**
- Shadow: Increase
- Border: Color change
- Transform: None

**Links:**
- Color: Change to primary
- Underline: Optional
- Cursor: `pointer`

### 7.2 Click/Tap Feedback

**Buttons:**
- Active state: `scale-95` (5% smaller)
- Duration: `100ms`
- Release: Return to normal

**Cards:**
- Active state: `scale-[0.98]`
- Visual feedback: Immediate

### 7.3 Loading States

**Button Loading:**
- Disable button
- Show spinner
- Text: "Đang xử lý..."

**Page Loading:**
- Skeleton screens
- Match content layout
- Smooth transition to content

**Data Fetching:**
- Show existing data (stale-while-revalidate)
- Loading indicator: Subtle
- Error state: Clear message + retry

### 7.4 Form Interactions

**Input Focus:**
- Ring: `4px ring-blue-500/10`
- Border: `#3B82F6`
- Background: `#FFFFFF` (from slate-50)

**Input Validation:**
- Real-time: On blur
- Error: Red border + message below
- Success: Green checkmark (optional)

**Form Submission:**
- Disable submit button
- Show loading state
- Success: Toast + redirect/close
- Error: Toast + keep form open

---

## 🎨 8. Visual Hierarchy

### 8.1 Information Architecture

**Primary Actions:**
- Color: Primary blue
- Size: Large
- Position: Top right or prominent

**Secondary Actions:**
- Color: Grey/outline
- Size: Medium
- Position: Secondary locations

**Destructive Actions:**
- Color: Red
- Confirmation: Required
- Position: Bottom of forms or separate section

### 8.2 Content Hierarchy

**Page Structure:**
1. Page title (H1)
2. Subtitle/description
3. Primary action button
4. Filters/search
5. Content (table/cards)
6. Pagination (if needed)

**Card Hierarchy:**
1. Icon/visual (top)
2. Title (prominent)
3. Metadata (muted)
4. Action button (bottom)

### 8.3 Visual Weight

**Heavy Elements:**
- Primary buttons
- Important cards
- Active navigation items

**Light Elements:**
- Secondary text
- Disabled states
- Background elements

---

## 🔧 9. Implementation Checklist

### 9.1 Design System Setup

- [ ] Update `tailwind.config.js` with design tokens
- [ ] Add Google Fonts (Poppins + Open Sans)
- [ ] Define CSS custom properties in `index.css`
- [ ] Create component variants (buttons, cards, inputs)
- [ ] Set up color palette in Tailwind config

### 9.2 Component Updates

- [ ] **Layout.jsx**: Sidebar styling, navigation states
- [ ] **Buttons**: All variants (primary, secondary, danger)
- [ ] **Forms**: Input styling, validation states
- [ ] **Tables**: Header, rows, hover states
- [ ] **Modals**: Overlay, container, focus trap
- [ ] **Toast**: Positioning, animations, types
- [ ] **Cards**: All variants, hover states
- [ ] **Loading**: Skeleton loaders, spinners

### 9.3 Page-Specific Updates

- [ ] **Reports.jsx**: Stats cards, table styling
- [ ] **Customers.jsx**: Customer cards, modal layout
- [ ] **Transactions.jsx**: Table, filters, modal
- [ ] **CustomerDebtDetail.jsx**: Summary cards, grouped list
- [ ] **InterestConfigs.jsx**: Config cards, color schemes
- [ ] **UserManagement.jsx**: Table, form styling
- [ ] **Login.jsx**: Centered card, glassmorphism

### 9.4 Accessibility

- [ ] Add focus indicators to all interactive elements
- [ ] Implement keyboard navigation
- [ ] Add ARIA labels to icon buttons
- [ ] Ensure proper heading hierarchy
- [ ] Test with screen reader
- [ ] Verify color contrast ratios
- [ ] Add skip links (if needed)
- [ ] Implement focus trap in modals

### 9.5 Performance

- [ ] Optimize images (if any)
- [ ] Lazy load below-fold content
- [ ] Code split by route
- [ ] Minimize bundle size
- [ ] Use CSS transitions (not JS animations)

---

## 📐 10. Design Specifications Summary

### 10.1 Spacing Scale
```
xs:  8px   (0.5rem)
sm:  12px  (0.75rem)
md:  16px  (1rem)
lg:  24px  (1.5rem)
xl:  32px  (2rem)
2xl: 48px  (3rem)
3xl: 64px  (4rem)
```

### 10.2 Border Radius Scale
```
sm:  8px   (0.5rem)
md:  12px  (0.75rem)
lg:  16px  (1rem)
xl:  24px  (1.5rem)
2xl: 32px  (2rem)
```

### 10.3 Shadow Scale
```
sm:  0 1px 2px 0 rgba(0,0,0,0.05)
md:  0 4px 6px -1px rgba(0,0,0,0.1)
lg:  0 10px 15px -3px rgba(0,0,0,0.1)
xl:  0 20px 25px -5px rgba(0,0,0,0.1)
```

### 10.4 Z-Index Scale
```
base:     0
dropdown: 10
sticky:   20
fixed:    30
modal:    50
toast:    100
```

### 10.5 Animation Durations
```
fast:   150ms
normal: 200ms
slow:   300ms
```

---

## ✅ 11. Quality Checklist

### Visual Quality
- [ ] No emojis as icons (use Lucide icons)
- [ ] Consistent icon sizing (24px default)
- [ ] Hover states don't cause layout shift
- [ ] All interactive elements have cursor-pointer
- [ ] Smooth transitions (150-300ms)

### Interaction
- [ ] All buttons have hover/active states
- [ ] Forms have proper validation feedback
- [ ] Modals have focus trap
- [ ] Keyboard navigation works everywhere
- [ ] Loading states for all async operations

### Accessibility
- [ ] Color contrast meets WCAG AA
- [ ] All images have alt text
- [ ] Form inputs have labels
- [ ] Focus indicators visible
- [ ] Screen reader friendly

### Performance
- [ ] No layout shift on load
- [ ] Smooth animations (60fps)
- [ ] Fast page transitions
- [ ] Optimized images
- [ ] Minimal bundle size

---

## 🚀 12. Implementation Priority

### Phase 1: Foundation (High Priority)
1. Update Tailwind config with design tokens
2. Add Google Fonts
3. Update color system
4. Create base component styles

### Phase 2: Core Components (High Priority)
1. Buttons (all variants)
2. Forms (inputs, labels, validation)
3. Cards (all variants)
4. Tables (styling, hover states)
5. Modals (overlay, container, focus trap)

### Phase 3: Page Updates (Medium Priority)
1. Layout sidebar
2. Dashboard/Reports page
3. Customers page
4. Transactions page
5. Other pages

### Phase 4: Polish (Low Priority)
1. Micro-interactions
2. Animation refinements
3. Empty states
4. Error states
5. Loading states

---

## 📚 13. Reference Resources

**Design System:**
- Tailwind CSS: https://tailwindcss.com
- Lucide Icons: https://lucide.dev
- Google Fonts: Poppins + Open Sans

**Accessibility:**
- WCAG 2.1 Guidelines
- React A11y: https://react.dev/learn/accessibility
- ARIA Patterns: https://www.w3.org/WAI/ARIA/apg/

**Best Practices:**
- React Patterns: https://react.dev/learn
- UX Guidelines: From ux-guidelines.csv
- Stack Guidelines: From stacks/react.csv

---

**Kế hoạch này sẽ được cập nhật khi triển khai và nhận feedback.**
