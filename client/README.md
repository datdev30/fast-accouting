# FastAccounting - Desktop Web Application

Ứng dụng quản lý công nợ và giao dịch cho desktop web, được xây dựng với React và Vite.

## 🚀 Tech Stack

- **Framework**: React 19
- **Build Tool**: Vite 7
- **Styling**: TailwindCSS
- **HTTP Client**: Axios
- **State Management**: TanStack Query (React Query)
- **Routing**: React Router
- **Icons**: Lucide React
- **Print**: react-to-print

## 📋 Yêu Cầu

- **Node.js**: 18+ 
- **npm**: 9+ hoặc **yarn** / **pnpm**

## 🛠️ Cài Đặt

### 1. Cài đặt dependencies

```bash
cd client
npm install
```

### 2. Cấu hình môi trường

Tạo file `.env.development` cho development:

```env
VITE_API_URL=http://localhost:3000/api
```

Tạo file `.env.production` cho production:

```env
VITE_API_URL=/api
```

## 🏃 Development

### Chạy development server

```bash
npm run dev
```

Ứng dụng sẽ chạy tại `http://localhost:5173`

### Build cho production

```bash
npm run build
```

Output sẽ được tạo trong thư mục `dist/`

### Preview production build

```bash
npm run preview
```

## 📁 Cấu Trúc Project

```
client/
├── src/
│   ├── components/          # React components
│   │   ├── Layout.jsx       # Main layout với sidebar
│   │   ├── Modal.jsx        # Modal component
│   │   ├── Toast.jsx        # Toast notifications
│   │   ├── DatePicker.jsx   # Date picker
│   │   ├── PrintableReport.jsx      # PDF report component
│   │   └── PrintableAllTransactions.jsx  # All transactions PDF
│   │
│   ├── pages/               # Page components
│   │   ├── Login.jsx        # Login page
│   │   ├── Customers.jsx   # Customer management
│   │   ├── CustomerDebtDetail.jsx  # Customer debt details
│   │   ├── Transactions.jsx        # Transaction management
│   │   ├── InterestConfigs.jsx     # Interest configs
│   │   ├── Reports.jsx     # Reports dashboard
│   │   ├── Analytics.jsx   # Analytics dashboard
│   │   └── UserManagement.jsx     # User management (Admin)
│   │
│   ├── context/            # React Context
│   │   ├── AuthContext.jsx # Authentication state
│   │   └── ToastContext.jsx # Toast notifications
│   │
│   ├── services/           # API services
│   │   └── api.js          # Axios client & API functions
│   │
│   ├── utils/              # Utility functions
│   │   ├── dateUtils.js    # Date formatting
│   │   ├── numberToWords.js # Vietnamese money reader
│   │   ├── colorSchemes.js # Color schemes
│   │   ├── a11y.js         # Accessibility helpers
│   │   ├── focusTrap.js    # Focus trap for modals
│   │   └── keyboardNav.js # Keyboard navigation
│   │
│   ├── App.jsx             # Main App component
│   ├── main.jsx            # Entry point
│   ├── index.css           # Global styles
│   └── App.css             # App-specific styles
│
├── public/                  # Static assets
│   ├── favicon.svg
│   └── vite.svg
│
├── index.html              # HTML template
├── vite.config.js          # Vite configuration
├── tailwind.config.js       # TailwindCSS configuration
├── postcss.config.js       # PostCSS configuration
├── package.json
└── README.md
```

## 🎨 Design System

Ứng dụng sử dụng design system tùy chỉnh với:

- **Fonts**: Poppins (headings) + Open Sans (body)
- **Colors**: Blue primary (#2563EB), Teal accents
- **Spacing**: Scale từ 0.5rem đến 3rem
- **Border Radius**: 0.5rem, 1rem, 1.5rem, 2rem
- **Shadows**: Layered shadows với color tints
- **Z-index**: Modal (50), Toast (60), Dropdown (40)

Chi tiết xem trong `UXUI_DESIGN_PLAN.md`

## 🔑 Tính Năng Chính

### 1. Quản Lý Khách Hàng
- Tạo, chỉnh sửa, xóa khách hàng
- Xem lịch sử giao dịch riêng biệt
- Form chỉnh sửa tách biệt với lịch sử
- Tìm kiếm khách hàng

### 2. Quản Lý Giao Dịch
- Tạo giao dịch với nhiều loại (Tiền mặt, Chuyển khoản, v.v.)
- Tính lãi tự động theo cấu hình
- Thanh toán hàng loạt
- Upload và xem ảnh giao dịch
- Lọc theo ngày

### 3. Báo Cáo & In Ấn
- **Phiếu nợ**: Báo cáo công nợ hiện tại
- **Tất cả giao dịch**: Báo cáo đầy đủ tất cả giao dịch (đã trả + đang nợ)
- Preview trước khi in
- Tải xuống PDF
- In trực tiếp từ browser

### 4. Cấu Hình Lãi Suất
- Quản lý các loại lãi suất
- Màu sắc phân biệt cho từng loại
- Cấu hình linh hoạt

### 5. Analytics Dashboard
- Tổng quan công nợ
- Thống kê theo thời gian
- Biểu đồ trực quan

## 🖥️ Desktop Web App Features

### Responsive Design
- Tối ưu cho màn hình desktop (1920px width)
- Sidebar có thể thu gọn
- Layout linh hoạt

### Keyboard Navigation
- Tab navigation
- ESC để đóng modal
- Focus trap trong modals
- Keyboard shortcuts

### Accessibility (A11y)
- ARIA labels
- Semantic HTML
- Focus indicators
- Screen reader support
- WCAG AA compliant

## 🔧 Scripts

```bash
# Development
npm run dev          # Start dev server với HMR

# Build
npm run build        # Build cho production
npm run preview      # Preview production build

# Linting
npm run lint         # Run ESLint
```

## 🌐 API Integration

Ứng dụng kết nối với backend API qua Axios:

- **Base URL**: Được cấu hình trong `.env`
- **Authentication**: JWT token trong Authorization header
- **Error Handling**: Tự động redirect về login khi token hết hạn

Xem `src/services/api.js` để biết chi tiết các API endpoints.

## 📦 Build & Deploy

### Build cho Production

```bash
npm run build
```

Output trong `dist/` có thể deploy lên:
- Vercel (recommended)
- Netlify
- GitHub Pages
- Bất kỳ static hosting nào

### Deploy lên Vercel

1. Push code lên GitHub
2. Import project vào Vercel
3. Cấu hình:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
4. Thêm Environment Variables:
   - `VITE_API_URL`: URL của backend API
5. Deploy!

## 🐛 Troubleshooting

### Port đã được sử dụng

```bash
# Thay đổi port trong vite.config.js hoặc
npm run dev -- --port 3001
```

### Build errors

- Xóa `node_modules` và `package-lock.json`
- Chạy `npm install` lại
- Kiểm tra Node.js version (cần 18+)

### API connection errors

- Kiểm tra `VITE_API_URL` trong `.env`
- Đảm bảo backend đang chạy
- Kiểm tra CORS settings trên backend

## 📝 Notes

- **Desktop Only**: Ứng dụng được thiết kế cho desktop web, không phải mobile/tablet
- **Browser Support**: Modern browsers (Chrome, Firefox, Edge, Safari latest)
- **Print Support**: Sử dụng browser print dialog, hỗ trợ PDF export

## 📄 License

ISC

---

**Happy Accounting! 💰**
