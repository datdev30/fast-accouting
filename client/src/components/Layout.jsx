import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Calculator, FileText, Menu, X, ChevronLeft, ChevronRight, LogOut, BarChart3, Info, BookOpen, DatabaseBackup } from 'lucide-react';
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
                // Tablet: ensure minimum touch target size (44px)
                "md:min-h-[44px] md:py-3",
                isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                    : "text-slate-600 hover:bg-slate-50 hover:text-blue-600",
                collapsed && "justify-center px-2"
            )}
            title={collapsed ? label : undefined}
        >
            <Icon size={20} className={clsx("transition-transform group-hover:scale-110 md:w-5 md:h-5", isActive && "text-white")} />
            {!collapsed && <span className="font-medium flex-1 whitespace-nowrap overflow-hidden transition-all duration-300 md:text-base">{label}</span>}
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
    // Initialize sidebar state: collapsed on tablet (768-1023px), open on desktop (>=1024px)
    const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
        if (typeof window !== 'undefined') {
            const isTablet = window.matchMedia('(min-width: 768px) and (max-width: 1023px)').matches;
            return !isTablet; // Collapsed on tablet, open on desktop
        }
        return true;
    });
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

    // Handle tablet breakpoint changes - auto-collapse sidebar on tablet
    useEffect(() => {
        const handleResize = () => {
            const isTablet = window.matchMedia('(min-width: 768px) and (max-width: 1023px)').matches;
            const isDesktop = window.matchMedia('(min-width: 1024px)').matches;
            
            // Auto-collapse on tablet, auto-expand on desktop (unless user manually toggled)
            if (isTablet && isSidebarOpen) {
                setIsSidebarOpen(false);
            } else if (isDesktop && !isSidebarOpen) {
                // Only auto-expand on desktop if we're not in a manual collapsed state
                // This preserves user preference
            }
        };

        window.addEventListener('resize', handleResize);
        // Check on mount
        handleResize();
        
        return () => window.removeEventListener('resize', handleResize);
    }, [isSidebarOpen]);

    const closeMobileSidebar = () => setIsMobileSidebarOpen(false);

    // Sidebar is expanded if it's open on desktop OR if the mobile sidebar is active
    const isExpanded = isSidebarOpen || isMobileSidebarOpen;

    return (
        <div className="flex h-dvh bg-slate-50 font-sans">
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
                    "bg-white border-r border-slate-100 flex flex-col shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)] z-50 transition-all duration-300 ease-in-out",
                    // Desktop (>=1024px): Always visible, collapsible
                    // Tablet (768-1023px): Collapsed by default (w-20), can be toggled
                    // Mobile: Initially hidden by translation, always rendered
                    isSidebarOpen ? "md:w-72 lg:w-72" : "md:w-20 lg:w-20",
                    // Mobile: Overlay from left, full height
                    "md:relative fixed inset-y-0 left-0",
                    isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
                    "w-72 pt-[env(safe-area-inset-top)] md:pt-0" // Add safe area padding for mobile sidebar
                )}
            >
                {/* Mobile Close Button */}
                <button
                    onClick={closeMobileSidebar}
                    className="absolute right-4 top-4 md:top-4 mt-[env(safe-area-inset-top)] md:mt-0 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg md:hidden"
                    aria-label="Close menu"
                >
                    <X size={20} />
                </button>

                {/* Desktop & Tablet Toggle Button */}
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="hidden md:block absolute -right-3 top-9 bg-white border border-slate-200 p-1.5 rounded-full text-slate-400 hover:text-blue-600 shadow-sm z-20 transition-colors md:min-w-[44px] md:min-h-[44px] md:flex md:items-center md:justify-center"
                    aria-label="Toggle sidebar"
                >
                    {isSidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                </button>

                <div className={clsx("p-6", isExpanded ? "pb-6" : "md:pb-4 md:flex md:justify-center")}>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-10 h-10 min-w-[2.5rem] rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                            <span className="font-bold text-xl">F</span>
                        </div>
                        <div className={clsx("overflow-hidden transition-all duration-300", isExpanded ? "opacity-100 w-auto" : "md:opacity-0 md:w-0 md:hidden")}>
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

                <nav className="flex-1 space-y-2 px-2 overflow-y-auto">
                    <NavItem to="/overview" icon={LayoutDashboard} label="Tổng quan" collapsed={!isExpanded} onClick={closeMobileSidebar} />
                    <NavItem to="/transactions" icon={FileText} label="Giao dịch" collapsed={!isExpanded} onClick={closeMobileSidebar} />
                    <NavItem to="/customers" icon={Users} label="Khách hàng" collapsed={!isExpanded} onClick={closeMobileSidebar} />
                    <NavItem to="/interest-configs" icon={Calculator} label="Cấu hình lãi suất" collapsed={!isExpanded} onClick={closeMobileSidebar} />
                    <NavItem to="/reports" icon={BarChart3} label="Báo cáo" collapsed={!isExpanded} onClick={closeMobileSidebar} />
                    {user?.role === 'ADMIN' && (
                        <>
                            <NavItem to="/users" icon={Users} label="Người dùng" collapsed={!isExpanded} onClick={closeMobileSidebar} />
                            <NavItem to="/backup-data" icon={DatabaseBackup} label="Backup Data" collapsed={!isExpanded} onClick={closeMobileSidebar} />
                        </>
                    )}
                    <NavItem to="/info" icon={Info} label="Thông tin" collapsed={!isExpanded} onClick={closeMobileSidebar} />
                    <NavItem to="/guide" icon={BookOpen} label="Hướng dẫn" collapsed={!isExpanded} onClick={closeMobileSidebar} />
                </nav>

                <div className="p-6">
                    <div className={clsx("bg-slate-50 rounded-2xl border border-slate-100 transition-all duration-300", isExpanded ? "p-4" : "md:p-2 md:flex md:justify-center p-4")}>
                        <div className={clsx("flex items-center gap-3", isExpanded ? "" : "md:justify-center md:flex-col")}>
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
                                        className="p-2 md:min-w-[44px] md:min-h-[44px] md:flex md:items-center md:justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Đăng xuất"
                                    >
                                        <LogOut size={16} />
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={handleLogout}
                                    className="md:mt-2 p-2 md:min-w-[44px] md:min-h-[44px] md:flex md:items-center md:justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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
                {/* Mobile Header (Absolute & Fixed to top of Main) */}
                <header className="absolute top-0 left-0 right-0 h-[calc(4rem+env(safe-area-inset-top))] bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center px-4 sm:px-6 justify-between md:hidden z-30 pt-[env(safe-area-inset-top)] transition-all">
                    <button
                        onClick={() => setIsMobileSidebarOpen(true)}
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        aria-label="Toggle menu"
                    >
                        <Menu size={24} />
                    </button>
                    <span className="font-bold text-lg text-blue-600 absolute left-1/2 top-1/2 -translate-x-1/2 mt-[calc(env(safe-area-inset-top)/2)]">FastAccounting</span>
                    <div className="w-10" /> {/* Spacer */}
                </header>

                {/* Content Area */}
                <div className="flex-1 overflow-auto bg-slate-50 w-full h-full">
                    {/* Padding top to push content below fixed header on mobile */}
                    {/* Tablet: reduced padding to maximize content area */}
                    <div className="w-full p-4 sm:p-6 md:p-5 lg:p-8 pt-[calc(5rem+env(safe-area-inset-top))] md:pt-5 lg:pt-8 min-h-full max-w-[1800px] md:mx-auto">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
}
