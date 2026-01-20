import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getTransactions, getCustomers, getInterestConfigs, getCustomer, downloadDebtReportPdf, downloadAllTransactionsPdf, getBankAccountConfig, generateVietQRUrl } from '../services/api';
import api from '../services/api'; // Import default api instance
import { useReactToPrint } from 'react-to-print';
import PrintableReport from '../components/PrintableReport';
import PrintableAllTransactions from '../components/PrintableAllTransactions';
import { ArrowLeft, Printer, Calendar, X, ChevronRight, FileText, Wallet, Percent, PiggyBank, CheckCircle, AlertCircle, Check, Clock, Search, Lock, Download, Loader2, QrCode, Receipt } from 'lucide-react';
import { clsx } from 'clsx';
import DateInput from '../components/DateInput';
import DatePicker from '../components/DatePicker';
import { formatDate } from '../utils/dateUtils';
import { useToast } from '../context/ToastContext';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { EmptyStates } from '../components/EmptyState';
import { ErrorStates } from '../components/ErrorState';
import { downloadFile } from '../utils/fileDownload';

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

    // Payment Options Menu
    const [paymentMenuOpen, setPaymentMenuOpen] = useState(false);
    const [showQRModal, setShowQRModal] = useState(false);
    const [showDebtPreview, setShowDebtPreview] = useState(false);
    const [qrCodeUrl, setQrCodeUrl] = useState(null);
    const [isGeneratingQR, setIsGeneratingQR] = useState(false);
    const paymentMenuRef = useRef(null);

    // Print Refs
    const printRef = useRef();
    const printAllTransactionsRef = useRef();
    const [downloadPdfLoading, setDownloadPdfLoading] = useState(false);
    const [downloadAllTransactionsPdfLoading, setDownloadAllTransactionsPdfLoading] = useState(false);

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Bao_cao_cong_no_${id}`,
    });

    const handlePrintAllTransactions = useReactToPrint({
        contentRef: printAllTransactionsRef,
        documentTitle: `Tat_ca_giao_dich_${id}`,
    });

    const handleDownloadPdf = async () => {
        // Prevent multiple simultaneous downloads
        if (downloadPdfLoading) return;
        
        setDownloadPdfLoading(true);
        try {
            const { blob, filename } = await downloadDebtReportPdf(id, startDate || undefined, endDate || undefined);
            
            // Validate blob
            if (!blob || !(blob instanceof Blob)) {
                throw new Error('Dữ liệu PDF không hợp lệ');
            }
            
            // Check if blob is empty
            if (blob.size === 0) {
                throw new Error('File PDF rỗng');
            }
            
            // Check if blob is actually a PDF (basic validation)
            if (blob.type && !blob.type.includes('pdf') && !blob.type.includes('application/octet-stream')) {
                console.warn('Warning: Blob type is not PDF:', blob.type);
            }
            
            await downloadFile(blob, filename);
            
            // Thông báo khác nhau tùy vào nơi file được lưu
            const isAndroid = /Android/i.test(navigator.userAgent);
            if (isAndroid) {
                showToast('Thành công', 'File PDF đã được lưu. Vui lòng chọn ứng dụng để mở hoặc lưu vào thư mục Download.', 'success');
            } else {
                showToast('Thành công', 'File PDF đã được lưu. Vui lòng chọn ứng dụng để mở hoặc lưu file.', 'success');
            }
        } catch (e) {
            console.error('Download PDF error:', e);
            const errorMessage = e?.message || e?.response?.data?.error || 'Không thể tải PDF';
            showToast('Lỗi', errorMessage, 'error');
        } finally {
            setDownloadPdfLoading(false);
        }
    };

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
            
            // Check if blob is actually a PDF (basic validation)
            if (blob.type && !blob.type.includes('pdf') && !blob.type.includes('application/octet-stream')) {
                console.warn('Warning: Blob type is not PDF:', blob.type);
            }
            
            await downloadFile(blob, filename);
            
            // Thông báo khác nhau tùy vào nơi file được lưu
            const isAndroid = /Android/i.test(navigator.userAgent);
            if (isAndroid) {
                showToast('Thành công', 'File PDF đã được lưu. Vui lòng chọn ứng dụng để mở hoặc lưu vào thư mục Download.', 'success');
            } else {
                showToast('Thành công', 'File PDF đã được lưu. Vui lòng chọn ứng dụng để mở hoặc lưu file.', 'success');
            }
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
            setBulkError(err.response?.data?.error || err.response?.data?.detail || "Lỗi thanh toán");
        }
    });

    // Load bank account config for QR code (load ngay từ đầu để có sẵn khi cần)
    const { data: bankConfig, isLoading: isLoadingBankConfig } = useQuery({
        queryKey: ['bank-account-config'],
        queryFn: getBankAccountConfig,
        staleTime: 1000 * 60 * 5, // Cache 5 phút
    });

    // Reset lỗi PIN khi mở modal thanh toán
    useEffect(() => {
        if (bulkPayOpen) {
            setBulkPinError('');
            setBulkError('');
        }
    }, [bulkPayOpen]);

    // Đóng payment menu khi click outside
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

    // Tính tổng công nợ chính xác (chỉ các giao dịch OPEN)
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

    // Lọc các giao dịch đang nợ (chỉ OPEN)
    const debtTransactions = React.useMemo(() => {
        if (!transactions) return [];
        return transactions.filter(tx => tx.status === 'OPEN');
    }, [transactions]);

    // Group debt transactions by month
    const groupedDebtTransactions = React.useMemo(() => {
        if (!debtTransactions || !Array.isArray(debtTransactions)) return {};
        const sortedTxs = [...debtTransactions].sort((a, b) => new Date(a.transaction_date) - new Date(b.transaction_date));
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
    }, [debtTransactions]);

    // Tính tổng principal và interest cho các giao dịch nợ
    const debtTotalPrincipal = React.useMemo(() => {
        return debtTransactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);
    }, [debtTransactions]);

    const debtTotalInterest = React.useMemo(() => {
        return debtTransactions.reduce((sum, tx) => sum + (tx.interest_calculation?.rounded_interest || 0), 0);
    }, [debtTransactions]);

    // Tạo QR code với số tiền động
    const handleGenerateQR = async () => {
        // Kiểm tra nếu đang load bankConfig
        if (isLoadingBankConfig) {
            showToast('Thông báo', 'Đang tải cấu hình ngân hàng...', 'info');
            return;
        }

        // Kiểm tra cấu hình ngân hàng
        if (!bankConfig) {
            showToast('Lỗi', 'Chưa có cấu hình tài khoản ngân hàng. Vui lòng vào Cài đặt > Cấu hình STK để thiết lập.', 'error');
            return;
        }

        if (!bankConfig.bank_code || !bankConfig.account_number || !bankConfig.account_holder) {
            showToast('Lỗi', 'Cấu hình tài khoản ngân hàng chưa đầy đủ. Vui lòng kiểm tra lại trong Cài đặt > Cấu hình STK.', 'error');
            return;
        }

        if (totalDebtAmount === 0) {
            showToast('Lỗi', 'Không có công nợ để thanh toán', 'error');
            return;
        }

        setIsGeneratingQR(true);
        try {
            const template = '9DVkSUh';
            const addInfo = `TT ${customer?.name || id}`.substring(0, 23); // Giới hạn 23 ký tự
            
            const qrUrl = generateVietQRUrl(
                bankConfig.bank_code,
                bankConfig.account_number,
                bankConfig.account_holder,
                template,
                totalDebtAmount, // Số tiền động = tổng công nợ
                addInfo
            );
            
            setQrCodeUrl(qrUrl);
            setShowQRModal(true);
        } catch (error) {
            console.error('Lỗi khi tạo QR code:', error);
            showToast('Lỗi', 'Không thể tạo mã QR. Vui lòng thử lại.', 'error');
        } finally {
            setIsGeneratingQR(false);
        }
    };

    const handleBulkPay = (e) => {
        e.preventDefault();
        setBulkError('');
        setBulkPinError('');

        // Validation mã PIN
        const pin = bulkPin.trim();
        if (!pin) {
            setBulkPinError('Vui lòng nhập mã PIN');
            return;
        }
        if (pin.length !== 4) {
            setBulkPinError('Mã PIN phải có đúng 4 chữ số');
            return;
        }

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
            <div className="flex flex-row items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                        <Link to="/customers" className="hover:text-teal-600 transition-colors uppercase tracking-wider font-semibold">Khách hàng</Link>
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
                <div className="flex flex-row gap-2 flex-wrap">
                    {/* Payment Menu Button */}
                    <div className="relative" ref={paymentMenuRef}>
                        <button
                            onClick={() => setPaymentMenuOpen(!paymentMenuOpen)}
                            className="btn btn-primary btn-sm w-auto lg:w-auto"
                        >
                            <Wallet size={14} />
                            <span className="lg:hidden">Thanh toán</span>
                            <span className="hidden lg:inline">Thanh toán</span>
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
                                    className="w-full px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <QrCode size={16} className="text-teal-600" />
                                    <span>QR thanh toán</span>
                                    {isLoadingBankConfig && <Loader2 size={14} className="animate-spin ml-auto" />}
                                </button>
                                <button
                                    onClick={() => {
                                        setShowDebtPreview(true);
                                        setPaymentMenuOpen(false);
                                    }}
                                    disabled={debtTransactions.length === 0}
                                    className="w-full px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed border-t border-slate-100"
                                >
                                    <Receipt size={16} className="text-blue-600" />
                                    <span>Giao dịch</span>
                                </button>
                                {debtTransactions.length > 0 && (
                                    <div className="border-t border-slate-100">
                                        <button
                                            onClick={() => {
                                                setBulkPayOpen(true);
                                                setPaymentMenuOpen(false);
                                            }}
                                            className="w-full px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-3"
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
                        onClick={() => setShowPreview(true)}
                        className="btn btn-secondary btn-sm group w-auto lg:w-auto"
                    >
                        <Printer size={14} className="text-slate-400 group-hover:text-teal-600 transition-colors" />
                        <span className="lg:hidden">Phiếu nợ</span>
                        <span className="hidden lg:inline">In Phiếu Nợ</span>
                    </button>
                    <button
                        onClick={() => setShowAllTransactionsPreview(true)}
                        className="btn btn-secondary btn-sm group w-auto lg:w-auto"
                    >
                        <FileText size={14} className="text-slate-400 group-hover:text-teal-600 transition-colors" />
                        <span className="lg:hidden">Tất cả GD</span>
                        <span className="hidden lg:inline">Tất cả giao dịch</span>
                    </button>
                </div>
            </div>

            {/* Bulk Pay Modal — portrait: compact; landscape: rộng hơn, 2 cột form */}
            {bulkPayOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4 lg:p-6 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl w-full max-w-sm lg:max-w-md shadow-2xl border border-slate-100/80 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="shrink-0 flex items-start justify-between gap-4 p-4 lg:p-5 pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="shrink-0 w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
                                    <Wallet size={20} className="text-teal-600" />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-base lg:text-lg font-bold text-slate-800">Xác nhận thanh toán</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">Nhập ngày thanh toán và mã PIN</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setBulkPayOpen(false)}
                                className="shrink-0 p-2 -m-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                aria-label="Đóng"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 lg:p-5 pt-3">
                            <form onSubmit={handleBulkPay} className="space-y-4">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-wider">Ngày thanh toán</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                                <Calendar size={16} />
                                            </div>
                                            <DateInput
                                                required
                                                className="input input-icon py-3 text-sm"
                                                value={bulkDate}
                                                onChange={e => setBulkDate(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="bulk-pay-pin" className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-wider flex items-center gap-1.5">
                                            <Lock size={10} /> Mã PIN xác thực
                                        </label>
                                        <input
                                            id="bulk-pay-pin"
                                            type="password"
                                            autoFocus
                                            inputMode="numeric"
                                            maxLength={4}
                                            placeholder="••••"
                                            className={clsx(
                                                "input py-3 text-center font-mono font-bold text-2xl tracking-[0.35em] placeholder:text-slate-300",
                                                bulkPinError && "border-red-400 focus:border-red-500 focus:ring-red-500/20"
                                            )}
                                            value={bulkPin}
                                            onChange={e => {
                                                setBulkPin(e.target.value.replace(/\D/g, ''));
                                            }}
                                            aria-invalid={!!bulkPinError}
                                            aria-describedby={bulkPinError ? 'bulk-pin-error' : undefined}
                                        />
                                        {bulkPinError && (
                                            <p id="bulk-pin-error" className="mt-1.5 text-xs text-red-600 font-medium flex items-center gap-1.5">
                                                <AlertCircle size={12} className="shrink-0" />
                                                {bulkPinError}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {bulkError && (
                                    <div className="text-red-600 text-xs font-medium bg-red-50 px-3 py-2.5 rounded-xl border border-red-100 flex items-center gap-2">
                                        <AlertCircle size={14} className="shrink-0" />
                                        {bulkError}
                                    </div>
                                )}

                                <div className="flex gap-2 pt-3 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => setBulkPayOpen(false)}
                                        className="flex-1 btn btn-secondary btn-sm"
                                    >
                                        Hủy bỏ
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={bulkPayMutation.isPending}
                                        className="flex-1 btn btn-primary btn-sm"
                                    >
                                        {bulkPayMutation.isPending ? 'Đang xử lý...' : 'Xác nhận'}
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
                                    onClick={handleDownloadPdf}
                                    disabled={downloadPdfLoading}
                                    className="btn btn-secondary btn-sm"
                                >
                                    {downloadPdfLoading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                                    Tải xuống
                                </button>
                                <button
                                    onClick={() => handlePrint()}
                                    className="btn btn-primary btn-sm"
                                >
                                    <Printer size={14} /> In ngay
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

            {/* QR Code Payment Modal */}
            {showQRModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-teal-500 to-teal-600 px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                                    <QrCode size={20} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">QR thanh toán</h3>
                                    <p className="text-xs text-teal-100">Quét để chuyển khoản</p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setShowQRModal(false);
                                    setQrCodeUrl(null);
                                }}
                                className="p-2 -m-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-4">
                            {qrCodeUrl ? (
                                <>
                                    <div className="flex flex-col items-center justify-center space-y-4 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200">
                                            <img
                                                src={qrCodeUrl}
                                                alt="Mã QR thanh toán"
                                                className="w-64 h-64"
                                            />
                                        </div>
                                        <div className="text-center space-y-2">
                                            <p className="text-sm font-semibold text-slate-700">{bankConfig?.bank_name || 'Ngân hàng'}</p>
                                            <p className="text-xs text-slate-500 font-mono">{bankConfig?.account_number}</p>
                                            <p className="text-xs text-slate-600">{bankConfig?.account_holder}</p>
                                        </div>
                                    </div>
                                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-blue-700">Số tiền thanh toán:</span>
                                            <span className="text-lg font-bold text-blue-900">{totalDebtAmount.toLocaleString('vi-VN')} đ</span>
                                        </div>
                                        <p className="text-xs text-blue-600 mt-2">Tổng công nợ: {debtTransactions.length} giao dịch</p>
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center space-y-4 p-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                    <Loader2 size={48} className="animate-spin text-slate-400" />
                                    <p className="text-sm font-semibold text-slate-600">Đang tạo mã QR...</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Debt Preview Modal - Chỉ hiển thị giao dịch đang nợ */}
            {showDebtPreview && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 print:hidden">
                    <div className="bg-slate-100 w-full max-w-5xl h-[90vh] rounded-2xl flex flex-col shadow-2xl relative overflow-hidden">
                        {/* Header */}
                        <div className="bg-white px-6 py-4 border-b border-slate-200 flex justify-between items-center shadow-sm z-10">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <Receipt className="text-blue-600" /> Giao dịch đang nợ
                            </h3>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => handlePrint()}
                                    className="btn btn-primary btn-sm"
                                >
                                    <Printer size={14} /> In ngay
                                </button>
                                <button
                                    onClick={() => setShowDebtPreview(false)}
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
                                    groupedTransactions={groupedDebtTransactions}
                                    transactions={debtTransactions}
                                    totalPrincipal={debtTotalPrincipal}
                                    totalInterest={debtTotalInterest}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* All Transactions Preview Modal */}
            {showAllTransactionsPreview && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 print:hidden">
                    <div className="bg-slate-100 w-full max-w-5xl h-[90vh] rounded-2xl flex flex-col shadow-2xl relative overflow-hidden">
                        {/* Header */}
                        <div className="bg-white px-6 py-4 border-b border-slate-200 flex justify-between items-center shadow-sm z-10">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <FileText className="text-amber-600" /> Xem trước tất cả giao dịch
                            </h3>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleDownloadAllTransactionsPdf}
                                    disabled={downloadAllTransactionsPdfLoading}
                                    className="btn btn-secondary btn-sm"
                                >
                                    {downloadAllTransactionsPdfLoading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                                    Tải xuống
                                </button>
                                <button
                                    onClick={() => handlePrintAllTransactions()}
                                    className="btn btn-primary btn-sm"
                                >
                                    <Printer size={14} /> In ngay
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

            {/* Summary Cards: portrait 2x2 (4 cards, ẩn Tổng tiền); landscape 5 cột (giữ Tổng tiền) */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {/* 1. Tổng tiền gốc */}
                <div className="bg-gradient-to-br from-teal-500 to-teal-600 p-4 rounded-2xl text-white shadow-lg shadow-teal-200 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-10"><Wallet size={64} /></div>
                    <div className="relative z-10">
                        <p className="text-blue-100 text-xs font-medium mb-0.5 flex items-center gap-1.5"><Wallet size={12} /> Tổng tiền gốc</p>
                        <p className="text-lg font-bold tracking-tight">{lifetimePrincipal.toLocaleString('vi-VN')} <span className="text-xs font-normal opacity-80">đ</span></p>
                    </div>
                </div>

                {/* 2. Tổng tiền lãi */}
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="absolute top-0 right-0 p-3 text-blue-50 opacity-50 group-hover:scale-110 transition-transform"><Percent size={64} /></div>
                    <div className="relative z-10">
                        <p className="text-slate-500 text-xs font-medium mb-0.5 flex items-center gap-1.5"><Percent size={12} className="text-blue-600" /> Tổng tiền lãi</p>
                        <p className="text-lg font-bold text-slate-900 tracking-tight">{lifetimeInterest.toLocaleString('vi-VN')} <span className="text-xs font-normal text-slate-400">đ</span></p>
                    </div>
                </div>

                {/* 3. Tổng tiền — chỉ landscape */}
                <div className="hidden lg:block bg-white p-4 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="absolute top-0 right-0 p-3 text-blue-50 opacity-50 group-hover:scale-110 transition-transform"><PiggyBank size={64} /></div>
                    <div className="relative z-10">
                        <p className="text-slate-500 text-xs font-medium mb-0.5 flex items-center gap-1.5"><PiggyBank size={12} className="text-blue-600" /> Tổng tiền</p>
                        <p className="text-lg font-bold text-slate-900 tracking-tight">{(lifetimePrincipal + lifetimeInterest).toLocaleString('vi-VN')} <span className="text-xs font-normal text-slate-400">đ</span></p>
                    </div>
                </div>

                {/* 4. Đã thanh toán */}
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="absolute top-0 right-0 p-3 text-emerald-50 opacity-50 group-hover:scale-110 transition-transform"><CheckCircle size={64} /></div>
                    <div className="relative z-10">
                        <p className="text-slate-500 text-xs font-medium mb-0.5 flex items-center gap-1.5"><CheckCircle size={12} className="text-emerald-500" /> Đã thanh toán</p>
                        <p className="text-lg font-bold text-emerald-600 tracking-tight">{totalPaid.toLocaleString('vi-VN')} <span className="text-xs font-normal text-emerald-300">đ</span></p>
                    </div>
                </div>

                {/* 5. Còn nợ lại */}
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="absolute top-0 right-0 p-3 text-amber-50 opacity-50 group-hover:scale-110 transition-transform"><AlertCircle size={64} /></div>
                    <div className="relative z-10">
                        <p className="text-slate-500 text-xs font-medium mb-0.5 flex items-center gap-1.5"><AlertCircle size={12} className="text-amber-500" /> Còn nợ lại</p>
                        <p className="text-lg font-bold text-amber-600 tracking-tight">{totalRemaining.toLocaleString('vi-VN')} <span className="text-xs font-normal text-amber-300">đ</span></p>
                    </div>
                </div>
            </div>

            {/* Filters - Inline Style */}
            <div className="flex items-center gap-1.5 border-b-2 border-slate-200 pb-1.5 focus-within:border-teal-500 transition-colors">
                <div className="flex flex-1 items-center gap-1.5">
                    <div className="flex-1 min-w-0">
                        <DatePicker
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                            placeholder="Từ ngày"
                            size="sm"
                        />
                    </div>
                    <span className="text-slate-300 text-sm font-medium shrink-0">-</span>
                    <div className="flex-1 min-w-0">
                        <DatePicker
                            value={endDate}
                            onChange={e => setEndDate(e.target.value)}
                            placeholder="Đến ngày"
                            size="sm"
                        />
                    </div>
                    {(startDate || endDate) && (
                        <button
                            onClick={() => { setStartDate(''); setEndDate(''); }}
                            className="ml-0.5 p-1 min-w-[28px] min-h-[28px] flex items-center justify-center text-red-500 hover:bg-red-50 rounded-md transition-colors shrink-0"
                            title="Xóa lọc"
                        >
                            <X size={14} />
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
                                            <div className="w-2 h-8 bg-teal-500 rounded-full"></div>
                                            <h3 className={clsx("font-bold text-lg", isMonthFullyPaid ? "text-emerald-800" : "text-slate-800")}>Tháng {month}</h3>
                                        </div>
                                        <div className="flex gap-2">
                                            <span className={clsx("text-xs font-semibold px-2 py-1 rounded-md", isMonthFullyPaid ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600")}>{sortedTxs.length} giao dịch</span>
                                            {isMonthFullyPaid && <span className="text-xs font-semibold px-2 py-1 rounded-md bg-emerald-100 text-emerald-700">Đã tất toán</span>}
                                        </div>
                                    </div>

                                    <div className="hidden divide-y divide-slate-100">
                                        {sortedTxs.map(tx => {
                                            const typeConfig = configs?.find(c => c.code === tx.type);
                                            const typeName = typeConfig ? typeConfig.name : tx.type;
                                            const calc = tx.interest_calculation;
                                            const total = (tx.amount || 0) + (calc?.rounded_interest || 0);
                                            const isCash = tx.type === 'TIEN_MAT';

                                            return (
                                                <div key={tx._id} className={clsx(
                                                    "p-4",
                                                    tx.status === 'PAID' ? "bg-emerald-50/60" : ""
                                                )}>
                                                    <div className="flex items-start justify-between gap-3 mb-3">
                                                        <div className="min-w-0 flex-1">
                                                            <div className="text-xs font-semibold text-slate-500 mb-1">
                                                                {formatDate(tx.transaction_date)}
                                                            </div>
                                                            <div className="flex items-center gap-2 flex-wrap mb-2">
                                                                <span className={clsx(
                                                                    "px-2.5 py-1 rounded-lg text-xs font-bold",
                                                                    isCash
                                                                        ? 'bg-emerald-50 text-emerald-700'
                                                                        : 'bg-blue-50 text-blue-700'
                                                                )}>
                                                                    {typeName}
                                                                </span>
                                                                <span className="text-xs text-slate-500">{tx.interest_rate_snapshot}%</span>
                                                                {calc && <span className="text-xs text-slate-500">{(calc?.months || 0).toFixed(1)} tháng</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-sm text-slate-700 mb-3 line-clamp-2">{tx.content}</div>
                                                    <div className="grid grid-cols-2 gap-3 bg-slate-50/50 rounded-xl p-3">
                                                        <div>
                                                            <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Tiền gốc</div>
                                                            <div className="font-mono text-sm font-bold text-slate-700">{(tx.amount || 0).toLocaleString('vi-VN')}</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-[10px] font-bold text-blue-400 uppercase mb-1">Tiền lãi</div>
                                                            <div className="font-mono text-sm font-bold text-blue-600">+{(calc?.rounded_interest || 0).toLocaleString('vi-VN')}</div>
                                                        </div>
                                                        <div className="col-span-2">
                                                            <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Tổng cộng</div>
                                                            <div className="font-mono text-base font-black text-slate-900">{(total || 0).toLocaleString('vi-VN')} đ</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Portrait: card hybrid */}
                                    <div className="block lg:hidden">
                                        <div className="space-y-2 p-2">
                                            {sortedTxs.map(tx => {
                                                const typeConfig = configs?.find(c => c.code === tx.type);
                                                const typeName = typeConfig ? typeConfig.name : tx.type;
                                                const calc = tx.interest_calculation;
                                                const total = (tx.amount || 0) + (calc?.rounded_interest || 0);

                                                return (
                                                    <div
                                                        key={tx._id}
                                                        className={clsx(
                                                            "relative rounded-md border p-2.5 hover:shadow-sm transition-all overflow-hidden",
                                                            tx.status === 'PAID'
                                                                ? "bg-emerald-50 border-emerald-200"
                                                                : "bg-white border-slate-200"
                                                        )}
                                                    >
                                                        {/* Badge "ĐÃ THANH TOÁN" - Góc trên phải */}
                                                        {tx.status === 'PAID' && (
                                                            <div className="absolute top-0 right-0 bg-emerald-500 text-white px-2 py-1 text-[10px] font-bold uppercase tracking-wider shadow-md z-10">
                                                                <div className="flex items-center gap-0.5">
                                                                    <Check size={10} />
                                                                    <span>ĐÃ THANH TOÁN</span>
                                                                </div>
                                                                {/* Ribbon corner effect */}
                                                                <div className="absolute -bottom-1 right-0 w-0 h-0 border-l-[10px] border-l-transparent border-t-[10px] border-t-emerald-600"></div>
                                                            </div>
                                                        )}

                                                        {/* Top Section: Date, Type */}
                                                        <div className="flex items-center gap-1.5 flex-wrap mb-2 pb-2 border-b border-slate-100">
                                                            <div className="text-xs font-semibold text-slate-600">
                                                                {formatDate(tx.transaction_date)}
                                                            </div>
                                                            <span className={clsx(
                                                                "px-1.5 py-0.5 rounded text-xs font-bold",
                                                                tx.type?.includes('TIEN_MAT')
                                                                    ? 'bg-emerald-50 text-emerald-700'
                                                                    : 'bg-blue-50 text-blue-700'
                                                            )}>
                                                                {typeName}
                                                            </span>
                                                            {calc && (
                                                                <div className="flex items-center gap-1 text-[10px] text-slate-500">
                                                                    <span>{tx.interest_rate_snapshot}%</span>
                                                                    <span>•</span>
                                                                    <span>{(calc?.months || 0).toFixed(1)} tháng</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Content */}
                                                        <div className="mb-2">
                                                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Nội dung</div>
                                                            <div className="text-xs text-slate-600 leading-snug line-clamp-2">
                                                                {tx.content ? (
                                                                    tx.content.includes('-') ? (
                                                                        <div className="whitespace-pre-wrap">
                                                                            {tx.content
                                                                                .split(/\n/)
                                                                                .flatMap(line => {
                                                                                    // Nếu dòng có dấu -, split theo dấu - và giữ lại dấu -
                                                                                    if (line.includes('-')) {
                                                                                        return line.split(/(?=-)/).filter(part => part.trim());
                                                                                    }
                                                                                    return [line];
                                                                                })
                                                                                .filter(part => part.trim())
                                                                                .map((part, idx) => {
                                                                                    const trimmed = part.trim();
                                                                                    return (
                                                                                        <React.Fragment key={idx}>
                                                                                            {idx > 0 && <br />}
                                                                                            {trimmed}
                                                                                        </React.Fragment>
                                                                                    );
                                                                                })}
                                                                        </div>
                                                                    ) : (
                                                                        <div>{tx.content}</div>
                                                                    )
                                                                ) : (
                                                                    <span className="text-slate-400">-</span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Financial Info Grid */}
                                                        <div className="grid grid-cols-3 gap-2 bg-gradient-to-br from-slate-50 to-slate-100/50 rounded p-2 border border-slate-200">
                                                            <div>
                                                                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tiền gốc</div>
                                                                <div className="font-mono text-sm font-bold text-slate-700">
                                                                    {(tx.amount || 0).toLocaleString('vi-VN')}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div className="text-[9px] font-bold text-blue-400 uppercase tracking-widest mb-1">Tiền lãi</div>
                                                                <div className="font-mono text-sm font-bold text-blue-600">
                                                                    +{(calc?.rounded_interest || 0).toLocaleString('vi-VN')}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tổng cộng</div>
                                                                <div className="font-mono text-base font-black text-slate-900">
                                                                    {(total || 0).toLocaleString('vi-VN')}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Landscape: bảng */}
                                    <div className="hidden lg:block overflow-x-auto">
                                        <table className="w-full min-w-[800px] border-collapse">
                                            <thead className={clsx(
                                                "border-b-2 border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider text-left",
                                                isMonthFullyPaid ? "bg-emerald-50/50" : "bg-slate-50"
                                            )}>
                                                <tr>
                                                    <th className="px-4 py-3 whitespace-nowrap border-r border-slate-200 last:border-r-0">Ngày</th>
                                                    <th className="px-4 py-3 whitespace-nowrap border-r border-slate-200 last:border-r-0">Loại dịch vụ</th>
                                                    <th className="px-4 py-3 min-w-[200px] border-r border-slate-200 last:border-r-0">Nội dung</th>
                                                    <th className="px-4 py-3 text-right whitespace-nowrap border-r border-slate-200 last:border-r-0">Tiền gốc</th>
                                                    <th className="px-4 py-3 text-center whitespace-nowrap border-r border-slate-200 last:border-r-0">Lãi suất</th>
                                                    <th className="px-4 py-3 text-center whitespace-nowrap border-r border-slate-200 last:border-r-0">Thời gian</th>
                                                    <th className="px-4 py-3 text-right whitespace-nowrap border-r border-slate-200 last:border-r-0">Tiền lãi</th>
                                                    <th className="px-4 py-3 text-right whitespace-nowrap">Tổng cộng</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-200 text-sm">
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
                                                                "transition-colors group [&>td]:border-r [&>td]:border-slate-100 [&>td:last-child]:border-r-0",
                                                                tx.status === 'PAID' ? "bg-emerald-50 hover:bg-emerald-100" : "hover:bg-slate-50/50"
                                                            )}
                                                        >
                                                            <td className="px-4 py-3 whitespace-nowrap text-slate-500 font-medium group-hover:text-teal-600 transition-colors">
                                                                {formatDate(tx.transaction_date)}
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <span className={clsx(
                                                                    "px-2.5 py-1 rounded-lg text-xs font-bold border",
                                                                    isCash
                                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                                        : 'bg-blue-50 text-blue-700 border-blue-100'
                                                                )}>
                                                                    {typeName}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-slate-700 font-medium whitespace-pre-wrap leading-relaxed max-w-[280px]">{tx.content}</td>
                                                            <td className="px-4 py-3 text-right font-mono text-slate-600">{(tx.amount || 0).toLocaleString('vi-VN')}</td>
                                                            <td className="px-4 py-3 text-center text-slate-400 whitespace-nowrap">{tx.interest_rate_snapshot}%</td>
                                                            <td className="px-4 py-3 text-center text-slate-500 whitespace-nowrap">
                                                                {(calc?.months || 0).toFixed(1)} tháng
                                                            </td>
                                                            <td className="px-4 py-3 text-right font-mono text-blue-600 font-medium">
                                                                +{(calc?.rounded_interest || 0).toLocaleString('vi-VN')}
                                                            </td>
                                                            <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
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
            )}
        </div>
    );
};

export default CustomerDebtDetail;
