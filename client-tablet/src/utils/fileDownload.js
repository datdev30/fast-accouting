import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { DownloadsPlugin } from '../plugins/DownloadsPlugin';

/**
 * Tải xuống file (Blob) - tự động xử lý cho cả web và native
 * @param {Blob} blob - File blob cần tải xuống
 * @param {string} filename - Tên file
 * @returns {Promise<void>}
 */
export const downloadFile = async (blob, filename) => {
    const isNative = Capacitor.isNativePlatform();

    if (isNative) {
        // Trên native (Android/iOS), sử dụng Hybrid Approach:
        // 1. Thử MediaStore API để lưu vào Downloads folder (Android 10+)
        // 2. Nếu fail, fallback về Filesystem + Share API
        try {
            // Chuyển blob thành base64
            const base64Data = await blobToBase64(blob);
            
            // Lấy mime type từ blob
            const mimeType = blob.type || 'application/octet-stream';
            
            // Xác định extension từ filename hoặc mime type
            const extension = getFileExtension(filename, mimeType);
            const baseFilename = filename.replace(/\.[^/.]+$/, '') || 'download';
            const fullFilename = `${baseFilename}${extension}`;
            
            // ===== STEP 1: Thử MediaStore API (lưu vào Downloads folder) =====
            try {
                console.log('[FileDownload] 🎯 Attempting to save to Downloads folder via MediaStore...');
                const mediaStoreResult = await DownloadsPlugin.saveToDownloads({
                    fileName: fullFilename,
                    data: base64Data,
                    mimeType: mimeType
                });
                
                console.log('[FileDownload] ✅ SUCCESS: File saved to Downloads folder via MediaStore!');
                console.log('[FileDownload] URI:', mediaStoreResult.uri);
                console.log('[FileDownload] Path:', mediaStoreResult.path);
                console.log('[FileDownload] File is now accessible in Downloads folder via File Manager');
                
                // File đã được lưu thành công vào Downloads folder, không cần Share API
                return;
            } catch (mediaStoreError) {
                console.warn('[FileDownload] ⚠️ MediaStore failed, falling back to Filesystem + Share API');
                console.warn('[FileDownload] MediaStore error:', mediaStoreError.message);
                // Tiếp tục với fallback method
            }
            
            // ===== STEP 2: Fallback - Sử dụng Filesystem + Share API =====
            let result;
            let saved = false;
            let lastError = null;
            
            // Danh sách thư mục để thử (theo thứ tự ưu tiên)
            // Ưu tiên ExternalStorage để lưu vào Download folder (có thể truy cập từ File Manager)
            const directories = [
                Directory.ExternalStorage,  // External storage - có thể lưu vào Download folder (Android 9-)
                Directory.Cache,            // Cache directory (đã có FileProvider path, tốt cho sharing)
                Directory.Data,             // App-specific data directory
                Directory.Documents         // Documents directory
            ];
            
            // Thử từng thư mục cho đến khi thành công
            console.log('[FileDownload] Starting to save file:', fullFilename);
            console.log('[FileDownload] File size:', (base64Data.length * 3 / 4 / 1024).toFixed(2), 'KB (base64)');
            
            for (const directory of directories) {
                try {
                    // Tạo path khác nhau tùy theo directory
                    let filePath;
                    if (directory === Directory.ExternalStorage) {
                        // Lưu trực tiếp vào Download folder
                        filePath = `Download/${fullFilename}`;
                    } else {
                        // Các directory khác dùng subdirectory
                        filePath = `FastAccounting/${fullFilename}`;
                    }
                    
                    console.log(`[FileDownload] Trying to save to ${directory}...`);
                    console.log(`[FileDownload] Path: ${filePath}`);
                    
                    result = await Filesystem.writeFile({
                        path: filePath,
                        data: base64Data,
                        directory: directory,
                        recursive: true,
                    });
                    saved = true;
                    console.log(`[FileDownload] ✅ SUCCESS: File saved to ${directory}`);
                    console.log(`[FileDownload] URI: ${result.uri}`);
                    
                    // Verify file đã được lưu thực sự
                    try {
                        const verifyResult = await Filesystem.stat({
                            path: filePath,
                            directory: directory,
                        });
                        console.log(`[FileDownload] ✅ File verified - Size: ${verifyResult.size} bytes`);
                        console.log(`[FileDownload] File exists at: ${filePath}`);
                        console.log(`[FileDownload] Full URI: ${result.uri}`);
                        
                        // Lưu lại filePath và directory để dùng sau
                        result.savedPath = filePath;
                        result.savedDirectory = directory;
                    } catch (verifyError) {
                        console.warn(`[FileDownload] ⚠️ Could not verify file:`, verifyError);
                    }
                    
                    break;
                } catch (dirError) {
                    console.warn(`[FileDownload] ❌ FAILED to save to ${directory}:`, dirError);
                    console.warn(`[FileDownload] Error message:`, dirError.message);
                    console.warn(`[FileDownload] Error code:`, dirError.code);
                    lastError = dirError;
                    // Tiếp tục thử thư mục tiếp theo
                    continue;
                }
            }
            
            if (!saved || !result) {
                // Nếu tất cả đều fail, throw error với thông tin chi tiết
                console.error('[FileDownload] ❌ ALL METHODS FAILED');
                console.error('[FileDownload] Last error:', lastError);
                const errorMsg = lastError?.message || 'Unknown error';
                const errorCode = lastError?.code || 'NO_CODE';
                throw new Error(`Cannot save file to any directory. Last error: ${errorMsg} (Code: ${errorCode})`);
            }

            // Share file để user có thể mở hoặc lưu vào nơi khác
            let shareSuccess = false;
            let shareUri = result.uri;
            
            try {
                console.log('[FileDownload] Attempting to share file...');
                console.log('[FileDownload] Share URI:', shareUri);
                
                await Share.share({
                    title: 'Download file',
                    text: `File: ${fullFilename}`,
                    url: shareUri,
                    dialogTitle: 'Choose app to open file',
                });
                
                shareSuccess = true;
                console.log('[FileDownload] ✅ Share dialog opened successfully');
            } catch (shareError) {
                console.warn('[FileDownload] ⚠️ Share failed with original URI');
                console.warn('[FileDownload] Share error:', shareError);
                console.warn('[FileDownload] Error message:', shareError.message);
                
                // Nếu share fail và file không ở Cache, thử copy sang Cache và share lại
                if (result.directory !== Directory.Cache) {
                    try {
                        console.log('[FileDownload] Trying to copy file to Cache and share again...');
                        const cachePath = `FastAccounting/${fullFilename}`;
                        
                        // Copy file sang Cache
                        const cacheResult = await Filesystem.writeFile({
                            path: cachePath,
                            data: base64Data,
                            directory: Directory.Cache,
                            recursive: true,
                        });
                        
                        console.log('[FileDownload] File copied to Cache:', cacheResult.uri);
                        
                        // Thử share lại với Cache URI
                        shareUri = cacheResult.uri;
                        await Share.share({
                            title: 'Download file',
                            text: `File: ${fullFilename}`,
                            url: shareUri,
                            dialogTitle: 'Choose app to open file',
                        });
                        
                        shareSuccess = true;
                        console.log('[FileDownload] ✅ Share successful after copying to Cache');
                    } catch (cacheShareError) {
                        console.warn('[FileDownload] ⚠️ Share failed even after copying to Cache');
                        console.warn('[FileDownload] Cache share error:', cacheShareError);
                        // Vẫn không throw error vì file đã được lưu thành công
                    }
                }
                
                if (!shareSuccess) {
                    // Nếu share không thành công, vẫn coi như đã lưu file thành công
                    console.log('[FileDownload] ⚠️ Share failed, but file is saved');
                    console.log('[FileDownload] File location:', result.uri);
                    
                    // Thử đọc lại file để verify
                    try {
                        const verifyPath = result.savedPath || (result.directory === Directory.ExternalStorage ? `Download/${fullFilename}` : `FastAccounting/${fullFilename}`);
                        const verifyDirectory = result.savedDirectory || result.directory || Directory.Cache;
                        
                        const verifyResult = await Filesystem.stat({
                            path: verifyPath,
                            directory: verifyDirectory,
                        });
                        console.log('[FileDownload] ✅ File verified after save');
                        console.log('[FileDownload] File size:', verifyResult.size, 'bytes');
                        console.log('[FileDownload] Full path:', verifyPath);
                        console.log('[FileDownload] Directory:', verifyDirectory);
                        console.log('[FileDownload] Full URI:', result.uri);
                    } catch (verifyError) {
                        console.error('[FileDownload] ❌ Could not verify saved file:', verifyError);
                    }
                    
                    // Không throw error vì file đã được lưu thành công
                }
            }
        } catch (error) {
            console.error('[FileDownload] ❌ ERROR saving file on native');
            console.error('[FileDownload] Error message:', error.message);
            console.error('[FileDownload] Error code:', error.code);
            console.error('[FileDownload] Error stack:', error.stack);
            console.error('[FileDownload] Full error object:', error);
            
            // Cải thiện error message dựa trên loại lỗi
            let errorMessage = 'Cannot save file. Please check file access permissions.';
            
            if (error.message?.includes('permission') || error.message?.includes('Permission') || error.code === 'PERMISSION_DENIED') {
                errorMessage = 'File access permission denied. Please grant storage permission in Settings > Apps > FastAccounting > Permissions.';
            } else if (error.message?.includes('ENOENT') || error.message?.includes('not found')) {
                errorMessage = 'Cannot create file. Please check available storage space.';
            } else if (error.message?.includes('ENOSPC') || error.message?.includes('space')) {
                errorMessage = 'Not enough storage space. Please free up some space and try again.';
            }
            
            throw new Error(errorMessage);
        }
    } else {
        // Trên web, sử dụng cách truyền thống
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
};

/**
 * Chuyển đổi Blob sang Base64
 * @param {Blob} blob 
 * @returns {Promise<string>}
 */
const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            // FileReader trả về data URL (data:mime;base64,...)
            // Cần lấy phần base64 sau dấu phẩy
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

/**
 * Lấy file extension từ filename hoặc mime type
 * @param {string} filename 
 * @param {string} mimeType 
 * @returns {string}
 */
const getFileExtension = (filename, mimeType) => {
    // Nếu filename đã có extension, dùng nó
    const match = filename.match(/\.[^/.]+$/);
    if (match) {
        return match[0];
    }
    
    // Nếu không, suy ra từ mime type
    const mimeToExt = {
        'application/pdf': '.pdf',
        'application/zip': '.zip',
        'application/json': '.json',
        'text/plain': '.txt',
        'image/png': '.png',
        'image/jpeg': '.jpg',
        'image/jpg': '.jpg',
    };
    
    return mimeToExt[mimeType] || '';
};
