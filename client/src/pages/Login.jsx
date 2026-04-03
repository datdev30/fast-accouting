import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getApiErrorMessage } from '../utils/errorMessage';
import AppBrandLogo from '../components/AppBrandLogo';
import { Lock, User, AlertCircle, ArrowRight, Eye, EyeOff } from 'lucide-react';

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
        <div className="login-page login-page--splash">
            <div className="login-page__bg" aria-hidden />
            <div className="login-page__overlay" aria-hidden />

            <main className="login-page__main login-page__main--splash">
                <div className="flex w-full max-w-[420px] flex-col items-center">
                    <AppBrandLogo
                        variant="mark"
                        alt="FastAccounting"
                        className="mb-7 h-[4.75rem] max-h-24 w-auto max-w-[min(100%,19rem)] object-contain drop-shadow-[0_2px_14px_rgba(0,0,0,0.5)] sm:h-24 sm:max-h-28 sm:max-w-[min(100%,21rem)]"
                    />

                    <div className="login-page__card login-page__card--splash w-full">
                        <div className="mb-6 border-b border-white/25 pb-6">
                            <h1
                                className="text-xl font-bold tracking-tight text-slate-900 drop-shadow-sm sm:text-2xl"
                                style={{ fontFamily: 'var(--font-heading)' }}
                            >
                                Đăng nhập
                            </h1>
                            <p className="login-page__lead mt-1.5">
                                Nhập tài khoản được cấp để vào hệ thống.
                            </p>
                        </div>

                        {error && (
                            <div className="login-page__alert mb-5" role="alert" aria-live="assertive">
                                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden />
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-1.5">
                                <label htmlFor="username" className="field-label text-slate-600">
                                    Tài khoản
                                </label>
                                <div className="login-page__input-group">
                                    <span className="login-page__input-icon" aria-hidden>
                                        <User className="h-[18px] w-[18px]" strokeWidth={2} />
                                    </span>
                                    <input
                                        ref={usernameRef}
                                        id="username"
                                        name="username"
                                        type="text"
                                        required
                                        autoComplete="username"
                                        className="login-page__field"
                                        placeholder="Tên đăng nhập"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label htmlFor="password" className="field-label text-slate-600">
                                    Mật khẩu
                                </label>
                                <div className="login-page__input-group">
                                    <span className="login-page__input-icon" aria-hidden>
                                        <Lock className="h-[18px] w-[18px]" strokeWidth={2} />
                                    </span>
                                    <input
                                        ref={passwordRef}
                                        id="password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        autoComplete="current-password"
                                        className="login-page__field login-page__field--password"
                                        placeholder="Mật khẩu"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="login-page__toggle-password"
                                        aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                                    >
                                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="login-page__submit"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="spinner" />
                                        <span>Đang đăng nhập…</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Đăng nhập</span>
                                        <ArrowRight className="h-[18px] w-[18px] shrink-0" aria-hidden />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    <p className="login-page__splash-foot mt-6 max-w-[420px] text-center text-[11px] leading-relaxed text-white/85 drop-shadow-md">
                        Chỉ dùng trong phạm vi được phép. Liên hệ quản trị nếu quên mật khẩu.
                    </p>
                    <p className="login-page__splash-foot mt-2 text-center text-[10px] text-white/60 drop-shadow">
                        © 2026 FastAccounting
                    </p>
                </div>
            </main>
        </div>
    );
}
