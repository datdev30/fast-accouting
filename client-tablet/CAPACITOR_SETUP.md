# Hướng dẫn thiết lập Capacitor cho Android

## Yêu cầu

1. Node.js và npm đã được cài đặt
2. Android Studio đã được cài đặt
3. Android SDK đã được cấu hình

## Các bước thiết lập

### 1. Cài đặt dependencies

```bash
cd client
npm install
```

### 2. Build web app

```bash
npm run build
```

### 3. Thêm Android platform (lần đầu tiên)

```bash
npx cap add android
```

### 4. Sync code với Android project

```bash
npm run cap:sync
```

Hoặc sử dụng script tự động:
```bash
npm run android:build
```

### 5. Mở project trong Android Studio

```bash
npm run cap:open
```

Hoặc:
```bash
npx cap open android
```

## Scripts có sẵn

- `npm run build` - Build web app
- `npm run cap:sync` - Sync web app với native project
- `npm run cap:copy` - Copy web assets
- `npm run cap:open` - Mở Android Studio
- `npm run android:build` - Build và sync tự động
- `npm run android:dev` - Build, sync và mở Android Studio

## Development workflow

1. Phát triển web app như bình thường với `npm run dev`
2. Khi cần test trên Android:
   ```bash
   npm run android:build
   npm run cap:open
   ```
3. Chạy app từ Android Studio

## Lưu ý

- File cấu hình Capacitor: `capacitor.config.ts`
- Web assets được build vào `dist/` folder
- Android project sẽ được tạo trong `client/android/`
- Mỗi khi thay đổi code web, cần chạy `npm run build` và `npm run cap:sync`
