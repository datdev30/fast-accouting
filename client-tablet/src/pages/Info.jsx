import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Info as InfoIcon, Save, X, Pencil, Globe, Calendar, User, FileText, Activity, ShieldCheck, Zap } from 'lucide-react';
import { getAppInfo, updateAppInfo } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { clsx } from 'clsx';

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
        summary: ''
    });

    const { data: info, isLoading, isError } = useQuery({
        queryKey: ['app-info'],
        queryFn: getAppInfo
    });

    useEffect(() => {
        if (info) {
            setFormData({
                name: info.name || '',
                description: info.description || '',
                version: info.version || '',
                author: info.author || '',
                summary: Array.isArray(info.summary) ? info.summary.join('\n') : (info.summary || '')
            });
        }
    }, [info]);

    const updateMutation = useMutation({
        mutationFn: updateAppInfo,
        onSuccess: () => {
            queryClient.invalidateQueries(['app-info']);
            setIsEditing(false);
            showToast('Thành công', 'Đã cập nhật thông tin hệ thống', 'success');
        },
        onError: (err) => {
            showToast('Lỗi', err.response?.data?.error || 'Không thể cập nhật thông tin', 'error');
        }
    });

    const handleSave = () => {
        updateMutation.mutate({
            ...formData,
            summary: formData.summary.split('\n').filter(line => line.trim() !== '')
        });
    };

    if (isLoading) return (
        <div className="flex items-center justify-center min-h-[280px] tablet-lg:min-h-[320px]">
            <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
                <p className="text-slate-500 text-sm">Đang tải thông tin...</p>
            </div>
        </div>
    );

    if (isError) return (
        <div className="p-6 tablet-lg:p-8 text-center">
            <div className="w-14 h-14 bg-red-50 text-red-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                <InfoIcon size={28} />
            </div>
            <h3 className="text-base font-bold text-slate-800">Không thể tải thông tin</h3>
            <p className="text-slate-500 text-sm mt-1">Vui lòng kiểm tra kết nối và thử lại</p>
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto space-y-4 tablet-lg:space-y-6 pb-8 tablet-lg:pb-10 animate-in fade-in duration-300">
            {/* Header: title + actions */}
            <div className="flex flex-col gap-3 tablet-lg:flex-row tablet-lg:items-center tablet-lg:justify-between">
                <div>
                    <h2 className="section-title text-2xl tablet-lg:text-2xl">Tổng quan hệ thống</h2>
                    <p className="section-subtitle text-sm mt-0.5">Phiên bản và cập nhật</p>
                </div>
                {isAdmin && (
                    <div className="flex items-center gap-2 shrink-0">
                        {isEditing ? (
                            <>
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="btn-secondary btn-sm"
                                    disabled={updateMutation.isPending}
                                >
                                    <X size={16} />
                                    <span>Huỷ</span>
                                </button>
                                <button onClick={handleSave} className="btn-primary btn-sm" disabled={updateMutation.isPending}>
                                    {updateMutation.isPending ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <Save size={16} />
                                    )}
                                    <span>Lưu</span>
                                </button>
                            </>
                        ) : (
                            <button onClick={() => setIsEditing(true)} className="btn-secondary btn-sm">
                                <Pencil size={16} />
                                <span>Chỉnh sửa</span>
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Hero: compact, ổn định portrait/landscape */}
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-teal-600 via-teal-700 to-slate-800 text-white shadow-lg">
                <div className="absolute top-0 right-0 p-4 tablet-lg:p-6 opacity-[0.07]">
                    <Activity size={160} className="tablet-lg:w-[200px] tablet-lg:h-[200px]" />
                </div>
                <div className="relative z-10 p-5 tablet-lg:p-6 flex flex-col tablet-lg:flex-row tablet-lg:items-center gap-4 tablet-lg:gap-6">
                    <div className="w-14 h-14 tablet-lg:w-16 tablet-lg:h-16 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                        <Globe size={28} className="tablet-lg:w-8 tablet-lg:h-8" />
                    </div>
                    <div className="flex-1 min-w-0">
                        {isEditing ? (
                            <div className="space-y-3 max-w-md">
                                <div>
                                    <label className="text-[10px] font-bold text-teal-200/90 uppercase tracking-wider">Tên ứng dụng</label>
                                    <input
                                        className="w-full mt-0.5 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-base tablet-lg:text-lg font-bold text-white placeholder-white/40 focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/40"
                                        value={formData.name}
                                        onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-teal-200/90 uppercase tracking-wider">Mô tả</label>
                                    <textarea
                                        className="w-full mt-0.5 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-white/40 focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/40 resize-none"
                                        rows={2}
                                        value={formData.description}
                                        onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                                    />
                                </div>
                            </div>
                        ) : (
                            <>
                                <h1 className="text-xl tablet-lg:text-2xl font-bold tracking-tight truncate">{formData.name}</h1>
                                <p className="text-sm tablet-lg:text-base text-teal-100/90 mt-0.5 line-clamp-2">{formData.description}</p>
                            </>
                        )}
                    </div>
                    <div className="flex tablet-lg:flex-col items-center tablet-lg:items-end gap-2 shrink-0">
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/25 border border-emerald-400/30 text-emerald-100 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Online
                        </span>
                    </div>
                </div>
            </div>

            {/* Stats: 1 col portrait, 2 tablet, 3 landscape */}
            <div className="grid grid-cols-1 tablet:grid-cols-2 tablet-lg:grid-cols-3 gap-3 tablet-lg:gap-4">
                <InfoCard
                    icon={Zap}
                    label="Phiên bản"
                    value={formData.version}
                    color="text-amber-500"
                    bg="bg-amber-50"
                    isEditing={isEditing}
                    onChange={v => setFormData(p => ({ ...p, version: v }))}
                />
                <InfoCard
                    icon={User}
                    label="Người phát triển"
                    value={formData.author}
                    color="text-blue-500"
                    bg="bg-blue-50"
                    isEditing={isEditing}
                    onChange={v => setFormData(p => ({ ...p, author: v }))}
                />
                <InfoCard
                    icon={Calendar}
                    label="Cập nhật cuối"
                    value={info?.updated_at}
                    color="text-purple-500"
                    bg="bg-purple-50"
                    readOnly
                />
            </div>

            {/* Nội dung + Sidebar: stack portrait, cạnh nhau landscape */}
            <div className="grid grid-cols-1 tablet-lg:grid-cols-3 gap-4 tablet-lg:gap-6">
                {/* Chi tiết cập nhật */}
                <div className="tablet-lg:col-span-2">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 tablet-lg:p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-9 h-9 rounded-lg bg-slate-800 text-white flex items-center justify-center shrink-0">
                                <FileText size={18} />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-800">Chi tiết cập nhật</h3>
                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Change log</p>
                            </div>
                        </div>

                        {isEditing ? (
                            <div className="relative">
                                <textarea
                                    className="w-full h-[220px] tablet-lg:h-[260px] bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm leading-relaxed outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 resize-none"
                                    value={formData.summary}
                                    onChange={e => setFormData(p => ({ ...p, summary: e.target.value }))}
                                    placeholder="- Mục 1&#10;- Mục 2"
                                />
                                <span className="absolute bottom-3 right-3 text-[10px] font-semibold text-slate-400 uppercase">Mỗi dòng 1 mục</span>
                            </div>
                        ) : (
                            <div className="space-y-3 relative">
                                <div className="absolute left-[15px] top-1 bottom-1 w-px bg-slate-100" />
                                {formData.summary.split('\n').filter(Boolean).map((line, i) => (
                                    <div key={i} className="flex gap-3">
                                        <div className="relative z-10 w-8 h-8 rounded-full bg-white border-2 border-slate-100 flex items-center justify-center shrink-0">
                                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                        </div>
                                        <p className="text-sm text-slate-600 leading-snug pt-1">{line}</p>
                                    </div>
                                ))}
                                {!formData.summary.trim() && (
                                    <p className="text-center py-8 text-slate-400 text-sm">Chưa có nội dung</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar: Bảo mật & phiên */}
                <div>
                    <div className="bg-slate-800 rounded-xl p-4 tablet-lg:p-5 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-2 opacity-[0.06]">
                            <ShieldCheck size={100} />
                        </div>
                        <div className="relative z-10">
                            <h4 className="font-bold text-sm flex items-center gap-2 mb-4">
                                <ShieldCheck size={16} className="text-emerald-400" />
                                Phiên đăng nhập
                            </h4>
                            <div className="space-y-3">
                                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Quyền</p>
                                    <p className="text-sm font-semibold">{user?.role || 'Guest'}</p>
                                </div>
                                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Người dùng</p>
                                    <p className="text-sm font-medium text-slate-200 break-words">{user?.displayName || user?.username || '—'}</p>
                                </div>
                                <div className="p-3 rounded-lg bg-white/5 border border-white/10 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                    <span className="text-sm text-slate-300">Production</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

const InfoCard = ({ icon: Icon, label, value, color, bg, isEditing, onChange, readOnly }) => (
    <div className="bg-white rounded-xl border border-slate-200 p-4 tablet-lg:p-5 shadow-sm">
        <div className="flex items-start justify-between gap-2 mb-2">
            <div className={clsx('w-10 h-10 rounded-lg flex items-center justify-center shrink-0', bg, color)}>
                <Icon size={20} />
            </div>
            {readOnly && (
                <span className="px-2 py-0.5 rounded bg-slate-50 text-[9px] font-bold text-slate-400 uppercase">Chỉ đọc</span>
            )}
        </div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
        {isEditing && !readOnly ? (
            <input
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
                value={value}
                onChange={e => onChange(e.target.value)}
            />
        ) : (
            <p className="text-base font-bold text-slate-800 break-words">{value || '—'}</p>
        )}
    </div>
);
