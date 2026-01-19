# 📁 Cách Kiểm tra File Đã Lưu trên Android

## 🔍 Vấn đề

File PDF đã được lưu thành công (theo logs), nhưng không thấy trong file manager khi check cache và files của app.

## 💡 Giải thích

### File được lưu ở đâu?

Từ logs, file được lưu vào:
```
file:///data/user/0/com.fastaccounting.app/files/FastAccounting/Phieu_TTCN_Co_Hoa.pdf
```

Đây là **internal storage** của app, không thể truy cập trực tiếp từ File Manager thông thường.

### Tại sao không thấy file?

1. **Internal Storage** (`/data/user/0/com.fastaccounting.app/files/`):
   - Chỉ app mới có thể truy cập
   - Không hiển thị trong File Manager thông thường
   - Cần root access hoặc ADB để xem

2. **Cache Directory** (`/data/user/0/com.fastaccounting.app/cache/`):
   - Cũng là internal storage
   - Có thể bị xóa bởi system khi cần space
   - Không hiển thị trong File Manager

## ✅ Cách Kiểm tra File Đã Lưu

### Cách 1: Sử dụng ADB (Android Debug Bridge)

1. **Kết nối device qua USB**
2. **Mở Command Prompt/Terminal**
3. **Chạy lệnh**:
   ```bash
   adb shell
   ls -la /data/data/com.fastaccounting.app/files/FastAccounting/
   ```

Hoặc:
```bash
adb shell ls -la /data/data/com.fastaccounting.app/cache/FastAccounting/
```

### Cách 2: Sử dụng Android Studio Device File Explorer

1. **Mở Android Studio**
2. **View > Tool Windows > Device File Explorer**
3. **Navigate đến**:
   - `/data/data/com.fastaccounting.app/files/FastAccounting/`
   - Hoặc `/data/data/com.fastaccounting.app/cache/FastAccounting/`
4. **Tìm file PDF**

### Cách 3: Kiểm tra qua Logs

Trong Logcat, tìm:
```
[FileDownload] ✅ SUCCESS: File saved to ...
[FileDownload] URI: file:///...
[FileDownload] ✅ File verified - Size: ... bytes
```

## 📌 Lưu ý Quan trọng

### File đã được lưu, nhưng:

1. **Không thể truy cập từ File Manager**:
   - Internal storage không hiển thị trong File Manager
   - Đây là behavior bình thường của Android

2. **File có thể được share**:
   - Share API sẽ cho phép mở file bằng app khác
   - User có thể lưu file vào nơi khác qua Share dialog

3. **File sẽ tồn tại**:
   - File không bị xóa tự động
   - Chỉ bị xóa khi:
     - Uninstall app
     - Clear app data
     - System cần space (cache directory)

## 🔄 Giải pháp: Lưu vào External Storage (Public Directory)

Nếu muốn file có thể truy cập từ File Manager, cần lưu vào **External Storage Public Directory** (như Download folder). Tuy nhiên:

- Cần permission `WRITE_EXTERNAL_STORAGE` (Android < 13)
- Cần permission `MANAGE_EXTERNAL_STORAGE` (Android 11+)
- Có thể phức tạp với scoped storage

## 🧪 Verify File Tồn Tại

Code hiện tại đã có verify:
- Sau khi lưu, code sẽ verify file tồn tại
- Logs sẽ hiển thị: `✅ File verified - Size: ... bytes`

## 📝 Kết luận

**File đã được lưu thành công!** 

- File nằm trong internal storage của app
- Không thể thấy từ File Manager (bình thường)
- Có thể mở/share qua Share dialog
- File sẽ tồn tại cho đến khi app bị uninstall hoặc clear data

Nếu muốn file có thể truy cập từ File Manager, cần implement lưu vào External Storage Public Directory (như Download folder).

---

**Tip**: Sử dụng Share dialog để mở file bằng app khác (như PDF viewer) và lưu vào nơi khác nếu cần!
