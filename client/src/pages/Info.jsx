import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clsx } from 'clsx';
import {
    Info as InfoIcon,
    Save,
    X,
    Pencil,
    Calendar,
    User,
    ShieldCheck,
    Tag,
} from 'lucide-react';
import { getAppInfo, updateAppInfo } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatDate } from '../utils/dateUtils';
import { getApiErrorMessage } from '../utils/errorMessage';
import AppBrandLogo from '../components/AppBrandLogo';

export default function Info() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'ADMIN';
    const { showToast } = useToast();
    const queryClient = useQueryClient();

    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        version: '',
        author: '',
        summary: '',
    });

    const { data: info, isLoading, isError } = useQuery({
        queryKey: ['app-info'],
        queryFn: getAppInfo,
    });

    useEffect(() => {
        if (info) {
            setFormData({
                name: info.name || '',
                description: info.description || '',
                version: info.version || '',
                author: info.author || '',
                summary: Array.isArray(info.summary) ? info.summary.join('\n') : info.summary || '',
            });
        }
    }, [info]);

    const updateMutation = useMutation({
        mutationFn: updateAppInfo,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['app-info'] });
            setIsEditing(false);
            showToast('Thành công', 'Đã cập nhật thông tin hệ thống', 'success');
        },
        onError: (err) => {
            showToast('Lỗi', getApiErrorMessage(err, 'Cập nhật thông tin hệ thống'), 'error');
        },
    });

    const handleSave = () => {
        updateMutation.mutate({
            ...formData,
            summary: formData.summary.split('\n').filter((line) => line.trim() !== ''),
        });
    };

    const lastUpdatedDisplay = (() => {
        const raw = info?.updated_at;
        if (!raw) return '—';
        const formatted = formatDate(raw);
        return formatted || String(raw);
    })();

    if (isLoading) {
        return (
            <div className="flex min-h-[240px] items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
                    <p className="text-xs font-medium text-slate-500">Đang tải…</p>
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="mx-auto max-w-md rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-500">
                    <InfoIcon size={20} />
                </div>
                <h3 className="text-sm font-bold text-slate-800">Không tải được thông tin</h3>
                <p className="mt-1.5 text-xs text-slate-500">Kiểm tra mạng hoặc đăng nhập lại.</p>
            </div>
        );
    }

    const summaryLines = formData.summary
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);

    return (
        <div className="info-page mx-auto max-w-3xl space-y-5 pb-10 animate-in fade-in duration-300">
            {/* Tiêu đề + thao tác */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 gap-3 sm:gap-4">
                    <div
                        className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white p-1.5 shadow-md sm:flex"
                        aria-hidden
                    >
                        <AppBrandLogo variant="full" className="h-full w-full object-contain" alt="" fallbackClassName="h-full w-full text-sm" />
                    </div>
                    <div className="min-w-0">
                        <p className="info-page__kicker">Tổng quan</p>
                        <h2 className="section-title text-lg lg:text-xl">Thông tin hệ thống</h2>
                        <p className="section-subtitle mt-1">Dữ liệu đồng bộ từ máy chủ — tên, mô tả và nhật ký phiên bản.</p>
                    </div>
                </div>
                {isAdmin && (
                    <div className="flex shrink-0 gap-2">
                        {isEditing ? (
                            <>
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(false)}
                                    className="btn-secondary btn-md"
                                    disabled={updateMutation.isPending}
                                >
                                    <X size={16} className="shrink-0" />
                                    Huỷ
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSave}
                                    className="btn-primary btn-md"
                                    disabled={updateMutation.isPending}
                                >
                                    {updateMutation.isPending ? (
                                        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                    ) : (
                                        <Save size={16} className="shrink-0" />
                                    )}
                                    Lưu
                                </button>
                            </>
                        ) : (
                            <button type="button" onClick={() => setIsEditing(true)} className="btn-secondary btn-md">
                                <Pencil size={16} className="shrink-0" />
                                Chỉnh sửa
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Khối chính: app + meta */}
            <div className="info-page__hero">
                <div className="info-page__hero-accent" aria-hidden />
                <div className="info-page__hero-blob" aria-hidden />
                <div className="info-page__hero-blob-2" aria-hidden />
                <div className="info-page__hero-inner px-4 py-5 sm:px-6 sm:py-6">
                    {isEditing ? (
                        <div className="space-y-3">
                            <div>
                                <label className="field-label text-[11px] uppercase tracking-wide text-slate-500">
                                    Tên ứng dụng
                                </label>
                                <input
                                    className="input mt-1"
                                    value={formData.name}
                                    onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="field-label text-[11px] uppercase tracking-wide text-slate-500">
                                    Mô tả ngắn
                                </label>
                                <textarea
                                    className="textarea mt-1 min-h-[4rem]"
                                    rows={2}
                                    value={formData.description}
                                    onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                            <div className="min-w-0">
                                <h1 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
                                    {formData.name || 'Ứng dụng'}
                                </h1>
                                <p className="mt-1 text-sm leading-relaxed text-slate-600">
                                    {formData.description || 'Chưa có mô tả.'}
                                </p>
                            </div>
                            <span className="info-page__status-pill">
                                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                                Hoạt động
                            </span>
                        </div>
                    )}
                </div>

                <div className="info-page__meta-grid">
                    <MetaRow
                        className="info-page__meta-cell"
                        icon={Tag}
                        label="Phiên bản"
                        isEditing={isEditing}
                        value={formData.version}
                        onChange={(v) => setFormData((p) => ({ ...p, version: v }))}
                        readOnly={false}
                        mono
                    />
                    <MetaRow
                        className="info-page__meta-cell"
                        icon={User}
                        label="Phát triển"
                        isEditing={isEditing}
                        value={formData.author}
                        onChange={(v) => setFormData((p) => ({ ...p, author: v }))}
                    />
                    <MetaRow
                        className="info-page__meta-cell"
                        icon={Calendar}
                        label="Cập nhật"
                        readOnly
                        value={lastUpdatedDisplay}
                        isEditing={false}
                    />
                </div>
            </div>

            {/* Nhật ký */}
            <div className="info-page__changelog-card">
                <h3 className="info-page__changelog-heading">Nhật ký phiên bản</h3>
                {isEditing ? (
                    <textarea
                        className="textarea mt-3 min-h-[200px] font-mono text-xs leading-relaxed"
                        value={formData.summary}
                        onChange={(e) => setFormData((p) => ({ ...p, summary: e.target.value }))}
                        placeholder="Mỗi dòng một mục…"
                    />
                ) : summaryLines.length > 0 ? (
                    <ul className="info-page__changelog-list mt-3">
                        {summaryLines.map((line, idx) => (
                            <li key={idx}>{line}</li>
                        ))}
                    </ul>
                ) : (
                    <p className="mt-3 py-8 text-center text-xs text-slate-400">Chưa có mục.</p>
                )}
            </div>

            {/* Phiên đăng nhập */}
            <div className="info-page__session">
                <h3 className="info-page__session-heading">
                    <ShieldCheck size={14} className="text-emerald-600" aria-hidden />
                    Phiên đăng nhập
                </h3>
                <dl className="relative z-[1] mt-3 grid gap-3 text-sm sm:grid-cols-3 sm:gap-4">
                    <div>
                        <dt className="text-[11px] font-medium text-slate-400">Vai trò</dt>
                        <dd className="mt-0.5 font-semibold text-slate-800">{user?.role || '—'}</dd>
                    </div>
                    <div className="sm:col-span-2">
                        <dt className="text-[11px] font-medium text-slate-400">Tài khoản</dt>
                        <dd className="mt-0.5 break-words font-medium text-slate-700">
                            {user?.displayName || user?.username || '—'}
                        </dd>
                    </div>
                </dl>
            </div>
        </div>
    );
}

function MetaRow({ icon: Icon, label, value, isEditing, onChange, readOnly = false, mono, className }) {
    const edit = isEditing && !readOnly;
    return (
        <div className={clsx('px-4 py-3.5 sm:px-5', className)}>
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                    <Icon size={12} strokeWidth={2} aria-hidden />
                </span>
                {label}
            </p>
            <div className="mt-1.5">
                {edit ? (
                    <input
                        className="input py-2 text-sm"
                        value={value ?? ''}
                        onChange={(e) => onChange?.(e.target.value)}
                    />
                ) : (
                    <p
                        className={`break-words text-sm font-semibold text-slate-900 ${mono ? 'font-mono tabular-nums' : ''}`}
                    >
                        {value || '—'}
                    </p>
                )}
            </div>
        </div>
    );
}
