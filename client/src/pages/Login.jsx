import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getApiErrorMessage } from '../utils/errorMessage';
import AppBrandLogo from '../components/AppBrandLogo';
import { Lock, User, AlertCircle, Eye, EyeOff, ArrowRight, BookOpen, Check } from 'lucide-react';

const fieldClass =
    'min-h-12 w-full rounded-lg border border-slate-300 bg-white pl-11 pr-4 py-3 text-base text-slate-900 outline-none transition-colors placeholder:text-slate-400 hover:border-slate-400 focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10';

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
        <main className="h-full overflow-y-auto bg-slate-100 text-slate-900" style={{ '--spacing': '0.25rem' }}>
            <div className="mx-auto flex min-h-full max-w-6xl flex-col justify-center px-4 py-8 sm:px-8" style={{ paddingTop: 'max(2rem, var(--safe-t))', paddingBottom: 'max(2rem, env(safe-area-inset-bottom, 0px))' }}>
                <div className="grid overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5 lg:grid-cols-2">
                    <aside className="relative flex flex-col justify-between overflow-hidden bg-emerald-950 px-6 py-7 text-white sm:px-10 lg:p-12">
                        <div className="relative z-10 flex items-center gap-3">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white">
                                <AppBrandLogo variant="mark" alt="" className="h-10 w-10" />
                            </div>
                            <div>
                                <p className="font-heading text-lg font-semibold tracking-tight">FastAccounting</p>
                                <p className="mt-0.5 text-xs text-emerald-100">SỔ CÔNG NỢ</p>
                            </div>
                        </div>
                        <div className="relative z-10 hidden py-16 lg:block">
                            <span className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-700 bg-emerald-900"><BookOpen className="h-6 w-6 text-emerald-200" aria-hidden /></span>
                            <h2 className="font-heading text-4xl font-semibold leading-tight tracking-tight">Công nợ rõ ràng.<br /><span className="text-emerald-200">Quản lý dễ dàng.</span></h2>
                            <p className="mt-5 max-w-sm text-base leading-7 text-emerald-100">Tập trung khoản vay, giao dịch và đối chiếu công nợ trong một không gian làm việc.</p>
                            <ul className="mt-8 space-y-4 text-sm text-emerald-50">
                                {['Theo dõi khoản vay và khách hàng', 'Ghi nhận thu chi, đối chiếu số dư', 'Tổng hợp báo cáo công nợ'].map((item) => (
                                    <li key={item} className="flex items-center gap-3"><Check className="h-4 w-4 shrink-0 text-emerald-300" aria-hidden />{item}</li>
                                ))}
                            </ul>
                        </div>
                        <p className="relative z-10 hidden text-xs text-emerald-200 lg:block">Gọn gàng trong quản lý. Chủ động trong công việc.</p>
                        <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full border border-emerald-800" aria-hidden />
                        <div className="pointer-events-none absolute -bottom-24 -right-24 h-64 w-64 rounded-full border border-emerald-800" aria-hidden />
                    </aside>

                    <section className="flex flex-col justify-center px-6 py-8 sm:px-12 sm:py-12 lg:px-14" aria-labelledby="login-heading">
                        <div className="mb-8">
                            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-emerald-700">Chào mừng trở lại</p>
                            <h1 id="login-heading" className="font-heading text-3xl font-semibold tracking-tight text-slate-900">Đăng nhập</h1>
                            <p className="mt-3 text-sm leading-6 text-slate-500">Truy cập tài khoản để tiếp tục quản lý công nợ.</p>
                        </div>
                        <form onSubmit={handleSubmit} className="flex flex-col gap-5" aria-busy={isLoading}>
                        {error && (
                            <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm font-medium text-red-700" role="alert" aria-live="assertive">
                                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
                                <span>{error}</span>
                            </div>
                        )}

                        <div>
                            <label htmlFor="username" className="mb-2 block text-sm font-semibold text-slate-700">Tên đăng nhập</label>
                            <div className="relative">
                                <User className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-500" aria-hidden />
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
                            <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-700">Mật khẩu</label>
                            <div className="relative">
                                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-500" aria-hidden />
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
                                    className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-lg text-slate-500 hover:text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
                                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="mt-2 flex min-h-12 w-full items-center justify-center gap-3 rounded-lg bg-emerald-800 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isLoading ? <><div className="spinner" /><span>Đang đăng nhập…</span></> : <><span>Đăng nhập</span><ArrowRight className="h-4 w-4" aria-hidden /></>}
                        </button>
                        </form>
                        <div className="mt-8 border-t border-slate-100 pt-6 text-center text-sm leading-6 text-slate-500">
                            <p className="font-medium text-slate-700">Bạn quên mật khẩu?</p>
                            <p>Vui lòng liên hệ quản trị viên để được hỗ trợ.</p>
                        </div>
                    </section>
                </div>
                <p className="mt-6 text-center text-xs text-slate-500">FastAccounting · Hệ thống quản lý công nợ</p>
            </div>
        </main>
    );
}
