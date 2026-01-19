import React, { useState } from 'react';
import { BookOpen, Users, FileText, Calculator, ShieldAlert, ChevronDown, Zap, CheckCircle2, AlertTriangle, Lightbulb, BarChart3, Settings, Image as ImageIcon } from 'lucide-react';
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

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Section */}
            <div className="space-y-0">
                <div className="space-y-5">
                    {/* Row 1: Title & Subtitle */}
                    <div>
                        <h2 className="section-title text-3xl">Hướng Dẫn Sử Dụng</h2>
                        <p className="section-subtitle text-base mt-1">Làm chủ hệ thống quản lý tài chính FastAccounting</p>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <GuideItem
                    title="Tổng Quan & Quy Trình Linh Hoạt"
                    icon={BookOpen}
                    isOpen={openIndex === 0}
                    onToggle={() => setOpenIndex(0)}
                    color="indigo"
                >
                    <p>Hệ thống FastAccounting được thiết kế để bạn quản lý dòng tiền, công nợ một cách nhanh chóng và chính xác nhất. Không gò bó trong quy trình cứng nhắc, bạn có thể thao tác linh hoạt tùy theo tình huống thực tế.</p>

                    <SectionTitle>Giao diện thông minh cho mọi thiết bị:</SectionTitle>
                    <ul className="space-y-2 mt-2">
                        <Bullet type="check"><strong>Tablet (iPad Pro 11")</strong>: Giao diện hybrid tự động chuyển đổi - Card view dễ đọc khi xoay dọc, Table view gọn gàng khi xoay ngang.</Bullet>
                        <Bullet type="check"><strong>Desktop</strong>: Bảng dữ liệu đầy đủ với nhiều cột, tối ưu cho màn hình lớn.</Bullet>
                        <Bullet type="check"><strong>Mobile</strong>: Card view thân thiện với touch, dễ thao tác trên màn hình nhỏ.</Bullet>
                    </ul>

                    <SectionTitle>Bắt đầu từ đâu cũng được:</SectionTitle>
                    <ul className="space-y-2 mt-2">
                        <Bullet type="check"><strong>Có khách mới?</strong> Bạn có thể tạo ngay trong lúc lập phiếu ghi nợ, không cần thoát ra ngoài.</Bullet>
                        <Bullet type="check"><strong>Chưa rõ lãi suất?</strong> Hãy cấu hình sẵn các gói lãi suất phổ biến, sau đó chỉ cần chọn nhanh.</Bullet>
                        <Bullet type="check"><strong>Cần tra cứu?</strong> Tìm kiếm thông minh bằng tên hoặc số điện thoại ở mọi nơi.</Bullet>
                    </ul>
                </GuideItem>

                <GuideItem
                    title="1. Cấu Hình Lãi Suất (Nền Tảng)"
                    icon={Settings}
                    isOpen={openIndex === 1}
                    onToggle={() => setOpenIndex(1)}
                    color="purple"
                >
                    <p>Đây là bước chuẩn bị quan trọng giúp bạn nhập liệu nhanh hơn về sau. Thay vì mỗi lần nhập giao dịch phải nhớ lãi suất, bạn chỉ cần tạo các "Gói" sẵn.</p>

                    <SectionTitle>Cách tư duy:</SectionTitle>
                    <ul className="space-y-2">
                        <Bullet><strong>Mã (Code)</strong>: Là từ khóa gợi nhớ (viết liền không dấu), ví dụ: <code>VAY_NGAN</code>, <code>VAY_DAI</code>, <code>KHONG_LAI</code>.</Bullet>
                        <Bullet><strong>Lãi suất chuẩn</strong>: Mức lãi suất mặc định cho gói này. Bạn vẫn có thể nhập số tiền lãi thủ công nếu muốn ghi đè.</Bullet>
                    </ul>

                    <ProTip>
                        <strong>Mẹo:</strong> Hãy đặt tên gói (Name) thật dễ hiểu như "Vay nóng 10 ngày", "Vay dài hạn 2%" để nhân viên dễ chọn lựa chính xác.
                    </ProTip>
                </GuideItem>

                <GuideItem
                    title="2. Quản Lý Giao Dịch Thông Minh"
                    icon={Zap}
                    isOpen={openIndex === 2}
                    onToggle={() => setOpenIndex(2)}
                    color="emerald"
                >
                    <SectionTitle>Tạo giao dịch siêu tốc</SectionTitle>
                    <p className="mb-2">Khi bấm "Tạo Giao Dịch" (hoặc FAB button trên tablet), bạn có một công cụ mạnh mẽ trong tay:</p>
                    <ul className="space-y-2">
                        <Bullet type="check"><strong>Tìm khách hàng 2 trong 1</strong>: Gõ tên vào ô khách hàng. Nếu chưa có, hệ thống sẽ gợi ý <strong>"Tạo mới ngay"</strong>. Bấm vào đó, điền SĐT là xong. Tiết kiệm 50% thao tác!</Bullet>
                        <Bullet type="info"><strong>Nhập liệu liên tục</strong>: Tích vào ô <strong>"Tạo tiếp giao dịch khác"</strong>. Sau khi Lưu, form sẽ tự làm mới nhưng giữ lại tên khách hàng cũ, rất tiện khi một người vay nhiều món.</Bullet>
                        <Bullet type="check"><strong>Form tối ưu cho tablet</strong>: Trên màn hình dọc, "Ngày giao dịch" và "Khách hàng" được xếp cùng một hàng. "Loại giao dịch" hiển thị 4 phần tử mỗi hàng để tiết kiệm không gian.</Bullet>
                    </ul>

                    <SectionTitle>Xem danh sách giao dịch</SectionTitle>
                    <ul className="space-y-2">
                        <Bullet type="info"><strong>Tablet Portrait</strong>: Card view với thông tin đầy đủ, dễ đọc, dễ chạm. Mỗi card hiển thị: Ngày, Loại, Khách hàng, Nội dung, Thông tin tài chính, Lãi suất.</Bullet>
                        <Bullet type="info"><strong>Tablet Landscape / Desktop</strong>: Bảng gọn gàng với 6 cột chính. Trạng thái được hiển thị bằng icon và màu nền, không cần cột riêng.</Bullet>
                        <Bullet type="check"><strong>Double-click để đổi trạng thái</strong>: Trên bảng desktop, double-click vào dòng để chuyển đổi nhanh giữa OPEN và PAID.</Bullet>
                    </ul>

                    <SectionTitle>Thanh toán & Đóng hồ sơ</SectionTitle>
                    <ul className="space-y-2">
                        <Bullet>Để ghi nhận đã trả tiền, hãy chuyển trạng thái sang <strong>ĐÃ THANH TOÁN (Màu xanh)</strong>.</Bullet>
                        <Bullet>Hệ thống sẽ tự động tính toán ngày đóng hồ sơ và chốt lãi tại thời điểm đó.</Bullet>
                    </ul>
                </GuideItem>

                <GuideItem
                    title="3. Lưu Trữ Hình Ảnh Chứng Từ"
                    icon={ImageIcon}
                    isOpen={openIndex === 3}
                    onToggle={() => setOpenIndex(3)}
                    color="sky"
                >
                    <p>Mỗi giao dịch đều có thể đính kèm một hình ảnh chứng từ (hóa đơn, biên lai, ảnh chụp hiện trường...).</p>

                    <SectionTitle>Thao tác linh hoạt:</SectionTitle>
                    <ul className="space-y-2">
                        <Bullet type="check"><strong>Tải lên dễ dàng</strong>: Bấm vào biểu tượng <strong>Hình ảnh</strong> trên thanh tiêu đề khi tạo/sửa giao dịch.</Bullet>
                        <Bullet type="check"><strong>Chụp ảnh trực tiếp</strong>: Trên điện thoại, bạn có thể chọn chụp ảnh ngay lập tức.</Bullet>
                        <Bullet type="info"><strong>Xem chi tiết chuyên nghiệp</strong>:
                            <ul className="pl-6 mt-1 space-y-1 list-disc text-slate-500">
                                <li>Phóng to/Thu nhỏ bằng lăn chuột hoặc phím (+/-)</li>
                                <li>Kéo thả để di chuyển vùng nhìn (Pan)</li>
                                <li>Xoay ảnh để đọc dễ hơn</li>
                            </ul>
                        </Bullet>
                    </ul>

                    <ProTip>
                        <strong>Mẹo:</strong> Biểu tượng <strong>Màu Xám</strong> nghĩa là chưa có ảnh. Biểu tượng <strong>Màu Xanh</strong> nghĩa là đã có ảnh được lưu trữ an toàn.
                    </ProTip>
                </GuideItem>

                <GuideItem
                    title="4. Quản Lý Khách Hàng & Nợ"
                    icon={Users}
                    isOpen={openIndex === 4}
                    onToggle={() => setOpenIndex(4)}
                    color="blue"
                >
                    <p>Hồ sơ khách hàng là nơi lưu trữ "Sổ cái" của từng người.</p>
                    <ul className="space-y-2 mt-2">
                        <Bullet type="info"><strong>Lịch sử minh bạch</strong>: Bấm vào từng khách hàng để xem toàn bộ lịch sử vay/trả với giao diện hybrid tương tự trang giao dịch.</Bullet>
                        <Bullet type="check"><strong>Lọc theo thời gian</strong>: Sử dụng DatePicker tùy chỉnh để chọn khoảng thời gian cần xem. Giao diện compact, không chiếm nhiều không gian.</Bullet>
                        <Bullet type="info"><strong>Nội dung tự động xuống dòng</strong>: Nội dung giao dịch có dấu gạch ngang (-) sẽ tự động xuống dòng tại mỗi dấu gạch để dễ đọc hơn.</Bullet>
                        <Bullet type="warn"><strong>Xóa khách hàng</strong>: Cẩn thận! Xóa khách hàng sẽ xóa <strong>toàn bộ</strong> giao dịch liên quan đến họ. Chỉ Admin mới có quyền này.</Bullet>
                    </ul>
                </GuideItem>

                <GuideItem
                    title="5. Báo Cáo & Thống Kê"
                    icon={BarChart3}
                    isOpen={openIndex === 5}
                    onToggle={() => setOpenIndex(5)}
                    color="amber"
                >
                    <p>Theo dõi sức khỏe tài chính của bạn qua các con số thực tế.</p>
                    <SectionTitle>Các chỉ số quan trọng:</SectionTitle>
                    <ul className="space-y-2">
                        <Bullet><strong>Tổng giải ngân</strong>: Số tiền gốc bạn đã đưa ra thị trường.</Bullet>
                        <Bullet><strong>Lãi dự kiến</strong>: Số tiền lãi ước tính thu về nếu tất cả khoản vay đáo hạn hôm nay.</Bullet>
                        <Bullet><strong>Dòng tiền thực</strong>: Số tiền thực tế đã thu về túi (Gốc đã thu + Lãi đã thu).</Bullet>
                    </ul>
                </GuideItem>

                <GuideItem
                    title="7. Giao Diện Thông Minh & Responsive"
                    icon={Settings}
                    isOpen={openIndex === 7}
                    onToggle={() => setOpenIndex(7)}
                    color="indigo"
                >
                    <p>Hệ thống được tối ưu hóa cho mọi thiết bị, đặc biệt là iPad Pro 11" với giao diện hybrid thông minh.</p>

                    <SectionTitle>Hybrid UI - Tự động chuyển đổi:</SectionTitle>
                    <ul className="space-y-2">
                        <Bullet type="check"><strong>Portrait Mode (Màn hình dọc)</strong>: Card view với thông tin đầy đủ, dễ đọc, dễ chạm. FAB button nổi ở bottom center để tạo mới nhanh.</Bullet>
                        <Bullet type="check"><strong>Landscape Mode (Màn hình ngang)</strong>: Table view gọn gàng với nhiều cột, tối ưu cho màn hình rộng. Tất cả controls nằm trên một hàng.</Bullet>
                        <Bullet type="info"><strong>Breakpoint thông minh</strong>: Tự động chuyển đổi tại 1280px (xl breakpoint) để tận dụng tối đa không gian màn hình.</Bullet>
                    </ul>

                    <SectionTitle>Tính năng UI/UX mới:</SectionTitle>
                    <ul className="space-y-2">
                        <Bullet type="check"><strong>Custom DatePicker</strong>: Date picker tùy chỉnh với giao diện đẹp, không phụ thuộc vào browser default. Chọn ngày dễ dàng với calendar popup.</Bullet>
                        <Bullet type="check"><strong>FAB Buttons</strong>: Floating Action Button xuất hiện ở portrait mode, giúp tạo mới nhanh chóng mà không chiếm không gian header.</Bullet>
                        <Bullet type="check"><strong>Touch-friendly</strong>: Tất cả buttons và interactive elements có kích thước tối thiểu 44x44px, đảm bảo dễ chạm trên tablet.</Bullet>
                        <Bullet type="check"><strong>Typography scaling</strong>: Font size tự động điều chỉnh theo breakpoint để đảm bảo dễ đọc trên mọi thiết bị.</Bullet>
                        <Bullet type="info"><strong>Content wrapping</strong>: Nội dung có dấu gạch ngang tự động xuống dòng để dễ đọc hơn, đặc biệt hữu ích cho danh sách dài.</Bullet>
                    </ul>

                    <ProTip>
                        <strong>Mẹo:</strong> Trên tablet, hãy thử xoay màn hình để trải nghiệm sự khác biệt giữa Card view và Table view. Mỗi chế độ đều được tối ưu cho mục đích sử dụng riêng.
                    </ProTip>
                </GuideItem>

                <GuideItem
                    title="6. Phân Quyền & Bảo Mật"
                    icon={ShieldAlert}
                    isOpen={openIndex === 6}
                    onToggle={() => setOpenIndex(6)}
                    color="rose"
                >
                    <p>Hệ thống phân chia quyền hạn rõ ràng để bảo vệ dữ liệu nhạy cảm.</p>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <div className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                                Nhân viên (SALE)
                            </div>
                            <ul className="text-sm space-y-1 text-slate-600">
                                <li>• Xem danh sách & Báo cáo</li>
                                <li>• Tạo mới & Chỉnh sửa giao dịch</li>
                                <li>• Quản lý khách hàng & cấu hình lãi suất</li>
                                <li className="text-slate-400 italic">• Không thể xóa dữ liệu</li>
                                <li className="text-slate-400 italic">• Không thể quản lý user</li>
                            </ul>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                            <div className="font-bold text-purple-900 mb-2 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                                Quản trị (ADMIN)
                            </div>
                            <ul className="text-sm space-y-1 text-purple-800">
                                <li>• Toàn quyền hệ thống</li>
                                <li>• Quản lý tài khoản nhân viên</li>
                                <li>• <strong>Xóa giao dịch & khách hàng</strong> (Yêu cầu mã PIN)</li>
                                <li>• Backup & Restore dữ liệu</li>
                                <li>• Cập nhật thông tin hệ thống</li>
                            </ul>
                        </div>
                    </div>

                    <ProTip>
                        <strong>Lưu ý:</strong> Mã PIN Admin được yêu cầu cho các thao tác nhạy cảm như xóa user, xóa giao dịch. Đảm bảo mã PIN của bạn an toàn và không chia sẻ với người khác.
                    </ProTip>
                </GuideItem>
            </div>
        </div>
    );
}
