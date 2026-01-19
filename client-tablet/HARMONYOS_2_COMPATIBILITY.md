# 🔧 Tương thích HarmonyOS 2.0 (Android 10)

## 📋 Thông tin về HarmonyOS 2.0

HarmonyOS 2.0 trên điện thoại thông minh được xem là dựa trên **Android 10 (API level 29)**.

## 🔍 Các điều chỉnh đã thực hiện

### 1. ✅ Permissions cho HarmonyOS 2.0

**Vấn đề**: 
- HarmonyOS 2.0 (Android 10) cần `READ_EXTERNAL_STORAGE` và `WRITE_EXTERNAL_STORAGE` để truy cập file
- Các permissions này bị giới hạn `maxSdkVersion="32"` (chỉ cho Android <= 12)
- `READ_MEDIA_IMAGES` chỉ có từ Android 13+ (API 33+), không hoạt động trên HarmonyOS 2.0

**Giải pháp**:
- ✅ Bỏ giới hạn `maxSdkVersion` cho `READ_EXTERNAL_STORAGE` và `WRITE_EXTERNAL_STORAGE`
- ✅ Đảm bảo permissions hoạt động trên cả HarmonyOS 2.0 và các phiên bản Android mới hơn
- ✅ Giữ `READ_MEDIA_IMAGES` cho Android 13+ (sẽ tự động được sử dụng nếu có)

**Files đã sửa**:
- `client-tablet/android/app/src/main/AndroidManifest.xml`

**Thay đổi**:
```xml
<!-- Trước -->
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="32" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />

<!-- Sau -->
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
```

### 2. ✅ Camera & Gallery Permissions

**Vấn đề**: 
- HarmonyOS 2.0 sử dụng `READ_EXTERNAL_STORAGE` để truy cập gallery/album
- `READ_MEDIA_IMAGES` không có trên Android 10

**Giải pháp**:
- ✅ Camera plugin tự động xử lý permissions
- ✅ Code đã được cập nhật để request permissions runtime
- ✅ Sử dụng `Camera.checkPermissions()` và `Camera.requestPermissions()` để đảm bảo có quyền

**Files đã sửa**:
- `client-tablet/src/utils/imagePicker.js`

### 3. ✅ File Download

**Vấn đề**: 
- HarmonyOS 2.0 cần `WRITE_EXTERNAL_STORAGE` để lưu file vào Documents folder

**Giải pháp**:
- ✅ Permissions đã được cập nhật trong AndroidManifest
- ✅ File download sử dụng `Directory.Documents` của Capacitor Filesystem
- ✅ Error handling đã được cải thiện

**Files đã sửa**:
- `client-tablet/src/utils/fileDownload.js`
- `client-tablet/android/app/src/main/AndroidManifest.xml`

---

## 📝 Permissions trong AndroidManifest.xml

### Permissions cho HarmonyOS 2.0 (Android 10):
```xml
<!-- Internet -->
<uses-permission android:name="android.permission.INTERNET" />

<!-- File access - Cần cho HarmonyOS 2.0 -->
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />

<!-- Camera -->
<uses-permission android:name="android.permission.CAMERA" />

<!-- Media access cho Android 13+ (không ảnh hưởng HarmonyOS 2.0) -->
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
<uses-permission android:name="android.permission.READ_MEDIA_VISUAL_USER_SELECTED" />
```

---

## 🧪 Kiểm tra trên HarmonyOS 2.0

### 1. File Download
- [ ] Test tải xuống PDF
- [ ] Kiểm tra file được lưu vào Documents folder
- [ ] Kiểm tra Share dialog hoạt động

### 2. Camera & Gallery
- [ ] Test chụp ảnh từ camera
- [ ] Test chọn ảnh từ gallery/album
- [ ] Kiểm tra permission dialog hiển thị đúng
- [ ] Kiểm tra ảnh có thể upload thành công

### 3. Permissions
- [ ] Vào Settings > Apps > FastAccounting > Permissions
- [ ] Kiểm tra các quyền sau có sẵn:
  - ✅ Storage (READ_EXTERNAL_STORAGE, WRITE_EXTERNAL_STORAGE)
  - ✅ Camera
- [ ] Cấp quyền và test lại

---

## ⚠️ Lưu ý quan trọng

1. **Permissions Runtime Request**:
   - HarmonyOS 2.0 yêu cầu request permissions tại runtime
   - App sẽ tự động request khi cần sử dụng camera hoặc truy cập file
   - User cần cấp quyền trong Settings nếu từ chối lần đầu

2. **File Storage**:
   - Files được lưu vào `Documents` directory của app
   - Có thể truy cập qua File Manager
   - Share API có thể fail trên một số device HarmonyOS, nhưng file vẫn được lưu thành công

3. **Camera & Gallery**:
   - Camera permission được request tự động khi chụp ảnh
   - Gallery access sử dụng `READ_EXTERNAL_STORAGE` trên HarmonyOS 2.0
   - `READ_MEDIA_IMAGES` chỉ hoạt động trên Android 13+

4. **Compatibility**:
   - Code tương thích với cả HarmonyOS 2.0 và Android mới hơn
   - Permissions được xử lý tự động bởi Capacitor plugins
   - Không cần thay đổi code khi chuyển giữa các phiên bản Android

---

## 🚀 Build và Test

```bash
# Build app
npm run android:build

# Mở Android Studio
npm run cap:open

# Hoặc build APK trực tiếp
cd android
.\gradlew.bat assembleDebug
```

APK sẽ được tạo tại: `android/app/build/outputs/apk/debug/app-debug.apk`

---

## 📌 Troubleshooting

### Nếu file download không hoạt động:
1. Kiểm tra quyền Storage trong Settings
2. Thử cấp quyền manually
3. Kiểm tra log trong Android Studio để xem lỗi cụ thể

### Nếu camera/gallery không hoạt động:
1. Kiểm tra quyền Camera và Storage trong Settings
2. Đảm bảo đã cấp quyền khi app request
3. Thử restart app sau khi cấp quyền

### Nếu có lỗi permission:
1. Vào Settings > Apps > FastAccounting > Permissions
2. Cấp tất cả quyền cần thiết
3. Restart app và test lại

---

**Ngày cập nhật**: $(date)
**Trạng thái**: ✅ Đã điều chỉnh cho HarmonyOS 2.0
