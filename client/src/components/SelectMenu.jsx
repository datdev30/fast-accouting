import React, { useId, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';
import Popover from './Popover';
import { handleComboboxKeyboard } from '../utils/keyboardNav';

/**
 * Ô chọn một giá trị, thay cho <select> gốc.
 *
 * Lý do phải tự dựng: danh sách <option> do hệ điều hành vẽ, không nhận
 * CSS của trang — nền xanh chói, font hệ thống, bo góc vuông, lạc hẳn với
 * phần còn lại của giao diện. Chỉ cái nút đóng lại là style được, nên ô
 * chọn năm làm việc trước đây đẹp cho tới lúc bấm vào thì bung ra một
 * danh sách của Windows.
 *
 * Panel mượn Popover: portal ra body nên không bị ancestor overflow cắt,
 * tự lật lên khi thiếu chỗ bên dưới, và dưới 640px thành bottom sheet.
 *
 * @param {string|number} value
 * @param {(v:any)=>void} onChange
 * @param {Array<{value:any,label:React.ReactNode,hint?:string}>} options
 * @param {string} [ariaLabel] Bắt buộc nếu không có <label htmlFor>
 * @param {string} [id] Nối với <label htmlFor> bên ngoài
 * @param {boolean} [disabled]
 * @param {React.ReactNode} [trailing] Phần tử phụ cạnh mũi tên (vd. spinner)
 * @param {string} [buttonClassName] Ghi đè cỡ chữ/màu chữ của nút
 * @param {string} [sheetTitle] Tiêu đề khi hiện dạng bottom sheet
 */
export default function SelectMenu({
    value,
    onChange,
    options = [],
    ariaLabel,
    id,
    disabled = false,
    trailing,
    className,
    buttonClassName,
    sheetTitle,
}) {
    const reactId = useId();
    const listboxId = `${reactId}-listbox`;
    const buttonRef = useRef(null);
    const [open, setOpen] = useState(false);
    const [highlighted, setHighlighted] = useState(-1);

    const selectedIndex = useMemo(
        () => options.findIndex((o) => String(o.value) === String(value)),
        [options, value]
    );
    const selected = selectedIndex >= 0 ? options[selectedIndex] : null;

    const close = () => {
        setOpen(false);
        setHighlighted(-1);
    };

    const openMenu = () => {
        if (disabled) return;
        setHighlighted(Math.max(0, selectedIndex));
        setOpen(true);
    };

    const pick = (opt) => {
        onChange?.(opt.value);
        close();
        buttonRef.current?.focus();
    };

    const onKeyDown = (event) => {
        if (!open) {
            if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
                event.preventDefault();
                openMenu();
            }
            return;
        }

        const handled = handleComboboxKeyboard(event, {
            items: options,
            selectedIndex: highlighted,
            onNavigate: setHighlighted,
            onClose: () => {
                close();
                buttonRef.current?.focus();
            },
            onSelect: pick,
        });

        if (!handled && event.key === 'Tab') close();
    };

    return (
        <div className={clsx('relative', className)}>
            <button
                ref={buttonRef}
                id={id}
                type="button"
                disabled={disabled}
                className={clsx('select-menu__button', buttonClassName)}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-controls={open ? listboxId : undefined}
                aria-label={ariaLabel}
                onClick={() => (open ? close() : openMenu())}
                onKeyDown={onKeyDown}
            >
                <span className="min-w-0 flex-1 truncate text-left">
                    {selected ? selected.label : ''}
                </span>
                {trailing}
                <ChevronDown
                    size={16}
                    aria-hidden
                    className={clsx(
                        'shrink-0 text-slate-400 transition-transform duration-200',
                        open && 'rotate-180 text-blue-500'
                    )}
                />
            </button>

            <Popover
                anchorRef={buttonRef}
                open={open}
                onClose={close}
                title={sheetTitle || ariaLabel}
                minWidth={buttonRef.current?.offsetWidth || 180}
                className="select-menu__panel"
            >
                <ul id={listboxId} role="listbox" aria-label={ariaLabel} onKeyDown={onKeyDown}>
                    {options.map((opt, idx) => {
                        const isSelected = idx === selectedIndex;
                        return (
                            <li key={String(opt.value)}>
                                <button
                                    type="button"
                                    role="option"
                                    aria-selected={isSelected}
                                    className={clsx(
                                        'select-menu__option',
                                        idx === highlighted && 'select-menu__option--active',
                                        isSelected && 'select-menu__option--selected'
                                    )}
                                    onMouseEnter={() => setHighlighted(idx)}
                                    onClick={() => pick(opt)}
                                >
                                    <span className="min-w-0 flex-1 truncate text-left">{opt.label}</span>
                                    {opt.hint && (
                                        <span className="shrink-0 text-xs font-medium text-slate-400">{opt.hint}</span>
                                    )}
                                    <Check
                                        size={16}
                                        aria-hidden
                                        className={clsx('shrink-0', isSelected ? 'text-blue-600' : 'invisible')}
                                    />
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </Popover>
        </div>
    );
}
