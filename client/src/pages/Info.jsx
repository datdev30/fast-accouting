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
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
                <p className="text-slate-400 font-medium text-sm animate-pulse">Đang tải thông tin...</p>
            </div>
        </div>
    );

    if (isError) return (
        <div className="p-8 text-center">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <InfoIcon size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Không thể tải thông tin</h3>
            <p className="text-slate-500 mt-2">Vui lòng kiểm tra kết nối mạng và thử lại</p>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto space-y-4 md:space-y-6 xl:space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Section - Portrait: Stack layout, Landscape: All in 1 Row */}
            <div className="space-y-4 md:space-y-5 xl:space-y-0">
                {/* Portrait: Stack layout */}
                <div className="xl:hidden space-y-4 md:space-y-5">
                    {/* Row 1: Title & Subtitle */}
                    <div>
                        <h2 className="section-title text-2xl md:text-3xl">Tổng Quan Hệ Thống</h2>
                        <p className="section-subtitle text-sm md:text-base mt-1">Thông tin chi tiết về phiên bản và cập nhật</p>
                    </div>
                </div>

                {/* Landscape: All in 1 Row */}
                <div className="hidden xl:flex xl:items-center xl:justify-between xl:gap-6">
                    {/* Left: Title & Subtitle */}
                    <div>
                        <h2 className="section-title text-2xl 2xl:text-3xl">Tổng Quan Hệ Thống</h2>
                        <p className="section-subtitle text-sm 2xl:text-base mt-1">Thông tin chi tiết về phiên bản và cập nhật</p>
                    </div>

                    {/* Right: Edit Button (if admin) */}
                    {isAdmin && (
                        <div className="flex items-center gap-3">
                            {isEditing ? (
                                <>
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        className="btn-secondary btn-md justify-center text-base min-h-[44px] px-4 py-2.5 whitespace-nowrap shrink-0"
                                        disabled={updateMutation.isPending}
                                    >
                                        <X size={18} className="shrink-0" />
                                        <span>Huỷ bỏ</span>
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        className="btn-primary btn-md justify-center text-base min-h-[44px] px-6 py-2.5 whitespace-nowrap shrink-0"
                                        disabled={updateMutation.isPending}
                                    >
                                        {updateMutation.isPending ? (
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <Save size={18} className="shrink-0" />
                                        )}
                                        <span>Lưu thay đổi</span>
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="btn-secondary btn-md justify-center text-base min-h-[44px] px-5 py-2.5 whitespace-nowrap shrink-0"
                                >
                                    <Pencil size={18} className="shrink-0" />
                                    <span>Chỉnh sửa</span>
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* FAB Button - Only for Portrait (hidden on landscape, only show if admin and not editing) */}
            {isAdmin && !isEditing && (
                <button
                    onClick={() => setIsEditing(true)}
                    className="fixed bottom-6 left-1/2 -translate-x-1/2 xl:hidden z-50 w-16 h-16 md:w-20 md:h-20 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-2xl shadow-blue-500/50 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                    aria-label="Chỉnh sửa thông tin"
                >
                    <Pencil size={28} className="md:w-8 md:h-8" />
                </button>
            )}

            {/* Hero Section - Compact for Portrait, Full for Landscape */}
            <div className="relative rounded-2xl md:rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white shadow-xl md:shadow-2xl shadow-blue-900/20">
                {/* Background Decor - Reduced for Portrait */}
                <div className="absolute top-0 right-0 p-6 md:p-12 opacity-10">
                    <Activity size={200} className="md:w-[300px] md:h-[300px]" />
                </div>
                <div className="absolute -bottom-12 md:-bottom-24 -left-12 md:-left-24 w-32 h-32 md:w-64 md:h-64 bg-blue-400 rounded-full blur-[60px] md:blur-[100px] opacity-30"></div>
                <div className="absolute -top-12 md:-top-24 -right-12 md:-right-24 w-32 h-32 md:w-64 md:h-64 bg-purple-400 rounded-full blur-[60px] md:blur-[100px] opacity-30"></div>

                <div className="relative z-10 p-5 md:p-8 xl:p-12 flex flex-col md:flex-row gap-4 md:gap-6 xl:gap-8 items-start md:items-center">
                    <div className="w-16 h-16 md:w-20 md:h-20 xl:w-24 xl:h-24 rounded-2xl md:rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-xl md:shadow-2xl shrink-0">
                        <Globe size={32} className="md:w-10 md:h-10" />
                    </div>
                    <div className="flex-1 space-y-1 md:space-y-2 min-w-0">
                        {isEditing ? (
                            <div className="space-y-3 md:space-y-4 max-w-xl">
                                <div>
                                    <label className="text-xs font-bold text-blue-100 uppercase tracking-widest pl-1">Tên ứng dụng</label>
                                    <input
                                        className="w-full bg-white/10 border border-white/20 rounded-xl px-3 md:px-4 py-2 md:py-3 text-lg md:text-xl font-bold text-white placeholder-white/40 focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all font-mono"
                                        value={formData.name}
                                        onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-blue-100 uppercase tracking-widest pl-1">Mô tả ngắn</label>
                                    <textarea
                                        className="w-full bg-white/10 border border-white/20 rounded-xl px-3 md:px-4 py-2 md:py-3 text-sm md:text-base text-white placeholder-white/40 focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                                        rows={2}
                                        value={formData.description}
                                        onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                                    />
                                </div>
                            </div>
                        ) : (
                            <>
                                <h1 className="text-2xl md:text-3xl xl:text-4xl font-black tracking-tight leading-tight">
                                    {formData.name}
                                </h1>
                                <p className="text-base md:text-lg text-blue-100 font-medium max-w-2xl leading-relaxed opacity-90">
                                    {formData.description}
                                </p>
                            </>
                        )}
                    </div>

                    {/* Status Badge - Hidden on small screens, shown on md+ */}
                    <div className="hidden md:flex flex-col items-end gap-2 shrink-0">
                        <div className="px-3 md:px-4 py-1 md:py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 backdrop-blur-md text-emerald-100 text-[10px] md:text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                            <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
                            System Online
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid - 1 col mobile, 2 col tablet portrait, 3 col landscape */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5 xl:gap-6">
                <Card
                    icon={Zap}
                    label="Phiên bản hiện tại"
                    value={formData.version}
                    color="text-amber-500"
                    bg="bg-amber-50"
                    isEditing={isEditing}
                    onChange={val => setFormData(p => ({ ...p, version: val }))}
                />
                <Card
                    icon={User}
                    label="Người phát triển"
                    value={formData.author}
                    color="text-blue-500"
                    bg="bg-blue-50"
                    isEditing={isEditing}
                    onChange={val => setFormData(p => ({ ...p, author: val }))}
                />
                <Card
                    icon={Calendar}
                    label="Lần cập nhật cuối"
                    value={info?.updated_at}
                    color="text-purple-500"
                    bg="bg-purple-50"
                    readOnly
                />
            </div>

            {/* Content & Summary - Full width for Portrait, Grid for Landscape */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6 xl:gap-8">
                {/* Main Content Area */}
                <div className="xl:col-span-2">
                    <div className="bg-white rounded-xl md:rounded-[2rem] border border-slate-100 shadow-lg md:shadow-xl shadow-slate-200/50 p-4 md:p-6 xl:p-8 2xl:p-10 relative overflow-hidden">
                        <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6 xl:mb-8">
                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                                <FileText size={18} className="md:w-5 md:h-5" />
                            </div>
                            <div>
                                <h3 className="text-lg md:text-xl font-bold text-slate-900">Chi tiết cập nhật</h3>
                                <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">Change Log & Features</p>
                            </div>
                        </div>

                        {isEditing ? (
                            <div className="relative">
                                <textarea
                                    className="w-full h-[300px] md:h-[400px] bg-slate-50 border-2 border-slate-100 rounded-xl md:rounded-2xl p-4 md:p-6 font-mono text-xs md:text-sm leading-relaxed outline-none focus:border-blue-500 focus:ring-2 md:focus:ring-4 focus:ring-blue-500/10 transition-all resize-none"
                                    value={formData.summary}
                                    onChange={e => setFormData(p => ({ ...p, summary: e.target.value }))}
                                    placeholder="- Feature 1&#10;- Feature 2&#10;- Fix bug X"
                                />
                                <div className="absolute bottom-3 md:bottom-4 right-3 md:right-4 text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest bg-white px-2 md:px-3 py-1 rounded-lg border border-slate-100 shadow-sm">
                                    Markdown Supported
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4 md:space-y-6 relative">
                                {/* Vertical Alignment Line */}
                                <div className="absolute left-[15px] md:left-[19px] top-2 bottom-2 w-[2px] bg-slate-100 rounded-full"></div>

                                {formData.summary.split('\n').filter(Boolean).map((line, idx) => (
                                    <div key={idx} className="flex gap-4 md:gap-6 group relative">
                                        <div className="relative z-10 flex-none w-8 h-8 md:w-10 md:h-10 rounded-full bg-white border-[3px] md:border-4 border-slate-50 flex items-center justify-center group-hover:border-blue-50 transition-colors">
                                            <div className="w-2 md:w-2.5 h-2 md:h-2.5 rounded-full bg-slate-300 group-hover:bg-blue-500 group-hover:scale-125 transition-all duration-300"></div>
                                        </div>
                                        <div className="flex-1 py-1 md:py-1.5">
                                            <p className="text-sm md:text-base text-slate-600 leading-relaxed group-hover:text-slate-900 transition-colors font-medium">
                                                {line}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                {formData.summary.length === 0 && (
                                    <div className="text-center py-8 md:py-12 text-slate-400">
                                        Chưa có nội dung tóm tắt
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Info - Full width for Portrait, Sidebar for Landscape */}
                <div>
                    <div className="bg-slate-900 rounded-xl md:rounded-[2rem] p-5 md:p-6 xl:p-8 text-white relative overflow-hidden shadow-xl md:shadow-2xl">
                        <div className="absolute top-0 right-0 p-4 md:p-6 opacity-10">
                            <ShieldCheck size={120} className="md:w-[180px] md:h-[180px]" />
                        </div>

                        <div className="relative z-10">
                            <h4 className="font-bold text-base md:text-lg mb-4 md:mb-6 flex items-center gap-2">
                                <ShieldCheck size={18} className="md:w-5 md:h-5 text-emerald-400" />
                                Bảo mật & Thông tin
                            </h4>

                            <div className="space-y-4 md:space-y-6">
                                <div className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                                    <div className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Quyền hạn</div>
                                    <div className="text-sm md:text-base font-semibold text-white">{user?.role || 'Guest'}</div>
                                </div>
                                <div className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                                    <div className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Người dùng hiện tại</div>
                                    <div className="text-sm md:text-base font-semibold text-slate-200 break-words">{user?.displayName || user?.username || 'Unknown'}</div>
                                </div>
                                <div className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                                    <div className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Môi trường</div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-blue-400"></div>
                                        <span className="text-sm md:text-base font-medium text-slate-200">Production Build</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Helper Card Component
const Card = ({ icon: Icon, label, value, color, bg, isEditing, onChange, readOnly }) => (
    <div className="bg-white rounded-xl md:rounded-[2rem] border border-slate-100 p-4 md:p-5 xl:p-6 shadow-sm hover:shadow-lg md:hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 group">
        <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4">
            <div className={clsx("w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shrink-0", bg, color)}>
                <Icon size={20} className="md:w-6 md:h-6" />
            </div>
            {readOnly && (
                <div className="ml-auto px-2 md:px-3 py-0.5 md:py-1 rounded-full bg-slate-50 border border-slate-100 text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    ReadOnly
                </div>
            )}
        </div>
        <div>
            <div className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</div>
            {isEditing && !readOnly ? (
                <input
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 md:px-3 py-1.5 md:py-2 text-base md:text-lg font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                />
            ) : (
                <div className="text-lg md:text-xl font-bold text-slate-800 break-words">{value}</div>
            )}
        </div>
    </div>
);
