# ⚡ Quick Test Guide - File Download

## 🚀 Bước 1: Mở Android Studio

```bash
npm run cap:open
```

## 🔍 Bước 2: Mở Logcat

1. Trong Android Studio, mở tab **Logcat** (phía dưới)
2. Filter: `[FileDownload]` hoặc `com.fastaccounting.app`

## 📱 Bước 3: Chạy App

1. Click **Run** (▶️) hoặc **Run > Run 'app'**
2. Đợi app được cài đặt trên device/emulator

## 🧪 Bước 4: Test Download PDF

1. Đăng nhập vào app
2. Vào **Khách hàng** > Chọn một khách hàng
3. Click **In Phiếu Nợ**
4. Trong modal, click **Tải xuống**
5. **Quan sát Logcat**

## ✅ Logs cần tìm (Thành công)

```
[FileDownload] Starting to save file: ...
[FileDownload] File size: ... KB
[FileDownload] Trying to save to Data...
[FileDownload] ✅ SUCCESS: File saved to Data
[FileDownload] URI: file:///...
[FileDownload] Attempting to share file...
[FileDownload] ✅ Share dialog opened successfully
```

## ❌ Logs cần tìm (Lỗi)

```
[FileDownload] ❌ FAILED to save to Data: ...
[FileDownload] ❌ ALL METHODS FAILED
[FileDownload] Error message: ...
[FileDownload] Error code: ...
```

## 📋 Copy logs để gửi

1. Trong Logcat, chọn các dòng log liên quan
2. Right-click > **Copy** hoặc **Ctrl+C**
3. Paste vào file text hoặc gửi cho dev

## 🔑 Filter nhanh trong Logcat

- Search box: `[FileDownload]`
- Hoặc: `fileDownload`
- Hoặc: `ERROR` để chỉ xem lỗi

---

**Tip**: Clear Logcat trước khi test để dễ theo dõi!
