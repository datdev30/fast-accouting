import sharp from 'sharp';
import { existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Kích thước icon cho các density khác nhau
const iconSizes = {
    'mipmap-mdpi': 48,
    'mipmap-hdpi': 72,
    'mipmap-xhdpi': 96,
    'mipmap-xxhdpi': 144,
    'mipmap-xxxhdpi': 192,
};

// Đường dẫn icon nguồn
const sourceIcon = join(rootDir, 'logo', 'app-icon.png');
const androidResDir = join(rootDir, 'android', 'app', 'src', 'main', 'res');

async function generateIcons() {
    try {
        // Kiểm tra file nguồn có tồn tại không
        if (!existsSync(sourceIcon)) {
            console.error(`❌ Không tìm thấy file icon: ${sourceIcon}`);
            process.exit(1);
        }

        console.log('🔄 Đang tạo các kích thước icon...\n');

        // Tạo icon cho từng density
        for (const [folder, size] of Object.entries(iconSizes)) {
            const outputDir = join(androidResDir, folder);
            
            // Đảm bảo thư mục tồn tại
            if (!existsSync(outputDir)) {
                mkdirSync(outputDir, { recursive: true });
            }

            // Tạo icon vuông (ic_launcher.png)
            const squareIcon = join(outputDir, 'ic_launcher.png');
            await sharp(sourceIcon)
                .resize(size, size, {
                    fit: 'contain',
                    background: { r: 255, g: 255, b: 255, alpha: 0 }
                })
                .png()
                .toFile(squareIcon);
            console.log(`✅ Đã tạo ${squareIcon} (${size}x${size})`);

            // Tạo icon tròn (ic_launcher_round.png) - giống icon vuông
            const roundIcon = join(outputDir, 'ic_launcher_round.png');
            await sharp(sourceIcon)
                .resize(size, size, {
                    fit: 'contain',
                    background: { r: 255, g: 255, b: 255, alpha: 0 }
                })
                .png()
                .toFile(roundIcon);
            console.log(`✅ Đã tạo ${roundIcon} (${size}x${size})`);

            // Tạo foreground icon (ic_launcher_foreground.png) - dùng cho adaptive icon
            const foregroundIcon = join(outputDir, 'ic_launcher_foreground.png');
            await sharp(sourceIcon)
                .resize(size, size, {
                    fit: 'contain',
                    background: { r: 255, g: 255, b: 255, alpha: 0 }
                })
                .png()
                .toFile(foregroundIcon);
            console.log(`✅ Đã tạo ${foregroundIcon} (${size}x${size})`);
        }

        console.log('\n✨ Hoàn thành! Tất cả icon đã được tạo thành công.');
        console.log('\n📝 Lưu ý:');
        console.log('   - Icon đã được copy vào các thư mục mipmap-*');
        console.log('   - Bạn có thể build lại app để thấy icon mới');
        console.log('   - Nếu icon không hiển thị, hãy clean và rebuild project trong Android Studio');
        
    } catch (error) {
        console.error('❌ Lỗi khi tạo icon:', error);
        process.exit(1);
    }
}

generateIcons();
