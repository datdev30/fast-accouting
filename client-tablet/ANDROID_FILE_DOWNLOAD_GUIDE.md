# 📥 Hướng dẫn Tải/Lưu File trên Android App

## 📋 Tổng quan các phương pháp

### 1. **MediaStore API** (Khuyến nghị cho Android 10+)
✅ **Ưu điểm:**
- Hoạt động tốt trên Android 10+ (API 29+)
- Không cần permission `WRITE_EXTERNAL_STORAGE` cho file app tạo
- File hiển thị trong Downloads folder và File Manager
- Tuân thủ Scoped Storage của Android

❌ **Nhược điểm:**
- Cần native code (Kotlin/Java)
- Không có sẵn trong Capacitor Filesystem plugin
- Cần tạo custom Capacitor plugin

**Code mẫu (Kotlin):**
```kotlin
fun saveToDownloads(context: Context, fileName: String, mimeType: String, data: ByteArray) {
    val resolver = context.contentResolver
    val contentValues = ContentValues().apply {
        put(MediaStore.MediaColumns.DISPLAY_NAME, fileName)
        put(MediaStore.MediaColumns.MIME_TYPE, mimeType)
        put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS)
        put(MediaStore.Downloads.IS_PENDING, 1) // Đánh dấu đang ghi
    }
    
    val collection = MediaStore.Downloads.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY)
    val itemUri = resolver.insert(collection, contentValues)
        ?: throw IOException("Failed to create MediaStore record")
    
    resolver.openOutputStream(itemUri).use { out ->
        out?.write(data)
    }
    
    // Xóa IS_PENDING sau khi ghi xong
    contentValues.clear()
    contentValues.put(MediaStore.Downloads.IS_PENDING, 0)
    resolver.update(itemUri, contentValues, null, null)
}
```

---

### 2. **DownloadManager API**
✅ **Ưu điểm:**
- Đơn giản, có sẵn trong Android
- Tự động hiển thị notification
- Tự động retry khi lỗi
- Tốt cho download từ URL

❌ **Nhược điểm:**
- `addCompletedDownload()` đã deprecated trên API 29+
- Không tốt cho file tạo local (PDF generate từ app)
- Cần URL để download, không phù hợp cho blob data

**Khi nào dùng:**
- Download file từ internet
- Cần notification và progress tracking
- Không phù hợp cho file tạo từ blob trong app

---

### 3. **Capacitor Filesystem API** (Hiện tại đang dùng)
✅ **Ưu điểm:**
- Dễ sử dụng, không cần native code
- Hoạt động tốt cho app-private storage
- Cross-platform (Android + iOS)

❌ **Nhược điểm:**
- **Không thể lưu vào Downloads folder trên Android 10+**
- `Directory.ExternalStorage` chỉ hoạt động Android 9 trở xuống
- File lưu vào internal storage, không hiển thị trong File Manager
- Cần Share API để user có thể lưu vào Downloads

**Hiện trạng:**
- Android 9-: ✅ Có thể lưu vào Downloads
- Android 10+ (HarmonyOS 2.0): ❌ Không thể lưu trực tiếp vào Downloads
- Fallback: Lưu vào Cache/Data, dùng Share API

---

### 4. **Share API** (Hiện tại đang dùng)
✅ **Ưu điểm:**
- Đơn giản, không cần permission
- User tự chọn nơi lưu (Downloads, Drive, Email, etc.)
- Hoạt động trên mọi Android version

❌ **Nhược điểm:**
- User phải thao tác thêm (chọn app, chọn nơi lưu)
- Không tự động lưu vào Downloads
- Phụ thuộc vào app khác

---

## 🎯 Giải pháp tốt nhất cho HarmonyOS 2.0 (Android 10)

### **Option 1: Tạo Custom Capacitor Plugin với MediaStore** (Khuyến nghị)

Tạo plugin để sử dụng MediaStore API, đảm bảo file luôn lưu vào Downloads folder.

