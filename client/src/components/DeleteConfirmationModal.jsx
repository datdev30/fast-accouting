import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, ShieldAlert } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, title, warningMessage, isDeleting }) => {
    const [pin, setPin] = useState('');
    const [phase, setPhase] = useState('WARNING'); // WARNING -> PIN
    const { showToast } = useToast();

    // Reset state when opened
    useEffect(() => {
        if (isOpen) {
            setPin('');
            setPhase('WARNING');
        }
    }, [isOpen]);

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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl relative overflow-hidden">

                {/* Header */}
                <div className="bg-red-50 px-8 py-5 border-b border-red-100 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-red-700 flex items-center gap-3">
                        <ShieldAlert size={24} />
                        {title || 'Xác nhận xóa'}
                    </h3>
                    <button onClick={onClose} className="text-red-300 hover:text-red-500 hover:bg-red-100 p-1.5 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-8">
                    {phase === 'WARNING' ? (
                        <div className="space-y-8">
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="p-4 bg-red-100 text-red-600 rounded-full">
                                    <AlertTriangle size={40} />
                                </div>
                                <p className="text-slate-600 text-lg font-medium leading-relaxed">
                                    {warningMessage || 'Hành động này không thể hoàn tác. Bạn có chắc chắn muốn tiếp tục?'}
                                </p>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    onClick={onClose}
                                    className="flex-1 py-3.5 text-lg text-slate-600 font-semibold hover:bg-slate-100 rounded-xl transition-colors"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    onClick={() => setPhase('PIN')}
                                    className="flex-1 py-3.5 text-lg bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-200 transition-all active:scale-95"
                                >
                                    Tiếp tục
                                </button>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handlePinSubmit} className="space-y-8 animate-in slide-in-from-right duration-200">
                            <div className="text-center space-y-3">
                                <p className="text-base font-semibold text-slate-500 uppercase tracking-wide">Nhập mã PIN Admin</p>
                                <p className="text-sm text-slate-400">Xác thực quyền quản trị để xóa dữ liệu này</p>
                            </div>

                            <div className="flex justify-center">
                                <input
                                    autoFocus
                                    type="password"
                                    required
                                    maxLength={4}
                                    placeholder="••••"
                                    className="w-80 text-center text-5xl font-bold tracking-[0.5em] text-slate-800 border-b-2 border-slate-200 focus:border-red-500 outline-none py-3 bg-transparent transition-colors placeholder:tracking-normal placeholder:text-4xl placeholder:text-slate-300"
                                    value={pin}
                                    onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                                />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button" // Fix: type button so it doesn't submit
                                    onClick={() => setPhase('WARNING')}
                                    className="flex-1 py-3.5 text-lg text-slate-600 font-semibold hover:bg-slate-100 rounded-xl transition-colors"
                                >
                                    Quay lại
                                </button>
                                <button
                                    type="submit"
                                    disabled={isDeleting || pin.length < 4}
                                    className="flex-1 py-3.5 text-lg bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
