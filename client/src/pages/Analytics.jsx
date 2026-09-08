import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDebtReport } from '../services/api';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { ErrorStates } from '../components/ErrorState';

export default function Analytics() {
    const { data: report, isLoading, error, refetch } = useQuery({
        queryKey: ['debt-report'],
        queryFn: getDebtReport,
        retry: 1
    });

    if (error) return (
        <div className="reports-page px-1 pb-8 sm:px-0">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                <ErrorStates.Network
                    error={error}
                    onRetry={refetch}
                    showDetails={true}
                />
            </div>
        </div>
    );

    if (isLoading) return (
        <div className="reports-page space-y-6 pb-8">
            <div className="h-32 animate-pulse rounded-2xl bg-slate-100/90" />
            <LoadingSkeleton.Stats count={3} />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <LoadingSkeleton.Card count={2} />
            </div>
        </div>
    );

    return (
        <div className="reports-page space-y-6 pb-10 animate-in fade-in duration-300 lg:space-y-8">
            <header className="reports-page__masthead">
                <div className="reports-page__masthead-accent" aria-hidden />
                <div className="relative z-[1] min-w-0 flex-1">
                    <p className="reports-page__kicker">Menu Báo cáo</p>
                    <h1 className="section-title">Phân tích &amp; báo cáo</h1>
                    <p className="section-subtitle mt-1 line-clamp-1 max-w-2xl sm:line-clamp-none">
                        Biểu đồ phân bổ nợ, top công nợ và mức độ hoạt động giao dịch — cùng nguồn dữ liệu với Tổng quan.
                    </p>
                </div>
            </header>

            <AnalyticsDashboard report={report} />
        </div>
    );
}
