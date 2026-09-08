import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Bell,
    Plus,
    Edit2,
    Trash2,
    Info,
    AlertTriangle,
    Siren,
    Eye,
    ToggleLeft,
    ToggleRight,
    CalendarClock,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getApiErrorMessage } from '../utils/errorMessage';
import { toDisplayDate } from '../utils/dateUtils';
import {
    getSystemNotifications,
    createSystemNotification,
    updateSystemNotification,
    deleteSystemNotificationSecure,
} from '../services/api';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import AppModal from '../components/AppModal';
import DatePicker from '../components/DatePicker';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { ErrorStates } from '../components/ErrorState';
import EmptyState from '../components/EmptyState';

const LEVELS = [
    { id: 'info', label: 'Thông tin', icon: Info, tone: 'text-blue-700 bg-blue-50 border-blue-200' },
    { id: 'warning', label: 'Cảnh báo', icon: AlertTriangle, tone: 'text-amber-700 bg-amber-50 border-amber-200' },
    { id: 'critical', label: 'Khẩn', icon: Siren, tone: 'text-red-700 bg-red-50 border-red-200' },
];

const EMPTY_FORM = {
    title: '',
    message: '',
    level: 'info',
    is_active: true,
    dismissible: true,
    starts_at: '',
    ends_at: '',
};

