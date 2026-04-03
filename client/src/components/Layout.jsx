import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Calculator, FileText, ChevronLeft, ChevronRight, LogOut, BarChart3, Info, BookOpen, DatabaseBackup, Settings as SettingsIcon, Menu, X } from 'lucide-react';
import { clsx } from 'clsx';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { getAppInfo } from '../services/api';
import AppBrandLogo from './AppBrandLogo';

const NavItem = ({ to, icon: Icon, label, collapsed, onClick, end }) => {
    const location = useLocation();
    const isActive = end
        ? location.pathname === to
        : location.pathname === to || location.pathname.startsWith(`${to}/`);

    return (
        <Link
            to={to}
            onClick={onClick}
            className={clsx(
                "group flex items-center gap-2 rounded-lg transition-all duration-200 mx-1.5 min-h-10 lg:min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
                isActive
                    ? "bg-blue-600 text-white shadow-md shadow-blue-200/80"
                    : "text-slate-600 hover:bg-slate-50 hover:text-blue-600",
                collapsed ? "justify-center px-2" : "px-3 py-2"
            )}
            title={collapsed ? label : undefined}
            aria-current={isActive ? "page" : undefined}
        >
            <Icon 
                size={18} 
                strokeWidth={2}
                className={clsx(
                    "flex-shrink-0 transition-transform group-hover:scale-105 w-[18px] h-[18px]", 
                    isActive && "text-white"
                )} 
            />
            {!collapsed && <span className="font-medium flex-1 whitespace-nowrap overflow-hidden transition-all duration-300 text-sm">{label}</span>}
            {!collapsed && isActive && <ChevronRight size={16} className="opacity-50 flex-shrink-0" />}
        </Link>
    );
};

