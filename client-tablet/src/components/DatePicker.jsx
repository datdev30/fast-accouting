import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDate } from '../utils/dateUtils';
import { clsx } from 'clsx';

const DatePicker = ({ value, onChange, placeholder = 'Chọn ngày', className, disabled, size = 'md' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(value || '');
    const [currentMonth, setCurrentMonth] = useState(() => {
        if (value) {
            const date = new Date(value);
            return new Date(date.getFullYear(), date.getMonth(), 1);
        }
        return new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    });
    const containerRef = useRef(null);

    useEffect(() => {
        if (value) {
            setSelectedDate(value);
            const date = new Date(value);
            setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1));
        } else {
            setSelectedDate('');
        }
    }, [value]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen]);

    const getDaysInMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const toLocalYYYYMMDD = (d) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dNum = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${dNum}`;
    };

    const handleDateSelect = (day) => {
        const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        const dateString = toLocalYYYYMMDD(newDate);
        setSelectedDate(dateString);
        onChange({ target: { value: dateString } });
        setIsOpen(false);
    };

    const handlePrevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];
    const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
        days.push(null);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        days.push(day);
    }

    const today = new Date();
    const isToday = (day) => {
        return day === today.getDate() &&
            currentMonth.getMonth() === today.getMonth() &&
            currentMonth.getFullYear() === today.getFullYear();
    };

    const isSelected = (day) => {
        if (!selectedDate) return false;
        const s = selectedDate.split('T')[0];
        const parts = s.split('-');
        if (parts.length !== 3) return false;
        const [y, m, d] = parts.map(Number);
        return day === d && currentMonth.getMonth() === m - 1 && currentMonth.getFullYear() === y;
    };

    const isSm = size === 'sm';
    return (
        <div ref={containerRef} className={clsx("relative", className)}>
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={clsx(
                    "w-full flex items-center gap-2 font-medium text-slate-600 bg-transparent rounded-lg transition-colors",
                    "hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20",
                    disabled && "opacity-50 cursor-not-allowed",
                    isSm ? "px-2.5 pl-8 py-2 text-xs" : "px-3 pl-10 py-2.5 text-sm md:text-base"
                )}
            >
                <Calendar size={isSm ? 14 : 18} className={clsx("absolute text-slate-400", isSm ? "left-2.5" : "left-3")} />
                <span className="flex-1 text-left">
                    {selectedDate ? formatDate(selectedDate) : placeholder}
                </span>
            </button>

            {isOpen && (
                <div className="absolute z-50 mt-2 bg-white rounded-2xl border border-slate-200 shadow-2xl p-4 min-w-[320px] animate-in fade-in zoom-in-95 duration-200">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <button
                            type="button"
                            onClick={handlePrevMonth}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                            aria-label="Tháng trước"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <div className="text-base font-bold text-slate-900">
                            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                        </div>
                        <button
                            type="button"
                            onClick={handleNextMonth}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                            aria-label="Tháng sau"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    {/* Day names */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {dayNames.map((day) => (
                            <div key={day} className="text-center text-xs font-semibold text-slate-500 py-2">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar grid */}
                    <div className="grid grid-cols-7 gap-1">
                        {days.map((day, index) => {
                            if (day === null) {
                                return <div key={`empty-${index}`} className="aspect-square" />;
                            }
                            return (
                                <button
                                    key={day}
                                    type="button"
                                    onClick={() => handleDateSelect(day)}
                                    className={clsx(
                                        "aspect-square rounded-lg text-sm font-medium transition-all min-h-[44px] flex items-center justify-center",
                                        isSelected(day)
                                            ? "bg-blue-600 text-white shadow-lg"
                                            : isToday(day)
                                                ? "bg-blue-50 text-blue-600 font-bold border-2 border-blue-200"
                                                : "text-slate-700 hover:bg-slate-100"
                                    )}
                                >
                                    {day}
                                </button>
                            );
                        })}
                    </div>

                    {/* Today button */}
                    <div className="mt-4 pt-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={() => {
                                const today = toLocalYYYYMMDD(new Date());
                                setSelectedDate(today);
                                onChange({ target: { value: today } });
                                setIsOpen(false);
                            }}
                            className="w-full py-2.5 px-4 bg-slate-50 hover:bg-slate-100 rounded-lg text-sm font-medium text-slate-700 transition-colors min-h-[44px]"
                        >
                            Hôm nay
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DatePicker;
