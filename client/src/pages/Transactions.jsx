import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTransactions, createTransaction, updateTransaction, getCustomers, getInterestConfigs, createCustomer, uploadTransactionImage, fetchTransactionImageBlob, deleteTransactionImage } from '../services/api';
import { Plus, Edit2, Search, Calendar, Tag, Filter, X, ChevronRight, Check, Clock, User, UserPlus, ArrowUpDown, ArrowUp, ArrowDown, Trash2, Camera, Image as ImageIcon, Loader2, ZoomIn, ZoomOut, RotateCw, Download } from 'lucide-react';
import { clsx } from 'clsx';
import DateInput from '../components/DateInput';
import { formatDate } from '../utils/dateUtils';
import AlertModal from '../components/AlertModal';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import { deleteTransactionSecure } from '../services/api';
import { SkeletonTable } from '../components/SkeletonLoader';
import { trapFocus } from '../utils/focusTrap';
import { handleComboboxKeyboard } from '../utils/keyboardNav';

export default function Transactions() {
    const queryClient = useQueryClient();
    const { showToast } = useToast();
    const { user } = useAuth();
    const isAdmin = user?.role === 'ADMIN';
    const [isOpen, setIsOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editingHasImage, setEditingHasImage] = useState(true);
    const [txImageUrl, setTxImageUrl] = useState(null);
    const [txImageLoading, setTxImageLoading] = useState(false);
    const [txImageError, setTxImageError] = useState('');
    const [pendingUploadFile, setPendingUploadFile] = useState(null);
    const [isImageDetailOpen, setIsImageDetailOpen] = useState(false);
    const [isDeleteImageModalOpen, setIsDeleteImageModalOpen] = useState(false);
    const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);
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
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const comboboxRef = useRef(null);

    // Filter Combobox State
    const [isFilterComboboxOpen, setIsFilterComboboxOpen] = useState(false);
    const [highlightedFilterIndex, setHighlightedFilterIndex] = useState(-1);
    const filterComboboxRef = useRef(null);

    // Modal refs for focus trap
    const txModalRef = useRef(null);
    const quickCreateModalRef = useRef(null);
    const dateInputRef = useRef(null);
    const quickCreateNameRef = useRef(null);
    const fileInputRef = useRef(null);
    const fileUploadInputRef = useRef(null);

    // Quick Create Customer State
    const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
    const [newCustomerName, setNewCustomerName] = useState('');
    const [newCustomerContact, setNewCustomerContact] = useState('');
    const [createAnother, setCreateAnother] = useState(false);

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

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    async function fetchImageBlobWithRetry(id, { retries = 4, baseDelayMs = 350 } = {}) {
        let lastError;
        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                return await fetchTransactionImageBlob(id);
            } catch (e) {
                lastError = e;
                const status = e?.response?.status;
                // 404 can happen briefly right after Drive upload; 502 may happen while backend retries Drive.
                const retryable = status === 404 || status === 502;
                if (!retryable || attempt === retries) throw e;
                await sleep(baseDelayMs * Math.pow(2, attempt));
            }
        }
        throw lastError;
    }

    // Queries
    const { data: customers } = useQuery({ queryKey: ['customers'], queryFn: getCustomers });
    const { data: configs } = useQuery({ queryKey: ['interest-configs'], queryFn: getInterestConfigs });

    const { data: rawTransactions, isLoading: isLoadingTransactions } = useQuery({
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
                const customer = customers?.find(c => c.id === customerId);
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


    // Click outside to close comboboxes
    useEffect(() => {
        function handleClickOutside(event) {
            // Transaction Form Combobox
            if (comboboxRef.current && !comboboxRef.current.contains(event.target)) {
                setIsComboboxOpen(false);
                setHighlightedIndex(-1);
                // Reset search to selected customer name if invalid
                if (formData.customer_id) {
                    const selected = customers?.find(c => c.id === formData.customer_id);
                    if (selected && customerSearch !== selected.name) {
                        setCustomerSearch(selected.name);
                    }
                }
            }

            // Main Filter Combobox
            if (filterComboboxRef.current && !filterComboboxRef.current.contains(event.target)) {
                setIsFilterComboboxOpen(false);
                setHighlightedFilterIndex(-1);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [customers, formData.customer_id, customerSearch]);

    // ESC key handler for transaction modal
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

    // Focus trap for transaction modal
    useEffect(() => {
        if (!isOpen || !txModalRef.current) return;

        const handleTabKey = (event) => {
            if (event.key === 'Tab') {
                trapFocus(txModalRef.current, event);
            }
        };

        document.addEventListener('keydown', handleTabKey);
        return () => document.removeEventListener('keydown', handleTabKey);
    }, [isOpen]);



    // ESC key handler for quick create modal
    useEffect(() => {
        if (!isQuickCreateOpen) return;

        const handleEscKey = (event) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                setIsQuickCreateOpen(false);
            }
        };

        document.addEventListener('keydown', handleEscKey);
        return () => document.removeEventListener('keydown', handleEscKey);
    }, [isQuickCreateOpen]);

    // Focus trap for quick create modal
    useEffect(() => {
        if (!isQuickCreateOpen || !quickCreateModalRef.current) return;

        const handleTabKey = (event) => {
            if (event.key === 'Tab') {
                trapFocus(quickCreateModalRef.current, event);
            }
        };

        document.addEventListener('keydown', handleTabKey);
        return () => document.removeEventListener('keydown', handleTabKey);
    }, [isQuickCreateOpen]);

    // Auto-focus on name input in quick create modal
    useEffect(() => {
        if (isQuickCreateOpen && quickCreateNameRef.current) {
            setTimeout(() => {
                quickCreateNameRef.current?.focus();
            }, 100);
        }
    }, [isQuickCreateOpen]);


    const uploadImageMutation = useMutation({
        mutationFn: ({ id, file }) => uploadTransactionImage(id, file),
        onSuccess: async (data, variables) => {
            queryClient.invalidateQueries(['transactions']);
            setEditingHasImage(true);
            // Refresh image url
            try {
                const blob = await fetchImageBlobWithRetry(variables.id);
                const nextUrl = URL.createObjectURL(blob);
                setTxImageUrl(prev => {
                    if (prev) URL.revokeObjectURL(prev);
                    return nextUrl;
                });
            } catch (error) {
                console.warn('Failed to refresh image immediately:', error?.response?.status || error?.message);
            }
            showToast('Thành công', 'Đổi ảnh thành công', 'success');
        },
        onError: (error) => {
            const msg = error?.response?.data?.error || error?.message || 'Lỗi upload ảnh';
            setTxImageError(msg);
            showToast('Lỗi', `Không thể upload ảnh: ${msg}`, 'error');
        }
    });

    const handleSelectedImageFile = (file) => {
        if (!file) return;
        setTxImageError('');

        if (file.size > 5 * 1024 * 1024) {
            const msg = 'Ảnh quá lớn (>5MB). Vui lòng chọn ảnh nhỏ hơn.';
            setTxImageError(msg);
            showToast('Cảnh báo', msg, 'warning');
            return;
        }

        if (editingId) {
            uploadImageMutation.mutate({ id: editingId, file });
        } else {
            // Create mode: store file to upload later
            setPendingUploadFile(file);
            // Preview immediatly
            setTxImageUrl(prev => {
                if (prev) URL.revokeObjectURL(prev);
                return URL.createObjectURL(file);
            });
            setIsImageDetailOpen(true);
        }
    };

    const openImagePicker = () => setIsImagePickerOpen(true);
    const closeImagePicker = () => setIsImagePickerOpen(false);
    const pickFromCamera = () => {
        closeImagePicker();
        fileInputRef.current?.click();
    };
    const pickFromFile = () => {
        closeImagePicker();
        fileUploadInputRef.current?.click();
    };

    const deleteImageMutation = useMutation({
        mutationFn: () => deleteTransactionImage(editingId),
        onSuccess: () => {
            setTxImageUrl(null);
            setIsImageDetailOpen(false);
            setIsDeleteImageModalOpen(false);
            setEditingHasImage(false);
            queryClient.invalidateQueries(['transactions']);
            showToast('Thành công', 'Xóa ảnh thành công', 'success');
        },
        onError: (error) => showToast('Lỗi', `Không thể xóa ảnh: ${error.message}`, 'error')
    });

    const createMutation = useMutation({
        mutationFn: (data) => {
            const payload = { ...data };
            if ('amount' in payload) {
                payload.amount = parseFloat(payload.amount);
            }
            return createTransaction(payload);
        },
        onSuccess: (newTx) => {
            const txId = newTx.id || newTx._id;

            // Should we upload image?
            if (pendingUploadFile && txId) {
                uploadImageMutation.mutate({ id: txId, file: pendingUploadFile }, {
                    onSuccess: () => {
                        queryClient.invalidateQueries(['transactions']);
                        showToast('Thành công', 'Đã tạo giao dịch và upload ảnh', 'success');
                        if (createAnother) {
                            // Reset form but keep createAnother logic (which is handled below in a slightly complex way in original code, simplifying here)
                            // The original code reset form inside onSuccess. We should do it after image upload is done.
                            setFormData(prev => ({
                                ...prev,
                                type: '',
                                amount: '',
                                content: '',
                                transaction_date: new Date().toISOString().split('T')[0],
                                status: 'OPEN',
                                closed_at: new Date().toISOString().split('T')[0]
                            }));
                            setPendingUploadFile(null);
                            setTxImageUrl(null);
                        } else {
                            handleClose();
                        }
                    },
                    onError: (err) => {
                        const msg = err?.response?.data?.error || err?.message || 'Upload ảnh thất bại';
                        showToast('Cảnh báo', 'Tạo giao dịch thành công nhưng lỗi upload ảnh: ' + msg, 'warning');
                        if (!createAnother) handleClose();
                    }
                });
            } else {
                queryClient.invalidateQueries(['transactions']);
                showToast('Thành công', 'Đã tạo giao dịch', 'success');

                if (createAnother) {
                    setFormData(prev => ({
                        ...prev,
                        type: '',
                        amount: '',
                        content: '',
                        transaction_date: new Date().toISOString().split('T')[0],
                        status: 'OPEN',
                        closed_at: new Date().toISOString().split('T')[0]
                    }));
                    setPendingUploadFile(null);
                    setTxImageUrl(null);
                } else {
                    handleClose();
                }
            }
        },
        onError: (err) => {
            showToast('Lỗi', err.response?.data?.error || 'Lỗi tạo giao dịch', 'error');
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => {
            const payload = { ...data };
            // Only coerce/override amount when caller provides it.
            // This avoids sending amount=NaN when updating only status/closed_at.
            if ('amount' in payload) {
                payload.amount = parseFloat(payload.amount);
            }
            return updateTransaction(id, payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['transactions']);
            handleClose();
            showToast('Thành công', 'Đã cập nhật giao dịch', 'success');
        },
        onError: (err) => {
            showToast('Lỗi', err.response?.data?.error || 'Lỗi cập nhật giao dịch', 'error');
        }
    });

    const createCustomerMutation = useMutation({
        mutationFn: createCustomer,
        onSuccess: (newCustomer) => {
            queryClient.invalidateQueries(['customers']);
            // Auto Select New Customer
            setFormData(prev => ({ ...prev, customer_id: newCustomer.id }));
            setCustomerSearch(newCustomer.name);
            setIsQuickCreateOpen(false);
            setNewCustomerName('');
            setNewCustomerContact('');
            showToast('Thành công', `Đã thêm khách hàng "${newCustomerName}"`, 'success');
        },
        onError: (err) => {
            showToast('Lỗi', err.response?.data?.error || "Lỗi tạo khách hàng", 'error');
        }
    });



    const handleEdit = (tx) => {
        setEditingId(tx._id);
        setEditingHasImage(tx.image_drive_file_id !== undefined ? Boolean(tx.image_drive_file_id) : true);
        // Do not auto-load image when opening edit modal. Only load when user clicks view.
        setTxImageLoading(false);
        setTxImageError('');
        setTxImageUrl(prev => {
            if (prev) URL.revokeObjectURL(prev);
            return null;
        });
        const customerId = tx.customer_id || tx.customer?.id || tx.customer;
        const selectedCustomer = customers?.find(c => c.id === customerId);

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

    // Lazy-load image ONLY when user opens the viewer.
    useEffect(() => {
        let cancelled = false;

        async function loadImageForViewer() {
            if (!isOpen || !editingId) return;
            if (!isImageDetailOpen) return;
            if (!editingHasImage) return;
            if (txImageUrl) return; // already loaded (or create-mode preview)

            setTxImageError('');
            setTxImageLoading(true);
            try {
                const blob = await fetchImageBlobWithRetry(editingId);
                if (cancelled) return;
                const url = URL.createObjectURL(blob);
                setTxImageUrl(url);
            } catch (e) {
                const status = e?.response?.status;
                if (status === 404) {
                    setEditingHasImage(false);
                    setTxImageError('Giao dịch chưa có ảnh');
                } else {
                    setTxImageError(e?.response?.data?.error || 'Không thể tải ảnh');
                }
            } finally {
                if (!cancelled) setTxImageLoading(false);
            }
        }

        loadImageForViewer();

        return () => {
            cancelled = true;
        };
    }, [isOpen, editingId, editingHasImage, isImageDetailOpen, txImageUrl]);

    useEffect(() => {
        return () => {
            if (txImageUrl) URL.revokeObjectURL(txImageUrl);
        };
    }, [txImageUrl]);

    const handleStatusToggle = (e, tx) => {
        e.stopPropagation(); // Prevent row click
        const newStatus = tx.status === 'OPEN' ? 'PAID' : 'OPEN';

        const now = new Date();
        const txDate = tx?.transaction_date ? new Date(tx.transaction_date) : null;
        const effectivePaidAt = txDate && !isNaN(txDate.getTime()) && txDate > now ? txDate : now;
        const nowIso = effectivePaidAt.toISOString();

        // Optimistic update or just wait for refetch? 
        // Let's us mutation directly
        updateMutation.mutate({
            id: tx._id,
            data: {
                status: newStatus,
                closed_at: newStatus === 'PAID' ? nowIso : null
            }
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
        setEditingHasImage(true);
        setTxImageLoading(false);
        setTxImageError('');
        setTxImageUrl(prev => {
            if (prev) URL.revokeObjectURL(prev);
            return null;
        });
        setPendingUploadFile(null); // Clear pending file on close
        setIsImageDetailOpen(false);
        setIsImagePickerOpen(false);
        setFormData({
            customer_id: '',
            type: '',
            amount: '',
            content: '',
            transaction_date: new Date().toISOString().split('T')[0],
            status: 'OPEN',
            closed_at: new Date().toISOString().split('T')[0]
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

        if (formData.status === 'PAID') {
            const txDate = new Date(formData.transaction_date);
            const paidDate = new Date(formData.closed_at);
            if (!isNaN(txDate.getTime()) && !isNaN(paidDate.getTime()) && paidDate < txDate) {
                showToast('Lỗi', 'Ngày thanh toán không được nhỏ hơn ngày giao dịch', 'error');
                return;
            }
        }

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

    // Handle keyboard navigation in combobox
    const handleComboboxKeyDown = (event) => {
        if (!isComboboxOpen || !filteredCustomers) return;

        const handled = handleComboboxKeyboard(event, {
            items: filteredCustomers,
            selectedIndex: highlightedIndex,
            onSelect: (customer) => {
                setFormData({ ...formData, customer_id: customer._id });
                setCustomerSearch(customer.name);
                setIsComboboxOpen(false);
                setHighlightedIndex(-1);
            },
            onClose: () => {
                setIsComboboxOpen(false);
                setHighlightedIndex(-1);
            },
            onNavigate: (newIndex) => {
                setHighlightedIndex(newIndex);
            }
        });
    };


    // Filter Combobox Helpers
    const filteredCustomersForFilter = customers?.filter(c =>
        c.name.toLowerCase().includes(customerSearchTerm.toLowerCase())
    );

    const handleFilterComboboxKeyDown = (event) => {
        if (!isFilterComboboxOpen || !filteredCustomersForFilter) return;

        handleComboboxKeyboard(event, {
            items: filteredCustomersForFilter,
            selectedIndex: highlightedFilterIndex,
            onSelect: (customer) => {
                setSelectedCustomerId(customer.id);
                setCustomerSearchTerm(customer.name);
                setIsFilterComboboxOpen(false);
                setHighlightedFilterIndex(-1);
            },
            onClose: () => {
                setIsFilterComboboxOpen(false);
                setHighlightedFilterIndex(-1);
            },
            onNavigate: (newIndex) => {
                setHighlightedFilterIndex(newIndex);
            }
        });
    };

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
                    <h2 className="section-title">Danh Sách Giao Dịch</h2>
                    <p className="section-subtitle">Quản lý các giao dịch vay và nợ</p>
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
                                className="icon-btn text-red-500 hover:bg-red-50"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {/* Combined Customer Filter Combobox */}
                    <div className="relative group" ref={filterComboboxRef}>
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                            <Search size={18} />
                        </div>
                        <input
                            type="text"
                            className="input input-icon pr-10 min-w-[280px]"
                            value={customerSearchTerm}
                            onChange={e => {
                                setCustomerSearchTerm(e.target.value);
                                setIsFilterComboboxOpen(true);
                                setHighlightedFilterIndex(-1);
                                if (selectedCustomerId) {
                                    setSelectedCustomerId(''); // Clear selection if user types
                                }
                            }}
                            onFocus={() => setIsFilterComboboxOpen(true)}
                            onKeyDown={handleFilterComboboxKeyDown}
                            placeholder="Tìm kiếm khách hàng..."
                        />
                        {customerSearchTerm ? (
                            <button
                                onClick={() => {
                                    setCustomerSearchTerm('');
                                    setSelectedCustomerId('');
                                    setHighlightedFilterIndex(-1);
                                }}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-red-500 transition-colors"
                            >
                                <X size={14} />
                            </button>
                        ) : (
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                                <ArrowUpDown size={14} className="opacity-50" />
                            </div>
                        )}

                        {/* Filter Dropdown */}
                        {isFilterComboboxOpen && (
                            <div className="absolute z-[60] mt-2 w-full bg-white border border-slate-100 rounded-xl shadow-xl py-2 max-h-80 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                                {filteredCustomersForFilter?.map((customer, index) => (
                                    <div
                                        key={customer.id}
                                        onClick={() => {
                                            setSelectedCustomerId(customer.id);
                                            setCustomerSearchTerm(customer.name);
                                            setIsFilterComboboxOpen(false);
                                            setHighlightedFilterIndex(-1);
                                        }}
                                        className={clsx(
                                            "px-4 py-2.5 cursor-pointer flex items-center gap-3 transition-colors",
                                            highlightedFilterIndex === index ? "bg-blue-50" : "hover:bg-slate-50",
                                            selectedCustomerId === customer.id && "bg-blue-50/50"
                                        )}
                                    >
                                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                                            <User size={16} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-700">{customer.name}</p>
                                            {customer.contact_info && (
                                                <p className="text-[10px] text-slate-400 truncate max-w-[180px]">{customer.contact_info}</p>
                                            )}
                                        </div>
                                        {selectedCustomerId === customer.id && <Check size={16} className="ml-auto text-blue-600" />}
                                    </div>
                                ))}
                                {filteredCustomersForFilter?.length === 0 && (
                                    <div className="px-4 py-3 text-slate-400 text-sm text-center">
                                        Không tìm thấy khách hàng
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => {
                            if (selectedCustomerId) {
                                const selected = customers?.find(c => c.id === selectedCustomerId);
                                if (selected) {
                                    setFormData(prev => ({ ...prev, customer_id: selected.id }));
                                    setCustomerSearch(selected.name);
                                }
                            }
                            setIsOpen(true);
                        }}
                        className="btn-primary btn-md"
                    >
                        <Plus size={18} />
                        Tạo Giao Dịch
                    </button>
                </div>
            </div>

            {/* Quick Create Customer Modal */}
            {isQuickCreateOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                    <div
                        ref={quickCreateModalRef}
                        className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 animate-in zoom-in duration-200"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="quick-create-title"
                    >
                        <h4 id="quick-create-title" className="text-lg font-bold text-slate-800 mb-4">Thêm Khách Hàng Nhanh</h4>
                        <form onSubmit={handleQuickCreateSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Tên khách hàng</label>
                                <input
                                    ref={quickCreateNameRef}
                                    required
                                    className="input"
                                    value={newCustomerName}
                                    onChange={e => setNewCustomerName(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Thông tin liên hệ</label>
                                <input
                                    className="input"
                                    value={newCustomerContact}
                                    onChange={e => setNewCustomerContact(e.target.value)}
                                    placeholder="SĐT, Địa chỉ..."
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setIsQuickCreateOpen(false)} className="btn btn-secondary btn-md">Hủy</button>
                                <button type="submit" className="btn btn-primary btn-md">Lưu</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
                    <div
                        ref={txModalRef}
                        className="bg-white w-full sm:max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-300"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="tx-modal-title"
                    >
                        <div className="p-6 sm:p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-11 h-11 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200 shrink-0">
                                    {editingId ? <Edit2 size={20} /> : <Plus size={22} />}
                                </div>
                                <div className="min-w-0">
                                    <h2 id="tx-modal-title" className="text-xl font-bold text-slate-900 tracking-tight">
                                        {editingId ? 'Chỉnh sửa giao dịch' : 'Tạo giao dịch mới'}
                                    </h2>
                                    <p className="text-sm text-slate-500 mt-1 font-medium">
                                        {editingId ? 'Cập nhật lại thông tin bản ghi hiện có' : 'Thêm một bản ghi tài chính mới vào hệ thống'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {(() => {
                                    const hasImageIndicator = editingId ? editingHasImage : Boolean(pendingUploadFile);
                                    return (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (txImageLoading) return;

                                                // Use backend metadata to decide UI. Do not fetch image unless user opens viewer.
                                                if (hasImageIndicator) {
                                                    setIsImageDetailOpen(true);
                                                } else {
                                                    openImagePicker();
                                                }
                                            }}
                                            title={hasImageIndicator ? "Xem ảnh giao dịch" : "Thêm ảnh giao dịch"}
                                            className={clsx(
                                                "p-2.5 rounded-2xl transition-all border",
                                                txImageLoading && "opacity-60 cursor-not-allowed",
                                                hasImageIndicator
                                                    ? "bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100"
                                                    : "bg-white text-slate-400 border-slate-200 hover:text-blue-500 hover:border-blue-200"
                                            )}
                                            disabled={txImageLoading}
                                        >
                                            <ImageIcon size={20} />
                                        </button>
                                    );
                                })()}
                                <button
                                    onClick={handleClose}
                                    className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-2xl transition-all"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                            <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar min-h-0">
                                <div className="space-y-6">
                                    {/* Row 1: Date & Customer */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        {/* Date Input */}
                                        <div className="space-y-2">
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Ngày giao dịch</label>
                                            <div className="relative group">
                                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                                    <Calendar size={18} />
                                                </div>
                                                <div ref={dateInputRef}>
                                                    <DateInput
                                                        required
                                                        className="w-full h-[60px] bg-slate-50 border border-slate-100 rounded-[1.25rem] pl-12 pr-6 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all text-base font-medium text-slate-800 shadow-inner"
                                                        value={formData.transaction_date}
                                                        onChange={e => setFormData({ ...formData, transaction_date: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Customer Input */}
                                        <div className="space-y-2">
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Khách hàng</label>
                                            <div className="relative" ref={comboboxRef}>
                                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                                    <User size={18} />
                                                </div>
                                                <input
                                                    type="text"
                                                    className="w-full h-[60px] bg-slate-50 border border-slate-100 rounded-[1.25rem] pl-12 pr-6 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all text-base font-medium text-slate-800 shadow-inner placeholder:text-slate-300"
                                                    placeholder="Tìm khách hàng..."
                                                    value={customerSearch}
                                                    onChange={(e) => {
                                                        setCustomerSearch(e.target.value);
                                                        setIsComboboxOpen(true);
                                                        setHighlightedIndex(-1);
                                                        // Clear ID if typing changes
                                                        if (formData.customer_id && e.target.value !== customers?.find(c => c.id === formData.customer_id)?.name) {
                                                            setFormData({ ...formData, customer_id: '' });
                                                        }
                                                    }}
                                                    onFocus={() => setIsComboboxOpen(true)}
                                                    onKeyDown={handleComboboxKeyDown}
                                                />
                                                {isComboboxOpen && (
                                                    <div className="absolute z-[60] mt-2 w-full bg-white border border-slate-100 rounded-2xl shadow-2xl py-2 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                                                        {filteredCustomers?.map((customer, index) => (
                                                            <div
                                                                key={customer.id}
                                                                onClick={() => {
                                                                    setFormData({ ...formData, customer_id: customer.id });
                                                                    setCustomerSearch(customer.name);
                                                                    setIsComboboxOpen(false);
                                                                    setHighlightedIndex(-1);
                                                                }}
                                                                className={clsx(
                                                                    "px-5 py-3 cursor-pointer flex items-center gap-3 transition-colors",
                                                                    highlightedIndex === index ? "bg-blue-50" : "hover:bg-slate-50"
                                                                )}
                                                            >
                                                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                                                                    <User size={16} />
                                                                </div>
                                                                <span className="text-sm font-medium text-slate-700">{customer.name}</span>
                                                            </div>
                                                        ))}
                                                        {customerSearch && !customers?.some(c => c.name.toLowerCase() === customerSearch.toLowerCase()) && (
                                                            <div
                                                                onClick={() => {
                                                                    setNewCustomerName(customerSearch);
                                                                    setIsQuickCreateOpen(true);
                                                                    setIsComboboxOpen(false);
                                                                }}
                                                                className="px-5 py-4 border-t border-slate-50 hover:bg-blue-50 cursor-pointer text-blue-600 font-bold flex items-center gap-2 transition-colors"
                                                            >
                                                                <UserPlus size={18} />
                                                                <span className="text-sm">Tạo mới "{customerSearch}"</span>
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
                                        </div>
                                    </div>

                                    {/* Content (Full Width) */}
                                    <div className="space-y-2">
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Nội dung chi tiết</label>
                                        <textarea
                                            required
                                            className="w-full min-h-[140px] bg-slate-50 border border-slate-100 rounded-[1.25rem] px-6 py-4 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all text-base font-medium text-slate-800 shadow-inner resize-none placeholder:text-slate-300 leading-relaxed"
                                            value={formData.content}
                                            onChange={e => setFormData({ ...formData, content: e.target.value })}
                                            placeholder="Nhập nội dung vay/trả chi tiết..."
                                        />
                                    </div>

                                    {/* Hidden File Input (triggered from header) */}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        capture="environment"
                                        disabled={!!editingId && uploadImageMutation.isPending}
                                        ref={fileInputRef}
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            handleSelectedImageFile(file);
                                            e.target.value = '';
                                        }}
                                    />

                                    {/* Hidden File Input (upload from gallery/files - no capture) */}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        disabled={!!editingId && uploadImageMutation.isPending}
                                        ref={fileUploadInputRef}
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            handleSelectedImageFile(file);
                                            e.target.value = '';
                                        }}
                                    />
                                </div>



                                {/* Section: Loại giao dịch (Full Width Row) */}
                                <div className="space-y-2 mt-8">
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Loại giao dịch</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                                        {configs?.map((config) => (
                                            <button
                                                key={config.code}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, type: config.code })}
                                                className={clsx(
                                                    "px-1 py-2.5 rounded-xl text-xs font-bold border transition-all text-center flex items-center justify-center min-h-[48px] leading-tight active:scale-95 whitespace-nowrap",
                                                    formData.type === config.code
                                                        ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200"
                                                        : "bg-slate-50 text-slate-500 border-slate-100 hover:border-slate-200 hover:bg-white"
                                                )}
                                            >
                                                {config.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Section: Số tiền (Full Width Row) */}
                                <div className="space-y-2 mt-8">
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Số tiền giao dịch</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-slate-400 font-bold group-focus-within:text-blue-500 transition-colors">
                                            đ
                                        </div>
                                        <input
                                            type="text"
                                            required
                                            className="w-full h-[72px] bg-slate-50 border border-slate-100 rounded-[1.5rem] pl-12 pr-8 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all font-semibold text-3xl text-slate-800 shadow-inner tracking-tight placeholder:text-slate-300"
                                            value={formData.amount ? Number(formData.amount).toLocaleString('en-US') : ''}
                                            onChange={e => {
                                                const rawValue = e.target.value.replace(/,/g, '');
                                                if (/^\d*$/.test(rawValue)) {
                                                    setFormData({ ...formData, amount: rawValue });
                                                }
                                            }}
                                            placeholder="0"
                                        />
                                    </div>
                                </div>

                                {editingId && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-8 pt-8 border-t border-slate-50">
                                        <div className="space-y-2">
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Trạng thái</label>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const nextStatus = formData.status === 'OPEN' ? 'PAID' : 'OPEN';
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        status: nextStatus,
                                                        closed_at:
                                                            nextStatus === 'PAID'
                                                                ? (() => {
                                                                    const today = new Date().toISOString().split('T')[0];
                                                                    const candidate = prev.closed_at || today;
                                                                    const txDate = new Date(prev.transaction_date);
                                                                    const payDate = new Date(candidate);
                                                                    if (!isNaN(txDate.getTime()) && !isNaN(payDate.getTime()) && payDate < txDate) {
                                                                        return prev.transaction_date;
                                                                    }
                                                                    return candidate;
                                                                })()
                                                                : ''
                                                    }));
                                                }}
                                                className={clsx(
                                                    'w-full h-[60px] rounded-[1.25rem] border shadow-inner',
                                                    'flex items-center justify-center gap-2 font-bold uppercase tracking-[0.2em] text-xs',
                                                    'transition-all active:scale-[0.99]',
                                                    formData.status === 'PAID'
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100/60'
                                                        : 'bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100/60'
                                                )}
                                            >
                                                {formData.status === 'PAID' ? (
                                                    <>
                                                        <Check size={16} className="text-emerald-600" />
                                                        Đã thanh toán
                                                    </>
                                                ) : (
                                                    <>
                                                        <Clock size={16} className="text-amber-600" />
                                                        Chưa thu
                                                    </>
                                                )}
                                            </button>
                                        </div>

                                        {formData.status === 'PAID' && (
                                            <div className="space-y-2">
                                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Ngày thanh toán</label>
                                                <div className="relative group">
                                                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                                                        <Calendar size={18} />
                                                    </div>
                                                    <DateInput
                                                        required
                                                        className="w-full h-[60px] bg-slate-50 border border-slate-100 rounded-[1.25rem] pl-12 pr-6 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white transition-all font-medium text-slate-700 shadow-inner"
                                                        value={formData.closed_at}
                                                        onChange={e => setFormData({ ...formData, closed_at: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {!editingId && (
                                <div className="px-6 pb-2 sm:px-8">
                                    <label className="flex items-center gap-2 cursor-pointer select-none w-fit">
                                        <div className="relative flex items-center">
                                            <input
                                                type="checkbox"
                                                className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-slate-300 shadow-sm transition-all checked:border-blue-500 checked:bg-blue-500 hover:border-blue-400"
                                                checked={createAnother}
                                                onChange={(e) => setCreateAnother(e.target.checked)}
                                            />
                                            <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 transition-opacity peer-checked:opacity-100">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-3.5 w-3.5"
                                                    viewBox="0 0 20 20"
                                                    fill="currentColor"
                                                    stroke="currentColor"
                                                    strokeWidth="1"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                        clipRule="evenodd"
                                                    ></path>
                                                </svg>
                                            </div>
                                        </div>
                                        <span className="text-sm font-medium text-slate-700">Tạo tiếp giao dịch khác</span>
                                    </label>
                                </div>
                            )}

                            <div className="p-6 sm:p-8 bg-slate-50/50 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-center justify-between gap-4 sm:gap-0">
                                {/* Left Side: Delete (or empty if not eligible) */}
                                <div className="w-full sm:w-auto mt-2 sm:mt-0">
                                    {editingId && isAdmin && (
                                        <button
                                            type="button"
                                            onClick={() => setIsDeleteModalOpen(true)}
                                            className="btn-danger btn-md w-full sm:w-auto flex items-center justify-center gap-2"
                                        >
                                            <Trash2 size={16} />
                                            Xóa giao dịch
                                        </button>
                                    )}
                                </div>

                                {/* Right Side: Actions */}
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 w-full sm:w-auto">
                                    <button
                                        type="button"
                                        onClick={handleClose}
                                        className="btn-secondary btn-lg w-full sm:w-auto"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={createMutation.isPending || updateMutation.isPending}
                                        className="btn-primary btn-lg w-full sm:w-auto disabled:cursor-wait"
                                    >
                                        {createMutation.isPending || updateMutation.isPending
                                            ? 'Đang xử lý...'
                                            : (editingId ? 'Lưu thay đổi' : 'Tạo giao dịch mới')}
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div >
            )
            }

            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="Xóa Giao Dịch"
                warningMessage="Hành động này không thể hoàn tác. Bạn có chắc chắn muốn xóa giao dịch này?"
                isDeleting={deleteMutation.isPending}
            />


            <div className="card">
                {isLoadingTransactions ? (
                    <SkeletonTable rows={8} columns={10} />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="table">
                            <thead className="table-head">
                                <tr>
                                    <th className="table-th">
                                        <div className="flex items-center gap-2">
                                            Ngày GD
                                        </div>
                                    </th>
                                    <th className="table-th">
                                        <div className="flex items-center gap-2">
                                            Khách hàng
                                        </div>
                                    </th>
                                    <th className="table-th">
                                        <div className="flex items-center gap-2">
                                            Loại
                                        </div>
                                    </th>
                                    <th className="table-th">Nội dung</th>
                                    <th className="table-th text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            Tiền gốc
                                        </div>
                                    </th>
                                    <th className="table-th text-center">Lãi suất</th>
                                    <th className="table-th text-center">Thời gian</th>
                                    <th className="table-th text-right">Tiền lãi</th>
                                    <th className="table-th text-right">Tổng cộng</th>
                                    <th className="table-th text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            Trạng thái
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredTransactions?.map((tx) => {
                                    const customerName = customers?.find(c => c.id === (tx.customer_id || tx.customer?.id || tx.customer))?.name || 'Không xác định';
                                    const typeConfig = configs?.find(c => c.code === tx.type);
                                    const typeName = typeConfig ? typeConfig.name : tx.type;
                                    const calc = tx.interest_calculation;
                                    const total = tx.amount + (calc?.rounded_interest || 0);


                                    return (
                                        <tr
                                            key={tx._id}
                                            className={clsx(
                                                "table-row",
                                                tx.status === 'PAID' && "!bg-emerald-50 hover:!bg-emerald-100/60"
                                            )}
                                            onClick={() => handleEdit(tx)}
                                        >
                                            <td className="table-td whitespace-nowrap">
                                                {formatDate(tx.transaction_date)}
                                            </td>
                                            <td className="table-td whitespace-nowrap font-medium text-slate-800">
                                                {customerName}
                                            </td>
                                            <td className="table-td whitespace-nowrap">
                                                <span className={clsx(
                                                    "px-2.5 py-1 rounded-lg text-xs font-bold",
                                                    tx.type?.includes('TIEN_MAT')
                                                        ? 'bg-emerald-50 text-emerald-700'
                                                        : tx.type?.includes('MUA_HANG')
                                                            ? 'bg-blue-50 text-blue-700'
                                                            : 'bg-slate-100 text-slate-900'
                                                )}>
                                                    {typeName}
                                                </span>
                                            </td>
                                            <td className="table-td text-slate-600 max-w-xs whitespace-pre-wrap leading-relaxed font-normal">
                                                {tx.content}
                                            </td>
                                            <td className="table-td whitespace-nowrap text-right font-mono font-medium text-slate-700">
                                                {tx.amount.toLocaleString('vi-VN')}
                                            </td>
                                            <td className="table-td whitespace-nowrap text-center text-slate-500 font-medium">
                                                {tx.interest_rate_snapshot}%
                                            </td>
                                            <td className="table-td whitespace-nowrap text-center font-medium">
                                                {calc ? (
                                                    <span className="badge-neutral">
                                                        {calc?.months.toFixed(1) || 0} tháng
                                                    </span>
                                                ) : <span className="text-slate-300">-</span>}
                                            </td>
                                            <td className="table-td whitespace-nowrap text-right font-mono font-medium text-blue-600">
                                                {calc ? `+ ${calc?.rounded_interest.toLocaleString('vi-VN')}` : '-'}
                                            </td>
                                            <td className="table-td whitespace-nowrap text-right font-mono font-semibold text-slate-900">
                                                {calc ? total.toLocaleString('vi-VN') : tx.amount.toLocaleString('vi-VN')}
                                            </td>
                                            <td className="table-td whitespace-nowrap text-center">
                                                <button
                                                    onClick={(e) => handleStatusToggle(e, tx)}
                                                    className={clsx(
                                                        "badge",
                                                        tx.status === 'PAID'
                                                            ? "badge-success"
                                                            : "badge-warning"
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
                                        <td colSpan="10" className="table-td py-16 text-center">
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
                )}
            </div>
            {isImageDetailOpen && (
                <ImageDetailModal
                    isOpen={isImageDetailOpen}
                    imageUrl={txImageUrl}
                    onClose={() => setIsImageDetailOpen(false)}
                    onUpdate={() => {
                        setIsImageDetailOpen(false);
                        openImagePicker();
                    }}
                    onDelete={() => {
                        setIsImageDetailOpen(false);
                        setIsDeleteImageModalOpen(true);
                    }}
                    isDeleting={deleteImageMutation.isPending}
                    isLoadingImage={txImageLoading}
                    error={txImageError}
                    hasImage={editingId ? editingHasImage : Boolean(pendingUploadFile)}
                />
            )}

            {isImagePickerOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                    <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                                    <ImageIcon size={18} />
                                </div>
                                <div>
                                    <div className="text-lg font-bold text-slate-900 leading-tight">
                                        {txImageUrl ? 'Đổi ảnh giao dịch' : 'Thêm ảnh giao dịch'}
                                    </div>
                                    <div className="text-xs text-slate-500 font-medium mt-1">Chọn nguồn ảnh</div>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={closeImagePicker}
                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-2xl transition-all"
                                aria-label="Đóng"
                            >
                                <X size={22} />
                            </button>
                        </div>

                        <div className="p-6 space-y-3">
                            <button
                                type="button"
                                onClick={pickFromCamera}
                                disabled={!!editingId && uploadImageMutation.isPending}
                                className="w-full btn btn-primary btn-lg"
                            >
                                <Camera size={18} />
                                Chụp từ camera
                            </button>

                            <button
                                type="button"
                                onClick={pickFromFile}
                                disabled={!!editingId && uploadImageMutation.isPending}
                                className="w-full btn btn-secondary btn-lg"
                            >
                                <ImageIcon size={18} />
                                Tải ảnh lên
                            </button>

                            {txImageError && (
                                <div className="text-sm text-red-600 font-medium pt-1">{txImageError}</div>
                            )}

                            <div className="text-xs text-slate-400 pt-1">Giới hạn dung lượng: 5MB</div>
                        </div>
                    </div>
                </div>
            )}

            <DeleteConfirmationModal
                isOpen={isDeleteImageModalOpen}
                onClose={() => setIsDeleteImageModalOpen(false)}
                onConfirm={() => deleteImageMutation.mutate()}
                title="Xóa Ảnh Giao Dịch"
                warningMessage="Bạn có chắc chắn muốn xóa ảnh này không? Hành động này không thể hoàn tác."
            />
        </div >
    );
}

function ImageDetailModal({ isOpen, imageUrl, onClose, onDelete, onUpdate, isDeleting, isLoadingImage, error, hasImage }) {
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [startPan, setStartPan] = useState({ x: 0, y: 0 });

    const showLoading = isLoadingImage;
    const showError = !!error;
    const canShowImage = !!imageUrl && !showLoading && !showError;

    // Reset pan when zooming out to 1 or changing image
    useEffect(() => {
        if (zoom <= 1) {
            setPan({ x: 0, y: 0 });
        }
    }, [zoom]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isOpen) return;

            // Zoom with + / -
            if (e.key === '=' || e.key === '+') {
                e.preventDefault(); // Prevent browser zoom
                setZoom(z => Math.min(5, z + 0.5));
            }
            if (e.key === '-' || e.key === '_') {
                e.preventDefault();
                setZoom(z => Math.max(0.5, z - 0.5));
            }
            // Reset with 0
            if (e.key === '0') {
                e.preventDefault();
                setZoom(1);
                setPan({ x: 0, y: 0 });
                setRotation(0);
            }
            // Pan with arrows
            const STEP = 50;
            if (e.key === 'ArrowUp') setPan(p => ({ ...p, y: p.y + STEP }));
            if (e.key === 'ArrowDown') setPan(p => ({ ...p, y: p.y - STEP }));
            if (e.key === 'ArrowLeft') setPan(p => ({ ...p, x: p.x + STEP }));
            if (e.key === 'ArrowRight') setPan(p => ({ ...p, x: p.x - STEP }));

            // Close with Esc
            if (e.key === 'Escape') onClose();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Prevent scrolling when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    const handleWheel = (e) => {
        // Ctrl + Wheel to zoom, or just Wheel if user prefers standard map-like zoom
        // Standard behavior: Wheel up = Zoom in, Wheel down = Zoom out
        e.preventDefault();
        const delta = e.deltaY * -0.01;
        const newZoom = Math.min(Math.max(0.5, zoom + delta), 5); // Limit zoom 0.5x to 5x
        setZoom(newZoom);
    };

    // Pan Handlers
    const handleMouseDown = (e) => {
        if (zoom > 1) {
            setIsDragging(true);
            setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
        }
    };

    const handleMouseMove = (e) => {
        if (isDragging && zoom > 1) {
            e.preventDefault();
            setPan({
                x: e.clientX - startPan.x,
                y: e.clientY - startPan.y
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/95 z-[70] flex flex-col animate-in fade-in duration-200"
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            {/* Toolbar */}
            <div className="flex items-center justify-between p-4 text-white/90 absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/50 to-transparent pointer-events-none">
                <div className="flex items-center gap-4 pointer-events-auto">
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                    <span className="font-medium text-sm hidden sm:inline">Chi tiết ảnh</span>
                </div>

                {/* Center Controls */}
                <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 pointer-events-auto shadow-xl">
                    <button onClick={() => setZoom(z => Math.max(0.5, z - 0.5))} className="p-2 hover:bg-white/10 rounded-full transition-colors" title="Thu nhỏ (-)">
                        <ZoomOut size={18} />
                    </button>
                    <span className="text-xs font-mono w-10 text-center select-none">{Math.round(zoom * 100)}%</span>
                    <button onClick={() => setZoom(z => Math.min(5, z + 0.5))} className="p-2 hover:bg-white/10 rounded-full transition-colors" title="Phóng to (+)">
                        <ZoomIn size={18} />
                    </button>
                    <div className="w-px h-5 bg-white/20 mx-2" />
                    <button onClick={() => setRotation(r => r + 90)} className="p-2 hover:bg-white/10 rounded-full transition-colors" title="Xoay">
                        <RotateCw size={18} />
                    </button>
                </div>

                {/* Right Controls */}
                <div className="flex items-center gap-2 pointer-events-auto">
                    <button
                        type="button"
                        onClick={onUpdate}
                        className="px-3 py-2 rounded-full bg-white/10 hover:bg-white/15 transition-colors text-xs font-semibold"
                    >
                        {hasImage ? 'Đổi ảnh' : 'Thêm ảnh'}
                    </button>
                    <button
                        type="button"
                        onClick={onDelete}
                        disabled={!hasImage || isDeleting}
                        className={clsx(
                            "px-3 py-2 rounded-full transition-colors text-xs font-semibold",
                            !hasImage || isDeleting ? "bg-white/5 text-white/40" : "bg-red-500/20 hover:bg-red-500/30 text-red-200"
                        )}
                    >
                        {isDeleting ? 'Đang xóa...' : 'Xóa ảnh'}
                    </button>
                    {canShowImage && (
                        <a
                            href={imageUrl}
                            download="transaction-image"
                            className="p-2 hover:bg-white/10 rounded-full transition-colors"
                            title="Tải xuống"
                        >
                            <Download size={20} />
                        </a>
                    )}
                </div>
            </div>

            {/* Content */}
            <div
                className="flex-1 flex items-center justify-center pt-16"
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
            >
                {showLoading && (
                    <div className="flex items-center gap-2 text-white/70 text-sm font-medium">
                        <Loader2 size={18} className="animate-spin" />
                        Đang tải ảnh...
                    </div>
                )}

                {showError && (
                    <div className="text-white/70 text-sm font-medium">{error}</div>
                )}

                {!showLoading && !showError && !canShowImage && !hasImage && (
                    <div className="text-white/70 text-sm font-medium">Giao dịch chưa có ảnh</div>
                )}

                {canShowImage && (
                    <img
                        src={imageUrl}
                        alt="Transaction"
                        draggable={false}
                        style={{
                            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                            transition: isDragging ? 'none' : 'transform 0.15s ease',
                            cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
                        }}
                        className="max-w-full max-h-[calc(100vh-80px)] select-none"
                    />
                )}
            </div>
        </div>
    );
}
