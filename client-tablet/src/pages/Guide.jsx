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
                className="w-full p-6 flex items-center gap-4 text-left hover:bg-slate-50 transition-colors"
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
                    <div className="p-6 pt-0 text-slate-600 leading-relaxed text-base space-y-4">
                        <div className="h-px bg-slate-100 mb-6"></div>
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}

function SectionTitle({ children }) {
    return <h4 className="font-bold text-slate-900 flex items-center gap-2 mt-6 first:mt-0 text-base">{children}</h4>;
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
            <span>{children}</span>
        </li>
    );
}

function ProTip({ children }) {
    return (
        <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 flex gap-3 mt-4">
            <Lightbulb className="text-amber-500 flex-none" size={20} />
            <div className="text-sm text-amber-800 leading-relaxed">
                {children}
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
        <div className="max-w-5xl mx-auto space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="space-y-0">
                <h2 className="section-title text-2xl">Hướng Dẫn Sử Dụng</h2>
                <p className="section-subtitle text-base mt-1">Làm chủ FastAccounting trên tablet</p>
            </div>

            <div className="space-y-4">
                {/* 0. Tổng quan & Điều hướng tablet */}
                <GuideItem
                    title="Tổng Quan & Điều Hướng Trên Tablet"
                    icon={BookOpen}
                    isOpen={openIndex === 0}
                    onToggle={() => handleToggle(0)}
                    color="indigo"
                >
                    <p>Phiên bản tablet được tối ưu cho màn hình cảm ứng: điều hướng thay đổi theo chiều xoay màn hình, nút bấm đủ lớn để chạm, và các trang chính luôn trong tầm tay.</p>

                    <SectionTitle>Điều hướng theo chiều màn hình:</SectionTitle>
                    <ul className="space-y-2 mt-2">
                        <Bullet type="check"><strong>Màn hình dọc (Portrait, &lt;1024px)</strong>: Thanh điều hướng dưới cùng (Bottom Nav) với 5 mục: <strong>Giao dịch</strong>, <strong>Khách hàng</strong>, <strong>Trang chủ</strong> (Tổng quan tài chính), <strong>Phân tích</strong> (biểu đồ &amp; báo cáo), <strong>Cài đặt</strong>.</Bullet>
                        <Bullet type="check"><strong>Màn hình ngang (Landscape, ≥1024px)</strong>: Sidebar bên trái (có thể thu gọn thành thanh icon). Chứa đầy đủ: Tổng quan, Giao dịch, Khách hàng, Cấu hình lãi suất, Báo cáo, Người dùng (Admin), Backup (Admin), Cài đặt, Thông tin, Hướng dẫn.</Bullet>
                        <Bullet type="info"><strong>Trên màn hình dọc</strong>: Hướng dẫn, Thông tin, Cấu hình lãi suất, Người dùng, Backup chỉ có trong <strong>Cài đặt</strong> → chọn mục tương ứng.</Bullet>
                    </ul>

                    <SectionTitle>Trang chính:</SectionTitle>
                    <ul className="space-y-2 mt-2">
                        <Bullet><strong>Trang chủ / Tổng quan</strong> (<LayoutDashboard size={14} className="inline" />): Bảng tổng hợp công nợ theo khách hàng, các thẻ Tổng gốc, Lãi dự kiến, Nợ phải thu, Đã thu.</Bullet>
                        <Bullet><strong>Phân tích</strong> (<BarChart3 size={14} className="inline" />): Biểu đồ giao dịch theo tháng, chọn năm, các chỉ số tổng hợp.</Bullet>
                        <Bullet><strong>Giao dịch</strong>: Danh sách giao dịch dạng bảng, lọc theo ngày và khách hàng. Tạo/sửa qua nút <strong>FAB</strong> (dọc) hoặc <strong>Tạo mới</strong> (ngang).</Bullet>
                        <Bullet><strong>Khách hàng</strong>: Lưới thẻ khách; bấm vào thẻ để xem <strong>Chi tiết công nợ</strong> (lịch sử vay/trả, In phiếu nợ, Thanh toán tất cả).</Bullet>
                    </ul>

                    <ProTip>
                        <strong>Phóng to giao diện:</strong> Dùng <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-xs font-mono">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-xs font-mono">+</kbd> / <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-xs font-mono">−</kbd> để zoom 100%–150%; <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-xs font-mono">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-xs font-mono">0</kbd> để reset.
                    </ProTip>
                </GuideItem>

                {/* 1. Cấu hình lãi suất */}
                <GuideItem
                    title="1. Cấu Hình Lãi Suất"
                    icon={Settings}
                    isOpen={openIndex === 1}
                    onToggle={() => handleToggle(1)}
                    color="purple"
                >
                    <p>Chuẩn bị sẵn các gói lãi suất để chọn nhanh khi tạo giao dịch, không cần nhớ từng con số.</p>
                    <ul className="space-y-2 mt-2">
                        <Bullet><strong>Mã (Code)</strong>: Từ khóa gợi nhớ, viết liền không dấu, ví dụ: <code>VAY_NGAN</code>, <code>KHONG_LAI</code>.</Bullet>
                        <Bullet><strong>Lãi suất chuẩn</strong>: Mức mặc định cho gói. Khi tạo giao dịch vẫn có thể nhập lãi thủ công nếu cần.</Bullet>
                    </ul>
                    <ProTip>
                        Đặt tên gói (Name) dễ hiểu như &quot;Vay nóng 10 ngày&quot;, &quot;Vay dài hạn 2%&quot; để chọn đúng khi thao tác nhanh trên tablet.
                    </ProTip>
                </GuideItem>

                {/* 2. Giao dịch */}
                <GuideItem
                    title="2. Quản Lý Giao Dịch"
                    icon={Zap}
                    isOpen={openIndex === 2}
                    onToggle={() => handleToggle(2)}
                    color="emerald"
                >
                    <SectionTitle>Tạo giao dịch</SectionTitle>
                    <ul className="space-y-2">
                        <Bullet type="check"><strong>Màn hình dọc</strong>: Nút tròn <strong>FAB</strong> (dấu +) ở giữa phía dưới, ngay trên thanh Bottom Nav. Bấm để mở form tạo mới.</Bullet>
                        <Bullet type="check"><strong>Màn hình ngang</strong>: Nút <strong>Tạo mới</strong> trên cùng hàng với bộ lọc (Ngày, Khách hàng). Nếu đã chọn khách trong bộ lọc, form mở sẵn khách đó.</Bullet>
                        <Bullet type="info"><strong>Tạo khách ngay trong form</strong>: Gõ tên vào ô Khách hàng, nếu chưa có sẽ hiện &quot;Tạo mới &quot;&lt;tên&gt;&quot;&quot;. Bấm vào đó, nhập SĐT (hoặc để trống), Lưu — khách mới được chọn tự động.</Bullet>
                        <Bullet type="check"><strong>Tạo tiếp giao dịch khác</strong>: Tích ô &quot;Tạo tiếp giao dịch khác&quot; khi tạo mới. Sau khi Lưu, form reset nhưng giữ nguyên khách hàng — tiện khi nhập nhiều món cho cùng một người.</Bullet>
                    </ul>

                    <SectionTitle>Form giao dịch (tối ưu tablet):</SectionTitle>
                    <ul className="space-y-2">
                        <Bullet>Hàng 1: <strong>Ngày giao dịch</strong> và <strong>Khách hàng</strong> (2 cột).</Bullet>
                        <Bullet><strong>Loại giao dịch</strong>: Các nút gói lãi suất xếp 4 nút mỗi hàng, chạm chọn.</Bullet>
                        <Bullet>Khi <strong>chỉnh sửa</strong>: Có thêm Trạng thái (Chưa thu / Đã thanh toán) và Ngày thanh toán (nếu Đã thanh toán).</Bullet>
                    </ul>

                    <SectionTitle>Danh sách giao dịch (bảng):</SectionTitle>
                    <ul className="space-y-2">
                        <Bullet type="check"><strong>Chạm một lần</strong> vào dòng: mở form chỉnh sửa.</Bullet>
                        <Bullet type="check"><strong>Chạm hai lần (double-tap)</strong>: chuyển nhanh trạng thái <strong>Chưa thu</strong> ↔ <strong>Đã thanh toán</strong>.</Bullet>
                        <Bullet>Bộ lọc: <strong>Từ ngày – Đến ngày</strong> (DatePicker), <strong>Tìm theo tên khách</strong> (gõ và chọn từ danh sách).</Bullet>
                        <Bullet>Trên màn hình dọc, cột <strong>Ngày</strong> có thể ẩn; ngày vẫn hiển thị dưới tên khách trong cột Khách hàng.</Bullet>
                    </ul>

                    <SectionTitle>Thanh toán & đóng hồ sơ:</SectionTitle>
                    <ul className="space-y-2">
                        <Bullet>Chuyển trạng thái sang <strong>Đã thanh toán</strong> để ghi nhận đã thu. Hệ thống tự tính ngày đóng và chốt lãi.</Bullet>
                        <Bullet>Admin: Có nút <strong>Xóa giao dịch</strong> trong form sửa; cần nhập <strong>mã PIN</strong> để xác nhận.</Bullet>
                    </ul>
                </GuideItem>

                {/* 3. Ảnh chứng từ */}
                <GuideItem
                    title="3. Ảnh Chứng Từ Giao Dịch"
                    icon={ImageIcon}
                    isOpen={openIndex === 3}
                    onToggle={() => handleToggle(3)}
                    color="sky"
                >
                    <p>Mỗi giao dịch có thể đính kèm một ảnh (biên lai, hóa đơn, ảnh hiện trường…). Trên tablet có thể chụp trực tiếp hoặc chọn từ thư viện.</p>
                    <SectionTitle>Thêm & xem ảnh:</SectionTitle>
                    <ul className="space-y-2">
                        <Bullet type="check">Trong form tạo/sửa giao dịch, góc phải header có <strong>icon ảnh</strong>. <strong>Xám</strong> = chưa có ảnh, <strong>Xanh</strong> = đã có ảnh.</Bullet>
                        <Bullet type="check">Bấm icon: nếu chưa có ảnh → mở chọn <strong>Chụp ảnh</strong> (camera) hoặc <strong>Tải lên</strong> (thư viện / file).</Bullet>
                        <Bullet type="check">Nếu đã có ảnh → mở <strong>Xem chi tiết</strong>: phóng to/thu nhỏ (lăn chuột hoặc nút +/−), kéo để pan, nút xoay 90°. Có thể <strong>Đổi ảnh</strong>, <strong>Xóa ảnh</strong>, <strong>Tải xuống</strong>.</Bullet>
                    </ul>
                    <ProTip>
                        Ảnh tối đa 5MB. Khi tạo giao dịch mới, có thể chọn ảnh trước rồi Lưu — ảnh sẽ được gửi lên sau khi giao dịch được tạo.
                    </ProTip>
                </GuideItem>

                {/* 4. Khách hàng & chi tiết công nợ */}
                <GuideItem
                    title="4. Khách Hàng & Chi Tiết Công Nợ"
                    icon={Users}
                    isOpen={openIndex === 4}
                    onToggle={() => handleToggle(4)}
                    color="blue"
                >
                    <p>Trang Khách hàng hiển thị dạng thẻ. Bấm vào một thẻ → vào <strong>Chi tiết công nợ</strong> của khách đó: lịch sử giao dịch nhóm theo tháng, tổng gốc/lãi/đã thu/còn nợ.</p>
                    <SectionTitle>Trong Chi tiết công nợ:</SectionTitle>
                    <ul className="space-y-2">
                        <Bullet type="check"><strong>Bộ lọc theo ngày</strong>: Từ ngày – Đến ngày để xem đúng kỳ cần tra.</Bullet>
                        <Bullet type="check"><strong>Thanh toán tất cả</strong>: Đánh dấu thanh toán cùng lúc mọi giao dịch còn mở của khách. Cần <strong>Ngày thanh toán</strong> và <strong>mã PIN Admin</strong>.</Bullet>
                        <Bullet type="check"><strong>In Phiếu Nợ</strong>: Mở xem trước bản in, rồi <strong>In ngay</strong> hoặc <strong>Tải xuống PDF</strong>. Nội dung in theo khoảng ngày đã chọn.</Bullet>
                        <Bullet type="info">Nội dung giao dịch có dấu <strong>gạch ngang (-)</strong> được tách xuống dòng tại mỗi dấu gạch để dễ đọc.</Bullet>
                        <Bullet type="warn"><strong>Xóa khách hàng</strong>: Chỉ Admin, và sẽ xóa <strong>toàn bộ giao dịch</strong> của khách. Yêu cầu mã PIN.</Bullet>
                    </ul>
                </GuideItem>

                {/* 5. Báo cáo & phân tích */}
                <GuideItem
                    title="5. Báo Cáo & Phân Tích"
                    icon={BarChart3}
                    isOpen={openIndex === 5}
                    onToggle={() => handleToggle(5)}
                    color="amber"
                >
                    <p>Hai màn riêng: <strong>Tổng quan</strong> (Trang chủ) và <strong>Phân tích</strong> (Báo cáo).</p>
                    <SectionTitle>Tổng quan (Trang chủ):</SectionTitle>
                    <ul className="space-y-2">
                        <Bullet><strong>Tổng tiền gốc</strong>, <strong>Lãi dự kiến</strong>, <strong>Tổng nợ phải thu</strong>, <strong>Đã thu</strong> (dòng tiền thực).</Bullet>
                        <Bullet>Bảng báo cáo nợ theo từng khách: tìm kiếm theo tên, sắp xếp cột. Bấm vào dòng để sang Chi tiết công nợ.</Bullet>
                    </ul>
                    <SectionTitle>Phân tích:</SectionTitle>
                    <ul className="space-y-2">
                        <Bullet>Biểu đồ giao dịch theo tháng; chọn <strong>năm</strong> để xem. Các chỉ số tổng hợp đi kèm.</Bullet>
                    </ul>
                </GuideItem>

                {/* 6. Phân quyền & bảo mật */}
                <GuideItem
                    title="6. Phân Quyền & Bảo Mật"
                    icon={ShieldAlert}
                    isOpen={openIndex === 6}
                    onToggle={() => handleToggle(6)}
                    color="rose"
                >
                    <p>Hai vai trò: <strong>SALE</strong> (nhân viên) và <strong>ADMIN</strong> (quản trị).</p>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <div className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-slate-400"></span> Nhân viên (SALE)
                            </div>
                            <ul className="text-sm space-y-1 text-slate-600">
                                <li>• Xem danh sách, báo cáo, phân tích</li>
                                <li>• Tạo, sửa giao dịch và khách hàng</li>
                                <li>• Cấu hình lãi suất</li>
                                <li className="text-slate-400 italic">• Không xóa giao dịch, khách hàng</li>
                                <li className="text-slate-400 italic">• Không quản lý user, Backup</li>
                            </ul>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                            <div className="font-bold text-purple-900 mb-2 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-purple-500"></span> Quản trị (ADMIN)
                            </div>
                            <ul className="text-sm space-y-1 text-purple-800">
                                <li>• Toàn quyền như SALE</li>
                                <li>• Xóa giao dịch, khách hàng (yêu cầu mã PIN)</li>
                                <li>• Quản lý user, Backup &amp; khôi phục</li>
                                <li>• Thanh toán tất cả (bulk pay) trong Chi tiết công nợ</li>
                            </ul>
                        </div>
                    </div>
                    <ProTip>
                        Các thao tác nhạy cảm (xóa, thanh toán tất cả) đều yêu cầu <strong>mã PIN Admin</strong>. Giữ PIN an toàn, không chia sẻ.
                    </ProTip>
                </GuideItem>

                {/* 7. Giao diện tablet */}
                <GuideItem
                    title="7. Giao Diện & Thao Tác Trên Tablet"
                    icon={Tablet}
                    isOpen={openIndex === 7}
                    onToggle={() => handleToggle(7)}
                    color="indigo"
                >
                    <p>Thiết kế ưu tiên màn hình cảm ứng và thao tác một tay: nút đủ lớn, bố cục thay đổi theo portrait/landscape.</p>
                    <SectionTitle>Điểm chính:</SectionTitle>
                    <ul className="space-y-2">
                        <Bullet type="check"><strong>Bottom Nav (dọc)</strong>: 5 mục cố định, luôn hiện. FAB <strong>Tạo giao dịch</strong> nổi phía trên Bottom Nav, giữa màn hình.</Bullet>
                        <Bullet type="check"><strong>Sidebar (ngang)</strong>: Thu gọn (chỉ icon) hoặc mở rộng (icon + chữ). Nút mũi tên cạnh sidebar để đổi. Breakpoint: 1024px (tablet-lg).</Bullet>
                        <Bullet type="check"><strong>DatePicker</strong>: Giao diện chọn ngày tùy chỉnh, dễ chạm; không dùng date mặc định của trình duyệt.</Bullet>
                        <Bullet type="check"><strong>Kích thước chạm</strong>: Nút và ô nhập tối thiểu 44×44px phù hợp khuyến nghị touch.</Bullet>
                        <Bullet type="info"><strong>Nội dung dài</strong>: Chỗ có dấu gạch ngang được tách xuống dòng để dễ đọc trên bảng và phiếu in.</Bullet>
                    </ul>
                    <ProTip>
                        Khi dùng tablet, hãy thử xoay dọc/ngang để thấy sự khác biệt: dọc gọn (FAB + Bottom Nav), ngang đầy đủ (Sidebar + nút Tạo mới trên đầu trang).
                    </ProTip>
                </GuideItem>
            </div>
        </div>
    );
}
