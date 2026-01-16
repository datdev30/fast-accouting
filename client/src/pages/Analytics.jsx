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
        <div className="space-y-4 md:space-y-6 xl:space-y-8">
            {/* Header Section - Portrait: Stack layout, Landscape: All in 1 Row */}
            <div className="space-y-4 md:space-y-5 xl:space-y-0">
                {/* Portrait: Stack layout */}
                <div className="xl:hidden space-y-4 md:space-y-5">
                    {/* Row 1: Title & Subtitle */}
                    <div>
                        <h2 className="section-title text-2xl md:text-3xl">Phân Tích & Báo Cáo</h2>
                        <p className="section-subtitle text-sm md:text-base mt-1">Biểu đồ và phân tích dữ liệu tài chính</p>
                    </div>
                </div>

                {/* Landscape: All in 1 Row */}
                <div className="hidden xl:flex xl:items-center xl:justify-between xl:gap-6">
                    {/* Left: Title & Subtitle */}
                    <div>
                        <h2 className="section-title text-2xl 2xl:text-3xl">Phân Tích & Báo Cáo</h2>
                        <p className="section-subtitle text-sm 2xl:text-base mt-1">Biểu đồ và phân tích dữ liệu tài chính</p>
                    </div>
                </div>
            </div>

            <AnalyticsDashboard report={report} />
        </div>
    );
}
