# 🧪 Hướng dẫn Test File Download trong Android Studio

## 📋 Chuẩn bị

1. **Mở Android Studio**:
   ```bash
   npm run cap:open
   ```

2. **Kết nối device hoặc chạy emulator**:
   - Kết nối Android device qua USB
   - Hoặc chạy Android Emulator
   - Đảm bảo device/emulator đã được nhận diện

3. **Build và cài đặt app**:
   - Trong Android Studio: **Run > Run 'app'**
   - Hoặc click nút Run (▶️)
   - Đợi app được build và cài đặt

## 🔍 Mở Logcat để xem logs

### Cách 1: Từ Android Studio
1. Mở tab **Logcat** ở phía dưới màn hình
2. Nếu không thấy: **View > Tool Windows > Logcat**

### Cách 2: Filter logs
1. Trong Logcat, chọn **package name**: `com.fastaccounting.app`
2. Hoặc filter theo tag: `Capacitor`, `FastAccounting`, `fileDownload`

### Cách 3: Filter theo level
- Chọn **Verbose** để xem tất cả logs
- Hoặc chọn **Error** để chỉ xem lỗi

## 📝 Các log messages quan trọng

### Khi tải file PDF thành công:
```
✅ File saved successfully to Data: file:///...
✅ File saved successfully to Cache: file:///...
✅ File saved successfully to Documents: file:///...
```

### Khi có lỗi:
```
❌ Failed to save to Data: [error message]
❌ Failed to save to Cache: [error message]
❌ Failed to save to Documents: [error message]
❌ Error saving file on native: [error details]
```

### Logs chi tiết:
```
Error details: {
  message: "...",
  code: "...",
  stack: "..."
}
```

## 🧪 Các bước test

### Test 1: Tải PDF từ "Chi tiết công nợ"

1. **Mở app trên device/emulator**
2. **Đăng nhập** vào app
3. **Vào màn hình "Khách hàng"**
4. **Chọn một khách hàng** để xem chi tiết công nợ
5. **Click nút "In Phiếu Nợ"** (hoặc icon Printer)
6. **Trong modal preview, click "Tải xuống"**
7. **Quan sát Logcat** để xem logs

### Test 2: Kiểm tra kết quả

**Nếu thành công:**
- Logcat sẽ hiển thị: `File saved successfully to ...`
- Share dialog sẽ mở ra
- File đã được lưu

**Nếu thất bại:**
- Logcat sẽ hiển thị error messages
- App sẽ hiển thị toast error
- Ghi lại error message để debug

## 🔍 Debug nếu có lỗi

### Lỗi 1: "Cannot save file to any directory"

**Kiểm tra:**
1. Xem logcat để biết directory nào đã fail
2. Kiểm tra permissions trong Settings
3. Kiểm tra storage space

**Logs cần tìm:**
```
Failed to save to Data: [error]
Failed to save to Cache: [error]
Failed to save to Documents: [error]
Last error: [error message]
```

### Lỗi 2: Permission denied

**Kiểm tra:**
1. Vào Settings > Apps > FastAccounting > Permissions
2. Đảm bảo **Storage** permission đã được cấp
3. Thử cấp lại permission và test lại

**Logs:**
```
Error: File access permission denied
Code: PERMISSION_DENIED
```

### Lỗi 3: Storage space

**Kiểm tra:**
1. Kiểm tra dung lượng trống trên device
2. Xóa một số file không cần thiết

**Logs:**
```
Error: Not enough storage space
Code: ENOSPC
```

### Lỗi 4: File path không hợp lệ

**Kiểm tra:**
1. Xem logcat để biết path được sử dụng
2. Kiểm tra xem path có đúng format không

**Logs:**
```
Error: Cannot create file
Code: ENOENT
```

## 📊 Các thông tin cần ghi lại khi test

1. **Device info**:
   - Android version
   - Device model
   - HarmonyOS version (nếu có)

2. **Logs**:
   - Copy toàn bộ logs từ Logcat
   - Đặc biệt là error messages

3. **Steps to reproduce**:
   - Ghi lại các bước đã làm
   - Screenshot nếu có thể

4. **Expected vs Actual**:
   - Expected: File được tải xuống thành công
   - Actual: Lỗi gì xảy ra

## 🛠️ Các lệnh hữu ích trong Logcat

### Filter theo tag:
```
tag:Capacitor
tag:fileDownload
tag:FastAccounting
```

### Filter theo level:
```
level:ERROR
level:WARN
```

### Search trong logs:
- Dùng search box trong Logcat
- Tìm: `file`, `download`, `save`, `error`, `permission`

## 📝 Checklist test

- [ ] App đã được build và cài đặt thành công
- [ ] Logcat đã được mở và filter đúng
- [ ] Đã test tải PDF từ "Chi tiết công nợ"
- [ ] Đã quan sát logs trong Logcat
- [ ] Đã ghi lại kết quả (thành công hoặc lỗi)
- [ ] Nếu có lỗi, đã copy error messages

## 🔄 Next Steps sau khi test

### Nếu thành công:
- ✅ Ghi lại logs để tham khảo
- ✅ Test trên các device khác nhau
- ✅ Test với các file size khác nhau

### Nếu có lỗi:
1. **Copy toàn bộ error logs**
2. **Ghi lại steps to reproduce**
3. **Kiểm tra permissions trong Settings**
4. **Kiểm tra storage space**
5. **Thử các giải pháp trong FILE_DOWNLOAD_FIX.md**

## 💡 Tips

1. **Clear Logcat trước khi test**:
   - Click icon "Clear" trong Logcat
   - Để dễ theo dõi logs mới

2. **Save logs**:
   - Right-click trong Logcat > "Save to File"
   - Lưu logs để phân tích sau

3. **Use breakpoints** (nếu cần):
   - Đặt breakpoint trong `fileDownload.js`
   - Debug step-by-step

4. **Test với file nhỏ trước**:
   - Để đảm bảo flow hoạt động
   - Sau đó test với file lớn hơn

---

**Lưu ý**: Sau khi test, hãy chia sẻ logs và kết quả để có thể debug tiếp nếu cần!
