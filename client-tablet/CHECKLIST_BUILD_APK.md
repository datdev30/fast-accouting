# ✅ Checklist Build APK - FastAccounting Mobile App

## 🔍 Kiểm tra hiện trạng

### ✅ Đã có sẵn
- [x] Java JDK đã cài đặt
- [x] Android Studio đã cài đặt
- [x] Capacitor dependencies đã cài (`@capacitor/android`, `@capacitor/cli`, `@capacitor/core`)
- [x] Web app đã build thành công (`dist-tablet/` folder tồn tại)
- [x] Cấu hình Capacitor đã đúng (`webDir: 'dist-tablet'`)
- [x] Scripts npm đã có đầy đủ

### ❌ Còn thiếu / Cần làm

#### 1. Android Platform chưa được thêm ✅
- [x] **Đã chạy lệnh**: `npm run android:add`
- [x] Thư mục `android/` đã được tạo thành công
- ✅ **Hoàn thành**: Android platform đã được thêm

#### 2. Cấu hình API URL cho Production ✅
- [x] File `.env.production` đã có biến `VITE_API_URL=https://fast-accounting-api.vercel.app/`
- [x] URL sẽ được tự động normalize thành `https://fast-accounting-api.vercel.app/api` (code tự động thêm `/api`)
- [x] URL đã dùng HTTPS nên không cần network security config cho HTTP
- ✅ **Hoàn thành**: API URL đã được cấu hình đúng

#### 3. Cấu hình Android Permissions ✅
Đã kiểm tra file `android/app/src/main/AndroidManifest.xml`:
- [x] Internet permission: `<uses-permission android:name="android.permission.INTERNET" />` - **ĐÃ CÓ SẴN**
- [x] Network security config: **KHÔNG CẦN** vì API đã dùng HTTPS
- ✅ **Hoàn thành**: Permissions đã được cấu hình đúng

#### 4. Cấu hình Network Security
- [x] **KHÔNG CẦN** vì API đã dùng HTTPS (`https://fast-accounting-api.vercel.app`)

#### 5. Cấu hình App Icon và Splash Screen
- [ ] Thay thế icon mặc định tại: `android/app/src/main/res/mipmap-*/ic_launcher.png`
- [ ] (Tùy chọn) Cấu hình splash screen nếu cần

#### 6. Cấu hình Build Gradle ✅
Đã kiểm tra `android/variables.gradle` và `android/app/build.gradle`:
- [x] `minSdkVersion`: 24 (>= 22) ✅
- [x] `targetSdkVersion`: 36 (>= 33) ✅
- [x] `compileSdkVersion`: 36 (>= 33) ✅
- [x] `versionCode`: 1 (có thể tăng khi release)
- [x] `versionName`: "1.0" (có thể cập nhật khi release)
- ✅ **Hoàn thành**: Build Gradle đã được cấu hình đúng

#### 7. Cấu hình Biến môi trường Android
- [ ] Kiểm tra `ANDROID_HOME` hoặc `ANDROID_SDK_ROOT` đã được set chưa
- [ ] Kiểm tra `JAVA_HOME` đã được set chưa
- [ ] Thêm vào PATH: `%ANDROID_HOME%\platform-tools`, `%ANDROID_HOME%\tools`

#### 8. Cấu hình .gitignore ✅
- [x] Đã thêm `dist-tablet/` vào `.gitignore`
- [x] Đã thêm comment về `android/` (có thể uncomment nếu muốn ignore)
- ✅ **Hoàn thành**: .gitignore đã được cập nhật

#### 9. Test Build ✅
- [x] Đã chạy `npm run build` - Build thành công
- [x] Đã chạy `npm run cap:sync` - Sync thành công
- [ ] Chạy `npm run cap:open` để mở Android Studio (bước tiếp theo)
- [ ] Test build APK debug từ Android Studio (cần mở Android Studio)

#### 10. Cấu hình Release Build (nếu cần publish)
- [ ] Tạo keystore cho signing
- [ ] Cấu hình signing trong `build.gradle`
- [ ] Build release APK

## 🚀 Các bước thực hiện ngay

### Bước 1: Thêm Android Platform
```bash
cd client-tablet
npm run android:add
```

### Bước 2: Kiểm tra và cấu hình API URL
Kiểm tra file `.env.production`:
```bash
# Nếu chưa có, tạo file .env.production với nội dung:
VITE_API_URL=https://your-api-domain.com/api
```

**Lưu ý quan trọng**: 
- Trong mobile app, không có proxy như dev server
- Cần URL tuyệt đối (https://...) hoặc relative path `/api` (sẽ dùng cùng domain với app)
- Nếu backend và frontend cùng domain, dùng `/api`
- Nếu khác domain, cần URL đầy đủ và cấu hình CORS

### Bước 3: Sync và mở Android Studio
```bash
npm run build
npm run cap:sync
npm run cap:open
```

### Bước 4: Kiểm tra AndroidManifest.xml
Sau khi mở Android Studio, kiểm tra file:
`android/app/src/main/AndroidManifest.xml`

Đảm bảo có:
```xml
<uses-permission android:name="android.permission.INTERNET" />
```

### Bước 5: Build APK Debug
Trong Android Studio:
1. Chờ Gradle sync hoàn tất
2. **Build > Build Bundle(s) / APK(s) > Build APK(s)**
3. APK sẽ ở: `android/app/build/outputs/apk/debug/app-debug.apk`

## ⚠️ Lưu ý quan trọng

### 1. API URL Configuration
App hiện tại sử dụng:
- `VITE_API_URL` từ environment variable
- Mặc định: `/api` (relative path)

**Cho mobile app:**
- Nếu backend API ở domain khác: Cần set `VITE_API_URL=https://api-domain.com/api`
- Nếu backend và app cùng domain: Có thể dùng `/api` nhưng cần cấu hình CORS
- **Khuyến nghị**: Dùng URL tuyệt đối với HTTPS

### 2. Network Security
Android 9+ (API 28+) mặc định chặn HTTP cleartext traffic. Nếu API chưa có HTTPS:
- Cần tạo `network_security_config.xml`
- Hoặc upgrade API lên HTTPS (khuyến nghị)

### 3. CORS Configuration
Nếu API ở domain khác, đảm bảo backend đã cấu hình CORS cho mobile app origin.

## 📝 File cần tạo/sửa sau khi thêm Android platform

1. **android/app/src/main/AndroidManifest.xml**
   - Thêm Internet permission
   - Cấu hình network security config (nếu cần)

2. **android/app/src/main/res/xml/network_security_config.xml** (nếu cần HTTP)
   ```xml
   <?xml version="1.0" encoding="utf-8"?>
   <network-security-config>
       <domain-config cleartextTrafficPermitted="true">
           <domain includeSubdomains="true">your-api-domain.com</domain>
       </domain-config>
   </network-security-config>
   ```

3. **android/app/build.gradle**
   - Kiểm tra SDK versions
   - Cấu hình version code/name
   - Cấu hình signing (cho release)

## ✅ Sau khi hoàn thành checklist này

Bạn sẽ có thể:
- ✅ Build APK debug thành công
- ✅ Test app trên emulator/device
- ✅ Build APK release (sau khi cấu hình signing)

## 🔗 Tài liệu tham khảo

- Xem chi tiết trong `BUILD_APK_PLAN.md`
- [Capacitor Android Docs](https://capacitorjs.com/docs/android)
- [Android Network Security Config](https://developer.android.com/training/articles/security-config)
