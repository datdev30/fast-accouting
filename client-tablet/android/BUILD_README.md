# Hướng dẫn Build APK

## Script Build APK

File `build-apk.ps1` giúp build APK release trong một lần chạy.

### Cách sử dụng:

#### Build APK thông thường:
```powershell
cd d:\FastAccounting\client-tablet\android
.\build-apk.ps1
```

#### Build với clean (xóa build cũ trước):
```powershell
.\build-apk.ps1 -Clean
```

#### Build mà không kiểm tra keystore:
```powershell
.\build-apk.ps1 -SkipKeystore
```

### Tính năng:

- ✅ Tự động kiểm tra và tạo keystore nếu chưa có
- ✅ Tự động tạo `keystore.properties` nếu thiếu
- ✅ Xử lý vấn đề JAVA_HOME tự động
- ✅ Hiển thị thông tin APK sau khi build thành công
- ✅ Hiển thị lệnh adb để cài đặt APK

### APK Output:

Sau khi build thành công, APK sẽ nằm tại:
```
app\build\outputs\apk\release\app-release.apk
```

### Cài đặt APK:

Sau khi build, bạn có thể cài đặt APK bằng lệnh:
```powershell
adb install "app\build\outputs\apk\release\app-release.apk"
```

Hoặc copy file APK vào thiết bị Android và cài đặt thủ công.

### Lưu ý:

- Keystore file (`fastaccounting-release.keystore`) và mật khẩu cần được giữ an toàn
- Nếu mất keystore, bạn sẽ không thể cập nhật app trên Google Play Store
- File keystore đã được thêm vào `.gitignore` để không commit lên git
