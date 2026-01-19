# FastAccounting Tablet Client - Setup Guide

## Tổng quan

`client-tablet` là phiên bản UI được tối ưu hóa riêng cho tablet (iPad, Android tablet), tách biệt hoàn toàn với `client` (desktop).

## Đặc điểm

- **Responsive Design**: Hỗ trợ cả portrait và landscape mode
- **Touch Optimized**: Tất cả interactive elements có kích thước tối thiểu 44x44px
- **Safe Area Support**: Hỗ trợ safe-area-inset cho các thiết bị có notch
- **Tablet Breakpoints**: Custom breakpoints cho tablet (768px, 1024px, 1280px)

## Cài đặt

```bash
cd client-tablet
npm install
```

## Chạy Development Server

```bash
npm run dev
```

Server sẽ chạy trên port **5173** (trùng desktop; dùng start-tablet-dev.ps1 sẽ kill process 5173 trước khi chạy).

## Build

```bash
npm run build
```

Output sẽ được tạo trong thư mục `dist-tablet/`.

## Cấu trúc Responsive

### Breakpoints

- `tablet`: 768px - Tablet portrait
- `tablet-lg`: 1024px - Tablet landscape / Small desktop
- `desktop`: 1280px - Desktop

### Usage trong code

```jsx
// Portrait: Stack layout
<div className="tablet:hidden space-y-4">
  {/* Mobile/Tablet Portrait layout */}
</div>

// Landscape: Single row
<div className="hidden tablet-lg:flex tablet-lg:items-center">
  {/* Tablet Landscape/Desktop layout */}
</div>
```

## Khác biệt với Desktop Client

1. **Viewport**: Được cấu hình cho tablet với `viewport-fit=cover`
2. **Safe Area**: Hỗ trợ safe-area-inset padding
3. **Touch Targets**: Tất cả buttons và interactive elements tối thiểu 44x44px
4. **Responsive Classes**: Sử dụng `tablet:`, `tablet-lg:`, `desktop:` thay vì `sm:`, `md:`, `lg:`, `xl:`

## Development Workflow

1. Desktop client (`client/`): Port 5173 - Layout cố định cho desktop
2. Tablet client (`client-tablet/`): Port 5173 - Responsive layout cho tablet

Cả hai đều kết nối đến cùng một API backend.

## Notes

- Tablet client sử dụng các class responsive riêng để tránh conflict với desktop
- Desktop và tablet client dùng chung port 5173; chạy start-tablet-dev.ps1 sẽ kill process 5173 trước khi khởi động tablet
- Build output được tách riêng (`dist` vs `dist-tablet`)
