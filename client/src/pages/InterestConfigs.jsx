import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getInterestConfigs, createInterestConfig, updateInterestConfig, deleteInterestConfigSecure } from '../services/api';
import { Plus, Edit2, Trash2, Percent, Tag, Pencil, X } from 'lucide-react';
import { clsx } from 'clsx';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import { getInterestConfigColorScheme } from '../utils/colorSchemes';

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

    const { data: configs, isLoading } = useQuery({
        queryKey: ['interest-configs'],
        queryFn: getInterestConfigs
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
    };

    const handleEdit = (config) => {
        setIsEditing(true);
        setFormData({
            code: config.code,
            name: config.name,
            rate_per_month: config.rate_per_month,
            description: config.description || ''
        });
        setIsOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isEditing) {
            updateMutation.mutate({ code: formData.code, data: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    if (isLoading) return <div className="p-8">Đang tải...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Cấu Hình Lãi Suất</h2>
                    <p className="text-slate-500 text-xs sm:text-sm font-medium">Tùy chỉnh các mức lãi suất mặc định cho giao dịch</p>
                </div>
                <button
                    onClick={() => { setIsEditing(false); setIsOpen(true); }}
                    className="w-full sm:w-auto btn btn-primary btn-md"
                >
                    <Plus size={18} />
                    Thêm cấu hình
                </button>
            </div>

            {isOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-0 sm:p-4 transition-all overflow-hidden">
                    <div className="bg-white sm:rounded-[2.5rem] w-full h-full sm:h-auto sm:max-w-md shadow-2xl overflow-hidden animate-in fade-in sm:zoom-in sm:duration-300 duration-300 flex flex-col transition-all">
                        <div className="px-8 py-6 border-b border-slate-100 bg-white flex justify-between items-center relative z-10">
                            <div className="flex items-center gap-3">
                                <div className={clsx(
                                    "p-2.5 rounded-2xl flex items-center justify-center",
                                    isEditing ? "bg-blue-50 text-blue-600" : "bg-emerald-50 text-emerald-600"
                                )}>
                                    {isEditing ? <Edit2 size={22} /> : <Plus size={22} />}
                                </div>
                                <div>
                                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
                                                isEditing && 'cursor-not-allowed'
                                            )}
                                            value={formData.code}
                                            onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        />
                                    </div>
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
                                            className="input input-icon"
                                            value={formData.rate_per_month}
                                            onChange={e => setFormData({ ...formData, rate_per_month: parseFloat(e.target.value) })}
                                        />
                                    </div>
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
                                        className="input input-icon"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                {configs?.map(config => {
                    const colors = getInterestConfigColorScheme(config.code);
                    const isLiquidation = config.code?.toLowerCase().includes('tl') || config.name?.toLowerCase().includes('thanh lý');

                    return (
                        <div
                            key={config._id}
                            onClick={() => handleEdit(config)}
                            className="group relative bg-white rounded-3xl border border-slate-100 p-6 shadow-sm hover:shadow-2xl hover:shadow-slate-200 transition-all duration-500 cursor-pointer overflow-hidden flex flex-col items-center text-center"
                        >
                            {/* Visual Pattern Overlays */}
                            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colors.gradient} opacity-[0.03] group-hover:opacity-[0.08] rounded-full -mr-16 -mt-16 transition-all duration-700 group-hover:scale-150`}></div>

                            <div className="relative z-10 flex flex-col items-center w-full">
                                <div className="flex justify-between items-start w-full mb-6">
                                    <div className={`w-14 h-14 bg-gradient-to-br ${colors.gradient} rounded-[1.25rem] flex items-center justify-center ${colors.icon} shadow-lg shadow-current/10 ring-4 ring-white`}>
                                        <Percent size={28} strokeWidth={2.5} />
                                    </div>

                                    <div className="flex flex-col items-end gap-1.5">
                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border shadow-sm ${isLiquidation ? 'border-amber-200 bg-amber-50 text-amber-600' : 'border-blue-200 bg-blue-50 text-blue-600'}`}>
                                            {isLiquidation ? 'Thanh lý' : 'Định kỳ'}
                                        </span>
                                        <span className="text-[10px] font-semibold text-slate-400 font-mono">#{config.code}</span>
                                    </div>
                                </div>

                                <div className="mb-2 w-full">
                                    <h3 className="text-xl font-bold text-slate-900 leading-tight mb-4 group-hover:text-blue-600 transition-colors truncate">
                                        {config.name}
                                    </h3>
                                    <div className="flex justify-center">
                                        <div className={`px-5 py-2.5 rounded-2xl ${colors.bgIcon} flex items-center gap-1.5 shadow-lg shadow-current/20`}>
                                            <span className="text-3xl font-bold text-white leading-none">
                                                {config.rate_per_month}%
                                            </span>
                                            <span className="text-[10px] font-bold text-white/90 uppercase">/ Th</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Hover Action Indicator */}
                            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                                <div className={`p-2 rounded-xl bg-slate-900 text-white shadow-lg`}>
                                    <Pencil size={14} />
                                </div>
                            </div>
                        </div>
                    );
                })}

                {configs?.length === 0 && (
                    <div className="col-span-full py-16 flex flex-col items-center justify-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-dashed border-slate-200">
                            <Percent size={32} className="opacity-40" />
                        </div>
                        <p className="font-medium text-slate-500">Chưa có cấu hình lãi suất</p>
                        <p className="text-sm mt-1">Hãy thêm mức lãi suất chuẩn (vd. 2% Tiền mặt)</p>
                    </div>
                )}
            </div>
        </div >
    );
}
