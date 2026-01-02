import React, { useState } from 'react';
import { BookOpen, Users, FileText, Calculator, ShieldAlert, ChevronDown, ChevronRight, Zap, CheckCircle2, AlertTriangle, Lightbulb } from 'lucide-react';
import { clsx } from 'clsx';

function GuideItem({ title, icon: Icon, children, isOpen, onToggle, color = 'blue' }) {
    const colors = {
        blue: 'bg-blue-100 text-blue-600',
        emerald: 'bg-emerald-100 text-emerald-600',
        amber: 'bg-amber-100 text-amber-600',
        purple: 'bg-purple-100 text-purple-600',
        rose: 'bg-red-100 text-red-600',
    };

    return (
        <div className={clsx("card overflow-hidden transition-all duration-300 border-2", isOpen ? "border-blue-200 shadow-lg" : "border-transparent")}>
            <button
                onClick={onToggle}
                className="w-full p-4 sm:p-6 flex items-center gap-4 text-left hover:bg-slate-50 transition-colors"
            >
                <div className={clsx("w-12 h-12 rounded-2xl flex items-center justify-center flex-none transition-transform duration-300", colors[color], isOpen && "scale-110")}>
                    <Icon size={24} />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-slate-800">{title}</h3>
                </div>
                <div className={clsx("p-2 rounded-full text-slate-400 transition-transform duration-300", isOpen && "rotate-180 bg-blue-50 text-blue-500")}>
                    <ChevronDown size={20} />
                </div>
            </button>
            <div
                className={clsx(
                    "grid transition-all duration-300 ease-in-out",
                    isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                )}
            >
                <div className="overflow-hidden">
                    <div className="p-6 pt-0 text-slate-600 leading-relaxed text-sm sm:text-base space-y-4">
                        <div className="h-px bg-slate-100 mb-6"></div>
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}

function SectionTitle({ children }) {
    return <h4 className="font-bold text-slate-900 flex items-center gap-2 mt-4 first:mt-0">{children}</h4>;
}

function Bullet({ children, type = 'dot' }) {
    return (
        <li className="flex items-start gap-3">
            <span className={clsx("mt-1.5 flex-none",
                type === 'check' && "text-emerald-500",
                type === 'warn' && "text-amber-500",
                type === 'dot' && "w-1.5 h-1.5 rounded-full bg-slate-300 mt-2.5"
            )}>
                {type === 'check' && <CheckCircle2 size={16} />}
                {type === 'warn' && <AlertTriangle size={16} />}
            </span>
            <span>{children}</span>
        </li>
    );
}

export default function Guide() {
    const [openIndex, setOpenIndex] = useState(0);

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Hướng Dẫn Sử Dụng</h2>
                <p className="text-slate-500 font-medium mt-1">Hệ thống quản lý tài chính FastAccounting</p>
            </div>

            <div className="space-y-4">
                <GuideItem
                    title="Bắt đầu nhanh (Quy trình chuẩn)"
                    icon={Zap}
                    isOpen={openIndex === 0}
                    onToggle={() => setOpenIndex(0)}
                    color="amber"
                >
                    <p className="mb-4">Để hệ thống hoạt động chính xác, hãy làm theo tuần tự:</p>
                    <ol className="space-y-3 relative border-l-2 border-slate-100 ml-3 pl-6">
                        <li className="relative">
                            <span className="absolute -left-[31px] w-6 h-6 rounded-full bg-slate-100 text-slate-500 font-bold text-xs flex items-center justify-center border-2 border-white">1</span>
                            <span className="font-bold text-slate-900">Tạo Cấu hình lãi suất</span>: Vào menu <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-bold border">Cấu hình lãi suất</span> tạo ít nhất 1 loại (VD: Tiền Mặt).
                        </li>
                        <li className="relative">
                            <span className="absolute -left-[31px] w-6 h-6 rounded-full bg-slate-100 text-slate-500 font-bold text-xs flex items-center justify-center border-2 border-white">2</span>
                            <span className="font-bold text-slate-900">Tạo Khách hàng</span>: Vào menu <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-bold border">Khách hàng</span> để thêm hồ sơ khách.
                        </li>
                        <li className="relative">
                            <span className="absolute -left-[31px] w-6 h-6 rounded-full bg-slate-100 text-slate-500 font-bold text-xs flex items-center justify-center border-2 border-white">3</span>
                            <span className="font-bold text-slate-900">Tạo Giao dịch</span>: Vào menu <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-bold border">Giao dịch</span> để ghi nợ/thu tiền.
                        </li>
                    </ol>
                </GuideItem>

                <GuideItem
                    title="1. Quản lý Lãi suất & Loại giao dịch"
                    icon={Calculator}
                    isOpen={openIndex === 1}
                    onToggle={() => setOpenIndex(openIndex === 1 ? -1 : 1)}
                    color="purple"
                >
                    <SectionTitle>Tại sao cần tạo trước?</SectionTitle>
                    <p>Các "Cấu hình lãi suất" chính là các <strong>loại giao dịch</strong> bạn sẽ chọn khi nhập liệu. Mỗi loại sẽ có mã (code) và mức lãi suất mặc định.</p>

                    <SectionTitle>Lưu ý quan trọng</SectionTitle>
                    <ul className="space-y-2">
                        <Bullet type="warn"><strong>Mã (Code)</strong>: Phải là duy nhất, viết liền không dấu (VD: <code>CAM_DO_XE</code>). Không thể sửa mã sau khi tạo.</Bullet>
                        <Bullet type="check"><strong>Lãi suất (%/tháng)</strong>: Nhập số thập phân (VD: <code>2.5</code>). Có thể sửa sau này.</Bullet>
                    </ul>
                </GuideItem>

                <GuideItem
                    title="2. Quản lý Khách hàng"
                    icon={Users}
                    isOpen={openIndex === 2}
                    onToggle={() => setOpenIndex(2)}
                    color="blue"
                >
                    <SectionTitle>Mẹo sử dụng</SectionTitle>
                    <ul className="space-y-2">
                        <Bullet type="check"><strong>Tìm kiếm nhanh</strong>: Gõ tên hoặc SĐT vào ô tìm kiếm để lọc danh sách.</Bullet>
                        <Bullet type="check"><strong>Xem nợ</strong>: Bấm nút "Chi tiết nợ" để xem toàn bộ lịch sử vay/trả và tính lãi.</Bullet>
                        <Bullet type="check"><strong>Chỉnh sửa</strong>: Bấm vào thẻ khách hàng để sửa thông tin hoặc <span className="text-red-500 font-bold">Xóa</span> khách hàng (sẽ xóa luôn lịch sử giao dịch).</Bullet>
                    </ul>
                </GuideItem>

                <GuideItem
                    title="3. Quản lý Giao dịch"
                    icon={FileText}
                    isOpen={openIndex === 3}
                    onToggle={() => setOpenIndex(3)}
                    color="emerald"
                >
                    <SectionTitle>Quy trình tạo mới</SectionTitle>
                    <ul className="space-y-2 mb-4">
                        <Bullet>Chọn khách hàng (có thể gõ tên để tìm nhanh).</Bullet>
                        <Bullet>Nhập nội dung chi tiết (ví dụ: "Vay tiền mua xe").</Bullet>
                        <Bullet>Chọn loại giao dịch (từ danh sách cấu hình đã tạo).</Bullet>
                        <Bullet>Nhập số tiền (hệ thống tự thêm dấu phẩy ngăn cách).</Bullet>
                    </ul>

                    <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 flex gap-3">
                        <Lightbulb className="text-amber-500 flex-none" size={20} />
                        <div className="text-sm text-amber-800">
                            <strong>Mẹo nhập liệu nhanh:</strong><br />
                            Khi cần nhập nhiều giao dịch liên tiếp, hãy tích vào ô <strong>"Tạo tiếp giao dịch khác"</strong>. Form sẽ giữ lại tên khách hàng để bạn nhập tiếp món mới mà không cần chọn lại.
                        </div>
                    </div>
                </GuideItem>

                <GuideItem
                    title="4. Bảo mật & Quyền hạn"
                    icon={ShieldAlert}
                    isOpen={openIndex === 4}
                    onToggle={() => setOpenIndex(4)}
                    color="rose"
                >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <div className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                                Nhân viên (SALE)
                            </div>
                            <ul className="text-sm space-y-1 text-slate-600">
                                <li>• Xem danh sách</li>
                                <li>• Tạo mới dữ liệu</li>
                                <li>• Chỉnh sửa cơ bản</li>
                                <li className="text-slate-400 italic">• Không thể xóa</li>
                            </ul>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                            <div className="font-bold text-purple-900 mb-2 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                                Quản trị (ADMIN)
                            </div>
                            <ul className="text-sm space-y-1 text-purple-800">
                                <li>• Toàn quyền hệ thống</li>
                                <li>• Quản lý người dùng</li>
                                <li>• Xóa dữ liệu (Cần PIN)</li>
                                <li>• Cập nhật thông tin hệ thống</li>
                            </ul>
                        </div>
                    </div>
                </GuideItem>
            </div>
        </div>
    );
}
