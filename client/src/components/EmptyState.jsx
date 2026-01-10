import React from 'react';

/**
 * EmptyState Component
 * Displays when no content is available with helpful guidance
 * Follows UX Guideline #80: "Guide users when no content exists"
 */

const EmptyState = ({
    icon: Icon,
    title,
    description,
    action,
    actionLabel,
    secondaryAction,
    secondaryActionLabel,
}) => {
    return (
        <div className="empty-state">
            {Icon && (
                <div className="empty-state-icon">
                    <Icon />
                </div>
            )}

            <h3 className="empty-state-title">{title}</h3>

            {description && (
                <p className="empty-state-description">{description}</p>
            )}

            {(action || secondaryAction) && (
                <div className="flex items-center gap-3">
                    {action && (
                        <button
                            onClick={action}
                            className="btn btn-primary btn-md"
                        >
                            {actionLabel || 'Bắt đầu'}
                        </button>
                    )}

                    {secondaryAction && (
                        <button
                            onClick={secondaryAction}
                            className="btn btn-secondary btn-md"
                        >
                            {secondaryActionLabel || 'Tìm hiểu thêm'}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

// Common empty state icons
export const EmptyIcons = {
    NoData: () => (
        <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
    ),
    NoCustomers: () => (
        <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
    ),
    NoTransactions: () => (
        <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
    ),
    NoResults: () => (
        <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
    ),
    NoReports: () => (
        <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
    ),
};

// Preset empty states for common scenarios
export const EmptyStates = {
    NoCustomers: (props) => (
        <EmptyState
            icon={EmptyIcons.NoCustomers}
            title="Chưa có khách hàng"
            description="Bắt đầu bằng cách thêm khách hàng đầu tiên của bạn. Bạn có thể quản lý thông tin và theo dõi công nợ của họ."
            actionLabel="Thêm khách hàng"
            {...props}
        />
    ),
    NoTransactions: (props) => (
        <EmptyState
            icon={EmptyIcons.NoTransactions}
            title="Chưa có giao dịch"
            description="Tạo giao dịch đầu tiên để bắt đầu theo dõi công nợ và quản lý tài chính."
            actionLabel="Tạo giao dịch"
            {...props}
        />
    ),
    NoResults: (props) => (
        <EmptyState
            icon={EmptyIcons.NoResults}
            title="Không tìm thấy kết quả"
            description="Thử điều chỉnh bộ lọc hoặc tìm kiếm với từ khóa khác."
            actionLabel="Xóa bộ lọc"
            {...props}
        />
    ),
    NoReports: (props) => (
        <EmptyState
            icon={EmptyIcons.NoReports}
            title="Chưa có báo cáo"
            description="Báo cáo sẽ được tạo tự động khi bạn có giao dịch và khách hàng."
            {...props}
        />
    ),
    NoData: (props) => (
        <EmptyState
            icon={EmptyIcons.NoData}
            title="Không có dữ liệu"
            description="Chưa có dữ liệu để hiển thị."
            {...props}
        />
    ),
};

export default EmptyState;
