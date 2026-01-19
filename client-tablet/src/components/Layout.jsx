import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Calculator, FileText, ChevronLeft, ChevronRight, BarChart3, Info, BookOpen, DatabaseBackup, Home, Settings } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../context/AuthContext';

const BottomNavItem = ({ to, icon: Icon, label }) => {
    const location = useLocation();
    const isActive = location.pathname === to || (to === '/overview' && location.pathname === '/');

    return (
        <Link
            to={to}
            className={clsx(
                "flex-1 flex flex-col items-center justify-center gap-1 py-3 min-h-[56px] transition-colors duration-200 cursor-pointer",
                isActive 
                    ? "text-[var(--color-primary)]" 
                    : "text-slate-400 hover:text-slate-600 active:text-[var(--color-primary)]"
            )}
        >
            <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-xs font-medium">{label}</span>
        </Link>
    );
};

const NavItem = ({ to, icon: Icon, label, collapsed, onClick }) => {
    const location = useLocation();
    const isActive = location.pathname === to;

    return (
        <Link
            to={to}
            onClick={onClick}
            className={clsx(
                "group flex items-center gap-4 px-6 py-4 rounded-xl transition-colors duration-200 mx-2 min-h-[52px] tablet-lg:min-h-[48px] tablet:min-h-[48px] cursor-pointer",
                isActive
                    ? "bg-[var(--color-primary)] text-white shadow-lg"
                    : "text-slate-600 hover:bg-slate-50 hover:text-[var(--color-primary)] active:bg-slate-100",
                collapsed && "justify-center px-3 tablet-lg:px-2 tablet:px-2"
            )}
            title={collapsed ? label : undefined}
        >
            <Icon size={24} className={clsx(
                "tablet-lg:w-5 tablet-lg:h-5 tablet:w-5 tablet:h-5",
                isActive && "text-white"
            )} />
            {!collapsed && <span className="font-medium flex-1 whitespace-nowrap overflow-hidden transition-all duration-300 text-lg tablet-lg:text-base tablet:text-base">{label}</span>}
            {!collapsed && isActive && <ChevronRight size={20} className="opacity-50 tablet-lg:w-4 tablet-lg:h-4 tablet:w-4 tablet:h-4" />}
        </Link>
    );
};

