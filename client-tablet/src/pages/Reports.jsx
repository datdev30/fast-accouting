import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDebtReport } from '../services/api';
import { Download, TrendingUp, Wallet, PieChart, Search, ArrowUpDown, ArrowUp, ArrowDown, ArrowUpRight, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { EmptyStates } from '../components/EmptyState';
import { ErrorStates } from '../components/ErrorState';

export default function Reports() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    const { data: report, isLoading, error: reportError, refetch } = useQuery({
        queryKey: ['debt-report'],
        queryFn: getDebtReport,
        retry: 1
    });

    const processedData = useMemo(() => {
        if (!report) return [];

        let data = [...report];

        // 1. Filter
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            data = data.filter(item =>
                item.customer_name.toLowerCase().includes(lowerTerm)
            );
        }

        // 2. Sort
        if (sortConfig.key) {
            data.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];

                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return data;
    }, [report, searchTerm, sortConfig]);

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return <ArrowUpDown size={14} className="opacity-30" />;
        return sortConfig.direction === 'asc'
            ? <ArrowUp size={14} className="text-teal-600" />
            : <ArrowDown size={14} className="text-teal-600" />;
    };

    if (reportError) return (
        <div className="p-8">
            <ErrorStates.Network
                error={reportError}
                onRetry={refetch}
                showDetails={true}
            />
        </div>
    );

    if (isLoading) return (
        <div className="space-y-8">
            <LoadingSkeleton.Stats count={4} />
            <LoadingSkeleton.Table rows={8} columns={7} />
        </div>
    );

    const totalPrincipal = report?.reduce((sum, item) => sum + item.total_principal, 0) || 0;
    const totalInterest = report?.reduce((sum, item) => sum + item.total_interest, 0) || 0;
    const totalDebt = report?.reduce((sum, item) => sum + item.total_debt, 0) || 0;
    const totalCollected = report?.reduce((sum, item) => sum + (item.total_collected || 0), 0) || 0;

    return (
        <div className="space-y-8">
            {/* Header Section - Responsive */}
            <div className="space-y-0">
                <div>
                    <h1 className="section-title text-2xl">Tổng Quan Tài Chính</h1>
                    <p className="section-subtitle mt-1">Báo cáo tổng hợp tình hình công nợ khách hàng</p>
                </div>
            </div>


            {/* Summary Cards - Responsive: 4 cols (tablet-lg+), 2 cols (tablet), 1 col (mobile); nội dung gọn nhỏ */}
            <div className="grid grid-cols-1 tablet:grid-cols-2 tablet-lg:grid-cols-4 gap-4">
                <div className="group relative overflow-hidden bg-white p-5 tablet-lg:p-4 tablet:p-4 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-all">
                    <div className="absolute top-0 right-0 w-24 h-24 tablet-lg:w-20 tablet-lg:h-20 bg-gradient-to-br from-teal-500/[0.06] to-transparent rounded-bl-[100px]" aria-hidden />
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-1.5 tablet-lg:gap-1.5 tablet-lg:mb-1">
                            <div className="p-1.5 tablet-lg:p-1 bg-teal-50 text-teal-700 rounded-lg">
                                <Wallet size={18} className="tablet-lg:w-4 tablet-lg:h-4 tablet:w-3.5 tablet:h-3.5" />
                            </div>
                            <span className="font-medium text-slate-500 text-xs tablet-lg:text-xs tablet:text-xs">Tổng tiền gốc</span>
                        </div>
                        <div className="flex items-baseline gap-1.5">
                            <h3 className="text-2xl tablet-lg:text-xl tablet:text-xl font-bold text-slate-900">{totalPrincipal.toLocaleString('vi-VN')}</h3>
                            <span className="text-slate-400 font-medium text-sm tablet-lg:text-xs">đ</span>
                        </div>
                    </div>
                </div>

                <div className="group relative overflow-hidden bg-gradient-to-br from-teal-600 to-teal-700 p-5 tablet-lg:p-4 tablet:p-4 rounded-xl shadow-lg shadow-teal-200 text-white transition-colors duration-200">
                    <div className="absolute top-0 right-0 w-28 h-28 tablet-lg:w-24 tablet-lg:h-24 bg-gradient-to-br from-white/[0.08] to-transparent rounded-bl-[120px]" aria-hidden />
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-1.5 tablet-lg:gap-1.5 tablet-lg:mb-1">
                            <div className="p-1.5 tablet-lg:p-1 bg-white/20 backdrop-blur-sm rounded-lg">
                                <TrendingUp size={18} className="tablet-lg:w-4 tablet-lg:h-4 tablet:w-3.5 tablet:h-3.5" />
                            </div>
                            <span className="font-medium text-blue-100 text-xs tablet-lg:text-xs tablet:text-xs">Lãi suất dự kiến</span>
                        </div>
                        <div className="flex items-baseline gap-1.5">
                            <h3 className="text-2xl tablet-lg:text-xl tablet:text-xl font-bold text-white">+{totalInterest.toLocaleString('vi-VN')}</h3>
                            <span className="text-blue-200 font-medium text-sm tablet-lg:text-xs">đ</span>
                        </div>
                        <div className="mt-2 tablet-lg:mt-1.5 flex items-center gap-1 text-xs tablet-lg:text-[11px] text-blue-100 bg-white/10 w-fit px-1.5 py-0.5 rounded-full backdrop-blur-sm">
                            <ArrowUpRight size={12} className="tablet-lg:w-3 tablet-lg:h-3" />
                            <span>Đang tăng trưởng</span>
                        </div>
                    </div>
                </div>

                <div className="group relative overflow-hidden bg-white p-5 tablet-lg:p-4 tablet:p-4 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-all">
                    <div className="absolute top-0 right-0 w-24 h-24 tablet-lg:w-20 tablet-lg:h-20 bg-gradient-to-br from-red-500/[0.06] to-transparent rounded-bl-[100px]" aria-hidden />
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-1.5 tablet-lg:gap-1.5 tablet-lg:mb-1">
                            <div className="p-1.5 tablet-lg:p-1 bg-red-50 text-red-600 rounded-lg">
                                <PieChart size={18} className="tablet-lg:w-4 tablet-lg:h-4 tablet:w-3.5 tablet:h-3.5" />
                            </div>
                            <span className="font-medium text-slate-500 text-xs tablet-lg:text-xs tablet:text-xs">Tổng nợ phải thu</span>
                        </div>
                        <div className="flex items-baseline gap-1.5">
                            <h3 className="text-2xl tablet-lg:text-xl tablet:text-xl font-bold text-slate-900">{totalDebt.toLocaleString('vi-VN')}</h3>
                            <span className="text-slate-400 font-medium text-sm tablet-lg:text-xs">đ</span>
                        </div>
                        <div className="mt-2 tablet-lg:mt-1.5 flex items-center gap-1 text-xs tablet-lg:text-[11px] text-slate-400">
                            Hiện tại có <span className="font-bold text-slate-700">{report?.filter(i => i.total_debt > 0).length || 0}</span> khách hàng đang nợ
                        </div>
                    </div>
                </div>

                {/* Thực tế đã thu */}
                <div className="group relative overflow-hidden bg-white p-5 tablet-lg:p-4 tablet:p-4 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-all">
                    <div className="absolute top-0 right-0 w-24 h-24 tablet-lg:w-20 tablet-lg:h-20 bg-gradient-to-br from-emerald-500/[0.06] to-transparent rounded-bl-[100px]" aria-hidden />
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-1.5 tablet-lg:gap-1.5 tablet-lg:mb-1">
                            <div className="p-1.5 tablet-lg:p-1 bg-emerald-50 text-emerald-600 rounded-lg">
                                <Download size={18} className="tablet-lg:w-4 tablet-lg:h-4 tablet:w-3.5 tablet:h-3.5" />
                            </div>
                            <span className="font-medium text-slate-500 text-xs tablet-lg:text-xs tablet:text-xs">Thực tế đã thu</span>
                        </div>
                        <div className="flex items-baseline gap-1.5">
                            <h3 className="text-2xl tablet-lg:text-xl tablet:text-xl font-bold text-slate-900">{totalCollected.toLocaleString('vi-VN')}</h3>
                            <span className="text-slate-400 font-medium text-sm tablet-lg:text-xs">đ</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Detailed List */}
            <div className="card overflow-hidden">
                {/* Header Section */}
                <div className="card-header">
                    <div className="flex items-center justify-between gap-4 flex-nowrap">
                        <h3 className="section-kicker text-xs whitespace-nowrap">
                            <div className="w-1 h-3 bg-teal-600 rounded-full"></div>
                            DANH SÁCH KHÁCH HÀNG
                        </h3>

                        <div className="relative w-64 tablet-lg:w-64 desktop:w-72">
                            <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none text-slate-400">
                                <Search size={14} />
                            </div>
                            <input
                                type="text"
                                placeholder="Tìm kiếm..."
                                className="input pl-7 text-xs h-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>


                {/* Portrait: Card list (mỗi KH 1 thẻ, hybrid nội dung) */}
                <div className="tablet-lg:hidden p-4 space-y-3">
                    {processedData.length === 0 ? (
                        <div className="py-8">
                            {searchTerm ? (
                                <EmptyStates.NoResults
                                    action={() => setSearchTerm('')}
                                    actionLabel="Xóa tìm kiếm"
                                />
                            ) : (
                                <EmptyStates.NoReports />
                            )}
                        </div>
                    ) : (
                        processedData.map((item) => (
                            <button
                                key={item.customer_id}
                                type="button"
                                onClick={() => navigate(`/customers/${item.customer_id}/debt`)}
                                className={`relative w-full text-left rounded-xl border p-4 hover:shadow-sm active:scale-[0.99] transition-all ${
                                    item.total_debt <= 0
                                        ? 'bg-emerald-50 border-emerald-100 hover:border-emerald-200'
                                        : 'bg-white border-slate-100 hover:border-teal-200'
                                }`}
                            >
                                {/* Tên KH + X GD */}
                                <div className="flex items-center justify-between gap-2 mb-4">
                                    <span className="text-base tablet-lg:text-sm font-semibold text-slate-800 truncate min-w-0 leading-tight">{item.customer_name}</span>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className="text-sm font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded-md">{item.transaction_count} GD</span>
                                        <ChevronRight size={18} className="text-slate-300" />
                                    </div>
                                </div>
                                {/* 2 cột: (Gốc+Lãi) | (Đã thu+Còn nợ) */}
                                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                                    <div className="space-y-2.5">
                                        <div>
                                            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Tổng gốc vay</p>
                                            <p className="font-mono text-lg text-slate-700 leading-tight">{item.total_principal.toLocaleString('vi-VN')} đ</p>
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Tổng lãi</p>
                                            <p className="font-mono text-lg text-blue-600 leading-tight">+{item.total_interest.toLocaleString('vi-VN')} đ</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2.5">
                                        <div>
                                            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Đã thanh toán</p>
                                            <p className="font-mono text-lg text-green-700 leading-tight">{(item.total_collected || 0).toLocaleString('vi-VN')} đ</p>
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Còn nợ</p>
                                            <p className="font-mono text-xl text-red-600 leading-tight">{item.total_debt.toLocaleString('vi-VN')} đ</p>
                                        </div>
                                    </div>
                                </div>
                                {/* Con dấu "ĐÃ TẤT TOÁN" đóng chồng lên thẻ — đặt cuối để nổi trên cùng (chỉ portrait) */}
                                {item.total_debt <= 0 && (
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-end z-20 pointer-events-none select-none" aria-hidden>
                                        <svg
                                            viewBox="0 0 520 230"
                                            className="w-[70%] max-w-[200px] h-auto"
                                            role="img"
                                            aria-label="Đã tất toán"
                                        >
                                            <defs>
                                                <filter id={`stamp-shadow-${item.customer_id}`} x="-20%" y="-20%" width="140%" height="140%">
                                                    <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#000" floodOpacity="0.12" />
                                                </filter>
                                            </defs>
                                            <g transform="translate(260 115) rotate(15)" filter={`url(#stamp-shadow-${item.customer_id})`} opacity="0.92">
                                                <rect x="-240" y="-97.5" width="480" height="195" rx="25" fill="none" stroke="#0b8f1a" strokeWidth="18" />
                                                <rect x="-225" y="-85" width="450" height="170" rx="21" fill="none" stroke="#0b8f1a" strokeWidth="6" opacity="0.95" />
                                                <text
                                                    x="0" y="42"
                                                    textAnchor="middle"
                                                    fontFamily="system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif"
                                                    fontSize="54"
                                                    fontWeight="900"
                                                    letterSpacing="4"
                                                    fill="#0b8f1a"
                                                >
                                                    ĐÃ TẤT TOÁN
                                                </text>
                                            </g>
                                        </svg>
                                    </div>
                                )}
                            </button>
                        ))
                    )}
                </div>

                {/* Landscape: Table */}
                <div className="hidden tablet-lg:block overflow-x-auto">
                    <table className="table min-w-[1000px]">
                        <thead className="table-head">
                            <tr>
                                <th
                                    className="table-th cursor-pointer hover:bg-slate-50 transition-colors group min-h-[44px] py-4 tablet-lg:py-2.5 tablet-lg:text-xs"
                                    onClick={() => handleSort('customer_name')}
                                >
                                    <div className="flex items-center gap-2">
                                        Khách hàng
                                        {getSortIcon('customer_name')}
                                    </div>
                                </th>
                                <th
                                    className="table-th text-center cursor-pointer hover:bg-slate-50 transition-colors min-h-[44px] py-4 tablet-lg:py-2.5 tablet-lg:text-xs tablet-lg:hidden"
                                    onClick={() => handleSort('transaction_count')}
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        Giao dịch
                                        {getSortIcon('transaction_count')}
                                    </div>
                                </th>
                                <th
                                    className="table-th text-center cursor-pointer hover:bg-slate-50 transition-colors min-h-[44px] py-4 tablet-lg:py-2.5 tablet-lg:text-xs"
                                    onClick={() => handleSort('total_principal')}
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        Tổng gốc vay
                                        {getSortIcon('total_principal')}
                                    </div>
                                </th>
                                <th
                                    className="table-th text-center cursor-pointer hover:bg-slate-50 transition-colors min-h-[44px] py-4 tablet-lg:py-2.5 tablet-lg:text-xs"
                                    onClick={() => handleSort('total_interest')}
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        Tổng lãi
                                        {getSortIcon('total_interest')}
                                    </div>
                                </th>
                                <th
                                    className="table-th text-center cursor-pointer hover:bg-slate-50 transition-colors min-h-[44px] py-4 tablet-lg:py-2.5 tablet-lg:text-xs"
                                    onClick={() => handleSort('total_collected')}
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        Đã thanh toán
                                        {getSortIcon('total_collected')}
                                    </div>
                                </th>
                                <th
                                    className="table-th text-center cursor-pointer hover:bg-slate-50 transition-colors min-h-[44px] py-4 tablet-lg:py-2.5 tablet-lg:text-xs"
                                    onClick={() => handleSort('total_debt')}
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        Còn nợ
                                        {getSortIcon('total_debt')}
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-sm">
                            {processedData.map((item) => (
                                <tr
                                    key={item.customer_id}
                                    className={`table-row group cursor-pointer ${item.total_debt <= 0 ? 'bg-emerald-50/70' : ''}`}
                                    onClick={() => navigate(`/customers/${item.customer_id}/debt`)}
                                >
                                    <td className="table-td font-medium text-base tablet-lg:text-sm text-slate-800 group-hover:text-teal-600 transition-colors">
                                        <div className="flex flex-col">
                                            <span className="leading-tight">{item.customer_name}</span>
                                            <span className="text-xs font-medium text-slate-500 hidden tablet-lg:block mt-0.5">{item.transaction_count} GD</span>
                                        </div>
                                    </td>
                                    <td className="table-td text-center tablet-lg:hidden">
                                        <span className="badge-neutral text-sm font-semibold">
                                            {item.transaction_count} GD
                                        </span>
                                    </td>
                                    <td className="table-td text-center font-mono text-base text-slate-700">
                                        {item.total_principal.toLocaleString('vi-VN')}
                                    </td>
                                    <td className="table-td text-center font-mono text-base text-blue-600">
                                        +{item.total_interest.toLocaleString('vi-VN')}
                                    </td>
                                    <td className="table-td text-center font-mono text-base text-green-700">
                                        {item.total_collected?.toLocaleString('vi-VN') || 0}
                                    </td>
                                    <td className="table-td text-center font-mono text-lg text-red-600">
                                        {item.total_debt.toLocaleString('vi-VN')}
                                    </td>
                                </tr>
                            ))}
                            {processedData.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="table-td py-8">
                                        {searchTerm ? (
                                            <EmptyStates.NoResults
                                                action={() => setSearchTerm('')}
                                                actionLabel="Xóa tìm kiếm"
                                            />
                                        ) : (
                                            <EmptyStates.NoReports />
                                        )}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

            </div>
        </div>
    );
}
