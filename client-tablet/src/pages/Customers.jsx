import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getCustomers, createCustomer, updateCustomer, deleteCustomerSecure, getTransactions, getInterestConfigs, updateTransaction, deleteTransactionSecure, fetchTransactionImageBlob } from '../services/api';
import { Plus, Search, Edit2, Trash2, User, MapPin, ChevronRight, Users, Check, Award, X, History, FileText, Calendar, Tag, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import { clsx } from 'clsx';
import { formatDate } from '../utils/dateUtils';
import { getInterestConfigColorScheme } from '../utils/colorSchemes';
import DateInput from '../components/DateInput';
import StatusDropdown from '../components/StatusDropdown';
import { SkeletonCard } from '../components/SkeletonLoader';
import { trapFocus } from '../utils/focusTrap';
import { EmptyStates } from '../components/EmptyState';
import { ErrorStates } from '../components/ErrorState';

export default function Customers() {
    const queryClient = useQueryClient();
    const { showToast } = useToast();
    const { user } = useAuth();
    const isAdmin = user?.role === 'ADMIN';

    const formatMoneyComma = (value) => {
        const n = typeof value === 'string' ? Number(value.replace(/,/g, '')) : Number(value);
        if (!Number.isFinite(n)) return '';
        return n.toLocaleString('en-US');
    };
    const [isOpen, setIsOpen] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [isHistoryView, setIsHistoryView] = useState(false);
    const [currentId, setCurrentId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState({ name: '', contact_info: '' });
    const [nameError, setNameError] = useState('');
    const [contactInfoError, setContactInfoError] = useState('');

    // Modal refs for focus trap
    const customerModalRef = useRef(null);
    const txModalRef = useRef(null);
    const nameInputRef = useRef(null);
    const txContentRef = useRef(null);

    // Transaction Edit State
    const [isTxModalOpen, setIsTxModalOpen] = useState(false);
    const [editingTxId, setEditingTxId] = useState(null);
    const [isTxDeleteModalOpen, setIsTxDeleteModalOpen] = useState(false);
    const [txHasImage, setTxHasImage] = useState(false);
    const [isTxImageModalOpen, setIsTxImageModalOpen] = useState(false);
    const [txImageUrl, setTxImageUrl] = useState(null);
    const [txImageLoading, setTxImageLoading] = useState(false);
    const [txImageError, setTxImageError] = useState('');
    const [txFormData, setTxFormData] = useState({
        customer_id: '',
        type: '',
        amount: '',
        content: '',
        transaction_date: new Date().toISOString().split('T')[0],
        status: 'OPEN',
        closed_at: new Date().toISOString().split('T')[0]
    });

    const { data: customers, isLoading: isLoadingCustomers, error: customersError, refetch: refetchCustomers } = useQuery({
        queryKey: ['customers'],
        queryFn: getCustomers,
        retry: 1
    });

    // Fetch transactions chỉ khi mở xem lịch sử (nút History)
    const { data: customerTransactions, isLoading: isLoadingTransactions } = useQuery({
        queryKey: ['transactions', currentId],
        queryFn: () => getTransactions(currentId),
        enabled: !!currentId && isHistoryView && isOpen
    });

    const { data: configs } = useQuery({ queryKey: ['interest-configs'], queryFn: getInterestConfigs });

    const createMutation = useMutation({
        mutationFn: createCustomer,
        onSuccess: () => {
            queryClient.invalidateQueries(['customers']);
            handleClose();
            showToast('Thành công', `Đã thêm khách hàng "${formData.name}"`, 'success');
        },
        onError: (err) => {
            showToast('Lỗi', err.response?.data?.error || "Không thể tạo khách hàng", 'error');
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => updateCustomer(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['customers']);
            handleClose();
            showToast('Thành công', `Đã cập nhật thông tin "${formData.name}"`, 'success');
        },
        onError: (err) => {
            showToast('Lỗi', err.response?.data?.error || "Không thể cập nhật khách hàng", 'error');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: ({ id, pin }) => deleteCustomerSecure(id, pin),
        onSuccess: () => {
            queryClient.invalidateQueries(['customers']);
            setIsDeleteModalOpen(false);
            handleClose();
            showToast('Thành công', 'Đã xóa khách hàng và dữ liệu liên quan', 'success');
        },
        onError: (err) => {
            showToast('Lỗi', err.response?.data?.error || "Lỗi xóa khách hàng", 'error');
        }
    });

    const updateTxMutation = useMutation({
        mutationFn: ({ id, data }) => {
            const payload = { ...data };
            if (data.amount !== undefined) payload.amount = parseFloat(data.amount);
            return updateTransaction(id, payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['transactions', currentId]);
            queryClient.invalidateQueries(['customers']);
            handleTxClose();
            showToast('Thành công', 'Đã cập nhật giao dịch', 'success');
        },
        onError: (err) => {
            showToast('Lỗi', err.response?.data?.error || "Lỗi cập nhật giao dịch", 'error');
        }
    });

    const deleteTxMutation = useMutation({
        mutationFn: ({ id, pin }) => deleteTransactionSecure(id, pin),
        onSuccess: () => {
            queryClient.invalidateQueries(['transactions', currentId]);
            queryClient.invalidateQueries(['customers']);
            setIsTxDeleteModalOpen(false);
            handleTxClose();
            showToast('Thành công', 'Đã xóa giao dịch', 'success');
        },
        onError: (err) => {
            showToast('Lỗi', err.response?.data?.error || "Lỗi xóa giao dịch", 'error');
        }
    });

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const handleDeleteConfirm = (pin) => {
        if (currentId) {
            deleteMutation.mutate({ id: currentId, pin });
        }
    };


    const validateCustomerForm = () => {
        let isValid = true;
        setNameError('');
        setContactInfoError('');

        const name = formData.name.trim();
        if (!name) {
            setNameError('Vui lòng nhập tên khách hàng');
            isValid = false;
        } else if (name.length < 2) {
            setNameError('Tên khách hàng phải có ít nhất 2 ký tự');
            isValid = false;
        } else if (name.length > 100) {
            setNameError('Tên khách hàng không được vượt quá 100 ký tự');
            isValid = false;
        }

        if (formData.contact_info && formData.contact_info.length > 200) {
            setContactInfoError('Thông tin liên hệ không được vượt quá 200 ký tự');
            isValid = false;
        }

        return isValid;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validateCustomerForm()) {
            nameInputRef.current?.focus();
            return;
        }
        if (isEdit) {
            updateMutation.mutate({ id: currentId, data: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    const handleEdit = (c) => {
        setIsHistoryView(false);
        setIsEdit(true);
        setCurrentId(c.id || c._id);
        setFormData({ name: c.name ?? '', contact_info: c.contact_info ?? '' });
        setIsOpen(true);
    };

    const handleOpenHistory = (c) => {
        setIsEdit(false);
        setIsHistoryView(true);
        setCurrentId(c.id || c._id);
        setFormData({ name: c.name ?? '', contact_info: c.contact_info ?? '' });
        setIsOpen(true);
    };

    const handleClose = () => {
        setIsOpen(false);
        setIsEdit(false);
        setIsHistoryView(false);
        setCurrentId(null);
        setFormData({ name: '', contact_info: '' });
        setNameError('');
        setContactInfoError('');
    };

    // ESC key handler for customer modal
    useEffect(() => {
        if (!isOpen) return;

        const handleEscKey = (event) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                handleClose();
            }
        };

        document.addEventListener('keydown', handleEscKey);
        return () => document.removeEventListener('keydown', handleEscKey);
    }, [isOpen]);

    // Focus trap for customer modal
    useEffect(() => {
        if (!isOpen || !customerModalRef.current) return;

        const handleTabKey = (event) => {
            if (event.key === 'Tab') {
                trapFocus(customerModalRef.current, event);
            }
        };

        document.addEventListener('keydown', handleTabKey);
        return () => document.removeEventListener('keydown', handleTabKey);
    }, [isOpen]);



    // ESC key handler for transaction modal
    useEffect(() => {
        if (!isTxModalOpen) return;

        const handleEscKey = (event) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                handleTxClose();
            }
        };

        document.addEventListener('keydown', handleEscKey);
        return () => document.removeEventListener('keydown', handleEscKey);
    }, [isTxModalOpen]);


    const revokeTxImageUrl = () => {
        if (txImageUrl) {
            try {
                URL.revokeObjectURL(txImageUrl);
            } catch {
                // ignore
            }
        }
        setTxImageUrl(null);
    };

    const handleOpenTxImage = async () => {
        if (!editingTxId) return;

        // Use backend metadata to indicate presence; avoid slow "try to load" behavior.
        if (!txHasImage) {
            showToast('Thông báo', 'Giao dịch chưa có ảnh', 'info');
            return;
        }

        setIsTxImageModalOpen(true);
        setTxImageError('');

        // If already loaded for current tx, just show it.
        if (txImageUrl) return;

        setTxImageLoading(true);
        try {
            const blob = await fetchTransactionImageBlob(editingTxId);
            const url = URL.createObjectURL(blob);
            setTxImageUrl(url);
        } catch (err) {
            const message = err?.response?.data?.error || 'Không thể tải ảnh giao dịch';
            setTxImageError(message);
            showToast('Lỗi', message, 'error');
        } finally {
            setTxImageLoading(false);
        }
    };

    const handleCloseTxImage = () => {
        setIsTxImageModalOpen(false);
        setTxImageLoading(false);
        setTxImageError('');
        revokeTxImageUrl();
    };

    // Focus trap for transaction modal
    useEffect(() => {
        if (!isTxModalOpen || !txModalRef.current) return;

        const handleTabKey = (event) => {
            if (event.key === 'Tab') {
                trapFocus(txModalRef.current, event);
            }
        };

        document.addEventListener('keydown', handleTabKey);
        return () => document.removeEventListener('keydown', handleTabKey);
    }, [isTxModalOpen]);



    const handleTxEdit = (tx) => {
        setEditingTxId(tx._id);
        setTxHasImage(tx.image_drive_file_id !== undefined ? Boolean(tx.image_drive_file_id) : false);
        setTxFormData({
            customer_id: tx.customer_id,
            type: tx.type,
            amount: tx.amount,
            content: tx.content,
            transaction_date: tx.transaction_date.split('T')[0],
            status: tx.status,
            closed_at: tx.closed_at ? tx.closed_at.split('T')[0] : new Date().toISOString().split('T')[0]
        });
        setIsTxImageModalOpen(false);
        setTxImageLoading(false);
        setTxImageError('');
        revokeTxImageUrl();
        setIsTxModalOpen(true);
    };

    const handleTxClose = () => {
        setIsTxModalOpen(false);
        setEditingTxId(null);
        setTxHasImage(false);
        setIsTxImageModalOpen(false);
        setTxImageLoading(false);
        setTxImageError('');
        revokeTxImageUrl();
    };

    const handleTxSubmit = (e) => {
        e.preventDefault();

        if (txFormData.status === 'PAID') {
            const txDate = new Date(txFormData.transaction_date);
            const paidDate = new Date(txFormData.closed_at);
            if (!isNaN(txDate.getTime()) && !isNaN(paidDate.getTime()) && paidDate < txDate) {
                showToast('Lỗi', 'Ngày thanh toán không được nhỏ hơn ngày giao dịch', 'error');
                return;
            }
        }

        updateTxMutation.mutate({ id: editingTxId, data: txFormData });
    };

    const handleTxDeleteConfirm = (pin) => {
        if (editingTxId) {
            deleteTxMutation.mutate({ id: editingTxId, pin });
        }
    };

    const filteredCustomers = customers?.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.contact_info || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header Section - Responsive layout */}
            <div className="flex flex-col tablet-lg:flex-row tablet-lg:items-center tablet-lg:justify-between gap-4 tablet-lg:gap-10">
                {/* Left: Title & Subtitle */}
                <div>
                    <h2 className="section-title text-2xl">Danh Sách Khách Hàng</h2>
                    <p className="section-subtitle mt-1">Quản lý thông tin đối tác và khách hàng</p>
                </div>

                {/* Right: Search & Create Button */}
                <div className="flex flex-col tablet-lg:flex-row items-stretch tablet-lg:items-center gap-4 tablet-lg:gap-5">
                    {/* Search */}
                    <div className="relative group flex-1 tablet-lg:flex-none">
                        <div className="absolute inset-y-0 left-0 pl-5 tablet-lg:pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-teal-500 transition-colors">
                            <Search size={24} className="tablet-lg:w-5 tablet-lg:h-5 tablet:w-5 tablet:h-5" />
                        </div>
                        <input
                            type="text"
                            placeholder="Tìm kiếm khách hàng..."
                            className="input input-icon pr-16 w-full tablet-lg:min-w-[240px] tablet-lg:max-w-[280px] min-h-[48px] tablet-lg:min-h-[44px] tablet-lg:py-2.5 tablet-lg:text-sm tablet-lg:pl-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Create Button - Chỉ landscape; portrait dùng FAB */}
                    <button
                        onClick={() => setIsOpen(true)}
                        className="hidden tablet-lg:inline-flex btn-primary justify-center items-center gap-2 whitespace-nowrap shrink-0 min-h-[48px] tablet-lg:min-h-[44px] tablet-lg:px-4 tablet-lg:py-2.5 tablet-lg:text-sm tablet-lg:rounded-xl"
                    >
                        <Plus size={24} className="shrink-0 tablet-lg:w-5 tablet-lg:h-5 tablet:w-5 tablet:h-5" />
                        <span>Thêm Khách Hàng</span>
                    </button>
                </div>
            </div>

            {/* FAB - Chỉ portrait; landscape dùng nút Thêm Khách Hàng */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-16 h-16 bg-teal-600 hover:bg-teal-700 text-white rounded-full shadow-xl shadow-teal-500/40 flex items-center justify-center transition-colors duration-200 active:scale-95 tablet-lg:hidden"
                aria-label="Thêm khách hàng"
            >
                <Plus size={26} />
            </button>

            {/* Modal */}
            {isOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 tablet-lg:p-4 transition-all overflow-hidden">
                    <div
                        ref={customerModalRef}
                        className={clsx(
                            "bg-white rounded-2xl tablet-lg:rounded-xl w-full h-auto shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col transition-all",
                            isHistoryView ? "max-w-[90vw] tablet-lg:max-w-[90vw] max-h-[90vh]" : "max-w-md tablet-lg:max-w-sm max-h-[90vh]"
                        )}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="customer-modal-title"
                    >
                        <div className="px-6 py-5 tablet-lg:px-5 tablet-lg:py-4 border-b border-slate-100 bg-white flex justify-between items-center relative z-10">
                            <div className="flex items-center gap-3 tablet-lg:gap-2">
                                <div className={clsx(
                                    "p-2.5 tablet-lg:p-2 rounded-xl tablet-lg:rounded-lg flex items-center justify-center",
                                    isHistoryView ? "bg-teal-50 text-teal-700" : isEdit ? "bg-teal-50 text-teal-700" : "bg-emerald-50 text-emerald-600"
                                )}>
                                    {isHistoryView ? <History size={24} className="tablet-lg:w-5 tablet-lg:h-5" /> : isEdit ? <Edit2 size={24} className="tablet-lg:w-5 tablet-lg:h-5" /> : <Plus size={24} className="tablet-lg:w-5 tablet-lg:h-5" />}
                                </div>
                                <div>
                                    <h3 id="customer-modal-title" className="text-xl tablet-lg:text-base font-bold text-slate-900 leading-tight">
                                        {isHistoryView ? 'Lịch sử giao dịch' : isEdit ? 'Cập Nhật Thông Tin' : 'Thêm Khách Hàng Mới'}
                                    </h3>
                                    {!isHistoryView && (
                                        <p className="text-xs tablet-lg:text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-0.5">
                                            {isEdit ? 'Chỉnh sửa hồ sơ khách hàng' : 'Khởi tạo đối tác mới'}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <button onClick={handleClose} className="p-2.5 tablet-lg:p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl tablet-lg:rounded-lg transition-colors duration-200 active:opacity-70 cursor-pointer min-w-[44px] min-h-[44px] tablet-lg:min-w-[36px] tablet-lg:min-h-[36px] flex items-center justify-center">
                                <X size={24} className="tablet-lg:w-4 tablet-lg:h-4" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-hidden flex flex-col">
                            {/* Form: thêm mới hoặc chỉnh sửa — ẩn khi chỉ xem lịch sử */}
                            {!isHistoryView && (
                            <div className="p-6 tablet-lg:p-5 space-y-5 tablet-lg:space-y-4 overflow-y-auto w-full">
                                <form onSubmit={handleSubmit} className="space-y-4 tablet-lg:space-y-3">
                                    <div className="space-y-2.5.5">
                                        <label className="block text-[11px] tablet-lg:text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] ml-1">Họ và tên</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-teal-500 transition-colors">
                                                <User size={16} className="tablet-lg:w-4 tablet-lg:h-4" />
                                            </div>
                                            <input
                                                ref={nameInputRef}
                                                required
                                                className={clsx(
                                                    "w-full bg-slate-50 border rounded-xl pl-9 tablet-lg:pl-8 pr-3 py-2.5 tablet-lg:py-2 outline-none focus:ring-2 focus:bg-white transition-all text-sm font-medium text-slate-800 placeholder:text-slate-300 shadow-inner",
                                                    nameError
                                                        ? "border-red-300 focus:ring-red-500/20 focus:border-red-500"
                                                        : "border-slate-100 focus:ring-teal-500/10 focus:border-teal-500"
                                                )}
                                                value={formData.name}
                                                onChange={e => {
                                                    setFormData({ ...formData, name: e.target.value });
                                                }}
                                                placeholder="Nhập tên khách hàng..."
                                                aria-invalid={!!nameError}
                                                aria-describedby={nameError ? 'name-error' : undefined}
                                            />
                                        </div>
                                        {nameError && (
                                            <p id="name-error" className="text-xs text-red-600 flex items-center gap-1.5 mt-1">
                                                <AlertCircle size={12} className="shrink-0" />
                                                {nameError}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2.5.5">
                                        <label className="block text-[11px] tablet-lg:text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] ml-1">Thông tin liên hệ</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-teal-500 transition-colors">
                                                <MapPin size={16} className="tablet-lg:w-4 tablet-lg:h-4" />
                                            </div>
                                            <input
                                                className={clsx(
                                                    "w-full bg-slate-50 border rounded-xl pl-9 tablet-lg:pl-8 pr-3 py-2.5 tablet-lg:py-2 outline-none focus:ring-2 focus:bg-white transition-all text-sm font-medium text-slate-800 placeholder:text-slate-300 shadow-inner",
                                                    contactInfoError
                                                        ? "border-red-300 focus:ring-red-500/20 focus:border-red-500"
                                                        : "border-slate-100 focus:ring-teal-500/10 focus:border-teal-500"
                                                )}
                                                value={formData.contact_info ?? ''}
                                                onChange={e => {
                                                    setFormData({ ...formData, contact_info: e.target.value });
                                                }}
                                                placeholder="SĐT, Địa chỉ, Ghi chú..."
                                                aria-invalid={!!contactInfoError}
                                                aria-describedby={contactInfoError ? 'contact-info-error' : undefined}
                                            />
                                        </div>
                                        {contactInfoError && (
                                            <p id="contact-info-error" className="text-xs text-red-600 flex items-center gap-1.5 mt-1">
                                                <AlertCircle size={12} className="shrink-0" />
                                                {contactInfoError}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex flex-col gap-3 tablet-lg:gap-2 pt-2">
                                        <button
                                            type="submit"
                                            disabled={createMutation.isPending || updateMutation.isPending}
                                            className="w-full btn btn-primary min-h-[42px] tablet-lg:min-h-[36px] px-5 py-2.5 tablet-lg:px-4 tablet-lg:py-2 text-sm cursor-pointer"
                                        >
                                            {createMutation.isPending || updateMutation.isPending ? 'Đang xử lý...' : (isEdit ? 'Lưu thay đổi' : 'Tạo khách hàng')}
                                            <ChevronRight size={16} className="tablet-lg:w-3.5 tablet-lg:h-3.5" />
                                        </button>

                                        {isEdit && isAdmin && (
                                            <button
                                                type="button"
                                                onClick={() => setIsDeleteModalOpen(true)}
                                                className="w-full px-5 py-2.5 tablet-lg:px-4 tablet-lg:py-2 text-red-500 font-bold text-[11px] tablet-lg:text-[10px] uppercase tracking-widest hover:bg-red-50 rounded-xl transition-all flex items-center justify-center gap-2"
                                            >
                                                <Trash2 size={14} className="tablet-lg:w-3.5 tablet-lg:h-3.5" />
                                                Xóa hồ sơ này
                                            </button>
                                        )}
                                    </div>
                                </form>
                            </div>
                            )}

                            {/* Lịch sử giao dịch — chỉ khi bấm nút History */}
                            {isHistoryView && (
                                <div className="flex flex-col tablet-lg:w-full tablet:w-full bg-slate-50/30 overflow-hidden border-slate-100">
                                    <div className="px-10 py-6 tablet-lg:px-5 tablet-lg:py-4 border-b border-slate-100 bg-white/50 flex items-center justify-between">
                                        <div className="flex items-center gap-3 tablet-lg:gap-2 text-slate-800">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-lg tablet-lg:text-base text-slate-900">
                                                    {customers?.find(x => (x.id || x._id) === currentId)?.name || '—'}
                                                </span>
                                            </div>
                                        </div>
                                        <span className="bg-teal-100 text-teal-700 px-5 py-2 tablet-lg:px-3 tablet-lg:py-1 rounded-full text-xs tablet-lg:text-[10px] font-bold uppercase">
                                            {customerTransactions?.length || 0} GD
                                        </span>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-10 tablet-lg:p-5 tablet:p-6 space-y-6 tablet-lg:space-y-3 max-h-[700px] tablet-lg:max-h-[480px] tablet:max-h-[500px]">
                                        {isLoadingTransactions ? (
                                            <div className="h-48 tablet-lg:h-36 flex items-center justify-center">
                                                <div className="animate-spin rounded-full h-8 w-8 tablet-lg:h-6 tablet-lg:w-6 border-b-2 border-blue-500"></div>
                                            </div>
                                        ) : customerTransactions?.length > 0 ? (
                                            <div className="space-y-3 tablet-lg:space-y-2">
                                                {[...customerTransactions]
                                                    .sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date))
                                                    .map(tx => {
                                                        const typeConfig = configs?.find(c => c.code === tx.type);
                                                        return (
                                                            <div
                                                                key={tx._id}
                                                                onClick={() => handleTxEdit(tx)}
                                                                className={clsx(
                                                                    "rounded-2xl tablet-lg:rounded-xl p-4 tablet-lg:p-3 border shadow-sm hover:shadow-md cursor-pointer transition-all group relative overflow-hidden",
                                                                    tx.status === 'PAID'
                                                                        ? "bg-emerald-50/50 border-emerald-100 hover:border-emerald-200"
                                                                        : "bg-white border-slate-100 hover:border-teal-200"
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
                                                                <div className="flex flex-row items-center justify-between gap-6 tablet-lg:gap-4">
                                                                    <div className="min-w-0 flex-1">
                                                                        <div className="flex items-center gap-3 tablet-lg:gap-2 mb-3">
                                                                                <span className="text-sm tablet-lg:text-xs font-bold uppercase tracking-widest text-slate-400">
                                                                                    {formatDate(tx.transaction_date)}
                                                                                </span>
                                                                            </div>
                                                                            <div className="text-lg tablet-lg:text-base font-medium text-slate-800 leading-tight space-y-2.5">
                                                                                {String(tx.content ?? '')
                                                                                    .split(/\r?\n/)
                                                                                    .filter(line => line.trim() !== '')
                                                                                    .map((line, idx) => (
                                                                                        <div key={idx} className="break-words">{line}</div>
                                                                                    ))}
                                                                            </div>
                                                                        </div>
                                                                    <div className="flex flex-col items-end justify-center">
                                                                        <p className="text-xl tablet-lg:text-base font-semibold text-slate-900 tracking-tight">
                                                                            {formatMoneyComma(tx.amount || 0)} <span className="text-xs font-normal">đ</span>
                                                                        </p>

                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                            </div>
                                        ) : (
                                            <div className="h-48 tablet-lg:h-36 flex flex-col items-center justify-center text-slate-400 opacity-60">
                                                <div className="w-16 h-16 tablet-lg:w-12 tablet-lg:h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                                                    <History size={32} className="tablet-lg:w-6 tablet-lg:h-6" />
                                                </div>
                                                <p className="text-sm tablet-lg:text-xs font-medium italic">Chưa có lịch sử giao dịch</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-4 tablet-lg:p-3 border-t border-slate-100 bg-white/50 text-center">
                                        <Link
                                            to={`/customers/${currentId}/debt`}
                                            className="text-[10px] tablet-lg:text-[9px] font-bold text-teal-600 uppercase tracking-[0.2em] hover:text-teal-700 transition-colors flex items-center justify-center gap-2 group"
                                        >
                                            Xem chi tiết bảng nợ <ChevronRight size={14} className="tablet-lg:w-3 tablet-lg:h-3 group-hover:translate-x-1 transition-transform" />
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Transaction Edit Modal */}
            {
                isTxModalOpen && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[60] p-10 tablet-lg:p-6 transition-all">
                        <div
                            ref={txModalRef}
                            className="bg-white rounded-[2.5rem] tablet-lg:rounded-xl w-full h-auto max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh]"
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="tx-modal-title"
                        >
                            <div className="px-12 py-8 tablet-lg:px-6 tablet-lg:py-5 border-b border-slate-100 flex justify-between items-center bg-white">
                                <div className="flex items-center gap-4 tablet-lg:gap-3">
                                    <div className="p-3.5 tablet-lg:p-2.5 bg-teal-50 text-teal-700 rounded-2xl tablet-lg:rounded-xl">
                                        <Edit2 size={28} className="tablet-lg:w-6 tablet-lg:h-6" />
                                    </div>
                                    <div>
                                        <h3 id="tx-modal-title" className="text-2xl tablet-lg:text-lg font-bold text-slate-900 leading-tight">Chỉnh Sửa Giao Dịch</h3>
                                        <p className="text-sm tablet-lg:text-xs font-medium text-slate-400 uppercase tracking-widest mt-0.5">Cập nhật thông tin chi tiết</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={handleOpenTxImage}
                                        title="Xem ảnh giao dịch"
                                        aria-label="Xem ảnh giao dịch"
                                        className={clsx(
                                            "p-2.5 tablet-lg:p-2 rounded-2xl tablet-lg:rounded-xl transition-colors duration-200 border cursor-pointer min-w-[44px] min-h-[44px] tablet-lg:min-w-[36px] tablet-lg:min-h-[36px] flex items-center justify-center",
                                            txImageLoading && "opacity-60 cursor-not-allowed",
                                            txHasImage
                                                ? "bg-teal-50 text-teal-700 border-teal-100 hover:bg-teal-100 active:opacity-70"
                                                : "bg-white text-slate-300 border-slate-200"
                                        )}
                                        disabled={txImageLoading}
                                    >
                                        <ImageIcon size={22} className="tablet-lg:w-5 tablet-lg:h-5" />
                                    </button>

                                    <button onClick={handleTxClose} className="p-2.5 tablet-lg:p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-2xl tablet-lg:rounded-xl transition-colors duration-200 active:opacity-70 cursor-pointer min-w-[44px] min-h-[44px] tablet-lg:min-w-[36px] tablet-lg:min-h-[36px] flex items-center justify-center">
                                        <X size={24} className="tablet-lg:w-5 tablet-lg:h-5" />
                                    </button>
                                </div>
                            </div>

                            <form onSubmit={handleTxSubmit} className="p-12 tablet-lg:p-6 space-y-8 tablet-lg:space-y-5 flex-1 overflow-y-auto">
                                {/* Type config selector */}
                                <div>
                                    <label className="block text-sm tablet-lg:text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 tablet-lg:mb-2 ml-1">Loại giao dịch</label>
                                    <div className="flex flex-wrap gap-3 tablet-lg:gap-2">
                                        {configs?.map((config) => {
                                            const colors = getInterestConfigColorScheme(config.code);
                                            const isSelected = txFormData.type === config.code;
                                            return (
                                                <button
                                                    key={config.code}
                                                    type="button"
                                                    onClick={() => setTxFormData({ ...txFormData, type: config.code })}
                                                    className={clsx(
                                                        "px-6 py-3 tablet-lg:px-4 tablet-lg:py-2 rounded-xl tablet-lg:rounded-lg text-sm tablet-lg:text-xs font-bold border transition-colors duration-200 whitespace-nowrap cursor-pointer min-h-[44px] tablet-lg:min-h-[40px] flex items-center justify-center",
                                                        isSelected ? `${colors.badge} ring-2 ${colors.ring}` : "bg-slate-50 text-slate-500 border-slate-100 hover:border-slate-200 hover:bg-slate-100 active:opacity-70"
                                                    )}
                                                >
                                                    {config.name}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm tablet-lg:text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 tablet-lg:mb-2 ml-1">Nội dung</label>
                                    <textarea
                                        ref={txContentRef}
                                        required
                                        className="w-full bg-slate-50 border border-slate-100 rounded-[1.25rem] tablet-lg:rounded-xl px-7 py-6 tablet-lg:px-5 tablet-lg:py-4 outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 focus:bg-white transition-all text-lg tablet-lg:text-base font-medium text-slate-800 placeholder:text-slate-300 shadow-inner min-h-[140px] tablet-lg:min-h-[100px] resize-none underline-none"
                                        value={txFormData.content}
                                        onChange={e => setTxFormData({ ...txFormData, content: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-8 tablet-lg:gap-5">
                                    <div className="space-y-2">
                                        <label className="block text-sm tablet-lg:text-xs font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Số tiền gốc</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-5 tablet-lg:pl-4 flex items-center pointer-events-none text-slate-400 font-bold text-sm tablet-lg:text-xs">đ</div>
                                            <input
                                                required
                                                className="w-full bg-slate-50 border border-slate-100 rounded-[1.25rem] tablet-lg:rounded-xl pl-14 tablet-lg:pl-11 pr-6 tablet-lg:pr-4 py-5 tablet-lg:py-3 outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 focus:bg-white transition-all text-lg tablet-lg:text-base font-semibold text-slate-800 shadow-inner"
                                                value={formatMoneyComma(txFormData.amount)}
                                                onChange={e => {
                                                    const val = e.target.value.replace(/,/g, '');
                                                    if (/^\d*$/.test(val)) setTxFormData({ ...txFormData, amount: val });
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm tablet-lg:text-xs font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Ngày giao dịch</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-5 tablet-lg:pl-4 flex items-center pointer-events-none text-slate-400"><Calendar size={24} className="tablet-lg:w-5 tablet-lg:h-5" /></div>
                                            <DateInput
                                                required
                                                className="w-full bg-slate-50 border border-slate-100 rounded-[1.25rem] tablet-lg:rounded-xl pl-14 tablet-lg:pl-11 pr-6 tablet-lg:pr-4 py-5 tablet-lg:py-3 outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 focus:bg-white transition-all text-lg tablet-lg:text-base font-medium text-slate-800 shadow-inner"
                                                value={txFormData.transaction_date}
                                                onChange={e => setTxFormData({ ...txFormData, transaction_date: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-8 tablet-lg:gap-5">
                                    <div className="space-y-2">
                                        <label className="block text-sm tablet-lg:text-xs font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Trạng thái</label>
                                        <div className="tablet-lg:[&_button]:min-h-[40px] tablet-lg:[&_button]:py-2.5 tablet-lg:[&_button]:text-sm tablet-lg:[&_button]:rounded-xl">
                                            <StatusDropdown
                                                value={txFormData.status}
                                                onChange={(next) => setTxFormData({ ...txFormData, status: next })}
                                                size="md"
                                            />
                                        </div>
                                    </div>
                                    {txFormData.status === 'PAID' && (
                                        <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                                            <label className="block text-sm tablet-lg:text-xs font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Ngày thanh toán</label>
                                            <div className="relative group">
                                                <div className="absolute inset-y-0 left-0 pl-5 tablet-lg:pl-4 flex items-center pointer-events-none text-slate-400"><Check size={24} className="tablet-lg:w-5 tablet-lg:h-5" /></div>
                                                <DateInput
                                                    required
                                                    className="w-full bg-slate-50 border border-slate-100 rounded-[1.25rem] tablet-lg:rounded-xl pl-14 tablet-lg:pl-11 pr-6 tablet-lg:pr-4 py-5 tablet-lg:py-3 outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 focus:bg-white transition-all text-lg tablet-lg:text-base font-medium text-slate-800 shadow-inner"
                                                    value={txFormData.closed_at}
                                                    onChange={e => setTxFormData({ ...txFormData, closed_at: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col gap-4 tablet-lg:gap-3 pt-4 tablet-lg:pt-2">
                                    <button
                                        type="submit"
                                        disabled={updateTxMutation.isPending}
                                        className="w-full btn btn-primary min-h-[52px] tablet-lg:min-h-[40px] px-8 py-4 tablet-lg:px-5 tablet-lg:py-2.5 text-base tablet-lg:text-sm"
                                    >
                                        {updateTxMutation.isPending ? 'Đang xử lý...' : 'Lưu thay đổi'}
                                        <ChevronRight size={18} className="tablet-lg:w-4 tablet-lg:h-4" />
                                    </button>
                                    {isAdmin && (
                                        <button
                                            type="button"
                                            onClick={() => setIsTxDeleteModalOpen(true)}
                                            className="w-full btn btn-secondary min-h-[52px] tablet-lg:min-h-[40px] px-8 py-4 tablet-lg:px-5 tablet-lg:py-2.5 text-base tablet-lg:text-sm text-red-600 hover:text-red-700 hover:border-red-200"
                                        >
                                            <Trash2 size={16} className="tablet-lg:w-4 tablet-lg:h-4" />
                                            Xóa giao dịch này
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Transaction Image Viewer (lazy-load on click) */}
            {
                isTxImageModalOpen && (
                    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-[70] p-10">
                        <div className="bg-white w-full h-auto max-w-4xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                            <div className="px-10 py-6 border-b border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-teal-50 text-teal-700 rounded-2xl">
                                        <ImageIcon size={28} />
                                    </div>
                                    <div>
                                        <h4 className="text-2xl font-bold text-slate-900 leading-tight">Ảnh giao dịch</h4>
                                        <p className="text-sm font-medium text-slate-400 uppercase tracking-widest mt-0.5">Chỉ tải khi bấm xem</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleCloseTxImage}
                                    className="p-3.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-2xl transition-all"
                                    aria-label="Đóng"
                                >
                                    <X size={28} />
                                </button>
                            </div>

                            <div className="p-10 flex-1 overflow-auto bg-slate-50">
                                {txImageLoading && (
                                    <div className="h-full min-h-[400px] flex items-center justify-center text-slate-400">
                                        <div className="text-lg font-medium">Đang tải ảnh...</div>
                                    </div>
                                )}

                                {!txImageLoading && txImageError && (
                                    <div className="h-full min-h-[400px] flex items-center justify-center">
                                        <div className="text-lg font-medium text-slate-500">{txImageError}</div>
                                    </div>
                                )}

                                {!txImageLoading && !txImageError && txImageUrl && (
                                    <div className="flex items-center justify-center">
                                        <img
                                            src={txImageUrl}
                                            alt="Ảnh giao dịch"
                                            className="max-h-[80vh] w-auto max-w-full rounded-2xl border border-slate-200 shadow-sm"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }

            <DeleteConfirmationModal
                isOpen={isTxDeleteModalOpen}
                onClose={() => setIsTxDeleteModalOpen(false)}
                onConfirm={handleTxDeleteConfirm}
                title="Xóa Giao Dịch"
                warningMessage="Hành động này không thể hoàn tác. Bạn có chắc chắn muốn xóa giao dịch này?"
                isDeleting={deleteTxMutation.isPending}
            />

            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="Xóa Khách Hàng"
                warningMessage="CẢNH BÁO: Hành động này sẽ xóa khách hàng và TOÀN BỘ lịch sử giao dịch liên quan. Không thể hoàn tác!"
                isDeleting={deleteMutation.isPending}
            />

            {/* Customer Grid - Responsive: 4 cols (tablet-lg+), 2 cols (tablet), 1 col (mobile) */}
            {customersError ? (
                <ErrorStates.Network
                    onRetry={refetchCustomers}
                    error={customersError}
                    showDetails={true}
                />
            ) : (
                <div className="grid grid-cols-1 tablet:grid-cols-2 tablet-lg:grid-cols-4 gap-6 tablet-lg:gap-4">
            {isLoadingCustomers ? (
                // Show skeleton loaders while loading
                Array.from({ length: 8 }).map((_, i) => (
                    <SkeletonCard key={i} />
                ))
            ) : customers?.length === 0 ? (
                // No customers at all
                <div className="col-span-full">
                    <EmptyStates.NoCustomers
                        action={() => setIsOpen(true)}
                        actionLabel="Thêm khách hàng đầu tiên"
                    />
                </div>
            ) : filteredCustomers?.length === 0 ? (
                // Filtered results empty
                <div className="col-span-full">
                    <EmptyStates.NoResults
                        action={() => setSearchTerm('')}
                        actionLabel="Xóa bộ lọc"
                    />
                </div>
            ) : (
                filteredCustomers?.map(customer => {
                    return (
                        <div
                            key={customer._id}
                            onClick={() => handleEdit(customer)}
                            className="group relative bg-white rounded-2xl tablet-lg:rounded-xl border border-slate-100 p-5 tablet-lg:p-3.5 tablet:p-4 shadow-sm hover:shadow-xl hover:shadow-teal-500/10 hover:border-teal-200 transition-shadow transition-colors duration-200 cursor-pointer overflow-hidden flex flex-col min-h-[200px] tablet-lg:min-h-[140px]"
                        >
                            {/* Decorative Background Element */}
                            <div className="absolute -top-12 -right-12 w-32 h-32 tablet-lg:-top-8 tablet-lg:-right-8 tablet-lg:w-20 tablet-lg:h-20 bg-gradient-to-br from-blue-50 to-indigo-50/30 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out z-0 opacity-60"></div>

                            {/* Paid in Full Ribbon */}
                            {customer.is_paid_in_full && (
                                <div className="absolute top-0 right-0 z-20 text-center pointer-events-none overflow-hidden w-32 h-32">
                                    <div className="absolute top-[24px] right-[-34px] rotate-45 bg-gradient-to-r from-emerald-500 to-green-600 text-white text-xs font-bold py-1.5 w-[160px] shadow-lg shadow-emerald-500/40 uppercase tracking-widest leading-none">
                                        Đã tất toán
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center gap-4 tablet-lg:gap-2.5 mb-5 tablet-lg:mb-3 relative z-10">
                                {/* Avatar Circle */}
                                <div className="w-14 h-14 tablet-lg:w-10 tablet-lg:h-10 tablet:w-12 tablet:h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center border border-slate-200 group-hover:bg-teal-50 group-hover:text-teal-600 group-hover:border-teal-100 transition-colors duration-300 flex-shrink-0">
                                    <User size={28} className="tablet-lg:w-5 tablet-lg:h-5 tablet:w-6 tablet:h-6" />
                                </div>
                                <div className="flex-1 min-w-0 text-left">
                                    <h3 className="text-2xl tablet-lg:text-base tablet:text-xl font-bold text-slate-900 truncate group-hover:text-teal-700 transition-colors">
                                        {customer.name}
                                    </h3>

                                </div>
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); handleOpenHistory(customer); }}
                                    aria-label="Lịch sử giao dịch"
                                    className="p-2 tablet-lg:p-1.5 rounded-xl tablet-lg:rounded-lg text-slate-400 hover:bg-slate-100 hover:text-teal-600 transition-colors duration-200 active:opacity-70 flex-shrink-0 cursor-pointer min-w-[44px] min-h-[44px] tablet-lg:min-w-[36px] tablet-lg:min-h-[36px] flex items-center justify-center"
                                >
                                    <History size={22} className="tablet-lg:w-5 tablet-lg:h-5" />
                                </button>
                            </div>

                            <div className="space-y-3 tablet-lg:space-y-2.5.5 mb-6 tablet-lg:mb-3 relative z-10">
                                <div className="flex items-start gap-2.5 tablet-lg:gap-1.5 text-slate-500 text-sm tablet-lg:text-xs">
                                    <div className="p-1.5 tablet-lg:p-1 bg-slate-50 text-slate-400 rounded-lg group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors flex-shrink-0">
                                        <MapPin size={14} className="tablet-lg:w-3 tablet-lg:h-3" />
                                    </div>
                                    <span className="leading-tight pt-0.5 line-clamp-2 italic font-medium text-slate-500">
                                        {customer.contact_info || 'Chưa cập nhật địa chỉ'}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-auto pt-4 tablet-lg:pt-2.5 border-t border-slate-50 flex items-center justify-end relative z-10">
                                <Link
                                    to={`/customers/${customer.id}/debt`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-full flex items-center justify-center gap-2 text-[11px] tablet-lg:text-[10px] tablet:text-[10px] font-bold uppercase tracking-wider text-teal-700 hover:text-white hover:bg-teal-600 border border-teal-100 hover:border-teal-600 transition-colors duration-200 px-4 py-4 tablet-lg:px-3 tablet-lg:py-2.5 tablet:py-3 rounded-2xl tablet-lg:rounded-xl shadow-sm group/btn min-h-[48px] tablet-lg:min-h-[40px] tablet:min-h-[44px] cursor-pointer"
                                >
                                    Xem chi tiết nợ <ChevronRight size={14} className="tablet-lg:w-3 tablet-lg:h-3 tablet:w-3 tablet:h-3 group-hover/btn:translate-x-1 transition-transform" />
                                </Link>
                            </div>
                        </div>
                    );
                })
            )}
                </div>
            )}
        </div>
    );
}