**Cấu trúc:**
```
client-tablet/
├── src/
│   └── plugins/
│       └── DownloadsPlugin.ts (TypeScript interface)
└── android/
    └── app/
        └── src/
            └── main/
                └── java/
                    └── com/
                        └── fastaccounting/
                            └── app/
                                └── DownloadsPlugin.java (Native implementation)
```

**Lợi ích:**
- ✅ File luôn lưu vào Downloads folder
- ✅ Hiển thị trong File Manager
- ✅ Không cần permission cho file app tạo
- ✅ Hoạt động tốt trên HarmonyOS 2.0

**Nhược điểm:**
- Cần viết native code
- Cần build lại plugin

---

### **Option 2: Cải thiện Share API** (Đơn giản hơn)

Giữ nguyên cách hiện tại, nhưng cải thiện UX:
- Thông báo rõ ràng hơn
- Hướng dẫn user chọn "Save to Downloads"
- Có thể thêm shortcut để mở Downloads folder

**Lợi ích:**
- ✅ Không cần native code
- ✅ Hoạt động ngay
- ✅ User có quyền kiểm soát

**Nhược điểm:**
- User phải thao tác thêm
- Không tự động lưu

---

### **Option 3: Hybrid Approach**

Kết hợp cả hai:
1. Thử MediaStore trước (nếu có plugin)
2. Nếu fail, fallback về Share API

**Lợi ích:**
- ✅ Tự động lưu khi có thể
- ✅ Fallback an toàn
- ✅ Tương thích tốt

---

## 📊 So sánh các phương pháp

| Phương pháp | Android 9- | Android 10+ | HarmonyOS 2.0 | Cần Native Code | File hiển thị trong File Manager |
|------------|-----------|-------------|----------------|-----------------|----------------------------------|
| MediaStore API | ✅ | ✅ | ✅ | ✅ | ✅ |
| DownloadManager | ✅ | ⚠️ (deprecated) | ⚠️ | ❌ | ✅ |
| Capacitor Filesystem (ExternalStorage) | ✅ | ❌ | ❌ | ❌ | ❌ |
| Capacitor Filesystem (Cache/Data) | ✅ | ✅ | ✅ | ❌ | ❌ |
| Share API | ✅ | ✅ | ✅ | ❌ | ✅ (user chọn) |

---

## 🔧 Implementation: Tạo Custom Plugin với MediaStore

### Bước 1: Tạo Plugin Interface (TypeScript)

**File: `src/plugins/DownloadsPlugin.ts`**
```typescript
import { registerPlugin } from '@capacitor/core';

export interface DownloadsPlugin {
  saveToDownloads(options: {
    fileName: string;
    data: string; // base64 string
    mimeType: string;
  }): Promise<{ uri: string; path: string }>;
}

const DownloadsPlugin = registerPlugin<DownloadsPlugin>('Downloads', {
  web: () => import('./DownloadsPluginWeb').then(m => new m.DownloadsPluginWeb()),
});

export * from './definitions';
export { DownloadsPlugin };
```

### Bước 2: Tạo Native Implementation (Kotlin)

