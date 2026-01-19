# 🔧 Fix File Download Issue trên Android

## 📋 Vấn đề

Mặc dù đã cấp quyền truy cập file, nhưng vẫn không thể tải xuống PDF với thông báo:
"Lỗi: Không thể lưu file, vui lòng kiểm tra quyền truy cập file"

## ✅ Các cải thiện đã thực hiện

### 1. Thử nhiều thư mục khác nhau
Code hiện tại sẽ thử lưu file vào các thư mục theo thứ tự:
1. **Directory.Data** - App-specific data directory (không cần permission runtime)
2. **Directory.Cache** - Cache directory (không cần permission runtime)
3. **Directory.Documents** - Documents directory (có thể cần permission trên một số device)

### 2. Cải thiện Error Handling
- Logging chi tiết để debug
- Error messages rõ ràng hơn
- Phân biệt các loại lỗi khác nhau

### 3. Sử dụng Subdirectory
- File được lưu trong subdirectory `FastAccounting/` để tránh conflict

## 🔍 Cách Debug

### 1. Kiểm tra Console Logs
Mở Chrome DevTools hoặc Android Studio Logcat và tìm:
- `File saved successfully to ...` - File đã được lưu thành công
- `Failed to save to ...` - Thất bại khi lưu vào thư mục cụ thể
- `Error saving file on native:` - Lỗi chi tiết

### 2. Kiểm tra Permissions
Vào Settings > Apps > FastAccounting > Permissions:
- ✅ **Storage** (READ_EXTERNAL_STORAGE, WRITE_EXTERNAL_STORAGE)
- ✅ **Files and media** (READ_MEDIA_IMAGES - cho Android 13+)

### 3. Kiểm tra Storage Space
Đảm bảo device có đủ dung lượng trống.

### 4. Kiểm tra File Size
File PDF quá lớn có thể gây vấn đề. Kiểm tra kích thước file trong console.

## 🛠️ Các giải pháp thay thế (nếu vẫn không hoạt động)

### Giải pháp 1: Sử dụng Share API trực tiếp
Nếu không thể lưu file, có thể thử share blob trực tiếp (cần modify code).

### Giải pháp 2: Request Permission Runtime
Có thể cần request permission runtime trước khi lưu file (hiện tại chưa implement).

### Giải pháp 3: Sử dụng External Storage
Có thể thử sử dụng Directory.External (cần permission MANAGE_EXTERNAL_STORAGE trên Android 11+).

## 📝 Code Changes

File: `src/utils/fileDownload.js`

**Thay đổi chính:**
- Thử nhiều thư mục khác nhau
- Cải thiện error handling
- Thêm logging chi tiết
- Sử dụng subdirectory

## 🧪 Test

1. **Test trên device thật**:
   ```bash
   npm run android:build
   npm run cap:open
   ```

2. **Test download PDF**:
   - Vào màn hình "Chi tiết công nợ"
   - Click "Tải xuống" PDF
   - Kiểm tra console logs

3. **Nếu vẫn lỗi**:
   - Kiểm tra console logs để xem lỗi cụ thể
   - Kiểm tra permissions trong Settings
   - Kiểm tra storage space

## 📌 Lưu ý

- **Directory.Data** và **Directory.Cache** không cần permission runtime
- **Directory.Documents** có thể cần permission trên một số device/OS
- File được lưu trong app-specific directory, không thể truy cập từ File Manager (trừ khi share)
- Share API sẽ cho phép user mở file bằng app khác hoặc lưu vào nơi khác

## 🔄 Next Steps (nếu vẫn không hoạt động)

1. **Thêm runtime permission request**:
   - Sử dụng Capacitor Permissions plugin
   - Request permission trước khi lưu file

2. **Sử dụng cách khác**:
   - Lưu file vào temporary location
   - Sử dụng Intent để mở file
   - Hoặc chỉ dùng Share API mà không lưu file

3. **Kiểm tra Capacitor Filesystem version**:
   - Đảm bảo đang dùng version mới nhất
   - Kiểm tra breaking changes

---

**Ngày fix**: $(date)
**Trạng thái**: ✅ Đã cải thiện code, cần test trên device
