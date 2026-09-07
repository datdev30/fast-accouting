import { useEffect } from 'react';
import { preventBodyScroll } from '../utils/a11y';

/**
 * Khóa scroll nền khi có overlay đang mở.
 *
 * Dùng cho các modal viết tay (fixed inset-0) chưa đi qua component Modal chung.
 * Truyền vào một biểu thức boolean gộp mọi overlay của trang:
 *
 *   useScrollLock(isOpen || isTxModalOpen || isDeleteModalOpen);
 *
 * @param {boolean} isLocked
 */
export default function useScrollLock(isLocked) {
    useEffect(() => {
        if (!isLocked) return undefined;
        return preventBodyScroll();
    }, [isLocked]);
}
