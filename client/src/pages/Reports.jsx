import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDebtReport, getOverviewSummary, getInterestConfigs } from '../services/api';
import { ArrowUpRight, ArrowDownRight, Search, Plus, UserPlus, QrCode, FileDown } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ReportsAdminCharts from '../components/ReportsAdminCharts';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { EmptyStates } from '../components/EmptyState';
import { ErrorStates } from '../components/ErrorState';
import DataTable from '../components/DataTable';
import Avatar from '../components/Avatar';
import { formatDate } from '../utils/dateUtils';

const money = (n) => n == null ? '—' : Number(n).toLocaleString('vi-VN');

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
    const { data: summary, isPending: summaryLoading, isError: summaryError, refetch: retrySummary } = useQuery({ queryKey: ['overview-summary'], queryFn: getOverviewSummary });
    const { data: configs } = useQuery({ queryKey: ['interest-configs'], queryFn: getInterestConfigs });

    const processedData = useMemo(() => {
        if (!report) return [];

        let data = [...report];

        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            data = data.filter((item) =>
                (item.customer_name ?? '').toLowerCase().includes(lowerTerm)
            );
        }

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

    if (reportError) return (
        <div className="px-1 pb-8 sm:px-0">
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
        <div className="space-y-6 pb-8">
            <LoadingSkeleton.Stats count={4} />
            <LoadingSkeleton.Table rows={8} columns={7} />
        </div>
    );

    const typeName = (code) => configs?.find((c) => c.code === code)?.name ?? code;

    const quickActions = [
        { to: '/transactions', state: { create: true }, icon: Plus, label: 'Giao dịch', tone: 'bg-orange-50 text-amber-800' },
        { to: '/customers', state: { create: true }, icon: UserPlus, label: 'Khách mới', tone: 'bg-blue-50 text-blue-600' },
        { to: '/bank-account-config', icon: QrCode, label: 'Mã QR', tone: 'bg-emerald-50 text-emerald-700' },
    ];

    return (
        <div className="space-y-4 pb-10 animate-in fade-in duration-300 lg:space-y-6">
            <header className="hidden items-center gap-3 lg:flex">
                <h1 className="flex-1 font-heading text-2xl font-bold text-slate-900">Tổng quan</h1>
                <button type="button" onClick={() => triggerBatchExport()} disabled={isBackingUp} className="btn-secondary btn-md">
                    <FileDown size={18} className={isBackingUp ? 'animate-bounce' : ''} />
                    {isBackingUp ? 'Đang xử lý…' : 'Xuất PDF'}
                </button>
                <Link to="/transactions" state={{ create: true }} className="btn-md inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 font-bold text-white hover:bg-blue-700">
                    <Plus size={18} /> Thêm giao dịch
                </Link>
            </header>

            <section className="grid gap-3 lg:grid-cols-3 lg:gap-4" aria-label="Tổng hợp">
                <div className="ledger-summary lg:col-span-2">
                    <p className="ledger-caption">Tổng nợ phải thu</p>
                    {summaryLoading && <p role="status" className="mt-2 text-sm text-slate-600">Đang tải số liệu…</p>}
                    {summaryError && <p role="alert" className="mt-2 text-sm text-red-700">Không tải được số liệu tổng hợp. <button type="button" className="underline min-h-12" onClick={() => retrySummary()}>Thử lại</button></p>}
                    <p className="ledger-total mt-1">
                        {money(summary?.total_debt)} <span className="text-base font-normal text-slate-600">₫</span>
                    </p>
                    <dl className="ledger-breakdown">
                        <div className="min-w-0">
                            <dt className="text-slate-600">Tiền gốc</dt>
                            <dd className="mt-0.5 font-mono text-sm font-bold tabular-nums lg:text-base">{money(summary?.open_principal)}</dd>
                        </div>
                        <div className="min-w-0">
                            <dt className="text-slate-600">Lãi dự kiến</dt>
                            <dd className="mt-0.5 font-mono text-sm font-bold tabular-nums lg:text-base">{money(summary?.open_interest)}</dd>
                        </div>
                        <div className="min-w-0">
                            <dt className="text-slate-600">Đã thu</dt>
                            <dd className="mt-0.5 font-mono text-sm font-bold tabular-nums lg:text-base">{money(summary?.total_collected)}</dd>
                        </div>
                    </dl>
                </div>

                <div className="grid grid-cols-2 gap-2 lg:grid-cols-1 lg:gap-4">
                    <Link to="/customers" className="rounded-xl border border-slate-200 bg-white p-3 lg:p-5">
                        <p className="text-xs text-slate-500">Khách hàng</p>
                        <p className="font-mono text-xl font-bold text-slate-900 lg:text-2xl">{summary?.customer_count ?? '—'}</p>
                        <p className="text-[13px] font-semibold text-emerald-700">+{summary?.new_customers_this_month ?? 0} tháng này</p>
                    </Link>
                    <Link to="/transactions" className="rounded-xl border border-slate-200 bg-white p-3 lg:p-5">
                        <p className="text-xs text-slate-500">Khoản đang mở</p>
                        <p className="font-mono text-xl font-bold text-slate-900 lg:text-2xl">{summary?.open_count ?? '—'}</p>
                        <p className="text-[13px] font-semibold text-amber-600">{summary?.open_over_6_months ?? 0} quá 6 tháng</p>
                    </Link>
                </div>
            </section>

            <nav className="grid grid-cols-4 gap-2 text-center lg:hidden" aria-label="Lối tắt">
                {quickActions.map((action) => (
                    <Link key={action.label} to={action.to} state={action.state} className="flex flex-col items-center gap-1.5 rounded-xl py-1 active:bg-slate-100">
                        <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${action.tone}`}><action.icon size={20} /></span>
                        <span className="text-[13px] font-semibold text-slate-700">{action.label}</span>
                    </Link>
                ))}
                <button type="button" onClick={() => triggerBatchExport()} disabled={isBackingUp} className="flex flex-col items-center gap-1.5 rounded-xl py-1 active:bg-slate-100 disabled:opacity-60">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                        <FileDown size={20} className={isBackingUp ? 'animate-bounce' : ''} />
                    </span>
                    <span className="text-[13px] font-semibold text-slate-700">Xuất PDF</span>
                </button>
            </nav>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white" aria-label="Công nợ theo khách hàng">
                <div className="card-header">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                        <h2 className="section-kicker">
                            <span className="h-4 w-1 rounded-full bg-blue-600" aria-hidden />
                            Công nợ theo khách hàng · VND
                        </h2>
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

                <DataTable
                    rows={processedData}
                    getRowKey={(item) => item.customer_id}
                    onRowClick={(item) => navigate(`/customers/${item.customer_id}/debt`)}
                    caption="Công nợ theo khách hàng, nhấp để xem chi tiết"
                    sort={sortConfig}
                    onSort={handleSort}
                    tableMinWidth="min-w-[58rem]"
                    columns={[
                        {
                            id: 'customer_name',
                            header: 'Khách hàng',
                            priority: 1,
                            sortable: true,
                            cellClassName: 'font-medium text-slate-700',
                            cell: (item) => item.customer_name,
                        },
                        {
                            id: 'transaction_count',
                            header: 'Giao dịch',
                            priority: 3,
                            align: 'center',
                            sortable: true,
                            cell: (item) => <span className="badge-neutral">{item.transaction_count} GD</span>,
                        },
                        {
                            id: 'total_principal',
                            header: 'Tổng gốc vay',
                            priority: 3,
                            align: 'right',
                            sortable: true,
                            cellClassName: 'font-mono text-slate-600',
                            cell: (item) => item.total_principal.toLocaleString('vi-VN'),
                        },
                        {
                            id: 'total_interest',
                            header: 'Tổng lãi',
                            priority: 3,
                            align: 'right',
                            sortable: true,
                            cellClassName: 'font-mono text-amber-800 font-medium',
                            cell: (item) => `+${item.total_interest.toLocaleString('vi-VN')}`,
                        },
                        {
                            id: 'total_collected',
                            header: 'Đã thanh toán',
                            priority: 2,
                            align: 'right',
                            sortable: true,
                            cellClassName: 'font-mono text-emerald-700 font-medium',
                            cell: (item) => item.total_collected?.toLocaleString('vi-VN') || 0,
                        },
                        {
                            id: 'total_debt',
                            header: 'Còn nợ',
                            priority: 2,
                            align: 'right',
                            sortable: true,
                            cellClassName: 'font-mono font-semibold text-blue-700',
                            cell: (item) => item.total_debt.toLocaleString('vi-VN'),
                        },
                        {
                            id: 'status',
                            header: 'Trạng thái',
                            priority: 2,
                            align: 'right',
                            cellClassName: 'whitespace-nowrap',
                            headerClassName: 'whitespace-nowrap',
                            cell: (item) => (item.total_debt > 0 ? (
                                <span className="badge-warning">
                                    <ArrowUpRight size={12} /> Đang nợ
                                </span>
                            ) : (
                                <span className="badge-success">
                                    <ArrowDownRight size={12} /> Hoàn tất
                                </span>
                            )),
                        },
                    ]}
                    empty={(
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
                />
            </section>

            <div className="grid gap-4 lg:grid-cols-3">
                <section aria-label="Giao dịch gần đây">
                    <div className="mb-2 flex items-center justify-between">
                        <h2 className="font-bold text-slate-900">Giao dịch gần đây</h2>
                        <Link to="/transactions" className="text-xs font-semibold text-blue-600">Xem tất cả</Link>
                    </div>
                    <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
                        {summary?.recent?.map((tx) => (
                            <li key={tx._id}>
                                <Link to={`/customers/${tx.customer_id}/debt`} className="flex items-center gap-3 p-3 hover:bg-slate-50">
                                    <Avatar name={tx.customer_name} className="h-9 w-9 rounded-full text-xs" />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold text-slate-800">{tx.customer_name}</p>
                                        <p className="text-[13px] text-slate-500">{formatDate(tx.transaction_date)} · {typeName(tx.type)}</p>
                                    </div>
                                    <div className="shrink-0 text-right">
                                        <p className="font-mono text-sm font-semibold text-slate-900">{money(tx.amount)} ₫</p>
                                        {tx.status === 'PAID' && <p className="text-[13px] text-emerald-700">Đã trả</p>}
                                    </div>
                                </Link>
                            </li>
                        ))}
                        {summary?.recent?.length === 0 && <li className="p-4 text-center text-sm text-slate-500">Chưa có giao dịch</li>}
                    </ul>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 lg:col-span-2" aria-label="Biểu đồ">
                    <div className="reports-charts-root">
                        <ReportsAdminCharts report={report ?? []} />
                    </div>
                </section>
            </div>

        </div>
    );
}
