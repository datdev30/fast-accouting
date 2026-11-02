import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getApiErrorMessage } from '../utils/errorMessage';
import AppBrandLogo from '../components/AppBrandLogo';
import { Lock, User, AlertCircle, Eye, EyeOff } from 'lucide-react';

const fieldClass =
    'h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-base text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20';

export default function Login() {
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const usernameRef = useRef(null);
    const passwordRef = useRef(null);

    useEffect(() => {
        if (error) {
            if (error.toLowerCase().includes('username') || error.toLowerCase().includes('tài khoản')) {
                usernameRef.current?.focus();
            } else if (error.toLowerCase().includes('password') || error.toLowerCase().includes('mật khẩu')) {
                passwordRef.current?.focus();
            }
        }
    }, [error]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await login(formData.username, formData.password);
            navigate('/');
        } catch (err) {
            setError(getApiErrorMessage(err, 'Đăng nhập'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-dvh bg-slate-50">
            <div
                className="bg-gradient-to-br from-blue-600 to-sky-500 px-6 pb-24 text-white"
                style={{ paddingTop: 'max(3.5rem, var(--safe-t))' }}
            >
                <div className="mx-auto max-w-md">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/90 p-1.5 shadow-sm">
                        <AppBrandLogo variant="mark" alt="FastAccounting" className="h-full w-full object-contain" />
                    </div>
                    <h1 className="mt-5 font-heading text-2xl font-extrabold">Xin chào 👋</h1>
                    <p className="mt-1 text-sm text-blue-100">Đăng nhập để quản lý khoản vay</p>
                </div>
            </div>

            <main className="relative mx-auto -mt-16 max-w-md px-4 pb-8">
                <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl bg-white p-5 shadow-lg sm:p-6">
                    {error && (
                        <div className="flex gap-3 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm font-medium text-red-700" role="alert" aria-live="assertive">
                            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
                            <span>{error}</span>
                        </div>
                    )}

                    <div>
                        <label htmlFor="username" className="field-label mb-1.5 block">Tên đăng nhập</label>
                        <div className="relative">
                            <User className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" aria-hidden />
                            <input
                                ref={usernameRef}
                                id="username"
                                name="username"
                                type="text"
                                required
                                autoComplete="username"
                                className={fieldClass}
                                placeholder="Tên đăng nhập"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="password" className="field-label mb-1.5 block">Mật khẩu</label>
                        <div className="relative">
                            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" aria-hidden />
                            <input
                                ref={passwordRef}
                                id="password"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                required
                                autoComplete="current-password"
                                className={`${fieldClass} pr-12`}
                                placeholder="Mật khẩu"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-slate-400 hover:text-slate-600"
                                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                            >
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 font-bold text-white shadow-md shadow-blue-200 transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isLoading ? <><div className="spinner" /><span>Đang đăng nhập…</span></> : 'Đăng nhập'}
                    </button>
                </form>

                <p className="mt-6 text-center text-xs text-slate-400">
                    Chỉ dùng trong phạm vi được phép. Liên hệ quản trị nếu quên mật khẩu.
                </p>
            </main>
        </div>
    );
}
