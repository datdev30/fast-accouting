import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getCustomers, createCustomer, updateCustomer, deleteCustomerSecure, getTransactions, getInterestConfigs, updateTransaction, deleteTransactionSecure, fetchTransactionImageBlob } from '../services/api';
import { Plus, Search, Edit2, Trash2, User, MapPin, ChevronRight, Users, Check, Award, X, History, Clock, FileText, Calendar, Tag, Image as ImageIcon } from 'lucide-react';
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
    const [currentId, setCurrentId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState({ name: '', contact_info: '' });

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

    const { data: customers, isLoading: isLoadingCustomers } = useQuery({ queryKey: ['customers'], queryFn: getCustomers });

    // Fetch transactions for the currently edited customer
    const { data: customerTransactions, isLoading: isLoadingTransactions } = useQuery({
        queryKey: ['transactions', currentId],
        queryFn: () => getTransactions(currentId),
        enabled: !!currentId && isEdit && isOpen
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


    const handleSubmit = (e) => {
        e.preventDefault();
        if (isEdit) {
            updateMutation.mutate({ id: currentId, data: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    const handleEdit = (c) => {
        setIsEdit(true);
        setCurrentId(c.id);
        setFormData({ name: c.name ?? '', contact_info: c.contact_info ?? '' });
        setIsOpen(true);
    };

    const handleClose = () => {
        setIsOpen(false);
        setIsEdit(false);
        setCurrentId(null);
        setFormData({ name: '', contact_info: '' });
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Danh Sách Khách Hàng</h2>
                    <p className="text-slate-500 text-xs sm:text-sm">Quản lý thông tin đối tác và khách hàng</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative group w-full sm:w-64">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                            <Search size={18} />
                        </div>
                        <input
                            type="text"
                            placeholder="Tìm kiếm..."
                            className="input input-icon"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => setIsOpen(true)}
                        className="w-full sm:w-auto btn btn-primary btn-md"
                    >
                        <Plus size={18} />
                        Thêm Khách Hàng
                    </button>
                </div>
            </div>
            {/* Modal */}
            {isOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-0 sm:p-4 transition-all overflow-hidden">
                    <div
                        ref={customerModalRef}
                        className={clsx(
                            "bg-white sm:rounded-[2.5rem] w-full h-full sm:h-auto shadow-2xl overflow-hidden animate-in fade-in sm:zoom-in sm:duration-300 duration-300 flex flex-col transition-all",
                            isEdit ? "sm:max-w-7xl" : "sm:max-w-md"
                        )}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="customer-modal-title"
                    >
                        <div className="px-8 py-6 border-b border-slate-100 bg-white flex justify-between items-center relative z-10">
                            <div className="flex items-center gap-3">
                                <div className={clsx(
                                    "p-2.5 rounded-2xl flex items-center justify-center",
                                    isEdit ? "bg-blue-50 text-blue-600" : "bg-emerald-50 text-emerald-600"
                                )}>
                                    {isEdit ? <Edit2 size={22} /> : <Plus size={22} />}
                                </div>
                                <div>
                                    <h3 id="customer-modal-title" className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
                                        {isEdit ? 'Cập Nhật Thông Tin' : 'Thêm Khách Hàng Mới'}
                                    </h3>
                                    <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mt-0.5">
                                        {isEdit ? 'Chỉnh sửa hồ sơ & xem lịch sử' : 'Khởi tạo đối tác mới'}
                                    </p>
                                </div>
                            </div>
                            <button onClick={handleClose} className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-2xl transition-all active:scale-90">
                                <X size={24} />
                            </button>
                        </div>
                        <div className={clsx(
                            'flex-1 overflow-hidden flex flex-col',
                            isEdit && 'lg:flex-row'
                        )}>
                            {/* Left Side: Form */}
                            <div className={clsx(
                                'p-6 sm:p-8 space-y-6 overflow-y-auto w-full',
                                isEdit && 'lg:w-1/3 lg:border-r lg:border-slate-100 lg:flex-none'
                            )}>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Họ và tên</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                                <User size={18} />
                                            </div>
                                            <input
                                                ref={nameInputRef}
                                                required
                                                className="w-full bg-slate-50 border border-slate-100 rounded-[1.25rem] pl-11 pr-4 py-3.5 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all text-base font-medium text-slate-800 placeholder:text-slate-300 shadow-inner"
                                                value={formData.name}
                                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                placeholder="Nhập tên khách hàng..."
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Thông tin liên hệ</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                                <MapPin size={18} />
                                            </div>
                                            <input
                                                className="w-full bg-slate-50 border border-slate-100 rounded-[1.25rem] pl-11 pr-4 py-3.5 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all text-base font-medium text-slate-800 placeholder:text-slate-300 shadow-inner"
                                                value={formData.contact_info ?? ''}
                                                onChange={e => setFormData({ ...formData, contact_info: e.target.value })}
                                                placeholder="SĐT, Địa chỉ, Ghi chú..."
                                            />
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-4 pt-4">
                                        <button
                                            type="submit"
                                            disabled={createMutation.isPending || updateMutation.isPending}
                                            className="w-full btn btn-primary btn-lg"
                                        >
                                            {createMutation.isPending || updateMutation.isPending ? 'Đang xử lý...' : (isEdit ? 'Lưu thay đổi' : 'Tạo khách hàng')}
                                            <ChevronRight size={18} />
                                        </button>

                                        {isEdit && isAdmin && (
                                            <button
                                                type="button"
                                                onClick={() => setIsDeleteModalOpen(true)}
                                                className="w-full px-8 py-4 text-red-500 font-bold text-xs uppercase tracking-widest hover:bg-red-50 rounded-[1.25rem] transition-all flex items-center justify-center gap-2"
                                            >
                                                <Trash2 size={16} />
                                                Xóa hồ sơ này
                                            </button>
                                        )}
                                    </div>
                                </form>
                            </div>

                            {/* Right Side: Transaction History (Now visible on all screens in Edit Mode) */}
                            {isEdit && (
                                <div className="flex flex-col w-full lg:w-2/3 bg-slate-50/30 overflow-hidden border-t sm:border-t-0 border-slate-100">
                                    <div className="px-6 py-4 border-b border-slate-100 bg-white/50 flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-slate-800">
                                            <History size={18} className="text-blue-500" />
                                            <span className="font-bold text-xs uppercase tracking-widest">Lịch sử giao dịch</span>
                                        </div>
                                        <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase">
                                            {customerTransactions?.length || 0} GD
                                        </span>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-6 space-y-4 max-h-[500px]">
                                        {isLoadingTransactions ? (
                                            <div className="h-48 flex items-center justify-center">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                                            </div>
                                        ) : customerTransactions?.length > 0 ? (
                                            <div className="space-y-3">
                                                {[...customerTransactions]
                                                    .sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date))
                                                    .map(tx => {
                                                        const typeConfig = configs?.find(c => c.code === tx.type);
                                                        return (
                                                            <div
                                                                key={tx._id}
                                                                onClick={() => handleTxEdit(tx)}
                                                                className={clsx(
                                                                    "rounded-2xl p-4 border shadow-sm hover:shadow-md cursor-pointer transition-all group",
                                                                    tx.status === 'PAID'
                                                                        ? "bg-emerald-50/50 border-emerald-100 hover:border-emerald-200"
                                                                        : "bg-white border-slate-100 hover:border-blue-200"
                                                                )}
                                                            >
                                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                                    <div className="flex items-center gap-4 min-w-0">
                                                                        <div className={clsx(
                                                                            "w-12 h-12 rounded-2xl flex items-center justify-center flex-none",
                                                                            tx.status === 'PAID' ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                                                                        )}>
                                                                            {tx.status === 'PAID' ? <Check size={20} /> : <Clock size={20} />}
                                                                        </div>
                                                                        <div className="min-w-0">
                                                                            <div className="flex items-center gap-2 mb-1">
                                                                                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                                                                                    {formatDate(tx.transaction_date)}
                                                                                </span>
                                                                                <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                                                                                <span className={clsx(
                                                                                    "text-[10px] font-bold uppercase tracking-widest",
                                                                                    tx.status === 'PAID' ? "text-emerald-500" : "text-amber-500"
                                                                                )}>
                                                                                    {tx.status === 'PAID' ? 'ĐÃ THANH TOÁN' : 'CHƯA THU'}
                                                                                </span>
                                                                            </div>
                                                                            <div className="text-sm font-medium text-slate-800 leading-tight space-y-1">
                                                                                {String(tx.content ?? '')
                                                                                    .split(/\r?\n/)
                                                                                    .filter(line => line.trim() !== '')
                                                                                    .map((line, idx) => (
                                                                                        <div key={idx} className="break-words">{line}</div>
                                                                                    ))}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 border-slate-50 pt-3 sm:pt-0">
                                                                        <p className="text-base font-semibold text-slate-900 tracking-tight">
                                                                            {formatMoneyComma(tx.amount || 0)} <span className="text-[10px] font-normal">đ</span>
                                                                        </p>
                                                                        <span className="text-[10px] font-bold uppercase tracking-widest text-blue-500">
                                                                            {typeConfig?.name || tx.type}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                            </div>
                                        ) : (
                                            <div className="h-48 flex flex-col items-center justify-center text-slate-400 opacity-60">
                                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                                                    <History size={32} />
                                                </div>
                                                <p className="text-sm font-medium italic">Chưa có lịch sử giao dịch</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-4 border-t border-slate-100 bg-white/50 text-center">
                                        <Link
                                            to={`/customers/${currentId}/debt`}
                                            className="text-[10px] font-bold text-blue-500 uppercase tracking-[0.2em] hover:text-blue-700 transition-colors flex items-center justify-center gap-2 group"
                                        >
                                            Xem chi tiết bảng nợ <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
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
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[60] p-0 sm:p-4 transition-all">
                        <div
                            ref={txModalRef}
                            className="bg-white sm:rounded-[2.5rem] w-full h-full sm:h-auto sm:max-w-xl shadow-2xl overflow-hidden animate-in fade-in sm:zoom-in sm:duration-300 duration-300 flex flex-col"
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="tx-modal-title"
                        >
                            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl">
                                        <Edit2 size={22} />
                                    </div>
                                    <div>
                                        <h3 id="tx-modal-title" className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">Chỉnh Sửa Giao Dịch</h3>
                                        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-0.5">Cập nhật thông tin chi tiết</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={handleOpenTxImage}
                                        title="Xem ảnh giao dịch"
                                        aria-label="Xem ảnh giao dịch"
                                        className={clsx(
                                            "p-2.5 rounded-2xl transition-all border",
                                            txImageLoading && "opacity-60 cursor-not-allowed",
                                            txHasImage
                                                ? "bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100"
                                                : "bg-white text-slate-300 border-slate-200"
                                        )}
                                        disabled={txImageLoading}
                                    >
                                        <ImageIcon size={22} />
                                    </button>

                                    <button onClick={handleTxClose} className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-2xl transition-all">
                                        <X size={24} />
                                    </button>
                                </div>
                            </div>

                            <form onSubmit={handleTxSubmit} className="p-8 space-y-6 flex-1 overflow-y-auto">
                                {/* Type config selector */}
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Loại giao dịch</label>
                                    <div className="flex flex-wrap gap-2">
                                        {configs?.map((config) => {
                                            const colors = getInterestConfigColorScheme(config.code);
                                            const isSelected = txFormData.type === config.code;
                                            return (
                                                <button
                                                    key={config.code}
                                                    type="button"
                                                    onClick={() => setTxFormData({ ...txFormData, type: config.code })}
                                                    className={clsx(
                                                        "px-4 py-2 rounded-xl text-xs font-bold border transition-all whitespace-nowrap",
                                                        isSelected ? `${colors.badge} ring-2 ${colors.ring}` : "bg-slate-50 text-slate-500 border-slate-100 hover:border-slate-200"
                                                    )}
                                                >
                                                    {config.name}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Nội dung</label>
                                    <textarea
                                        ref={txContentRef}
                                        required
                                        className="w-full bg-slate-50 border border-slate-100 rounded-[1.25rem] px-5 py-4 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all text-base font-medium text-slate-800 placeholder:text-slate-300 shadow-inner min-h-[100px] resize-none underline-none"
                                        value={txFormData.content}
                                        onChange={e => setTxFormData({ ...txFormData, content: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Số tiền gốc</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 font-bold">đ</div>
                                            <input
                                                required
                                                className="w-full bg-slate-50 border border-slate-100 rounded-[1.25rem] pl-10 pr-4 py-3.5 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all text-base font-semibold text-slate-800 shadow-inner"
                                                value={formatMoneyComma(txFormData.amount)}
                                                onChange={e => {
                                                    const val = e.target.value.replace(/,/g, '');
                                                    if (/^\d*$/.test(val)) setTxFormData({ ...txFormData, amount: val });
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Ngày giao dịch</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400"><Calendar size={18} /></div>
                                            <DateInput
                                                required
                                                className="w-full bg-slate-50 border border-slate-100 rounded-[1.25rem] pl-11 pr-4 py-3.5 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all text-base font-medium text-slate-800 shadow-inner"
                                                value={txFormData.transaction_date}
                                                onChange={e => setTxFormData({ ...txFormData, transaction_date: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Trạng thái</label>
                                        <StatusDropdown
                                            value={txFormData.status}
                                            onChange={(next) => setTxFormData({ ...txFormData, status: next })}
                                            size="md"
                                        />
                                    </div>
                                    {txFormData.status === 'PAID' && (
                                        <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Ngày thanh toán</label>
                                            <div className="relative group">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400"><Check size={18} /></div>
                                                <DateInput
                                                    required
                                                    className="w-full bg-slate-50 border border-slate-100 rounded-[1.25rem] pl-11 pr-4 py-3.5 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all text-base font-medium text-slate-800 shadow-inner"
                                                    value={txFormData.closed_at}
                                                    onChange={e => setTxFormData({ ...txFormData, closed_at: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col gap-4 pt-4">
                                    <button
                                        type="submit"
                                        disabled={updateTxMutation.isPending}
                                        className="w-full btn btn-primary btn-lg"
                                    >
                                        {updateTxMutation.isPending ? 'Đang xử lý...' : 'Lưu thay đổi'}
                                        <ChevronRight size={18} />
                                    </button>
                                    {isAdmin && (
                                        <button
                                            type="button"
                                            onClick={() => setIsTxDeleteModalOpen(true)}
                                            className="w-full btn btn-secondary btn-lg text-red-600 hover:text-red-700 hover:border-red-200"
                                        >
                                            <Trash2 size={16} />
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
                    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-[70] p-0 sm:p-4">
                        <div className="bg-white w-full h-full sm:h-auto sm:max-w-3xl sm:rounded-[2rem] shadow-2xl overflow-hidden flex flex-col">
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-50 text-blue-600 rounded-2xl">
                                        <ImageIcon size={20} />
                                    </div>
                                    <div>
                                        <h4 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">Ảnh giao dịch</h4>
                                        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-0.5">Chỉ tải khi bấm xem</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleCloseTxImage}
                                    className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-2xl transition-all"
                                    aria-label="Đóng"
                                >
                                    <X size={22} />
                                </button>
                            </div>

                            <div className="p-6 flex-1 overflow-auto bg-slate-50">
                                {txImageLoading && (
                                    <div className="h-full min-h-[220px] flex items-center justify-center text-slate-400">
                                        <div className="text-sm font-medium">Đang tải ảnh...</div>
                                    </div>
                                )}

                                {!txImageLoading && txImageError && (
                                    <div className="h-full min-h-[220px] flex items-center justify-center">
                                        <div className="text-sm font-medium text-slate-500">{txImageError}</div>
                                    </div>
                                )}

                                {!txImageLoading && !txImageError && txImageUrl && (
                                    <div className="flex items-center justify-center">
                                        <img
                                            src={txImageUrl}
                                            alt="Ảnh giao dịch"
                                            className="max-h-[calc(100vh-160px)] sm:max-h-[70vh] w-auto max-w-full rounded-2xl border border-slate-200 shadow-sm"
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

            {/* Customer Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {isLoadingCustomers ? (
                    // Show skeleton loaders while loading
                    Array.from({ length: 8 }).map((_, i) => (
                        <SkeletonCard key={i} />
                    ))
                ) : (
                    filteredCustomers?.map(customer => {
                        return (
                            <div
                                key={customer._id}
                                onClick={() => handleEdit(customer)}
                                className="group relative bg-white rounded-[2rem] border border-slate-100 p-5 shadow-sm hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col"
                            >
                                {/* Decorative Background Element */}
                                <div className="absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br from-blue-50 to-indigo-50/30 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out z-0 opacity-60"></div>

                                {/* Paid in Full Ribbon */}
                                {customer.is_paid_in_full && (
                                    <div className="absolute top-0 right-0 z-20 text-center pointer-events-none overflow-hidden w-32 h-32">
                                        <div className="absolute top-[24px] right-[-34px] rotate-45 bg-gradient-to-r from-emerald-500 to-green-600 text-white text-xs font-bold py-1.5 w-[160px] shadow-lg shadow-emerald-500/40 uppercase tracking-widest leading-none">
                                            Đã tất toán
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center gap-4 mb-5 relative z-10">
                                    {/* Avatar Circle */}
                                    <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center border border-slate-200 group-hover:bg-blue-50 group-hover:text-blue-500 group-hover:border-blue-100 transition-colors duration-300">
                                        <User size={28} />
                                    </div>
                                    <div className="flex-1 min-w-0 text-center sm:text-left">
                                        <h3 className="text-lg font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                                            {customer.name}
                                        </h3>

                                    </div>
                                </div>

                                <div className="space-y-3 mb-6 relative z-10">
                                    <div className="flex items-start gap-2.5 text-slate-500 text-sm">
                                        <div className="p-1.5 bg-slate-50 text-slate-400 rounded-lg group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                                            <MapPin size={14} />
                                        </div>
                                        <span className="leading-tight pt-0.5 line-clamp-2 italic font-medium text-slate-500">
                                            {customer.contact_info || 'Chưa cập nhật địa chỉ'}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-end relative z-10">
                                    <Link
                                        to={`/customers/${customer.id}/debt`}
                                        onClick={(e) => e.stopPropagation()}
                                        className="w-full flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-wider text-blue-600 hover:text-white hover:bg-blue-600 border border-blue-100 hover:border-blue-600 transition-all px-4 py-4 rounded-2xl shadow-sm group/btn"
                                    >
                                        Xem chi tiết nợ <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                                    </Link>
                                </div>
                            </div>
                        );
                    })
                )}

                {filteredCustomers?.length === 0 && (
                    <div className="col-span-full py-16 flex flex-col items-center justify-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-dashed border-slate-200">
                            <Users size={32} className="opacity-40" />
                        </div>
                        <p className="font-medium text-slate-500">Không tìm thấy khách hàng</p>
                        <p className="text-sm mt-1">Thử tìm từ khóa khác hoặc thêm khách hàng mới</p>
                    </div>
                )}
            </div >
        </div >
    );
}
