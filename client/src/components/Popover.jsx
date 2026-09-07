import React, { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { clsx } from 'clsx';
import useMediaQuery from '../hooks/useMediaQuery';

/**
 * Popover neo theo một phần tử, render qua portal ra document.body.
 *
 * Lý do portal: các panel `position: absolute` bên trong nội dung bị
 * `overflow-x-clip` của #app-scroll cắt mất khi tràn mép phải (F9).
 * Portal + `position: fixed` thoát khỏi mọi ancestor có overflow.
 *
 * Dưới 640px panel chuyển thành bottom sheet full-width — vừa hết tràn,
 * vừa đủ chỗ cho lịch tháng thao tác bằng ngón tay.
 *
 * @param {React.RefObject} anchorRef Phần tử để neo (thường là ô nhập)
 * @param {boolean} open
 * @param {Function} onClose Gọi khi bấm ra ngoài hoặc nhấn Escape
 * @param {string} [title] Tiêu đề, chỉ hiển thị ở chế độ bottom sheet
 * @param {number} [minWidth] Bề rộng tối thiểu của panel ở chế độ neo
 */
export default function Popover({
    anchorRef,
    open,
    onClose,
    title,
    minWidth = 320,
    className,
    children,
}) {
    const panelRef = useRef(null);
    const isSheet = !useMediaQuery('(min-width: 640px)', true);

    /* Đặt vị trí bằng cách ghi thẳng style vào node: đây là đồng bộ với một hệ
       thống ngoài (layout của trình duyệt), không phải state của React. Giữ nó
       ngoài state cũng tránh một vòng render thừa mỗi lần cuộn. */
    const place = useCallback(() => {
        const anchor = anchorRef?.current;
        const panel = panelRef.current;
        if (!anchor || !panel) return;

        const a = anchor.getBoundingClientRect();
        const pw = Math.max(panel.offsetWidth, minWidth);
        const ph = panel.offsetHeight;
        const vw = document.documentElement.clientWidth;
        const vh = document.documentElement.clientHeight;
        const GAP = 8;
        const EDGE = 8;

        // Ngang: bám mép trái của anchor, lật/kẹp khi chạm mép màn hình
        let left = a.left;
        if (left + pw > vw - EDGE) left = Math.max(EDGE, a.right - pw);
        if (left < EDGE) left = EDGE;

        // Dọc: ưu tiên bên dưới, lật lên trên nếu không đủ chỗ
        let top = a.bottom + GAP;
        if (top + ph > vh - EDGE && a.top - GAP - ph > EDGE) top = a.top - GAP - ph;
        if (top + ph > vh - EDGE) top = Math.max(EDGE, vh - EDGE - ph);

        panel.style.top = `${top}px`;
        panel.style.left = `${left}px`;
        panel.style.maxHeight = `${vh - top - EDGE}px`;
        panel.style.visibility = 'visible';
    }, [anchorRef, minWidth]);

    useLayoutEffect(() => {
        if (!open || isSheet) return undefined;
        place();

        const onScrollOrResize = () => place();
        window.addEventListener('resize', onScrollOrResize);
        window.addEventListener('scroll', onScrollOrResize, true);
        return () => {
            window.removeEventListener('resize', onScrollOrResize);
            window.removeEventListener('scroll', onScrollOrResize, true);
        };
    }, [open, isSheet, place]);

    useEffect(() => {
        if (!open) return undefined;

        const onPointerDown = (event) => {
            const panel = panelRef.current;
            const anchor = anchorRef?.current;
            if (panel && panel.contains(event.target)) return;
            if (anchor && anchor.contains(event.target)) return;
            onClose?.();
        };
        const onKey = (event) => {
            if (event.key === 'Escape') onClose?.();
        };

        document.addEventListener('mousedown', onPointerDown);
        document.addEventListener('touchstart', onPointerDown);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onPointerDown);
            document.removeEventListener('touchstart', onPointerDown);
            document.removeEventListener('keydown', onKey);
        };
    }, [open, onClose, anchorRef]);

    if (!open) return null;

    if (isSheet) {
        return createPortal(
            <div className="fixed inset-0 z-[70] flex flex-col justify-end">
                <div
                    className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
                    role="presentation"
                    onClick={onClose}
                />
                <div
                    ref={panelRef}
                    className={clsx(
                        'relative w-full overflow-y-auto rounded-t-2xl border-t border-slate-200 bg-white p-4 shadow-2xl',
                        'animate-in slide-in-from-bottom duration-200',
                        className
                    )}
                    style={{
                        maxHeight: '85dvh',
                        paddingBottom: 'max(1rem, var(--safe-b))',
                    }}
                    role="dialog"
                    aria-modal="true"
                    aria-label={title}
                >
                    <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-200" aria-hidden />
                    {title && (
                        <p className="mb-3 text-center text-sm font-semibold text-slate-700">{title}</p>
                    )}
                    {children}
                </div>
            </div>,
            document.body
        );
    }

    return createPortal(
        <div
            ref={panelRef}
            className={clsx(
                'fixed z-[70] overflow-y-auto overscroll-contain rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl',
                'animate-in fade-in zoom-in-95 duration-150',
                className
            )}
            style={{ top: 0, left: 0, minWidth, visibility: 'hidden' }}
            role="dialog"
            aria-label={title}
        >
            {children}
        </div>,
        document.body
    );
}