**File: `android/app/src/main/java/com/fastaccounting/app/DownloadsPlugin.kt`**
```kotlin
package com.fastaccounting.app

import android.content.ContentValues
import android.content.Context
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import java.io.IOException
import java.util.Base64

@CapacitorPlugin(name = "Downloads")
class DownloadsPlugin : Plugin() {

    @PluginMethod
    fun saveToDownloads(call: PluginCall) {
        val fileName = call.getString("fileName") ?: run {
            call.reject("fileName is required")
            return
        }
        val base64Data = call.getString("data") ?: run {
            call.reject("data is required")
            return
        }
        val mimeType = call.getString("mimeType", "application/octet-stream")

        try {
            val dataBytes = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                Base64.getDecoder().decode(base64Data)
            } else {
                android.util.Base64.decode(base64Data, android.util.Base64.DEFAULT)
            }

            val uri = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                // Android 10+ (API 29+): Use MediaStore
                saveViaMediaStore(fileName, mimeType, dataBytes)
            } else {
                // Android 9-: Use legacy method
                saveViaLegacy(fileName, dataBytes)
            }

            val result = JSObject()
            result.put("uri", uri.toString())
            result.put("path", uri.path ?: "")
            call.resolve(result)
        } catch (e: Exception) {
            call.reject("Failed to save file: ${e.message}", e)
        }
    }

    @Suppress("DEPRECATION")
    private fun saveViaLegacy(fileName: String, data: ByteArray): android.net.Uri {
        val downloadsDir = Environment.getExternalStoragePublicDirectory(
            Environment.DIRECTORY_DOWNLOADS
        )
        val file = java.io.File(downloadsDir, fileName)
        file.parentFile?.mkdirs()
        file.writeBytes(data)
        return android.net.Uri.fromFile(file)
    }

    private fun saveViaMediaStore(
        fileName: String,
        mimeType: String,
        data: ByteArray
    ): android.net.Uri {
        val resolver = context.contentResolver
        val contentValues = ContentValues().apply {
            put(MediaStore.MediaColumns.DISPLAY_NAME, fileName)
            put(MediaStore.MediaColumns.MIME_TYPE, mimeType)
            put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                put(MediaStore.Downloads.IS_PENDING, 1)
            }
        }

        val collection = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            MediaStore.Downloads.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY)
        } else {
            MediaStore.Files.getContentUri("external")
        }

        val itemUri = resolver.insert(collection, contentValues)
            ?: throw IOException("Failed to create MediaStore record")

        resolver.openOutputStream(itemUri)?.use { out ->
            out.write(data)
            out.flush()
        } ?: throw IOException("Failed to open output stream")

        // Clear IS_PENDING flag
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            contentValues.clear()
            contentValues.put(MediaStore.Downloads.IS_PENDING, 0)
            resolver.update(itemUri, contentValues, null, null)
        }

        return itemUri
    }
}
```

### Bước 3: Sử dụng trong JavaScript

**File: `src/utils/fileDownload.js`**
```javascript
import { DownloadsPlugin } from '../plugins/DownloadsPlugin';

// Thêm vào đầu danh sách thử
if (Capacitor.isNativePlatform()) {
    try {
        const result = await DownloadsPlugin.saveToDownloads({
            fileName: fullFilename,
            data: base64Data,
            mimeType: mimeType
        });
        console.log('[FileDownload] ✅ Saved to Downloads:', result.uri);
        // File đã được lưu vào Downloads folder!
        return;
    } catch (error) {
        console.warn('[FileDownload] MediaStore failed, fallback to Filesystem:', error);
        // Fallback to existing Filesystem code
    }
}
```

---

## 🧪 Test trên HarmonyOS 2.0

### Test với MediaStore Plugin:
1. Build app với plugin mới
2. Tải PDF
3. Kiểm tra File Manager > Downloads folder
4. File phải hiển thị ngay

### Test với Share API (hiện tại):
1. Tải PDF
2. Share dialog mở ra
3. Chọn "Files" hoặc "File Manager"
4. Chọn "Save" hoặc "Downloads"
5. File được lưu vào Downloads

---

## 📝 Khuyến nghị

### Cho HarmonyOS 2.0 (Android 10):

**Nếu muốn file tự động lưu vào Downloads:**
→ **Tạo Custom Plugin với MediaStore** (Option 1)

**Nếu chấp nhận user phải chọn nơi lưu:**
→ **Giữ nguyên Share API** (Option 2) - Đơn giản, không cần native code

**Nếu muốn cả hai:**
→ **Hybrid Approach** (Option 3) - Thử MediaStore trước, fallback Share API

---

## 🔗 Tài liệu tham khảo

- [Android MediaStore Documentation](https://developer.android.com/training/data-storage/shared/media)
- [Capacitor Plugin Development](https://capacitorjs.com/docs/plugins/creating-plugins)
- [Android Scoped Storage](https://developer.android.com/training/data-storage)
- [HarmonyOS 2.0 Compatibility](https://developer.harmonyos.com/)

---

**Ngày tạo**: $(date)
**Trạng thái**: 📋 Tài liệu tham khảo - Cần quyết định phương pháp implementation
