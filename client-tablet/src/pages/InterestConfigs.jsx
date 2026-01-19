import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getInterestConfigs, createInterestConfig, updateInterestConfig, deleteInterestConfigSecure } from '../services/api';
import { Plus, Edit2, Trash2, Percent, Tag, Pencil, X, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import { getInterestConfigColorScheme } from '../utils/colorSchemes';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { EmptyStates } from '../components/EmptyState';
import { ErrorStates } from '../components/ErrorState';

export default function InterestConfigs() {
    const queryClient = useQueryClient();
    const { showToast } = useToast();
    const { user } = useAuth();
    const isAdmin = user?.role === 'ADMIN';
    const [isOpen, setIsOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        rate_per_month: 2.0,
        description: ''
    });
    
    const [validationErrors, setValidationErrors] = useState({
        code: '',
        name: '',
        rate_per_month: ''
    });

    const { data: configs, isLoading, error, refetch } = useQuery({
        queryKey: ['interest-configs'],
        queryFn: getInterestConfigs,
        retry: 1
    });

    const createMutation = useMutation({
        mutationFn: createInterestConfig,
        onSuccess: () => {
            queryClient.invalidateQueries(['interest-configs']);
            handleClose();
            showToast('Thành công', 'Đã thêm cấu hình lãi suất mới', 'success');
        },
        onError: (err) => {
            showToast('Lỗi', err.response?.data?.detail || "Không thể tạo cấu hình", 'error');
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ code, data }) => updateInterestConfig(code, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['interest-configs']);
            handleClose();
            showToast('Thành công', 'Đã cập nhật cấu hình', 'success');
        },
        onError: (err) => {
            showToast('Lỗi', err.response?.data?.detail || "Không thể cập nhật cấu hình", 'error');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: ({ code, pin }) => deleteInterestConfigSecure(code, pin),
        onSuccess: () => {
            queryClient.invalidateQueries(['interest-configs']);
            setIsDeleteModalOpen(false);
            handleClose();
            showToast('Thành công', 'Đã xóa cấu hình', 'success');
        },
        onError: (err) => {
            showToast('Lỗi', err.response?.data?.detail || "Lỗi xóa cấu hình", 'error');
        }
    });

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const handleDeleteConfirm = (pin) => {
        if (formData.code) {
            deleteMutation.mutate({ code: formData.code, pin });
        }
    };


    const handleClose = () => {
        setIsOpen(false);
        setIsEditing(false);
        setFormData({ code: '', name: '', rate_per_month: 2.0, description: '' });
        setValidationErrors({ code: '', name: '', rate_per_month: '' });
    };

    const handleEdit = (config) => {
        setIsEditing(true);
        setFormData({
            code: config.code,
            name: config.name,
            rate_per_month: config.rate_per_month,
            description: config.description || ''
        });
        setValidationErrors({ code: '', name: '', rate_per_month: '' });
        setIsOpen(true);
    };

    const validateInterestConfigForm = () => {
        const errors = {
            code: '',
            name: '',
            rate_per_month: ''
        };
        let isValid = true;

        // Validate code
        const code = formData.code.trim().toUpperCase();
        if (!code) {
            errors.code = 'Vui lòng nhập mã cấu hình';
            isValid = false;
        } else if (code.length < 2) {
            errors.code = 'Mã cấu hình phải có ít nhất 2 ký tự';
            isValid = false;
        } else if (code.length > 20) {
            errors.code = 'Mã cấu hình không được vượt quá 20 ký tự';
            isValid = false;
        } else if (!/^[A-Z0-9_]+$/.test(code)) {
            errors.code = 'Mã cấu hình chỉ được chứa chữ in hoa, số và dấu gạch dưới';
            isValid = false;
        }

        // Validate name
        const name = formData.name.trim();
        if (!name) {
            errors.name = 'Vui lòng nhập tên hiển thị';
            isValid = false;
        } else if (name.length < 2) {
            errors.name = 'Tên hiển thị phải có ít nhất 2 ký tự';
            isValid = false;
        } else if (name.length > 100) {
            errors.name = 'Tên hiển thị không được vượt quá 100 ký tự';
            isValid = false;
        }

        // Validate rate_per_month
        const rate = parseFloat(formData.rate_per_month);
        if (isNaN(rate)) {
            errors.rate_per_month = 'Vui lòng nhập lãi suất hợp lệ';
            isValid = false;
        } else if (rate < 0) {
            errors.rate_per_month = 'Lãi suất không được nhỏ hơn 0%';
            isValid = false;
        } else if (rate > 100) {
            errors.rate_per_month = 'Lãi suất không được lớn hơn 100%';
            isValid = false;
        }

        setValidationErrors(errors);
        return isValid;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (!validateInterestConfigForm()) {
            return;
        }
        
        // Ensure code is uppercase
        const submitData = {
            ...formData,
            code: formData.code.trim().toUpperCase()
        };
        
        if (isEditing) {
            updateMutation.mutate({ code: submitData.code, data: submitData });
        } else {
            createMutation.mutate(submitData);
        }
    };

    if (error) return (
        <div className="p-8">
            <ErrorStates.Network
                error={error}
                onRetry={refetch}
                showDetails={true}
            />
        </div>
    );

    if (isLoading) return (
        <div className="space-y-6">
            <div className="h-20 skeleton"></div>
            <div className="grid grid-cols-5 gap-6">
                <LoadingSkeleton.Card count={5} />
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="space-y-0">
                <div className="flex items-center justify-between gap-4 tablet-lg:gap-4">
                    <div>
                        <h2 className="section-title text-2xl">Cấu hình lãi suất</h2>
                        <p className="section-subtitle text-sm tablet-lg:text-xs mt-1">Tùy chỉnh mức lãi mặc định cho giao dịch</p>
                    </div>

                    {/* Nút Thêm: chỉ landscape; portrait dùng FAB */}
                    <button
                        onClick={() => { setIsEditing(false); setIsOpen(true); }}
                        className="hidden tablet-lg:inline-flex btn-primary shrink-0 items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl text-sm"
                        aria-label="Thêm cấu hình lãi suất"
                    >
                        <Plus size={18} className="w-5 h-5" />
                        <span className="font-semibold">Thêm cấu hình</span>
                    </button>
                </div>
            </div>

            {/* FAB - Chỉ portrait; landscape dùng nút trong header */}
            <button
                onClick={() => { setIsEditing(false); setIsOpen(true); }}
                className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-16 h-16 bg-teal-600 hover:bg-teal-700 text-white rounded-full shadow-xl shadow-teal-500/40 flex items-center justify-center transition-colors duration-200 active:scale-95 tablet-lg:hidden"
                aria-label="Thêm cấu hình lãi suất"
            >
                <Plus size={26} />
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all overflow-hidden">
                    <div className="bg-white rounded-[2.5rem] w-full h-auto max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col transition-all">
                        <div className="px-8 py-6 border-b border-slate-100 bg-white flex justify-between items-center relative z-10">
                            <div className="flex items-center gap-3">
                                <div className={clsx(
                                    "p-2.5 rounded-2xl flex items-center justify-center",
                                    isEditing ? "bg-blue-50 text-blue-600" : "bg-emerald-50 text-emerald-600"
                                )}>
                                    {isEditing ? <Edit2 size={22} /> : <Plus size={22} />}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 leading-tight">
                                        {isEditing ? 'Cập Nhật Cấu Hình' : 'Thêm Quy Tắc Mới'}
                                    </h3>
                                    <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mt-0.5">
                                        {isEditing ? 'Chỉnh sửa chính sách lãi suất' : 'Khởi tạo quy chuẩn mới'}
                                    </p>
                                </div>
                            </div>
                            <button onClick={handleClose} className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-2xl transition-all active:scale-90">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto flex-1">
                            <div className="grid grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Mã (Duy nhất)</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                            <Tag size={18} />
                                        </div>
                                        <input
                                            type="text"
                                            required
                                            disabled={isEditing}
                                            placeholder="TIEN_MAT"
                                            className={clsx(
                                                'input input-icon uppercase',
                                                isEditing && 'cursor-not-allowed',
                                                validationErrors.code && 'input-error'
                                            )}
                                            value={formData.code}
                                            onChange={e => {
                                                setFormData({ ...formData, code: e.target.value.toUpperCase() });
                                                setValidationErrors(prev => ({ ...prev, code: '' }));
                                            }}
                                            aria-invalid={!!validationErrors.code}
                                            aria-describedby={validationErrors.code ? 'code-error' : undefined}
                                        />
                                    </div>
                                    {validationErrors.code && (
                                        <p id="code-error" className="field-error">
                                            <AlertCircle size={12} className="shrink-0" />
                                            {validationErrors.code}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Lãi tháng (%)</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                            <Percent size={18} />
                                        </div>
                                        <input
                                            type="number"
                                            required
                                            step="0.1"
                                            min="0"
                                            max="100"
                                            className={clsx(
                                                'input input-icon',
                                                validationErrors.rate_per_month && 'input-error'
                                            )}
                                            value={formData.rate_per_month}
                                            onChange={e => {
                                                setFormData({ ...formData, rate_per_month: parseFloat(e.target.value) || 0 });
                                                setValidationErrors(prev => ({ ...prev, rate_per_month: '' }));
                                            }}
                                            aria-invalid={!!validationErrors.rate_per_month}
                                            aria-describedby={validationErrors.rate_per_month ? 'rate-error' : undefined}
                                        />
                                    </div>
                                    {validationErrors.rate_per_month && (
                                        <p id="rate-error" className="field-error">
                                            <AlertCircle size={12} className="shrink-0" />
                                            {validationErrors.rate_per_month}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Tên hiển thị</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                        <Pencil size={18} />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Tiền Mặt, Thanh Lý..."
                                        className={clsx(
                                            'input input-icon',
                                            validationErrors.name && 'input-error'
                                        )}
                                        value={formData.name}
                                        onChange={e => {
                                            setFormData({ ...formData, name: e.target.value });
                                            setValidationErrors(prev => ({ ...prev, name: '' }));
                                        }}
                                        aria-invalid={!!validationErrors.name}
                                        aria-describedby={validationErrors.name ? 'name-error' : undefined}
                                    />
                                </div>
                                {validationErrors.name && (
                                    <p id="name-error" className="field-error">
                                        <AlertCircle size={12} className="shrink-0" />
                                        {validationErrors.name}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Mô tả quy tắc</label>
                                <textarea
                                    className="textarea min-h-[100px]"
                                    placeholder="Ghi chú về mức lãi này..."
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                            <div className="flex flex-col gap-4 pt-6">
                                <button
                                    type="submit"
                                    disabled={createMutation.isPending || updateMutation.isPending}
                                    className="w-full btn btn-primary btn-lg"
                                >
                                    {createMutation.isPending || updateMutation.isPending ? 'Đang xử lý...' : (isEditing ? 'Lưu thay đổi' : 'Tạo mới quy tắc')}
                                    <Plus size={18} />
                                </button>

                                {isEditing && isAdmin && (
                                    <button
                                        type="button"
                                        onClick={() => setIsDeleteModalOpen(true)}
                                        className="w-full btn btn-secondary btn-lg text-red-600 hover:text-red-700 hover:border-red-200"
                                    >
                                        <Trash2 size={16} />
                                        Xóa quy tắc này
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="Xóa Cấu Hình Lãi Suất"
                warningMessage="CẢNH BÁO: Xóa cấu hình này có thể gây lỗi hiển thị cho các giao dịch lịch sử đang sử dụng nó. Bạn có chắc chắn muốn tiếp tục?"
                isDeleting={deleteMutation.isPending}
            />

            <div className="grid grid-cols-2 tablet:grid-cols-3 tablet-lg:grid-cols-4 gap-3 tablet-lg:gap-3">
                {configs?.map(config => {
                    const colors = getInterestConfigColorScheme(config.code);
                    const isLiquidation = config.code?.toLowerCase().includes('tl') || config.name?.toLowerCase().includes('thanh lý');

                    return (
                        <div
                            key={config._id}
                            onClick={() => handleEdit(config)}
                            className="group relative bg-white rounded-xl border border-slate-100 p-4 tablet-lg:p-3 shadow-sm hover:shadow-lg hover:shadow-slate-200 transition-all duration-500 cursor-pointer overflow-hidden flex flex-col items-center text-center"
                        >
                            <div className={`absolute top-0 right-0 w-20 h-20 tablet-lg:w-14 tablet-lg:h-14 bg-gradient-to-br ${colors.gradient} opacity-[0.03] group-hover:opacity-[0.08] rounded-full -mr-10 -mt-10 tablet-lg:-mr-6 tablet-lg:-mt-6 transition-all duration-700 group-hover:scale-150`} />

                            <div className="relative z-10 flex flex-col items-center w-full">
                                <div className="flex justify-between items-start w-full mb-3 tablet-lg:mb-2">
                                    <div className={`w-10 h-10 tablet-lg:w-9 tablet-lg:h-9 bg-gradient-to-br ${colors.gradient} rounded-lg flex items-center justify-center ${colors.icon} shadow-md shadow-current/10 ring-2 ring-white`}>
                                        <Percent size={20} strokeWidth={2.5} className="tablet-lg:w-[18px] tablet-lg:h-[18px]" />
                                    </div>

                                    <div className="flex flex-col items-end gap-0.5">
                                        <span className={`px-1.5 py-0.5 rounded text-[9px] tablet-lg:text-[8px] font-bold uppercase tracking-widest border shadow-sm ${isLiquidation ? 'border-amber-200 bg-amber-50 text-amber-600' : 'border-blue-200 bg-blue-50 text-blue-600'}`}>
                                            {isLiquidation ? 'Thanh lý' : 'Định kỳ'}
                                        </span>
                                        <span className="text-[9px] tablet-lg:text-[8px] font-semibold text-slate-400 font-mono">#{config.code}</span>
                                    </div>
                                </div>

                                <div className="mb-1 tablet-lg:mb-0.5 w-full">
                                    <h3 className="text-base tablet-lg:text-sm font-bold text-slate-900 leading-tight mb-2 tablet-lg:mb-1 group-hover:text-blue-600 transition-colors truncate">
                                        {config.name}
                                    </h3>
                                    <div className="flex justify-center">
                                        <div className={`px-3 py-1.5 tablet-lg:px-2.5 tablet-lg:py-1 rounded-lg ${colors.bgIcon} flex items-center gap-1 shadow-md shadow-current/20`}>
                                            <span className="text-2xl tablet-lg:text-xl font-bold text-white leading-none">
                                                {config.rate_per_month}%
                                            </span>
                                            <span className="text-[9px] tablet-lg:text-[8px] font-bold text-white/90 uppercase">/ Th</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="absolute bottom-2 right-2 tablet-lg:bottom-1.5 tablet-lg:right-1.5 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                                <div className="p-1 tablet-lg:p-0.5 rounded-md bg-slate-900 text-white shadow-lg">
                                    <Pencil size={10} className="tablet-lg:w-2.5 tablet-lg:h-2.5" />
                                </div>
                            </div>
                        </div>
                    );
                })}

                {configs?.length === 0 && (
                    <div className="col-span-full">
                        <EmptyStates.NoData
                            action={() => { setIsEditing(false); setIsOpen(true); }}
                            actionLabel="Thêm cấu hình đầu tiên"
                        />
                    </div>
                )}
            </div>
        </div >
    );
}
