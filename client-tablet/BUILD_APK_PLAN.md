# Kế hoạch Build APK cho FastAccounting Mobile App

## 📋 Tổng quan

Kế hoạch này hướng dẫn build file APK từ dự án `client-tablet` sử dụng Capacitor cho Android.

## ⚠️ Vấn đề cần sửa trước

1. **Cấu hình webDir không khớp**: 
   - `vite.config.js` build ra `dist-tablet`
   - `capacitor.config.ts` trỏ đến `dist`
   - **Cần sửa**: Cập nhật `capacitor.config.ts` để trỏ đến `dist-tablet`

## 📦 Yêu cầu hệ thống

### 1. Phần mềm cần cài đặt

- [x] **Node.js** (v18+)
- [ ] **Java JDK** (v17 hoặc v11) - Cần cho Android build
- [ ] **Android Studio** (latest) - IDE và Android SDK
- [ ] **Android SDK** (API level 33+)
- [ ] **Gradle** (thường đi kèm Android Studio)

### 2. Biến môi trường cần cấu hình

```bash
# JAVA_HOME
JAVA_HOME=C:\Program Files\Java\jdk-17

# ANDROID_HOME hoặc ANDROID_SDK_ROOT
ANDROID_HOME=C:\Users\<username>\AppData\Local\Android\Sdk

# Thêm vào PATH
%ANDROID_HOME%\platform-tools
%ANDROID_HOME%\tools
%ANDROID_HOME%\tools\bin
```

## 🚀 Các bước thực hiện

### Bước 1: Sửa cấu hình Capacitor

**File**: `capacitor.config.ts`

Cần sửa `webDir` từ `'dist'` thành `'dist-tablet'` để khớp với output của Vite.

### Bước 2: Cài đặt dependencies

```bash
cd client-tablet
npm install
```

### Bước 3: Build web app

```bash
npm run build
```

Kiểm tra output trong thư mục `dist-tablet/` đã có đầy đủ files.

### Bước 4: Thêm Android platform (lần đầu tiên)

```bash
npx cap add android
```

Lệnh này sẽ:
- Tạo thư mục `android/` trong project
- Cấu hình Android project với Capacitor
- Tạo các file cấu hình cần thiết

### Bước 5: Sync code với Android project

```bash
npm run cap:sync
```

Hoặc sử dụng script tự động:
```bash
npm run android:build
```

Lệnh này sẽ:
- Copy web assets từ `dist-tablet/` vào Android project
- Đồng bộ các thay đổi cấu hình

### Bước 6: Cấu hình Android project

#### 6.1. Kiểm tra `android/app/build.gradle`

Cần đảm bảo:
- `minSdkVersion`: 22+ (Android 5.1)
- `targetSdkVersion`: 33+ (Android 13)
- `compileSdkVersion`: 33+

#### 6.2. Cấu hình Permissions (nếu cần)

Kiểm tra file `android/app/src/main/AndroidManifest.xml`:
- Internet permission (thường đã có sẵn)
- Camera, Storage (nếu app cần)

#### 6.3. Cấu hình App Icon và Splash Screen

- Icon: `android/app/src/main/res/mipmap-*/ic_launcher.png`
- Splash: Có thể dùng plugin `@capacitor/splash-screen`

### Bước 7: Build APK

Có 2 cách build APK:

#### Cách 1: Build từ Android Studio (Khuyến nghị)

```bash
npm run cap:open
```

Trong Android Studio:
1. Chờ Gradle sync hoàn tất
2. **Build > Build Bundle(s) / APK(s) > Build APK(s)**
3. APK sẽ được tạo tại: `android/app/build/outputs/apk/debug/app-debug.apk`

#### Cách 2: Build từ Command Line

```bash
cd android
./gradlew assembleDebug
```

Trên Windows:
```powershell
cd android
.\gradlew.bat assembleDebug
```

APK sẽ được tạo tại: `android/app/build/outputs/apk/debug/app-debug.apk`

### Bước 8: Build APK Release (Để publish lên Play Store)

#### 8.1. Tạo Keystore (lần đầu tiên)

```bash
keytool -genkey -v -keystore fastaccounting-release.keystore -alias fastaccounting -keyalg RSA -keysize 2048 -validity 10000
```

**Lưu ý**: 
- Lưu keystore ở vị trí an toàn
- Ghi nhớ password và alias
- **KHÔNG commit keystore vào git**

