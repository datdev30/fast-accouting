import React, { useMemo, useState } from 'react';
import { clsx } from 'clsx';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createUser, deleteUserSecure, getUsers, updateUser } from '../services/api';
import { Plus, Pencil, Trash2, User as UserIcon, Shield, X, AlertCircle } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';

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
    
    const [validationErrors, setValidationErrors] = useState({
        username: '',
        display_name: '',
        password: '',
        pin: ''
    });

    const selectedUserTitle = useMemo(() => {
        const name = (formData.display_name || formData.username || '').trim();
        return name || 'User';
    }, [formData.display_name, formData.username]);

    const createMutation = useMutation({
        mutationFn: createUser,
        onSuccess: () => {
            queryClient.invalidateQueries(['users']);
            handleClose();
            showToast('Thành công', 'Đã tạo user mới', 'success');
        },
        onError: (err) => {
            showToast('Lỗi', err.response?.data?.error || 'Không thể tạo user', 'error');
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
            showToast('Lỗi', err.response?.data?.error || 'Không thể cập nhật user', 'error');
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
            showToast('Lỗi', err.response?.data?.error || 'Không thể xóa user', 'error');
        }
    });

    const handleClose = () => {
        setIsOpen(false);
        setIsEditing(false);
        setFormData({ _id: '', username: '', display_name: '', role: 'SALE', password: '', pin: '' });
        setValidationErrors({ username: '', display_name: '', password: '', pin: '' });
    };

    const openCreate = () => {
        setIsEditing(false);
        setFormData({ _id: '', username: '', display_name: '', role: 'SALE', password: '', pin: '' });
        setValidationErrors({ username: '', display_name: '', password: '', pin: '' });
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

    const validateUserForm = () => {
        const errors = {
            username: '',
            display_name: '',
            password: '',
            pin: ''
        };
        let isValid = true;

        if (!isEditing) {
            // Validate username (create mode)
            const username = formData.username.trim();
            if (!username) {
                errors.username = 'Vui lòng nhập tên đăng nhập';
                isValid = false;
            } else if (username.length < 3) {
                errors.username = 'Tên đăng nhập phải có ít nhất 3 ký tự';
                isValid = false;
            } else if (username.length > 50) {
                errors.username = 'Tên đăng nhập không được vượt quá 50 ký tự';
                isValid = false;
            } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
                errors.username = 'Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới';
                isValid = false;
            }

            // Validate password (create mode)
            if (!formData.password) {
                errors.password = 'Vui lòng nhập mật khẩu';
                isValid = false;
            } else if (formData.password.length < 6) {
                errors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
                isValid = false;
            } else if (formData.password.length > 100) {
                errors.password = 'Mật khẩu không được vượt quá 100 ký tự';
                isValid = false;
            }
        } else {
            // Edit mode: password và pin là optional
            if (formData.password && formData.password.length < 6) {
                errors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
                isValid = false;
            }
            if (formData.password && formData.password.length > 100) {
                errors.password = 'Mật khẩu không được vượt quá 100 ký tự';
                isValid = false;
            }
        }

        // Validate display_name
        if (formData.display_name && formData.display_name.length > 100) {
            errors.display_name = 'Tên hiển thị không được vượt quá 100 ký tự';
            isValid = false;
        }

        // Validate PIN
        if (formData.pin) {
            if (!/^\d+$/.test(formData.pin)) {
                errors.pin = 'Mã PIN chỉ được chứa số';
                isValid = false;
            } else if (formData.pin.length !== 6) {
                errors.pin = 'Mã PIN phải có đúng 6 chữ số';
                isValid = false;
            }
        } else if (!isEditing) {
            // PIN is optional in create mode, but if provided must be valid
        }

        setValidationErrors(errors);
        return isValid;
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!isAdmin) {
            showToast('Không có quyền', 'Chỉ ADMIN mới được quản lý user', 'error');
            return;
        }

        if (!validateUserForm()) {
            return;
        }

        if (!isEditing) {
            createMutation.mutate({
                username: formData.username.trim(),
                password: formData.password,
                display_name: formData.display_name.trim(),
                role: formData.role,
                ...(formData.pin ? { pin: formData.pin } : {})
            });
            return;
        }

        updateMutation.mutate({
            id: formData._id,
            data: {
                display_name: formData.display_name.trim(),
                role: formData.role,
                ...(formData.password ? { password: formData.password } : {}),
                ...(formData.pin ? { pin: formData.pin } : {})
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
        return <div className="p-8">Đang tải...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="space-y-0">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h2 className="section-title text-2xl tablet-lg:text-xl">Quản lý người dùng</h2>
                        <p className="section-subtitle text-sm tablet-lg:text-xs mt-1">Tạo và phân quyền (SALE/ADMIN)</p>
                    </div>

                    {/* Nút Thêm: chỉ landscape; portrait dùng FAB */}
                    <button
                        onClick={openCreate}
                        className="hidden tablet-lg:inline-flex btn-primary btn-sm justify-center gap-2 shrink-0"
                    >
                        <Plus size={18} />
                        <span>Thêm user</span>
                    </button>
                </div>
            </div>

            {/* FAB - Chỉ portrait; landscape dùng nút trong header */}
            <button
                onClick={openCreate}
                className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-16 h-16 bg-teal-600 hover:bg-teal-700 text-white rounded-full shadow-xl shadow-teal-500/40 flex items-center justify-center transition-colors duration-200 active:scale-95 tablet-lg:hidden"
                aria-label="Thêm người dùng"
            >
                <Plus size={26} />
            </button>

            <div className="card p-0 overflow-hidden">
                <div className="overflow-auto">
                    <table className="table w-full">
                        <thead className="table-head">
                            <tr>
                                <th className="table-th px-6 py-4 tablet-lg:px-4 tablet-lg:py-2.5 text-left text-xs tablet-lg:text-[10px]">User</th>
                                <th className="table-th px-6 py-4 tablet-lg:px-4 tablet-lg:py-2.5 text-left text-xs tablet-lg:text-[10px]">Tên hiển thị</th>
                                <th className="table-th px-6 py-4 tablet-lg:px-4 tablet-lg:py-2.5 text-left text-xs tablet-lg:text-[10px]">Role</th>
                                <th className="table-th px-6 py-4 tablet-lg:px-4 tablet-lg:py-2.5 text-right text-xs tablet-lg:text-[10px]">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {(users || []).map((u) => (
                                <tr key={u._id} className="table-row hover:bg-slate-50/50 transition-colors">
                                    <td className="table-td px-6 py-4 tablet-lg:px-4 tablet-lg:py-3">
                                        <div className="flex items-center gap-3 tablet-lg:gap-2">
                                            <div className="flex-none w-10 h-10 tablet-lg:w-9 tablet-lg:h-9 rounded-xl tablet-lg:rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                                <UserIcon size={20} className="tablet-lg:w-4 tablet-lg:h-4" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-800 text-sm tablet-lg:text-xs">{u.username}</div>
                                                {u.legacy_password ? (
                                                    <div className="text-[10px] tablet-lg:text-[9px] font-bold text-amber-600 uppercase tracking-wider bg-amber-50 px-1.5 py-0.5 rounded mt-0.5 w-fit">Legacy</div>
                                                ) : null}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="table-td px-6 py-4 tablet-lg:px-4 tablet-lg:py-3 text-slate-600 font-medium text-sm tablet-lg:text-xs">{u.display_name || '—'}</td>
                                    <td className="table-td px-6 py-4 tablet-lg:px-4 tablet-lg:py-3">
                                        <span className={clsx(
                                            "inline-flex items-center gap-1.5 px-2.5 py-1 tablet-lg:px-2 tablet-lg:py-0.5 rounded-lg tablet-lg:rounded text-xs tablet-lg:text-[10px] font-bold border",
                                            u.role === 'ADMIN'
                                                ? 'bg-purple-50 text-purple-700 border-purple-100'
                                                : 'bg-slate-100 text-slate-600 border-slate-200'
                                        )}>
                                            <Shield size={12} className="tablet-lg:w-3 tablet-lg:h-3 shrink-0" />
                                            {u.role || 'SALE'}
                                        </span>
                                    </td>
                                    <td className="table-td px-6 py-4 tablet-lg:px-4 tablet-lg:py-3 text-right">
                                        <div className="inline-flex items-center gap-2 tablet-lg:gap-1">
                                            <button
                                                className="p-2 min-w-[44px] min-h-[44px] tablet-lg:min-w-[36px] tablet-lg:min-h-[36px] tablet-lg:p-1.5 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                onClick={() => openEdit(u)}
                                                title="Sửa"
                                            >
                                                <Pencil size={18} className="tablet-lg:w-4 tablet-lg:h-4" />
                                            </button>
                                            <button
                                                className="p-2 min-w-[44px] min-h-[44px] tablet-lg:min-w-[36px] tablet-lg:min-h-[36px] tablet-lg:p-1.5 flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                onClick={() => { openEdit(u); setIsDeleteModalOpen(true); }}
                                                title="Xóa"
                                            >
                                                <Trash2 size={18} className="tablet-lg:w-4 tablet-lg:h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {(users || []).length === 0 && (
                                <tr>
                                    <td colSpan={4} className="text-center text-slate-400 py-12 tablet-lg:py-8">
                                        <div className="flex flex-col items-center gap-3 tablet-lg:gap-2">
                                            <div className="w-12 h-12 tablet-lg:w-10 tablet-lg:h-10 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center">
                                                <UserIcon size={24} className="tablet-lg:w-5 tablet-lg:h-5" />
                                            </div>
                                            <p className="font-medium text-sm tablet-lg:text-xs">Chưa có người dùng nào</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-hidden">
                    <div className="bg-white rounded-2xl tablet-lg:rounded-xl w-full h-auto max-w-lg shadow-2xl overflow-hidden flex flex-col">
                        <div className="px-6 py-5 tablet-lg:px-5 tablet-lg:py-4 border-b border-slate-100 bg-white flex justify-between items-center">
                            <div>
                                <h3 className="text-lg tablet-lg:text-base font-bold text-slate-900">{isEditing ? 'Cập nhật user' : 'Thêm user'}</h3>
                                <p className="text-xs tablet-lg:text-[10px] text-slate-500 mt-0.5">{selectedUserTitle}</p>
                            </div>
                            <button className="btn btn-ghost btn-sm p-2" onClick={handleClose} aria-label="Đóng">
                                <X size={18} className="tablet-lg:w-4 tablet-lg:h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 tablet-lg:p-5 space-y-4 tablet-lg:space-y-3 overflow-auto">
                            <div className="grid grid-cols-2 gap-4 tablet-lg:gap-3">
                                <div>
                                    <label className="label text-sm tablet-lg:text-xs">Username</label>
                                    <input
                                        className={clsx(
                                            "input py-3 tablet-lg:py-2.5 text-sm tablet-lg:text-sm",
                                            validationErrors.username && "input-error"
                                        )}
                                        value={formData.username}
                                        onChange={(e) => {
                                            setFormData((s) => ({ ...s, username: e.target.value }));
                                            setValidationErrors(prev => ({ ...prev, username: '' }));
                                        }}
                                        disabled={isEditing}
                                        placeholder="vd: admin2"
                                        aria-invalid={!!validationErrors.username}
                                        aria-describedby={validationErrors.username ? 'username-error' : undefined}
                                    />
                                    {validationErrors.username && (
                                        <p id="username-error" className="field-error">
                                            <AlertCircle size={12} className="shrink-0" />
                                            {validationErrors.username}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="label text-sm tablet-lg:text-xs">Role</label>
                                    <select
                                        className="input py-3 tablet-lg:py-2.5 text-sm"
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
                                <label className="label text-sm tablet-lg:text-xs">Tên hiển thị</label>
                                <input
                                    className={clsx(
                                        "input py-3 tablet-lg:py-2.5 text-sm",
                                        validationErrors.display_name && "input-error"
                                    )}
                                    value={formData.display_name}
                                    onChange={(e) => {
                                        setFormData((s) => ({ ...s, display_name: e.target.value }));
                                        setValidationErrors(prev => ({ ...prev, display_name: '' }));
                                    }}
                                    placeholder="vd: Thành Công"
                                    aria-invalid={!!validationErrors.display_name}
                                    aria-describedby={validationErrors.display_name ? 'display-name-error' : undefined}
                                />
                                {validationErrors.display_name && (
                                    <p id="display-name-error" className="field-error">
                                        <AlertCircle size={12} className="shrink-0" />
                                        {validationErrors.display_name}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="label text-sm tablet-lg:text-xs">{isEditing ? 'Đặt lại mật khẩu (tuỳ chọn)' : 'Mật khẩu'}</label>
                                <input
                                    type="password"
                                    className={clsx(
                                        "input py-3 tablet-lg:py-2.5 text-sm",
                                        validationErrors.password && "input-error"
                                    )}
                                    value={formData.password}
                                    onChange={(e) => {
                                        setFormData((s) => ({ ...s, password: e.target.value }));
                                        setValidationErrors(prev => ({ ...prev, password: '' }));
                                    }}
                                    placeholder={isEditing ? 'Để trống nếu không đổi' : 'Nhập mật khẩu'}
                                    aria-invalid={!!validationErrors.password}
                                    aria-describedby={validationErrors.password ? 'password-error' : undefined}
                                />
                                {validationErrors.password && (
                                    <p id="password-error" className="field-error">
                                        <AlertCircle size={12} className="shrink-0" />
                                        {validationErrors.password}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="label text-sm tablet-lg:text-xs">{isEditing ? 'Đặt lại mã PIN (tuỳ chọn)' : 'Mã PIN (để xóa/xác thực)'}</label>
                                <input
                                    type="password"
                                    className={clsx(
                                        "input py-3 tablet-lg:py-2.5 text-sm",
                                        validationErrors.pin && "input-error"
                                    )}
                                    value={formData.pin}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                                        setFormData((s) => ({ ...s, pin: value }));
                                        setValidationErrors(prev => ({ ...prev, pin: '' }));
                                    }}
                                    placeholder={isEditing ? 'Để trống nếu không đổi' : 'Nhập mã PIN'}
                                    maxLength={6}
                                    inputMode="numeric"
                                    aria-invalid={!!validationErrors.pin}
                                    aria-describedby={validationErrors.pin ? 'pin-error' : undefined}
                                />
                                {validationErrors.pin && (
                                    <p id="pin-error" className="field-error">
                                        <AlertCircle size={12} className="shrink-0" />
                                        {validationErrors.pin}
                                    </p>
                                )}
                            </div>

                            <div className="flex flex-row flex-wrap gap-3 tablet-lg:gap-2 pt-2">
                                <button type="submit" className="btn btn-primary btn-sm" disabled={createMutation.isPending || updateMutation.isPending}>
                                    {isEditing ? 'Lưu thay đổi' : 'Tạo user'}
                                </button>
                                <button type="button" className="btn btn-secondary btn-sm" onClick={handleClose}>
                                    Huỷ
                                </button>
                                {isEditing && (
                                    <button
                                        type="button"
                                        className="btn btn-ghost btn-sm text-red-600 hover:text-red-700"
                                        onClick={() => setIsDeleteModalOpen(true)}
                                    >
                                        <Trash2 size={14} className="tablet-lg:w-3.5 tablet-lg:h-3.5" />
                                        Xóa user
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
                title="Xác nhận xóa"
                message="Nhập mã PIN Admin để xóa user này."
            />
        </div>
    );
}
