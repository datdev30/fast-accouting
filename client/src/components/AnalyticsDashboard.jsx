import React, { useMemo } from 'react';
import {
    BarChart,
    Bar,
    PieChart as RechartsPieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { TrendingUp, DollarSign, Users, Activity, PieChart, BarChart3 } from 'lucide-react';

export default function AnalyticsDashboard({ report }) {
    const chartData = useMemo(() => {
        if (!report || report.length === 0) return null;

        const totalDebt = report.reduce((sum, item) => sum + item.total_debt, 0);
        const totalPaid = report.reduce((sum, item) => sum + (item.total_collected || 0), 0);

        const pieData = [
            { name: 'Đã thanh toán', value: totalPaid, color: '#10b981' },
            { name: 'Còn nợ', value: totalDebt, color: '#f59e0b' },
        ];

        const topDebtors = [...report]
            .sort((a, b) => b.total_debt - a.total_debt)
            .slice(0, 5)
            .map((item) => ({
                name:
                    item.customer_name.length > 15
                        ? `${item.customer_name.substring(0, 15)}…`
                        : item.customer_name,
                debt: item.total_debt,
                fullName: item.customer_name,
            }));

        const txVolumeData = [...report]
            .sort((a, b) => b.transaction_count - a.transaction_count)
            .slice(0, 6)
            .map((item) => ({
                name:
                    item.customer_name.length > 12
                        ? `${item.customer_name.substring(0, 12)}…`
                        : item.customer_name,
                count: item.transaction_count,
            }));

        return { pieData, topDebtors, txVolumeData, totalDebt, totalPaid };
    }, [report]);

    if (!chartData) {
        return (
            <div className="reports-chart-empty min-h-[200px] flex-col gap-3 px-4 py-14 text-center">
                <Activity size={40} className="text-slate-300" aria-hidden />
                <p className="text-sm font-medium text-slate-500">Chưa có dữ liệu để phân tích</p>
                <p className="text-xs text-slate-400">Thêm khách hàng và giao dịch để xem biểu đồ.</p>
            </div>
        );
    }

    const { pieData, topDebtors, txVolumeData } = chartData;
    const denom = chartData.totalPaid + chartData.totalDebt;
    const recoveryPct = denom > 0 ? ((chartData.totalPaid / denom) * 100).toFixed(1) : '0.0';
    const avgDebtPerCustomer =
        report.length > 0 ? chartData.totalDebt / report.length : 0;

    return (
        <div className="reports-charts-root space-y-6 lg:space-y-8">
            <section className="reports-page__kpi-grid reports-page__kpi-grid--3" aria-label="Chỉ số phân tích">
                <div className="reports-page__kpi-card reports-page__kpi-card--recovery">
                    <div className="relative z-[1] flex items-start gap-3">
                        <div
                            className="reports-page__kpi-icon reports-page__kpi-icon--collected"
                            aria-hidden
                        >
                            <DollarSign size={20} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="reports-page__kpi-label">Tỷ lệ thu hồi</p>
                            <div className="mt-2 flex items-baseline gap-1.5">
                                <span className="reports-page__kpi-value text-emerald-950">
                                    {recoveryPct}
                                </span>
                                <span className="reports-page__kpi-suffix">%</span>
                            </div>
                            <p className="reports-page__kpi-foot">
                                Đã thu so với tổng (đã thu + còn nợ) trên toàn danh sách.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="reports-page__kpi-card reports-page__kpi-card--principal">
                    <div className="relative z-[1] flex items-start gap-3">
                        <div
                            className="reports-page__kpi-icon reports-page__kpi-icon--principal"
                            aria-hidden
                        >
                            <Users size={20} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="reports-page__kpi-label">Tổng khách hàng</p>
                            <div className="mt-2 flex items-baseline gap-1.5">
                                <span className="reports-page__kpi-value">{report.length}</span>
                                <span className="reports-page__kpi-suffix">KH</span>
                            </div>
                            <p className="reports-page__kpi-foot">Số khách có trong báo cáo công nợ.</p>
                        </div>
                    </div>
                </div>

                <div className="reports-page__kpi-card reports-page__kpi-card--avg-debt">
                    <div className="relative z-[1] flex items-start gap-3">
                        <div
                            className="reports-page__kpi-icon reports-page__kpi-icon--avg-debt"
                            aria-hidden
                        >
                            <TrendingUp size={20} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="reports-page__kpi-label">Trung bình nợ / KH</p>
                            <div className="mt-2 flex flex-wrap items-baseline gap-1.5">
                                <span className="reports-page__kpi-value text-violet-950">
                                    {avgDebtPerCustomer.toLocaleString('vi-VN', {
                                        maximumFractionDigits: 0,
                                    })}
                                </span>
                                <span className="reports-page__kpi-suffix">đ</span>
                            </div>
                            <p className="reports-page__kpi-foot">Còn nợ tổng chia cho số khách hàng.</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="reports-page__charts-panel" aria-label="Biểu đồ phân tích">
                <div className="reports-page__charts-panel-accent" aria-hidden />
                <div className="reports-page__charts-panel-inner space-y-5">
                    <div className="border-b border-slate-100 pb-4">
                        <h2 className="section-kicker text-slate-800">
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 shadow-sm">
                                <BarChart3 size={17} />
                            </span>
                            Biểu đồ
                        </h2>
                        <p className="section-subtitle mt-1.5 max-w-3xl">
                            Phân bổ đã thu / còn nợ, top nợ và tần suất giao dịch theo khách.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        <div className="reports-chart-card">
                            <h3 className="reports-chart-card__title">
                                <PieChart size={16} className="text-blue-600" />
                                Phân bổ công nợ
                            </h3>
                            <p className="reports-chart-card__desc">
                                Tỷ trọng đã thanh toán và còn nợ trên tổng số liệu tổng hợp.
                            </p>
                            <ResponsiveContainer width="100%" height={280} minHeight={220}>
                                <RechartsPieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) =>
                                            `${name}: ${(percent * 100).toFixed(0)}%`
                                        }
                                        outerRadius={90}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => `${Number(value).toLocaleString('vi-VN')} đ`} />
                                </RechartsPieChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="reports-chart-card">
                            <h3 className="reports-chart-card__title">
                                <BarChart3 size={16} className="text-amber-600" />
                                Top 5 khách còn nợ lớn
                            </h3>
                            <p className="reports-chart-card__desc">
                                So sánh nhanh dư nợ hiện tại theo khách hàng.
                            </p>
                            <ResponsiveContainer width="100%" height={280} minHeight={220}>
                                <BarChart data={topDebtors}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="name"
                                        style={{ fontSize: '11px' }}
                                        angle={-15}
                                        textAnchor="end"
                                        height={72}
                                    />
                                    <YAxis
                                        tickFormatter={(value) =>
                                            value >= 1e6
                                                ? `${(value / 1e6).toFixed(1)}M`
                                                : `${(value / 1e3).toFixed(0)}k`
                                        }
                                    />
                                    <Tooltip
                                        formatter={(value) => [
                                            `${Number(value).toLocaleString('vi-VN')} đ`,
                                            'Còn nợ',
                                        ]}
                                        labelFormatter={(label, payload) =>
                                            payload?.[0]?.payload?.fullName || label
                                        }
                                        contentStyle={{
                                            borderRadius: 10,
                                            border: 'none',
                                            fontSize: 12,
                                        }}
                                    />
                                    <Bar
                                        dataKey="debt"
                                        name="Số nợ"
                                        fill="url(#colorDebtAnalytics)"
                                        radius={[6, 6, 0, 0]}
                                    />
                                    <defs>
                                        <linearGradient
                                            id="colorDebtAnalytics"
                                            x1="0"
                                            y1="0"
                                            x2="0"
                                            y2="1"
                                        >
                                            <stop offset="0%" stopColor="#f59e0b" stopOpacity={1} />
                                            <stop offset="100%" stopColor="#ef4444" stopOpacity={0.85} />
                                        </linearGradient>
                                    </defs>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="reports-chart-card lg:col-span-2">
                            <h3 className="reports-chart-card__title">
                                <Activity size={16} className="text-indigo-600" />
                                Hoạt động giao dịch (top khách)
                            </h3>
                            <p className="reports-chart-card__desc">
                                Số lượng giao dịch theo khách — ưu tiên khách có nhiều GD nhất.
                            </p>
                            <ResponsiveContainer width="100%" height={280} minHeight={220}>
                                <BarChart data={txVolumeData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis dataKey="name" style={{ fontSize: '11px' }} />
                                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                                    <Tooltip
                                        formatter={(value) => [value, 'Số lượng GD']}
                                        contentStyle={{
                                            borderRadius: 10,
                                            border: 'none',
                                            fontSize: 12,
                                        }}
                                    />
                                    <Bar
                                        dataKey="count"
                                        name="Số lượng GD"
                                        fill="url(#colorTxAnalytics)"
                                        radius={[6, 6, 0, 0]}
                                    />
                                    <defs>
                                        <linearGradient
                                            id="colorTxAnalytics"
                                            x1="0"
                                            y1="0"
                                            x2="0"
                                            y2="1"
                                        >
                                            <stop offset="0%" stopColor="#6366f1" stopOpacity={1} />
                                            <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.85} />
                                        </linearGradient>
                                    </defs>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
