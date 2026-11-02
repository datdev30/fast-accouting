# Kế hoạch: `webview-mobile` — APK WebView cho Android Phone & Tablet

## 1. Mục tiêu

- Tạo 1 file APK duy nhất, cài được trên **điện thoại Android** và **tablet Android**.
- APK là "vỏ" WebView, tải giao diện web FastAccounting đã deploy (Vercel).
- Giao diện **responsive**: dùng tốt từ màn hình nhỏ (~360px) đến tablet lớn (~1280px+), cả dọc lẫn ngang.
- Cập nhật web → app tự có bản mới, **không cần build lại APK**.

## 2. Khác gì so với `client-tablet/android` hiện có?

| | `client-tablet/android` (đã có) | `webview-mobile` (mới) |
|---|---|---|
| Nguồn giao diện | Bundle `dist-tablet` vào APK | Load URL web đã deploy |
| Cập nhật UI | Build + cài lại APK | Deploy web là xong |
| Offline | Có giao diện, không có dữ liệu | Cần mạng (app cũng cần API nên tương đương) |
| appId | `com.fastaccounting.app` | `com.fastaccounting.webview` (cài song song được) |

## 3. Kiến trúc

```
webview-mobile/
├── PLAN.md                  # file này
├── package.json             # chỉ chứa @capacitor/* + scripts build
├── capacitor.config.json    # server.url = URL web production
├── www/index.html           # trang fallback khi mất mạng / lỗi tải
└── android/                 # sinh bởi `npx cap add android`
```

**Lựa chọn: Capacitor + `server.url`** (không viết Kotlin WebView tay).

- Toolchain giống `client-tablet` (Capacitor 8, minSdk 24, targetSdk 36) → không phải học/cài thêm.
- Capacitor đã xử lý sẵn: chọn file/camera cho `<input type="file">`, back button, cookie, HTTPS scheme, splash, status bar.
- Viết WebView native tay chỉ khi Capacitor không đáp ứng được (hiện chưa thấy lý do).

Luồng chạy:

```
APK mở → Capacitor WebView → https://<web-production-url>
                                 ├── UI React (responsive)
                                 └── /api → Vercel Express → MongoDB
```

## 4. Quyết định cần chốt trước khi làm

1. **Web nguồn nào được load?**
   - (Khuyến nghị) `client` deploy trên Vercel (cùng domain với `/api`, không lo CORS) và bổ sung responsive cho phone.
   - Hoặc deploy `client-tablet` lên 1 URL riêng (đã tối ưu tablet, cần làm thêm cho phone, phải cấu hình CORS cho API).
2. **URL production chính xác** để điền vào `server.url`.
3. **Tên app / icon**: dùng lại logo trong `client-tablet/logo` hay logo mới.
4. **Ký APK**: tạo keystore mới cho `com.fastaccounting.webview` (bắt buộc giữ lại để update sau này).

## 5. Chiến lược Responsive (làm ở web app, không phải ở APK)

APK chỉ hiển thị web, nên responsive nằm hoàn toàn trong code React/Tailwind.

Prototype giao diện: [`prototype/index.html`](prototype/index.html) (5 màn phone + tablet dọc + tablet ngang).

### Breakpoints (Tailwind mặc định)

| Thiết bị | Width | Layout |
|---|---|---|
| Phone dọc | < 640px (`base`) | 1 cột, Card view, bottom nav / hamburger, FAB |
| Phone ngang / tablet nhỏ dọc | 640–767px (`sm`) | 1 cột rộng, Card view |
| Tablet dọc | 768–1023px (`md`) | Card view 2 cột, sidebar thu gọn |
| Tablet ngang / màn lớn | ≥ 1024px (`lg`, `xl`) | Table view, sidebar cố định |

### Nguyên tắc

- `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`.
- Mobile-first: viết class cho phone trước, thêm `md:` / `lg:` cho màn lớn.
- Không dùng width cố định (px) cho container; dùng `w-full`, `max-w-*`, grid/flex.
- Bảng dữ liệu: phone → Card list; tablet ngang → Table (tái dùng Hybrid UI đã có trong `client-tablet`).
- Vùng chạm tối thiểu 44×44px; font input ≥ 16px để tránh Android tự zoom.
- Safe area: `padding: env(safe-area-inset-*)` cho tai thỏ / thanh điều hướng.
- Modal/form: full-screen trên phone, dialog giữa màn hình trên tablet.
- Dùng `100dvh` thay `100vh` để không bị bàn phím ảo che.

## 6. Các bước thực hiện