/** Lấy YYYY-MM-DD từ ISO/Date mà không lệch ngày theo timezone. */
function toDateInput(value) {
    if (!value) return '';
    if (typeof value === 'string') {
        const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
        if (match) return match[1];
    }
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

/** Gửi ngày lịch (không phụ thuộc giờ máy) — bắt đầu 00:00 UTC, kết thúc 23:59 UTC. */
function fromDateInput(value, bound = 'start') {
    if (!value) return null;
    const day = String(value).slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
    return bound === 'end' ? `${day}T23:59:59.999Z` : `${day}T00:00:00.000Z`;
}

function LevelBadge({ level }) {
    const meta = LEVELS.find((l) => l.id === level) || LEVELS[0];
    const Icon = meta.icon;
    return (
        <span className={clsx('inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-bold', meta.tone)}>
            <Icon size={12} />
            {meta.label}
        </span>
    );
}

export default function SystemNotificationConfig() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'ADMIN';
    const { showToast } = useToast();
    const queryClient = useQueryClient();

    const [isOpen, setIsOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    const { data: items = [], isLoading, error, refetch } = useQuery({
        queryKey: ['system-notifications'],
        queryFn: getSystemNotifications,
        enabled: isAdmin,
        retry: 1,
    });

    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: ['system-notifications'] });
        queryClient.invalidateQueries({ queryKey: ['system-notifications-active'] });
    };

    const handleClose = () => {
        setIsOpen(false);
        setIsEditing(false);
        setEditingId(null);
        setFormData(EMPTY_FORM);
    };

    const createMutation = useMutation({
        mutationFn: createSystemNotification,
        onSuccess: () => {
            invalidate();
            handleClose();
            showToast('Thành công', 'Đã tạo thông báo hệ thống', 'success');
        },
        onError: (err) => showToast('Lỗi', getApiErrorMessage(err, 'Tạo thông báo'), 'error'),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => updateSystemNotification(id, data),
        onSuccess: () => {
            invalidate();
            handleClose();
            showToast('Thành công', 'Đã cập nhật thông báo', 'success');
        },
        onError: (err) => showToast('Lỗi', getApiErrorMessage(err, 'Cập nhật thông báo'), 'error'),
    });

    const deleteMutation = useMutation({
        mutationFn: ({ id, pin }) => deleteSystemNotificationSecure(id, pin),
        onSuccess: () => {
            invalidate();
            setIsDeleteOpen(false);
            setDeletingId(null);
            showToast('Thành công', 'Đã xóa thông báo', 'success');
        },
        onError: (err) => showToast('Lỗi', getApiErrorMessage(err, 'Xóa thông báo'), 'error'),
    });

    const toggleActiveMutation = useMutation({
        mutationFn: ({ id, is_active }) => updateSystemNotification(id, { is_active }),
        onSuccess: () => {
            invalidate();
            showToast('Thành công', 'Đã cập nhật trạng thái thông báo', 'success');
        },
        onError: (err) => showToast('Lỗi', getApiErrorMessage(err, 'Cập nhật trạng thái'), 'error'),
    });

    const openCreate = () => {
        setIsEditing(false);
        setEditingId(null);
        setFormData(EMPTY_FORM);
        setIsOpen(true);
    };

    const openEdit = (item) => {
        setIsEditing(true);
        setEditingId(item._id);
        setFormData({
            title: item.title || '',
            message: item.message || '',
            level: item.level || 'info',
            is_active: item.is_active !== false,
            dismissible: item.dismissible !== false,
            starts_at: toDateInput(item.starts_at),
            ends_at: toDateInput(item.ends_at),
        });
        setIsOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!isAdmin) return;

        const payload = {
            title: formData.title.trim(),
            message: formData.message.trim(),
            level: formData.level,
            is_active: formData.is_active,
            dismissible: formData.dismissible,
            starts_at: fromDateInput(formData.starts_at, 'start'),
            ends_at: fromDateInput(formData.ends_at, 'end'),
        };

        if (!payload.title || !payload.message) {
            showToast('Lỗi', 'Vui lòng nhập tiêu đề và nội dung', 'warning');
            return;
        }

        if (payload.starts_at && payload.ends_at && payload.ends_at < payload.starts_at) {
            showToast('Lỗi', 'Ngày kết thúc không được trước ngày bắt đầu', 'warning');
            return;
        }

        if (isEditing && editingId) {
            updateMutation.mutate({ id: editingId, data: payload });
        } else {
            createMutation.mutate(payload);
        }
    };

    if (!isAdmin) {
        return (
            <div className="mx-auto max-w-3xl">
                <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-lg shadow-slate-200/40">
                    <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                            <Eye size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">Không có quyền truy cập</h2>
                            <p className="mt-1 text-slate-500">Chỉ ADMIN mới được cấu hình thông báo hệ thống.</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4">
                <ErrorStates.Network error={error} onRetry={refetch} showDetails />
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="h-16 skeleton" />
                <LoadingSkeleton.Card count={3} />
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-6xl space-y-4 lg:space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="section-title">Cấu hình thông báo hệ thống</h2>
                    <p className="section-subtitle mt-1">
                        Thẻ thông báo nổi trên đầu trang cho mọi người — kể cả chưa đăng nhập. Tự ẩn sau 30 giây.
                    </p>
                </div>
                <button type="button" onClick={openCreate} className="btn-primary btn-md shrink-0 whitespace-nowrap">
                    <Plus size={18} />
                    Thêm thông báo
                </button>
            </div>

            {items.length === 0 ? (
                <EmptyState
                    title="Chưa có thông báo"
                    description="Tạo thông báo để hiện thẻ nổi trên cùng website."
                    actionLabel="Thêm thông báo"
                    action={openCreate}
                />
            ) : (
                <ul className="space-y-3">
                    {items.map((item) => (
                        <li
                            key={item._id}
                            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                        >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0 flex-1 space-y-1.5">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <LevelBadge level={item.level} />
                                        <span
                                            className={clsx(
                                                'rounded-md px-2 py-0.5 text-[11px] font-bold',
                                                item.is_active
                                                    ? 'bg-emerald-50 text-emerald-700'
                                                    : 'bg-slate-100 text-slate-500'
                                            )}
                                        >
                                            {item.is_active ? 'Đang bật' : 'Đã tắt'}
                                        </span>
                                    </div>
                                    <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                                    <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">{item.message}</p>
                                    {(item.starts_at || item.ends_at) && (
                                        <p className="flex items-center gap-1.5 text-xs text-slate-400">
                                            <CalendarClock size={12} />
                                            {item.starts_at
                                                ? toDisplayDate(toDateInput(item.starts_at))
                                                : '…'}
                                            {' → '}
                                            {item.ends_at
                                                ? toDisplayDate(toDateInput(item.ends_at))
                                                : 'không giới hạn'}
                                        </p>
                                    )}
                                </div>

                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        title={item.is_active ? 'Tắt' : 'Bật'}
                                        onClick={() =>
                                            toggleActiveMutation.mutate({
                                                id: item._id,
                                                is_active: !item.is_active,
                                            })
                                        }
                                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-50 hover:text-blue-600"
                                    >
                                        {item.is_active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                                    </button>
                                    <button
                                        type="button"
                                        title="Sửa"
                                        onClick={() => openEdit(item)}
                                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-50 hover:text-blue-600"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        type="button"
                                        title="Xóa"
                                        onClick={() => {
                                            setDeletingId(item._id);
                                            setIsDeleteOpen(true);
                                        }}
                                        className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            <AppModal
                isOpen={isOpen}
                onClose={handleClose}
                size="lg"
                title={isEditing ? 'Sửa thông báo' : 'Thêm thông báo'}
                icon={(
                    <div className={clsx(
                        'rounded-xl p-2',
                        isEditing ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
                    )}>
                        {isEditing ? <Edit2 size={20} /> : <Bell size={20} />}
                    </div>
                )}
                footer={(
                    <div className="flex w-full flex-col gap-2 sm:flex-row-reverse">
                        <button
                            type="submit"
                            form="system-notification-form"
                            disabled={createMutation.isPending || updateMutation.isPending}
                            className="btn-primary btn-md flex-1"
                        >
                            {createMutation.isPending || updateMutation.isPending
                                ? 'Đang lưu…'
                                : isEditing ? 'Lưu thay đổi' : 'Tạo thông báo'}
                        </button>
                        <button type="button" onClick={handleClose} className="btn-secondary btn-md flex-1">
                            Hủy
                        </button>
                    </div>
                )}
            >
                <p className="mb-3 text-xs text-slate-400">Hiện trên đầu trang website</p>
                <form id="system-notification-form" onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                        {LEVELS.map(({ id, label, icon: Icon, tone }) => {
                            const selected = formData.level === id;
                            return (
                                <button
                                    key={id}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, level: id })}
                                    className={clsx(
                                        'flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-semibold',
                                        selected ? tone : 'border-slate-200 bg-slate-50 text-slate-500'
                                    )}
                                >
                                    <Icon size={14} />
                                    {label}
                                </button>
                            );
                        })}
                    </div>

                    <div className="space-y-1.5">
                        <label className="ml-1 block text-xs font-bold uppercase tracking-wider text-slate-600">
                            Tiêu đề
                        </label>
                        <input
                            type="text"
                            maxLength={120}
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                            placeholder="Ví dụ: Bảo trì hệ thống tối nay"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="ml-1 block text-xs font-bold uppercase tracking-wider text-slate-600">
                            Nội dung
                        </label>
                        <textarea
                            rows={4}
                            maxLength={2000}
                            required
                            value={formData.message}
                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                            className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                            placeholder="Nội dung chạy trên banner…"
                        />
                        <p className="text-right text-xs text-slate-400">{formData.message.length}/2000</p>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <label className="ml-1 block text-xs font-bold uppercase tracking-wider text-slate-600">
                                Bắt đầu
                            </label>
                            <DatePicker
                                value={formData.starts_at}
                                onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                                placeholder="Không giới hạn"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="ml-1 block text-xs font-bold uppercase tracking-wider text-slate-600">
                                Kết thúc
                            </label>
                            <DatePicker
                                value={formData.ends_at}
                                onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })}
                                placeholder="Không giới hạn"
                            />
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-4">
                        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                            <input
                                type="checkbox"
                                checked={formData.is_active}
                                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            Đang bật
                        </label>
                        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                            <input
                                type="checkbox"
                                checked={formData.dismissible}
                                onChange={(e) => setFormData({ ...formData, dismissible: e.target.checked })}
                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            Cho phép đóng sớm
                        </label>
                    </div>
                </form>
            </AppModal>

            <DeleteConfirmationModal
                isOpen={isDeleteOpen}
                onClose={() => {
                    setIsDeleteOpen(false);
                    setDeletingId(null);
                }}
                onConfirm={(pin) => deletingId && deleteMutation.mutate({ id: deletingId, pin })}
                title="Xóa thông báo hệ thống"
                warningMessage="Thông báo sẽ bị xóa vĩnh viễn và không còn hiện trên banner."
                isDeleting={deleteMutation.isPending}
            />
        </div>
    );
}
