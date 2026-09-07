import useScrollLock from '../hooks/useScrollLock';
import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getTransactions, getCustomers, getInterestConfigs, getCustomer, downloadAllTransactionsPdf, downloadDebtReportPdf, getBankAccountConfig, generateVietQRUrl } from '../services/api';
import api from '../services/api'; // Import default api instance
import { useReactToPrint } from 'react-to-print';
import PrintableReport from '../components/PrintableReport';
import PrintableAllTransactions from '../components/PrintableAllTransactions';
import PrintPreviewFrame from '../components/PrintPreviewFrame';
import DataTable from '../components/DataTable';
import { ArrowLeft, Printer, Calendar, X, ChevronRight, FileText, Wallet, Percent, PiggyBank, CheckCircle, AlertCircle, Check, Clock, Search, Download, Loader2, QrCode, Receipt } from 'lucide-react';
import { clsx } from 'clsx';
import DateInput from '../components/DateInput';
import DatePicker from '../components/DatePicker';
import { formatDate } from '../utils/dateUtils';
import { useToast } from '../context/ToastContext';
import { getApiErrorMessage } from '../utils/errorMessage';
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
    const [downloadPdfLoading, setDownloadPdfLoading] = useState(false);

    // Payment Options Menu
    const [paymentMenuOpen, setPaymentMenuOpen] = useState(false);
    const [showQRModal, setShowQRModal] = useState(false);
    useScrollLock(showPreview || showAllTransactionsPreview || bulkPayOpen || showQRModal);
    const [qrCodeUrl, setQrCodeUrl] = useState(null);
    const [isGeneratingQR, setIsGeneratingQR] = useState(false);
    const paymentMenuRef = useRef(null);

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
            showToast('Lỗi', getApiErrorMessage(e, 'Tải PDF tất cả giao dịch'), 'error');
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
            const errorMsg = getApiErrorMessage(err, 'Thanh toán hàng loạt');
            if (errorMsg.toLowerCase().includes('pin') || errorMsg.toLowerCase().includes('mã')) {
                setBulkPinError(errorMsg);
            } else {
                setBulkError(errorMsg);
            }
        }
    });

    // Load bank account config for QR code
    const { data: bankConfig, isLoading: isLoadingBankConfig } = useQuery({
        queryKey: ['bank-account-config'],
        queryFn: getBankAccountConfig,
        staleTime: 1000 * 60 * 5,
    });

    // Calculate total debt amount
    const totalDebtAmount = React.useMemo(() => {
        if (!transactions) return 0;
        return transactions
            .filter(tx => tx.status === 'OPEN')
            .reduce((sum, tx) => {
                const principal = tx.amount || 0;
                const interest = tx.interest_calculation?.rounded_interest || 0;
                return sum + principal + interest;
            }, 0);
    }, [transactions]);

    // Generate QR code for payment
    const handleGenerateQR = async () => {
        if (!bankConfig || !customer) {
            showToast('Thông báo', 'Đang tải cấu hình ngân hàng...', 'info');
            return;
        }

        if (!bankConfig.bank_code || !bankConfig.account_number || !bankConfig.account_holder) {
            showToast('Lỗi', 'Chưa cấu hình thông tin ngân hàng. Vui lòng cấu hình trong Settings.', 'error');
            return;
        }

        setIsGeneratingQR(true);
        try {
            const addInfo = `TT ${customer.name || id}`.substring(0, 23);
            const qrUrl = generateVietQRUrl(
                bankConfig.bank_code,
                bankConfig.account_number,
                bankConfig.account_holder,
                null,
                totalDebtAmount > 0 ? totalDebtAmount : null,
                addInfo
            );
            setQrCodeUrl(qrUrl);
            setShowQRModal(true);
        } catch (error) {
            console.error('Lỗi khi tạo QR code:', error);
            showToast('Lỗi', getApiErrorMessage(error, 'Tạo liên kết mã QR thanh toán'), 'error');
        } finally {
            setIsGeneratingQR(false);
        }
    };

    // Download PDF báo cáo công nợ
    const handleDownloadPdf = async () => {
        if (downloadPdfLoading) return;
        
        setDownloadPdfLoading(true);
        try {
            const { blob, filename } = await downloadDebtReportPdf(id, startDate || undefined, endDate || undefined);
            
            if (!blob || !(blob instanceof Blob)) {
                throw new Error('Dữ liệu PDF không hợp lệ');
            }
            
            if (blob.size === 0) {
                throw new Error('File PDF rỗng');
            }
            
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
            console.error('Download PDF error:', e);
            showToast('Lỗi', getApiErrorMessage(e, 'Tải PDF báo cáo công nợ'), 'error');
        } finally {
            setDownloadPdfLoading(false);
        }
    };

    // Close payment menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (paymentMenuRef.current && !paymentMenuRef.current.contains(event.target)) {
                setPaymentMenuOpen(false);
            }
        };

        if (paymentMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [paymentMenuOpen]);

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

    if (!customer) return <div className="p-4 text-center text-sm text-slate-500">Đang tải dữ liệu khách hàng...</div>;

    return (
        <div className="space-y-4 lg:space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 mb-2 sm:text-sm">
                        <Link to="/customers" className="hover:text-blue-600 transition-colors uppercase tracking-wider font-semibold">Khách hàng</Link>
                        <ChevronRight size={14} className="opacity-50 shrink-0" />
                        <span className="text-slate-900 font-bold uppercase tracking-wider">Chi tiết công nợ</span>
                    </div>
                    <h1 className="section-title">
                        {customer.name}
                    </h1>
                    <p className="text-slate-500 mt-1.5 flex items-start gap-2 text-sm">
                        <span className="mt-1.5 inline-block w-2.5 h-2.5 shrink-0 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200"></span>
                        <span className="min-w-0">{customer.contact_info || 'Không có thông tin liên hệ'}</span>
                    </p>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-row sm:flex-wrap sm:gap-3">
                    {/* Payment Menu Button */}
                    <div className="relative" ref={paymentMenuRef}>
                        <button
                            type="button"
                            onClick={() => setPaymentMenuOpen(!paymentMenuOpen)}
                            className="btn-primary btn-md w-full sm:w-auto"
                        >
                            <Wallet size={18} />
                            Thanh toán
                        </button>
                        
                        {/* Payment Menu Dropdown */}
                        {paymentMenuOpen && (
                            <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                <button
                                    onClick={() => {
                                        setPaymentMenuOpen(false);
                                        handleGenerateQR();
                                    }}
                                    disabled={isGeneratingQR || totalDebtAmount === 0 || isLoadingBankConfig}
                                    className="w-full px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    <QrCode size={16} className="text-teal-600" />
                                    <span>QR thanh toán</span>
                                    {isLoadingBankConfig && <Loader2 size={14} className="animate-spin ml-auto" />}
                                </button>
                                <button
                                    onClick={() => {
                                        setShowPreview(true);
                                        setPaymentMenuOpen(false);
                                    }}
                                    disabled={transactions?.filter(tx => tx.status === 'OPEN').length === 0}
                                    className="w-full px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed border-t border-slate-100 cursor-pointer"
                                >
                                    <Receipt size={16} className="text-blue-600" />
                                    <span>Giao dịch</span>
                                </button>
                                {transactions?.filter(tx => tx.status === 'OPEN').length > 0 && (
                                    <div className="border-t border-slate-100">
                                        <button
                                            onClick={() => {
                                                setBulkPayOpen(true);
                                                setPaymentMenuOpen(false);
                                            }}
                                            className="w-full px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-3 cursor-pointer"
                                        >
                                            <CheckCircle size={16} className="text-emerald-600" />
                                            <span>Xác nhận thanh toán</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowPreview(true)}
                        className="btn-secondary btn-md group w-full sm:w-auto"
                    >
                        <Printer size={18} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
                        <span>In Phiếu Nợ</span>
                    </button>
                    <button
                        type="button"
                        onClick={handleDownloadPdf}
                        disabled={downloadPdfLoading}
                        className="btn-secondary btn-md group w-full sm:w-auto"
                    >
                        {downloadPdfLoading ? (
                            <Loader2 size={18} className="animate-spin text-slate-400" />
                        ) : (
                            <Download size={18} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
                        )}
                        <span>Tải PDF</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowAllTransactionsPreview(true)}
                        className="btn-secondary btn-md group w-full sm:w-auto"
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
                        <div className="p-5 flex-1 overflow-y-auto">
                            <h3 className="text-lg font-bold text-slate-800 mb-2">Xác nhận thanh toán</h3>
                            <p className="text-slate-500 text-sm mb-4 leading-relaxed">
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
                                        className={`input border-2 px-3 py-3 font-mono font-bold text-center text-2xl tracking-[0.35em] text-slate-800 placeholder:text-slate-200 ${
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

                                <div className="flex flex-row gap-2 pt-4 border-t border-slate-50 mt-3">
                                    <button
                                        type="button"
                                        onClick={() => setBulkPayOpen(false)}
                                        className="btn-secondary btn-md flex-1"
                                    >
                                        Hủy bỏ
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={bulkPayMutation.isPending}
                                        className="btn-primary btn-md flex-1"
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
                        <div className="bg-white px-3 py-3 sm:px-4 border-b border-slate-200 flex justify-between items-center gap-2 shadow-sm z-10">
                            <h3 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2 min-w-0">
                                <Printer size={20} className="text-blue-600 shrink-0" />
                                <span className="truncate">Xem trước bản in</span>
                            </h3>
                            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                                <button
                                    onClick={() => handlePrint()}
                                    className="btn-primary btn-md"
                                >
                                    <Printer size={18} /> <span className="hidden sm:inline">In ngay</span>
                                </button>
                                <button
                                    onClick={() => setShowPreview(false)}
                                    className="icon-btn"
                                    aria-label="Đóng xem trước"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        {/* Vùng xem trước — chỉ thu nhỏ hiển thị, PrintableReport giữ nguyên */}
                        <PrintPreviewFrame>
                            <PrintableReport
                                ref={printRef}
                                customer={customer}
                                groupedTransactions={groupedTransactions}
                                transactions={transactions}
                                totalPrincipal={remainingPrincipal}
                                totalInterest={remainingInterest}
                            />
                        </PrintPreviewFrame>
                    </div>
                </div>
            )}

            {/* Print All Transactions Preview Modal */}
            {showAllTransactionsPreview && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 print:hidden">
                    <div className="bg-slate-100 w-full max-w-5xl h-[90vh] rounded-2xl flex flex-col shadow-2xl relative overflow-hidden">
                        {/* Header */}
                        <div className="bg-white px-3 py-3 sm:px-4 border-b border-slate-200 flex justify-between items-center gap-2 shadow-sm z-10">
                            <h3 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2 min-w-0">
                                <FileText size={20} className="text-blue-600 shrink-0" />
                                <span className="truncate">Xem trước tất cả giao dịch</span>
                            </h3>
                            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                                <button
                                    onClick={handleDownloadAllTransactionsPdf}
                                    disabled={downloadAllTransactionsPdfLoading}
                                    className="btn-secondary btn-md"
                                >
                                    {downloadAllTransactionsPdfLoading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                                    <span className="hidden sm:inline">Tải xuống</span>
                                </button>
                                <button
                                    onClick={() => handlePrintAllTransactions()}
                                    className="btn-primary btn-md"
                                >
                                    <Printer size={18} /> <span className="hidden sm:inline">In ngay</span>
                                </button>
                                <button
                                    onClick={() => setShowAllTransactionsPreview(false)}
                                    className="icon-btn"
                                    aria-label="Đóng xem trước"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        {/* Vùng xem trước — chỉ thu nhỏ hiển thị, component in giữ nguyên */}
                        <PrintPreviewFrame>
                            <PrintableAllTransactions
                                ref={printAllTransactionsRef}
                                customer={customer}
                                groupedTransactions={groupedTransactions}
                                transactions={transactions}
                            />
                        </PrintPreviewFrame>
                    </div>
                </div>
            )}

            <div className="filter-row max-w-3xl">
                <div className="date-range-inline min-w-0 flex-1">
                    <div className="min-w-0 flex-1">
                        <DatePicker
                            variant="embedded"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            placeholder="Từ ngày"
                        />
                    </div>
                    <span className="shrink-0 text-sm font-medium text-slate-300">-</span>
                    <div className="min-w-0 flex-1">
                        <DatePicker
                            variant="embedded"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            placeholder="Đến ngày"
                        />
                    </div>
                    {(startDate || endDate) && (
                        <button
                            type="button"
                            onClick={() => {
                                setStartDate('');
                                setEndDate('');
                            }}
                            className="filter-clear-btn"
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
                <div className="space-y-4">
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
                <div className="space-y-4">
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
                                    "rounded-xl shadow-sm border overflow-hidden",
                                    isMonthFullyPaid ? "bg-emerald-100 border-emerald-200" : "bg-white border-slate-200"
                                )}>
                                    <div className="bg-slate-50/50 px-4 py-3 border-b border-slate-100 flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-6 bg-blue-500 rounded-full"></div>
                                            <h3 className={clsx("font-bold text-base", isMonthFullyPaid ? "text-emerald-800" : "text-slate-800")}>Tháng {month}</h3>
                                        </div>
                                        <div className="flex gap-2">
                                            <span className={clsx("text-xs font-semibold px-2 py-1 rounded-md", isMonthFullyPaid ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600")}>{sortedTxs.length} giao dịch</span>
                                            {isMonthFullyPaid && <span className="text-xs font-semibold px-2 py-1 rounded-md bg-emerald-100 text-emerald-700">Đã tất toán</span>}
                                        </div>
                                    </div>

                                    <DataTable
                                        rows={sortedTxs}
                                        getRowKey={(tx) => tx._id}
                                        caption={`Giao dịch tháng ${month}`}
                                        tableMinWidth="min-w-[56rem]"
                                        rowClassName={(tx) => (tx.status === 'PAID'
                                            ? 'bg-emerald-50 hover:bg-emerald-100'
                                            : 'hover:bg-blue-50/30')}
                                        columns={[
                                            {
                                                id: 'content',
                                                header: 'Nội dung',
                                                priority: 1,
                                                cellClassName: 'text-slate-700 font-medium leading-relaxed min-w-[15rem]',
                                                // whitespace-pre-wrap đặt trong cell để giữ xuống dòng ở CẢ bảng lẫn thẻ
                                                cell: (tx) => <span className="whitespace-pre-wrap">{tx.content}</span>,
                                            },
                                            {
                                                id: 'date',
                                                header: 'Ngày',
                                                priority: 2,
                                                cellClassName: 'whitespace-nowrap text-slate-500 font-medium',
                                                cell: (tx) => formatDate(tx.transaction_date),
                                            },
                                            {
                                                id: 'type',
                                                header: 'Loại dịch vụ',
                                                priority: 2,
                                                cell: (tx) => {
                                                    const typeConfig = configs?.find(c => c.code === tx.type);
                                                    return (
                                                        <span className={clsx(
                                                            "inline-block px-2.5 py-1 rounded-lg text-xs font-bold border",
                                                            tx.type === 'TIEN_MAT'
                                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                                : 'bg-blue-50 text-blue-700 border-blue-100'
                                                        )}>
                                                            {typeConfig ? typeConfig.name : tx.type}
                                                        </span>
                                                    );
                                                },
                                            },
                                            {
                                                id: 'principal',
                                                header: 'Tiền gốc',
                                                priority: 2,
                                                align: 'right',
                                                cellClassName: 'font-mono text-slate-600 whitespace-nowrap',
                                                cell: (tx) => (tx.amount || 0).toLocaleString('vi-VN'),
                                            },
                                            {
                                                id: 'rate',
                                                header: 'Lãi suất',
                                                priority: 3,
                                                align: 'center',
                                                cellClassName: 'text-slate-400 whitespace-nowrap',
                                                cell: (tx) => `${tx.interest_rate_snapshot}%`,
                                            },
                                            {
                                                id: 'months',
                                                header: 'Thời gian',
                                                priority: 3,
                                                align: 'center',
                                                cellClassName: 'whitespace-nowrap',
                                                cell: (tx) => (
                                                    <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md text-xs font-medium border border-slate-200">
                                                        {(tx.interest_calculation?.months || 0).toFixed(1)} tháng
                                                    </span>
                                                ),
                                            },
                                            {
                                                id: 'interest',
                                                header: 'Tiền lãi',
                                                priority: 2,
                                                align: 'right',
                                                cellClassName: 'font-mono text-blue-600 font-medium whitespace-nowrap',
                                                cell: (tx) => `+${(tx.interest_calculation?.rounded_interest || 0).toLocaleString('vi-VN')}`,
                                            },
                                            {
                                                id: 'total',
                                                header: 'Tổng cộng',
                                                priority: 1,
                                                align: 'right',
                                                cellClassName: 'font-mono font-semibold text-slate-900 whitespace-nowrap',
                                                cell: (tx) => (
                                                    <>
                                                        {((tx.amount || 0) + (tx.interest_calculation?.rounded_interest || 0)).toLocaleString('vi-VN')}
                                                        {' '}
                                                        <span className="text-xs font-sans font-normal text-slate-400">đ</span>
                                                    </>
                                                ),
                                            },
                                        ]}
                                    />
                                </div>
                            );
                        })}
                </div>
            )
            }

            {/* QR Code Payment Modal */}
            {showQRModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[70] p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                        <div className="shrink-0 flex items-start justify-between gap-3 p-4 border-b border-slate-100">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="shrink-0 w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
                                    <QrCode size={20} className="text-teal-600" />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-base font-bold text-slate-800">Mã QR thanh toán</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">Quét mã để chuyển khoản</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowQRModal(false);
                                    setQrCodeUrl(null);
                                }}
                                className="shrink-0 p-2 -m-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                aria-label="Đóng"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4">
                            {qrCodeUrl ? (
                                <div className="flex flex-col items-center justify-center space-y-3">
                                    <div className="bg-white p-3 rounded-lg shadow-md border border-slate-200">
                                        <img
                                            src={qrCodeUrl}
                                            alt="Mã QR thanh toán"
                                            className="w-64 h-64"
                                        />
                                    </div>
                                    <div className="text-center space-y-2">
                                        <p className="text-sm font-semibold text-slate-700">Số tiền: {totalDebtAmount.toLocaleString('vi-VN')} đ</p>
                                        {bankConfig && (
                                            <>
                                                <p className="text-xs text-slate-500 font-mono">{bankConfig.account_number}</p>
                                                <p className="text-xs text-slate-600">{bankConfig.account_holder}</p>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center space-y-3 py-8 px-4">
                                    <Loader2 size={36} className="animate-spin text-slate-400" />
                                    <p className="text-sm text-slate-500">Đang tạo mã QR...</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerDebtDetail;
