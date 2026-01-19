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
        <div className="max-w-6xl mx-auto space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Section */}
            <div className="space-y-0">
                <div className="flex items-center justify-between gap-6">
                    {/* Left: Title & Subtitle */}
                    <div>
                        <h2 className="section-title text-3xl">Tổng Quan Hệ Thống</h2>
                        <p className="section-subtitle text-base mt-1">Thông tin chi tiết về phiên bản và cập nhật</p>
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


            {/* Hero Section */}
            <div className="relative rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white shadow-2xl shadow-blue-900/20">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 p-12 opacity-10">
                    <Activity size={300} />
                </div>
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-400 rounded-full blur-[100px] opacity-30"></div>
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-400 rounded-full blur-[100px] opacity-30"></div>

                <div className="relative z-10 p-12 flex flex-row gap-8 items-center">
                    <div className="w-24 h-24 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-2xl shrink-0">
                        <Globe size={40} />
                    </div>
                    <div className="flex-1 space-y-2 min-w-0">
                        {isEditing ? (
                            <div className="space-y-4 max-w-xl">
                                <div>
                                    <label className="text-xs font-bold text-blue-100 uppercase tracking-widest pl-1">Tên ứng dụng</label>
                                    <input
                                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-xl font-bold text-white placeholder-white/40 focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all font-mono"
                                        value={formData.name}
                                        onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-blue-100 uppercase tracking-widest pl-1">Mô tả ngắn</label>
                                    <textarea
                                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-base text-white placeholder-white/40 focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                                        rows={2}
                                        value={formData.description}
                                        onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                                    />
                                </div>
                            </div>
                        ) : (
                            <>
                                <h1 className="text-4xl font-black tracking-tight leading-tight">
                                    {formData.name}
                                </h1>
                                <p className="text-lg text-blue-100 font-medium max-w-2xl leading-relaxed opacity-90">
                                    {formData.description}
                                </p>
                            </>
                        )}
                    </div>

                    {/* Status Badge */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                        <div className="px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 backdrop-blur-md text-emerald-100 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
                            System Online
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-6">
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

            {/* Content & Summary */}
            <div className="grid grid-cols-3 gap-8">
                {/* Main Content Area */}
                <div className="col-span-2">
                    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 p-10 relative overflow-hidden">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                                <FileText size={20} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">Chi tiết cập nhật</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Change Log & Features</p>
                            </div>
                        </div>

                        {isEditing ? (
                            <div className="relative">
                            <textarea
                                    className="w-full h-[400px] bg-slate-50 border-2 border-slate-100 rounded-2xl p-6 font-mono text-sm leading-relaxed outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all resize-none"
                                    value={formData.summary}
                                    onChange={e => setFormData(p => ({ ...p, summary: e.target.value }))}
                                    placeholder="- Feature 1&#10;- Feature 2&#10;- Fix bug X"
                                />
                                <div className="absolute bottom-4 right-4 text-xs font-bold text-slate-400 uppercase tracking-widest bg-white px-3 py-1 rounded-lg border border-slate-100 shadow-sm">
                                    Markdown Supported
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6 relative">
                                {/* Vertical Alignment Line */}
                                <div className="absolute left-[19px] top-2 bottom-2 w-[2px] bg-slate-100 rounded-full"></div>

                                {formData.summary.split('\n').filter(Boolean).map((line, idx) => (
                                    <div key={idx} className="flex gap-6 group relative">
                                        <div className="relative z-10 flex-none w-10 h-10 rounded-full bg-white border-4 border-slate-50 flex items-center justify-center group-hover:border-blue-50 transition-colors">
                                            <div className="w-2.5 h-2.5 rounded-full bg-slate-300 group-hover:bg-blue-500 group-hover:scale-125 transition-all duration-300"></div>
                                        </div>
                                        <div className="flex-1 py-1.5">
                                            <p className="text-base text-slate-600 leading-relaxed group-hover:text-slate-900 transition-colors font-medium">
                                                {line}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                {formData.summary.length === 0 && (
                                    <div className="text-center py-12 text-slate-400">
                                        Chưa có nội dung tóm tắt
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Info */}
                <div>
                    <div className="bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 p-6 opacity-10">
                            <ShieldCheck size={180} />
                        </div>

                        <div className="relative z-10">
                            <h4 className="font-bold text-lg mb-6 flex items-center gap-2">
                                <ShieldCheck size={20} className="text-emerald-400" />
                                Bảo mật & Thông tin
                            </h4>

                            <div className="space-y-6">
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Quyền hạn</div>
                                    <div className="text-base font-semibold text-white">{user?.role || 'Guest'}</div>
                                </div>
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Người dùng hiện tại</div>
                                    <div className="text-base font-semibold text-slate-200 break-words">{user?.displayName || user?.username || 'Unknown'}</div>
                                </div>
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Môi trường</div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                                        <span className="text-base font-medium text-slate-200">Production Build</span>
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
    <div className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 group">
        <div className="flex items-center gap-4 mb-4">
            <div className={clsx("w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shrink-0", bg, color)}>
                <Icon size={24} />
            </div>
            {readOnly && (
                <div className="ml-auto px-3 py-1 rounded-full bg-slate-50 border border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    ReadOnly
                </div>
            )}
        </div>
        <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</div>
            {isEditing && !readOnly ? (
                <input
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-lg font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                />
            ) : (
                <div className="text-xl font-bold text-slate-800 break-words">{value}</div>
            )}
        </div>
    </div>
);