### Phase 0 — Chuẩn bị môi trường
Kiểm tra JDK 17+, Android Studio, Android SDK (API 36), `JAVA_HOME`, `ANDROID_HOME` (giống `client-tablet/BUILD_APK_PLAN.md`).

### Phase 1 — Khởi tạo project
1. `mkdir webview-mobile && cd webview-mobile && npm init -y`
2. `npm i @capacitor/core @capacitor/android && npm i -D @capacitor/cli`
3. Tạo `capacitor.config.ts`:
   ```ts
   import { CapacitorConfig } from '@capacitor/cli';

   const config: CapacitorConfig = {
     appId: 'com.fastaccounting.webview',
     appName: 'FastAccounting',
     webDir: 'www',
     server: {
       url: 'https://<web-production-url>',
       androidScheme: 'https',
       errorPath: 'index.html',
     },
   };

   export default config;
   ```
4. Tạo `www/index.html` (trang "Không có kết nối — Thử lại").
5. `npx cap add android`

### Phase 2 — Cấu hình Android
1. `AndroidManifest.xml`: quyền `INTERNET`, `ACCESS_NETWORK_STATE`, `CAMERA` (nếu chụp chứng từ).
2. `android:screenOrientation` → **không khóa** (cho phép xoay trên cả phone và tablet).
3. `android:configChanges` có `orientation|screenSize|smallestScreenSize|screenLayout` để không reload WebView khi xoay / chia đôi màn hình.
4. `android:resizeableActivity="true"` (hỗ trợ split-screen trên tablet).
5. Không khai báo `<supports-screens>` giới hạn → APK chạy mọi kích thước.
6. Icon + splash: copy từ `client-tablet/logo`, dùng Image Asset của Android Studio hoặc `@capacitor/assets`.

### Phase 3 — Responsive web app
1. Audit từng màn hình ở 360, 412, 768, 1024, 1280px (Chrome DevTools device mode).
2. Sửa layout theo mục 5 (ưu tiên: Login → Dashboard → Danh sách khách hàng → Giao dịch → Báo cáo).
3. Deploy web lên Vercel.

### Phase 4 — Tính năng native cần kiểm tra trong WebView
1. Upload ảnh chứng từ (`<input type="file" accept="image/*" capture>`).
2. Tải PDF / ZIP báo cáo — WebView mặc định **không** tự tải file; tái dùng cách đã làm ở `client-tablet` (`@capacitor/filesystem` + `@capacitor/share`, xem `HYBRID_DOWNLOAD_IMPLEMENTATION.md`).
3. In báo cáo (`react-to-print`) — WebView không hỗ trợ `window.print()`; fallback sang xuất PDF + share.
4. Nút Back Android → quay lại trang trước, ở trang gốc thì thoát app.
5. Đăng nhập JWT giữ được sau khi tắt/mở lại app.

### Phase 5 — Build & ký APK
1. `npx cap sync android`
2. Tạo keystore: `keytool -genkey -v -keystore fastaccounting-webview.jks -alias fa-webview -keyalg RSA -keysize 2048 -validity 10000`
3. Build: `cd android && .\gradlew assembleRelease` (hoặc Android Studio → Build → Generate Signed APK).
4. Output: `android/app/build/outputs/apk/release/app-release.apk`
5. Thêm keystore + mật khẩu vào `.gitignore`, lưu backup riêng.

### Phase 6 — Test trên thiết bị
Ma trận test tối thiểu:

| Thiết bị | Kích thước | Hướng |
|---|---|---|
| Phone nhỏ | ~360×640 | dọc + ngang |
| Phone lớn | ~412×915 | dọc + ngang |
| Tablet 8" | ~800×1280 | dọc + ngang |
| Tablet 11" | ~1200×2000 | dọc + ngang + split-screen |

## 7. Rủi ro

| Rủi ro | Cách xử lý |
|---|---|
| Không có mạng → màn trắng | `errorPath` → trang fallback có nút "Thử lại" |
| Tải file / in không hoạt động trong WebView | Dùng Filesystem + Share như `client-tablet` |
| Android WebView cũ (HarmonyOS, Android 7) | minSdk 24; xem `client-tablet/HARMONYOS_2_COMPATIBILITY.md` |
| Mất keystore → không update được APK | Backup keystore ngoài repo |
| Google Play từ chối app "chỉ là website" | Chỉ phân phối APK trực tiếp (nội bộ); nếu lên Play cần thêm tính năng native |

---

## 8. Checklist

### Phase 0 — Môi trường
- [x] JDK 17+ — dùng JDK của Android Studio (`C:\Program Files\Android\Android Studio\jbr`); Java 23 hệ thống quá mới cho Gradle
- [x] Android Studio + SDK đã cài (`android/local.properties` trỏ SDK)
- [ ] `adb devices` thấy được máy test

