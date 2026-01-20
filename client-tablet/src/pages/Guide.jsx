import React, { useState } from 'react';
import { BookOpen, Users, ShieldAlert, ChevronDown, Zap, CheckCircle2, AlertTriangle, Lightbulb, BarChart3, Settings, Image as ImageIcon, LayoutDashboard, Tablet } from 'lucide-react';
import { clsx } from 'clsx';

function GuideItem({ title, icon: Icon, children, isOpen, onToggle, color = 'blue' }) {
    const colors = {
        blue: 'bg-blue-100 text-blue-600',
        emerald: 'bg-emerald-100 text-emerald-600',
        amber: 'bg-amber-100 text-amber-600',
        purple: 'bg-purple-100 text-purple-600',
        rose: 'bg-red-100 text-red-600',
        indigo: 'bg-indigo-100 text-indigo-600',
        sky: 'bg-sky-100 text-sky-600',
    };

    return (
        <div className={clsx("card overflow-hidden transition-all duration-300 border-2", isOpen ? "border-blue-200 shadow-lg" : "border-transparent")}>
            <button
                onClick={onToggle}
                className="w-full p-5 tablet-lg:p-6 flex items-center gap-4 text-left hover:bg-slate-50 transition-colors cursor-pointer"
            >
                <div className={clsx("w-10 h-10 tablet-lg:w-12 tablet-lg:h-12 rounded-xl flex items-center justify-center flex-none transition-transform duration-300", colors[color], isOpen && "scale-110")}>
                    <Icon size={20} className="tablet-lg:w-6 tablet-lg:h-6" />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-base tablet-lg:text-lg font-bold text-slate-800">{title}</h3>
                </div>
                <div className={clsx("p-2 rounded-full text-slate-400 transition-transform duration-300", isOpen && "rotate-180 bg-blue-50 text-blue-500")}>
                    <ChevronDown size={18} className="tablet-lg:w-5 tablet-lg:h-5" />
                </div>
            </button>
            <div
                className={clsx(
                    "grid transition-all duration-300 ease-in-out",
                    isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                )}
            >
                <div className="overflow-hidden">
                    <div className="p-5 tablet-lg:p-6 pt-0 text-slate-600 leading-relaxed text-sm tablet-lg:text-base space-y-4">
                        <div className="h-px bg-slate-100 mb-4"></div>
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}

function SectionTitle({ children }) {
    return <h4 className="font-bold text-slate-900 flex items-center gap-2 mt-4 first:mt-0 text-sm tablet-lg:text-base">{children}</h4>;
}

function Bullet({ children, type = 'dot' }) {
    return (
        <li className="flex items-start gap-3">
            <span className={clsx("mt-1.5 flex-none",
                type === 'check' && "text-emerald-500",
                type === 'warn' && "text-amber-500",
                type === 'info' && "text-blue-500",
                type === 'dot' && "w-1.5 h-1.5 rounded-full bg-slate-300 mt-2.5"
            )}>
                {type === 'check' && <CheckCircle2 size={16} />}
                {type === 'warn' && <AlertTriangle size={16} />}
                {type === 'info' && <Lightbulb size={16} />}
            </span>
            <span className="text-sm tablet-lg:text-base">{children}</span>
        </li>
    );
}

function TabletTip({ children }) {
    return (
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 flex gap-3 mt-4">
            <Tablet className="text-blue-600 flex-none" size={20} />
            <div className="text-sm text-blue-800 leading-relaxed">
                <strong className="font-semibold">💡 Tablet Tip:</strong> {children}
            </div>
        </div>
    );
}

export default function Guide() {
    const [openIndex, setOpenIndex] = useState(0);

    const handleToggle = (index) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="space-y-0">
                <h2 className="section-title text-2xl">Hướng Dẫn Sử Dụng</h2>
                <p className="section-subtitle mt-1">Làm chủ FastAccounting trên tablet</p>
            </div>

            <div className="space-y-4">
                {/* 0. Tổng quan */}
                <GuideItem
                    title="Tổng Quan & Điều Hướng"
                    icon={BookOpen}
                    isOpen={openIndex === 0}
                    onToggle={() => handleToggle(0)}
                    color="indigo"
                >
                    <p className="text-sm tablet-lg:text-base">App được tối ưu cho tablet với giao diện thay đổi theo chiều xoay màn hình.</p>

                    <SectionTitle>Điều hướng theo chiều màn hình:</SectionTitle>
                    <ul className="space-y-2 mt-2">
                        <Bullet type="check"><strong>Màn hình dọc (Portrait)</strong>: Thanh điều hướng dưới cùng với 5 mục: Giao dịch, Khách hàng, Trang chủ, Phân tích, Cài đặt.</Bullet>
                        <Bullet type="check"><strong>Màn hình ngang (Landscape)</strong>: Sidebar bên trái có thể thu gọn. Chứa đầy đủ các trang.</Bullet>
                    </ul>

                    <SectionTitle>Trang chính:</SectionTitle>
                    <ul className="space-y-2 mt-2">
                        <Bullet><strong>Trang chủ</strong>: Tổng hợp công nợ theo khách hàng, các thẻ thống kê.</Bullet>
                        <Bullet><strong>Phân tích</strong>: Biểu đồ giao dịch theo tháng, chọn năm để xem.</Bullet>
                        <Bullet><strong>Giao dịch</strong>: Danh sách dạng bảng, lọc theo ngày và khách hàng.</Bullet>
                        <Bullet><strong>Khách hàng</strong>: Lưới thẻ khách; chạm vào thẻ để xem chi tiết công nợ.</Bullet>
                    </ul>

                    <TabletTip>
                        Xoay tablet dọc/ngang để thấy sự khác biệt: dọc gọn với FAB nổi, ngang đầy đủ với sidebar.
                    </TabletTip>
                </GuideItem>

                {/* 1. Cấu hình lãi suất */}
                <GuideItem
                    title="Cấu Hình Lãi Suất"
                    icon={Settings}
                    isOpen={openIndex === 1}
                    onToggle={() => handleToggle(1)}
                    color="purple"
                >
                    <p className="text-sm tablet-lg:text-base">Tạo sẵn các gói lãi suất để chọn nhanh khi tạo giao dịch.</p>
                    <ul className="space-y-2 mt-2">
                        <Bullet><strong>Mã (Code)</strong>: Từ khóa gợi nhớ, viết liền không dấu, ví dụ: <code className="px-1.5 py-0.5 bg-slate-100 rounded text-xs">VAY_NGAN</code>.</Bullet>
                        <Bullet><strong>Lãi suất chuẩn</strong>: Mức mặc định cho gói. Có thể nhập lãi thủ công khi tạo giao dịch.</Bullet>
                    </ul>
                    <TabletTip>
                        Đặt tên gói dễ hiểu như "Vay nóng 10 ngày" để chọn nhanh khi thao tác trên tablet.
                    </TabletTip>
                </GuideItem>

                {/* 2. Giao dịch */}
                <GuideItem
                    title="Quản Lý Giao Dịch"
                    icon={Zap}
                    isOpen={openIndex === 2}
                    onToggle={() => handleToggle(2)}
                    color="emerald"
                >
                    <SectionTitle>Tạo giao dịch:</SectionTitle>
                    <ul className="space-y-2">
                        <Bullet type="check"><strong>Màn hình dọc</strong>: Nút tròn FAB (dấu +) ở giữa phía dưới, ngay trên thanh điều hướng.</Bullet>
                        <Bullet type="check"><strong>Màn hình ngang</strong>: Nút "Tạo mới" trên cùng hàng với bộ lọc.</Bullet>
                        <Bullet type="info"><strong>Tạo khách ngay trong form</strong>: Gõ tên vào ô Khách hàng, nếu chưa có sẽ hiện "Tạo mới". Bấm vào đó, nhập SĐT, Lưu.</Bullet>
                        <Bullet type="check"><strong>Tạo tiếp</strong>: Tích "Tạo tiếp giao dịch khác" để nhập nhiều món cho cùng một khách.</Bullet>
                    </ul>

                    <SectionTitle>Thao tác trên danh sách:</SectionTitle>
                    <ul className="space-y-2">
                        <Bullet type="check"><strong>Chạm một lần</strong>: Mở form chỉnh sửa.</Bullet>
                        <Bullet type="check"><strong>Chạm hai lần (double-tap)</strong>: Chuyển nhanh trạng thái Chưa thu ↔ Đã thanh toán.</Bullet>
                        <Bullet>Bộ lọc: Từ ngày – Đến ngày, Tìm theo tên khách.</Bullet>
                    </ul>

                    <TabletTip>
                        Dùng double-tap để chuyển trạng thái thanh toán nhanh, không cần mở form sửa.
                    </TabletTip>
                </GuideItem>

                {/* 3. Ảnh chứng từ */}
                <GuideItem
                    title="Ảnh Chứng Từ"
                    icon={ImageIcon}
                    isOpen={openIndex === 3}
                    onToggle={() => handleToggle(3)}
                    color="sky"
                >
                    <p className="text-sm tablet-lg:text-base">Mỗi giao dịch có thể đính kèm một ảnh (biên lai, hóa đơn...). Trên tablet có thể chụp trực tiếp hoặc chọn từ thư viện.</p>
                    <ul className="space-y-2 mt-2">
                        <Bullet type="check">Trong form tạo/sửa, góc phải header có <strong>icon ảnh</strong>. Xám = chưa có, Xanh = đã có.</Bullet>
                        <Bullet type="check">Bấm icon: Chưa có → chọn <strong>Chụp ảnh</strong> hoặc <strong>Tải lên</strong>.</Bullet>
                        <Bullet type="check">Đã có → mở xem chi tiết: phóng to/thu nhỏ (pinch/zoom), kéo để pan, xoay 90°.</Bullet>
                    </ul>
                    <TabletTip>
                        Dùng pinch-to-zoom để phóng to ảnh, kéo để di chuyển khi đã zoom. Nút xoay giúp xem ảnh đúng chiều.
                    </TabletTip>
                </GuideItem>

                {/* 4. Khách hàng */}
                <GuideItem
                    title="Khách Hàng & Chi Tiết Công Nợ"
                    icon={Users}
                    isOpen={openIndex === 4}
                    onToggle={() => handleToggle(4)}
                    color="blue"
                >
                    <p className="text-sm tablet-lg:text-base">Trang Khách hàng hiển thị dạng thẻ. Chạm vào một thẻ → vào Chi tiết công nợ: lịch sử giao dịch, tổng gốc/lãi/đã thu/còn nợ.</p>
                    <ul className="space-y-2 mt-2">
                        <Bullet type="check"><strong>Bộ lọc theo ngày</strong>: Từ ngày – Đến ngày để xem đúng kỳ cần tra.</Bullet>
                        <Bullet type="check"><strong>Thanh toán tất cả</strong>: Đánh dấu thanh toán cùng lúc mọi giao dịch còn mở. Cần Ngày thanh toán và mã PIN Admin.</Bullet>
                        <Bullet type="check"><strong>In Phiếu Nợ</strong>: Xem trước, rồi In ngay hoặc Tải xuống PDF.</Bullet>
                        <Bullet type="warn"><strong>Xóa khách hàng</strong>: Chỉ Admin, sẽ xóa toàn bộ giao dịch. Yêu cầu mã PIN.</Bullet>
                    </ul>
                    <TabletTip>
                        Vuốt lên/xuống trong Chi tiết công nợ để xem lịch sử theo tháng. Dùng bộ lọc ngày để giới hạn phạm vi.
                    </TabletTip>
                </GuideItem>

                {/* 5. Báo cáo */}
                <GuideItem
                    title="Báo Cáo & Phân Tích"
                    icon={BarChart3}
                    isOpen={openIndex === 5}
                    onToggle={() => handleToggle(5)}
                    color="amber"
                >
                    <SectionTitle>Tổng quan (Trang chủ):</SectionTitle>
                    <ul className="space-y-2">
                        <Bullet>Thẻ thống kê: Tổng tiền gốc, Lãi dự kiến, Tổng nợ phải thu, Đã thu.</Bullet>
                        <Bullet>Bảng báo cáo nợ theo từng khách: tìm kiếm, sắp xếp cột. Chạm vào dòng để sang Chi tiết công nợ.</Bullet>
                    </ul>
                    <SectionTitle>Phân tích:</SectionTitle>
                    <ul className="space-y-2">
                        <Bullet>Biểu đồ giao dịch theo tháng; chọn năm để xem. Các chỉ số tổng hợp đi kèm.</Bullet>
                    </ul>
                    <TabletTip>
                        Xoay ngang để xem biểu đồ rõ hơn. Chạm vào các điểm trên biểu đồ để xem chi tiết tháng đó.
                    </TabletTip>
                </GuideItem>

                {/* 6. Phân quyền */}
                <GuideItem
                    title="Phân Quyền & Bảo Mật"
                    icon={ShieldAlert}
                    isOpen={openIndex === 6}
                    onToggle={() => handleToggle(6)}
                    color="rose"
                >
                    <p className="text-sm tablet-lg:text-base">Hai vai trò: <strong>SALE</strong> (nhân viên) và <strong>ADMIN</strong> (quản trị).</p>
                    <div className="grid grid-cols-1 tablet:grid-cols-2 gap-4 mt-4">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <div className="font-bold text-slate-900 mb-2 flex items-center gap-2 text-sm tablet-lg:text-base">
                                <span className="w-2 h-2 rounded-full bg-slate-400"></span> Nhân viên (SALE)
                            </div>
                            <ul className="text-sm space-y-1 text-slate-600">
                                <li>• Xem danh sách, báo cáo</li>
                                <li>• Tạo, sửa giao dịch và khách hàng</li>
                                <li>• Cấu hình lãi suất</li>
                                <li className="text-slate-400 italic">• Không xóa, không quản lý user</li>
                            </ul>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                            <div className="font-bold text-purple-900 mb-2 flex items-center gap-2 text-sm tablet-lg:text-base">
                                <span className="w-2 h-2 rounded-full bg-purple-500"></span> Quản trị (ADMIN)
                            </div>
                            <ul className="text-sm space-y-1 text-purple-800">
                                <li>• Toàn quyền như SALE</li>
                                <li>• Xóa giao dịch, khách hàng (cần PIN)</li>
                                <li>• Quản lý user, Backup</li>
                                <li>• Thanh toán tất cả (bulk pay)</li>
                            </ul>
                        </div>
                    </div>
                    <TabletTip>
                        Các thao tác nhạy cảm (xóa, thanh toán tất cả) đều yêu cầu mã PIN Admin. Giữ PIN an toàn.
                    </TabletTip>
                </GuideItem>

                {/* 7. Tablet tips */}
                <GuideItem
                    title="Mẹo Sử Dụng Trên Tablet"
                    icon={Tablet}
                    isOpen={openIndex === 7}
                    onToggle={() => handleToggle(7)}
                    color="indigo"
                >
                    <SectionTitle>Thao tác cảm ứng:</SectionTitle>
                    <ul className="space-y-2">
                        <Bullet type="check"><strong>FAB (Màn hình dọc)</strong>: Nút tròn nổi ở giữa phía dưới để tạo mới nhanh. Chạm một lần để mở form.</Bullet>
                        <Bullet type="check"><strong>Double-tap</strong>: Chuyển nhanh trạng thái thanh toán trong danh sách giao dịch.</Bullet>
                        <Bullet type="check"><strong>Pinch-to-zoom</strong>: Phóng to/thu nhỏ ảnh chứng từ. Kéo để pan khi đã zoom.</Bullet>
                        <Bullet type="check"><strong>Vuốt lên/xuống</strong>: Cuộn danh sách, lịch sử giao dịch.</Bullet>
                    </ul>

                    <SectionTitle>Giao diện thay đổi theo chiều:</SectionTitle>
                    <ul className="space-y-2">
                        <Bullet type="info"><strong>Dọc (Portrait)</strong>: Bottom Nav + FAB. Gọn gàng, dễ dùng một tay.</Bullet>
                        <Bullet type="info"><strong>Ngang (Landscape)</strong>: Sidebar có thể thu gọn. Đầy đủ tính năng, phù hợp xem bảng/biểu đồ.</Bullet>
                    </ul>

                    <SectionTitle>Kích thước chạm:</SectionTitle>
                    <ul className="space-y-2">
                        <Bullet>Tất cả nút và ô nhập đều tối thiểu 44×44px, phù hợp khuyến nghị touch.</Bullet>
                        <Bullet>DatePicker tùy chỉnh, dễ chạm, không dùng date mặc định của trình duyệt.</Bullet>
                    </ul>

                    <TabletTip>
                        Thử xoay tablet khi làm việc: dọc để nhập liệu nhanh với FAB, ngang để xem báo cáo/biểu đồ rõ hơn.
                    </TabletTip>
                </GuideItem>
            </div>
        </div>
    );
}
