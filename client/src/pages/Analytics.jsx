import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDebtReport } from '../services/api';
import AnalyticsDashboard from '../components/AnalyticsDashboard';

export default function Analytics() {
    const { data: report, isLoading } = useQuery({
        queryKey: ['debt-report'],
        queryFn: getDebtReport
    });

    if (isLoading) return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin text-blue-600 w-8 h-8 border-2 border-current border-t-transparent rounded-full"></div>
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
