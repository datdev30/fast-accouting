import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDebtReport } from '../services/api';
import { Download, TrendingUp, Wallet, ArrowUpRight, ArrowDownRight, PieChart, Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export default function Reports() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { triggerBatchExport, isBackingUp } = useAuth(); // Global state
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    const { data: report, isLoading } = useQuery({
        queryKey: ['debt-report'],
        queryFn: getDebtReport
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

    if (isLoading) return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin text-blue-600 w-8 h-8 border-2 border-current border-t-transparent rounded-full"></div>
        </div>
    );

    const totalPrincipal = report?.reduce((sum, item) => sum + item.total_principal, 0) || 0;
    const totalInterest = report?.reduce((sum, item) => sum + item.total_interest, 0) || 0;
    const totalDebt = report?.reduce((sum, item) => sum + item.total_debt, 0) || 0;
    const totalCollected = report?.reduce((sum, item) => sum + (item.total_collected || 0), 0) || 0;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-slate-800">Tổng Quan Tài Chính</h1>

                <button
                    onClick={async () => {
                        let selectedPath = null;
                        // Trigger folder selection if running in desktop mode
                        if (window.pywebview && window.pywebview.api && window.pywebview.api.select_folder) {
                            try {
                                selectedPath = await window.pywebview.api.select_folder();
                                if (!selectedPath) {
                                    // User cancelled selection
                                    return;
                                }
                            } catch (err) {
                                console.error("Error selecting folder:", err);
                                // Fallback or continue? If selection failed, maybe just run default?
                                // User asked for "Allow admin to choose...". If selection fails, notify?
                                // Let's just create toast if we can't select, or fallback.
                                // For now, if API exists but fails/cancels, we abort to respect "User chooses".
                                // But if it was an error, maybe we log it.
                            }
                        }

                        // If selectedPath is null (and not cancelled), it means we are in web browser (not desktop)
                        // or api doesn't exist. In that case, triggerBatchExport(null) -> defaults to server logic.
                        // BUT: logic above returns if selectedPath is explicitly null/empty FROM api call.

                        await triggerBatchExport(selectedPath);
                    }}
                    disabled={isBackingUp}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl transition-all shadow-lg shadow-blue-200 font-medium active:scale-95 disabled:opacity-70 disabled:cursor-wait"
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
                            Hiện tại có <span className="font-bold text-slate-700">{report?.length || 0}</span> khách hàng đang nợ
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
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <h3 className="font-bold text-slate-800">Chi Tiết Theo Khách Hàng</h3>

                    {/* Search Bar */}
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                            <Search size={16} />
                        </div>
                        <input
                            type="text"
                            placeholder="Tìm kiếm khách hàng..."
                            className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm transition-all w-64"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                            <tr>
                                <th
                                    className="px-6 py-4 cursor-pointer hover:bg-slate-50 transition-colors group"
                                    onClick={() => handleSort('customer_name')}
                                >
                                    <div className="flex items-center gap-2">
                                        Khách hàng
                                        {getSortIcon('customer_name')}
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-4 text-center cursor-pointer hover:bg-slate-50 transition-colors"
                                    onClick={() => handleSort('transaction_count')}
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        Giao dịch
                                        {getSortIcon('transaction_count')}
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-4 text-right cursor-pointer hover:bg-slate-50 transition-colors"
                                    onClick={() => handleSort('total_principal')}
                                >
                                    <div className="flex items-center justify-end gap-2">
                                        Tổng gốc vay
                                        {getSortIcon('total_principal')}
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-4 text-right cursor-pointer hover:bg-slate-50 transition-colors"
                                    onClick={() => handleSort('total_interest')}
                                >
                                    <div className="flex items-center justify-end gap-2">
                                        Tổng lãi
                                        {getSortIcon('total_interest')}
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-4 text-right cursor-pointer hover:bg-slate-50 transition-colors"
                                    onClick={() => handleSort('total_collected')}
                                >
                                    <div className="flex items-center justify-end gap-2">
                                        Đã thanh toán
                                        {getSortIcon('total_collected')}
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-4 text-right cursor-pointer hover:bg-slate-50 transition-colors"
                                    onClick={() => handleSort('total_debt')}
                                >
                                    <div className="flex items-center justify-end gap-2">
                                        Còn nợ
                                        {getSortIcon('total_debt')}
                                    </div>
                                </th>
                                <th className="px-6 py-4 text-right">Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-sm">
                            {processedData.map((item) => (
                                <tr
                                    key={item.customer_id}
                                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                                    onClick={() => navigate(`/customers/${item.customer_id}/debt`)}
                                >
                                    <td className="px-6 py-4 font-semibold text-slate-700 group-hover:text-blue-600 transition-colors">
                                        {item.customer_name}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md text-xs font-bold">
                                            {item.transaction_count} GD
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono text-slate-600">
                                        {item.total_principal.toLocaleString('vi-VN')}
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono text-blue-600 font-medium">
                                        +{item.total_interest.toLocaleString('vi-VN')}
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono text-emerald-600 font-medium">
                                        {item.total_collected?.toLocaleString('vi-VN') || 0}
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono font-bold text-red-600">
                                        {item.total_debt.toLocaleString('vi-VN')}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {item.total_debt > 0 ? (
                                            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full border border-amber-100">
                                                <ArrowUpRight size={12} /> Đang nợ
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
                                                <ArrowDownRight size={12} /> Hoàn tất
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {processedData.length === 0 && (
                                <tr>
                                    <td colSpan="7" className="px-6 py-16 text-center text-slate-400">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                                                <PieChart size={24} className="opacity-50" />
                                            </div>
                                            <p>Chưa có dữ liệu công nợ nào.</p>
                                        </div>
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
