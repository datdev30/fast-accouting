import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDebtReport } from '../services/api';
import { Download, TrendingUp, Wallet, ArrowUpRight, ArrowDownRight, PieChart, Search, ArrowUpDown, ArrowUp, ArrowDown, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { EmptyStates } from '../components/EmptyState';
import { ErrorStates } from '../components/ErrorState';

export default function Reports() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { triggerBatchExport, isBackingUp } = useAuth(); // Global state
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
            ? <ArrowUp size={14} className="text-blue-600" />
            : <ArrowDown size={14} className="text-blue-600" />;
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="section-title">Tổng Quan Tài Chính</h1>
                    <p className="section-subtitle mt-1">Báo cáo tổng hợp tình hình công nợ khách hàng</p>
                </div>

                <button
                    onClick={async () => {
                        let selectedPath = null;
                        if (window.pywebview && window.pywebview.api && window.pywebview.api.select_folder) {
                            try {
                                selectedPath = await window.pywebview.api.select_folder();
                                if (!selectedPath) return;
                            } catch (err) {
                                console.error("Error selecting folder:", err);
                            }
                        }
                        await triggerBatchExport(selectedPath);
                    }}
                    disabled={isBackingUp}
                    className="btn-primary btn-lg w-full sm:w-auto disabled:cursor-wait"
                >
                    <Download size={18} className={isBackingUp ? "animate-bounce" : ""} />
                    <span>{isBackingUp ? 'Đang Xử Lý...' : 'Xuất Phiếu PDF'}</span>
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="group relative overflow-hidden bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110">
                        <Wallet size={120} className="text-blue-600" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                <Wallet size={20} />
                            </div>
                            <span className="font-medium text-slate-500">Tổng tiền gốc</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <h3 className="text-3xl font-bold text-slate-900">{totalPrincipal.toLocaleString('vi-VN')}</h3>
                            <span className="text-slate-400 font-medium">đ</span>
                        </div>
                    </div>
                </div>

                <div className="group relative overflow-hidden bg-gradient-to-br from-indigo-500 to-blue-600 p-6 rounded-2xl shadow-lg shadow-blue-200 text-white hover:-translate-y-1 transition-transform">
                    <div className="absolute top-0 right-0 p-4 opacity-10 transform scale-150">
                        <TrendingUp size={120} />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                                <TrendingUp size={20} />
                            </div>
                            <span className="font-medium text-blue-100">Lãi suất dự kiến</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <h3 className="text-3xl font-bold text-white">+{totalInterest.toLocaleString('vi-VN')}</h3>
                            <span className="text-blue-200 font-medium">đ</span>
                        </div>
                        <div className="mt-4 flex items-center gap-1 text-sm text-blue-100 bg-white/10 w-fit px-2 py-1 rounded-full backdrop-blur-sm">
                            <ArrowUpRight size={14} />
                            <span>Đang tăng trưởng</span>
                        </div>
                    </div>
                </div>

                <div className="group relative overflow-hidden bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110">
                        <PieChart size={120} className="text-red-500" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                                <PieChart size={20} />
                            </div>
                            <span className="font-medium text-slate-500">Tổng nợ phải thu</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <h3 className="text-3xl font-bold text-slate-900">{totalDebt.toLocaleString('vi-VN')}</h3>
                            <span className="text-slate-400 font-medium">đ</span>
                        </div>
                        <div className="mt-4 flex items-center gap-1 text-sm text-slate-400">
                            Hiện tại có <span className="font-bold text-slate-700">{report?.filter(i => i.total_debt > 0).length || 0}</span> khách hàng đang nợ
                        </div>
                    </div>
                </div>

                {/* Thực tế đã thu */}
                <div className="group relative overflow-hidden bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110">
                        <Download size={120} className="text-emerald-500" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                                <Download size={20} />
                            </div>
                            <span className="font-medium text-slate-500">Thực tế đã thu</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <h3 className="text-3xl font-bold text-slate-900">{totalCollected.toLocaleString('vi-VN')}</h3>
                            <span className="text-slate-400 font-medium">đ</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Detailed Table */}
            <div className="card overflow-hidden">
                <div className="card-header flex flex-col sm:flex-row justify-between items-center gap-4">
                    <h3 className="section-kicker">
                        <div className="w-1 h-4 bg-blue-600 rounded-full"></div>
                        Chi Tiết Theo Khách Hàng
                    </h3>

                    {/* Search Bar */}
                    <div className="relative w-full sm:w-64">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                            <Search size={16} />
                        </div>
                        <input
                            type="text"
                            placeholder="Tìm kiếm khách hàng..."
                            className="input pl-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="overflow-x-auto hidden md:block">
                    <table className="table min-w-[1000px]">
                        <thead className="table-head">
                            <tr>
                                <th
                                    className="table-th cursor-pointer hover:bg-slate-50 transition-colors group"
                                    onClick={() => handleSort('customer_name')}
                                >
                                    <div className="flex items-center gap-2">
                                        Khách hàng
                                        {getSortIcon('customer_name')}
                                    </div>
                                </th>
                                <th
                                    className="table-th text-center cursor-pointer hover:bg-slate-50 transition-colors"
                                    onClick={() => handleSort('transaction_count')}
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        Giao dịch
                                        {getSortIcon('transaction_count')}
                                    </div>
                                </th>
                                <th
                                    className="table-th text-right cursor-pointer hover:bg-slate-50 transition-colors"
                                    onClick={() => handleSort('total_principal')}
                                >
                                    <div className="flex items-center justify-end gap-2">
                                        Tổng gốc vay
                                        {getSortIcon('total_principal')}
                                    </div>
                                </th>
                                <th
                                    className="table-th text-right cursor-pointer hover:bg-slate-50 transition-colors"
                                    onClick={() => handleSort('total_interest')}
                                >
                                    <div className="flex items-center justify-end gap-2">
                                        Tổng lãi
                                        {getSortIcon('total_interest')}
                                    </div>
                                </th>
                                <th
                                    className="table-th text-right cursor-pointer hover:bg-slate-50 transition-colors"
                                    onClick={() => handleSort('total_collected')}
                                >
                                    <div className="flex items-center justify-end gap-2">
                                        Đã thanh toán
                                        {getSortIcon('total_collected')}
                                    </div>
                                </th>
                                <th
                                    className="table-th text-right cursor-pointer hover:bg-slate-50 transition-colors"
                                    onClick={() => handleSort('total_debt')}
                                >
                                    <div className="flex items-center justify-end gap-2">
                                        Còn nợ
                                        {getSortIcon('total_debt')}
                                    </div>
                                </th>
                                <th className="table-th text-right">Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-sm">
                            {processedData.map((item, index) => (
                                <tr
                                    key={item.customer_id}
                                    className="table-row group cursor-pointer"
                                    onClick={() => navigate(`/customers/${item.customer_id}/debt`)}
                                >
                                    <td className="table-td font-medium text-slate-700 group-hover:text-blue-600 transition-colors">
                                        {item.customer_name}
                                    </td>
                                    <td className="table-td text-center">
                                        <span className="badge-neutral">
                                            {item.transaction_count} GD
                                        </span>
                                    </td>
                                    <td className="table-td text-right font-mono text-slate-600">
                                        {item.total_principal.toLocaleString('vi-VN')}
                                    </td>
                                    <td className="table-td text-right font-mono text-blue-600 font-medium">
                                        +{item.total_interest.toLocaleString('vi-VN')}
                                    </td>
                                    <td className="table-td text-right font-mono text-emerald-600 font-medium">
                                        {item.total_collected?.toLocaleString('vi-VN') || 0}
                                    </td>
                                    <td className="table-td text-right font-mono font-semibold text-red-600">
                                        {item.total_debt.toLocaleString('vi-VN')}
                                    </td>
                                    <td className="table-td text-right">
                                        {item.total_debt > 0 ? (
                                            <span className="badge-warning">
                                                <ArrowUpRight size={12} /> Đang nợ
                                            </span>
                                        ) : (
                                            <span className="badge-success">
                                                <ArrowDownRight size={12} /> Hoàn tất
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {processedData.length === 0 && (
                                <tr>
                                    <td colSpan="7" className="table-td py-8">
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

                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-slate-100">
                    {processedData.map((item) => (
                        <div
                            key={item.customer_id}
                            onClick={() => navigate(`/customers/${item.customer_id}/debt`)}
                            className="p-5 active:bg-slate-50 transition-colors"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h4 className="font-bold text-slate-900 text-base">{item.customer_name}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="badge-neutral text-[10px]">{item.transaction_count} GD</span>
                                        {item.total_debt > 0 ? (
                                            <span className="badge-warning text-[10px]">Đang nợ</span>
                                        ) : (
                                            <span className="badge-success text-[10px]">Hoàn tất</span>
                                        )}
                                    </div>
                                </div>
                                <ChevronRight size={18} className="text-slate-300" />
                            </div>

                            <div className="grid grid-cols-2 gap-4 bg-slate-50/50 rounded-2xl p-4 border border-slate-100">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tổng gốc</p>
                                    <p className="font-mono text-sm font-bold text-slate-700">{item.total_principal.toLocaleString('vi-VN')}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Tổng lãi</p>
                                    <p className="font-mono text-sm font-bold text-blue-600">+{item.total_interest.toLocaleString('vi-VN')}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1">Đã thu</p>
                                    <p className="font-mono text-sm font-bold text-emerald-600">{item.total_collected?.toLocaleString('vi-VN') || 0}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1">Còn nợ</p>
                                    <p className="font-mono text-base font-black text-red-600">{item.total_debt.toLocaleString('vi-VN')}</p>
                                </div>
                            </div>
                        </div>
                    ))}

                    {processedData.length === 0 && (
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
                    )}
                </div>
            </div>
        </div>
    );
}
