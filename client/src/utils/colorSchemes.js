/**
 * Get color scheme for interest config badges based on code
 * @param {string} code - Interest config code (e.g., "VAY_TIEN", "MUA_HANG")
 * @returns {object} Color scheme object with gradient, icon, ring, text, and bgIcon classes
 */
export const getInterestConfigColorScheme = (code) => {
    if (!code) return {
        gradient: 'from-slate-50 to-slate-100',
        icon: 'text-slate-400',
        ring: 'ring-slate-100',
        text: 'from-slate-400 to-slate-500',
        bgIcon: 'bg-slate-400',
        badge: 'bg-slate-50 text-slate-500'
    };

    // Single, consistent scheme (reduced palette)
    return {
        gradient: 'from-blue-50 to-sky-50',
        icon: 'text-blue-600',
        ring: 'ring-blue-100',
        text: 'from-blue-600 to-sky-600',
        bgIcon: 'bg-blue-600',
        badge: 'bg-blue-100 text-blue-700'
    };
};
