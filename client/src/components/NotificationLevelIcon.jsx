import React from 'react';

/**
 * Icon riêng cho từng mức độ thông báo hệ thống.
 *
 * Vì sao không dùng icon mặc định: bộ icon dựng sẵn cho ba mức này đều là
 * biến thể của cùng một hình tròn/tam giác, nhìn lướt rất dễ lẫn. Ở đây mỗi
 * mức có một BÓNG DÁNG khác hẳn nhau — bong bóng thoại, tam giác, đèn báo —
 * nên phân biệt được ngay cả khi chỉ liếc qua hoặc khi mất màu (in đen trắng,
 * người mù màu).
 *
 * Cùng khung 32×32, cùng độ dày nét và kiểu bo góc để ba cái vẫn là một bộ.
 * Toàn bộ dùng `currentColor` nên vẫn ăn theo màu của `.sys-notice__icon--*`.
 *
 * @param {'info'|'warning'|'critical'} level
 * @param {number} [size]
 */
export default function NotificationLevelIcon({ level = 'info', size = 26, className, title }) {
    const common = {
        width: size,
        height: size,
        viewBox: '0 0 32 32',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 2.1,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        className,
        role: title ? 'img' : 'presentation',
        'aria-hidden': title ? undefined : true,
        focusable: 'false',
    };

    if (level === 'warning') {
        return (
            <svg {...common}>
                {title && <title>{title}</title>}
                {/* Tam giác cảnh báo, bo góc bằng linejoin */}
                <path d="M16 4.8 L28.6 26.6 A1.6 1.6 0 0 1 27.2 29 L4.8 29 A1.6 1.6 0 0 1 3.4 26.6 Z" />
                {/* Dấu chấm than: thân vuốt nhọn dần cho giống nét viết tay */}
                <path d="M16 12.4 V19.6" strokeWidth="2.6" />
                <circle cx="16" cy="24.1" r="1.35" fill="currentColor" stroke="none" />
            </svg>
        );
    }

    if (level === 'critical') {
        return (
            <svg {...common}>
                {title && <title>{title}</title>}
                {/* Đèn báo: vòm + đế, kèm hai vòng sáng lan ra hai bên */}
                <path d="M10.4 21.4 A5.6 5.6 0 0 1 21.6 21.4" />
                <rect x="8.4" y="21.4" width="15.2" height="4.8" rx="1.6" fill="currentColor" stroke="none" />
                <path d="M8.4 26.2 H23.6" />
                {/* Sóng sáng — mờ dần ra ngoài để thấy được hướng lan */}
                <path d="M6.6 18.6 A9.4 9.4 0 0 1 25.4 18.6" strokeWidth="1.9" opacity="0.62" />
                <path d="M3.2 15.4 A12.8 12.8 0 0 1 28.8 15.4" strokeWidth="1.7" opacity="0.3" />
            </svg>
        );
    }

    // info
    return (
        <svg {...common}>
            {title && <title>{title}</title>}
            {/* Bong bóng thoại — thông báo là "lời nhắn từ hệ thống" */}
            <path d="M5 8.2 A3.2 3.2 0 0 1 8.2 5 H23.8 A3.2 3.2 0 0 1 27 8.2 V19.4 A3.2 3.2 0 0 1 23.8 22.6 H14.6 L9.4 27 V22.6 H8.2 A3.2 3.2 0 0 1 5 19.4 Z" />
            {/* Chữ "i" */}
            <circle cx="16" cy="10.2" r="1.35" fill="currentColor" stroke="none" />
            <path d="M16 13.9 V18.3" strokeWidth="2.6" />
        </svg>
    );
}
