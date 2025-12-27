import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getInterestConfigs, createInterestConfig, updateInterestConfig, deleteInterestConfigSecure } from '../services/api';
import { Plus, Edit2, Trash2, Percent, Tag, Pencil } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';

export default function InterestConfigs() {
    const queryClient = useQueryClient();
    const { showToast } = useToast();
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
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800">Cấu Hình Lãi Suất</h2>
                <button
                    onClick={() => { setIsEditing(false); setIsOpen(true); }}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-blue-200 font-medium active:scale-95"
                >
                    <Plus size={18} />
                    Thêm cấu hình
                </button>
            </div>

            {isOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
                        <h3 className="text-xl font-bold mb-4">{isEditing ? 'Sửa Cấu Hình' : 'Thêm Quy Tắc Lãi Suất Mới'}</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Mã (Duy nhất)</label>
                                    <input
                                        type="text"
                                        required
                                        disabled={isEditing}
                                        placeholder="Ví dụ: TIEN_MAT"
                                        className={`w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-indigo-500 uppercase ${isEditing ? 'bg-slate-100 text-slate-500' : ''}`}
                                        value={formData.code}
                                        onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Lãi suất tháng (%)</label>
                                    <input
                                        type="number"
                                        required
                                        step="0.1"
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={formData.rate_per_month}
                                        onChange={e => setFormData({ ...formData, rate_per_month: parseFloat(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tên loại</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ví dụ: Tiền Mặt"
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả</label>
                                <textarea
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                                    rows="3"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-between items-center pt-4 border-t border-slate-100 mt-2">
                                <div>
                                    {isEditing && (
                                        <button
                                            type="button"
                                            onClick={() => setIsDeleteModalOpen(true)}
                                            className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors flex items-center gap-2"
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
                                        className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={createMutation.isPending || updateMutation.isPending}
                                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                                    >
                                        {(createMutation.isPending || updateMutation.isPending) ? 'Đang lưu...' : 'Lưu'}
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
                title="Xóa Cấu Hình Lãi Suất"
                warningMessage="CẢNH BÁO: Xóa cấu hình này có thể gây lỗi hiển thị cho các giao dịch lịch sử đang sử dụng nó. Bạn có chắc chắn muốn tiếp tục?"
                isDeleting={deleteMutation.isPending}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {configs?.map(config => (
                    <div
                        key={config._id}
                        onClick={() => handleEdit(config)}
                        className="group relative overflow-hidden bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all cursor-pointer"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110">
                            <Percent size={100} className="text-indigo-600" />
                        </div>

                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm ring-1 ring-indigo-100">
                                    <Tag size={24} />
                                </div>
                            </div>

                            <h3 className="text-lg font-bold text-slate-900 mb-1">{config.name}</h3>
                            <div className="flex items-baseline gap-1 mb-2">
                                <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                    {config.rate_per_month}%
                                </span>
                                <span className="text-sm text-slate-500 font-medium">/ tháng</span>
                            </div>
                            <p className="text-sm text-slate-400 line-clamp-2">
                                {config.description || 'Chưa có mô tả'}
                            </p>
                        </div>
                    </div>
                ))}

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
