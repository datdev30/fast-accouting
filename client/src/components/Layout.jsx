import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Calculator, FileText, Menu, X, ChevronLeft, ChevronRight, LogOut, BarChart3, Info, BookOpen } from 'lucide-react';
import { clsx } from 'clsx';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { getAppInfo } from '../services/api';

const NavItem = ({ to, icon: Icon, label, collapsed, onClick }) => {
    const location = useLocation();
    const isActive = location.pathname === to;

    return (
        <Link
            to={to}
            onClick={onClick}
            className={clsx(
                "group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 mx-2",
                isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                    : "text-slate-600 hover:bg-slate-50 hover:text-blue-600",
                collapsed && "justify-center px-2"
            )}
            title={collapsed ? label : undefined}
        >
            <Icon size={20} className={clsx("transition-transform group-hover:scale-110", isActive && "text-white")} />
            {!collapsed && <span className="font-medium flex-1 whitespace-nowrap overflow-hidden transition-all duration-300">{label}</span>}
            {!collapsed && isActive && <ChevronRight size={16} className="opacity-50" />}
        </Link>
    );
};

export default function Layout() {
    const { user, logout } = useAuth();

    const { data: appInfo } = useQuery({
        queryKey: ['app-info'],
        queryFn: getAppInfo,
        staleTime: 5 * 60 * 1000 // cache for 5 minutes
    });

    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

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

    // Close mobile sidebar when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (isMobileSidebarOpen && !e.target.closest('aside') && !e.target.closest('button[aria-label="Toggle menu"]')) {
                setIsMobileSidebarOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isMobileSidebarOpen]);

    // Prevent body scroll when mobile sidebar is open
    useEffect(() => {
        if (isMobileSidebarOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isMobileSidebarOpen]);

    const closeMobileSidebar = () => setIsMobileSidebarOpen(false);

    return (
        <div className="flex h-screen bg-slate-50 font-sans">
            {/* Mobile Backdrop */}
            {isMobileSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
                    onClick={closeMobileSidebar}
                />
            )}

            {/* Sidebar */}
            <aside
                className={clsx(
                    "bg-white border-r border-slate-100 flex flex-col shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)] z-50 transition-all duration-300 ease-in-out relative",
                    // Desktop: Always visible, collapsible
                    "hidden md:flex",
                    isSidebarOpen ? "md:w-72" : "md:w-20",
                    // Mobile: Overlay from left
                    "md:relative fixed inset-y-0 left-0",
                    isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
                    "w-72" // Full width on mobile
                )}
            >
                {/* Mobile Close Button */}
                <button
                    onClick={closeMobileSidebar}
                    className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg md:hidden"
                    aria-label="Close menu"
                >
                    <X size={20} />
                </button>

                {/* Desktop Toggle Button */}
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="hidden md:block absolute -right-3 top-9 bg-white border border-slate-200 p-1 rounded-full text-slate-400 hover:text-blue-600 shadow-sm z-20 transition-colors"
                    aria-label="Toggle sidebar"
                >
                    {isSidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
                </button>

                <div className={clsx("p-6", isSidebarOpen ? "pb-6" : "md:pb-4 md:flex md:justify-center")}>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-10 h-10 min-w-[2.5rem] rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                            <span className="font-bold text-xl">F</span>
                        </div>
                        <div className={clsx("overflow-hidden transition-all duration-300", isSidebarOpen ? "opacity-100 w-auto" : "md:opacity-0 md:w-0 md:hidden")}>
                            <h1 className="text-xl font-bold text-slate-900 tracking-tight whitespace-nowrap">
                                FastAcc
                            </h1>
                            <p className="text-xs text-slate-500 font-medium whitespace-nowrap">Accounting System</p>
                        </div>
                    </div>
                </div>

                <div className="px-6 mb-4">
                    <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
                </div>

                <nav className="flex-1 space-y-1.5 px-2">
                    <NavItem to="/overview" icon={LayoutDashboard} label="Tổng quan" collapsed={!isSidebarOpen} onClick={closeMobileSidebar} />
                    <NavItem to="/transactions" icon={FileText} label="Giao dịch" collapsed={!isSidebarOpen} onClick={closeMobileSidebar} />
                    <NavItem to="/customers" icon={Users} label="Khách hàng" collapsed={!isSidebarOpen} onClick={closeMobileSidebar} />
                    <NavItem to="/interest-configs" icon={Calculator} label="Cấu hình lãi suất" collapsed={!isSidebarOpen} onClick={closeMobileSidebar} />
                    <NavItem to="/reports" icon={BarChart3} label="Báo cáo" collapsed={!isSidebarOpen} onClick={closeMobileSidebar} />
                    {user?.role === 'ADMIN' && (
                        <NavItem to="/users" icon={Users} label="Người dùng" collapsed={!isSidebarOpen} onClick={closeMobileSidebar} />
                    )}
                    <NavItem to="/info" icon={Info} label="Thông tin" collapsed={!isSidebarOpen} onClick={closeMobileSidebar} />
                    <NavItem to="/guide" icon={BookOpen} label="Hướng dẫn" collapsed={!isSidebarOpen} onClick={closeMobileSidebar} />
                </nav>

                <div className="p-6">
                    <div className={clsx("bg-slate-50 rounded-2xl border border-slate-100 transition-all duration-300", isSidebarOpen ? "p-4" : "md:p-2 md:flex md:justify-center p-4")}>
                        <div className={clsx("flex items-center gap-3", isSidebarOpen ? "" : "md:justify-center md:flex-col")}>
                            <div className="w-8 h-8 min-w-[2rem] rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs uppercase">
                                {userInitials}
                            </div>

                            {isSidebarOpen ? (
                                <>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="text-sm font-semibold text-slate-800 truncate leading-tight">{userDisplayName}</p>
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
                                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Đăng xuất"
                                    >
                                        <LogOut size={16} />
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={handleLogout}
                                    className="md:mt-2 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Đăng xuất"
                                >
                                    <LogOut size={16} />
                                </button>
                            )}
                        </div>
                        {isSidebarOpen && (
                            <div className="text-[10px] text-slate-400 text-center mt-2 font-mono" title={`Updated: ${appInfo?.updated_at}`}>
                                v{appInfo?.version || '...'}
                            </div>
                        )}
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden relative">
                {/* Mobile Header */}
                <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center px-4 sm:px-6 justify-between md:hidden z-20 sticky top-0">
                    <button
                        onClick={() => setIsMobileSidebarOpen(true)}
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        aria-label="Toggle menu"
                    >
                        <Menu size={24} />
                    </button>
                    <span className="font-bold text-lg text-blue-600">FastAccounting</span>
                    <div className="w-10" /> {/* Spacer for centering */}
                </header>

                <div className="flex-1 overflow-auto bg-slate-50">
                    <div className="w-full p-4 sm:p-6 md:p-8">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
}
