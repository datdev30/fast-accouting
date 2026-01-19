import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDebtReport, getMonthlyTransactionCount } from '../services/api';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { ErrorStates } from '../components/ErrorState';

const initChartYear = Math.max(2025, new Date().getFullYear());

export default function Analytics() {
    const [chartYear, setChartYear] = useState(initChartYear);

    const { data: report, isLoading, error, refetch } = useQuery({
        queryKey: ['debt-report'],
        queryFn: getDebtReport,
        retry: 1
    });

    const { data: monthlyData, isLoading: monthlyLoading } = useQuery({
        queryKey: ['monthly-transaction-count', chartYear],
        queryFn: () => getMonthlyTransactionCount(chartYear),
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
            <LoadingSkeleton.Stats count={5} />
            <div className="grid grid-cols-2 gap-6">
                <LoadingSkeleton.Card count={2} />
            </div>
        </div>
    );

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="space-y-0">
                <div className="flex items-center justify-between gap-6">
                    {/* Left: Title & Subtitle */}
                    <div>
                        <h2 className="section-title text-2xl">Phân Tích & Báo Cáo</h2>
                        <p className="section-subtitle text-base mt-1">Biểu đồ và phân tích dữ liệu tài chính</p>
                    </div>
                </div>
            </div>

            <AnalyticsDashboard
                report={report}
                chartYear={chartYear}
                onChartYearChange={setChartYear}
                monthlyData={monthlyData}
                monthlyLoading={monthlyLoading}
            />
        </div>
    );
}
