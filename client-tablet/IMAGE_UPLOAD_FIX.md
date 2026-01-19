# 🔧 Fix Image Upload Issue trên Android

## 📋 Vấn đề

Sau khi chụp ảnh, ảnh được lưu trong `com.FastAccounting.app/files/Pictures` nhưng không thể upload lên server.

## ✅ Các cải thiện đã thực hiện

### 1. Thay đổi Camera Result Type
- **Trước**: Sử dụng `CameraResultType.Uri` - trả về file URI
- **Sau**: Sử dụng `CameraResultType.Base64` - trả về base64 data trực tiếp
- **Lý do**: Tránh vấn đề với file path và đọc file từ Filesystem

### 2. Cải thiện cách đọc file
Code hiện tại sẽ thử đọc file theo thứ tự ưu tiên:

1. **base64String** (nếu có từ Base64 result type)
   - Đọc trực tiếp từ base64 data
   - Nhanh nhất và đáng tin cậy nhất

2. **dataUrl** (nếu có)
   - Đọc từ data URL

3. **Path thực tế** (nếu có)
   - Parse file URI hoặc path
   - Đọc từ Filesystem API
   - Fallback nếu base64 không có

4. **webPath** (fallback cuối cùng)
   - Đọc từ web path
   - Có thể không hoạt động trên một số device

### 3. Cải thiện Error Handling
- Logging chi tiết để debug
- Error messages rõ ràng hơn
- Xử lý nhiều trường hợp lỗi khác nhau

## 🔍 Cách Debug

### 1. Kiểm tra Console Logs
Mở Chrome DevTools hoặc Android Studio Logcat và tìm:
- `Read image from base64String` - Đọc thành công từ base64
- `Read image from dataUrl` - Đọc từ dataUrl
- `Read image from Filesystem path` - Đọc từ path
- `Read image from webPath` - Đọc từ webPath
- `Failed to read from ...` - Thất bại khi đọc

### 2. Kiểm tra Photo Object
Nếu tất cả đều fail, log sẽ hiển thị:
- `All methods failed. Photo object: ...`
- Kiểm tra các properties có sẵn trong photo object

### 3. Kiểm tra Permissions
Vào Settings > Apps > FastAccounting > Permissions:
- ✅ **Camera** - Để chụp ảnh
- ✅ **Storage/Photos** - Để chọn từ gallery

## 📝 Code Changes

File: `src/utils/imagePicker.js`

**Thay đổi chính:**

1. **Camera Result Type**:
   ```javascript
   // Trước
   resultType: CameraResultType.Uri
   
   // Sau
   resultType: CameraResultType.Base64
   ```

2. **Đọc file theo nhiều cách**:
   - Ưu tiên base64String (từ Base64 result type)
   - Fallback to dataUrl, path, webPath

3. **Cải thiện error handling**:
   - Logging chi tiết
   - Error messages rõ ràng

## 🧪 Test

1. **Test chụp ảnh**:
   ```bash
   npm run android:build
   npm run cap:open
   ```

2. **Test upload ảnh**:
   - Vào màn hình "Giao dịch"
   - Click "Thêm ảnh" > "Chụp ảnh"
   - Chụp ảnh và upload
   - Kiểm tra console logs

3. **Test chọn từ gallery**:
   - Click "Thêm ảnh" > "Chọn từ album"
   - Chọn ảnh và upload
   - Kiểm tra console logs

## 📌 Lưu ý

- **Base64 Result Type**: 
  - Trả về data trực tiếp, không cần đọc file
  - Tốt hơn cho việc upload
  - File size có thể lớn hơn một chút (do base64 encoding)

- **Gallery (pickImages)**:
  - Tự động trả về photos với các properties
  - Code sẽ tự động thử các cách đọc khác nhau

- **File Object**:
  - Cuối cùng luôn tạo File object từ blob
  - Compatible với FormData upload

## 🔄 Nếu vẫn không hoạt động

1. **Kiểm tra console logs**:
   - Xem method nào được sử dụng
   - Xem lỗi cụ thể là gì

2. **Kiểm tra photo object**:
   - Log `photo` object để xem có properties gì
   - Có thể cần thêm cách đọc khác

3. **Thử cách khác**:
   - Có thể cần sử dụng `CameraResultType.DataUrl`
   - Hoặc cần parse path khác đi

---

**Ngày fix**: $(date)
**Trạng thái**: ✅ Đã cải thiện code, cần test trên device