export default function Layout() {
    const { user } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const isExpanded = isSidebarOpen;

    // Tự động điều chỉnh sidebar khi xoay màn hình
    useEffect(() => {
        let previousWidth = window.innerWidth;
        let isInitialMount = true;
        
        const handleResize = () => {
            // Bỏ qua resize events nhỏ (chỉ xử lý khi thay đổi đáng kể)
            const currentWidth = window.innerWidth;
            const widthDiff = Math.abs(currentWidth - previousWidth);
            
            // Chỉ xử lý khi thay đổi đáng kể (ít nhất 100px) hoặc chuyển qua breakpoint
            if (widthDiff < 100 && !isInitialMount) {
                previousWidth = currentWidth;
                return;
            }
            
            const wasPortrait = previousWidth < 1024;
            const isNowLandscape = currentWidth >= 1024;
            
            // Chỉ xử lý khi thực sự chuyển từ portrait sang landscape (lần đầu hoặc khi resize đáng kể)
            if (isNowLandscape && wasPortrait) {
                // Khi chuyển từ portrait sang landscape, mặc định thu gọn (navigation rail)
                // Nhưng chỉ khi chưa có state đã lưu
                const savedState = localStorage.getItem('sidebarOpen');
                if (savedState === null) {
                    setIsSidebarOpen(false);
                }
            }
            
            previousWidth = currentWidth;
            isInitialMount = false;
        };

        // Kiểm tra ngay khi component mount
        const initialWidth = window.innerWidth;
        if (initialWidth >= 1024) {
            // Nếu đã ở landscape, khôi phục trạng thái đã lưu
            const savedState = localStorage.getItem('sidebarOpen');
            if (savedState !== null) {
                setIsSidebarOpen(savedState === 'true');
            } else {
                // Mặc định thu gọn khi lần đầu vào landscape
                setIsSidebarOpen(false);
            }
        }

        // Lắng nghe sự kiện resize và orientation change
        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', () => {
            // Đợi một chút để orientation change hoàn tất
            setTimeout(handleResize, 200);
        });

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    // Lưu trạng thái sidebar vào localStorage khi thay đổi (chỉ khi ở landscape)
    useEffect(() => {
        if (window.innerWidth >= 1024) {
            localStorage.setItem('sidebarOpen', isSidebarOpen.toString());
        }
    }, [isSidebarOpen]);

    return (
        <div className="flex h-dvh bg-slate-50 font-sans overflow-x-hidden max-w-full relative">
            {/* Sidebar - Responsive: NavigationRail on tablet landscape, full sidebar on tablet portrait/desktop */}
            <aside
                className={clsx(
                    "bg-white border-r border-slate-100 flex flex-col shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)] z-50 transition-all duration-300 ease-in-out relative",
                    // Portrait (<1024px): Ẩn — dùng BottomNav
                    "hidden tablet-lg:flex",
                    // Desktop (>1280px): Full sidebar - chỉ mở rộng khi isSidebarOpen
                    isSidebarOpen && "desktop:w-80",
                    // Tablet portrait (768-1023px): Toggle giữa rail và sidebar
                    isSidebarOpen ? "tablet:w-80" : "tablet:w-24 tablet:min-w-[96px]",
                    // Tablet landscape (≥1024px): Toggle giữa rail và sidebar
                    // Đây là breakpoint chính cho landscape mode
                    isSidebarOpen 
                        ? "tablet-lg:w-80 tablet-lg:min-w-[320px]" 
                        : "tablet-lg:w-20 tablet-lg:min-w-[80px]"
                )}
            >
                {/* Toggle Button - Tablet/Desktop only; nhỏ gọn, tinh tế hơn ở landscape */}
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsSidebarOpen(prev => {
                            const newState = !prev;
                            console.log('[Sidebar Toggle] Current:', prev, '→ New:', newState, 'Width:', window.innerWidth);
                            return newState;
                        });
                    }}
                    className={clsx(
                        "absolute z-[60] flex items-center justify-center cursor-pointer",
                        "rounded-full bg-white text-slate-400 transition-all duration-200",
                        "border border-slate-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)]",
                        "hover:bg-teal-50/70 hover:border-teal-100 hover:text-[var(--color-primary)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)]",
                        "active:scale-95",
                        "pointer-events-auto touch-manipulation",
                        // Base size and position
                        "min-w-[40px] min-h-[40px] p-2 top-6 -right-3",
                        // Hidden on mobile, visible on tablet+
                        "hidden tablet:flex",
                        // Landscape (tablet-lg) adjustments - đảm bảo nút luôn hiển thị
                        "tablet-lg:min-w-[40px] tablet-lg:min-h-[40px] tablet-lg:p-2 tablet-lg:top-6 tablet-lg:-right-3"
                    )}
                    aria-label="Thu gọn / Mở rộng menu"
                    type="button"
                >
                    {isSidebarOpen ? (
                        <ChevronLeft size={20} className="tablet-lg:w-5 tablet-lg:h-5" />
                    ) : (
                        <ChevronRight size={20} className="tablet-lg:w-5 tablet-lg:h-5" />
                    )}
                </button>

                <div className={clsx(
                    "p-8 tablet:p-6 tablet-lg:p-4",
                    isExpanded ? "pb-8 tablet:pb-6 tablet-lg:pb-4" : "pb-4 flex justify-center tablet-lg:pb-3"
                )}>
                    <div className="flex items-center gap-3 mb-1 tablet-lg:flex-col tablet-lg:gap-2">
                        <div className="w-20 h-20 min-w-[5rem] tablet-lg:w-16 tablet-lg:h-16 tablet-lg:min-w-[4rem] rounded-xl overflow-hidden flex items-center justify-center bg-white shadow-lg border border-slate-100">
                            <img src="/logo/CP.png" alt="Đại lý Công Phú" className="w-full h-full object-contain p-1" />
                        </div>
                        <div className={clsx(
                            "overflow-hidden transition-all duration-300",
                            isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0 hidden tablet-lg:block tablet-lg:opacity-0 tablet-lg:w-0"
                        )}>
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight whitespace-nowrap tablet:text-xl">
                                Đại lý Công Phú
                            </h1>
                        </div>
                    </div>
                </div>

                <div className="px-8 mb-4">
                    <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
                </div>

                <nav className="flex-1 space-y-3 px-4 tablet-lg:px-2 tablet:px-3 overflow-y-auto">
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
                    <NavItem to="/settings" icon={Settings} label="Cài đặt" collapsed={!isExpanded} onClick={() => {}} />
                    <NavItem to="/info" icon={Info} label="Thông tin" collapsed={!isExpanded} onClick={() => {}} />
                    <NavItem to="/guide" icon={BookOpen} label="Hướng dẫn" collapsed={!isExpanded} onClick={() => {}} />
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden relative">
                {/* Content Area - Responsive padding for tablet */}
                <div className="flex-1 overflow-auto bg-slate-50 w-full h-full">
                    <div className="w-full p-6 pb-24 tablet-lg:px-3 tablet-lg:py-6 tablet-lg:pb-6 min-h-full max-w-[2000px] mx-auto overflow-x-hidden">
                        <Outlet />
                    </div>
                </div>
            </main>

            {/* Bottom Nav - Chỉ Portrait (<1024px) */}
            <nav
                className="flex tablet-lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-[0_-4px_24px_-8px_rgba(0,0,0,0.1)]"
                style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
                <BottomNavItem to="/transactions" icon={FileText} label="Giao dịch" />
                <BottomNavItem to="/customers" icon={Users} label="Khách hàng" />
                <BottomNavItem to="/overview" icon={Home} label="Trang chủ" />
                <BottomNavItem to="/reports" icon={BarChart3} label="Phân tích" />
                <BottomNavItem to="/settings" icon={Settings} label="Cài đặt" />
            </nav>
        </div>
    );
}
