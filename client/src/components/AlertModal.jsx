import React from 'react';
import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';
import AppModal from './AppModal';

/**
 * Hộp thông báo một nút, thay cho alert() của trình duyệt.
 *
 * @param {boolean} isOpen
 * @param {function} onClose
 * @param {string} title
 * @param {string} message
 * @param {'success'|'error'|'warning'|'info'} type
 */
const TYPES = {
    success: { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-100', button: 'btn-success' },
    error: { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100', button: 'btn-danger' },
    warning: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-100', button: 'btn-primary' },
    info: { icon: AlertCircle, color: 'text-blue-600', bg: 'bg-blue-100', button: 'btn-primary' },
};

export default function AlertModal({ isOpen, onClose, title, message, type = 'info' }) {
    const config = TYPES[type] || TYPES.info;
    const Icon = config.icon;

    return (
        <AppModal
            isOpen={isOpen}
            onClose={onClose}
            size="sm"
            /* z cao hơn mặc định: hộp này thường bật lên TRÊN một modal khác */
            z={70}
            showCloseButton={false}
            sheetOnMobile={false}
            describedById="alert-modal-message"
            footer={(
                <button type="button" onClick={onClose} className={clsx(config.button, 'btn-md w-full')}>
                    Đóng
                </button>
            )}
        >
            <div className="py-2 text-center">
                <div className={clsx('mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full', config.bg)}>
                    <Icon size={32} className={config.color} />
                </div>
                <h3 className="mb-2 text-xl font-bold text-slate-800">{title || 'Thông báo'}</h3>
                <p id="alert-modal-message" className="text-slate-600">{message}</p>
            </div>
        </AppModal>
    );
}
