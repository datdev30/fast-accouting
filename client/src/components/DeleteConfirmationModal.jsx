import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, ShieldAlert } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import AppModal from './AppModal';

/**
 * Xác nhận xoá hai bước: cảnh báo → nhập PIN quản trị.
 *
 * Tách hai bước là có chủ ý — xoá khách hàng kéo theo toàn bộ giao dịch,
 * nên một cú chạm nhầm không được phép đủ để xoá.
 */
/**
 * Phần thân chỉ được mount khi modal mở — nhờ vậy pin và phase tự trở về
 * mặc định mỗi lần mở, không cần effect reset (và không để lại mã PIN đã gõ
 * trong bộ nhớ sau khi đóng).
 */
const DeleteBody = ({ onClose, onConfirm, warningMessage, isDeleting }) => {
    const [pin, setPin] = useState('');
    const [phase, setPhase] = useState('WARNING'); // WARNING -> PIN
    const { showToast } = useToast();
    const pinInputRef = useRef(null);

    // Đưa con trỏ vào ô PIN khi sang bước 2. Chờ một nhịp để modal vẽ xong,
    // nếu không focus sẽ bị AppModal ghi đè lúc mở.
    useEffect(() => {
        if (phase !== 'PIN') return undefined;
        const id = setTimeout(() => pinInputRef.current?.focus(), 120);
        return () => clearTimeout(id);
    }, [phase]);

    const handlePinSubmit = (e) => {
        e.preventDefault();
        if (pin.length < 4) {
            showToast('Lỗi', 'Vui lòng nhập mã PIN hợp lệ', 'warning');
            return;
        }
        onConfirm(pin);
    };

    return (
        <>
            {phase === 'WARNING' ? (
                <div className="space-y-6 py-2">
                    <div className="flex flex-col items-center space-y-4 text-center">
                        <div className="rounded-full bg-red-100 p-4 text-red-600">
                            <AlertTriangle size={36} />
                        </div>
                        <p id="delete-modal-description" className="text-base font-medium leading-relaxed text-slate-600">
                            {warningMessage || 'Hành động này không thể hoàn tác. Bạn có chắc chắn muốn tiếp tục?'}
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                        <button type="button" onClick={onClose} className="btn-secondary btn-md order-2 flex-1 sm:order-1">
                            Hủy bỏ
                        </button>
                        <button type="button" onClick={() => setPhase('PIN')} className="btn-danger btn-md order-1 flex-1 sm:order-2">
                            Tiếp tục
                        </button>
                    </div>
                </div>
            ) : (
                <form onSubmit={handlePinSubmit} className="animate-in slide-in-from-right space-y-6 py-2 duration-200">
                    <div className="space-y-2 text-center">
                        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Nhập mã PIN Admin</p>
                        <p className="text-xs text-slate-400">Xác thực quyền quản trị để xóa dữ liệu này</p>
                    </div>

                    <div className="flex justify-center">
                        <input
                            ref={pinInputRef}
                            type="password"
                            required
                            inputMode="numeric"
                            maxLength={4}
                            placeholder="••••"
                            aria-label="Mã PIN quản trị"
                            className="w-full max-w-[320px] border-b-2 border-slate-200 bg-transparent py-3 text-center text-4xl font-bold tracking-[0.5em] text-slate-800 outline-none transition-colors placeholder:text-3xl placeholder:tracking-normal placeholder:text-slate-300 focus:border-red-500"
                            value={pin}
                            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                        />
                    </div>

                    <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                        <button type="button" onClick={() => setPhase('WARNING')} className="btn-secondary btn-md order-2 flex-1 sm:order-1">
                            Quay lại
                        </button>
                        <button
                            type="submit"
                            disabled={isDeleting || pin.length < 4}
                            className="btn-danger btn-md order-1 flex-1 sm:order-2"
                        >
                            {isDeleting ? (
                                <>
                                    <span className="spinner" />
                                    Đang xóa…
                                </>
                            ) : 'Xác nhận xóa'}
                        </button>
                    </div>
                </form>
            )}
        </>
    );
};

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, title, warningMessage, isDeleting }) => (
    <AppModal
        isOpen={isOpen}
        onClose={onClose}
        size="xl"
        /* Bật lên trên modal sửa/chi tiết đang mở */
        z={60}
        title={title || 'Xác nhận xóa'}
        icon={<ShieldAlert size={24} className="shrink-0 text-red-600" />}
        className="[&_.modal-header]:border-red-100 [&_.modal-header]:bg-red-50"
        describedById="delete-modal-description"
    >
        <DeleteBody
            onClose={onClose}
            onConfirm={onConfirm}
            warningMessage={warningMessage}
            isDeleting={isDeleting}
        />
    </AppModal>
);

export default DeleteConfirmationModal;
