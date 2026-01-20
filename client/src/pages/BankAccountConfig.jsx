import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CreditCard, Building2, User, QrCode, Save, X, AlertCircle, CheckCircle, Lock, Eye, ChevronDown, Loader2, Search, FileText } from 'lucide-react';
import { clsx } from 'clsx';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { getVietQRBankList, generateVietQRUrl, getBankAccountConfig, saveBankAccountConfig, updateBankAccountConfig } from '../services/api';

export default function BankAccountConfig() {
    const queryClient = useQueryClient();
    const { showToast } = useToast();
    const { user } = useAuth();
    const isAdmin = user?.role === 'ADMIN';

    const [formData, setFormData] = useState({
        bank_code: '',
        bank_name: '',
        account_number: '',
        account_holder: '',
        default_add_info: ''
    });

    const [validationErrors, setValidationErrors] = useState({
        bank_code: '',
        account_number: '',
        account_holder: '',
        default_add_info: ''
    });

    const [qrCodeUrl, setQrCodeUrl] = useState(null);
    const [isGeneratingQR, setIsGeneratingQR] = useState(false);
    const [selectedBank, setSelectedBank] = useState(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const dropdownRef = useRef(null);
    const searchInputRef = useRef(null);

    // Load danh sách ngân hàng từ VietQR API
    const { data: bankList = [], isLoading: isLoadingBanks } = useQuery({
        queryKey: ['vietqr-banks'],
        queryFn: getVietQRBankList,
        staleTime: 1000 * 60 * 60, // Cache 1 giờ
    });

    // Load cấu hình ngân hàng toàn hệ thống (tất cả user đều thấy)
    const { data: bankConfig, isLoading: isLoadingConfig, refetch: refetchConfig } = useQuery({
        queryKey: ['bank-account-config'],
        queryFn: getBankAccountConfig,
        staleTime: 1000 * 60 * 5, // Cache 5 phút
    });

    // Load dữ liệu từ server khi có cấu hình
    useEffect(() => {
        if (bankConfig) {
            setFormData({
                bank_code: bankConfig.bank_code || '',
                bank_name: bankConfig.bank_name || '',
                account_number: bankConfig.account_number || '',
                account_holder: bankConfig.account_holder || '',
                default_add_info: bankConfig.default_add_info || ''
            });

            if (bankConfig.qr_code_url) {
                setQrCodeUrl(bankConfig.qr_code_url);
            }

            if (bankConfig.bank_code && bankList.length > 0) {
                const bank = bankList.find(b => b.code === bankConfig.bank_code);
                if (bank) {
                    setSelectedBank(bank);
                }
            }
        } else if (bankConfig === null && !isLoadingConfig) {
            setFormData({
                bank_code: '',
                bank_name: '',
                account_number: '',
                account_holder: '',
                default_add_info: ''
            });
            setQrCodeUrl(null);
            setSelectedBank(null);
        }
    }, [bankConfig, bankList, isLoadingConfig]);

    const validateForm = () => {
        const errors = {
            bank_code: '',
            account_number: '',
            account_holder: ''
        };
        let isValid = true;

        if (!formData.bank_code) {
            errors.bank_code = 'Vui lòng chọn ngân hàng';
            isValid = false;
        }

        const accountNumber = formData.account_number.trim();
        if (!accountNumber) {
            errors.account_number = 'Vui lòng nhập số tài khoản';
            isValid = false;
        } else if (!/^\d+$/.test(accountNumber)) {
            errors.account_number = 'Số tài khoản chỉ được chứa số';
            isValid = false;
        } else if (accountNumber.length < 8) {
            errors.account_number = 'Số tài khoản phải có ít nhất 8 chữ số';
            isValid = false;
        } else if (accountNumber.length > 20) {
            errors.account_number = 'Số tài khoản không được vượt quá 20 chữ số';
            isValid = false;
        }

        const accountHolder = formData.account_holder.trim();
        if (!accountHolder) {
            errors.account_holder = 'Vui lòng nhập tên chủ tài khoản';
            isValid = false;
        } else if (accountHolder.length < 2) {
            errors.account_holder = 'Tên chủ tài khoản phải có ít nhất 2 ký tự';
            isValid = false;
        } else if (accountHolder.length > 100) {
            errors.account_holder = 'Tên chủ tài khoản không được vượt quá 100 ký tự';
            isValid = false;
        }

        setValidationErrors(errors);
        return isValid;
    };

    const handleBankSelect = (bankCode) => {
        if (!isAdmin) return;
        
        const bank = bankList.find(b => b.code === bankCode);
        if (bank) {
            setSelectedBank(bank);
            setFormData({
                ...formData,
                bank_code: bank.code,
                bank_name: bank.name
            });
            setValidationErrors({ ...validationErrors, bank_code: '' });
            setIsDropdownOpen(false);
            setSearchQuery('');
        }
    };

    const filteredBanks = bankList
        .filter(bank => bank.transferSupported === 1)
        .filter(bank => {
            if (!searchQuery.trim()) return true;
            const query = searchQuery.toLowerCase();
            const displayName = (bank.shortName || bank.name).toLowerCase();
            const code = bank.code.toLowerCase();
            return displayName.includes(query) || code.includes(query);
        })
        .sort((a, b) => {
            const aName = a.shortName || a.name;
            const bName = b.shortName || b.name;
            return aName.localeCompare(bName, 'vi');
        });

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
                setSearchQuery('');
            }
        };

        if (isDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            setTimeout(() => {
                searchInputRef.current?.focus();
            }, 100);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isDropdownOpen]);

    const saveMutation = useMutation({
        mutationFn: async (data) => {
            return await saveBankAccountConfig({
                bank_code: data.bank_code,
                bank_name: data.bank_name,
                account_number: data.account_number,
                account_holder: data.account_holder,
                default_add_info: data.default_add_info || null,
                qr_code_url: qrCodeUrl
            });
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries(['bank-account-config']);
            showToast('Thành công', 'Đã lưu cấu hình tài khoản ngân hàng', 'success');
        },
        onError: (err) => {
            showToast('Lỗi', err.response?.data?.error || err.message || 'Không thể lưu cấu hình', 'error');
        }
    });

    const generateQRCode = async () => {
        if (!isAdmin) {
            showToast('Lỗi', 'Chỉ ADMIN mới được tạo mã QR', 'error');
            return;
        }

        if (!validateForm()) {
            return;
        }

        setIsGeneratingQR(true);
        try {
            const template = '9DVkSUh';
            const qrUrl = generateVietQRUrl(
                formData.bank_code,
                formData.account_number.trim(),
                formData.account_holder.trim(),
                template,
                null,
                null
            );
            
            setQrCodeUrl(qrUrl);
            
            try {
                await updateBankAccountConfig({ qr_code_url: qrUrl });
                queryClient.invalidateQueries(['bank-account-config']);
                showToast('Thành công', 'Đã tạo và lưu mã QR thành công', 'success');
            } catch (saveError) {
                console.error('Lỗi khi lưu QR code:', saveError);
                showToast('Cảnh báo', 'Đã tạo mã QR nhưng chưa lưu được lên server. Vui lòng thử lại.', 'warning');
            }
        } catch (error) {
            console.error('Lỗi khi tạo QR code:', error);
            showToast('Lỗi', 'Không thể tạo mã QR. Vui lòng thử lại.', 'error');
        } finally {
            setIsGeneratingQR(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (!isAdmin) {
            showToast('Lỗi', 'Chỉ ADMIN mới được lưu cấu hình', 'error');
            return;
        }
        
        if (!validateForm()) {
            return;
        }

        saveMutation.mutate(formData);
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 p-6">
            <div className="space-y-0">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-3xl font-bold text-slate-900">Cấu hình STK</h2>
                            {!isAdmin && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold">
                                    <Eye size={14} />
                                    Chỉ xem
                                </span>
                            )}
                        </div>
                        <p className="text-slate-500 mt-1">
                            {isAdmin 
                                ? 'Thiết lập thông tin tài khoản ngân hàng và mã QR' 
                                : 'Xem mã QR ngân hàng do ADMIN cấu hình (chỉ xem, không thể chỉnh sửa)'}
                        </p>
                    </div>
                </div>
            </div>

            <div className={clsx("grid gap-6", isAdmin ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1")}>
                {isAdmin && (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                                <CreditCard size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Thông tin tài khoản</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Nhập thông tin ngân hàng của bạn</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider ml-1">
                                    Ngân hàng
                                </label>
                                {isLoadingBanks ? (
                                    <div className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 flex items-center gap-2">
                                        <Loader2 size={16} className="animate-spin text-slate-400" />
                                        <span className="text-sm text-slate-500">Đang tải danh sách ngân hàng...</span>
                                    </div>
                                ) : (
                                    <div className="relative" ref={dropdownRef}>
                                        <button
                                            type="button"
                                            disabled={!isAdmin}
                                            onClick={() => isAdmin && setIsDropdownOpen(!isDropdownOpen)}
                                            className={clsx(
                                                "w-full bg-slate-50 border rounded-xl pl-10 pr-10 py-3 outline-none focus:ring-2 focus:bg-white transition-all text-sm font-medium text-left shadow-inner flex items-center justify-between cursor-pointer",
                                                !isAdmin && "cursor-not-allowed opacity-75 bg-slate-100",
                                                !formData.bank_code && "text-slate-400",
                                                validationErrors.bank_code
                                                    ? "border-red-300 focus:ring-red-500/20 focus:border-red-500"
                                                    : "border-slate-200 focus:ring-blue-500/20 focus:border-blue-500",
                                                isDropdownOpen && "ring-2 ring-blue-500/20 border-blue-500"
                                            )}
                                        >
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <Building2 size={16} className="text-slate-400 shrink-0" />
                                                <span className="truncate">
                                                    {selectedBank 
                                                        ? `${selectedBank.shortName || selectedBank.name} (${selectedBank.code})`
                                                        : '-- Chọn ngân hàng --'
                                                    }
                                                </span>
                                            </div>
                                            <ChevronDown 
                                                size={16} 
                                                className={clsx(
                                                    "text-slate-400 shrink-0 transition-transform",
                                                    isDropdownOpen && "transform rotate-180"
                                                )} 
                                            />
                                        </button>

                                        {isDropdownOpen && isAdmin && (
                                            <div className="absolute z-50 mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden">
                                                <div className="p-3 border-b border-slate-100 bg-slate-50">
                                                    <div className="relative">
                                                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                        <input
                                                            ref={searchInputRef}
                                                            type="text"
                                                            value={searchQuery}
                                                            onChange={(e) => setSearchQuery(e.target.value)}
                                                            placeholder="Tìm kiếm ngân hàng..."
                                                            className="w-full bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="max-h-64 overflow-y-auto">
                                                    {filteredBanks.length > 0 ? (
                                                        filteredBanks.map((bank) => {
                                                            const displayName = bank.shortName || bank.name;
                                                            const isSelected = formData.bank_code === bank.code;
                                                            return (
                                                                <button
                                                                    key={bank.id}
                                                                    type="button"
                                                                    onClick={() => handleBankSelect(bank.code)}
                                                                    className={clsx(
                                                                        "w-full px-4 py-3 text-left text-sm font-medium transition-colors hover:bg-slate-50 flex items-center justify-between gap-3 cursor-pointer",
                                                                        isSelected && "bg-blue-50 text-blue-700"
                                                                    )}
                                                                >
                                                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                                                        <div className={clsx(
                                                                            "w-2 h-2 rounded-full shrink-0",
                                                                            isSelected ? "bg-blue-600" : "bg-slate-300"
                                                                        )} />
                                                                        <span className="truncate">{displayName}</span>
                                                                        <span className="text-xs text-slate-400 font-mono shrink-0">({bank.code})</span>
                                                                    </div>
                                                                    {isSelected && (
                                                                        <CheckCircle size={16} className="text-blue-600 shrink-0" />
                                                                    )}
                                                                </button>
                                                            );
                                                        })
                                                    ) : (
                                                        <div className="px-4 py-8 text-center text-sm text-slate-400">
                                                            <p>Không tìm thấy ngân hàng nào</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                                {validationErrors.bank_code && (
                                    <p className="text-xs text-red-600 flex items-center gap-1.5 mt-1">
                                        <AlertCircle size={12} className="shrink-0" />
                                        {validationErrors.bank_code}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider ml-1">
                                    Số tài khoản
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                        <CreditCard size={16} />
                                    </div>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        disabled={!isAdmin}
                                        readOnly={!isAdmin}
                                        className={clsx(
                                            "w-full bg-slate-50 border rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:bg-white transition-all text-sm font-medium text-slate-800 shadow-inner placeholder:text-slate-300 font-mono",
                                            !isAdmin && "cursor-not-allowed opacity-75 bg-slate-100",
                                            validationErrors.account_number
                                                ? "border-red-300 focus:ring-red-500/20 focus:border-red-500"
                                                : "border-slate-200 focus:ring-blue-500/20 focus:border-blue-500"
                                        )}
                                        value={formData.account_number}
                                        onChange={e => {
                                            if (!isAdmin) return;
                                            const value = e.target.value.replace(/\D/g, '');
                                            setFormData({ ...formData, account_number: value });
                                        }}
                                        placeholder="Nhập số tài khoản"
                                        maxLength={20}
                                    />
                                </div>
                                {validationErrors.account_number && (
                                    <p className="text-xs text-red-600 flex items-center gap-1.5 mt-1">
                                        <AlertCircle size={12} className="shrink-0" />
                                        {validationErrors.account_number}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider ml-1">
                                    Chủ tài khoản
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                        <User size={16} />
                                    </div>
                                    <input
                                        type="text"
                                        disabled={!isAdmin}
                                        readOnly={!isAdmin}
                                        className={clsx(
                                            "w-full bg-slate-50 border rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:bg-white transition-all text-sm font-medium text-slate-800 shadow-inner placeholder:text-slate-300",
                                            !isAdmin && "cursor-not-allowed opacity-75 bg-slate-100",
                                            validationErrors.account_holder
                                                ? "border-red-300 focus:ring-red-500/20 focus:border-red-500"
                                                : "border-slate-200 focus:ring-blue-500/20 focus:border-blue-500"
                                        )}
                                        value={formData.account_holder}
                                        onChange={e => isAdmin && setFormData({ ...formData, account_holder: e.target.value })}
                                        placeholder="Nhập tên chủ tài khoản"
                                    />
                                </div>
                                {validationErrors.account_holder && (
                                    <p className="text-xs text-red-600 flex items-center gap-1.5 mt-1">
                                        <AlertCircle size={12} className="shrink-0" />
                                        {validationErrors.account_holder}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider ml-1">
                                    Nội dung chuyển khoản mặc định
                                    <span className="text-slate-400 font-normal normal-case ml-1">(Tùy chọn)</span>
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                        <FileText size={16} />
                                    </div>
                                    <input
                                        type="text"
                                        disabled={!isAdmin}
                                        readOnly={!isAdmin}
                                        className={clsx(
                                            "w-full bg-slate-50 border rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:bg-white transition-all text-sm font-medium text-slate-800 shadow-inner placeholder:text-slate-300",
                                            !isAdmin && "cursor-not-allowed opacity-75 bg-slate-100",
                                            validationErrors.default_add_info
                                                ? "border-red-300 focus:ring-red-500/20 focus:border-red-500"
                                                : "border-slate-200 focus:ring-blue-500/20 focus:border-blue-500"
                                        )}
                                        value={formData.default_add_info}
                                        onChange={e => {
                                            if (!isAdmin) return;
                                            const value = e.target.value;
                                            if (value.length <= 100) {
                                                setFormData({ ...formData, default_add_info: value });
                                                setValidationErrors({ ...validationErrors, default_add_info: '' });
                                            }
                                        }}
                                        placeholder="Ví dụ: Thanh toán công nợ, Chuyển khoản..."
                                        maxLength={100}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    {validationErrors.default_add_info && (
                                        <p className="text-xs text-red-600 flex items-center gap-1.5">
                                            <AlertCircle size={12} className="shrink-0" />
                                            {validationErrors.default_add_info}
                                        </p>
                                    )}
                                    <p className="text-xs text-slate-400 ml-auto">
                                        {formData.default_add_info.length}/100
                                    </p>
                                </div>
                            </div>

                            {isAdmin && (
                                <div className="flex flex-col gap-3 pt-4">
                                    <button
                                        type="submit"
                                        disabled={saveMutation.isPending}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                    >
                                        {saveMutation.isPending ? 'Đang lưu...' : 'Lưu cấu hình'}
                                        <Save size={16} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={generateQRCode}
                                        disabled={isGeneratingQR || saveMutation.isPending}
                                        className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                    >
                                        {isGeneratingQR ? 'Đang tạo...' : 'Tạo mã QR'}
                                        <QrCode size={16} />
                                    </button>
                                </div>
                            )}
                        </form>
                    </div>
                )}

                <div className={clsx("bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6", !isAdmin && "max-w-2xl mx-auto")}>
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-teal-50 text-teal-600">
                            <QrCode size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Mã QR ngân hàng</h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                {isAdmin ? 'Quét để chuyển khoản nhanh' : 'Quét mã QR để chuyển khoản'}
                            </p>
                        </div>
                    </div>

                    {isLoadingConfig ? (
                        <div className="flex flex-col items-center justify-center space-y-4 p-12 bg-slate-50 rounded-2xl border border-slate-200">
                            <Loader2 size={48} className="animate-spin text-slate-400" />
                            <p className="text-sm font-semibold text-slate-600">Đang tải cấu hình...</p>
                        </div>
                    ) : qrCodeUrl ? (
                        <div className="flex flex-col items-center justify-center space-y-4 p-6 bg-slate-50 rounded-2xl border border-slate-200">
                            <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200">
                                <img
                                    src={qrCodeUrl}
                                    alt="Mã QR ngân hàng"
                                    className="w-64 h-64"
                                />
                            </div>
                            <div className="text-center space-y-2">
                                <p className="text-sm font-semibold text-slate-700">{formData.bank_name || selectedBank?.name || 'Ngân hàng'}</p>
                                <p className="text-xs text-slate-500 font-mono">{formData.account_number}</p>
                                <p className="text-xs text-slate-600">{formData.account_holder}</p>
                            </div>
                            {isAdmin && (
                                <button
                                    type="button"
                                    onClick={async () => {
                                        try {
                                            await updateBankAccountConfig({ qr_code_url: null });
                                            setQrCodeUrl(null);
                                            queryClient.invalidateQueries(['bank-account-config']);
                                            showToast('Thành công', 'Đã xóa mã QR', 'success');
                                        } catch (error) {
                                            console.error('Lỗi khi xóa QR code:', error);
                                            showToast('Lỗi', 'Không thể xóa mã QR. Vui lòng thử lại.', 'error');
                                        }
                                    }}
                                    className="px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                                >
                                    <X size={14} />
                                    Xóa mã QR
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center space-y-4 p-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                            <div className="w-24 h-24 bg-slate-100 rounded-2xl flex items-center justify-center">
                                <QrCode size={48} className="text-slate-300" />
                            </div>
                            <div className="text-center space-y-2">
                                <p className="text-sm font-semibold text-slate-600">Chưa có mã QR</p>
                                <p className="text-xs text-slate-400">
                                    {isAdmin 
                                        ? 'Nhập thông tin và nhấn "Tạo mã QR" để tạo mã QR ngân hàng'
                                        : 'ADMIN chưa tạo mã QR. Vui lòng liên hệ ADMIN để được hỗ trợ.'
                                    }
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
