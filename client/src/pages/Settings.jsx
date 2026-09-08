import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings as SettingsIcon, Info, BookOpen, Calculator, Users, DatabaseBackup, LogOut, ChevronRight, CreditCard, Bell, Cloud, Eye, EyeOff, Copy, Check, ExternalLink, Loader2, AlertCircle, Save, CalendarRange } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWorkingYear } from '../context/WorkingYearContext';
import { useToast } from '../context/ToastContext';
import { getApiErrorMessage } from '../utils/errorMessage';
import { getDriveOAuthRefreshToken, updateDriveOAuthRefreshToken, getDriveOAuthGenerateUrl, handleDriveOAuthCallback } from '../services/api';
import { clsx } from 'clsx';

const SettingLink = ({ to, icon: Icon, label, desc }) => (
    <Link
        to={to}
        className="flex items-center gap-3 p-3 rounded-lg bg-white border border-slate-200 hover:border-blue-300 hover:bg-slate-50/50 transition-all group cursor-pointer"
    >
        <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors shrink-0">
            <Icon size={20} />
        </div>
        <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-slate-800">{label}</p>
            {desc && <p className="text-xs text-slate-500 mt-0.5">{desc}</p>}
        </div>
        <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-600 shrink-0" />
    </Link>
);

export default function Settings() {
    const { user, logout } = useAuth();
    const { year: workingYear, availableYears, setYear, isChanging, isAdmin: yearAdmin } = useWorkingYear();
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
            showToast('Lỗi', getApiErrorMessage(err, 'Lưu Google Drive refresh token'), 'error');
        }
    });

    const generateUrlMutation = useMutation({
        mutationFn: getDriveOAuthGenerateUrl,
        onSuccess: (data) => {
            setOAuthUrl(data.auth_url);
            showToast('Thành công', 'Đã tạo OAuth URL. Mở link và copy code sau khi authorize.', 'success');
        },
        onError: (err) => {
            showToast('Lỗi', getApiErrorMessage(err, 'Tạo URL OAuth Google Drive'), 'error');
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
            showToast('Lỗi', getApiErrorMessage(err, 'Đổi authorization code lấy refresh token'), 'error');
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
        <div className="max-w-3xl mx-auto space-y-5 animate-fade-in">
            <div>
                <h2 className="section-title">Cài đặt</h2>
                <p className="section-subtitle mt-1">Thông tin, hướng dẫn và tùy chọn hệ thống</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                        <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
                            <CalendarRange size={20} />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-900">Năm làm việc</h3>
                            <p className="mt-0.5 text-xs text-slate-500">
                                Chỉ lọc giao dịch theo năm. Khách hàng và mọi cấu hình (lãi suất, STK, thông báo, user…) dùng chung mọi năm.
                            </p>
                        </div>
                    </div>
                    {yearAdmin ? (
                        <div className="relative w-full sm:w-44">
                            <label htmlFor="settings-working-year" className="sr-only">Chọn năm làm việc</label>
                            <select
                                id="settings-working-year"
                                value={workingYear}
                                disabled={isChanging}
                                onChange={(e) => setYear(Number(e.target.value))}
                                className="select font-mono text-base font-bold tracking-wide text-slate-900"
                            >
                                {availableYears.map((y) => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                                {!availableYears.includes(workingYear + 1) && (
                                    <option value={workingYear + 1}>{workingYear + 1} (mở năm mới)</option>
                                )}
                            </select>
                            {isChanging && (
                                <span className="pointer-events-none absolute inset-y-0 right-9 flex items-center text-blue-500">
                                    <Loader2 size={15} className="animate-spin" />
                                </span>
                            )}
                        </div>
                    ) : (
                        <span
                            className="flex items-center rounded-lg border border-slate-200 bg-slate-100 px-3 font-mono text-base font-bold tracking-wide text-slate-700"
                            style={{ minHeight: 'var(--field-h)' }}
                        >
                            {workingYear}
                        </span>
                    )}
                </div>
            </div>

            <div className="space-y-2">
                <SettingLink to="/info" icon={Info} label="Thông tin" desc="Phiên bản, cập nhật hệ thống" />
                <SettingLink to="/guide" icon={BookOpen} label="Hướng dẫn" desc="Hướng dẫn sử dụng" />
                <SettingLink to="/interest-configs" icon={Calculator} label="Cấu hình lãi suất" desc="Thiết lập lãi vay" />
                <SettingLink to="/bank-account-config" icon={CreditCard} label="Cấu hình STK" desc="Thiết lập tài khoản ngân hàng" />
                <SettingLink to="/system-notification-config" icon={Bell} label="Cấu hình thông báo hệ thống" desc="Bảng tin nội bộ và cảnh báo nghiệp vụ" />
                {isAdmin && (
                    <>
                        <SettingLink to="/users" icon={Users} label="Người dùng" desc="Quản lý tài khoản" />
                        <SettingLink to="/backup-data" icon={DatabaseBackup} label="Sao lưu dữ liệu" desc="Backup & khôi phục" />
                    </>
                )}
            </div>

            {/* Drive OAuth Refresh Token Configuration - Admin Only */}
            {isAdmin && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                            <Cloud size={20} />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-900">Google Drive OAuth</h3>
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
                                className="btn-primary btn-md"
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
                                className="btn-secondary btn-md w-full"
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
                                            className="btn-primary btn-md"
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
                                    className="btn-secondary btn-md w-full"
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
