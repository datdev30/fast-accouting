import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getTransactions, getCustomers, getInterestConfigs, getCustomer } from '../services/api';
import api from '../services/api'; // Import default api instance
import { useReactToPrint } from 'react-to-print';
import PrintableReport from '../components/PrintableReport';
import { ArrowLeft, Printer, Calendar, X, ChevronRight, FileText, Wallet, Percent, PiggyBank, CheckCircle, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import DateInput from '../components/DateInput';
import { formatDate } from '../utils/dateUtils';
import { useToast } from '../context/ToastContext';

const CustomerDebtDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [showPreview, setShowPreview] = useState(false);

    // Bulk Pay State
    const [bulkPayOpen, setBulkPayOpen] = useState(false);
    const [bulkPin, setBulkPin] = useState('');
    const [bulkDate, setBulkDate] = useState(new Date().toISOString().split('T')[0]);
    const [bulkError, setBulkError] = useState('');

    // Print Ref
    const printRef = useRef();

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Bao_cao_cong_no_${id}`,
    });

    // Fetch single customer details directly
    const { data: customerData, isLoading: isCustomerLoading } = useQuery({
        queryKey: ['customer', id],
        queryFn: () => getCustomer(id),
        enabled: !!id
    });

    // Fallback to list if single fetch fails or while loading (optional, but good for UX if list already loaded)
    const { data: customers } = useQuery({ queryKey: ['customers'], queryFn: getCustomers });
    const { data: configs } = useQuery({ queryKey: ['interest-configs'], queryFn: getInterestConfigs });

    // Prefer specific fetch, fallback to list (safeguard)
    const customer = customerData || customers?.find(c => c.id === id || c._id === id);

    const { data: transactions, isLoading } = useQuery({
        queryKey: ['transactions', id, startDate, endDate],
        queryFn: () => getTransactions(id, startDate || undefined, endDate || undefined),
        enabled: !!id
    });

    const bulkPayMutation = useMutation({
        mutationFn: async (data) => {
            const res = await api.post('/transactions/bulk-pay', data);
            return res.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries(['transactions', id]);
            setBulkPayOpen(false);
            setBulkPin('');
            setBulkError('');

            setBulkPin('');
            setBulkError('');

            showToast('Thành công', `Đã thanh toán ${data.count} giao dịch`, 'success');
        },
        onError: (err) => {
            setBulkError(err.response?.data?.detail || "Lỗi thanh toán");
        }
    });

    const handleBulkPay = (e) => {
        e.preventDefault();
        setBulkError('');
        bulkPayMutation.mutate({
            customer_id: id,
            payment_date: bulkDate,
            pin: bulkPin
        });
    };

    // Helper to group by month
    const groupedTransactions = React.useMemo(() => {
        if (!transactions || !Array.isArray(transactions)) return {};

        // Sort transactions by Date Ascending (Oldest First)
        const sortedTxs = [...transactions].sort((a, b) => new Date(a.transaction_date) - new Date(b.transaction_date));

        const groups = {};
        sortedTxs.forEach(tx => {
            // Removed filter: if (tx.status !== 'OPEN') return; // Show all history

            const date = new Date(tx.transaction_date);
            if (isNaN(date.getTime())) {
                if (!groups['Khác']) groups['Khác'] = [];
                groups['Khác'].push(tx);
                return;
            }

            const key = date.toLocaleString('default', { month: '2-digit', year: 'numeric' }); // 12/2023 format

            // Format key as MM/YYYY
            const displayKey = `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;

            if (!groups[displayKey]) groups[displayKey] = [];
            groups[displayKey].push(tx);
        });
        return groups;
    }, [transactions]);

    // Calculate Totals (Lifetime + Status based)
    let lifetimePrincipal = 0;
    let lifetimeInterest = 0;
    let totalPaid = 0;
    let totalRemaining = 0;

    // Track Remaining specifically for Report
    let remainingPrincipal = 0;
    let remainingInterest = 0;

    if (transactions) {
        transactions.forEach(tx => {
            const principal = tx.amount || 0;
            const interest = tx.interest_calculation?.rounded_interest || 0;
            const total = principal + interest;

            // Lifetime Accumulation
            lifetimePrincipal += principal;
            lifetimeInterest += interest;

            // Status based
            if (tx.status === 'PAID') {
                totalPaid += total;
            } else if (tx.status === 'OPEN') {
                totalRemaining += total;
                remainingPrincipal += principal;
                remainingInterest += interest;
            }
        });
    }

    if (!customer) return <div className="p-8 text-center text-slate-500">Đang tải dữ liệu khách hàng...</div>;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                        <Link to="/customers" className="hover:text-blue-600 transition-colors">Khách hàng</Link>
                        <ChevronRight size={14} />
                        <span className="text-slate-900 font-medium">Chi tiết công nợ</span>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                        {customer.name}
                    </h1>
                    <p className="text-slate-500 mt-1 flex items-center gap-2">
                        <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                        {customer.contact_info || 'Không có thông tin liên hệ'}
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setBulkPayOpen(true)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold shadow-lg shadow-emerald-200 transition-all active:scale-95"
                    >
                        <Wallet size={18} />
                        Thanh toán tất cả
                    </button>
                    <button
                        onClick={() => setShowPreview(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 rounded-xl shadow-sm transition-all font-medium group"
                    >
                        <Printer size={18} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
                        <span>In Phiếu Nợ</span>
                    </button>
                </div>
            </div>

            {/* Bulk Pay Modal */}
            {bulkPayOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Xác nhận thanh toán</h3>
                        <p className="text-slate-500 text-sm mb-6">
                            Bạn đang thực hiện thanh toán cho <b>tất cả các khoản nợ</b> của khách hàng này.
                            Vui lòng nhập ngày thanh toán và mã PIN xác thực.
                        </p>

                        <form onSubmit={handleBulkPay} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ngày thanh toán</label>
                                <DateInput
                                    required
                                    className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-blue-500 font-medium text-slate-700"
                                    value={bulkDate}
                                    onChange={e => setBulkDate(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mã PIN</label>
                                <input
                                    type="password"
                                    required
                                    maxLength={4}
                                    placeholder="••••"
                                    className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-blue-500 font-bold text-center text-2xl tracking-widest text-slate-800"
                                    value={bulkPin}
                                    onChange={e => setBulkPin(e.target.value.replace(/\D/g, ''))}
                                />
                            </div>

                            {bulkError && (
                                <div className="text-red-500 text-sm font-medium bg-red-50 p-2 rounded-lg text-center">
                                    {bulkError}
                                </div>
                            )}

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setBulkPayOpen(false)}
                                    className="flex-1 py-2.5 text-slate-500 font-semibold hover:bg-slate-100 rounded-xl transition-colors"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={bulkPayMutation.isPending}
                                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {bulkPayMutation.isPending ? 'Đang xử lý...' : 'Xác nhận'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}



            {/* Print Preview Modal - Unchanged content logic, updated modal UI */}
            {showPreview && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 print:hidden">
                    <div className="bg-slate-100 w-full max-w-5xl h-[90vh] rounded-2xl flex flex-col shadow-2xl relative overflow-hidden">
                        {/* Header */}
                        <div className="bg-white px-6 py-4 border-b border-slate-200 flex justify-between items-center shadow-sm z-10">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <Printer className="text-blue-600" /> Xem trước bản in
                            </h3>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => handlePrint()}
                                    className="px-5 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium flex items-center gap-2 shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5"
                                >
                                    <Printer size={18} /> In ngay
                                </button>
                                <button
                                    onClick={() => setShowPreview(false)}
                                    className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        {/* Scrollable Preview Area */}
                        <div className="flex-1 overflow-y-auto p-8 bg-slate-200/50 flex justify-center">
                            <div className="shadow-xl bg-white animate-in zoom-in-95 duration-300">
                                <PrintableReport
                                    ref={printRef}
                                    customer={customer}
                                    groupedTransactions={groupedTransactions}
                                    transactions={transactions}
                                    totalPrincipal={remainingPrincipal}
                                    totalInterest={remainingInterest}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
                {/* 1. Lifetime Principal */}
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-5 rounded-2xl text-white shadow-lg shadow-blue-200 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><Wallet size={80} /></div>
                    <div className="relative z-10">
                        <p className="text-blue-100 text-sm font-medium mb-1 flex items-center gap-2"><Wallet size={14} /> Tổng tiền gốc</p>
                        <p className="text-2xl font-bold tracking-tight">{lifetimePrincipal.toLocaleString('vi-VN')} <span className="text-sm font-normal opacity-80">đ</span></p>
                    </div>
                </div>

                {/* 2. Lifetime Interest */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="absolute top-0 right-0 p-4 text-orange-50 opacity-50 group-hover:scale-110 transition-transform"><Percent size={80} /></div>
                    <div className="relative z-10">
                        <p className="text-slate-500 text-sm font-medium mb-1 flex items-center gap-2"><Percent size={14} className="text-orange-500" /> Tổng tiền lãi</p>
                        <p className="text-2xl font-bold text-slate-900 tracking-tight">{lifetimeInterest.toLocaleString('vi-VN')} <span className="text-sm font-normal text-slate-400">đ</span></p>
                    </div>
                </div>

                {/* 3. Lifetime Total Payment */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="absolute top-0 right-0 p-4 text-purple-50 opacity-50 group-hover:scale-110 transition-transform"><PiggyBank size={80} /></div>
                    <div className="relative z-10">
                        <p className="text-slate-500 text-sm font-medium mb-1 flex items-center gap-2"><PiggyBank size={14} className="text-purple-500" /> Tổng tiền</p>
                        <p className="text-2xl font-bold text-purple-600 tracking-tight">{(lifetimePrincipal + lifetimeInterest).toLocaleString('vi-VN')} <span className="text-sm font-normal text-purple-300">đ</span></p>
                    </div>
                </div>

                {/* 4. Total Paid */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="absolute top-0 right-0 p-4 text-emerald-50 opacity-50 group-hover:scale-110 transition-transform"><CheckCircle size={80} /></div>
                    <div className="relative z-10">
                        <p className="text-slate-500 text-sm font-medium mb-1 flex items-center gap-2"><CheckCircle size={14} className="text-emerald-500" /> Đã thanh toán</p>
                        <p className="text-2xl font-bold text-emerald-600 tracking-tight">{totalPaid.toLocaleString('vi-VN')} <span className="text-sm font-normal text-emerald-300">đ</span></p>
                    </div>
                </div>

                {/* 5. Total Remaining */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="absolute top-0 right-0 p-4 text-amber-50 opacity-50 group-hover:scale-110 transition-transform"><AlertCircle size={80} /></div>
                    <div className="relative z-10">
                        <p className="text-slate-500 text-sm font-medium mb-1 flex items-center gap-2"><AlertCircle size={14} className="text-amber-500" /> Còn lại</p>
                        <p className="text-2xl font-bold text-amber-600 tracking-tight">{totalRemaining.toLocaleString('vi-VN')} <span className="text-sm font-normal text-amber-300">đ</span></p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex items-center gap-2 text-slate-700">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <Calendar size={18} />
                    </div>
                    <span className="font-medium text-sm">Khoảng thời gian:</span>
                </div>
                <div className="flex items-center gap-3 flex-1">
                    <DateInput
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                        className="border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm w-40 transition-all font-medium text-slate-600"
                        placeholder="Từ ngày"
                    />
                    <span className="text-slate-300 font-medium">-</span>
                    <DateInput
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                        className="border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm w-40 transition-all font-medium text-slate-600"
                        placeholder="Đến ngày"
                    />
                    {(startDate || endDate) && (
                        <button
                            onClick={() => { setStartDate(''); setEndDate(''); }}
                            className="text-sm text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors font-medium ml-auto"
                        >
                            Xóa bộ lọc
                        </button>
                    )}
                </div>
            </div>

            {/* Transactions List */}
            {isLoading ? (
                <div className="flex justify-center p-12">
                    <div className="animate-spin text-blue-600 w-8 h-8 border-2 border-current border-t-transparent rounded-full"></div>
                </div>
            ) : Object.keys(groupedTransactions).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400">
                    <FileText size={48} className="mb-4 opacity-20" />
                    <p>Không tìm thấy khoản nợ nào trong khoảng thời gian này.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {Object.entries(groupedTransactions).map(([month, txs]) => {
                        const isMonthFullyPaid = txs.every(tx => tx.status === 'PAID');
                        return (
                            <div key={month} className={clsx(
                                "rounded-2xl shadow-sm border overflow-hidden",
                                isMonthFullyPaid ? "bg-emerald-100 border-emerald-200" : "bg-white border-slate-200"
                            )}>
                                <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-8 bg-blue-500 rounded-full"></div>
                                        <h3 className={clsx("font-bold text-lg", isMonthFullyPaid ? "text-emerald-800" : "text-slate-800")}>Tháng {month}</h3>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className={clsx("text-xs font-bold px-2 py-1 rounded-md", isMonthFullyPaid ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600")}>{txs.length} giao dịch</span>
                                        {isMonthFullyPaid && <span className="text-xs font-bold px-2 py-1 rounded-md bg-emerald-100 text-emerald-700">Đã tất toán</span>}
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className={clsx(
                                            "border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left",
                                            isMonthFullyPaid ? "bg-emerald-50/50" : "bg-white"
                                        )}>
                                            <tr>
                                                <th className="px-6 py-3 whitespace-nowrap">Ngày</th>
                                                <th className="px-6 py-3 whitespace-nowrap">Loại dịch vụ</th>
                                                <th className="px-6 py-3 min-w-[300px]">Nội dung</th>
                                                <th className="px-6 py-3 text-right whitespace-nowrap">Tiền vay</th>
                                                <th className="px-6 py-3 text-center whitespace-nowrap">Lãi suất</th>
                                                <th className="px-6 py-3 text-center whitespace-nowrap">Thời gian</th>
                                                <th className="px-6 py-3 text-right whitespace-nowrap">Tiền lãi</th>
                                                <th className="px-6 py-3 text-right whitespace-nowrap">Tổng cộng</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50 text-sm">
                                            {txs.map(tx => {
                                                const typeConfig = configs?.find(c => c.code === tx.type);
                                                const typeName = typeConfig ? typeConfig.name : tx.type;
                                                const calc = tx.interest_calculation;
                                                const total = (tx.amount || 0) + (calc?.rounded_interest || 0);
                                                const isCash = tx.type === 'TIEN_MAT';

                                                return (
                                                    <tr key={tx._id} className={clsx(
                                                        "transition-colors group",
                                                        tx.status === 'PAID' ? "bg-emerald-50 hover:bg-emerald-100" : "hover:bg-blue-50/30"
                                                    )}>
                                                        <td className="px-6 py-4 whitespace-nowrap text-slate-500 font-medium group-hover:text-blue-600 transition-colors">{formatDate(tx.transaction_date)}</td>
                                                        <td className="px-6 py-4">
                                                            <span className={clsx(
                                                                "px-2.5 py-1 rounded-lg text-xs font-bold border",
                                                                isCash
                                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                                    : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                                                            )}>
                                                                {typeName}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-slate-700 font-medium whitespace-pre-wrap leading-relaxed">{tx.content}</td>
                                                        <td className="px-6 py-4 text-right font-mono text-slate-600">{(tx.amount || 0).toLocaleString('vi-VN')}</td>
                                                        <td className="px-6 py-4 text-center text-slate-400 whitespace-nowrap">{tx.interest_rate_snapshot}%</td>
                                                        <td className="px-6 py-4 text-center whitespace-nowrap">
                                                            <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md text-xs font-medium border border-slate-200">
                                                                {(calc?.months || 0).toFixed(1)} tháng
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right font-mono text-orange-600 font-medium">
                                                            +{(calc?.rounded_interest || 0).toLocaleString('vi-VN')}
                                                        </td>
                                                        <td className="px-6 py-4 text-right font-mono font-bold text-slate-900 text-base">
                                                            {(total || 0).toLocaleString('vi-VN')} <span className="text-xs font-sans font-normal text-slate-400">đ</span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                        );
                    })}

                </div >
            )
            }
        </div >
    );
};

export default CustomerDebtDetail;
