import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Calculator, FileText, ChevronLeft, ChevronRight, LogOut, BarChart3, Info, BookOpen, DatabaseBackup, Settings as SettingsIcon } from 'lucide-react';
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
                "group flex items-center gap-3 lg:gap-4 rounded-xl transition-all duration-200 mx-2 min-h-[48px] lg:min-h-[52px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
                isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                    : "text-slate-600 hover:bg-slate-50 hover:text-blue-600",
                collapsed ? "justify-center px-3" : "px-4 lg:px-6 py-3 lg:py-4"
            )}
            title={collapsed ? label : undefined}
            aria-current={isActive ? "page" : undefined}
        >
            <Icon 
                size={20} 
                className={clsx(
                    "flex-shrink-0 transition-transform group-hover:scale-110 lg:w-6 lg:h-6", 
                    isActive && "text-white"
                )} 
            />
            {!collapsed && <span className="font-medium flex-1 whitespace-nowrap overflow-hidden transition-all duration-300 text-base lg:text-lg">{label}</span>}
            {!collapsed && isActive && <ChevronRight size={20} className="opacity-50 flex-shrink-0" />}
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

    const isExpanded = isSidebarOpen;

    return (
        <div className="flex h-dvh bg-slate-50 font-sans overflow-x-hidden max-w-full">
            {/* Sidebar - Desktop only */}
            <aside
                className={clsx(
                    "bg-white border-r border-slate-200 flex flex-col shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)] z-50 transition-all duration-300 ease-in-out relative",
                    isSidebarOpen ? "w-64 lg:w-72" : "w-20"
                )}
                aria-label="Main navigation"
            >
                {/* Toggle Button */}
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="absolute -right-2.5 top-9 bg-white border border-slate-200 p-1.5 rounded-full text-slate-400 hover:text-blue-600 hover:border-blue-200 shadow-sm z-20 transition-colors w-8 h-8 flex items-center justify-center"
                    aria-label="Toggle sidebar"
                >
                    {isSidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                </button>

                <div className={clsx("p-5 lg:p-6 xl:p-8", isExpanded ? "pb-5 lg:pb-6 xl:pb-8" : "pb-4 flex justify-center")}>
                    <div className="flex items-center gap-2 lg:gap-3 mb-1">
                        <div className="w-12 h-12 lg:w-14 lg:h-14 min-w-[3rem] lg:min-w-[3.5rem] rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                            <span className="font-bold text-xl lg:text-2xl">F</span>
                        </div>
                        <div className={clsx("overflow-hidden transition-all duration-300", isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0 hidden")}>
                            <h1 className="text-xl lg:text-2xl font-bold text-slate-900 tracking-tight whitespace-nowrap">
                                FastAcc
                            </h1>
                            <p className="text-xs lg:text-sm text-slate-500 font-medium whitespace-nowrap">Accounting System</p>
                        </div>
                    </div>
                </div>

                <div className="px-5 lg:px-6 xl:px-8 mb-4">
                    <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
                </div>

                <nav className="flex-1 space-y-3 px-4 overflow-y-auto">
                    <NavItem to="/overview" icon={LayoutDashboard} label="Tổng quan" collapsed={!isExpanded} onClick={() => {}} />
                    <NavItem to="/transactions" icon={FileText} label="Giao dịch" collapsed={!isExpanded} onClick={() => {}} />
                    <NavItem to="/customers" icon={Users} label="Khách hàng" collapsed={!isExpanded} onClick={() => {}} />
                    <NavItem to="/interest-configs" icon={Calculator} label="Cấu hình lãi suất" collapsed={!isExpanded} onClick={() => {}} />
                    <NavItem to="/reports" icon={BarChart3} label="Báo cáo" collapsed={!isExpanded} onClick={() => {}} />
                    {user?.role === 'ADMIN' && (
                        <>
                            <NavItem to="/users" icon={Users} label="Người dùng" collapsed={!isExpanded} onClick={() => {}} />
                            <NavItem to="/backup-data" icon={DatabaseBackup} label="Backup Data" collapsed={!isExpanded} onClick={() => {}} />
                        </>
                    )}
                    <NavItem to="/settings" icon={SettingsIcon} label="Cài đặt" collapsed={!isExpanded} onClick={() => {}} />
                    <NavItem to="/info" icon={Info} label="Thông tin" collapsed={!isExpanded} onClick={() => {}} />
                    <NavItem to="/guide" icon={BookOpen} label="Hướng dẫn" collapsed={!isExpanded} onClick={() => {}} />
                </nav>

                <div className="p-6">
                    <div className={clsx("bg-slate-50 rounded-2xl border border-slate-100 transition-all duration-300", isExpanded ? "p-4" : "p-2 flex justify-center")}>
                        <div className={clsx("flex items-center gap-3", isExpanded ? "" : "justify-center flex-col")}>
                            <div className="w-8 h-8 min-w-[2rem] rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs uppercase">
                                {userInitials}
                            </div>

                            {isExpanded ? (
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
                                        className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Đăng xuất"
                                    >
                                        <LogOut size={16} />
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={handleLogout}
                                    className="mt-2 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Đăng xuất"
                                >
                                    <LogOut size={16} />
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

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden relative">
                {/* Content Area */}
                <div className="flex-1 overflow-auto bg-slate-50 w-full h-full">
                    <div className="w-full p-6 lg:p-8 xl:p-10 min-h-full max-w-[1600px] mx-auto overflow-x-hidden">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
}
