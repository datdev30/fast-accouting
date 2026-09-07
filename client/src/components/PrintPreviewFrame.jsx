import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Minus, Plus, Maximize2 } from 'lucide-react';

const A4_WIDTH_PX = 794; // 210mm @ 96dpi
const ZOOM_STEPS = [0.5, 0.75, 1, 1.25, 1.5, 2];

/**
 * Khung xem trước bản in, co giãn theo bề rộng khả dụng.
 *
 * Vì sao cần: PrintableReport / PrintableAllTransactions cố định
 * `max-w-[210mm]` (~794px). Trên điện thoại 375px khối đó tràn ngang và bị
 * cắt. Component này BỌC BÊN NGOÀI và chỉ thu nhỏ phần hiển thị.
 *
 * Hai ràng buộc phải giữ:
 *  1. Không nhận `ref` — ref của react-to-print vẫn nằm trên component in,
 *     nên node được clone khi in không mang theo transform của wrapper.
 *  2. Không thêm class lên children.
 *
 * @param {number} [pageWidth] Bề rộng trang gốc, px
 */
export default function PrintPreviewFrame({ children, pageWidth = A4_WIDTH_PX }) {
    const frameRef = useRef(null);
    const contentRef = useRef(null);
    const [fit, setFit] = useState(1);
    const [zoomIndex, setZoomIndex] = useState(-1); // -1 = vừa khung

    const scale = zoomIndex === -1 ? fit : ZOOM_STEPS[zoomIndex];

    const measure = useCallback(() => {
        const frame = frameRef.current;
        const content = contentRef.current;
        if (!frame || !content) return;

        // Bề rộng là hằng số khổ trang, KHÔNG đo từ nội dung: nội dung nằm trong
        // một khối đã bị scale, nên đo nó sẽ tạo vòng lặp và làm bản xem trước
        // dồn chữ khác hẳn bản in. Chỉ chiều cao mới cần đo.
        frame.style.setProperty('--pv-w', `${pageWidth}px`);
        // offsetHeight không bị transform ảnh hưởng → là chiều cao gốc
        frame.style.setProperty('--pv-h', `${content.offsetHeight || 0}px`);

        const pad = document.defaultView
            .getComputedStyle(frame.firstElementChild || frame);
        const padding = parseFloat(pad.paddingLeft || 0) + parseFloat(pad.paddingRight || 0);
        const available = frame.clientWidth - padding;
        setFit(available > 0 ? Math.min(1, available / pageWidth) : 1);
    }, [pageWidth]);

    useEffect(() => {
        const frame = frameRef.current;
        const content = contentRef.current;
        if (!frame || !content || typeof ResizeObserver === 'undefined') return undefined;

        const observer = new ResizeObserver(measure);
        observer.observe(frame);
        observer.observe(content);
        return () => observer.disconnect();
    }, [measure]);

    useEffect(() => {
        const frame = frameRef.current;
        if (frame) frame.style.setProperty('--pv-scale', String(scale));
    }, [scale]);

    const zoomOut = () => {
        const current = ZOOM_STEPS.findIndex((s) => s >= scale - 0.001);
        setZoomIndex(Math.max(0, (current === -1 ? ZOOM_STEPS.length : current) - 1));
    };

    const zoomIn = () => {
        const current = ZOOM_STEPS.findIndex((s) => s > scale + 0.001);
        setZoomIndex(current === -1 ? ZOOM_STEPS.length - 1 : current);
    };

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <div className="print-preview-frame" ref={frameRef}>
                <div className="print-preview-frame__pad">
                    <div className="print-preview-frame__sizer">
                        <div className="print-preview-frame__scale">
                            <div ref={contentRef} className="bg-white shadow-xl">
                                {children}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="print-preview-frame__toolbar mx-auto -mt-2 mb-2 shrink-0">
                <button
                    type="button"
                    onClick={zoomOut}
                    className="icon-btn"
                    aria-label="Thu nhỏ bản xem trước"
                    disabled={scale <= ZOOM_STEPS[0]}
                >
                    <Minus size={16} />
                </button>
                <span className="min-w-14 text-center text-xs font-semibold tabular-nums text-slate-600">
                    {Math.round(scale * 100)}%
                </span>
                <button
                    type="button"
                    onClick={zoomIn}
                    className="icon-btn"
                    aria-label="Phóng to bản xem trước"
                    disabled={scale >= ZOOM_STEPS[ZOOM_STEPS.length - 1]}
                >
                    <Plus size={16} />
                </button>
                <button
                    type="button"
                    onClick={() => setZoomIndex(-1)}
                    className="icon-btn"
                    aria-label="Vừa khung"
                    title="Vừa khung"
                >
                    <Maximize2 size={16} />
                </button>
            </div>
        </div>
    );
}
