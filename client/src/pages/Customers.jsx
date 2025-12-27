import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getCustomers, createCustomer, updateCustomer, deleteCustomerSecure } from '../services/api';
import { Plus, Search, Edit2, Trash2, User, MapPin, ChevronRight, Users, Check, Award } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import { clsx } from 'clsx';

export default function Customers() {
    const queryClient = useQueryClient();
    const { showToast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [currentId, setCurrentId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState({ name: '', contact_info: '' });

    const { data: customers } = useQuery({ queryKey: ['customers'], queryFn: getCustomers });

    const createMutation = useMutation({
        mutationFn: createCustomer,
        onSuccess: () => {
            queryClient.invalidateQueries(['customers']);
            handleClose();
            showToast('Thành công', `Đã thêm khách hàng "${formData.name}"`, 'success');
        },
        onError: (err) => {
            showToast('Lỗi', err.response?.data?.detail || "Không thể tạo khách hàng", 'error');
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
            showToast('Lỗi', err.response?.data?.detail || "Không thể cập nhật khách hàng", 'error');
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
            showToast('Lỗi', err.response?.data?.detail || "Lỗi xóa khách hàng", 'error');
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
        setCurrentId(c._id);
        setFormData({ name: c.name, contact_info: c.contact_info });
        setIsOpen(true);
    };

    const handleClose = () => {
        setIsOpen(false);
        setIsEdit(false);
        setCurrentId(null);
        setFormData({ name: '', contact_info: '' });
    };

    const filteredCustomers = customers?.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.contact_info.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Danh Sách Khách Hàng</h2>
                    <p className="text-slate-500 text-sm">Quản lý thông tin đối tác và khách hàng</p>
                </div>

                <div className="flex gap-3">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                            <Search size={18} />
                        </div>
                        <input
                            type="text"
                            placeholder="Tìm kiếm..."
                            className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm transition-all w-64"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => setIsOpen(true)}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-blue-200 font-medium active:scale-95"
                    >
                        <Plus size={18} />
                        Thêm Khách Hàng
                    </button>
                </div>
            </div>

            {/* Modal */}
            {isOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="text-lg font-bold text-slate-800">{isEdit ? 'Cập Nhật Thông Tin' : 'Thêm Khách Hàng Mới'}</h3>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Họ và tên</label>
                                <input
                                    required
                                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Nhập tên khách hàng"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Thông tin liên hệ</label>
                                <input
                                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    value={formData.contact_info}
                                    onChange={e => setFormData({ ...formData, contact_info: e.target.value })}
                                    placeholder="SĐT, Địa chỉ, Ghi chú..."
                                />
                            </div>
                            <div className="flex justify-between items-center pt-4 border-t border-slate-100 mt-2">
                                <div>
                                    {isEdit && (
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
                                        {createMutation.isPending || updateMutation.isPending ? 'Đang xử lý...' : (isEdit ? 'Lưu thay đổi' : 'Thêm mới')}
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
                title="Xóa Khách Hàng"
                warningMessage="CẢNH BÁO: Hành động này sẽ xóa khách hàng và TOÀN BỘ lịch sử giao dịch liên quan. Không thể hoàn tác!"
                isDeleting={deleteMutation.isPending}
            />

            {/* Customer Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredCustomers?.map(customer => (
                    <div
                        key={customer._id}
                        onClick={() => handleEdit(customer)}
                        className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all group relative overflow-hidden cursor-pointer"
                    >

                        {/* Paid in Full Ribbon */}
                        {customer.is_paid_in_full && (
                            <div className="absolute top-0 right-0 z-0 text-center">
                                <div className="absolute top-[32px] right-[-40px] rotate-45 bg-gradient-to-r from-emerald-500 to-green-600 text-white text-xs font-bold py-1.5 w-[170px] shadow-sm uppercase tracking-wider">
                                    Đã tất toán
                                </div>
                            </div>
                        )}

                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-12 -mt-12 transition-transform group-hover:scale-110 z-0 opacity-50"></div>

                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                                <User size={24} />
                            </div>
                            {/* Edit button removed as per request */}
                        </div>

                        <div className="mb-4 relative z-10">
                            <h3 className="text-lg font-bold text-slate-900 mb-1">{customer.name}</h3>
                            <div className="flex items-center gap-2 text-slate-500 text-sm">
                                <MapPin size={14} />
                                <span className="truncate">{customer.contact_info || 'Chưa cập nhật địa chỉ'}</span>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex justify-between items-center relative z-10">
                            <span className="text-sm text-slate-400 font-medium">Chi tiết công nợ</span>
                            <Link
                                to={`/customers/${customer._id}/debt`}
                                onClick={(e) => e.stopPropagation()} // Prevent card click
                                className="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100"
                            >
                                Xem ngay <ChevronRight size={14} />
                            </Link>
                        </div>
                    </div>
                ))}

                {
                    filteredCustomers?.length === 0 && (
                        <div className="col-span-full py-16 flex flex-col items-center justify-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-dashed border-slate-200">
                                <Users size={32} className="opacity-40" />
                            </div>
                            <p className="font-medium text-slate-500">Không tìm thấy khách hàng</p>
                            <p className="text-sm mt-1">Thử tìm từ khóa khác hoặc thêm khách hàng mới</p>
                        </div>
                    )
                }
            </div >
        </div >
    );
}
