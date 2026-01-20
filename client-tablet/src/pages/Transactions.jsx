import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTransactions, createTransaction, updateTransaction, getCustomers, getInterestConfigs, createCustomer, uploadTransactionImage, fetchTransactionImageBlob, deleteTransactionImage } from '../services/api';
import { pickImage } from '../utils/imagePicker';
import { Plus, Edit2, Search, Calendar, Tag, Filter, X, ChevronRight, Check, Clock, User, UserPlus, ArrowUpDown, ArrowUp, ArrowDown, Trash2, Camera, Image as ImageIcon, Loader2, ZoomIn, ZoomOut, RotateCw, Download, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import DateInput from '../components/DateInput';
import DatePicker from '../components/DatePicker';
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
    
    // Validation errors
    const [validationErrors, setValidationErrors] = useState({
        customer_id: '',
        type: '',
        amount: '',
        content: '',
        transaction_date: '',
        closed_at: ''
    });

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
    const txContentRef = useRef(null);

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

    const editingTx = editingId ? (rawTransactions || []).find(t => t._id === editingId) : null;

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
        onError: (err) => {
            const msg = err?.response?.data?.error || 'Không thể upload ảnh';
            setTxImageError(msg);
            showToast('Lỗi', msg, 'error');
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

    const pickFromCamera = async () => {
        try {
            const file = await pickImage('camera');
            if (file) {
                handleSelectedImageFile(file);
            }
        } catch (error) {
            showToast('Lỗi', error.message || 'Không thể mở camera', 'error');
        }
    };
    
    const pickFromFile = async () => {
        try {
            const file = await pickImage('gallery');
            if (file) {
                handleSelectedImageFile(file);
            }
        } catch (error) {
            showToast('Lỗi', error.message || 'Không thể chọn ảnh', 'error');
        }
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
        onError: (err) => showToast('Lỗi', err?.response?.data?.error || 'Không thể xóa ảnh', 'error')
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
                        const msg = err?.response?.data?.error || 'không thể upload ảnh';
                        showToast('Cảnh báo', 'Tạo giao dịch thành công nhưng ' + msg, 'warning');
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
        setValidationErrors({
            customer_id: '',
            type: '',
            amount: '',
            content: '',
            transaction_date: '',
            closed_at: ''
        });
    };

    const handleQuickCreateSubmit = (e) => {
        e.preventDefault();
        createCustomerMutation.mutate({
            name: newCustomerName,
            contact_info: newCustomerContact
        });
    };

    const validateTransactionForm = () => {
        const errors = {
            customer_id: '',
            type: '',
            amount: '',
            content: '',
            transaction_date: '',
            closed_at: ''
        };
        let isValid = true;

        // Validate customer_id
        if (!formData.customer_id || formData.customer_id.trim() === '') {
            errors.customer_id = 'Vui lòng chọn khách hàng';
            isValid = false;
        }

        // Validate type
        if (!formData.type || formData.type.trim() === '') {
            errors.type = 'Vui lòng chọn loại giao dịch';
            isValid = false;
        }

        // Validate amount
        if (!formData.amount || formData.amount.toString().trim() === '') {
            errors.amount = 'Vui lòng nhập số tiền';
            isValid = false;
        } else {
            const amountNum = parseFloat(formData.amount);
            if (isNaN(amountNum) || amountNum <= 0) {
                errors.amount = 'Số tiền phải lớn hơn 0';
                isValid = false;
            }
        }

        // Validate content
        const content = formData.content?.trim() || '';
        if (!content) {
            errors.content = 'Vui lòng nhập nội dung giao dịch';
            isValid = false;
        } else if (content.length < 3) {
            errors.content = 'Nội dung phải có ít nhất 3 ký tự';
            isValid = false;
        }

        // Validate transaction_date
        if (!formData.transaction_date) {
            errors.transaction_date = 'Vui lòng chọn ngày giao dịch';
            isValid = false;
        }

        // Validate closed_at if status is PAID
        if (formData.status === 'PAID') {
            if (!formData.closed_at) {
                errors.closed_at = 'Vui lòng chọn ngày thanh toán';
                isValid = false;
            } else {
                const txDate = new Date(formData.transaction_date);
                const paidDate = new Date(formData.closed_at);
                if (!isNaN(txDate.getTime()) && !isNaN(paidDate.getTime()) && paidDate < txDate) {
                    errors.closed_at = 'Ngày thanh toán không được nhỏ hơn ngày giao dịch';
                    isValid = false;
                }
            }
        }

        setValidationErrors(errors);
        return isValid;
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!validateTransactionForm()) {
            // Focus on first error field
            if (validationErrors.customer_id) {
                // Focus customer input
            } else if (validationErrors.type) {
                // Type selector
            } else if (validationErrors.amount) {
                // Amount input
            } else if (validationErrors.content) {
                txContentRef.current?.focus();
            }
            return;
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
            {/* Header + Filter: portrait: hàng 1 (Title | Date), hàng 2 (Khách hàng); landscape: 1 hàng (Title | Date | Khách hàng | Tạo mới) */}
            <div className="flex flex-col tablet-lg:flex-row tablet-lg:items-center gap-4 tablet-lg:gap-3">
                {/* Portrait: Title + Date cùng hàng. Landscape: Title và Date là 2 phần tử trong hàng chung */}
                <div className="flex flex-row items-center gap-3 tablet-lg:contents">
                    {/* Title & Subtitle */}
                    <div className="min-w-0 flex-1">
                        <h2 className="section-title text-2xl">Danh Sách Giao Dịch</h2>
                        <p className="section-subtitle mt-1">Quản lý các giao dịch vay và nợ</p>
                    </div>

                    {/* Date Filter - portrait: cùng hàng Title; landscape: fit nội dung */}
                    <div className="flex flex-1 min-w-0 tablet-lg:flex-none tablet-lg:min-w-[260px] tablet-lg:w-[280px] items-center gap-1.5 tablet-lg:gap-1.5 border-b-2 border-slate-200 pb-2 tablet-lg:pb-1.5 focus-within:border-blue-500 transition-colors tablet-lg:[&_>div>div>button]:py-2 tablet-lg:[&_>div>div>button]:text-sm">
                    <div className="flex-1 min-w-0">
                        <DatePicker
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                            placeholder="Từ ngày"
                        />
                    </div>
                    <span className="text-slate-300 text-base tablet-lg:text-sm font-medium shrink-0">-</span>
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
                            className="ml-1 p-1.5 tablet-lg:p-1 min-w-[32px] min-h-[32px] tablet-lg:min-w-[28px] tablet-lg:min-h-[28px] flex items-center justify-center text-red-500 hover:bg-red-50 rounded-md transition-colors shrink-0"
                            aria-label="Xóa bộ lọc ngày"
                        >
                            <X size={16} className="tablet-lg:w-3.5 tablet-lg:h-3.5" />
                        </button>
                    )}
                    </div>
                </div>

                {/* Customer Search - ngắn trên landscape */}
                <div className="relative group flex-1 tablet-lg:flex-none tablet-lg:max-w-[220px] tablet-lg:min-w-[180px]" ref={filterComboboxRef}>
                            <div className="absolute inset-y-0 left-0 pl-4 tablet-lg:pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                <Search size={20} className="w-5 h-5 tablet-lg:w-4 tablet-lg:h-4" />
                        </div>
                        <input
                            type="text"
                                className="input input-icon pr-12 w-full text-base tablet-lg:min-h-[44px] tablet-lg:py-2.5 tablet-lg:text-sm tablet-lg:pl-9"
                            value={customerSearchTerm}
                            onChange={e => {
                                setCustomerSearchTerm(e.target.value);
                                setIsFilterComboboxOpen(true);
                                setHighlightedFilterIndex(-1);
                                if (selectedCustomerId) {
                                        setSelectedCustomerId('');
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
                                    className="absolute inset-y-0 right-0 pr-4 tablet-lg:pr-3 flex items-center text-slate-400 hover:text-red-500 transition-colors min-w-[44px] min-h-[44px] tablet-lg:min-w-[36px] tablet-lg:min-h-[36px]"
                                    aria-label="Xóa tìm kiếm"
                            >
                                    <X size={18} className="tablet-lg:w-4 tablet-lg:h-4" />
                            </button>
                        ) : (
                                <div className="absolute inset-y-0 right-0 pr-4 tablet-lg:pr-3 flex items-center pointer-events-none text-slate-400">
                                    <ArrowUpDown size={18} className="opacity-50 tablet-lg:w-4 tablet-lg:h-4" />
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
                                                "px-5 py-3.5 cursor-pointer flex items-center gap-3 transition-colors min-h-[44px]",
                                            highlightedFilterIndex === index ? "bg-blue-50" : "hover:bg-slate-50",
                                            selectedCustomerId === customer.id && "bg-blue-50/50"
                                        )}
                                    >
                                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                                                <User size={20} />
                                        </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-base font-medium text-slate-700 truncate">{customer.name}</p>
                                                {customer.contact_info && (
                                                    <p className="text-sm text-slate-400 truncate">{customer.contact_info}</p>
                                                )}
                                            </div>
                                            {selectedCustomerId === customer.id && <Check size={20} className="shrink-0 text-blue-600" />}
                                        </div>
                                    ))}
                                    {filteredCustomersForFilter?.length === 0 && (
                                        <div className="px-4 py-3 text-slate-400 text-base text-center">
                                            Không tìm thấy khách hàng
                                        </div>
                                    )}
                                </div>
                            )}
                </div>

                {/* Tạo mới - ngoài cùng bên phải, chỉ landscape */}
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
                    className="hidden tablet-lg:inline-flex btn-primary shrink-0 items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl text-sm"
                    aria-label="Tạo giao dịch mới"
                >
                    <Plus size={18} className="w-5 h-5" />
                    <span className="font-semibold">Tạo mới</span>
                </button>
            </div>

            {/* FAB - Chỉ portrait; landscape dùng nút Tạo mới trên hàng filter */}
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
                className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-16 h-16 bg-teal-600 hover:bg-teal-700 text-white rounded-full shadow-xl shadow-teal-500/40 flex items-center justify-center transition-colors duration-200 active:scale-95 tablet-lg:hidden"
                aria-label="Tạo giao dịch mới"
            >
                <Plus size={26} />
            </button>

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
                        className="bg-white w-full max-w-[70vw] tablet-lg:max-w-[480px] rounded-2xl tablet-lg:rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-300"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="tx-modal-title"
                    >
                        <div className="p-6 tablet-lg:p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                            <div className="flex items-center gap-3 tablet-lg:gap-2">
                                <div className="w-10 h-10 tablet-lg:w-9 tablet-lg:h-9 rounded-xl tablet-lg:rounded-lg bg-teal-600 flex items-center justify-center text-white shadow-lg shadow-teal-200 shrink-0">
                                    {editingId ? <Edit2 size={18} className="tablet-lg:w-4 tablet-lg:h-4" /> : <Plus size={20} className="tablet-lg:w-4 tablet-lg:h-4" />}
                                </div>
                                <div className="min-w-0">
                                    <h2 id="tx-modal-title" className="text-lg tablet-lg:text-base font-bold text-slate-900 tracking-tight">
                                        {editingId ? 'Chỉnh sửa giao dịch' : 'Tạo giao dịch mới'}
                                    </h2>
                                    <p className="text-xs tablet-lg:text-[10px] text-slate-500 mt-0.5 font-medium">
                                        {editingId ? 'Cập nhật lại thông tin bản ghi hiện có' : 'Thêm một bản ghi tài chính mới vào hệ thống'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5">
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
                                                    setIsImagePickerOpen(true);
                                                }
                                            }}
                                            title={hasImageIndicator ? "Xem ảnh giao dịch" : "Thêm ảnh giao dịch"}
                                            className={clsx(
                                                "p-2 tablet-lg:p-1.5 rounded-xl tablet-lg:rounded-lg transition-all border",
                                                txImageLoading && "opacity-60 cursor-not-allowed",
                                                hasImageIndicator
                                                    ? "bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100"
                                                    : "bg-white text-slate-400 border-slate-200 hover:text-blue-500 hover:border-blue-200"
                                            )}
                                            disabled={txImageLoading}
                                        >
                                            <ImageIcon size={18} className="tablet-lg:w-4 tablet-lg:h-4" />
                                        </button>
                                    );
                                })()}
                                <button
                                    onClick={handleClose}
                                    className="p-2 tablet-lg:p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl tablet-lg:rounded-lg transition-all"
                                >
                                    <X size={20} className="tablet-lg:w-4 tablet-lg:h-4" />
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                            <div className="flex-1 overflow-y-auto p-6 tablet-lg:p-5 custom-scrollbar min-h-0">
                                <div className="space-y-5 tablet-lg:space-y-4">
                                    {/* Row 1: Date & Customer - 2 cols cả portrait và landscape */}
                                    <div className="grid grid-cols-2 gap-4 tablet-lg:gap-3">
                                        {/* Date Input */}
                                        <div className="space-y-1.5">
                                            <label className="block text-[11px] tablet-lg:text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] ml-1">Ngày giao dịch</label>
                                            <div className="relative group">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                                    <Calendar size={16} className="tablet-lg:w-4 tablet-lg:h-4" />
                                                </div>
                                                <div ref={dateInputRef}>
                                                    <DateInput
                                                        required
                                                        className="w-full h-[52px] tablet-lg:h-[48px] bg-slate-50 border border-slate-100 rounded-xl pl-10 tablet-lg:pl-9 pr-4 outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all text-sm font-medium text-slate-800 shadow-inner"
                                                        value={formData.transaction_date}
                                                        onChange={e => setFormData({ ...formData, transaction_date: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Customer Input */}
                                        <div className="space-y-1.5">
                                            <label className="block text-[11px] tablet-lg:text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] ml-1">Khách hàng</label>
                                            <div className="relative" ref={comboboxRef}>
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                                    <User size={16} className="tablet-lg:w-4 tablet-lg:h-4" />
                                                </div>
                                                <input
                                                    type="text"
                                                    className={clsx(
                                                        "w-full h-[52px] tablet-lg:h-[48px] bg-slate-50 border rounded-xl pl-10 tablet-lg:pl-9 pr-4 outline-none focus:ring-2 focus:bg-white transition-all text-sm font-medium text-slate-800 shadow-inner placeholder:text-slate-300",
                                                        validationErrors.customer_id
                                                            ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                                                            : "border-slate-100 focus:ring-blue-500/10 focus:border-blue-500"
                                                    )}
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
                                                {validationErrors.customer_id && (
                                                    <p className="text-xs text-red-600 flex items-center gap-1.5 mt-1">
                                                        <AlertCircle size={12} className="shrink-0" />
                                                        {validationErrors.customer_id}
                                                    </p>
                                                )}
                                                {isComboboxOpen && (
                                                    <div className="absolute z-[60] mt-1.5 w-full bg-white border border-slate-100 rounded-xl shadow-2xl py-1.5 max-h-52 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
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
                                                                    "px-4 py-2.5 tablet-lg:py-2 cursor-pointer flex items-center gap-2 transition-colors",
                                                                    highlightedIndex === index ? "bg-blue-50" : "hover:bg-slate-50"
                                                                )}
                                                            >
                                                                <div className="w-7 h-7 tablet-lg:w-6 tablet-lg:h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                                                                    <User size={14} className="tablet-lg:w-3.5 tablet-lg:h-3.5" />
                                                                </div>
                                                                <span className="text-sm tablet-lg:text-xs font-medium text-slate-700">{customer.name}</span>
                                                            </div>
                                                        ))}
                                                        {customerSearch && !customers?.some(c => c.name.toLowerCase() === customerSearch.toLowerCase()) && (
                                                            <div
                                                                onClick={() => {
                                                                    setNewCustomerName(customerSearch);
                                                                    setIsQuickCreateOpen(true);
                                                                    setIsComboboxOpen(false);
                                                                }}
                                                                className="px-4 py-3 tablet-lg:py-2.5 border-t border-slate-50 hover:bg-blue-50 cursor-pointer text-blue-600 font-bold flex items-center gap-2 transition-colors"
                                                            >
                                                                <UserPlus size={16} className="tablet-lg:w-4 tablet-lg:h-4" />
                                                                <span className="text-sm tablet-lg:text-xs">Tạo mới "{customerSearch}"</span>
                                                            </div>
                                                        )}
                                                        {customerSearch.length === 0 && filteredCustomers?.length === 0 && (
                                                            <div className="px-3 py-2.5 text-slate-400 text-xs text-center">
                                                                Nhập tên để tìm kiếm...
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Content (Full Width) */}
                                    <div className="space-y-1.5">
                                        <label className="block text-[11px] tablet-lg:text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] ml-1">Nội dung chi tiết</label>
                                        <textarea
                                            ref={txContentRef}
                                            required
                                            className={clsx(
                                                "w-full min-h-[100px] tablet-lg:min-h-[88px] bg-slate-50 border rounded-xl px-5 py-3 tablet-lg:py-2.5 outline-none focus:ring-2 focus:bg-white transition-all text-sm font-medium text-slate-800 shadow-inner resize-none placeholder:text-slate-300 leading-relaxed",
                                                validationErrors.content
                                                    ? "border-red-300 focus:ring-red-500/20 focus:border-red-500"
                                                    : "border-slate-100 focus:ring-blue-500/10 focus:border-blue-500"
                                            )}
                                            value={formData.content}
                                            onChange={e => {
                                                setFormData({ ...formData, content: e.target.value });
                                            }}
                                            placeholder="Nhập nội dung vay/trả chi tiết..."
                                            aria-invalid={!!validationErrors.content}
                                            aria-describedby={validationErrors.content ? 'content-error' : undefined}
                                        />
                                        {validationErrors.content && (
                                            <p id="content-error" className="text-xs text-red-600 flex items-center gap-1.5 mt-1">
                                                <AlertCircle size={12} className="shrink-0" />
                                                {validationErrors.content}
                                            </p>
                                        )}
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
                                <div className="space-y-1.5 mt-6 tablet-lg:mt-4">
                                    <label className="block text-[11px] tablet-lg:text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] ml-1">Loại giao dịch</label>
                                    <div className="grid grid-cols-4 gap-2 tablet-lg:gap-1.5">
                                        {configs?.map((config) => (
                                            <button
                                                key={config.code}
                                                type="button"
                                                onClick={() => {
                                                    setFormData({ ...formData, type: config.code });
                                                }}
                                                className={clsx(
                                                    "px-2 py-2 tablet-lg:py-1.5 rounded-lg tablet-lg:rounded text-[11px] tablet-lg:text-[10px] font-bold border transition-all text-center flex items-center justify-center min-h-[42px] tablet-lg:min-h-[36px] leading-tight active:scale-95 whitespace-nowrap",
                                                    formData.type === config.code
                                                        ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200"
                                                        : "bg-slate-50 text-slate-500 border-slate-100 hover:border-slate-200 hover:bg-white"
                                                )}
                                            >
                                                {config.name}
                                            </button>
                                        ))}
                                    </div>
                                    {validationErrors.type && (
                                        <p className="text-xs text-red-600 flex items-center gap-1.5 mt-1">
                                            <AlertCircle size={12} className="shrink-0" />
                                            {validationErrors.type}
                                        </p>
                                    )}
                                </div>

                                {/* Section: Số tiền (Full Width Row) */}
                                <div className="space-y-1.5 mt-6 tablet-lg:mt-4">
                                    <label className="block text-[11px] tablet-lg:text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] ml-1">Số tiền giao dịch</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 font-bold text-sm group-focus-within:text-blue-500 transition-colors">
                                            đ
                                        </div>
                                        <input
                                            type="text"
                                            required
                                            className={clsx(
                                                "w-full h-[56px] tablet-lg:h-[48px] bg-slate-50 border rounded-xl pl-10 tablet-lg:pl-9 pr-5 outline-none focus:ring-2 focus:bg-white transition-all font-semibold text-2xl tablet-lg:text-xl text-slate-800 shadow-inner tracking-tight placeholder:text-slate-300",
                                                validationErrors.amount
                                                    ? "border-red-300 focus:ring-red-500/20 focus:border-red-500"
                                                    : "border-slate-100 focus:ring-blue-500/10 focus:border-blue-500"
                                            )}
                                            value={formData.amount ? Number(formData.amount).toLocaleString('en-US') : ''}
                                            onChange={e => {
                                                const rawValue = e.target.value.replace(/,/g, '');
                                                if (/^\d*$/.test(rawValue)) {
                                                    setFormData({ ...formData, amount: rawValue });
                                                }
                                            }}
                                            placeholder="0"
                                            aria-invalid={!!validationErrors.amount}
                                            aria-describedby={validationErrors.amount ? 'amount-error' : undefined}
                                        />
                                    </div>
                                    {validationErrors.amount && (
                                        <p id="amount-error" className="text-xs text-red-600 flex items-center gap-1.5 mt-1">
                                            <AlertCircle size={12} className="shrink-0" />
                                            {validationErrors.amount}
                                        </p>
                                    )}
                                    {editingTx && (
                                        <p className="text-xs tablet-lg:text-[10px] mt-1.5 font-medium">
                                            <span className="text-slate-400">Số tiền lãi: </span>
                                            <span className="text-blue-600 font-semibold">{editingTx.interest_rate_snapshot ?? '-'}% × {(editingTx.interest_calculation?.months ?? 0).toFixed(1)} tháng = {(editingTx.interest_calculation?.rounded_interest ?? 0).toLocaleString('vi-VN')} đ</span>
                                        </p>
                                    )}
                                </div>

                                {editingId && (
                                    <div className="grid grid-cols-2 gap-4 tablet-lg:gap-3 mt-6 tablet-lg:mt-4 pt-6 tablet-lg:pt-4 border-t border-slate-50">
                                        <div className="space-y-1.5">
                                            <label className="block text-[11px] tablet-lg:text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] ml-1">Trạng thái</label>
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
                                                    'w-full h-[52px] tablet-lg:h-[48px] rounded-xl border shadow-inner',
                                                    'flex items-center justify-center gap-1.5 font-bold uppercase tracking-[0.15em] text-[11px] tablet-lg:text-[10px]',
                                                    'transition-all active:scale-[0.99]',
                                                    formData.status === 'PAID'
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100/60'
                                                        : 'bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100/60'
                                                )}
                                            >
                                                {formData.status === 'PAID' ? (
                                                    <>
                                                        <Check size={14} className="text-emerald-600 tablet-lg:w-3.5 tablet-lg:h-3.5" />
                                                        Đã thanh toán
                                                    </>
                                                ) : (
                                                    <>
                                                        <Clock size={14} className="text-amber-600 tablet-lg:w-3.5 tablet-lg:h-3.5" />
                                                        Chưa thu
                                                    </>
                                                )}
                                            </button>
                                        </div>

                                        {formData.status === 'PAID' && (
                                            <div className="space-y-1.5">
                                                <label className="block text-[11px] tablet-lg:text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] ml-1">Ngày thanh toán</label>
                                                <div className="relative group">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                                                        <Calendar size={16} className="tablet-lg:w-4 tablet-lg:h-4" />
                                                    </div>
                                                    <DateInput
                                                        required
                                                        className="w-full h-[52px] tablet-lg:h-[48px] bg-slate-50 border border-slate-100 rounded-xl pl-10 tablet-lg:pl-9 pr-4 outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white transition-all text-sm font-medium text-slate-700 shadow-inner"
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
                                <div className="px-6 tablet-lg:px-5 pb-2">
                                    <label className="flex items-center gap-2 cursor-pointer select-none w-fit">
                                        <div className="relative flex items-center">
                                            <input
                                                type="checkbox"
                                                className="peer h-4 w-4 tablet-lg:h-3.5 tablet-lg:w-3.5 cursor-pointer appearance-none rounded border border-slate-300 shadow-sm transition-all checked:border-blue-500 checked:bg-blue-500 hover:border-blue-400"
                                                checked={createAnother}
                                                onChange={(e) => setCreateAnother(e.target.checked)}
                                            />
                                            <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 transition-opacity peer-checked:opacity-100">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 tablet-lg:h-2.5 tablet-lg:w-2.5" viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" strokeWidth="1">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        </div>
                                        <span className="text-xs tablet-lg:text-[10px] font-medium text-slate-700">Tạo tiếp giao dịch khác</span>
                                    </label>
                                </div>
                            )}

                            <div className="p-6 tablet-lg:p-5 bg-slate-50/50 border-t border-slate-100 flex flex-row items-center justify-between gap-2">
                                <div className="w-auto">
                                    {editingId && isAdmin && (
                                        <button
                                            type="button"
                                            onClick={() => setIsDeleteModalOpen(true)}
                                            className="btn-danger btn-sm w-auto flex items-center justify-center gap-1.5"
                                        >
                                            <Trash2 size={14} className="tablet-lg:w-3.5 tablet-lg:h-3.5" />
                                            Xóa giao dịch
                                        </button>
                                    )}
                                </div>
                                <div className="flex flex-row items-center justify-end gap-2 w-auto">
                                    <button type="button" onClick={handleClose} className="btn-secondary btn-sm w-auto">
                                        Hủy
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={createMutation.isPending || updateMutation.isPending}
                                        className="btn-primary btn-sm w-auto disabled:cursor-wait"
                                    >
                                        {createMutation.isPending || updateMutation.isPending ? 'Đang xử lý...' : (editingId ? 'Lưu thay đổi' : 'Tạo giao dịch mới')}
                                        <ChevronRight size={16} className="tablet-lg:w-3.5 tablet-lg:h-3.5" />
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


            <div className="card overflow-hidden border-0">
                {isLoadingTransactions ? (
                    <SkeletonTable rows={8} columns={10} />
                ) : (
                    <>
                        {/* Mobile Card View (<= md) */}
                        <div className="hidden divide-y divide-slate-100">
                            {filteredTransactions?.map((tx) => {
                                const customerName = customers?.find(c => c.id === (tx.customer_id || tx.customer?.id || tx.customer))?.name || 'Không xác định';
                                const typeConfig = configs?.find(c => c.code === tx.type);
                                const typeName = typeConfig ? typeConfig.name : tx.type;
                                const calc = tx.interest_calculation;
                                const total = tx.amount + (calc?.rounded_interest || 0);

                                return (
                                    <div
                                        key={tx._id}
                                        onClick={() => handleEdit(tx)}
                                        className={clsx(
                                            "p-4 active:bg-slate-50 transition-colors",
                                            tx.status === 'PAID' && "bg-emerald-50/60"
                                        )}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="text-xs font-semibold text-slate-500">
                                                    {formatDate(tx.transaction_date)}
                                                </div>
                                                <div className="mt-0.5 font-bold text-slate-900 truncate">
                                                    {customerName}
                                                </div>
                                                <div className="mt-2 flex items-center gap-2 flex-wrap">
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
                                                    <span className="badge-neutral">{tx.interest_rate_snapshot}%</span>
                                                    <span className="badge-neutral">
                                                        {calc ? `${calc?.months.toFixed(1) || 0} tháng` : '- tháng'}
                                                    </span>
                                                </div>
                                            </div>

                                            <button
                                                onClick={(e) => handleStatusToggle(e, tx)}
                                                className={clsx(
                                                    "badge shrink-0",
                                                    tx.status === 'PAID' ? "badge-success" : "badge-warning"
                                                )}
                                            >
                                                {tx.status === 'PAID' ? 'Đã thanh toán' : 'Chưa thu'}
                                            </button>
                                        </div>

                                        <div className="mt-3 grid grid-cols-2 gap-3 bg-slate-50/50 rounded-2xl p-3 border border-slate-100">
                                            <div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tiền gốc</div>
                                                <div className="mt-1 font-mono text-sm font-bold text-slate-700">
                                                    {tx.amount.toLocaleString('vi-VN')}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Tiền lãi</div>
                                                <div className="mt-1 font-mono text-sm font-bold text-blue-600">
                                                    {calc ? `+ ${calc?.rounded_interest.toLocaleString('vi-VN')}` : '-'}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tổng cộng</div>
                                                <div className="mt-1 font-mono text-base font-black text-slate-900">
                                                    {calc ? total.toLocaleString('vi-VN') : tx.amount.toLocaleString('vi-VN')}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nội dung</div>
                                                <div className="mt-1 text-sm font-medium text-slate-600 line-clamp-2 whitespace-pre-wrap">
                                                    {tx.content || '-'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {filteredTransactions?.length === 0 && (
                                <div className="py-16 text-center">
                                    <div className="flex flex-col items-center justify-center text-slate-400">
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-dashed border-slate-200">
                                            <Search size={32} className="opacity-40" />
                                        </div>
                                        <p className="font-medium text-slate-500">Chưa có giao dịch nào</p>
                                        <p className="text-sm mt-1">Thử thay đổi bộ lọc hoặc tạo giao dịch mới</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Desktop Table View - Responsive for tablet */}
                        <div className="overflow-x-auto overflow-visible">
                            <table className="table w-full min-w-[1000px] tablet-lg:min-w-[1000px] tablet:min-w-[800px]">
                                <thead className="table-head">
                                    <tr>
                                        <th className="table-th text-base tablet-lg:text-xs tablet:text-sm py-4 tablet-lg:py-2.5 tablet:py-3 min-h-[48px] hidden tablet-lg:table-cell">
                                            <div className="flex items-center gap-2">Ngày GD</div>
                                        </th>
                                        <th className="table-th text-base tablet-lg:text-xs tablet:text-sm py-4 tablet-lg:py-2.5 tablet:py-3 max-w-[200px] min-h-[48px]">
                                            <div className="flex items-center gap-2">Khách hàng</div>
                                        </th>
                                        <th className="table-th max-w-xs text-base tablet-lg:text-xs tablet:text-sm py-4 tablet-lg:py-2.5 tablet:py-3 min-h-[48px]">Nội dung</th>
                                        <th className="table-th text-right text-base tablet-lg:text-xs tablet:text-sm py-4 tablet-lg:py-2.5 tablet:py-3 min-h-[48px]">
                                            <div className="flex items-center justify-end gap-2">Tiền gốc</div>
                                        </th>
                                        <th className="table-th text-left tablet-lg:text-right text-base tablet-lg:text-xs tablet:text-sm py-4 tablet-lg:py-2.5 tablet:py-3 min-h-[48px] pr-12 tablet-lg:pr-8">Tổng cộng</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredTransactions?.map((tx) => {
                                        const customerName = customers?.find(c => c.id === (tx.customer_id || tx.customer?.id || tx.customer))?.name || 'Không xác định';
                                        const calc = tx.interest_calculation;
                                        const total = tx.amount + (calc?.rounded_interest || 0);

                                        return (
                                            <tr
                                                key={tx._id}
                                                className={clsx(
                                                    "table-row group relative cursor-pointer",
                                                    tx.status === 'PAID' && "!bg-emerald-50 hover:!bg-emerald-100/60"
                                                )}
                                                onClick={() => handleEdit(tx)}
                                                onDoubleClick={(e) => {
                                                    e.stopPropagation();
                                                    handleStatusToggle(e, tx);
                                                }}
                                                title="Click để chỉnh sửa, Double-click để đổi trạng thái"
                                            >
                                                <td className="table-td whitespace-nowrap text-base tablet-lg:text-sm tablet:text-sm py-4 tablet-lg:py-3 tablet:py-3 min-h-[48px] hidden tablet-lg:table-cell">
                                                    <span className="font-medium">{formatDate(tx.transaction_date)}</span>
                                                </td>
                                                <td className="table-td font-medium text-slate-800 text-base tablet-lg:text-sm py-4 tablet-lg:py-3 max-w-[200px]">
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="text-sm text-slate-500 tablet-lg:hidden">{formatDate(tx.transaction_date)}</span>
                                                        <span className="truncate" title={customerName}>{customerName}</span>
                                                    </div>
                                                </td>
                                                <td className="table-td text-slate-600 max-w-xs leading-relaxed font-normal text-base tablet-lg:text-sm py-4 tablet-lg:py-3">
                                                    {tx.content ? (
                                                        tx.content.includes('-') ? (
                                                            <div className="whitespace-pre-wrap line-clamp-5">
                                                                {tx.content
                                                                    .split(/\n/)
                                                                    .flatMap(line => {
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
                                                            <div className="line-clamp-3">{tx.content}</div>
                                                        )
                                                    ) : '-'}
                                                </td>
                                                <td className="table-td whitespace-nowrap text-right text-base tablet-lg:text-sm py-4 tablet-lg:py-3">
                                                    <div className="flex flex-col items-end gap-1">
                                                        <span className="font-mono font-medium text-slate-700">{tx.amount.toLocaleString('vi-VN')}</span>
                                                        {calc && calc.rounded_interest > 0 && (
                                                            <span className="font-mono text-blue-600">+ {calc.rounded_interest.toLocaleString('vi-VN')}</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="table-td whitespace-nowrap text-left tablet-lg:text-right font-mono font-bold text-slate-900 text-base tablet-lg:text-sm py-4 tablet-lg:py-3 pr-12 tablet-lg:pr-8">
                                                    {calc ? total.toLocaleString('vi-VN') : tx.amount.toLocaleString('vi-VN')}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                    {filteredTransactions?.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="table-td py-16 text-center">
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
                    </>
                )}
            </div>
            {isImagePickerOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[70] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
                        <div className="p-8 text-center border-b border-slate-50 bg-slate-50/50">
                            <h3 className="text-xl font-bold text-slate-800 tracking-tight">Thêm ảnh giao dịch</h3>
                            <p className="text-sm text-slate-500 mt-1 font-medium">Chọn phương thức để đính kèm hình ảnh</p>
                        </div>

                        <div className="p-8 grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsImagePickerOpen(false);
                                    pickFromCamera();
                                }}
                                className="group flex flex-col items-center justify-center p-6 bg-slate-50 rounded-3xl border-2 border-transparent hover:border-emerald-200 hover:bg-emerald-50 transition-all active:scale-95"
                            >
                                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-emerald-500 shadow-sm group-hover:shadow-emerald-100 transition-all duration-300 mb-4 border border-slate-100">
                                    <Camera size={32} />
                                </div>
                                <span className="text-sm font-bold text-slate-700 group-hover:text-emerald-700">Chụp ảnh</span>
                                <span className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-bold">Camera</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setIsImagePickerOpen(false);
                                    pickFromFile();
                                }}
                                className="group flex flex-col items-center justify-center p-6 bg-slate-50 rounded-3xl border-2 border-transparent hover:border-blue-200 hover:bg-blue-50 transition-all active:scale-95"
                            >
                                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-blue-500 shadow-sm group-hover:shadow-blue-100 transition-all duration-300 mb-4 border border-slate-100">
                                    <ImageIcon size={32} />
                                </div>
                                <span className="text-sm font-bold text-slate-700 group-hover:text-blue-700">Tải lên</span>
                                <span className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-bold">Thư viện</span>
                            </button>
                        </div>

                        <div className="px-8 pb-8">
                            <button
                                type="button"
                                onClick={() => setIsImagePickerOpen(false)}
                                className="w-full py-4 text-sm font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-2xl transition-all uppercase tracking-widest"
                            >
                                Đóng cửa sổ
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isImageDetailOpen && (
                <ImageDetailModal
                    isOpen={isImageDetailOpen}
                    imageUrl={txImageUrl}
                    onClose={() => setIsImageDetailOpen(false)}
                    onUpdate={() => {
                        setIsImageDetailOpen(false);
                        setIsImagePickerOpen(true);
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
                    <button onClick={onClose} className="p-2.5 hover:bg-white/10 rounded-full transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center" aria-label="Đóng">
                        <X size={24} />
                    </button>
                    <span className="font-medium text-base">Chi tiết ảnh</span>
                </div>

                {/* Center Controls */}
                <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md px-4 py-2.5 rounded-full border border-white/10 pointer-events-auto shadow-xl">
                    <button onClick={() => setZoom(z => Math.max(0.5, z - 0.5))} className="p-2.5 hover:bg-white/10 rounded-full transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center" title="Thu nhỏ (-)">
                        <ZoomOut size={20} />
                    </button>
                    <span className="text-sm font-mono w-12 text-center select-none">{Math.round(zoom * 100)}%</span>
                    <button onClick={() => setZoom(z => Math.min(5, z + 0.5))} className="p-2.5 hover:bg-white/10 rounded-full transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center" title="Phóng to (+)">
                        <ZoomIn size={20} />
                    </button>
                    <div className="w-px h-6 bg-white/20 mx-2" />
                    <button onClick={() => setRotation(r => r + 90)} className="p-2.5 hover:bg-white/10 rounded-full transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center" title="Xoay">
                        <RotateCw size={20} />
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
                            className="p-2.5 hover:bg-white/10 rounded-full transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
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
