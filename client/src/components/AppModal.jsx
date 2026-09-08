import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { clsx } from 'clsx';
import { X } from 'lucide-react';
import { trapFocus } from '../utils/focusTrap';
import useScrollLock from '../hooks/useScrollLock';

/**
 * Modal dùng chung cho toàn app.
 *
 * Thay cho việc mỗi trang tự viết `fixed inset-0 …`. Trước khi gom lại,
 * codebase có 16 biến thể overlay khác nhau về z-index, độ mờ, blur và
 * padding — và mỗi biến thể là một chỗ có thể quên `dvh`, quên safe-area,
 * quên khóa scroll nền, quên bẫy focus. Gom về một chỗ để sửa một lần là
 * đúng tất cả.
 *
 * Những thứ component này lo, người dùng nó không phải nghĩ tới:
 *   · khóa scroll nền (#app-scroll, không phải body — body vốn đã hidden)
 *   · Escape để đóng, bẫy focus trong modal, trả focus về nơi cũ khi đóng
 *   · chiều cao theo dvh nên bàn phím ảo không đẩy nút submit ra ngoài
 *   · safe-area trên/dưới cho máy có tai thỏ
 *   · dưới 640px tự chuyển thành bottom sheet (tắt bằng sheetOnMobile={false})
 *   · render qua portal nên không bị ancestor `overflow` hay `transform` cắt
 *
 * @param {boolean} isOpen
 * @param {Function} onClose
 * @param {React.ReactNode} [title] Tiêu đề; bỏ trống thì không render header
 * @param {React.ReactNode} [icon] Icon cạnh tiêu đề
 * @param {React.ReactNode} [headerExtra] Nút phụ đặt cạnh nút đóng
 * @param {React.ReactNode} [footer] Nội dung chân modal (sticky)
 * @param {'sm'|'md'|'lg'|'xl'|'2xl'|'4xl'|'5xl'|'full'} [size] Theo thang max-w-* của Tailwind
 * @param {number} [z] z-index; dùng số lớn hơn cho modal chồng lên modal
 * @param {boolean} [closeOnBackdrop]
 * @param {boolean} [sheetOnMobile]
 * @param {string} [describedById] id của phần tử mô tả, cho aria-describedby
 */
/* Tên size mirror thẳng thang max-w-* của Tailwind, để khi di trú một modal
   cũ chỉ việc chép đúng giá trị nó đang dùng, không phải đoán. */
const SIZES = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    full: 'max-w-[min(90rem,100%)]',
};

/**
 * Ngăn xếp các modal đang mở.
 *
 * Mỗi instance đăng ký một listener `keydown` trên `document`. Nếu không có
 * ngăn xếp này, nhấn Escape khi có modal chồng modal sẽ đóng CẢ HAI —
 * `stopPropagation()` không chặn được listener khác gắn trên cùng một node.
 * Chỉ phần tử cuối ngăn xếp (modal trên cùng) mới xử lý Escape và bẫy Tab.
 */
const modalStack = [];

export default function AppModal({
    isOpen,
    onClose,
    title,
    icon,
    headerExtra,
    footer,
    size = 'lg',
    z = 50,
    closeOnBackdrop = true,
    closeOnEscape = true,
    sheetOnMobile = true,
    showCloseButton = true,
    className,
    bodyClassName,
    describedById,
    children,
}) {
    const panelRef = useRef(null);
    const restoreFocusRef = useRef(null);
    const titleId = useId();

    useScrollLock(isOpen);

    // Ghi lại phần tử đang focus để trả về đúng chỗ khi đóng — nếu không,
    // focus rơi về <body> và người dùng bàn phím mất dấu.
    useEffect(() => {
        if (!isOpen) return undefined;
        restoreFocusRef.current = document.activeElement;
        return () => {
            const el = restoreFocusRef.current;
            if (el && typeof el.focus === 'function' && document.contains(el)) el.focus();
        };
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return undefined;

        const token = {};
        modalStack.push(token);

        const onKey = (event) => {
            // Bỏ qua nếu đang có modal khác nằm trên
            if (modalStack[modalStack.length - 1] !== token) return;

            if (event.key === 'Escape' && closeOnEscape) {
                event.preventDefault();
                onClose?.();
                return;
            }
            if (event.key === 'Tab' && panelRef.current) trapFocus(panelRef.current, event);
        };

        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('keydown', onKey);
            const i = modalStack.indexOf(token);
            if (i !== -1) modalStack.splice(i, 1);
        };
    }, [isOpen, closeOnEscape, onClose]);

    // Đưa focus vào trong modal khi mở
    useEffect(() => {
        if (!isOpen || !panelRef.current) return;
        const first = panelRef.current.querySelector(
            'input:not([type="hidden"]), textarea, select, button, [href], [tabindex]:not([tabindex="-1"])'
        );
        (first || panelRef.current).focus?.();
    }, [isOpen]);

    if (!isOpen) return null;

    return createPortal(
        <div
            className={clsx('modal-overlay', sheetOnMobile && 'modal-overlay--sheet', 'animate-in fade-in duration-200')}
            style={{ '--modal-z': z }}
            role="presentation"
            onMouseDown={(e) => {
                // mousedown chứ không phải click: click sẽ đóng nhầm khi người dùng
                // bôi đen chữ trong modal rồi thả chuột ra ngoài
                if (closeOnBackdrop && e.target === e.currentTarget) onClose?.();
            }}
        >
            <div
                ref={panelRef}
                tabIndex={-1}
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? titleId : undefined}
                aria-describedby={describedById}
                className={clsx('modal-content', SIZES[size] || SIZES.lg, 'animate-in zoom-in-95 duration-200', className)}
            >
                {(title || showCloseButton || headerExtra) && (
                    <div className="modal-header">
                        <div className="flex min-w-0 items-center gap-3">
                            {icon}
                            {title && (
                                <h2 id={titleId} className="truncate text-lg font-bold text-slate-900">
                                    {title}
                                </h2>
                            )}
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                            {headerExtra}
                            {showCloseButton && (
                                <button type="button" onClick={onClose} className="icon-btn" aria-label="Đóng">
                                    <X size={20} />
                                </button>
                            )}
                        </div>
                    </div>
                )}

                <div className={clsx('modal-body', bodyClassName)}>{children}</div>

                {footer && <div className="modal-footer">{footer}</div>}
            </div>
        </div>,
        document.body
    );
}