export default function Layout() {
    const { user, logout } = useAuth();
    const location = useLocation();

    const { data: appInfo } = useQuery({
        queryKey: ['app-info'],
        queryFn: getAppInfo,
        staleTime: 5 * 60 * 1000 // cache for 5 minutes
    });

    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const [isLgUp, setIsLgUp] = useState(
        typeof window !== 'undefined' ? window.matchMedia('(min-width: 1024px)').matches : true
    );

    useEffect(() => {
        const mq = window.matchMedia('(min-width: 1024px)');
        const onChange = () => setIsLgUp(mq.matches);
        onChange();
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, []);

    useEffect(() => {
        setMobileNavOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        if (!mobileNavOpen) return;
        const onKey = (e) => {
            if (e.key === 'Escape') setMobileNavOpen(false);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [mobileNavOpen]);

    const closeMobileNav = () => setMobileNavOpen(false);
    const onNavigate = () => closeMobileNav();

    const userDisplayName = (user?.displayName || user?.username || 'User').trim();
    const userInitials = (() => {
        const parts = userDisplayName.split(/\s+/).filter(Boolean);
        if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
        if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
        return 'AD';
    })();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isExpanded = isLgUp ? isSidebarOpen : true;
    const navCollapsed = isLgUp ? !isSidebarOpen : false;

    return (
        <div className="flex h-dvh bg-slate-50 font-sans overflow-x-hidden max-w-full">
            <a href="#main-content" className="skip-link">
                Bỏ qua, tới nội dung chính
            </a>

            {/* Mobile overlay */}
            <div
                role="presentation"
                aria-hidden={!mobileNavOpen}
                className={clsx(
                    'fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden',
                    mobileNavOpen ? 'opacity-100 pointer-events-auto' : 'pointer-events-none opacity-0'
                )}
                onClick={closeMobileNav}
            />

            {/* Sidebar */}
            <aside
                id="app-sidebar"
                className={clsx(
                    'bg-white border-r border-slate-200 flex flex-col shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)] transition-all duration-300 ease-in-out',
                    'lg:relative lg:z-auto lg:translate-x-0',
                    'fixed inset-y-0 left-0 z-50 max-w-[min(17.5rem,90vw)] w-full lg:max-w-none',
                    mobileNavOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
                    isSidebarOpen ? 'lg:w-56 xl:w-60' : 'lg:w-[4.5rem]'
                )}
                aria-label="Điều hướng chính"
            >
                {/* Toggle — desktop only */}
                <button
                    type="button"
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="hidden lg:flex absolute -right-2 top-7 bg-white border border-slate-200 p-1 rounded-full text-slate-400 hover:text-blue-600 hover:border-blue-200 shadow-sm z-20 transition-colors w-7 h-7 items-center justify-center"
                    aria-expanded={isSidebarOpen}
                    aria-controls="app-sidebar"
                    aria-label={isSidebarOpen ? 'Thu gọn menu' : 'Mở rộng menu'}
                >
                    {isSidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                </button>

                <div className="relative flex items-center justify-center border-b border-slate-100 px-3 py-3 lg:hidden shrink-0">
                    <AppBrandLogo
                        variant="full"
                        alt={appInfo?.name || 'FastAccounting'}
                        className="h-9 w-auto max-w-[9rem] shrink-0 rounded-lg object-contain"
                        fallbackClassName="h-9 w-9 text-xs shadow-sm shadow-blue-200/80"
                    />
                    <button
                        type="button"
                        onClick={closeMobileNav}
                        className="absolute right-2 top-1/2 flex min-h-10 min-w-10 -translate-y-1/2 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        aria-label="Đóng menu"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className={clsx('hidden lg:flex lg:justify-center lg:px-4 lg:py-4 xl:px-5 xl:py-5', isExpanded ? '' : 'lg:pb-3')}>
                    {isExpanded ? (
                        <div className="flex w-full justify-center">
                            <AppBrandLogo
                                variant="full"
                                alt={appInfo?.name || 'FastAccounting'}
                                className="h-10 max-h-11 w-auto max-w-[min(100%,11rem)] object-contain"
                            />
                        </div>
                    ) : (
                        <div className="flex w-full justify-center">
                            <AppBrandLogo
                                variant="mark"
                                alt={appInfo?.name || 'FastAccounting'}
                                className="h-9 w-9 rounded-lg"
                                fallbackClassName="h-9 w-9 text-sm shadow-md shadow-blue-200/80"
                            />
                        </div>
                    )}
                </div>

                <div className="px-4 xl:px-5 mb-3">
                    <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
                </div>

                <nav className="flex-1 space-y-1 px-2 overflow-y-auto" aria-label="Trang">
                    <NavItem to="/overview" icon={LayoutDashboard} label="Tổng quan" collapsed={navCollapsed} onClick={onNavigate} end />
                    <NavItem to="/transactions" icon={FileText} label="Giao dịch" collapsed={navCollapsed} onClick={onNavigate} />
                    <NavItem to="/customers" icon={Users} label="Khách hàng" collapsed={navCollapsed} onClick={onNavigate} />
                    <NavItem to="/interest-configs" icon={Calculator} label="Cấu hình lãi suất" collapsed={navCollapsed} onClick={onNavigate} />
                    <NavItem to="/reports" icon={BarChart3} label="Báo cáo" collapsed={navCollapsed} onClick={onNavigate} />
                    {user?.role === 'ADMIN' && (
                        <>
                            <NavItem to="/users" icon={Users} label="Người dùng" collapsed={navCollapsed} onClick={onNavigate} />
                            <NavItem to="/backup-data" icon={DatabaseBackup} label="Backup Data" collapsed={navCollapsed} onClick={onNavigate} />
                        </>
                    )}
                    <NavItem to="/settings" icon={SettingsIcon} label="Cài đặt" collapsed={navCollapsed} onClick={onNavigate} />
                    <NavItem to="/info" icon={Info} label="Thông tin" collapsed={navCollapsed} onClick={onNavigate} />
                    <NavItem to="/guide" icon={BookOpen} label="Hướng dẫn" collapsed={navCollapsed} onClick={onNavigate} />
                </nav>

                <div className="p-3 lg:p-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                    <div className={clsx("bg-slate-50 rounded-xl border border-slate-100 transition-all duration-300", isExpanded ? "p-3" : "p-2 flex justify-center")}>
                        <div className={clsx("flex items-center gap-2", isExpanded ? "" : "justify-center flex-col")}>
                            <div className="w-7 h-7 min-w-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-[10px] uppercase">
                                {userInitials}
                            </div>

                            {isExpanded ? (
                                <>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="text-xs font-semibold text-slate-800 truncate leading-tight">{userDisplayName}</p>
                                        <div className="mt-1">
                                            <span className={clsx(
                                                "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border",
                                                user?.role === 'ADMIN'
                                                    ? "bg-purple-50 text-purple-700 border-purple-100"
                                                    : "bg-slate-100 text-slate-600 border-slate-200"
                                            )}>
                                                {user?.role || 'USER'}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="p-1.5 min-w-9 min-h-9 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Đăng xuất"
                                        aria-label="Đăng xuất"
                                    >
                                        <LogOut size={15} />
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={handleLogout}
                                    className="mt-1.5 p-1.5 min-w-9 min-h-9 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Đăng xuất"
                                    aria-label="Đăng xuất"
                                >
                                    <LogOut size={15} />
                                </button>
                            )}
                        </div>
                        {isExpanded && (
                            <div className="text-[10px] text-slate-400 text-center mt-2 font-mono" title={`Updated: ${appInfo?.updated_at}`}>
                                v{appInfo?.version || '...'}
                            </div>
                        )}
                    </div>
                </div>
            </aside>

            {/* Main column */}
            <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
                <header className="lg:hidden shrink-0 flex items-center gap-2 px-3 py-2.5 border-b border-slate-200 bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/80 z-30">
                    <button
                        type="button"
                        onClick={() => setMobileNavOpen(true)}
                        className="p-2 min-w-10 min-h-10 rounded-lg text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        aria-expanded={mobileNavOpen}
                        aria-controls="app-sidebar"
                        aria-label="Mở menu điều hướng"
                    >
                        <Menu size={20} />
                    </button>
                    <AppBrandLogo
                        variant="full"
                        alt=""
                        className="h-8 w-auto max-w-[6.5rem] shrink-0 rounded-md object-left object-contain"
                        fallbackClassName="h-8 w-8 text-[10px]"
                    />
                    <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm text-slate-900 truncate">
                            {appInfo?.name || 'FastAccounting'}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">{userDisplayName}</p>
                    </div>
                </header>

                <main id="main-content" className="flex-1 flex flex-col overflow-hidden relative min-h-0" tabIndex={-1}>
                    <div className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-50 scroll-smooth overscroll-y-contain">
                        <div className="w-full p-3 sm:p-4 lg:p-6 xl:p-8 min-h-full max-w-[1400px] mx-auto">
                            <Outlet />
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
