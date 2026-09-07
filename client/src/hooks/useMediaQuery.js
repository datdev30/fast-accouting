import { useEffect, useState } from 'react';

/**
 * Theo dõi một media query.
 *
 * Dùng cho các quyết định layout mà CSS không diễn đạt được (ví dụ: chọn
 * render drawer hay rail). Mọi thứ CSS làm được thì để CSS làm — hook này
 * chỉ dành cho phần phải quyết định trong JS.
 *
 * @param {string} query
 * @param {boolean} defaultValue Giá trị khi chưa có window (SSR)
 */
export default function useMediaQuery(query, defaultValue = false) {
    const [matches, setMatches] = useState(() =>
        typeof window !== 'undefined' ? window.matchMedia(query).matches : defaultValue
    );

    useEffect(() => {
        const mq = window.matchMedia(query);
        const onChange = () => setMatches(mq.matches);
        onChange();
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, [query]);

    return matches;
}
