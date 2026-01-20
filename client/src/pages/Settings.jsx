import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings as SettingsIcon, Info, BookOpen, Calculator, Users, DatabaseBackup, LogOut, ChevronRight, CreditCard, Cloud, Eye, EyeOff, Copy, Check, ExternalLink, Loader2, AlertCircle, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getDriveOAuthRefreshToken, updateDriveOAuthRefreshToken, getDriveOAuthGenerateUrl, handleDriveOAuthCallback } from '../services/api';
import { clsx } from 'clsx';

const SettingLink = ({ to, icon: Icon, label, desc }) => (
    <Link
        to={to}
        className="flex items-center gap-4 p-4 rounded-xl bg-white border border-slate-200 hover:border-blue-300 hover:bg-slate-50/50 transition-all group cursor-pointer"
    >
        <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
            <Icon size={24} />
        </div>
        <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-800">{label}</p>
            {desc && <p className="text-sm text-slate-500 mt-0.5">{desc}</p>}
        </div>
        <ChevronRight size={20} className="text-slate-300 group-hover:text-blue-600 shrink-0" />
    </Link>
);

export default function Settings() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const queryClient = useQueryClient();
    const isAdmin = user?.role === 'ADMIN';

    const [showToken, setShowToken] = useState(false);
    const [manualToken, setManualToken] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [oauthUrl, setOAuthUrl] = useState(null);
    const [oauthCode, setOAuthCode] = useState('');

    const { data: tokenData, isLoading: isLoadingToken } = useQuery({
        queryKey: ['drive-oauth-refresh-token'],
        queryFn: getDriveOAuthRefreshToken,
        enabled: isAdmin,
        retry: 1
    });

    const updateMutation = useMutation({
        mutationFn: updateDriveOAuthRefreshToken,
        onSuccess: () => {
            queryClient.invalidateQueries(['drive-oauth-refresh-token']);
            setManualToken('');
            showToast('Thành công', 'Đã lưu refresh token thành công', 'success');
        },
        onError: (err) => {
            showToast('Lỗi', err.response?.data?.error || 'Không thể lưu refresh token', 'error');
        }
    });

    const generateUrlMutation = useMutation({
        mutationFn: getDriveOAuthGenerateUrl,
        onSuccess: (data) => {
            setOAuthUrl(data.auth_url);
            showToast('Thành công', 'Đã tạo OAuth URL. Mở link và copy code sau khi authorize.', 'success');
        },
        onError: (err) => {
            showToast('Lỗi', err.response?.data?.error || 'Không thể tạo OAuth URL', 'error');
        }
    });

    const callbackMutation = useMutation({
        mutationFn: handleDriveOAuthCallback,
        onSuccess: (data) => {
            queryClient.invalidateQueries(['drive-oauth-refresh-token']);
            setOAuthCode('');
            setOAuthUrl(null);
            showToast('Thành công', 'Đã tạo và lưu refresh token thành công', 'success');
        },
        onError: (err) => {
            showToast('Lỗi', err.response?.data?.error || 'Không thể xử lý OAuth callback', 'error');
        }
    });

    const handleCopyToken = (token) => {
        navigator.clipboard.writeText(token);
        showToast('Thành công', 'Đã copy refresh token', 'success');
    };

    const handleSaveManualToken = () => {
        if (!manualToken.trim()) {
            showToast('Lỗi', 'Vui lòng nhập refresh token', 'error');
            return;
        }
        updateMutation.mutate(manualToken.trim());
    };

    const handleGenerateToken = () => {
        setIsGenerating(true);
        generateUrlMutation.mutate();
    };

    const handleProcessCallback = () => {
        if (!oauthCode.trim()) {
            showToast('Lỗi', 'Vui lòng nhập authorization code', 'error');
            return;
        }
        callbackMutation.mutate(oauthCode.trim());
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8 animate-fade-in p-6">
            <div>
                <h2 className="text-3xl font-bold text-slate-900">Cài đặt</h2>
                <p className="text-slate-500 mt-1">Thông tin, hướng dẫn và tùy chọn hệ thống</p>
            </div>

            <div className="space-y-3">
                <SettingLink to="/info" icon={Info} label="Thông tin" desc="Phiên bản, cập nhật hệ thống" />
                <SettingLink to="/guide" icon={BookOpen} label="Hướng dẫn" desc="Hướng dẫn sử dụng" />
                <SettingLink to="/interest-configs" icon={Calculator} label="Cấu hình lãi suất" desc="Thiết lập lãi vay" />
                <SettingLink to="/bank-account-config" icon={CreditCard} label="Cấu hình STK" desc="Thiết lập tài khoản ngân hàng" />
                {isAdmin && (
                    <>
                        <SettingLink to="/users" icon={Users} label="Người dùng" desc="Quản lý tài khoản" />
                        <SettingLink to="/backup-data" icon={DatabaseBackup} label="Sao lưu dữ liệu" desc="Backup & khôi phục" />
                    </>
                )}
            </div>

            {/* Drive OAuth Refresh Token Configuration - Admin Only */}
            {isAdmin && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                            <Cloud size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Google Drive OAuth</h3>
                            <p className="text-xs text-slate-500 mt-0.5">Quản lý refresh token cho Google Drive</p>
                        </div>
                    </div>

                    {/* Current Token Display */}
                    {isLoadingToken ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 size={24} className="animate-spin text-slate-400" />
                        </div>
                    ) : tokenData?.has_token ? (
                        <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                                    Refresh Token hiện tại
                                </label>
                                <button
                                    onClick={() => setShowToken(!showToken)}
                                    className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                                >
                                    {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    readOnly
                                    value={showToken ? tokenData.refresh_token_masked : '••••••••••••'}
                                    className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono text-slate-700"
                                />
                                <button
                                    onClick={() => handleCopyToken(tokenData.refresh_token_masked)}
                                    className="p-2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                                    title="Copy"
                                >
                                    <Copy size={16} />
                                </button>
                            </div>
                            {tokenData.google_account_email && (
                                <p className="text-xs text-slate-500">
                                    Account: {tokenData.google_account_email}
                                </p>
                            )}
                            {tokenData.token_created_at && (
                                <p className="text-xs text-slate-500">
                                    Tạo lúc: {new Date(tokenData.token_created_at).toLocaleString('vi-VN')}
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                            <div className="flex items-start gap-2">
                                <AlertCircle size={16} className="text-amber-600 mt-0.5 shrink-0" />
                                <p className="text-sm text-amber-800">
                                    Chưa có refresh token. Vui lòng tạo mới hoặc nhập thủ công.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Manual Token Input */}
                    <div className="space-y-3">
                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                            Nhập refresh token thủ công
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={manualToken}
                                onChange={(e) => setManualToken(e.target.value)}
                                placeholder="Dán refresh token vào đây..."
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                            <button
                                onClick={handleSaveManualToken}
                                disabled={updateMutation.isPending || !manualToken.trim()}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                                {updateMutation.isPending ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <Save size={16} />
                                )}
                                Lưu
                            </button>
                        </div>
                    </div>

                    {/* Generate Token via OAuth */}
                    <div className="space-y-3 pt-4 border-t border-slate-200">
                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                            Tạo refresh token mới (OAuth)
                        </label>
                        
                        {!oauthUrl ? (
                            <button
                                onClick={handleGenerateToken}
                                disabled={generateUrlMutation.isPending}
                                className="w-full px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                                {generateUrlMutation.isPending ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        Đang tạo URL...
                                    </>
                                ) : (
                                    <>
                                        <ExternalLink size={16} />
                                        Tạo OAuth URL
                                    </>
                                )}
                            </button>
                        ) : (
                            <div className="space-y-3">
                                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                                    <p className="text-sm font-semibold text-blue-900 mb-2">Bước 1: Mở link này và authorize</p>
                                    <a
                                        href={oauthUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-blue-600 hover:text-blue-700 underline break-all flex items-center gap-2"
                                    >
                                        {oauthUrl}
                                        <ExternalLink size={14} />
                                    </a>
                                </div>
                                
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-slate-600">
                                        Bước 2: Copy authorization code từ URL redirect và dán vào đây
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={oauthCode}
                                            onChange={(e) => setOAuthCode(e.target.value)}
                                            placeholder="Dán authorization code..."
                                            className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                        />
                                        <button
                                            onClick={handleProcessCallback}
                                            disabled={callbackMutation.isPending || !oauthCode.trim()}
                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                        >
                                            {callbackMutation.isPending ? (
                                                <Loader2 size={16} className="animate-spin" />
                                            ) : (
                                                <Check size={16} />
                                            )}
                                            Xử lý
                                        </button>
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        setOAuthUrl(null);
                                        setOAuthCode('');
                                    }}
                                    className="w-full px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors cursor-pointer"
                                >
                                    Hủy
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}


            <div className="pt-4">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-4 w-full p-4 rounded-xl bg-white border border-red-200 hover:bg-red-50 hover:border-red-300 transition-all group cursor-pointer"
                >
                    <div className="w-12 h-12 rounded-xl bg-red-50 text-red-500 flex items-center justify-center">
                        <LogOut size={24} />
                    </div>
                    <span className="font-semibold text-red-600">Đăng xuất</span>
                </button>
            </div>
        </div>
    );
}
