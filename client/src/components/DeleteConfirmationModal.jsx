import React, { useState, useEffect, useRef } from 'react';
import { X, AlertTriangle, ShieldAlert } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { trapFocus, focusFirstElement } from '../utils/focusTrap';

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, title, warningMessage, isDeleting }) => {
    const [pin, setPin] = useState('');
    const [phase, setPhase] = useState('WARNING'); // WARNING -> PIN
    const { showToast } = useToast();
    const modalRef = useRef(null);
    const pinInputRef = useRef(null);

    // Reset state when opened
    useEffect(() => {
        if (isOpen) {
            setPin('');
            setPhase('WARNING');
        }
    }, [isOpen]);

    // ESC key handler
    useEffect(() => {
        if (!isOpen) return;

        const handleEscKey = (event) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscKey);
        return () => document.removeEventListener('keydown', handleEscKey);
    }, [isOpen, onClose]);

    // Focus trap
    useEffect(() => {
        if (!isOpen || !modalRef.current) return;

        const handleTabKey = (event) => {
            if (event.key === 'Tab') {
                trapFocus(modalRef.current, event);
            }
        };

        document.addEventListener('keydown', handleTabKey);
        return () => document.removeEventListener('keydown', handleTabKey);
    }, [isOpen]);

    // Auto-focus on PIN input when entering PIN phase
    useEffect(() => {
        if (isOpen && phase === 'PIN' && pinInputRef.current) {
            // Small delay to ensure DOM is ready
            setTimeout(() => {
                pinInputRef.current?.focus();
            }, 100);
        }
    }, [isOpen, phase]);

    const handlePinSubmit = (e) => {
        e.preventDefault();
        if (pin.length < 4) {
            showToast('Lỗi', 'Vui lòng nhập mã PIN hợp lệ', 'warning');
            return;
        }
        onConfirm(pin);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-0 sm:p-4 animate-in fade-in duration-200">
            <div
                ref={modalRef}
                className="bg-white sm:rounded-2xl w-full h-full sm:h-auto sm:max-w-xl shadow-2xl relative overflow-hidden flex flex-col"
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
                aria-describedby="modal-description"
            >

                {/* Header */}
                <div className="bg-red-50 px-6 sm:px-8 py-4 sm:py-5 border-b border-red-100 flex justify-between items-center">
                    <h3 id="modal-title" className="text-lg sm:text-xl font-bold text-red-700 flex items-center gap-2 sm:gap-3">
                        <ShieldAlert size={24} className="min-w-[24px]" />
                        <span className="truncate">{title || 'Xác nhận xóa'}</span>
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-red-300 hover:text-red-500 hover:bg-red-100 p-2 md:min-w-[44px] md:min-h-[44px] md:flex md:items-center md:justify-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                        aria-label="Đóng"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 sm:p-8 overflow-y-auto flex-1 flex flex-col justify-center">
                    {phase === 'WARNING' ? (
                        <div className="space-y-6 sm:space-y-8">
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="p-4 bg-red-100 text-red-600 rounded-full">
                                    <AlertTriangle size={40} className="sm:w-10 sm:h-10 w-8 h-8" />
                                </div>
                                <p id="modal-description" className="text-slate-600 text-base sm:text-lg font-medium leading-relaxed">
                                    {warningMessage || 'Hành động này không thể hoàn tác. Bạn có chắc chắn muốn tiếp tục?'}
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
                                <button
                                    onClick={onClose}
                                    className="order-2 sm:order-1 flex-1 py-3 sm:py-3.5 text-base sm:text-lg text-slate-600 font-semibold hover:bg-slate-100 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    onClick={() => setPhase('PIN')}
                                    className="order-1 sm:order-2 flex-1 py-3 sm:py-3.5 text-base sm:text-lg bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-200 transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-red-500"
                                >
                                    Tiếp tục
                                </button>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handlePinSubmit} className="space-y-6 sm:space-y-8 animate-in slide-in-from-right duration-200">
                            <div className="text-center space-y-2 sm:space-y-3">
                                <p className="text-sm sm:text-base font-semibold text-slate-500 uppercase tracking-wide">Nhập mã PIN Admin</p>
                                <p className="text-xs sm:text-sm text-slate-400 px-4">Xác thực quyền quản trị để xóa dữ liệu này</p>
                            </div>

                            <div className="flex justify-center">
                                <input
                                    ref={pinInputRef}
                                    type="password"
                                    required
                                    maxLength={4}
                                    placeholder="••••"
                                    className="w-full max-w-[320px] sm:w-80 text-center text-4xl sm:text-5xl md:text-5xl font-bold tracking-[0.5em] text-slate-800 border-b-2 border-slate-200 focus:border-red-500 outline-none py-3 md:py-4 bg-transparent transition-colors placeholder:tracking-normal placeholder:text-3xl placeholder:text-slate-300"
                                    value={pin}
                                    onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                                />
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setPhase('WARNING')}
                                    className="order-2 sm:order-1 flex-1 py-3 sm:py-3.5 text-base sm:text-lg text-slate-600 font-semibold hover:bg-slate-100 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400"
                                >
                                    Quay lại
                                </button>
                                <button
                                    type="submit"
                                    disabled={isDeleting || pin.length < 4}
                                    className="order-1 sm:order-2 flex-1 py-3 sm:py-3.5 text-base sm:text-lg bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                                >
                                    {isDeleting ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Đang xóa...
                                        </>
                                    ) : 'Xác nhận xóa'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmationModal;

