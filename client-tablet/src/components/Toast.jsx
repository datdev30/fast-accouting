import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { clsx } from 'clsx';

export default function Toast({ toast, onClose }) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (toast) {
            // Small delay to allow render before animation starts
            requestAnimationFrame(() => setIsVisible(true));
        } else {
            setIsVisible(false);
        }
    }, [toast]);

    if (!toast) return null;

    const bgColors = {
        success: 'bg-white border-emerald-100',
        error: 'bg-white border-red-100',
        info: 'bg-white border-blue-100',
        warning: 'bg-white border-amber-100',
    };

    const iconColors = {
        success: 'text-emerald-500',
        error: 'text-red-500',
        info: 'text-blue-500',
        warning: 'text-amber-500',
    };

    const icons = {
        success: <CheckCircle size={20} className={iconColors.success} />,
        error: <AlertCircle size={20} className={iconColors.error} />,
        info: <Info size={20} className={iconColors.info} />,
        warning: <AlertCircle size={20} className={iconColors.warning} />,
    };

    return (
        <div
            className={clsx(
                "fixed top-4 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 ease-out transform",
                isVisible ? "translate-y-0 opacity-100" : "-translate-y-12 opacity-0"
            )}
        >
            <div className={clsx(
                "flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border-2 min-w-[320px] max-w-md",
                bgColors[toast.type] || bgColors.info
            )}>
                <div className="shrink-0">
                    {icons[toast.type] || icons.info}
                </div>
                <div className="flex-1">
                    {toast.title && <h4 className="font-bold text-slate-800 text-sm">{toast.title}</h4>}
                    <p className="text-slate-600 text-sm font-medium">{toast.message}</p>
                </div>
                <button
                    onClick={() => {
                        setIsVisible(false);
                        setTimeout(onClose, 300); // Wait for animation
                    }}
                    className="p-2 md:p-2.5 hover:bg-slate-100 rounded-full text-slate-400 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                    aria-label="Đóng thông báo"
                >
                    <X size={18} className="md:w-5 md:h-5" />
                </button>
            </div>
        </div>
    );
}
