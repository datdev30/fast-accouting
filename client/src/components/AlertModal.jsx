import React, { useEffect } from 'react';
import { X, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';
import useScrollLock from '../hooks/useScrollLock';

/**
 * Reusable Alert Modal
 * @param {boolean} isOpen - Whether the modal is open
 * @param {function} onClose - Function to call when closing
 * @param {string} title - Title of the alert
 * @param {string} message - Message content
 * @param {'success' | 'error' | 'warning' | 'info'} type - Type of alert
 */
export default function AlertModal({ isOpen, onClose, title, message, type = 'info' }) {
    useScrollLock(isOpen);

    if (!isOpen) return null;

    // Auto close for success messages after 3s? 
    // Maybe better to let parent handle or optional prop.
    // For now, manual close (like native alert).

    const typeConfig = {
        success: {
            icon: CheckCircle,
            color: 'text-green-600',
            bg: 'bg-green-100',
            borderColor: 'border-green-200',
            button: 'bg-green-600 hover:bg-green-700'
        },
        error: {
            icon: AlertCircle,
            color: 'text-red-600',
            bg: 'bg-red-100',
            borderColor: 'border-red-200',
            button: 'bg-red-600 hover:bg-red-700'
        },
        warning: {
            icon: AlertTriangle,
            color: 'text-amber-600',
            bg: 'bg-amber-100',
            borderColor: 'border-amber-200',
            button: 'bg-amber-600 hover:bg-amber-700'
        },
        info: {
            icon: AlertCircle,
            color: 'text-blue-600',
            bg: 'bg-blue-100',
            borderColor: 'border-blue-200',
            button: 'bg-blue-600 hover:bg-blue-700'
        }
    };

    const config = typeConfig[type] || typeConfig.info;
    const Icon = config.icon;

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[70] p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden scale-100 animate-in zoom-in-95 duration-200">
                <div className="p-6 text-center">
                    <div className={clsx("w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4", config.bg)}>
                        <Icon size={32} className={config.color} />
                    </div>

                    <h3 className="text-xl font-bold text-slate-800 mb-2">{title || 'Thông báo'}</h3>
                    <p className="text-slate-600 mb-6">{message}</p>

                    <button
                        onClick={onClose}
                        className={clsx("w-full py-2.5 rounded-xl text-white font-bold transition-colors shadow-lg shadow-slate-200", config.button)}
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
}
