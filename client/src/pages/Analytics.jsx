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
        <div className="p-8">
            <ErrorStates.Network
                error={error}
                onRetry={refetch}
                showDetails={true}
            />
        </div>
    );

    if (isLoading) return (
        <div className="space-y-6">
            <LoadingSkeleton.Stats count={4} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <LoadingSkeleton.Card count={2} />
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Phân Tích & Báo Cáo</h2>
                <p className="text-slate-500 mt-1">Biểu đồ và phân tích dữ liệu tài chính</p>
            </div>

            <AnalyticsDashboard report={report} />
        </div>
    );
}
