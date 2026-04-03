import React, { useEffect, useState } from 'react';
import {
    BookOpen,
    Monitor,
    LayoutDashboard,
    Settings,
    Zap,
    Users,
    BarChart3,
    ShieldAlert,
    Image as ImageIcon,
    Keyboard,
    MousePointerClick,
    CheckCircle2,
    AlertTriangle,
    Lightbulb,
} from 'lucide-react';
import { clsx } from 'clsx';

const toc = [
    { id: 'bat-dau', label: 'Bắt đầu trên desktop' },
    { id: 'dieu-huong', label: 'Thanh bên & điều hướng' },
    { id: 'lai-suat', label: 'Cấu hình lãi suất' },
    { id: 'giao-dich', label: 'Giao dịch & bảng' },
    { id: 'chung-tu', label: 'Ảnh chứng từ' },
    { id: 'khach-hang', label: 'Khách hàng & nợ' },
    { id: 'bao-cao', label: 'Báo cáo' },
    { id: 'phan-quyen', label: 'Phân quyền & PIN' },
];

function Section({ id, title, children, className }) {
    return (
        <section id={id} className={clsx('guide-page__section', className)}>
            <div className="guide-page__section-panel">
                <h3 className="guide-page__section-title">{title}</h3>
                <div className="guide-page__section-body">{children}</div>
            </div>
        </section>
    );
}

function Bullet({ children, variant = 'dot' }) {
    const icon =
        variant === 'check' ? (
            <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-emerald-600" aria-hidden />
        ) : variant === 'warn' ? (
            <AlertTriangle size={17} className="mt-0.5 shrink-0 text-amber-600" aria-hidden />
        ) : variant === 'tip' ? (
            <Lightbulb size={17} className="mt-0.5 shrink-0 text-blue-600" aria-hidden />
        ) : (
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" aria-hidden />
        );
    return (
        <li className="flex gap-3">
            {icon}
            <span className="min-w-0">{children}</span>
        </li>
    );
}

function ProTip({ children }) {
    return (
        <div className="guide-page__protip">
            <Lightbulb className="mt-0.5 shrink-0 text-amber-600" size={18} aria-hidden />
            <div className="min-w-0">{children}</div>
        </div>
    );
}

