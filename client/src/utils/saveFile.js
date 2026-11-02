/**
 * Lưu một Blob thành file cho người dùng.
 *
 * Trình duyệt: tải xuống như bình thường (thẻ <a download>).
 * APK WebView (webview-mobile): WebView bỏ qua <a download> với blob:, nên
 * ghi file vào Cache qua plugin Filesystem rồi mở bảng Chia sẻ của Android —
 * từ đó người dùng mở bằng trình đọc PDF, in, gửi Zalo hoặc lưu Drive.
 * Plugin do bridge của Capacitor gắn vào window, client không cần cài gói npm.
 */

export const isNativeApp = () => Boolean(window.Capacitor?.isNativePlatform?.());

const blobToBase64 = (blob) =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(',')[1]);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
    });

export async function saveFile(blob, filename) {
    const plugins = window.Capacitor?.Plugins;
    if (isNativeApp() && plugins?.Filesystem && plugins?.Share) {
        const { uri } = await plugins.Filesystem.writeFile({
            path: filename,
            data: await blobToBase64(blob),
            directory: 'CACHE',
        });
        try {
            await plugins.Share.share({ title: filename, files: [uri], dialogTitle: 'Mở hoặc lưu file' });
        } catch (e) {
            // Người dùng đóng bảng chia sẻ — không phải lỗi
            if (!/cancel/i.test(String(e?.message ?? e))) throw e;
        }
        return;
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}
