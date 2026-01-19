# Hướng dẫn thiết lập App Icon

## Tổng quan

App icon đã được tự động tạo từ file `logo/app-icon.png` và copy vào các thư mục Android tương ứng.

## Cách sử dụng

### 1. Thay đổi icon

Nếu bạn muốn thay đổi icon:

1. Thay thế file `logo/app-icon.png` bằng icon mới của bạn
2. Chạy lệnh:
   ```bash
   npm run generate:icons
   ```

### 2. Kích thước icon

Script tự động tạo các kích thước sau:
- **mipmap-mdpi**: 48x48px
- **mipmap-hdpi**: 72x72px
- **mipmap-xhdpi**: 96x96px
- **mipmap-xxhdpi**: 144x144px
- **mipmap-xxxhdpi**: 192x192px

### 3. Các loại icon được tạo

Mỗi density sẽ có 3 loại icon:
- `ic_launcher.png` - Icon vuông (standard)
- `ic_launcher_round.png` - Icon tròn
- `ic_launcher_foreground.png` - Icon foreground (dùng cho adaptive icon)

## Vị trí icon

Icon được lưu tại:
```
android/app/src/main/res/mipmap-*/
```

## Lưu ý

- Icon nguồn (`logo/app-icon.png`) nên có kích thước tối thiểu 512x512px để đảm bảo chất lượng tốt
- Sau khi thay đổi icon, bạn cần:
  1. Clean project trong Android Studio: **Build > Clean Project**
  2. Rebuild project: **Build > Rebuild Project**
  3. Hoặc xóa app cũ trên thiết bị và cài lại

## Kiểm tra icon

Sau khi build app, icon sẽ hiển thị:
- Trên màn hình home của thiết bị Android
- Trong danh sách ứng dụng
- Trong Android Studio khi chạy app
