# 📥 Fix: Lưu File vào Thư mục Download

## 📋 Vấn đề

User muốn file PDF được lưu vào thư mục **Download** của máy để có thể truy cập từ File Manager.

## ✅ Các thay đổi đã thực hiện

### 1. Thêm Directory.ExternalStorage vào danh sách thử
- **Ưu tiên**: `Directory.ExternalStorage` - Có thể lưu vào Download folder
- **Path**: `Download/${filename}` - Lưu trực tiếp vào Download folder
- **Fallback**: Cache, Data, Documents nếu ExternalStorage không hoạt động

### 2. Cập nhật FileProvider paths
- Thêm `<external-path name="downloads" path="Download/" />` trong `file_paths.xml`
- Hỗ trợ FileProvider cho external storage

### 3. Cải thiện thông báo
- Thông báo rõ ràng cho user biết file đã được lưu
- Hướng dẫn chọn ứng dụng để mở hoặc lưu vào Download

## 🔍 Lưu ý về Android Versions

### Android 9 trở xuống:
- ✅ `Directory.ExternalStorage` hoạt động tốt
- ✅ Có thể lưu trực tiếp vào Download folder
- ✅ File có thể truy cập từ File Manager

### Android 10+ (HarmonyOS 2.0):
- ⚠️ `Directory.ExternalStorage` có thể không hoạt động do Scoped Storage
- ⚠️ Có thể fallback về Cache hoặc Data
- ✅ Share API vẫn hoạt động để user có thể lưu vào Download

### Android 11+:
- ❌ `Directory.ExternalStorage` không hoạt động
- ✅ Cần sử dụng MediaStore API hoặc DownloadManager
- ✅ Share API là cách tốt nhất

## 🧪 Test trên HarmonyOS 2.0

1. **Build và cài đặt app**:
   ```bash
   npm run android:build
   ```

2. **Test download PDF**:
   - Vào "Chi tiết công nợ"
   - Click "Tải xuống"
   - Quan sát logs trong Logcat

3. **Kiểm tra logs**:
   - Tìm `[FileDownload] Trying to save to ExternalStorage...`
   - Nếu thành công: `✅ SUCCESS: File saved to ExternalStorage`
   - Nếu fail: Sẽ tự động fallback về Cache

4. **Kiểm tra file**:
   - Mở File Manager
   - Vào thư mục **Download**
   - Tìm file PDF

## 📝 Code Changes

### fileDownload.js
- Thêm `Directory.ExternalStorage` vào đầu danh sách
- Path: `Download/${filename}` cho ExternalStorage
- Fallback tự động nếu ExternalStorage không hoạt động

### file_paths.xml
- Thêm `<external-path name="downloads" path="Download/" />`
- Hỗ trợ FileProvider cho external storage

## 🔄 Nếu ExternalStorage không hoạt động

Code sẽ tự động:
1. Thử ExternalStorage trước
2. Nếu fail, fallback về Cache
3. Nếu Cache fail, thử Data
4. Nếu Data fail, thử Documents

**Kết quả**: File vẫn được lưu, nhưng có thể không ở Download folder. User có thể dùng Share dialog để lưu vào Download.

## 💡 Giải pháp thay thế (nếu cần)

Nếu muốn đảm bảo file luôn được lưu vào Download folder trên Android 10+:

1. **Sử dụng MediaStore API** (cần native plugin)
2. **Sử dụng DownloadManager** (cần native plugin)
3. **Sử dụng Share API** - User tự chọn nơi lưu (đơn giản nhất)

---

**Ngày fix**: $(date)
**Trạng thái**: ✅ Đã thêm hỗ trợ ExternalStorage, cần test trên HarmonyOS 2.0