export default function Guide() {
    const [activeId, setActiveId] = useState(toc[0].id);

    useEffect(() => {
        const mq = window.matchMedia('(min-width: 1024px)');
        const sectionEls = () => toc.map((t) => document.getElementById(t.id)).filter(Boolean);

        let observer;

        const bind = () => {
            observer?.disconnect();
            if (!mq.matches) {
                setActiveId(toc[0].id);
                return;
            }
            const nodes = sectionEls();
            if (nodes.length === 0) return;

            observer = new IntersectionObserver(
                (entries) => {
                    const visible = entries.filter((e) => e.isIntersecting);
                    if (visible.length === 0) return;
                    visible.sort((a, b) => a.target.getBoundingClientRect().top - b.target.getBoundingClientRect().top);
                    setActiveId(visible[0].target.id);
                },
                { root: null, rootMargin: '-72px 0px -52% 0px', threshold: [0, 0.08, 0.2] }
            );
            nodes.forEach((el) => observer.observe(el));
        };

        bind();
        mq.addEventListener('change', bind);
        return () => {
            mq.removeEventListener('change', bind);
            observer?.disconnect();
        };
    }, []);

    return (
        <div className="guide-page animate-in fade-in duration-300">
            <header className="guide-page__hero">
                <div className="guide-page__hero-accent" aria-hidden />
                <div className="guide-page__hero-blob" aria-hidden />
                <div className="guide-page__hero-inner">
                    <div className="guide-page__hero-icon" aria-hidden>
                        <BookOpen size={28} strokeWidth={1.75} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="guide-page__kicker">Tài liệu người dùng</p>
                        <h2 className="section-title text-xl sm:text-2xl">Hướng dẫn sử dụng</h2>
                        <p className="section-subtitle mt-2 max-w-3xl text-sm sm:text-[13px]">
                            Thao tác tối ưu trên máy tính: chuột, bàn phím và bảng nhiều cột. Dùng mục lục bên trái để nhảy
                            nhanh tới từng phần.
                        </p>
                    </div>
                </div>
            </header>

            <div className="guide-page__mobile-callout">
                <div className="relative z-[1] flex gap-4 pl-3">
                    <div className="guide-page__mobile-icon" aria-hidden>
                        <Monitor size={22} />
                    </div>
                    <div className="min-w-0 space-y-2">
                        <p className="font-bold text-slate-900">Nội dung đầy đủ trên màn lớn</p>
                        <p className="text-sm leading-relaxed text-slate-600">
                            Mục lục và toàn bộ hướng dẫn chi tiết hiển thị khi độ rộng cửa sổ từ{' '}
                            <strong className="font-semibold text-slate-800">1024px</strong> trở lên (
                            <code className="guide-page__code">lg</code>). Hãy mở trên máy tính hoặc thu phóng trình duyệt
                            để đọc tiếp.
                        </p>
                    </div>
                </div>
            </div>

            <div className="guide-page__layout">
                <nav aria-label="Mục lục hướng dẫn" className="guide-page__toc">
                    <p className="guide-page__toc-label">
                        <BookOpen size={14} className="text-slate-400" aria-hidden />
                        Mục lục
                    </p>
                    <ul className="guide-page__toc-list">
                        {toc.map((item) => (
                            <li key={item.id}>
                                <a
                                    href={`#${item.id}`}
                                    className={clsx(
                                        'guide-page__toc-link',
                                        activeId === item.id && 'guide-page__toc-link--active'
                                    )}
                                    aria-current={activeId === item.id ? 'location' : undefined}
                                >
                                    {item.label}
                                </a>
                            </li>
                        ))}
                    </ul>
                    <p className="guide-page__toc-foot">
                        Mẹo:{' '}
                        <kbd className="guide-page__kbd">
                            Ctrl
                        </kbd>{' '}
                        + nhấp liên kết để mở tab mới (tùy trình duyệt).
                    </p>
                </nav>

                <article className="guide-page__article">
                    <Section id="bat-dau" title={<><LayoutDashboard size={20} className="text-blue-600" aria-hidden /> Bắt đầu trên desktop</>}>
                        <p>
                            FastAccounting trên máy tính tận dụng <strong>sidebar cố định</strong>,{' '}
                            <strong>bảng nhiều cột</strong> và thao tác nhanh bằng chuột. Luồng gợi ý: đăng nhập → kiểm tra{' '}
                            <strong>Cấu hình lãi suất</strong> → nhập <strong>Giao dịch</strong> → theo dõi{' '}
                            <strong>Khách hàng</strong> / <strong>Báo cáo</strong>.
                        </p>
                        <ul className="guide-page__list">
                            <Bullet variant="check">
                                Có thể <strong>tạo khách hàng nhanh</strong> ngay trong form giao dịch nếu chưa có hồ sơ.
                            </Bullet>
                            <Bullet variant="check">
                                Nên cấu hình sẵn các gói lãi (mã + tên dễ hiểu) để chọn một cú click khi lập phiếu.
                            </Bullet>
                            <Bullet variant="tip">
                                Giữ cửa sổ trình duyệt đủ rộng để bảng giao dịch hiển thị đủ cột gốc / lãi / tổng.
                            </Bullet>
                        </ul>
                    </Section>

                    <Section id="dieu-huong" title={<><MousePointerClick size={20} className="text-indigo-600" aria-hidden /> Thanh bên & điều hướng</>}>
                        <p>
                            Menu trái dẫn tới từng module. Trên desktop bạn có thể <strong>thu gọn sidebar</strong> (nút mũi
                            tên) để tăng diện tích bảng — nhãn menu chuyển sang chế độ icon khi thu gọn.
                        </p>
                        <ul className="guide-page__list">
                            <Bullet>
                                Mục đang mở được tô sáng; dùng <strong>phím Tab</strong> để di chuyển focus an toàn hơn khi
                                nhập liệu dài.
                            </Bullet>
                            <Bullet>
                                Liên kết <strong>“Bỏ qua, tới nội dung chính”</strong> (đầu trang) hỗ trợ đọc màn hình / nhảy
                                nhanh vào vùng làm việc.
                            </Bullet>
                        </ul>
                    </Section>

                    <Section id="lai-suat" title={<><Settings size={20} className="text-purple-600" aria-hidden /> Cấu hình lãi suất</>}>
                        <p>
                            Đây là bước nền: mỗi gói lãi có <strong>mã (code)</strong> dùng nội bộ và <strong>tên hiển thị</strong>{' '}
                            cho người nhập liệu.
                        </p>
                        <ul className="guide-page__list">
                            <Bullet>
                                Code nên viết liền, không dấu, ví dụ{' '}
                                <code className="guide-page__code">VAY_NGAN</code>,{' '}
                                <code className="guide-page__code">KHONG_LAI</code>.
                            </Bullet>
                            <Bullet>
                                Lãi suất mặc định của gói có thể được điều chỉnh khi nhập từng giao dịch nếu cần ghi đè.
                            </Bullet>
                        </ul>
                        <ProTip>
                            <strong>Mẹo:</strong> đặt tên gói theo ngữ cảnh kinh doanh (“Vay 10 ngày”, “Nóng 2%/tháng”) để
                            nhân viên chọn đúng trong danh sách dropdown.
                        </ProTip>
                    </Section>

                    <Section id="giao-dich" title={<><Zap size={20} className="text-emerald-600" aria-hidden /> Giao dịch & bảng</>}>
                        <p>
                            Trang <strong>Giao dịch</strong> trên desktop dùng <strong>bảng</strong> với các cột ngày, khách,
                            loại & lãi, nội dung, tiền gốc, tiền lãi, tổng. Dùng <strong>bộ lọc ngày</strong> và{' '}
                            <strong>ô tìm / chọn khách</strong> phía trên để thu hẹp danh sách.
                        </p>
                        <ul className="guide-page__list">
                            <Bullet variant="check">
                                <strong>Nhấp một lần</strong> vào dòng để mở form sửa giao dịch.
                            </Bullet>
                            <Bullet variant="check">
                                <strong>Nhấp đúp (double-click)</strong> vào dòng trên bảng desktop để đổi nhanh trạng thái đã
                                thu / chưa thu.
                            </Bullet>
                            <Bullet variant="tip">
                                Nội dung có nhiều dấu <code className="guide-page__code">-</code> có thể được hiển thị tách
                                dòng để dễ đọc trên bảng.
                            </Bullet>
                            <Bullet>
                                Khi đánh dấu <strong>đã thanh toán</strong>, hệ thống ghi nhận thời điểm đóng phù hợp cấu hình
                                của bạn.
                            </Bullet>
                        </ul>
                        <div className="guide-page__keyboard-hint">
                            <Keyboard size={16} className="shrink-0 text-slate-400" aria-hidden />
                            <span>
                                Trong các ô combobox khách hàng, dùng phím mũi tên và Enter để chọn nhanh không cần chuột.
                            </span>
                        </div>
                    </Section>

                    <Section id="chung-tu" title={<><ImageIcon size={20} className="text-sky-600" aria-hidden /> Ảnh chứng từ</>}>
                        <p>
                            Ở chế độ sửa giao dịch, bạn có thể đính kèm <strong>một ảnh chứng từ</strong> (hóa đơn, biên
                            lai…). Trên desktop, vùng xem ảnh thường hỗ trợ phóng to, thu nhỏ và xoay để đọc rõ chi tiết.
                        </p>
                        <ul className="guide-page__list">
                            <Bullet variant="check">
                                Thử dùng <strong>con lăn chuột</strong> hoặc phím tắt phóng to trong viewer (nếu có).
                            </Bullet>
                            <Bullet>Kéo để di chuyển vùng nhìn khi ảnh đã phóng to.</Bullet>
                        </ul>
                    </Section>

                    <Section id="khach-hang" title={<><Users size={20} className="text-blue-600" aria-hidden /> Khách hàng & công nợ</>}>
                        <p>
                            Danh sách khách hàng dẫn tới chi tiết công nợ và lịch sử giao dịch. Trên màn hình lớn, bạn xem được
                            nhiều thông tin cùng lúc, lọc theo thời gian dễ hơn.
                        </p>
                        <ul className="guide-page__list">
                            <Bullet variant="warn">
                                <strong>Xóa khách hàng</strong> có thể xóa luôn toàn bộ giao dịch liên quan — chỉ tài khoản có
                                quyền mới thực hiện được, và thường cần xác nhận / PIN.
                            </Bullet>
                        </ul>
                    </Section>

                    <Section id="bao-cao" title={<><BarChart3 size={20} className="text-amber-600" aria-hidden /> Báo cáo</>}>
                        <p>
                            Báo cáo tổng hợp giúp theo dõi giải ngân, lãi và dòng tiền. Trên desktop, bảng số liệu và biểu đồ
                            (nếu có) hiển thị rộng rãi hơn.
                        </p>
                        <ul className="guide-page__list">
                            <Bullet>
                                Dùng ô <strong>tìm kiếm</strong> trong báo cáo để lọc theo tên khách khi danh sách dài.
                            </Bullet>
                            <Bullet variant="tip">
                                Kết hợp báo cáo với bộ lọc ngày ở trang giao dịch khi cần đối soát chi tiết.
                            </Bullet>
                        </ul>
                    </Section>

                    <Section id="phan-quyen" title={<><ShieldAlert size={20} className="text-rose-600" aria-hidden /> Phân quyền & PIN</>}>
                        <p>
                            Hệ thống phân quyền theo vai trò. Một số thao tác nhạy cảm yêu cầu{' '}
                            <strong>mã PIN quản trị</strong>.
                        </p>
                        <div className="guide-page__role-grid">
                            <div className="guide-page__role-card guide-page__role-card--sale">
                                <p className="guide-page__role-title text-slate-900">Nhân viên (SALE)</p>
                                <ul className="guide-page__role-list">
                                    <li>• Xem danh sách, báo cáo</li>
                                    <li>• Tạo / sửa giao dịch, khách hàng, cấu hình lãi</li>
                                    <li className="guide-page__role-muted">• Không xóa dữ liệu / không quản lý user</li>
                                </ul>
                            </div>
                            <div className="guide-page__role-card guide-page__role-card--admin">
                                <p className="guide-page__role-title text-purple-950">Quản trị (ADMIN)</p>
                                <ul className="guide-page__role-list text-purple-950/90">
                                    <li>• Toàn quyền thao tác</li>
                                    <li>• Quản lý tài khoản, sao lưu / phục hồi</li>
                                    <li>• Xóa giao dịch, khách — kèm PIN khi có yêu cầu</li>
                                    <li>• Cập nhật trang Thông tin hệ thống</li>
                                </ul>
                            </div>
                        </div>
                        <ProTip>
                            <strong>Lưu ý:</strong> không chia sẻ PIN quản trị; đổi PIN định kỳ nếu có nhân viên nghỉ việc.
                        </ProTip>
                    </Section>
                </article>
            </div>
        </div>
    );
}
