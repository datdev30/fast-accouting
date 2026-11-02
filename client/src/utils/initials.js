/** "Trần Văn Lộc" → "TL" (chữ đầu của họ + tên). */
export const initialsOf = (name = '') => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts.at(-1)[0]).toUpperCase();
    return (parts[0] ?? '?').slice(0, 2).toUpperCase();
};
