import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTransactions, createTransaction, updateTransaction, getCustomers, getInterestConfigs, createCustomer } from '../services/api';
import { Plus, Edit2, Search, Calendar, Tag, Filter, X, ChevronDown, Check, UserPlus, ArrowUpDown, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';
import DateInput from '../components/DateInput';
import { formatDate } from '../utils/dateUtils';
import AlertModal from '../components/AlertModal';
import { useToast } from '../context/ToastContext';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import { deleteTransactionSecure } from '../services/api';

export default function Transactions() {
    const queryClient = useQueryClient();
    const { showToast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [customerSearchTerm, setCustomerSearchTerm] = useState('');
    const [selectedCustomerId, setSelectedCustomerId] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Alert State
    const [alertState, setAlertState] = useState({ isOpen: false, title: '', message: '', type: 'info' });

    const showAlert = (title, message, type = 'info') => {
        setAlertState({ isOpen: true, title, message, type });
    };

    // Customer Combobox State
    const [customerSearch, setCustomerSearch] = useState('');
    const [isComboboxOpen, setIsComboboxOpen] = useState(false);
    const comboboxRef = useRef(null);

    // Quick Create Customer State
    const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
    const [newCustomerName, setNewCustomerName] = useState('');
    const [newCustomerContact, setNewCustomerContact] = useState('');

    // Form State
    const [formData, setFormData] = useState({
        customer_id: '',
        type: '',
        amount: '',
        content: '',
        transaction_date: new Date().toISOString().split('T')[0],
        status: 'OPEN',
        closed_at: new Date().toISOString().split('T')[0]
    });

    // Queries
    const { data: customers } = useQuery({ queryKey: ['customers'], queryFn: getCustomers });
    const { data: configs } = useQuery({ queryKey: ['interest-configs'], queryFn: getInterestConfigs });

    const { data: rawTransactions } = useQuery({
        queryKey: ['transactions', startDate, endDate],
        queryFn: () => getTransactions(undefined, startDate || undefined, endDate || undefined)
    });

    // Default Sort: Newest to Oldest (Date Descending)
    const sortedTransactions = React.useMemo(() => {
        if (!rawTransactions) return [];
        return [...rawTransactions].sort((a, b) => {
            return new Date(b.transaction_date) - new Date(a.transaction_date);
        });
    }, [rawTransactions]);

    // Filtering
    const filteredTransactions = React.useMemo(() => {
        let result = sortedTransactions;

        if (customerSearchTerm) {
            const searchLower = customerSearchTerm.toLowerCase();
            result = result.filter(t => {
                const customerId = t.customer_id || t.customer?.id || t.customer;
                const customer = customers?.find(c => c._id === customerId);
                return customer?.name?.toLowerCase().includes(searchLower);
            });
        }

        if (selectedCustomerId) {
            result = result.filter(t => (t.customer_id || t.customer?.id || t.customer) === selectedCustomerId);
        }

        if (startDate) {
            result = result.filter(t => new Date(t.transaction_date) >= new Date(startDate));
        }
        if (endDate) {
            result = result.filter(t => new Date(t.transaction_date) <= new Date(endDate));
        }

        return result;
    }, [sortedTransactions, customerSearchTerm, selectedCustomerId, startDate, endDate]);


    // Click outside to close combobox
    useEffect(() => {
        function handleClickOutside(event) {
            if (comboboxRef.current && !comboboxRef.current.contains(event.target)) {
                setIsComboboxOpen(false);
                // Reset search to selected customer name if invalid
                if (formData.customer_id) {
                    const selected = customers?.find(c => c._id === formData.customer_id);
                    if (selected && customerSearch !== selected.name) {
                        setCustomerSearch(selected.name);
                    }
                }
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [customers, formData.customer_id, customerSearch]);


    const createMutation = useMutation({
        mutationFn: (data) => createTransaction({ ...data, amount: parseFloat(data.amount) }),
        onSuccess: () => {
            queryClient.invalidateQueries(['transactions']);
            handleClose();
            showToast('Thành công', 'Đã tạo giao dịch mới', 'success');
        },
        onError: (err) => {
            showToast('Lỗi', err.response?.data?.detail || "Lỗi tạo giao dịch", 'error');
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => updateTransaction(id, { ...data, amount: parseFloat(data.amount) }),
        onSuccess: () => {
            queryClient.invalidateQueries(['transactions']);
            handleClose();
            showToast('Thành công', 'Đã cập nhật giao dịch', 'success');
        },
        onError: (err) => {
            showToast('Lỗi', err.response?.data?.detail || "Lỗi cập nhật giao dịch", 'error');
        }
    });

    const createCustomerMutation = useMutation({
        mutationFn: createCustomer,
        onSuccess: (newCustomer) => {
            queryClient.invalidateQueries(['customers']);
            // Auto Select New Customer
            setFormData(prev => ({ ...prev, customer_id: newCustomer._id }));
            setCustomerSearch(newCustomer.name);
            setIsQuickCreateOpen(false);
            setNewCustomerName('');
            setNewCustomerContact('');
            showToast('Thành công', `Đã thêm khách hàng "${newCustomerName}"`, 'success');
        },
        onError: (err) => {
            showToast('Lỗi', err.response?.data?.detail || "Lỗi tạo khách hàng", 'error');
        }
    });

    const handleEdit = (tx) => {
        setEditingId(tx._id);
        const customerId = tx.customer_id || tx.customer?.id || tx.customer;
        const selectedCustomer = customers?.find(c => c._id === customerId);

        setFormData({
            customer_id: customerId,
            type: tx.type,
            amount: tx.amount,
            content: tx.content,
            transaction_date: tx.transaction_date.split('T')[0],
            status: tx.status,
            closed_at: tx.closed_at ? tx.closed_at.split('T')[0] : new Date().toISOString().split('T')[0]
        });
        setCustomerSearch(selectedCustomer ? selectedCustomer.name : '');
        setIsOpen(true);
    };

    const handleStatusToggle = (e, tx) => {
        e.stopPropagation(); // Prevent row click
        const newStatus = tx.status === 'OPEN' ? 'PAID' : 'OPEN';

        // Optimistic update or just wait for refetch? 
        // Let's us mutation directly
        updateMutation.mutate({
            id: tx._id,
            data: { status: newStatus } // Only send status, backend handles logic
        });
    };

    // Delete Logic
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const deleteMutation = useMutation({
        mutationFn: ({ id, pin }) => deleteTransactionSecure(id, pin),
        onSuccess: () => {
            queryClient.invalidateQueries(['transactions']);
            setIsDeleteModalOpen(false);
            handleClose();
            showToast('Thành công', 'Đã xóa giao dịch', 'success');
        },
        onError: (err) => {
            // Keep modal open to retry pin
            showToast('Lỗi', err.response?.data?.detail || "Lỗi xóa giao dịch", 'error');
        }
    });

    const handleDeleteConfirm = (pin) => {
        if (editingId) {
            deleteMutation.mutate({ id: editingId, pin });
        }
    };

    const handleClose = () => {
        setIsOpen(false);
        setEditingId(null);
        setFormData({
            customer_id: '',
            type: '',
            amount: '',
            content: '',
            transaction_date: new Date().toISOString().split('T')[0],
            status: 'OPEN'
        });
        setCustomerSearch('');
    };

    const handleQuickCreateSubmit = (e) => {
        e.preventDefault();
        createCustomerMutation.mutate({
            name: newCustomerName,
            contact_info: newCustomerContact
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingId) {
            updateMutation.mutate({ id: editingId, data: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    // Filter customers for combobox
    const filteredCustomers = customers?.filter(c =>
        c.name.toLowerCase().includes(customerSearch.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <AlertModal
                isOpen={alertState.isOpen}
                onClose={() => setAlertState({ ...alertState, isOpen: false })}
                title={alertState.title}
                message={alertState.message}
                type={alertState.type}
            />
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Danh Sách Giao Dịch</h2>
                    <p className="text-slate-500 text-sm">Quản lý các giao dịch vay và nợ</p>
                </div>

                <div className="flex gap-2 flex-wrap items-center justify-end">
                    <div className="flex gap-2 items-center bg-white p-1 rounded-xl border border-slate-200">
                        <DateInput
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                            className="bg-transparent text-sm w-32 px-2 py-1.5 outline-none font-medium text-slate-600 placeholder:text-slate-400"
                            placeholder="Từ ngày"
                        />
                        <span className="text-slate-300">-</span>
                        <DateInput
                            value={endDate}
                            onChange={e => setEndDate(e.target.value)}
                            className="bg-transparent text-sm w-32 px-2 py-1.5 outline-none font-medium text-slate-600 placeholder:text-slate-400"
                            placeholder="Đến ngày"
                        />
                        {(startDate || endDate) && (
                            <button
                                onClick={() => { setStartDate(''); setEndDate(''); }}
                                className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {/* Text Search Filter */}
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                            <Search size={18} />
                        </div>
                        <input
                            type="text"
                            className="pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm transition-all text-sm font-medium text-slate-700 hover:border-slate-300 min-w-[220px]"
                            value={customerSearchTerm}
                            onChange={e => setCustomerSearchTerm(e.target.value)}
                            placeholder="Tìm kiếm khách hàng..."
                        />
                        {customerSearchTerm && (
                            <button
                                onClick={() => setCustomerSearchTerm('')}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-red-500 transition-colors"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {/* Dropdown Filter */}
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                            <Filter size={18} />
                        </div>
                        <select
                            className="pl-10 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm transition-all appearance-none cursor-pointer text-sm font-medium text-slate-700 hover:border-slate-300 min-w-[180px]"
                            value={selectedCustomerId}
                            onChange={e => setSelectedCustomerId(e.target.value)}
                        >
                            <option value="">Tất cả khách hàng</option>
                            {customers?.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                        </select>
                    </div>

                    <button
                        onClick={() => {
                            if (selectedCustomerId) {
                                // Priority 1: Dropdown Selection (Exact ID)
                                const selected = customers?.find(c => c._id === selectedCustomerId);
                                if (selected) {
                                    setFormData(prev => ({ ...prev, customer_id: selected._id }));
                                    setCustomerSearch(selected.name); // Pre-fill name for display
                                }
                            } else if (customerSearchTerm) {
                                // Priority 2: Search Term (Partial Match)
                                // Always pre-fill the search with the filter text so the modal is filtered
                                setCustomerSearch(customerSearchTerm);

                                // If exact name match, select the ID too
                                const selected = customers?.find(c => c.name.toLowerCase() === customerSearchTerm.toLowerCase());
                                if (selected) {
                                    setFormData(prev => ({ ...prev, customer_id: selected._id }));
                                }
                            }
                            setIsOpen(true);
                        }}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-blue-200 font-medium text-sm active:scale-95"
                    >
                        <Plus size={18} />
                        Tạo Giao Dịch
                    </button>
                </div>
            </div>

            {/* Quick Create Customer Modal */}
            {isQuickCreateOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 animate-in zoom-in duration-200">
                        <h4 className="text-lg font-bold text-slate-800 mb-4">Thêm Khách Hàng Nhanh</h4>
                        <form onSubmit={handleQuickCreateSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Tên khách hàng</label>
                                <input
                                    autoFocus
                                    required
                                    className="w-full border border-slate-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    value={newCustomerName}
                                    onChange={e => setNewCustomerName(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Thông tin liên hệ</label>
                                <input
                                    className="w-full border border-slate-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    value={newCustomerContact}
                                    onChange={e => setNewCustomerContact(e.target.value)}
                                    placeholder="SĐT, Địa chỉ..."
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setIsQuickCreateOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium">Hủy</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">Lưu</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden scale-100 animate-in fade-in zoom-in duration-200 relative">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="text-lg font-bold text-slate-800">{editingId ? 'Chỉnh Sửa Giao Dịch' : 'Tạo Giao Dịch Mới'}</h3>
                            <button onClick={handleClose} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div className="grid grid-cols-1 gap-5">
                                {/* 1. Ngày giao dịch */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Ngày giao dịch</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                            <Calendar size={18} />
                                        </div>
                                        <DateInput
                                            required
                                            className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-700"
                                            value={formData.transaction_date}
                                            onChange={e => setFormData({ ...formData, transaction_date: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* 2. Khách hàng (Odoo-like Combobox) */}
                                <div className="relative" ref={comboboxRef}>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Khách hàng</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            required
                                            className="w-full border border-slate-200 rounded-xl pl-4 pr-10 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-800"
                                            value={customerSearch}
                                            onChange={(e) => {
                                                setCustomerSearch(e.target.value);
                                                setIsComboboxOpen(true);
                                                // Clear ID if typing changes
                                                if (formData.customer_id && e.target.value !== customers?.find(c => c._id === formData.customer_id)?.name) {
                                                    setFormData({ ...formData, customer_id: '' });
                                                }
                                            }}
                                            onClick={() => setIsComboboxOpen(true)}
                                            placeholder="Chọn hoặc nhập tên để tạo mới..."
                                        />
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                                            <ChevronDown size={18} />
                                        </div>
                                    </div>

                                    {/* Dropdown */}
                                    {isComboboxOpen && (
                                        <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-auto py-1 animate-in fade-in zoom-in-95 duration-100">
                                            {filteredCustomers?.length > 0 && (
                                                <ul className="py-1">
                                                    {filteredCustomers.map(c => (
                                                        <li
                                                            key={c._id}
                                                            onClick={() => {
                                                                setFormData({ ...formData, customer_id: c._id });
                                                                setCustomerSearch(c.name);
                                                                setIsComboboxOpen(false);
                                                            }}
                                                            className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer flex justify-between items-center group transition-colors"
                                                        >
                                                            <span className="font-medium text-slate-700 group-hover:text-blue-700">{c.name}</span>
                                                            {formData.customer_id === c._id && <Check size={16} className="text-blue-600" />}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}

                                            {/* Create Option */}
                                            {customerSearch && !customers?.some(c => c.name.toLowerCase() === customerSearch.toLowerCase()) && (
                                                <div
                                                    onClick={() => {
                                                        setNewCustomerName(customerSearch);
                                                        setIsQuickCreateOpen(true);
                                                        setIsComboboxOpen(false);
                                                    }}
                                                    className="px-4 py-3 border-t border-slate-100 hover:bg-blue-50 cursor-pointer text-blue-600 font-semibold flex items-center gap-2 transition-colors"
                                                >
                                                    <UserPlus size={18} />
                                                    Tạo mới "{customerSearch}"
                                                </div>
                                            )}

                                            {customerSearch.length === 0 && filteredCustomers?.length === 0 && (
                                                <div className="px-4 py-3 text-slate-400 text-sm text-center">
                                                    Nhập tên để tìm kiếm...
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* 3. Loại giao dịch */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Loại giao dịch</label>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        {configs?.map((config) => (
                                            <button
                                                key={config.code}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, type: config.code })}
                                                className={clsx(
                                                    "px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all",
                                                    formData.type === config.code
                                                        ? "bg-indigo-50 text-indigo-700 border-indigo-200 ring-2 ring-indigo-500/20"
                                                        : "bg-white text-slate-600 border-slate-200 hover:border-indigo-200 hover:text-indigo-600"
                                                )}
                                            >
                                                {config.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* 4. Nội dung */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Nội dung</label>
                                    <textarea
                                        required
                                        className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all min-h-[80px] resize-none"
                                        value={formData.content}
                                        onChange={e => setFormData({ ...formData, content: e.target.value })}
                                        placeholder="Nhập nội dung chi tiết..."
                                    />
                                </div>

                                {/* 5. Số tiền */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Số tiền</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <span className="text-slate-500 font-bold text-lg leading-none pb-1">đ</span>
                                        </div>
                                        <input
                                            type="text"
                                            required
                                            className="w-full border border-slate-200 rounded-xl pl-10 pr-12 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono font-bold text-lg text-slate-800"
                                            value={formData.amount ? Number(formData.amount).toLocaleString('en-US') : ''}
                                            onChange={e => {
                                                // Allow only digits
                                                const rawValue = e.target.value.replace(/,/g, '');
                                                if (/^\d*$/.test(rawValue)) {
                                                    setFormData({ ...formData, amount: rawValue });
                                                }
                                            }}
                                            placeholder="0"
                                        />
                                    </div>
                                </div>
                                {/* 6. Trạng thái (Chỉ hiện khi Edit) */}
                                {/* 6. Trạng thái & Ngày thanh toán (Chỉ hiện khi Edit) */}
                                {editingId && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Trạng thái</label>
                                            <select
                                                className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                                                value={formData.status}
                                                onChange={e => setFormData({ ...formData, status: e.target.value })}
                                            >
                                                <option value="OPEN">Chưa thanh toán</option>
                                                <option value="PAID">Đã thanh toán</option>
                                            </select>
                                        </div>

                                        {formData.status === 'PAID' && (
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Ngày thanh toán</label>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                                        <Calendar size={18} />
                                                    </div>
                                                    <DateInput
                                                        required
                                                        className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-700"
                                                        value={formData.closed_at}
                                                        onChange={e => setFormData({ ...formData, closed_at: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-between items-center pt-4 border-t border-slate-100 mt-2">
                                <div>
                                    {editingId && (
                                        <button
                                            type="button"
                                            onClick={() => setIsDeleteModalOpen(true)}
                                            className="px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-xl font-medium transition-colors flex items-center gap-2"
                                        >
                                            <Trash2 size={18} />
                                            Xóa
                                        </button>
                                    )}
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={handleClose}
                                        className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors"
                                    >
                                        Hủy bỏ
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={createMutation.isPending || updateMutation.isPending}
                                        className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-200 hover:-translate-y-0.5 transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {createMutation.isPending || updateMutation.isPending ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                Đang xử lý...
                                            </>
                                        ) : (editingId ? 'Lưu thay đổi' : 'Tạo giao dịch')}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="Xóa Giao Dịch"
                warningMessage="Hành động này không thể hoàn tác. Bạn có chắc chắn muốn xóa giao dịch này?"
                isDeleting={deleteMutation.isPending}
            />


            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        Ngày GD
                                    </div>
                                </th>
                                <th className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        Khách hàng
                                    </div>
                                </th>
                                <th className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        Loại
                                    </div>
                                </th>
                                <th className="px-6 py-4">Nội dung</th>
                                <th className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        Tiền gốc
                                    </div>
                                </th>
                                <th className="px-6 py-4 text-center">Lãi suất</th>
                                <th className="px-6 py-4 text-center">Thời gian</th>
                                <th className="px-6 py-4 text-right">Tiền lãi</th>
                                <th className="px-6 py-4 text-right">Tổng cộng</th>
                                <th className="px-6 py-4 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        Trạng thái
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredTransactions?.map((tx) => {
                                const customerName = customers?.find(c => c._id === (tx.customer_id || tx.customer?.id || tx.customer))?.name || 'Không xác định';
                                const typeConfig = configs?.find(c => c.code === tx.type);
                                const typeName = typeConfig ? typeConfig.name : tx.type;
                                const calc = tx.interest_calculation;
                                const total = tx.amount + (calc?.rounded_interest || 0);
                                const isCash = tx.type === 'TIEN_MAT';

                                return (
                                    <tr
                                        key={tx._id}
                                        className="group hover:bg-blue-50/50 transition-colors cursor-pointer"
                                        onClick={() => handleEdit(tx)}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium">
                                            {formatDate(tx.transaction_date)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-800">
                                            {customerName}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={clsx(
                                                "inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border",
                                                isCash
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                    : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                                            )}>
                                                {typeName}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600 max-w-xs whitespace-pre-wrap leading-relaxed">
                                            {tx.content}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-mono font-medium text-slate-700">
                                            {tx.amount.toLocaleString('vi-VN')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-slate-500">
                                            {tx.interest_rate_snapshot}%
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                                            {calc ? (
                                                <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md text-xs font-medium">
                                                    {calc?.months.toFixed(1)} tháng
                                                </span>
                                            ) : <span className="text-slate-300">-</span>}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-mono font-medium text-orange-600">
                                            {calc ? `+ ${calc?.rounded_interest.toLocaleString('vi-VN')}` : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-mono font-bold text-slate-900">
                                            {calc ? total.toLocaleString('vi-VN') : tx.amount.toLocaleString('vi-VN')}
                                            <span className="text-xs text-slate-400 ml-1 font-sans font-normal">đ</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <button
                                                onClick={(e) => handleStatusToggle(e, tx)}
                                                className={clsx(
                                                    "px-2 py-1 rounded-md text-xs font-bold border transition-all hover:scale-105 active:scale-95",
                                                    tx.status === 'PAID'
                                                        ? "bg-green-50 text-green-700 border-green-100 hover:bg-green-100"
                                                        : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                                                )}
                                            >
                                                {tx.status === 'PAID' ? 'Đã thanh toán' : 'Chưa thu'}
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })}
                            {filteredTransactions?.length === 0 && (
                                <tr>
                                    <td colSpan="10" className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center justify-center text-slate-400">
                                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-dashed border-slate-200">
                                                <Search size={32} className="opacity-40" />
                                            </div>
                                            <p className="font-medium text-slate-500">Chưa có giao dịch nào</p>
                                            <p className="text-sm mt-1">Thử thay đổi bộ lọc hoặc tạo giao dịch mới</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div >
    );
}
