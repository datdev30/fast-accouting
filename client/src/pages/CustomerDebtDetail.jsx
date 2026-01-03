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

    // Group by month (Ascending for Print - Oldest First)
    const groupedTransactions = React.useMemo(() => {
        if (!transactions || !Array.isArray(transactions)) return {};
        const sortedTxs = [...transactions].sort((a, b) => new Date(a.transaction_date) - new Date(b.transaction_date));
        const groups = {};
        sortedTxs.forEach(tx => {
            const date = new Date(tx.transaction_date);
            if (isNaN(date.getTime())) {
                if (!groups['Khác']) groups['Khác'] = [];
                groups['Khác'].push(tx);
                return;
            }
            const displayKey = `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
            if (!groups[displayKey]) groups[displayKey] = [];
            groups[displayKey].push(tx);
        });
        return groups;
    }, [transactions]);

    // Group by month (Ascending for Display - Oldest First)
    const groupedTransactionsDisplay = React.useMemo(() => {
        if (!transactions || !Array.isArray(transactions)) return {};
        const sortedTxs = [...transactions].sort((a, b) => new Date(a.transaction_date) - new Date(b.transaction_date));
        const groups = {};
        sortedTxs.forEach(tx => {
            const date = new Date(tx.transaction_date);
            if (isNaN(date.getTime())) {
                if (!groups['Khác']) groups['Khác'] = [];
                groups['Khác'].push(tx);
                return;
            }
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
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 mb-2">
                        <Link to="/customers" className="hover:text-blue-600 transition-colors uppercase tracking-wider font-semibold">Khách hàng</Link>
                        <ChevronRight size={14} className="opacity-50" />
                        <span className="text-slate-900 font-bold uppercase tracking-wider">Chi tiết công nợ</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                        {customer.name}
                    </h1>
                    <p className="text-slate-500 mt-1.5 flex items-center gap-2 text-sm">
                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200"></span>
                        {customer.contact_info || 'Không có thông tin liên hệ'}
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={() => setBulkPayOpen(true)}
                        className="w-full sm:w-auto btn btn-primary btn-md"
                    >
                        <Wallet size={18} />
                        Thanh toán tất cả
                    </button>
                    <button
                        onClick={() => setShowPreview(true)}
                        className="w-full sm:w-auto btn btn-secondary btn-md group"
                    >
                        <Printer size={18} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
                        <span>In Phiếu Nợ</span>
                    </button>
                </div>
            </div>

            {/* Bulk Pay Modal */}
            {bulkPayOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[60] p-0 sm:p-4 animate-in fade-in duration-200">
                    <div className="bg-white sm:rounded-2xl w-full h-full sm:h-auto sm:max-w-sm shadow-2xl overflow-hidden flex flex-col sm:animate-in sm:zoom-in sm:duration-200">
                        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center sm:hidden">
                            <h3 className="text-base font-bold text-slate-800">Thanh toán tất cả</h3>
                            <button onClick={() => setBulkPayOpen(false)} className="p-1 hover:bg-slate-100 rounded-full transition-colors">
                                <X size={24} className="text-slate-400" />
                            </button>
                        </div>

                        <div className="p-6 flex-1 overflow-y-auto">
                            <h3 className="hidden sm:block text-xl font-bold text-slate-800 mb-2">Xác nhận thanh toán</h3>
                            <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                                Bạn đang thực hiện thanh toán cho <b className="text-slate-800">tất cả các khoản nợ</b> của khách hàng này.
                                Vui lòng nhập ngày thanh toán và mã PIN xác thực.
                            </p>

                            <form onSubmit={handleBulkPay} className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 ml-1 tracking-widest">Ngày thanh toán</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                            <Calendar size={18} />
                                        </div>
                                        <DateInput
                                            required
                                            className="input input-icon"
                                            value={bulkDate}
                                            onChange={e => setBulkDate(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 ml-1 tracking-widest">Mã PIN xác thực</label>
                                    <input
                                        type="password"
                                        required
                                        autoFocus
                                        inputMode="numeric"
                                        maxLength={4}
                                        placeholder="••••"
                                        className="input border-2 border-slate-100 px-4 py-4 font-mono font-bold text-center text-3xl tracking-[0.5em] text-slate-800 placeholder:text-slate-200"
                                        value={bulkPin}
                                        onChange={e => setBulkPin(e.target.value.replace(/\D/g, ''))}
                                    />
                                </div>

                                {bulkError && (
                                    <div className="text-red-500 text-xs font-bold bg-red-50 p-3 rounded-xl text-center border border-red-100 animate-in fade-in slide-in-from-top-1">
                                        {bulkError}
                                    </div>
                                )}

                                <div className="flex flex-col sm:flex-row gap-3 pt-6 sm:border-t sm:border-slate-50 mt-4">
                                    <button
                                        type="button"
                                        onClick={() => setBulkPayOpen(false)}
                                        className="hidden sm:block flex-1 btn btn-secondary btn-md"
                                    >
                                        Hủy bỏ
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={bulkPayMutation.isPending}
                                        className="w-full sm:flex-1 btn btn-primary btn-md"
                                    >
                                        {bulkPayMutation.isPending ? 'Đang xử lý...' : 'Xác nhận ngay'}
                                    </button>
                                </div>
                            </form>
                        </div>
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
                                    className="btn btn-primary btn-md"
                                >
                                    <Printer size={18} /> In ngay
                                </button>
                                <button
                                    onClick={() => setShowPreview(false)}
                                    className="icon-btn"
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
                    <div className="absolute top-0 right-0 p-4 text-blue-50 opacity-50 group-hover:scale-110 transition-transform"><Percent size={80} /></div>
                    <div className="relative z-10">
                        <p className="text-slate-500 text-sm font-medium mb-1 flex items-center gap-2"><Percent size={14} className="text-blue-600" /> Tổng tiền lãi</p>
                        <p className="text-2xl font-bold text-slate-900 tracking-tight">{lifetimeInterest.toLocaleString('vi-VN')} <span className="text-sm font-normal text-slate-400">đ</span></p>
                    </div>
                </div>

                {/* 3. Lifetime Total Payment */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="absolute top-0 right-0 p-4 text-blue-50 opacity-50 group-hover:scale-110 transition-transform"><PiggyBank size={80} /></div>
                    <div className="relative z-10">
                        <p className="text-slate-500 text-sm font-medium mb-1 flex items-center gap-2"><PiggyBank size={14} className="text-blue-600" /> Tổng tiền</p>
                        <p className="text-2xl font-bold text-slate-900 tracking-tight">{(lifetimePrincipal + lifetimeInterest).toLocaleString('vi-VN')} <span className="text-sm font-normal text-slate-400">đ</span></p>
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
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-stretch md:items-center gap-4">
                <div className="flex items-center gap-2 text-slate-700">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <Calendar size={18} />
                    </div>
                    <span className="font-bold text-sm uppercase tracking-wider">Thời gian:</span>
                </div>
                <div className="flex items-center gap-2">
                    <DateInput
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                        className="w-36 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-700 text-sm transition-all"
                        placeholder="Từ ngày"
                    />
                    <span className="text-slate-300 font-bold">-</span>
                    <DateInput
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                        className="w-36 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-700 text-sm transition-all"
                        placeholder="Đến ngày"
                    />
                    {(startDate || endDate) && (
                        <button
                            onClick={() => { setStartDate(''); setEndDate(''); }}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                            title="Xóa lọc"
                        >
                            <X size={18} />
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
                    {Object.entries(groupedTransactionsDisplay)
                        .sort(([keyA], [keyB]) => {
                            if (keyA === 'Khác') return 1;
                            if (keyB === 'Khác') return -1;
                            const [mA, yA] = keyA.split('/').map(Number);
                            const [mB, yB] = keyB.split('/').map(Number);
                            return new Date(yA, mA - 1) - new Date(yB, mB - 1);
                        })
                        .map(([month, txs]) => {
                            const sortedTxs = [...txs].sort((a, b) => new Date(a.transaction_date) - new Date(b.transaction_date));
                            const isMonthFullyPaid = sortedTxs.every(tx => tx.status === 'PAID');
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
                                            <span className={clsx("text-xs font-semibold px-2 py-1 rounded-md", isMonthFullyPaid ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600")}>{sortedTxs.length} giao dịch</span>
                                            {isMonthFullyPaid && <span className="text-xs font-semibold px-2 py-1 rounded-md bg-emerald-100 text-emerald-700">Đã tất toán</span>}
                                        </div>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[900px]">
                                            <thead className={clsx(
                                                "border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider text-left",
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
                                                {sortedTxs.map(tx => {
                                                    const typeConfig = configs?.find(c => c.code === tx.type);
                                                    const typeName = typeConfig ? typeConfig.name : tx.type;
                                                    const calc = tx.interest_calculation;
                                                    const total = (tx.amount || 0) + (calc?.rounded_interest || 0);
                                                    const isCash = tx.type === 'TIEN_MAT';

                                                    return (
                                                        <tr
                                                            key={tx._id}
                                                            className={clsx(
                                                                "transition-colors group",
                                                                tx.status === 'PAID' ? "bg-emerald-50 hover:bg-emerald-100" : "hover:bg-blue-50/30"
                                                            )}
                                                        >
                                                            <td className="px-6 py-4 whitespace-nowrap text-slate-500 font-medium group-hover:text-blue-600 transition-colors">
                                                                {formatDate(tx.transaction_date)}
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className={clsx(
                                                                    "px-2.5 py-1 rounded-lg text-xs font-bold border",
                                                                    isCash
                                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                                        : 'bg-blue-50 text-blue-700 border-blue-100'
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
                                                            <td className="px-6 py-4 text-right font-mono text-blue-600 font-medium">
                                                                +{(calc?.rounded_interest || 0).toLocaleString('vi-VN')}
                                                            </td>
                                                            <td className="px-6 py-4 text-right font-mono font-semibold text-slate-900 text-base">
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
