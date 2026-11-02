import React, { useMemo, useState } from 'react';
import { clsx } from 'clsx';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createUser, deleteUserSecure, getUsers, updateUser } from '../services/api';
import { Plus, Pencil, Trash2, User as UserIcon, Shield } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { getApiErrorMessage } from '../utils/errorMessage';
import { useAuth } from '../context/AuthContext';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import DataTable from '../components/DataTable';
import AppModal from '../components/AppModal';

const ROLE_OPTIONS = [
    { value: 'ADMIN', label: 'ADMIN' },
    { value: 'SALE', label: 'SALE' }
];

export default function UserManagement() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const queryClient = useQueryClient();

    const isAdmin = user?.role === 'ADMIN';

    const { data: users, isLoading } = useQuery({
        queryKey: ['users'],
        queryFn: getUsers,
        enabled: isAdmin
    });

    const [isOpen, setIsOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);


    const [formData, setFormData] = useState({
        _id: '',
        username: '',
        display_name: '',
        role: 'SALE',
        password: '',
        pin: ''
    });

    const selectedUserTitle = useMemo(() => {
        const name = (formData.display_name || formData.username || '').trim();
        return name || 'User';
    }, [formData.display_name, formData.username]);

    // Define handleClose before mutations that use it
    const handleClose = () => {
        setIsOpen(false);
        setIsEditing(false);
        setFormData({ _id: '', username: '', display_name: '', role: 'SALE', password: '', pin: '' });
    };

    const createMutation = useMutation({
        mutationFn: createUser,
        onSuccess: () => {
            queryClient.invalidateQueries(['users']);
            handleClose();
            showToast('Thành công', 'Đã tạo user mới', 'success');
        },
        onError: (err) => {
            showToast('Lỗi', getApiErrorMessage(err, 'Tạo tài khoản người dùng'), 'error');
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => updateUser(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['users']);
            handleClose();
            showToast('Thành công', 'Đã cập nhật user', 'success');
        },
        onError: (err) => {
            showToast('Lỗi', getApiErrorMessage(err, 'Cập nhật tài khoản người dùng'), 'error');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: ({ id, pin }) => deleteUserSecure(id, pin),
        onSuccess: () => {
            queryClient.invalidateQueries(['users']);
            setIsDeleteModalOpen(false);
            handleClose();
            showToast('Thành công', 'Đã xóa user', 'success');
        },
        onError: (err) => {
            showToast('Lỗi', getApiErrorMessage(err, 'Xóa tài khoản người dùng'), 'error');
        }
    });

    const openCreate = () => {
        setIsEditing(false);
        setFormData({ _id: '', username: '', display_name: '', role: 'SALE', password: '', pin: '' });
        setIsOpen(true);
    };

    const openEdit = (u) => {
        setIsEditing(true);
        setFormData({
            _id: u._id,
            username: u.username || '',
            display_name: u.display_name || '',
            role: u.role || 'SALE',
            password: '', // optional reset
            pin: ''
        });
        setIsOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!isAdmin) {
            showToast('Không có quyền', 'Chỉ ADMIN mới được quản lý user', 'error');
            return;
        }

        if (!isEditing) {
            // Validate username
            const username = formData.username?.trim() || '';
            if (!username) {
                showToast('Thiếu thông tin', 'Username là bắt buộc', 'error');
                return;
            }
            if (username.length < 3 || username.length > 30) {
                showToast('Lỗi', 'Username phải từ 3-30 ký tự', 'error');
                return;
            }
            if (!/^[a-zA-Z0-9_]+$/.test(username)) {
                showToast('Lỗi', 'Username chỉ được chứa chữ, số và dấu gạch dưới', 'error');
                return;
            }

            // Validate password
            const password = formData.password || '';
            if (!password) {
                showToast('Thiếu thông tin', 'Mật khẩu là bắt buộc', 'error');
                return;
            }
            if (password.length < 4) {
                showToast('Lỗi', 'Mật khẩu phải có ít nhất 4 ký tự', 'error');
                return;
            }

            // Validate PIN if provided
            if (formData.pin) {
                const pin = formData.pin.trim();
                if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
                    showToast('Lỗi', 'PIN phải là 4 chữ số', 'error');
                    return;
                }
            }

            createMutation.mutate({
                username: username,
                password: password,
                display_name: formData.display_name?.trim() || '',
                role: formData.role,
                ...(formData.pin ? { pin: formData.pin.trim() } : {})
            });
            return;
        }

        // Validate password if provided
        if (formData.password) {
            if (formData.password.length < 4) {
                showToast('Lỗi', 'Mật khẩu phải có ít nhất 4 ký tự', 'error');
                return;
            }
        }

        // Validate PIN if provided
        if (formData.pin) {
            const pin = formData.pin.trim();
            if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
                showToast('Lỗi', 'PIN phải là 4 chữ số', 'error');
                return;
            }
        }

        updateMutation.mutate({
            id: formData._id,
            data: {
                display_name: formData.display_name?.trim() || '',
                role: formData.role,
                ...(formData.password ? { password: formData.password } : {}),
                ...(formData.pin ? { pin: formData.pin.trim() } : {})
            }
        });
    };

    const handleDeleteConfirm = (pin) => {
        if (!formData._id) return;
        deleteMutation.mutate({ id: formData._id, pin });
    };

    if (!isAdmin) {
        return <Navigate to="/overview" replace />;
    }

    if (isLoading) {
        return <div className="p-4 text-sm text-slate-500">Đang tải...</div>;
    }

    return (
        <div className="space-y-4 lg:space-y-5">
            {/* Header Section */}
            <div className="space-y-0">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    {/* Left: Title & Subtitle */}
                    <div>
                        <h2 className="section-title">Quản lý user</h2>
                        <p className="section-subtitle mt-1">Tạo và phân quyền user (SALE/ADMIN)</p>
                    </div>

                    {/* Right: Create Button */}
                    <button
                        onClick={openCreate}
                        className="btn-primary btn-md whitespace-nowrap shrink-0"
                    >
                        <Plus size={18} className="shrink-0" />
                        <span>Thêm user</span>
                    </button>
                </div>
            </div>

            <div className="card p-0 overflow-hidden">
                <DataTable
                    rows={users || []}
                    getRowKey={(u) => u._id}
                    caption="Danh sách người dùng và phân quyền"
                    columns={[
                        {
                            id: 'username',
                            header: 'User',
                            priority: 1,
                            cell: (u) => (
                                <div className="flex items-center gap-3">
                                    <div className="flex-none w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                        <UserIcon size={20} />
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-800 text-sm">{u.username}</div>
                                        {u.legacy_password ? (
                                            <div className="text-[13px] font-bold text-amber-600  bg-amber-50 px-1.5 py-0.5 rounded-md mt-1 w-fit">Legacy</div>
                                        ) : null}
                                    </div>
                                </div>
                            ),
                        },
                        {
                            id: 'display_name',
                            header: 'Display name',
                            priority: 2,
                            cellClassName: 'text-slate-600 font-medium',
                            cell: (u) => u.display_name || '—',
                        },
                        {
                            id: 'role',
                            header: 'Role',
                            priority: 2,
                            cell: (u) => (
                                <span className={clsx(
                                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border",
                                    u.role === 'ADMIN'
                                        ? 'bg-purple-50 text-purple-700 border-purple-100'
                                        : 'bg-slate-100 text-slate-600 border-slate-200'
                                )}>
                                    <Shield size={12} />
                                    {u.role || 'SALE'}
                                </span>
                            ),
                        },
                        {
                            id: 'actions',
                            header: 'Thao tác',
                            priority: 2,
                            align: 'right',
                            cell: (u) => (
                                <div className="inline-flex items-center gap-2">
                                    <button
                                        className="p-1.5 min-w-[var(--tap-min)] min-h-[var(--tap-min)] flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                        onClick={() => openEdit(u)}
                                        title="Sửa"
                                        aria-label={`Sửa ${u.username}`}
                                    >
                                        <Pencil size={18} />
                                    </button>
                                    <button
                                        className="p-1.5 min-w-[var(--tap-min)] min-h-[var(--tap-min)] flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                        onClick={() => { openEdit(u); setIsDeleteModalOpen(true); }}
                                        title="Xóa"
                                        aria-label={`Xóa ${u.username}`}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ),
                        },
                    ]}
                    empty={(
                        <div className="text-center text-slate-400 py-8">
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-12 h-12 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center">
                                    <UserIcon size={24} />
                                </div>
                                <p className="font-medium">Chưa có người dùng nào</p>
                            </div>
                        </div>
                    )}
                />
            </div>

            <AppModal
                isOpen={isOpen}
                onClose={handleClose}
                size="lg"
                title={isEditing ? 'Cập nhật user' : 'Thêm user'}
                footer={(
                    <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
                        {isEditing ? (
                            <button
                                type="button"
                                className="btn-ghost btn-md text-red-600 hover:text-red-700"
                                onClick={() => setIsDeleteModalOpen(true)}
                            >
                                <Trash2 size={18} />
                                Xóa user
                            </button>
                        ) : <span />}
                        <div className="flex gap-2">
                            <button type="button" className="btn-secondary btn-md flex-1 sm:flex-none" onClick={handleClose}>
                                Huỷ
                            </button>
                            {/* Nút submit nằm NGOÀI <form> nhưng vẫn gửi được nhờ thuộc tính form=,
                                nhờ vậy chân modal dính đáy trong khi thân vẫn cuộn. */}
                            <button
                                type="submit"
                                form="user-form"
                                className="btn-primary btn-md flex-1 sm:flex-none"
                                disabled={createMutation.isPending || updateMutation.isPending}
                            >
                                {isEditing ? 'Lưu thay đổi' : 'Tạo user'}
                            </button>
                        </div>
                    </div>
                )}
            >
                <p className="mb-3 text-xs text-slate-500">{selectedUserTitle}</p>
                <form id="user-form" onSubmit={handleSubmit} className="space-y-3">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label className="label">Username</label>
                            <input
                                className="input"
                                value={formData.username}
                                onChange={(e) => setFormData((s) => ({ ...s, username: e.target.value }))}
                                disabled={isEditing}
                                placeholder="vd: admin2"
                            />
                        </div>
                        <div>
                            <label className="label">Role</label>
                            <select
                                className="input"
                                value={formData.role}
                                onChange={(e) => setFormData((s) => ({ ...s, role: e.target.value }))}
                            >
                                {ROLE_OPTIONS.map((r) => (
                                    <option key={r.value} value={r.value}>{r.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="label">Display name</label>
                        <input
                            className="input"
                            value={formData.display_name}
                            onChange={(e) => setFormData((s) => ({ ...s, display_name: e.target.value }))}
                            placeholder="vd: Thành Công"
                        />
                    </div>

                    <div>
                        <label className="label">{isEditing ? 'Đặt lại mật khẩu (tuỳ chọn)' : 'Mật khẩu'}</label>
                        <input
                            type="password"
                            className="input"
                            value={formData.password}
                            onChange={(e) => setFormData((s) => ({ ...s, password: e.target.value }))}
                            placeholder={isEditing ? 'Để trống nếu không đổi' : 'Nhập mật khẩu'}
                        />
                    </div>

                    <div>
                        <label className="label">{isEditing ? 'Đặt lại mã PIN (tuỳ chọn)' : 'Mã PIN (để xóa/xác thực)'}</label>
                        <input
                            type="password"
                            className="input"
                            value={formData.pin}
                            onChange={(e) => setFormData((s) => ({ ...s, pin: e.target.value }))}
                            placeholder={isEditing ? 'Để trống nếu không đổi' : 'Nhập mã PIN'}
                            maxLength={6}
                            inputMode="numeric"
                        />
                    </div>
                </form>
            </AppModal>

            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="Xác nhận xóa"
                message="Nhập mã PIN Admin để xóa user này."
            />
        </div>
    );
}
