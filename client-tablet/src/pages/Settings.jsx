import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Settings as SettingsIcon, Info, BookOpen, Calculator, Users, DatabaseBackup, LogOut, ChevronRight, CreditCard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const SettingLink = ({ to, icon: Icon, label, desc }) => (
    <Link
        to={to}
        className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-100 hover:border-teal-200 hover:bg-slate-50/50 transition-all group"
    >
        <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center group-hover:bg-teal-50 group-hover:text-[var(--color-primary)] transition-colors">
            <Icon size={24} />
        </div>
        <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-800">{label}</p>
            {desc && <p className="text-sm text-slate-500 mt-0.5">{desc}</p>}
        </div>
        <ChevronRight size={20} className="text-slate-300 group-hover:text-[var(--color-primary)] shrink-0" />
    </Link>
);

export default function Settings() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const isAdmin = user?.role === 'ADMIN';

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
            <div>
                <h2 className="section-title">Cài đặt</h2>
                <p className="section-subtitle mt-1">Thông tin, hướng dẫn và tùy chọn hệ thống</p>
            </div>

            <div className="space-y-3">
                <SettingLink to="/info" icon={Info} label="Thông tin" desc="Phiên bản, cập nhật hệ thống" />
                <SettingLink to="/guide" icon={BookOpen} label="Hướng dẫn" desc="Hướng dẫn sử dụng" />
                <SettingLink to="/interest-configs" icon={Calculator} label="Cấu hình lãi suất" desc="Thiết lập lãi vay" />
                <SettingLink to="/bank-account-config" icon={CreditCard} label="Cấu hình STK" desc="Thiết lập tài khoản ngân hàng" />
                {isAdmin && (
                    <>
                        <SettingLink to="/users" icon={Users} label="Người dùng" desc="Quản lý tài khoản" />
                        <SettingLink to="/backup-data" icon={DatabaseBackup} label="Sao lưu dữ liệu" desc="Backup & khôi phục" />
                    </>
                )}
            </div>

            <div className="pt-4">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-4 w-full p-4 rounded-2xl bg-white border border-red-100 hover:bg-red-50 hover:border-red-200 transition-all group"
                >
                    <div className="w-12 h-12 rounded-xl bg-red-50 text-red-500 flex items-center justify-center">
                        <LogOut size={24} />
                    </div>
                    <span className="font-semibold text-red-600">Đăng xuất</span>
                </button>
            </div>
        </div>
    );
}
