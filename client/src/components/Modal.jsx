import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { trapFocus, handleEscapeKey, preventBodyScroll } from '../utils/a11y';

/**
 * Modal Component
 * Accessible modal dialog with focus trap and ESC handling
 * Follows UX Guidelines #28, #41, #42: Modal accessibility
 */

const Modal = ({
    isOpen,
    onClose,
    title,
    children,
    footer,
    size = 'md', // 'sm', 'md', 'lg', 'xl', 'full'
    showCloseButton = true,
    closeOnBackdrop = true,
    closeOnEscape = true,
    className = '',
}) => {
    const modalRef = useRef(null);
    const previousFocusRef = useRef(null);

    // Store previous focus element
    useEffect(() => {
        if (isOpen) {
            previousFocusRef.current = document.activeElement;
        }
    }, [isOpen]);

    // Focus trap
    useEffect(() => {
        if (!isOpen || !modalRef.current) return;

        const cleanup = trapFocus(modalRef.current);
        return cleanup;
    }, [isOpen]);

    // ESC key handler
    useEffect(() => {
        if (!isOpen || !closeOnEscape) return;

        const cleanup = handleEscapeKey(() => {
            onClose();
        });

        return cleanup;
    }, [isOpen, closeOnEscape, onClose]);

    // Prevent body scroll
    useEffect(() => {
        if (!isOpen) return;

        const cleanup = preventBodyScroll();
        return cleanup;
    }, [isOpen]);

    // Restore focus when closed
    useEffect(() => {
        if (!isOpen && previousFocusRef.current) {
            previousFocusRef.current.focus();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const sizeClasses = {
        sm: 'max-w-md',
        md: 'max-w-2xl',
        lg: 'max-w-4xl',
        xl: 'max-w-6xl',
        full: 'max-w-full mx-4',
    };

    const handleBackdropClick = (e) => {
        if (closeOnBackdrop && e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div
            className="modal-overlay animate-fade-in"
            onClick={handleBackdropClick}
            role="presentation"
        >
            <div
                ref={modalRef}
                className={`modal-content ${sizeClasses[size]} ${className} animate-slide-up`}
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? 'modal-title' : undefined}
            >
                {/* Header */}
                {(title || showCloseButton) && (
                    <div className="modal-header">
                        {title && (
                            <div>
                                <h2 id="modal-title" className="text-lg font-bold text-slate-900">
                                    {title}
                                </h2>
                            </div>
                        )}
                        {showCloseButton && (
                            <button
                                onClick={onClose}
                                className="icon-btn focus-visible-ring"
                                aria-label="Đóng"
                                type="button"
                            >
                                <X size={18} />
                            </button>
                        )}
                    </div>
                )}

                {/* Body */}
                <div className="modal-body" style={{ padding: '3rem' }}>
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="modal-footer">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

// Modal variants for common use cases
export const ConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    title = 'Xác nhận',
    message,
    confirmLabel = 'Xác nhận',
    cancelLabel = 'Hủy',
    variant = 'primary', // 'primary', 'danger', 'warning'
    isLoading = false,
}) => {
    const variantClasses = {
        primary: 'btn-primary',
        danger: 'btn-danger',
        warning: 'bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-200',
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            size="sm"
            footer={
                <>
                    <button
                        onClick={onClose}
                        className="btn btn-secondary btn-md"
                        disabled={isLoading}
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`btn btn-md ${variantClasses[variant]}`}
                        disabled={isLoading}
                    >
                        {isLoading && <div className="spinner"></div>}
                        {confirmLabel}
                    </button>
                </>
            }
        >
            <p className="text-slate-600">{message}</p>
        </Modal>
    );
};

export default Modal;
