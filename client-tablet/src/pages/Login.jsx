import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Lock, User, AlertCircle, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { clsx } from 'clsx';

export default function Login() {
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const [usernameError, setUsernameError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const usernameRef = useRef(null);
    const passwordRef = useRef(null);

    // Focus on error field when API error mentions that field
    useEffect(() => {
        if (error) {
            const low = error.toLowerCase();
            if (low.includes('username') || low.includes('tài khoản') || low.includes('tên đăng nhập')) {
                usernameRef.current?.focus();
            } else if (low.includes('password') || low.includes('mật khẩu')) {
                passwordRef.current?.focus();
            }
        }
    }, [error]);

    const validate = () => {
        const u = formData.username.trim();
        const p = formData.password;
        let ok = true;

        setUsernameError('');
        setPasswordError('');

        if (!u) {
            setUsernameError('Vui lòng nhập tài khoản');
            ok = false;
        }

        if (!p) {
            setPasswordError('Vui lòng nhập mật khẩu');
            ok = false;
        }

        return ok;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setUsernameError('');
        setPasswordError('');

        if (!validate()) return;

        setIsLoading(true);
        try {
            await login(formData.username.trim(), formData.password);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.error || err.response?.data?.detail || "Đã có lỗi xảy ra");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 tablet-lg:p-6 relative overflow-hidden" style={{ background: 'linear-gradient(to bottom right, #0f172a, #134e4a, #0f172a)' }}>
            {/* Background orbs — thu nhỏ */}
            <div className="absolute top-1/4 left-1/4 w-48 h-48 tablet-lg:w-64 tablet-lg:h-64 bg-teal-500/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 z-0" />
            <div className="absolute bottom-1/4 right-1/4 w-40 h-40 tablet-lg:w-52 tablet-lg:h-52 bg-teal-500/15 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 z-0" />

            <div className="w-full max-w-sm tablet-lg:max-w-[360px] relative z-10">
                <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl overflow-hidden p-4 tablet-lg:p-4 relative">
                    {/* Header: portrait gọn, landscape hơi thoáng hơn */}
                    <div className="text-center mb-4 tablet-lg:mb-4 relative">
                        {/* Logo - lớn, nằm phía trước text */}
                        <div className="flex items-center justify-center mb-1">
                            <img 
                                src="/logo/CP.png" 
                                alt="Đại lý Công Phú" 
                                className="w-[160px] h-[160px] tablet-lg:w-[200px] tablet-lg:h-[200px] object-contain select-none" 
                            />
                        </div>
                        {/* Text nằm dưới logo */}
                        <div>
                            <h2 className="text-lg tablet-lg:text-xl font-bold text-white tracking-tight mb-0.5">Đại lý Công Phú</h2>
                            <p className="text-teal-200/90 text-xs tablet-lg:text-xs">Hệ thống quản lý công nợ an toàn</p>
                        </div>
                    </div>

                    {error && (
                        <div
                            className="mb-3 p-2.5 tablet-lg:p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-200 animate-fade-in"
                            role="alert"
                            aria-live="assertive"
                        >
                            <AlertCircle size={16} className="flex-shrink-0" />
                            <span className="text-xs tablet-lg:text-sm font-medium">{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-3 tablet-lg:space-y-3">
                        <div className="space-y-1">
                            <label htmlFor="username" className="text-xs font-medium text-teal-100/90 ml-1">
                                Tài khoản
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-teal-300/80 group-focus-within:text-white transition-colors">
                                    <User size={16} />
                                </div>
                                <input
                                    ref={usernameRef}
                                    id="username"
                                    name="username"
                                    type="text"
                                    autoComplete="username"
                                    className={clsx(
                                        "w-full bg-slate-800/50 border text-white placeholder-slate-500 rounded-lg pl-10 pr-4 py-2 tablet-lg:py-2.5 text-sm tablet-lg:text-sm outline-none transition-colors font-medium min-h-[40px] tablet-lg:min-h-[42px]",
                                        usernameError
                                            ? "border-red-400/80 focus:ring-2 focus:ring-red-500/40 focus:border-red-400"
                                            : "border-slate-600/50 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50"
                                    )}
                                    placeholder="Nhập tên đăng nhập"
                                    value={formData.username}
                                    onChange={e => {
                                        setFormData({ ...formData, username: e.target.value });
                                        setUsernameError('');
                                        setError('');
                                    }}
                                    aria-invalid={!!usernameError}
                                    aria-describedby={usernameError ? 'username-error' : undefined}
                                />
                            </div>
                            {usernameError && (
                                <p id="username-error" className="text-xs text-red-300 flex items-center gap-1.5 mt-1">
                                    <AlertCircle size={12} className="shrink-0" />
                                    {usernameError}
                                </p>
                            )}
                        </div>

                        <div className="space-y-1">
                            <label htmlFor="password" className="text-xs font-medium text-teal-100/90 ml-1">
                                Mật khẩu
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-teal-300/80 group-focus-within:text-white transition-colors">
                                    <Lock size={16} />
                                </div>
                                <input
                                    ref={passwordRef}
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    className={clsx(
                                        "w-full bg-slate-800/50 border text-white placeholder-slate-500 rounded-lg pl-10 pr-11 py-2 tablet-lg:py-2.5 text-sm tablet-lg:text-sm outline-none transition-colors font-medium min-h-[40px] tablet-lg:min-h-[42px]",
                                        passwordError
                                            ? "border-red-400/80 focus:ring-2 focus:ring-red-500/40 focus:border-red-400"
                                            : "border-slate-600/50 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50"
                                    )}
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={e => {
                                        setFormData({ ...formData, password: e.target.value });
                                        setPasswordError('');
                                        setError('');
                                    }}
                                    aria-invalid={!!passwordError}
                                    aria-describedby={passwordError ? 'password-error' : undefined}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-teal-300/80 hover:text-white transition-colors duration-200 focus:outline-none focus:text-white min-w-[44px] justify-center cursor-pointer active:opacity-70"
                                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                                    tabIndex={0}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {passwordError && (
                                <p id="password-error" className="text-xs text-red-300 flex items-center gap-1.5 mt-1">
                                    <AlertCircle size={12} className="shrink-0" />
                                    {passwordError}
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-teal-600 hover:bg-teal-700 text-white py-2 tablet-lg:py-2.5 rounded-lg font-semibold shadow-lg shadow-teal-500/20 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2 group min-h-[40px] tablet-lg:min-h-[42px] text-sm tablet-lg:text-sm cursor-pointer"
                        >
                            {isLoading ? (
                                <>
                                    <div className="spinner" />
                                    <span>Đang đăng nhập...</span>
                                </>
                            ) : (
                                <>
                                    Đăng nhập
                                    <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <p className="text-center text-slate-500/70 text-[10px] tablet-lg:text-xs mt-3 tablet-lg:mt-4">
                    © 2026 Đại lý Công Phú
                </p>
            </div>
        </div>
    );
}
