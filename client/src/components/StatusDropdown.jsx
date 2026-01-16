import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Clock } from 'lucide-react';
import { clsx } from 'clsx';
import { handleComboboxKeyboard } from '../utils/keyboardNav';

const STATUS_OPTIONS = [
    {
        value: 'OPEN',
        label: 'Chưa thanh toán',
        icon: Clock,
        iconClass: 'text-amber-600',
    },
    {
        value: 'PAID',
        label: 'Đã thanh toán',
        icon: Check,
        iconClass: 'text-emerald-600',
    },
];

export default function StatusDropdown({ value, onChange, size = 'md' }) {
    const id = useId();
    const rootRef = useRef(null);
    const buttonRef = useRef(null);

    const [open, setOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);

    const selected = useMemo(
        () => STATUS_OPTIONS.find((o) => o.value === value) || STATUS_OPTIONS[0],
        [value]
    );

    const heightClass = size === 'lg' ? 'h-[60px] md:h-[60px]' : 'h-[54px] md:min-h-[44px]';

    const close = () => {
        setOpen(false);
        setHighlightedIndex(-1);
    };

    useEffect(() => {
        function handleClickOutside(event) {
            if (rootRef.current && !rootRef.current.contains(event.target)) {
                close();
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (!open) return;

        const selectedIdx = Math.max(
            0,
            STATUS_OPTIONS.findIndex((o) => o.value === value)
        );
        setHighlightedIndex(selectedIdx);
    }, [open, value]);

    const onKeyDown = (event) => {
        if (!open) {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                setOpen(true);
            }
            return;
        }

        const handled = handleComboboxKeyboard(event, {
            items: STATUS_OPTIONS,
            selectedIndex: highlightedIndex,
            onNavigate: setHighlightedIndex,
            onClose: () => {
                close();
                buttonRef.current?.focus();
            },
            onSelect: (item) => {
                onChange?.(item.value);
                close();
                buttonRef.current?.focus();
            },
        });

        if (!handled && event.key === 'Tab') {
            close();
        }
    };

    const SelectedIcon = selected.icon;

    return (
        <div ref={rootRef} className="relative">
            <button
                ref={buttonRef}
                type="button"
                className={clsx(
                    'w-full select-none rounded-[1.25rem] bg-slate-50 border border-slate-100 shadow-inner',
                    heightClass,
                    'pl-11 pr-12 text-base font-medium text-slate-800',
                    'outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500',
                    'flex items-center text-left'
                )}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-controls={`${id}-listbox`}
                onClick={() => setOpen((v) => !v)}
                onKeyDown={onKeyDown}
            >
                <span className={clsx('absolute inset-y-0 left-0 pl-4 flex items-center', selected.iconClass)}>
                    <SelectedIcon size={18} />
                </span>
                <span className="flex-1 truncate">{selected.label}</span>
                <span className={clsx('absolute inset-y-0 right-0 pr-4 flex items-center text-slate-300', open && 'text-blue-500')}>
                    <ChevronDown size={18} />
                </span>
            </button>

            {open && (
                <div
                    id={`${id}-listbox`}
                    role="listbox"
                    tabIndex={-1}
                    className={clsx(
                        'absolute z-50 mt-2 w-full overflow-hidden',
                        'rounded-2xl border border-slate-200 bg-white shadow-xl'
                    )}
                    onKeyDown={onKeyDown}
                >
                    {STATUS_OPTIONS.map((opt, idx) => {
                        const isSelected = opt.value === value;
                        const isHighlighted = idx === highlightedIndex;
                        const Icon = opt.icon;

                        return (
                            <button
                                key={opt.value}
                                type="button"
                                role="option"
                                aria-selected={isSelected}
                                className={clsx(
                                    'w-full px-4 py-3 md:py-3.5 text-left flex items-center gap-3',
                                    'text-sm md:text-base font-medium',
                                    'md:min-h-[44px]',
                                    isHighlighted && 'bg-slate-50',
                                    !isHighlighted && 'bg-white',
                                    'hover:bg-slate-50 transition-colors'
                                )}
                                onMouseEnter={() => setHighlightedIndex(idx)}
                                onClick={() => {
                                    onChange?.(opt.value);
                                    close();
                                }}
                            >
                                <span className={clsx('flex-none', opt.iconClass)}>
                                    <Icon size={18} />
                                </span>
                                <span className="flex-1">{opt.label}</span>
                                {isSelected && (
                                    <span className="text-blue-600 text-xs font-bold">Đang chọn</span>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
