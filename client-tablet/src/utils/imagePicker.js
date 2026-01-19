import { Capacitor } from '@capacitor/core';
import { Camera, CameraSource, CameraResultType } from '@capacitor/camera';
import { Filesystem } from '@capacitor/filesystem';

/**
 * Chọn ảnh từ camera hoặc gallery - tự động xử lý cho cả web và native
 * @param {string} source - 'camera' hoặc 'gallery'
 * @returns {Promise<File|null>} File object hoặc null nếu user hủy
 */
export const pickImage = async (source = 'gallery') => {
    const isNative = Capacitor.isNativePlatform();

    if (isNative) {
        // Trên native, sử dụng Capacitor Camera API
        try {
            // Request permissions nếu cần
            if (source === 'camera') {
                // Request camera permission
                const cameraStatus = await Camera.checkPermissions();
                if (cameraStatus.camera !== 'granted') {
                    const requestResult = await Camera.requestPermissions({ permissions: ['camera'] });
                    if (requestResult.camera !== 'granted') {
                        throw new Error('Cần quyền truy cập camera để chụp ảnh');
                    }
                }
            } else {
                // Request photo library permission cho gallery
                const photosStatus = await Camera.checkPermissions();
                if (photosStatus.photos !== 'granted') {
                    const requestResult = await Camera.requestPermissions({ permissions: ['photos'] });
                    if (requestResult.photos !== 'granted') {
                        throw new Error('Cần quyền truy cập album để chọn ảnh');
                    }
                }
            }
            
            let photo;
            
            if (source === 'camera') {
                // Chụp ảnh từ camera
                // Sử dụng Base64 để lấy data trực tiếp, tránh vấn đề với path
                const result = await Camera.getPhoto({
                    quality: 90,
                    allowEditing: false,
                    resultType: CameraResultType.Base64,
                    source: CameraSource.Camera,
                });
                photo = result;
            } else {
                // Chọn từ gallery - sử dụng getPhoto với Photos source để tương thích tốt hơn
                try {
                    const result = await Camera.getPhoto({
                        quality: 90,
                        allowEditing: false,
                        resultType: CameraResultType.Base64,
                        source: CameraSource.Photos,
                    });
                    photo = result;
                } catch (pickError) {
                    // Fallback: thử dùng pickImages nếu getPhoto fail
                    console.warn('getPhoto with Photos source failed, trying pickImages:', pickError);
                    try {
                        const pickResult = await Camera.pickImages({
                            quality: 90,
                            limit: 1,
                        });
                        if (!pickResult.photos || pickResult.photos.length === 0) {
                            return null;
                        }
                        photo = pickResult.photos[0];
                    } catch (pickImagesError) {
                        console.error('Both getPhoto and pickImages failed:', pickImagesError);
                        throw pickImagesError;
                    }
                }
            }

            if (!photo) {
                return null;
            }

            let blob;
            let fileName = `image_${Date.now()}.jpg`;
            let mimeType = 'image/jpeg';

            // Thử các cách đọc file theo thứ tự ưu tiên
            let fileRead = false;

            // Xử lý cho cả Photo object (từ getPhoto) và GalleryPhoto object (từ pickImages)
            // GalleryPhoto có thể có format khác, cần kiểm tra cả format property
            const imageFormat = photo.format || 'jpeg';
            const imageMimeType = `image/${imageFormat === 'png' ? 'png' : 'jpeg'}`;

            // 1. Thử dùng base64 data trực tiếp (nếu có từ Base64 result type)
            if (photo.base64String) {
                try {
                    const base64Response = await fetch(`data:${imageMimeType};base64,${photo.base64String}`);
                    blob = await base64Response.blob();
                    mimeType = blob.type || imageMimeType;
                    fileRead = true;
                    console.log('✅ Read image from base64String');
                } catch (base64Error) {
                    console.warn('Failed to read from base64String:', base64Error);
                }
            }

            // 2. Thử dùng dataUrl nếu có
            if (!fileRead && photo.dataUrl) {
                try {
                    const base64Response = await fetch(photo.dataUrl);
                    blob = await base64Response.blob();
                    mimeType = blob.type || imageMimeType;
                    fileRead = true;
                    console.log('✅ Read image from dataUrl');
                } catch (dataUrlError) {
                    console.warn('Failed to read from dataUrl:', dataUrlError);
                }
            }

            // 3. Thử đọc từ path thực tế (nếu chưa đọc được)
            // Lưu ý: GalleryPhoto từ pickImages có thể có path khác với Photo từ getPhoto
            if (!fileRead && photo.path) {
                try {
                    // Parse path - có thể là file:// URI hoặc relative path
                    let filePath = photo.path;
                    
                    // Nếu là file:// URI, extract path
                    if (filePath.startsWith('file://')) {
                        filePath = filePath.replace('file://', '');
                    }
                    
                    // Nếu là absolute path với /, có thể cần extract relative path
                    // Thử đọc từ Filesystem
                    const fileData = await Filesystem.readFile({
                        path: filePath,
                    });
                    
                    // Convert base64 sang blob
                    const base64Data = fileData.data;
                    const base64Response = await fetch(`data:${imageMimeType};base64,${base64Data}`);
                    blob = await base64Response.blob();
                    fileName = filePath.split('/').pop() || fileName;
                    mimeType = blob.type || imageMimeType;
                    fileRead = true;
                    console.log('✅ Read image from Filesystem path:', filePath);
                } catch (fsError) {
                    console.warn('Failed to read from Filesystem path:', fsError);
                    console.warn('Path was:', photo.path);
                }
            }

            // 4. Fallback to webPath (nếu chưa đọc được)
            if (!fileRead && photo.webPath) {
                try {
                    const response = await fetch(photo.webPath);
                    blob = await response.blob();
                    mimeType = blob.type || imageMimeType;
                    fileRead = true;
                    console.log('✅ Read image from webPath');
                } catch (webPathError) {
                    console.error('Failed to read from webPath:', webPathError);
                }
            }

            // Nếu tất cả đều fail
            if (!fileRead || !blob) {
                console.error('All methods failed. Photo object:', photo);
                throw new Error('Cannot read image file. Please try again.');
            }

            if (!blob) {
                throw new Error('Cannot read image file.');
            }
            
            // Tạo File object từ blob
            const file = new File([blob], fileName, { type: mimeType });
            
            return file;
        } catch (error) {
            // User có thể đã hủy hoặc có lỗi
            if (error.message?.includes('cancel') || 
                error.message?.includes('User cancelled') ||
                error.message?.includes('User canceled')) {
                return null;
            }
            console.error('Lỗi khi chọn ảnh:', error);
            throw new Error('Không thể chọn ảnh. Vui lòng thử lại.');
        }
    } else {
        // Trên web, sử dụng HTML file input
        return new Promise((resolve) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            
            if (source === 'camera') {
                input.capture = 'environment'; // Camera phía sau
            }
            
            input.onchange = (e) => {
                const file = e.target.files?.[0] || null;
                resolve(file);
            };
            
            input.oncancel = () => {
                resolve(null);
            };
            
            input.click();
        });
    }
};