### Quyết định
- [x] Chốt web nguồn: `client`
- [x] Chốt URL production: `https://dai-ly-cong-phu.vercel.app`
- [x] Chốt tên app + icon (dùng lại icon của `client-tablet`)
- [x] Chốt appId (`com.fastaccounting.webview`)

### Phase 1 — Khởi tạo
- [x] Tạo folder `webview-mobile` + `package.json`
- [x] Cài `@capacitor/core`, `@capacitor/android`, `@capacitor/cli` (8.x, cùng bản với `client-tablet`)
- [x] Tạo `capacitor.config.json` với `server.url` (JSON, không cần TypeScript)
- [x] Tạo `www/index.html` fallback offline
- [x] `npx cap add android` thành công

### Phase 2 — Android config
- [x] Quyền `INTERNET`, `ACCESS_NETWORK_STATE`, `CAMERA`
- [x] Không khóa orientation
- [x] `configChanges` đầy đủ (không reload khi xoay)
- [x] `resizeableActivity="true"` (split-screen) + `adjustResize` cho bàn phím
- [x] Icon launcher (adaptive icon) + splash screen

### Phase 3 — Responsive
- [x] Viewport meta có `viewport-fit=cover`
- [x] Safe-area padding
- [x] Input font ≥ 16px, vùng chạm ≥ 44px
- [x] Login responsive
- [x] Dashboard: thẻ "Tổng nợ phải thu" + lối tắt dưới lg, masthead + 4 KPI từ lg
- [x] Danh sách khách hàng: Card (phone/tablet dọc) ↔ Table (tablet ngang)
- [x] Giao dịch: thẻ 1 cột (phone) → 2 cột (tablet dọc) → bảng (lg); nút nổi "+" trên phone
- [x] Tablet ngang (≥1024px, cảm ứng): Giao dịch dạng bảng + panel chi tiết; PC giữ nguyên
- [x] Giao dịch: form trượt từ dưới lên trên phone (<640px), dialog trên tablet; ô tiền bàn phím số + nút +1tr/+5tr/+10tr
- [x] Công nợ khách hàng (phone): Gọi/Zalo, thẻ "Còn nợ lại", 4 lối tắt, thanh "Tất toán công nợ"
- [ ] Báo cáo / xem trước PDF responsive
- [ ] Xem ảnh chứng từ (zoom/pan) hoạt động bằng cảm ứng
- [ ] Không có thanh cuộn ngang ở 360px
- [ ] Deploy web lên production

### Phase 4 — Tính năng trong WebView
- [ ] Upload ảnh từ thư viện
- [ ] Chụp ảnh bằng camera
- [x] Tải PDF / ZIP / backup / ảnh chứng từ: `client/src/utils/saveFile.js` → Filesystem (cache) + Share sheet trong APK, `<a download>` trên web — cần thử trên máy thật
- [x] "In ngay" trong APK → tải PDF server rồi chia sẻ (WebView không có `window.print`) — cần thử trên máy thật
- [ ] Nút Back Android đúng hành vi
- [ ] Giữ đăng nhập sau khi đóng app
- [ ] Mất mạng → hiện trang fallback, có mạng lại → "Thử lại" hoạt động

### Phase 5 — Build
- [ ] Tạo keystore + backup an toàn
- [x] Keystore nằm trong `.gitignore`
- [x] Build debug APK: `android/app/build/outputs/apk/debug/app-debug.apk` (cài trên máy thật chưa test)
- [ ] Build release APK đã ký
- [x] Đặt `versionCode` / `versionName` (1.2.0, đồng bộ `app_info.json`)

### Phase 6 — Test thiết bị
- [ ] Phone nhỏ (~360px) dọc + ngang
- [ ] Phone lớn (~412px) dọc + ngang
- [ ] Tablet 8" dọc + ngang
- [ ] Tablet 11" dọc + ngang
- [ ] Split-screen trên tablet
- [ ] Android cũ (API 24–28) / HarmonyOS
- [ ] Cài đè APK bản mới giữ được dữ liệu đăng nhập

### Bàn giao
- [ ] Ghi lệnh build vào `README.md` của `webview-mobile`

### Lệnh build (PowerShell)
```powershell
cd webview-mobile
$env:JAVA_HOME = 'C:\Program Files\Android\Android Studio\jbr'
npm run apk:debug     # → android/app/build/outputs/apk/debug/app-debug.apk
```
- [ ] Lưu APK release + ghi chú phiên bản
