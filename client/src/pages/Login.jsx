import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogIn, UserPlus, Lock, User, AlertCircle, ArrowRight, Eye, EyeOff } from 'lucide-react';

export default function Login() {
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const usernameRef = useRef(null);
    const passwordRef = useRef(null);

    // Focus on error field when error occurs
    useEffect(() => {
        if (error) {
            // Determine which field has the error and focus it
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
            setError(err.response?.data?.detail || "Đã có lỗi xảy ra");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Orbs */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-500/15 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>

            <div className="w-full max-w-xl relative z-10">
                <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-[2rem] shadow-2xl overflow-hidden p-12">
                    <div className="text-center mb-12">
                        <div className="w-24 h-24 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/30">
                            <Lock className="text-white w-12 h-12" />
                        </div>
                        <h2 className="text-5xl font-bold text-white tracking-tight mb-3">FastAccounting</h2>
                        <p className="text-blue-200 text-xl">Hệ thống quản lý công nợ an toàn</p>
                    </div>

                    {error && (
                        <div
                            className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-200 animate-fade-in"
                            role="alert"
                            aria-live="assertive"
                        >
                            <AlertCircle size={20} className="flex-shrink-0" />
                            <span className="text-sm font-medium">{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1.5">
                            <label htmlFor="username" className="text-sm font-medium text-blue-100 ml-1">
                                Tài khoản
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-blue-300 group-focus-within:text-white transition-colors">
                                    <User size={18} />
                                </div>
                                <input
                                    ref={usernameRef}
                                    id="username"
                                    name="username"
                                    type="text"
                                    required
                                    autoComplete="username"
                                    className="w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder-slate-500 rounded-xl pl-12 pr-5 py-4.5 text-lg outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-medium min-h-[52px]"
                                    placeholder="Nhập tên đăng nhập"
                                    value={formData.username}
                                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="password" className="text-sm font-medium text-blue-100 ml-1">
                                Mật khẩu
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-blue-300 group-focus-within:text-white transition-colors">
                                    <Lock size={18} />
                                </div>
                                <input
                                    ref={passwordRef}
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    autoComplete="current-password"
                                    className="w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder-slate-500 rounded-xl pl-12 pr-14 py-4.5 text-lg outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-medium min-h-[52px]"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-blue-300 hover:text-white transition-colors focus:outline-none focus:text-white min-w-[52px] min-h-[52px] justify-center"
                                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                                    tabIndex={0}
                                >
                                    {showPassword ? <EyeOff size={24} /> : <Eye size={24} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-xl font-bold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2 group min-h-[52px] text-lg"
                        >
                            {isLoading ? (
                                <>
                                    <div className="spinner"></div>
                                    <span>Đang đăng nhập...</span>
                                </>
                            ) : (
                                <>
                                    Đăng Nhập
                                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <p className="text-center text-slate-500 text-xs mt-6 opacity-60">
                    © 2024 FastAccounting System. All rights reserved.
                </p>
            </div>
        </div>
    );
}
