import React, { useId } from 'react';

/**
 * Dải băng "Đã tất toán" vắt qua góc trên bên phải của thẻ khách hàng.
 *
 * Hình học (khung 168×168, neo vào góc phải trên của thẻ):
 *   Thân băng là dải nằm giữa hai đường x − y = 60 và x − y = 98, tức cắt
 *   chéo đúng 45°. Đường tâm x − y = 79 có dây cung dài ~126px, còn chữ ở cỡ
 *   11px chỉ chiếm ~97px — dư mỗi đầu ~14px nên không chạm góc bo của thẻ.
 *   Đây chính là chỗ bản trước hỏng: dây cung chỉ 112px mà chữ đã 106px.
 *
 * Hai chi tiết khiến mắt đọc ra "vải" thay vì "thanh màu dán chéo":
 *   · dải sáng chuyển từ mép trên xuống mép dưới, mô phỏng ánh sáng trên vải;
 *   · hai đường chỉ khâu đứt nét men theo hai mép.
 *
 * @param {string} [label]
 */
export default function PaidRibbon({ label = 'Đã tất toán' }) {
    const uid = useId().replace(/:/g, '');
    const fill = `pr-fill-${uid}`;
    const sheen = `pr-sheen-${uid}`;
    const shadow = `pr-shadow-${uid}`;

    return (
        <div
            className="pointer-events-none absolute right-0 top-0 z-20 h-[168px] w-[168px] overflow-hidden"
            aria-hidden="true"
        >
            <svg viewBox="0 0 168 168" className="h-full w-full" role="presentation" focusable="false">
                <defs>
                    <linearGradient id={fill} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#34D399" />
                        <stop offset="48%" stopColor="#10B981" />
                        <stop offset="100%" stopColor="#047857" />
                    </linearGradient>

                    <linearGradient id={sheen} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.32" />
                        <stop offset="40%" stopColor="#FFFFFF" stopOpacity="0.05" />
                        <stop offset="64%" stopColor="#000000" stopOpacity="0" />
                        <stop offset="100%" stopColor="#000000" stopOpacity="0.18" />
                    </linearGradient>

                    <filter id={shadow} x="-30%" y="-30%" width="180%" height="180%">
                        <feDropShadow dx="0" dy="2" stdDeviation="2.4" floodColor="#064E3B" floodOpacity="0.4" />
                    </filter>
                </defs>

                {/* Không vẽ "đuôi gấp": thẻ có overflow-hidden và bo góc nên hai đuôi
                    không bao giờ chạm tới mép để tạo được ảo giác vải vòng ra sau —
                    chúng chỉ còn là hai mảng tối lạc lõng. Chất "vải" đến từ dải sáng
                    và đường chỉ khâu bên dưới là đủ. */}
                <g filter={`url(#${shadow})`}>
                    <path d="M60 0 L98 0 L168 70 L168 108 Z" fill={`url(#${fill})`} />
                    <path d="M60 0 L98 0 L168 70 L168 108 Z" fill={`url(#${sheen})`} />

                    {/* Chỉ khâu men theo hai mép */}
                    <line x1="67" y1="0" x2="168" y2="101" stroke="#FFFFFF" strokeOpacity="0.36" strokeWidth="1" strokeDasharray="3 3.5" />
                    <line x1="91" y1="0" x2="168" y2="77" stroke="#FFFFFF" strokeOpacity="0.26" strokeWidth="1" strokeDasharray="3 3.5" />

                    <text
                        x="123"
                        y="45"
                        transform="rotate(45 123 45)"
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="#FFFFFF"
                        fontSize="11"
                        fontWeight="700"
                        letterSpacing="0.5"
                        style={{ fontFamily: 'var(--font-heading)' }}
                    >
                        {label.toUpperCase()}
                    </text>
                </g>
            </svg>
        </div>
    );
}
