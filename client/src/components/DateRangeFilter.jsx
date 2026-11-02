import React, { useEffect, useId, useRef, useState } from 'react';
import { Calendar, ChevronDown, X } from 'lucide-react';
import { clsx } from 'clsx';
import Popover from './Popover';
import { useWorkingYear } from '../context/WorkingYearContext';

const toYMD = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

function buildPresets(year) {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const today = toYMD(now);
    return [
        { key: 'all', label: 'Tất cả thời gian', start: '', end: '' },
        { key: 'today', label: 'Hôm nay', start: today, end: today },
        { key: '7d', label: '7 ngày qua', start: toYMD(new Date(y, m, now.getDate() - 6)), end: today },
        { key: 'month', label: 'Tháng này', start: toYMD(new Date(y, m, 1)), end: toYMD(new Date(y, m + 1, 0)) },
        { key: 'lastMonth', label: 'Tháng trước', start: toYMD(new Date(y, m - 1, 1)), end: toYMD(new Date(y, m, 0)) },
        { key: 'year', label: `Năm ${year}`, start: `${year}-01-01`, end: `${year}-12-31` },
    ];
}

/** yyyy-mm-dd → dd/mm, kèm /yyyy khi cần */
function short(ymd, withYear) {
    const [y, m, d] = ymd.split('-');
    return withYear ? `${d}/${m}/${y}` : `${d}/${m}`;
}

function rangeLabel(start, end) {
    if (!start && !end) return 'Tất cả thời gian';
    if (start && !end) return `Từ ${short(start, true)}`;
    if (!start && end) return `Đến ${short(end, true)}`;
    if (start === end) return short(start, true);
    const sameYear = start.slice(0, 4) === end.slice(0, 4);
    return `${short(start, !sameYear)} – ${short(end, true)}`;
}

/**
 * Bộ lọc khoảng ngày gọn: một pill hiển thị khoảng đang lọc, bấm mở popover
 * (bottom sheet dưới 640px) gồm các mốc nhanh và ô từ/đến tùy chọn.
 *
 * @param {string} startDate yyyy-mm-dd hoặc ''
 * @param {string} endDate yyyy-mm-dd hoặc ''
 * @param {(start: string, end: string) => void} onChange
 */
export default function DateRangeFilter({ startDate, endDate, onChange, className }) {
    const { year } = useWorkingYear();
    const [open, setOpen] = useState(false);
    const anchorRef = useRef(null);
    const triggerRef = useRef(null);
    const panelRef = useRef(null);
    const id = useId();
    const active = Boolean(startDate || endDate);
    const presets = buildPresets(year);
    const label = rangeLabel(startDate, endDate);

    useEffect(() => {
        if (open) panelRef.current?.querySelector('button')?.focus();
    }, [open]);

    const close = () => {
        setOpen(false);
        triggerRef.current?.focus();
    };

    const apply = (start, end) => onChange(start, end);

    return (
        <div ref={anchorRef} className={clsx('flex shrink-0 items-center', className)}>
            <button
                ref={triggerRef}
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-haspopup="dialog"
                aria-expanded={open}
                aria-label={`Lọc theo ngày: ${label}`}
                className={clsx(
                    'inline-flex min-h-9 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 text-xs font-semibold transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1',
                    active
                        ? 'rounded-r-none border-r-0 border-blue-200 bg-blue-50 text-blue-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                )}
            >
                <Calendar size={14} className="shrink-0" aria-hidden />
                <span>{label}</span>
                <ChevronDown size={14} className="shrink-0 opacity-60" aria-hidden />
            </button>
            {active && (
                <button
                    type="button"
                    onClick={() => apply('', '')}
                    aria-label="Xóa lọc ngày"
                    className="inline-flex min-h-9 items-center rounded-r-full border border-l-0 border-blue-200 bg-blue-50 pl-1 pr-2.5 text-blue-700 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                    <X size={14} aria-hidden />
                </button>
            )}

            <Popover anchorRef={anchorRef} open={open} onClose={close} title="Lọc theo ngày" minWidth={320}>
                <div ref={panelRef} className="space-y-4">
                    <div className="grid grid-cols-2 gap-2" role="group" aria-label="Khoảng ngày nhanh">
                        {presets.map((p) => {
                            const selected = p.start === (startDate || '') && p.end === (endDate || '');
                            return (
                                <button
                                    key={p.key}
                                    type="button"
                                    aria-pressed={selected}
                                    onClick={() => {
                                        apply(p.start, p.end);
                                        close();
                                    }}
                                    className={clsx(
                                        'min-h-[var(--tap-min)] rounded-full border px-3 text-sm font-semibold transition-colors',
                                        selected
                                            ? 'border-blue-600 bg-blue-600 text-white'
                                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                                    )}
                                >
                                    {p.label}
                                </button>
                            );
                        })}
                    </div>

                    <div className="border-t border-slate-100 pt-3" role="group" aria-labelledby={`${id}-custom`}>
                        <p id={`${id}-custom`} className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Tùy chọn</p>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                ['start', 'Từ ngày', startDate, (v) => apply(v, endDate), { max: endDate || undefined }],
                                ['end', 'Đến ngày', endDate, (v) => apply(startDate, v), { min: startDate || undefined }],
                            ].map(([key, text, value, set, limits]) => (
                                <label key={key} htmlFor={`${id}-${key}`} className="block min-w-0">
                                    <span className="mb-1 block text-xs font-medium text-slate-500">{text}</span>
                                    <span className="relative flex min-h-[var(--tap-min)] items-center rounded-xl border border-slate-200 bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20">
                                        <input
                                            id={`${id}-${key}`}
                                            type="date"
                                            value={value || ''}
                                            {...limits}
                                            onChange={(e) => set(e.target.value)}
                                            className="min-w-0"
                                        />
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button type="button" onClick={() => apply('', '')} disabled={!active} className="btn-secondary btn-md flex-1">
                            Xóa lọc
                        </button>
                        <button type="button" onClick={close} className="btn-primary btn-md flex-1">
                            Xong
                        </button>
                    </div>
                </div>
            </Popover>
        </div>
    );
}
