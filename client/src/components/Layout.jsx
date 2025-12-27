import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Calculator, FileText, Menu, ChevronLeft, ChevronRight, LogOut, BarChart3 } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../context/AuthContext';

const NavItem = ({ to, icon: Icon, label, collapsed }) => {
    const location = useLocation();
    const isActive = location.pathname === to;

    return (
        <Link
            to={to}
            className={clsx(
                "group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 mx-2",
                isActive
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-200"
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
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="flex h-screen bg-slate-50 font-sans">
            {/* Sidebar */}
            <aside
                className={clsx(
                    "bg-white border-r border-slate-100 hidden md:flex flex-col shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)] z-10 transition-all duration-300 ease-in-out relative",
                    isSidebarOpen ? "w-72" : "w-20"
                )}
            >
                {/* Toggle Button */}
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="absolute -right-3 top-9 bg-white border border-slate-200 p-1 rounded-full text-slate-400 hover:text-blue-600 shadow-sm z-20 transition-colors"
                >
                    {isSidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
                </button>

                <div className={clsx("p-6", isSidebarOpen ? "pb-6" : "pb-4 flex justify-center")}>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-10 h-10 min-w-[2.5rem] rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                            <span className="font-bold text-xl">F</span>
                        </div>
                        <div className={clsx("overflow-hidden transition-all duration-300", isSidebarOpen ? "opacity-100 w-auto" : "opacity-0 w-0 hidden")}>
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
                    <NavItem to="/overview" icon={LayoutDashboard} label="Tổng quan" collapsed={!isSidebarOpen} />
                    <NavItem to="/transactions" icon={FileText} label="Giao dịch" collapsed={!isSidebarOpen} />
                    <NavItem to="/customers" icon={Users} label="Khách hàng" collapsed={!isSidebarOpen} />
                    <NavItem to="/interest-configs" icon={Calculator} label="Cấu hình lãi suất" collapsed={!isSidebarOpen} />
                    <NavItem to="/reports" icon={BarChart3} label="Báo cáo" collapsed={!isSidebarOpen} />
                </nav>

                <div className="p-6">
                    <div className={clsx("bg-slate-50 rounded-2xl border border-slate-100 transition-all duration-300", isSidebarOpen ? "p-4" : "p-2 flex justify-center")}>
                        <div className={clsx("flex items-center gap-3", isSidebarOpen ? "" : "justify-center flex-col")}>
                            <div className="w-8 h-8 min-w-[2rem] rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs uppercase">
                                {user?.username?.substring(0, 2) || 'AD'}
                            </div>

                            {isSidebarOpen ? (
                                <>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="text-sm font-bold text-slate-800 truncate">{user?.username || 'User'}</p>
                                        <p className="text-xs text-slate-500">Online</p>
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
                                    className="mt-2 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Đăng xuất"
                                >
                                    <LogOut size={16} />
                                </button>
                            )}
                        </div>
                        {isSidebarOpen && (
                            <div className="text-[10px] text-slate-400 text-center mt-2 font-mono">
                                v1.0.0
                            </div>
                        )}
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden relative">
                {/* Mobile Header */}
                <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center px-6 justify-between md:hidden z-20 sticky top-0">
                    <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">FastAccounting</span>
                    <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"><Menu /></button>
                </header>

                <div className="flex-1 overflow-auto bg-slate-50">
                    <div className="w-full p-6 md:p-8">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
}