#### 8.2. Cấu hình signing trong `android/app/build.gradle`

```gradle
android {
    ...
    signingConfigs {
        release {
            storeFile file('../fastaccounting-release.keystore')
            storePassword System.getenv("KEYSTORE_PASSWORD")
            keyAlias 'fastaccounting'
            keyPassword System.getenv("KEY_PASSWORD")
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            shrinkResources true
        }
    }
}
```

#### 8.3. Tạo file `.env` cho keystore (không commit)

Tạo file `android/.env`:
```
KEYSTORE_PASSWORD=your_keystore_password
KEY_PASSWORD=your_key_password
```

#### 8.4. Build Release APK

Từ Android Studio:
- **Build > Generate Signed Bundle / APK**
- Chọn APK
- Chọn keystore và nhập passwords
- Chọn release build variant

Hoặc từ command line:
```powershell
cd android
$env:KEYSTORE_PASSWORD="your_password"
$env:KEY_PASSWORD="your_password"
.\gradlew.bat assembleRelease
```

APK sẽ được tạo tại: `android/app/build/outputs/apk/release/app-release.apk`

## 🔄 Workflow phát triển

### Development

1. Phát triển web app: `npm run dev`
2. Test trên browser
3. Khi cần test trên Android:
   ```bash
   npm run build
   npm run cap:sync
   npm run cap:open
   ```
4. Chạy app từ Android Studio (Run button hoặc Shift+F10)

### Production Build

1. Cập nhật version trong:
   - `package.json`
   - `android/app/build.gradle` (versionCode, versionName)
   - `capacitor.config.ts` (nếu cần)

2. Build và sync:
   ```bash
   npm run build
   npm run cap:sync
   ```

3. Build release APK (theo Bước 8)

## 📝 Scripts đề xuất thêm vào package.json

```json
{
  "scripts": {
    "android:build": "npm run build && cap sync android",
    "android:dev": "npm run build && cap sync android && cap open android",
    "android:run": "npm run build && cap sync android && cap run android",
    "android:build:release": "npm run build && cap sync android && cd android && gradlew assembleRelease"
  }
}
```

## 🐛 Xử lý lỗi thường gặp

### 1. Lỗi "SDK location not found"
- Kiểm tra biến môi trường `ANDROID_HOME`
- Hoặc tạo file `android/local.properties`:
  ```
  sdk.dir=C:\\Users\\<username>\\AppData\\Local\\Android\\Sdk
  ```

### 2. Lỗi Gradle sync failed
- Mở Android Studio
- File > Invalidate Caches / Restart
- Hoặc xóa `.gradle` folder và sync lại

### 3. Lỗi "Execution failed for task ':app:mergeDebugResources'"
- Clean project: `./gradlew clean`
- Rebuild: `./gradlew assembleDebug`

### 4. APK quá lớn
- Enable ProGuard/R8 trong `build.gradle`
- Sử dụng Android App Bundle (.aab) thay vì APK

## 📦 Tối ưu hóa APK

### 1. Enable ProGuard/R8

Trong `android/app/build.gradle`:
```gradle
buildTypes {
    release {
        minifyEnabled true
        shrinkResources true
        proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
}
```

### 2. Tạo Android App Bundle (AAB) - Khuyến nghị cho Play Store

```bash
cd android
./gradlew bundleRelease
```

File `.aab` sẽ được tạo tại: `android/app/build/outputs/bundle/release/app-release.aab`

## ✅ Checklist trước khi build

- [ ] Đã sửa `capacitor.config.ts` (webDir: 'dist-tablet')
- [ ] Đã cài đặt Android Studio và Android SDK
- [ ] Đã cấu hình biến môi trường (JAVA_HOME, ANDROID_HOME)
- [ ] Đã build web app thành công (`npm run build`)
- [ ] Đã thêm Android platform (`npx cap add android`)
- [ ] Đã sync code (`npm run cap:sync`)
- [ ] Đã kiểm tra permissions trong AndroidManifest.xml
- [ ] Đã cấu hình app icon (nếu cần)
- [ ] Đã test trên emulator/device trước khi build release

## 📚 Tài liệu tham khảo

- [Capacitor Android Documentation](https://capacitorjs.com/docs/android)
- [Android Developer Guide](https://developer.android.com/studio/build)
- [Signing Your App](https://developer.android.com/studio/publish/app-signing)
