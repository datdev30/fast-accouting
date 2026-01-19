# Cấu hình API URL cho Mobile App

## ✅ Đã cấu hình

File `.env.production` đã có:
```
VITE_API_URL=https://fast-accounting-api.vercel.app/
```

## 🔍 Cách hoạt động

### 1. Vite Environment Variables
- Vite sẽ load biến môi trường từ `.env.production` khi build với mode production
- Chỉ các biến bắt đầu với `VITE_` mới được expose vào client code
- Biến `VITE_API_URL` sẽ được thay thế vào code tại build time

### 2. URL Normalization
Code trong `src/services/api.js` có function `normalizeApiBaseUrl()` sẽ:
- Tự động thêm `https://` nếu thiếu
- Tự động thêm `/api` vào pathname nếu chỉ có origin
- **Kết quả**: `https://fast-accounting-api.vercel.app/` → `https://fast-accounting-api.vercel.app/api`

### 3. Build Process
Khi chạy `npm run build`:
1. Vite đọc `.env.production`
2. Thay thế `import.meta.env.VITE_API_URL` trong code
3. Build ra `dist-tablet/` với API URL đã được hardcode

## 📝 Lưu ý quan trọng

### Development vs Production

**Development** (`npm run dev`):
- Sử dụng proxy trong `vite.config.js` → `/api` → `http://localhost:3000`
- Không cần `.env.production`

**Production Build** (`npm run build`):
- Sử dụng `VITE_API_URL` từ `.env.production`
- URL được hardcode vào bundle
- Mobile app sẽ gọi trực tiếp đến `https://fast-accounting-api.vercel.app/api`

### Kiểm tra API URL trong build

Sau khi build, bạn có thể kiểm tra:
1. Mở file `dist-tablet/assets/index-*.js`
2. Tìm kiếm `fast-accounting-api.vercel.app`
3. Xác nhận URL đã được inject đúng

## 🔄 Cập nhật API URL

Nếu cần thay đổi API URL:
1. Sửa file `.env.production`
2. Chạy lại `npm run build`
3. Chạy `npm run cap:sync` để sync với Android project

## ✅ Checklist

- [x] `.env.production` đã có `VITE_API_URL`
- [x] URL đã dùng HTTPS (không cần network security config)
- [x] URL sẽ được normalize đúng (tự động thêm `/api`)
- [ ] Đã test build và kiểm tra URL trong bundle
- [ ] Đã test API connection trên mobile app

## 🧪 Test API URL

Sau khi build và sync Android:
1. Mở app trên device/emulator
2. Mở DevTools (nếu có) hoặc check network logs
3. Xác nhận requests đang gọi đến `https://fast-accounting-api.vercel.app/api`

## 📚 Tham khảo

- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Capacitor Network Configuration](https://capacitorjs.com/docs/guides/deep-links)
