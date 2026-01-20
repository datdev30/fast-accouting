import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    Info as InfoIcon, 
    Save, 
    X, 
    Pencil, 
    Globe, 
    Calendar, 
    User, 
    FileText, 
    Activity, 
    ShieldCheck, 
    Zap,
    CheckCircle2
} from 'lucide-react';
import { getAppInfo, updateAppInfo } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { clsx } from 'clsx';

// Xóa tất cả emoji khỏi text
const removeEmojis = (text) => {
    if (!text) return '';
    // Regex để xóa tất cả emoji (Unicode ranges cho emoji)
    return text.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1F1E0}-\u{1F1FF}]/gu, '').trim();
};

// Clean text: xóa emoji và khoảng trắng thừa
const cleanText = (text) => {
    return removeEmojis(text).replace(/\s+/g, ' ').trim();
};

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
            // Xóa emoji khỏi summary khi load
            const summaryText = Array.isArray(info.summary) 
                ? info.summary.map(line => removeEmojis(line)).join('\n')
                : removeEmojis(info.summary || '');
            
            setFormData({
                name: info.name || '',
                description: info.description || '',
                version: info.version || '',
                author: info.author || '',
                summary: summaryText
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
        // Xóa emoji khỏi summary trước khi save
        const cleanedSummary = formData.summary
            .split('\n')
            .map(line => removeEmojis(line))
            .filter(line => line.trim() !== '');
        
        updateMutation.mutate({
            ...formData,
            summary: cleanedSummary
        });
    };

    if (isLoading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
                <p className="text-slate-500 font-medium text-sm">Đang tải thông tin...</p>
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
        <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Section */}
            <div className="flex flex-col tablet-lg:flex-row tablet-lg:items-center tablet-lg:justify-between gap-4">
                <div>
                    <h2 className="section-title text-2xl">Thông tin hệ thống</h2>
                    <p className="section-subtitle mt-1">Phiên bản, cập nhật và thông tin chi tiết</p>
                </div>
                {isAdmin && (
                    <div className="flex items-center gap-2 shrink-0">
                        {isEditing ? (
                            <>
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors duration-200 flex items-center gap-2 cursor-pointer"
                                    disabled={updateMutation.isPending}
                                >
                                    <X size={16} />
                                    <span>Huỷ</span>
                                </button>
                                <button 
                                    onClick={handleSave} 
                                    className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={updateMutation.isPending}
                                >
                                    {updateMutation.isPending ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <Save size={16} />
                                    )}
                                    <span>Lưu thay đổi</span>
                                </button>
                            </>
                        ) : (
                            <button 
                                onClick={() => setIsEditing(true)} 
                                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors duration-200 flex items-center gap-2 cursor-pointer"
                            >
                                <Pencil size={16} />
                                <span>Chỉnh sửa</span>
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Hero Card */}
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-slate-800 text-white shadow-xl">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400 rounded-full blur-2xl transform -translate-x-1/2 translate-y-1/2" />
                </div>
                
                {/* Decorative Icon */}
                <div className="absolute top-6 right-6 opacity-10">
                    <Activity size={200} />
                </div>

                <div className="relative z-10 p-6 tablet-lg:p-8">
                    <div className="flex flex-col tablet-lg:flex-row tablet-lg:items-center gap-4 tablet-lg:gap-6">
                        {/* App Icon */}
                        <div className="w-16 h-16 tablet-lg:w-20 tablet-lg:h-20 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center shrink-0 shadow-lg">
                            <Globe size={32} className="tablet-lg:w-10 tablet-lg:h-10" />
                        </div>

                        {/* App Info */}
                        <div className="flex-1 min-w-0">
                            {isEditing ? (
                                <div className="space-y-4 max-w-2xl">
                                    <div>
                                        <label className="block text-xs font-bold text-blue-200 uppercase tracking-wider mb-2">
                                            Tên ứng dụng
                                        </label>
                                        <input
                                            className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-2.5 text-base font-bold text-white placeholder-white/40 focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/40 transition-all"
                                            value={formData.name}
                                            onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                                            placeholder="Nhập tên ứng dụng"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-blue-200 uppercase tracking-wider mb-2">
                                            Mô tả
                                        </label>
                                        <textarea
                                            className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-3 text-sm text-white placeholder-white/40 focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/40 resize-none transition-all"
                                            rows={3}
                                            value={formData.description}
                                            onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                                            placeholder="Nhập mô tả ứng dụng"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <h1 className="text-2xl tablet-lg:text-2xl font-bold tracking-tight mb-2">
                                        {formData.name || 'Fast Accounting'}
                                    </h1>
                                    <p className="text-sm tablet-lg:text-sm text-blue-100 leading-relaxed max-w-2xl">
                                        {formData.description || 'Hệ thống quản lý tài chính thông minh'}
                                    </p>
                                </>
                            )}
                        </div>

                        {/* Status Badge */}
                        <div className="flex tablet-lg:flex-col items-center tablet-lg:items-end gap-3 shrink-0">
                            <div className="px-4 py-2 rounded-lg bg-emerald-500/20 backdrop-blur-sm border border-emerald-400/30 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                <span className="text-sm font-semibold text-emerald-100">Đang hoạt động</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 tablet:grid-cols-2 tablet-lg:grid-cols-3 gap-4">
                <StatCard
                    icon={Zap}
                    label="Phiên bản"
                    value={formData.version}
                    color="text-amber-500"
                    bgColor="bg-amber-50"
                    borderColor="border-amber-200"
                    isEditing={isEditing}
                    onChange={v => setFormData(p => ({ ...p, version: v }))}
                />
                <StatCard
                    icon={User}
                    label="Người phát triển"
                    value={formData.author}
                    color="text-blue-500"
                    bgColor="bg-blue-50"
                    borderColor="border-blue-200"
                    isEditing={isEditing}
                    onChange={v => setFormData(p => ({ ...p, author: v }))}
                />
                <StatCard
                    icon={Calendar}
                    label="Cập nhật cuối"
                    value={info?.updated_at}
                    color="text-purple-500"
                    bgColor="bg-purple-50"
                    borderColor="border-purple-200"
                    readOnly
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 tablet-lg:grid-cols-3 gap-6">
                {/* Features List */}
                <div className="tablet-lg:col-span-2">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 tablet-lg:p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 tablet-lg:w-12 tablet-lg:h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                                <FileText size={20} className="tablet-lg:w-6 tablet-lg:h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg tablet-lg:text-xl font-bold text-slate-900">Tính năng nổi bật</h3>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
                                    Features & Updates
                                </p>
                            </div>
                        </div>

                        {isEditing ? (
                            <div className="relative">
                                <textarea
                                    className="w-full h-[320px] bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm leading-relaxed outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none transition-all font-mono"
                                    value={formData.summary}
                                    onChange={e => {
                                        // Tự động xóa emoji khi người dùng nhập
                                        const cleaned = e.target.value.split('\n').map(line => removeEmojis(line)).join('\n');
                                        setFormData(p => ({ ...p, summary: cleaned }));
                                    }}
                                    placeholder="Mỗi dòng là một tính năng&#10;Ví dụ:&#10;Giao diện hiện đại&#10;Hiệu năng cao"
                                />
                                <div className="absolute bottom-4 right-4 text-xs text-slate-400 font-medium">
                                    Mỗi dòng = 1 mục
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {formData.summary.split('\n').filter(Boolean).length > 0 ? (
                                    formData.summary.split('\n').filter(Boolean).map((line, i) => {
                                        const displayText = cleanText(line);
                                        return (
                                            <div 
                                                key={i} 
                                                className="flex gap-4 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors duration-200 cursor-pointer group"
                                            >
                                                <div className="w-10 h-10 rounded-lg bg-white border-2 border-slate-200 flex items-center justify-center shrink-0 group-hover:border-blue-300 group-hover:bg-blue-50 transition-colors duration-200">
                                                    <CheckCircle2 size={20} className="text-slate-600 group-hover:text-blue-600 transition-colors duration-200" />
                                                </div>
                                                <p className="text-sm text-slate-700 leading-relaxed pt-1.5 flex-1">
                                                    {displayText}
                                                </p>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="text-center py-12 text-slate-400">
                                        <FileText size={48} className="mx-auto mb-3 opacity-50" />
                                        <p className="text-sm font-medium">Chưa có thông tin tính năng</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* User Session Card */}
                <div>
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-5 tablet-lg:p-6 text-white relative overflow-hidden shadow-xl">
                        {/* Background Pattern */}
                        <div className="absolute top-0 right-0 opacity-5">
                            <ShieldCheck size={120} />
                        </div>

                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 tablet-lg:w-12 tablet-lg:h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0">
                                    <ShieldCheck size={20} className="tablet-lg:w-6 tablet-lg:h-6 text-emerald-400" />
                                </div>
                                <div>
                                    <h4 className="text-base tablet-lg:text-lg font-bold">Phiên đăng nhập</h4>
                                    <p className="text-xs text-slate-400 uppercase tracking-wider mt-0.5">
                                        Session Info
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="p-3 tablet-lg:p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                                        Quyền truy cập
                                    </p>
                                    <p className="text-sm tablet-lg:text-base font-semibold text-white">
                                        {user?.role === 'ADMIN' ? 'Quản trị viên' : user?.role === 'SALE' ? 'Nhân viên' : 'Khách'}
                                    </p>
                                </div>
                                <div className="p-3 tablet-lg:p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                                        Người dùng
                                    </p>
                                    <p className="text-sm font-medium text-slate-200 break-words">
                                        {user?.displayName || user?.username || '—'}
                                    </p>
                                </div>
                                <div className="p-3 tablet-lg:p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                                    <span className="text-sm font-medium text-slate-200">Môi trường Production</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Stat Card Component
const StatCard = ({ icon: Icon, label, value, color, bgColor, borderColor, isEditing, onChange, readOnly }) => (
    <div className={clsx(
        "bg-white rounded-xl border p-4 tablet-lg:p-5 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer",
        borderColor
    )}>
        <div className="flex items-start justify-between gap-3 mb-3">
            <div className={clsx('w-10 h-10 tablet-lg:w-12 tablet-lg:h-12 rounded-xl flex items-center justify-center shrink-0', bgColor, color)}>
                <Icon size={20} className="tablet-lg:w-6 tablet-lg:h-6" />
            </div>
            {readOnly && (
                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Chỉ đọc
                </span>
            )}
        </div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{label}</p>
        {isEditing && !readOnly ? (
            <input
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder="Nhập giá trị"
            />
        ) : (
            <p className="text-lg tablet-lg:text-xl font-bold text-slate-900 break-words">{value || '—'}</p>
        )}
    </div>
);
