import React, { useState } from 'react';
import { clsx } from 'clsx';

/** File đặt tại `client/public/logo/` (Vite phục vụ tại `/logo/...`) */
export const LOGO_APP_SRC = '/logo/app.png';
export const LOGO_MARK_SRC = '/logo/CP.png';

/**
 * Hai file cùng bộ nhận diện, dùng theo nền:
 * - `full` → app.png (nền trắng): sidebar mở rộng, header/thẻ nền sáng, lockup nhỏ trong card.
 * - `mark` → CP.png (nền trong suốt): favicon, icon thu gọn, lockup lớn trên ảnh/video nền.
 *
 * @param {'full' | 'mark'} variant
 * @param {string} className — áp dụng cho img hoặc ô fallback
 * @param {string} alt
 * @param {string} fallbackClassName — class bổ sung cho ô fallback (màu chữ, v.v.)
 */
export default function AppBrandLogo({
    variant = 'mark',
    className = '',
    alt = '',
    fallbackClassName = '',
}) {
    const [failed, setFailed] = useState(false);
    const src = variant === 'full' ? LOGO_APP_SRC : LOGO_MARK_SRC;

    if (failed) {
        return (
            <div
                className={clsx(
                    'flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-sm font-bold text-white shadow-lg shadow-blue-600/25',
                    className,
                    fallbackClassName
                )}
                aria-hidden={!alt}
            >
                FA
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={alt}
            className={clsx('object-contain', className)}
            loading="lazy"
            decoding="async"
            onError={() => setFailed(true)}
        />
    );
}
