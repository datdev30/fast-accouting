import useScrollLock from '../hooks/useScrollLock';
import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getTransactions, getCustomers, getInterestConfigs, getCustomer, downloadAllTransactionsPdf, downloadDebtReportPdf, getBankAccountConfig, generateVietQRUrl } from '../services/api';
import api from '../services/api'; // Import default api instance
import { useReactToPrint } from 'react-to-print';
import PrintableReport from '../components/PrintableReport';
import PrintableAllTransactions from '../components/PrintableAllTransactions';
import PrintPreviewFrame from '../components/PrintPreviewFrame';
import { ArrowLeft, Printer, Calendar, X, FileText, Download, Loader2, QrCode, Phone, MessageCircle, CheckCheck } from 'lucide-react';
import Avatar from '../components/Avatar';
import DebtHistoryEntry from '../components/DebtHistoryEntry';
import { readMoney } from '../utils/numberToWords';
import { isNativeApp, saveFile } from '../utils/saveFile';
import { clsx } from 'clsx';
import DateInput from '../components/DateInput';
import DateRangeFilter from '../components/DateRangeFilter';
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
    const [historyStatus, setHistoryStatus] = useState('ALL');
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

    const [showQRModal, setShowQRModal] = useState(false);
    useScrollLock(showPreview || showAllTransactionsPreview || bulkPayOpen || showQRModal);
    const [qrCodeUrl, setQrCodeUrl] = useState(null);
    const [isGeneratingQR, setIsGeneratingQR] = useState(false);

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
            
            await saveFile(blob, filename);
            
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
            
            await saveFile(blob, filename);
            
            showToast('Thành công', 'File PDF đã được tải xuống', 'success');
        } catch (e) {
            console.error('Download PDF error:', e);
            showToast('Lỗi', getApiErrorMessage(e, 'Tải PDF báo cáo công nợ'), 'error');
        } finally {
            setDownloadPdfLoading(false);
        }
    };

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

    let remainingPrincipal = 0;
    let remainingInterest = 0;
    for (const tx of transactions ?? []) {
        if (tx.status !== 'OPEN') continue;
        remainingPrincipal += tx.amount || 0;
        remainingInterest += tx.interest_calculation?.rounded_interest || 0;
    }
    const totalRemaining = remainingPrincipal + remainingInterest;

    const txList = transactions ?? [];
    const historyCounts = {
        ALL: txList.length,
        OPEN: txList.filter((t) => t.status !== 'PAID').length,
        PAID: txList.filter((t) => t.status === 'PAID').length,
    };
    const historyGroups = [];
    for (const tx of [...txList].sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date))) {
        if (historyStatus === 'OPEN' && tx.status === 'PAID') continue;
        if (historyStatus === 'PAID' && tx.status !== 'PAID') continue;
        const d = new Date(tx.transaction_date);
        const key = isNaN(d) ? 'khác' : `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
        let g = historyGroups.at(-1);
        if (g?.key !== key) historyGroups.push((g = { key, items: [], total: 0 }));
        g.items.push(tx);
        g.total += (tx.amount || 0) + (tx.interest_calculation?.rounded_interest || 0);
    }

    if (!customer) return <div className="p-4 text-center text-sm text-slate-500">Đang tải dữ liệu khách hàng...</div>;

    // contact_info là chữ tự do ("SĐT, địa chỉ…") — lấy số điện thoại đầu tiên nếu có
    const phone = (customer.contact_info || '')
        .replace(/[\s.-]/g, '')
        .match(/(?:\+84|0)\d{9,10}/)?.[0]
        ?.replace(/^\+84/, '0');
    const hasOpenTx = transactions?.some((tx) => tx.status === 'OPEN');

    return (
        <div className="space-y-4 pb-20 lg:space-y-6 lg:pb-0">
            <Link to="/customers" className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-slate-500 hover:text-blue-600">
                <ArrowLeft size={18} /> Khách hàng
            </Link>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
                <section className="rounded-xl border border-slate-200 bg-white p-4" aria-label="Khách hàng">
                    <div className="flex items-center gap-3">
                        <Avatar name={customer.name} className="h-14 w-14 rounded-2xl font-heading text-base font-bold" />
                        <div className="min-w-0 flex-1">
                            <h1 className="truncate font-heading text-lg font-bold text-slate-900 lg:text-xl">{customer.name}</h1>
                            <p className="truncate text-sm text-slate-500">{customer.contact_info || 'Không có thông tin liên hệ'}</p>
                        </div>
                    </div>
                    {phone && (
                        <div className="mt-3 grid grid-cols-2 gap-2">
                            <a href={`tel:${phone}`} className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-emerald-50 text-sm font-semibold text-emerald-700 hover:bg-emerald-100">
                                <Phone size={18} /> Gọi
                            </a>
                            <a href={`https://zalo.me/${phone}`} target="_blank" rel="noreferrer" className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-blue-50 text-sm font-semibold text-blue-700 hover:bg-blue-100">
                                <MessageCircle size={18} /> Zalo
                            </a>
                        </div>
                    )}
                    <div className="mt-3 grid grid-cols-4 gap-2">
                        {[
                            { label: 'Mã QR', icon: QrCode, tone: 'text-teal-600', onClick: handleGenerateQR, disabled: isGeneratingQR || totalDebtAmount === 0 || isLoadingBankConfig },
                            { label: 'Phiếu nợ', icon: Printer, tone: 'text-blue-600', onClick: () => setShowPreview(true) },
                            { label: 'Tải PDF', icon: downloadPdfLoading ? Loader2 : Download, tone: 'text-violet-600', onClick: handleDownloadPdf, disabled: downloadPdfLoading },
                            { label: 'Tất cả GD', icon: FileText, tone: 'text-slate-600', onClick: () => setShowAllTransactionsPreview(true) },
                        ].map((action) => (
                            <button
                                key={action.label}
                                type="button"
                                onClick={action.onClick}
                                disabled={action.disabled}
                                className="flex min-w-0 flex-col items-center gap-1 rounded-xl border border-slate-200 bg-white px-1 py-2.5 text-[11px] font-semibold whitespace-nowrap text-slate-700 min-[360px]:text-xs hover:bg-slate-50 disabled:opacity-50"
                            >
                                <action.icon size={20} className={clsx(action.tone, action.icon === Loader2 && 'animate-spin')} />
                                {action.label}
                            </button>
                        ))}
                    </div>
                </section>

                <section className="space-y-3" aria-label="Công nợ còn lại">
                    <div className="ledger-summary">
                        <p className="ledger-caption">Còn phải thu</p>
                        <p className="ledger-total mt-1">{isLoading || transactionsError ? '—' : `${totalRemaining.toLocaleString('vi-VN')} ₫`}</p>
                        {!isLoading && !transactionsError && totalRemaining > 0 && <p className="mt-2 text-[13px] leading-relaxed text-slate-600">{readMoney(totalRemaining)}</p>}
                        <dl className="ledger-breakdown">
                            <div><dt>Nợ gốc</dt><dd>{isLoading || transactionsError ? '—' : `${remainingPrincipal.toLocaleString('vi-VN')} ₫`}</dd></div>
                            <div><dt>Tiền lãi</dt><dd>{isLoading || transactionsError ? '—' : `${remainingInterest.toLocaleString('vi-VN')} ₫`}</dd></div>
                        </dl>
                        <p className="mt-3 text-[13px] text-slate-600">{isLoading ? 'Đang tải công nợ…' : transactionsError ? 'Chưa tải được công nợ' : startDate || endDate ? 'Theo khoảng ngày đang lọc' : 'Các khoản chưa thanh toán'}</p>
                    </div>
                    {hasOpenTx && (
                        <div
                            className="fixed inset-x-0 z-30 border-t border-slate-200 bg-white/95 p-3 backdrop-blur-md lg:static lg:border-0 lg:bg-transparent lg:p-0"
                            style={{ bottom: 'var(--tabbar-h)' }}
                        >
                            <button type="button" onClick={() => setBulkPayOpen(true)} className="btn-primary btn-md w-full">
                                <CheckCheck size={18} /> Tất toán công nợ
                            </button>
                        </div>
                    )}
                </section>
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
                                    <label className="block text-[13px] font-semibold text-slate-600 mb-2 ml-1">Ngày thanh toán</label>
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
                                    <label className="block text-[13px] font-semibold text-slate-600 mb-2 ml-1">Mã PIN xác thực</label>
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
                                    onClick={() => (isNativeApp() ? handleDownloadPdf() : handlePrint())}
                                    disabled={downloadPdfLoading}
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
                                    onClick={() => (isNativeApp() ? handleDownloadAllTransactionsPdf() : handlePrintAllTransactions())}
                                    disabled={downloadAllTransactionsPdfLoading}
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

            <section className="rounded-2xl border border-slate-200 bg-white" aria-label="Lịch sử giao dịch">
                <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 p-4 lg:px-5">
                    <h2 className="mr-auto font-heading font-bold text-slate-900">Lịch sử giao dịch</h2>
                    <DateRangeFilter
                        startDate={startDate}
                        endDate={endDate}
                        onChange={(start, end) => {
                            setStartDate(start);
                            setEndDate(end);
                        }}
                    />
                    <div className="flex w-full gap-1.5" role="group" aria-label="Lọc theo trạng thái">
                        {[['ALL', 'Tất cả'], ['OPEN', 'Chưa trả'], ['PAID', 'Đã trả']].map(([key, label]) => (
                            <button
                                key={key}
                                type="button"
                                aria-pressed={historyStatus === key}
                                onClick={() => setHistoryStatus(key)}
                                className={clsx(
                                    'min-h-[var(--tap-min)] rounded-full px-3 text-xs font-semibold transition-colors',
                                    historyStatus === key ? 'bg-blue-600 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                )}
                            >
                                {label} · {historyCounts[key]}
                            </button>
                        ))}
                    </div>
                </div>

                {transactionsError ? (
                    <div className="p-4">
                        <ErrorStates.Network error={transactionsError} onRetry={refetchTransactions} showDetails={true} />
                    </div>
                ) : isLoading ? (
                    <div className="p-4"><LoadingSkeleton.Table rows={5} columns={4} /></div>
                ) : !transactions?.length ? (
                    (startDate || endDate) ? (
                        <EmptyStates.NoResults action={() => { setStartDate(''); setEndDate(''); }} actionLabel="Xóa bộ lọc" />
                    ) : (
                        <EmptyStates.NoTransactions />
                    )
                ) : historyGroups.length === 0 ? (
                    <p className="p-8 text-center text-sm text-slate-500">Không có giao dịch {historyStatus === 'PAID' ? 'đã trả' : 'chưa trả'}.</p>
                ) : (
                    <div className="px-4 pb-2 lg:px-5">
                        {historyGroups.map((g) => (
                            <div key={g.key}>
                                <p className="sticky top-0 z-[1] -mx-4 flex justify-between bg-slate-50/95 px-4 py-1.5 text-xs font-semibold text-slate-500 backdrop-blur lg:-mx-5 lg:px-5">
                                    <span>Tháng {g.key}</span>
                                    <span className="font-mono tabular-nums">{g.total.toLocaleString('vi-VN')} ₫</span>
                                </p>
                                <ol className="divide-y divide-slate-100">
                                    {g.items.map((tx) => (
                                        <DebtHistoryEntry key={tx._id} transaction={tx} typeName={configs?.find((c) => c.code === tx.type)?.name || tx.type} />
                                    ))}
                                </ol>
                            </div>
                        ))}
                    </div>
                )}
            </section>

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
