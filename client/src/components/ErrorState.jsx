import React from 'react';
import { getApiErrorMessage } from '../utils/errorMessage';

/**
 * ErrorState Component
 * Displays error messages with recovery options
 * Follows UX Guideline #81: "Help users recover from errors"
 */

const ErrorState = ({
    icon: Icon,
    title = 'Đã xảy ra lỗi',
    description,
    error,
    onRetry,
    retryLabel = 'Thử lại',
    onHelp,
    helpLabel = 'Trợ giúp',
    showDetails = false,
}) => {
    const [showErrorDetails, setShowErrorDetails] = React.useState(false);

    return (
        <div className="error-state">
            {Icon ? (
                <div className="error-state-icon">
                    <Icon />
                </div>
            ) : (
                <div className="error-state-icon">
                    <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
            )}

            <h3 className="error-state-title">{title}</h3>

            {description && (
                <p className="error-state-description">{description}</p>
            )}

            {error && showDetails && (
                <div className="mb-6 max-w-md">
                    <button
                        onClick={() => setShowErrorDetails(!showErrorDetails)}
                        className="text-sm text-slate-500 hover:text-slate-700 underline mb-2"
                    >
                        {showErrorDetails ? 'Ẩn chi tiết' : 'Xem chi tiết lỗi'}
                    </button>

                    {showErrorDetails && (
                        <div className="alert alert-error text-left">
                            <div className="flex-1">
                                <p className="text-xs font-mono break-all">
                                    {error.message || error.toString()}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="flex items-center gap-3">
                {onRetry && (
                    <button
                        onClick={onRetry}
                        className="btn-primary btn-md"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        {retryLabel}
                    </button>
                )}

                {onHelp && (
                    <button
                        onClick={onHelp}
                        className="btn-secondary btn-md"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {helpLabel}
                    </button>
                )}
            </div>
        </div>
    );
};

// Common error icons
export const ErrorIcons = {
    Network: () => (
        <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
        </svg>
    ),
    Server: () => (
        <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
        </svg>
    ),
    NotFound: () => (
        <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    Permission: () => (
        <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
    ),
};

// Preset error states for common scenarios
export const ErrorStates = {
    Network: ({ error, description, ...rest }) => (
        <ErrorState
            icon={ErrorIcons.Network}
            title="Lỗi kết nối"
            description={
                description ||
                (error
                    ? getApiErrorMessage(error, 'Kết nối tới máy chủ')
                    : 'Không thể kết nối đến máy chủ. Kiểm tra mạng, địa chỉ API (VITE_API_URL) và xem máy chủ có đang chạy.')
            }
            error={error}
            {...rest}
        />
    ),
    Server: ({ error, description, ...rest }) => (
        <ErrorState
            icon={ErrorIcons.Server}
            title="Lỗi máy chủ"
            description={
                description ||
                (error
                    ? getApiErrorMessage(error, 'Máy chủ xử lý yêu cầu')
                    : 'Máy chủ trả lỗi (thường HTTP 5xx). Thử lại sau; nếu vẫn lỗi, gửi quản trị kèm thời điểm và thao tác.')
            }
            error={error}
            {...rest}
        />
    ),
    NotFound: (props) => (
        <ErrorState
            icon={ErrorIcons.NotFound}
            title="Không tìm thấy"
            description="Dữ liệu bạn đang tìm kiếm không tồn tại hoặc đã bị xóa."
            {...props}
        />
    ),
    Permission: (props) => (
        <ErrorState
            icon={ErrorIcons.Permission}
            title="Không có quyền truy cập"
            description="Bạn không có quyền thực hiện thao tác này. Vui lòng liên hệ quản trị viên."
            {...props}
        />
    ),
    Generic: ({ error, description, ...rest }) => (
        <ErrorState
            title="Đã xảy ra lỗi"
            description={
                description ||
                (error
                    ? getApiErrorMessage(error, 'Tải hoặc xử lý dữ liệu')
                    : 'Có lỗi không xác định. Thử lại; nếu lặp lại, mở “Xem chi tiết lỗi” (nếu có) hoặc báo quản trị.')
            }
            error={error}
            {...rest}
        />
    ),
};

export default ErrorState;
