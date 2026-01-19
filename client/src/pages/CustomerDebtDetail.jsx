import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getTransactions, getCustomers, getInterestConfigs, getCustomer, downloadAllTransactionsPdf } from '../services/api';
import api from '../services/api'; // Import default api instance
import { useReactToPrint } from 'react-to-print';
import PrintableReport from '../components/PrintableReport';
import PrintableAllTransactions from '../components/PrintableAllTransactions';
import { ArrowLeft, Printer, Calendar, X, ChevronRight, FileText, Wallet, Percent, PiggyBank, CheckCircle, AlertCircle, Check, Clock, Search, Download, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import DateInput from '../components/DateInput';
import DatePicker from '../components/DatePicker';
import { formatDate } from '../utils/dateUtils';
import { useToast } from '../context/ToastContext';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { EmptyStates } from '../components/EmptyState';
import { ErrorStates } from '../components/ErrorState';

const CustomerDebtDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [showPreview, setShowPreview] = useState(false);
    const [showAllTransactionsPreview, setShowAllTransactionsPreview] = useState(false);

    // Bulk Pay State
    const [bulkPayOpen, setBulkPayOpen] = useState(false);
    const [bulkPin, setBulkPin] = useState('');
    const [bulkDate, setBulkDate] = useState(new Date().toISOString().split('T')[0]);
    const [bulkError, setBulkError] = useState('');
    const [bulkPinError, setBulkPinError] = useState('');

    // Print Refs
    const printRef = useRef();
    const printAllTransactionsRef = useRef();
    const [downloadAllTransactionsPdfLoading, setDownloadAllTransactionsPdfLoading] = useState(false);

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Bao_cao_cong_no_${id}`,
    });

    const handlePrintAllTransactions = useReactToPrint({
        contentRef: printAllTransactionsRef,
        documentTitle: `Tat_ca_giao_dich_${id}`,
    });

    const handleDownloadAllTransactionsPdf = async () => {
        // Prevent multiple simultaneous downloads
        if (downloadAllTransactionsPdfLoading) return;
        
        setDownloadAllTransactionsPdfLoading(true);
        try {
            const { blob, filename } = await downloadAllTransactionsPdf(id, startDate || undefined, endDate || undefined);
            
            // Validate blob
            if (!blob || !(blob instanceof Blob)) {
                throw new Error('Dữ liệu PDF không hợp lệ');
            }
            
            // Check if blob is empty
            if (blob.size === 0) {
                throw new Error('File PDF rỗng');
            }
            
            // Create download link
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            showToast('Thành công', 'File PDF đã được tải xuống', 'success');
        } catch (e) {
            console.error('Download All Transactions PDF error:', e);
            const errorMessage = e?.message || e?.response?.data?.error || 'Không thể tải PDF';
            showToast('Lỗi', errorMessage, 'error');
        } finally {
            setDownloadAllTransactionsPdfLoading(false);
        }
    };

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

    const { data: transactions, isLoading, error: transactionsError, refetch: refetchTransactions } = useQuery({
        queryKey: ['transactions', id, startDate, endDate],
        queryFn: () => getTransactions(id, startDate || undefined, endDate || undefined),
        enabled: !!id,
        retry: 1
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
            setBulkPinError('');

            showToast('Thành công', `Đã thanh toán ${data.count} giao dịch`, 'success');
        },
        onError: (err) => {
            const errorMsg = err.response?.data?.detail || err.response?.data?.error || "Lỗi thanh toán";
            if (errorMsg.toLowerCase().includes('pin') || errorMsg.toLowerCase().includes('mã')) {
                setBulkPinError(errorMsg);
            } else {
                setBulkError(errorMsg);
            }
        }
    });

    const handleBulkPay = (e) => {
        e.preventDefault();
        setBulkError('');
        setBulkPinError('');

        // Validate PIN
        const pin = bulkPin.trim();
        if (!pin) {
            setBulkPinError('Vui lòng nhập mã PIN');
            return;
        }
        if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
            setBulkPinError('PIN phải là 4 chữ số');
            return;
        }

        // Validate date
        if (!bulkDate) {
            setBulkError('Vui lòng chọn ngày thanh toán');
            return;
        }
        const payDate = new Date(bulkDate);
        if (isNaN(payDate.getTime())) {
            setBulkError('Ngày thanh toán không hợp lệ');
            return;
        }
        bulkPayMutation.mutate({
            customer_id: id,
            payment_date: bulkDate,
            pin: pin
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
        <div className="space-y-4 lg:space-y-6">
            {/* Header */}
            <div className="flex flex-row items-center justify-between gap-4 lg:gap-6">
                <div>
                    <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                        <Link to="/customers" className="hover:text-blue-600 transition-colors uppercase tracking-wider font-semibold">Khách hàng</Link>
                        <ChevronRight size={14} className="opacity-50" />
                        <span className="text-slate-900 font-bold uppercase tracking-wider">Chi tiết công nợ</span>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                        {customer.name}
                    </h1>
                    <p className="text-slate-500 mt-1.5 flex items-center gap-2 text-sm">
                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200"></span>
                        {customer.contact_info || 'Không có thông tin liên hệ'}
                    </p>
                </div>
                <div className="flex flex-row gap-3">
                    <button
                        onClick={() => setBulkPayOpen(true)}
                        className="btn btn-primary btn-md"
                    >
                        <Wallet size={18} />
                        Thanh toán tất cả
                    </button>
                    <button
                        onClick={() => setShowPreview(true)}
                        className="btn btn-secondary btn-md group"
                    >
                        <Printer size={18} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
                        <span>In Phiếu Nợ</span>
                    </button>
                    <button
                        onClick={() => setShowAllTransactionsPreview(true)}
                        className="btn btn-secondary btn-md group"
                    >
                        <FileText size={18} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
                        <span>In tất cả GD</span>
                    </button>
                </div>
            </div>

            {/* Bulk Pay Modal */}
            {bulkPayOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl w-full h-auto max-w-sm shadow-2xl overflow-hidden flex flex-col animate-in zoom-in duration-200">
                        <div className="p-6 flex-1 overflow-y-auto">
                            <h3 className="text-xl font-bold text-slate-800 mb-2">Xác nhận thanh toán</h3>
                            <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                                Bạn đang thực hiện thanh toán cho <b className="text-slate-800">tất cả các khoản nợ</b> của khách hàng này.
                                Vui lòng nhập ngày thanh toán và mã PIN xác thực.
                            </p>

                            <form onSubmit={handleBulkPay} className="space-y-4 lg:space-y-6">
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
                                        className={`input border-2 px-4 py-5 font-mono font-bold text-center text-4xl tracking-[0.5em] text-slate-800 placeholder:text-slate-200 ${
                                            bulkPinError ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-100'
                                        }`}
                                        value={bulkPin}
                                        onChange={e => {
                                            setBulkPin(e.target.value.replace(/\D/g, ''));
                                            setBulkPinError('');
                                        }}
                                        aria-invalid={!!bulkPinError}
                                        aria-describedby={bulkPinError ? 'bulk-pin-error' : undefined}
                                    />
                                    {bulkPinError && (
                                        <p id="bulk-pin-error" className="text-xs text-red-600 mt-1 text-center">
                                            {bulkPinError}
                                        </p>
                                    )}
                                </div>

                                {bulkError && (
                                    <div className="text-red-500 text-xs font-bold bg-red-50 p-3 rounded-xl text-center border border-red-100 animate-in fade-in slide-in-from-top-1">
                                        {bulkError}
                                    </div>
                                )}

                                <div className="flex flex-row gap-3 pt-6 border-t border-slate-50 mt-4">
                                    <button
                                        type="button"
                                        onClick={() => setBulkPayOpen(false)}
                                        className="flex-1 btn btn-secondary btn-md"
                                    >
                                        Hủy bỏ
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={bulkPayMutation.isPending}
                                        className="flex-1 btn btn-primary btn-md"
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

            {/* Print All Transactions Preview Modal */}
            {showAllTransactionsPreview && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 print:hidden">
                    <div className="bg-slate-100 w-full max-w-5xl h-[90vh] rounded-2xl flex flex-col shadow-2xl relative overflow-hidden">
                        {/* Header */}
                        <div className="bg-white px-6 py-4 border-b border-slate-200 flex justify-between items-center shadow-sm z-10">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <FileText className="text-blue-600" /> Xem trước tất cả giao dịch
                            </h3>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleDownloadAllTransactionsPdf}
                                    disabled={downloadAllTransactionsPdfLoading}
                                    className="btn btn-secondary btn-md"
                                >
                                    {downloadAllTransactionsPdfLoading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                                    Tải xuống
                                </button>
                                <button
                                    onClick={() => handlePrintAllTransactions()}
                                    className="btn btn-primary btn-md"
                                >
                                    <Printer size={18} /> In ngay
                                </button>
                                <button
                                    onClick={() => setShowAllTransactionsPreview(false)}
                                    className="icon-btn"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        {/* Scrollable Preview Area */}
                        <div className="flex-1 overflow-y-auto p-8 bg-slate-200/50 flex justify-center">
                            <div className="shadow-xl bg-white animate-in zoom-in-95 duration-300">
                                <PrintableAllTransactions
                                    ref={printAllTransactionsRef}
                                    customer={customer}
                                    groupedTransactions={groupedTransactions}
                                    transactions={transactions}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters - Inline Style */}
            <div className="flex items-center gap-1.5 border-b-2 border-slate-200 pb-2 focus-within:border-blue-500 transition-colors">
                <div className="flex flex-1 items-center gap-1.5">
                    <div className="flex-1 min-w-0">
                        <DatePicker
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                            placeholder="Từ ngày"
                        />
                    </div>
                    <span className="text-slate-300 text-base font-medium shrink-0">-</span>
                    <div className="flex-1 min-w-0">
                        <DatePicker
                            value={endDate}
                            onChange={e => setEndDate(e.target.value)}
                            placeholder="Đến ngày"
                        />
                    </div>
                    {(startDate || endDate) && (
                        <button
                            onClick={() => { setStartDate(''); setEndDate(''); }}
                            className="ml-1 p-1.5 min-w-[32px] min-h-[32px] flex items-center justify-center text-red-500 hover:bg-red-50 rounded-md transition-colors shrink-0"
                            title="Xóa lọc"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
            </div>

            {/* Transactions List */}
            {transactionsError ? (
                <ErrorStates.Network
                    error={transactionsError}
                    onRetry={refetchTransactions}
                    showDetails={true}
                />
            ) : isLoading ? (
                <div className="space-y-6">
                    <LoadingSkeleton.Table rows={5} columns={8} />
                    <LoadingSkeleton.Table rows={4} columns={8} />
                </div>
            ) : Object.keys(groupedTransactions).length === 0 ? (
                (startDate || endDate) ? (
                    <EmptyStates.NoResults
                        action={() => { setStartDate(''); setEndDate(''); }}
                        actionLabel="Xóa bộ lọc"
                    />
                ) : (
                    <EmptyStates.NoTransactions />
                )
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
                                        <table className="w-full">
                                            <thead className={clsx(
                                                "border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider text-left",
                                                isMonthFullyPaid ? "bg-emerald-50/50" : "bg-white"
                                            )}>
                                                <tr>
                                                    <th className="px-6 py-3 whitespace-nowrap">Ngày</th>
                                                    <th className="px-6 py-3 whitespace-nowrap">Loại dịch vụ</th>
                                                    <th className="px-6 py-3 min-w-[300px]">Nội dung</th>
                                                    <th className="px-6 py-3 text-right whitespace-nowrap">Tiền gốc</th>
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
                </div>
            )
            }
        </div >
    );
};

export default CustomerDebtDetail;
