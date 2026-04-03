import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDebtReport } from '../services/api';
import { Download, TrendingUp, Wallet, ArrowUpRight, ArrowDownRight, PieChart, Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ReportsAdminCharts from '../components/ReportsAdminCharts';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { EmptyStates } from '../components/EmptyState';
import { ErrorStates } from '../components/ErrorState';

export default function Reports() {
    const navigate = useNavigate();
    const { triggerBatchExport, isBackingUp } = useAuth();
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
            data = data.filter((item) =>
                (item.customer_name ?? '').toLowerCase().includes(lowerTerm)
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
        <div className="reports-page px-1 pb-8 sm:px-0">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                <ErrorStates.Network
                    error={reportError}
                    onRetry={refetch}
                    showDetails={true}
                />
            </div>
        </div>
    );

    if (isLoading) return (
        <div className="reports-page space-y-6 pb-8">
            <LoadingSkeleton.Stats count={4} />
            <LoadingSkeleton.Table rows={8} columns={7} />
        </div>
    );

    const totalPrincipal = report?.reduce((sum, item) => sum + item.total_principal, 0) || 0;
    const totalInterest = report?.reduce((sum, item) => sum + item.total_interest, 0) || 0;
    const totalDebt = report?.reduce((sum, item) => sum + item.total_debt, 0) || 0;
    const totalCollected = report?.reduce((sum, item) => sum + (item.total_collected || 0), 0) || 0;

    return (
        <div className="reports-page space-y-6 pb-10 animate-in fade-in duration-300 lg:space-y-8">
            <header className="reports-page__masthead">
                <div className="reports-page__masthead-accent" aria-hidden />
                <div className="relative z-[1] min-w-0 flex-1">
                    <p className="reports-page__kicker">Báo cáo &amp; tổng hợp</p>
                    <h1 className="section-title text-xl lg:text-2xl">Tổng quan tài chính</h1>
                    <p className="section-subtitle mt-1 max-w-2xl">
                        Công nợ theo khách hàng, chỉ số tổng và biểu đồ trực quan — dữ liệu từ sổ giao dịch hiện tại.
                    </p>
                </div>
                <div className="relative z-[1] flex w-full shrink-0 flex-col gap-1 sm:w-auto sm:items-end">
                    <button
                        type="button"
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
                        className="btn-primary btn-md w-full whitespace-nowrap sm:w-auto disabled:cursor-wait"
                    >
                        <Download size={16} className={isBackingUp ? 'animate-bounce' : ''} />
                        <span>{isBackingUp ? 'Đang xử lý…' : 'Xuất phiếu PDF'}</span>
                    </button>
                    <p className="reports-page__export-hint hidden text-right sm:block">
                        Gói PDF theo khách — chọn thư mục khi ứng dụng hỗ trợ.
                    </p>
                </div>
            </header>

            <section className="reports-page__kpi-grid" aria-label="Chỉ số tổng hợp">
                <div className="reports-page__kpi-card reports-page__kpi-card--principal">
                    <div className="relative z-[1] flex items-start gap-3">
                        <div className="reports-page__kpi-icon reports-page__kpi-icon--principal" aria-hidden>
                            <Wallet size={20} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="reports-page__kpi-label">Tổng tiền gốc</p>
                            <div className="mt-2 flex items-baseline gap-1.5">
                                <span className="reports-page__kpi-value">{totalPrincipal.toLocaleString('vi-VN')}</span>
                                <span className="reports-page__kpi-suffix">đ</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="reports-page__kpi-card reports-page__kpi-card--interest">
                    <div className="relative z-[1] flex items-start gap-3">
                        <div className="reports-page__kpi-icon reports-page__kpi-icon--interest" aria-hidden>
                            <TrendingUp size={20} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="reports-page__kpi-label">Lãi dự kiến (tổng hợp)</p>
                            <div className="mt-2 flex items-baseline gap-1.5">
                                <span className="reports-page__kpi-value text-violet-900">
                                    +{totalInterest.toLocaleString('vi-VN')}
                                </span>
                                <span className="reports-page__kpi-suffix">đ</span>
                            </div>
                            <div className="reports-page__kpi-pill">
                                <TrendingUp size={12} className="shrink-0 opacity-80" aria-hidden />
                                Ước tính theo cấu hình lãi
                            </div>
                        </div>
                    </div>
                </div>

                <div className="reports-page__kpi-card reports-page__kpi-card--debt">
                    <div className="relative z-[1] flex items-start gap-3">
                        <div className="reports-page__kpi-icon reports-page__kpi-icon--debt" aria-hidden>
                            <PieChart size={20} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="reports-page__kpi-label">Tổng nợ phải thu</p>
                            <div className="mt-2 flex items-baseline gap-1.5">
                                <span className="reports-page__kpi-value text-rose-950">{totalDebt.toLocaleString('vi-VN')}</span>
                                <span className="reports-page__kpi-suffix">đ</span>
                            </div>
                            <p className="reports-page__kpi-foot">
                                <span className="font-semibold text-slate-700">{report?.filter((i) => i.total_debt > 0).length || 0}</span>{' '}
                                khách hàng còn dư nợ
                            </p>
                        </div>
                    </div>
                </div>

                <div className="reports-page__kpi-card reports-page__kpi-card--collected">
                    <div className="relative z-[1] flex items-start gap-3">
                        <div className="reports-page__kpi-icon reports-page__kpi-icon--collected" aria-hidden>
                            <Download size={20} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="reports-page__kpi-label">Đã thu (thực tế)</p>
                            <div className="mt-2 flex items-baseline gap-1.5">
                                <span className="reports-page__kpi-value text-emerald-950">
                                    {totalCollected.toLocaleString('vi-VN')}
                                </span>
                                <span className="reports-page__kpi-suffix">đ</span>
                            </div>
                            <p className="reports-page__kpi-foot">Tổng số tiền đã ghi nhận thanh toán.</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="reports-page__charts-panel" aria-label="Biểu đồ">
                <div className="reports-page__charts-panel-accent" aria-hidden />
                <div className="reports-page__charts-panel-inner reports-charts-root">
                    <ReportsAdminCharts report={report ?? []} />
                </div>
            </section>

            <section className="reports-page__table-card" aria-label="Chi tiết theo khách hàng">
                <div className="card-header">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                        <h2 className="section-kicker">
                            <span className="h-4 w-1 rounded-full bg-blue-600" aria-hidden />
                            Chi tiết theo khách hàng
                        </h2>
                        {/* Search Bar */}
                        <div className="relative w-full sm:w-56 md:w-64">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                                <Search size={16} className="shrink-0" />
                            </div>
                            <input
                                type="text"
                                placeholder="Tìm kiếm khách hàng..."
                                className="input-filter input-icon"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Desktop: Table View */}
                <div className="overflow-x-auto block">
                    <table className="table min-w-[1000px]">
                        <thead className="table-head">
                            <tr>
                                <th
                                    scope="col"
                                    className="table-th table-th-sortable group"
                                    onClick={() => handleSort('customer_name')}
                                >
                                    <div className="flex items-center gap-2">
                                        Khách hàng
                                        {getSortIcon('customer_name')}
                                    </div>
                                </th>
                                <th
                                    scope="col"
                                    className="table-th table-th-sortable text-center"
                                    onClick={() => handleSort('transaction_count')}
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        Giao dịch
                                        {getSortIcon('transaction_count')}
                                    </div>
                                </th>
                                <th
                                    scope="col"
                                    className="table-th table-th-sortable text-right"
                                    onClick={() => handleSort('total_principal')}
                                >
                                    <div className="flex items-center justify-end gap-2">
                                        Tổng gốc vay
                                        {getSortIcon('total_principal')}
                                    </div>
                                </th>
                                <th
                                    scope="col"
                                    className="table-th table-th-sortable text-right"
                                    onClick={() => handleSort('total_interest')}
                                >
                                    <div className="flex items-center justify-end gap-2">
                                        Tổng lãi
                                        {getSortIcon('total_interest')}
                                    </div>
                                </th>
                                <th
                                    scope="col"
                                    className="table-th table-th-sortable text-right"
                                    onClick={() => handleSort('total_collected')}
                                >
                                    <div className="flex items-center justify-end gap-2">
                                        Đã thanh toán
                                        {getSortIcon('total_collected')}
                                    </div>
                                </th>
                                <th
                                    scope="col"
                                    className="table-th table-th-sortable text-right"
                                    onClick={() => handleSort('total_debt')}
                                >
                                    <div className="flex items-center justify-end gap-2">
                                        Còn nợ
                                        {getSortIcon('total_debt')}
                                    </div>
                                </th>
                                <th scope="col" className="table-th text-right">
                                    Trạng thái
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {processedData.map((item) => (
                                <tr
                                    key={item.customer_id}
                                    className="table-row group cursor-pointer transition-colors hover:bg-slate-50/80"
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
            </section>
        </div>
    );
}
