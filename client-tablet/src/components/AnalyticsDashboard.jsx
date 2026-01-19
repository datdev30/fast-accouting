import React, { useMemo, useState, useRef, useEffect } from 'react';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, DollarSign, Users, Activity, AlertCircle, ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';

const YEAR_OPTIONS = (() => {
    const end = Math.max(2025, new Date().getFullYear());
    return Array.from({ length: end - 2025 + 1 }, (_, i) => 2025 + i);
})();

export default function AnalyticsDashboard({ report, chartYear, onChartYearChange, monthlyData, monthlyLoading }) {
    const [yearOpen, setYearOpen] = useState(false);
    const yearRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(e) {
            if (yearRef.current && !yearRef.current.contains(e.target)) setYearOpen(false);
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const currentYear = chartYear ?? Math.max(2025, new Date().getFullYear());

    // Prepare data for charts
    const chartData = useMemo(() => {
        if (!report || report.length === 0) return null;

        // 1. Pie Chart Data - Debt Distribution
        const totalDebt = report.reduce((sum, item) => sum + item.total_debt, 0);
        const totalPaid = report.reduce((sum, item) => sum + (item.total_collected || 0), 0);

        const pieData = [
            { name: 'Đã thanh toán', value: totalPaid, color: '#10b981' },
            { name: 'Còn nợ', value: totalDebt, color: '#f59e0b' },
        ];

        // 2. Bar Chart Data - Top Debtors
        const topDebtors = [...report]
            .sort((a, b) => b.total_debt - a.total_debt)
            .slice(0, 5)
            .map(item => ({
                name: item.customer_name.length > 15 ? item.customer_name.substring(0, 15) + '...' : item.customer_name,
                debt: item.total_debt,
                fullName: item.customer_name
            }));

        // 3. Transaction Volume by Customer (simplified)
        const txVolumeData = [...report]
            .sort((a, b) => b.transaction_count - a.transaction_count)
            .slice(0, 6)
            .map(item => ({
                name: item.customer_name.length > 12 ? item.customer_name.substring(0, 12) + '...' : item.customer_name,
                count: item.transaction_count
            }));

        // Số khách hàng còn nợ (total_debt > 0)
        const countWithDebt = report.filter(i => (i.total_debt || 0) > 0).length;

        return { pieData, topDebtors, txVolumeData, totalDebt, totalPaid, countWithDebt };
    }, [report]);

    if (!chartData) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                <Activity size={64} className="opacity-20 mb-4" />
                <p className="text-lg font-medium text-slate-500">Chưa có dữ liệu để phân tích</p>
            </div>
        );
    }

    const { pieData, topDebtors, txVolumeData } = chartData;

    return (
        <div className="space-y-6">
            {/* Summary Stats - Responsive: 4 cols (tablet-lg+), 2 cols (tablet), 1 col (mobile) */}
            <div className="grid grid-cols-1 tablet:grid-cols-2 tablet-lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 tablet-lg:p-6 tablet:p-5 rounded-2xl text-white shadow-lg shadow-emerald-200">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                            <DollarSign size={24} className="tablet-lg:w-6 tablet-lg:h-6 tablet:w-5 tablet:h-5" />
                        </div>
                        <span className="font-medium text-emerald-100 text-sm tablet-lg:text-sm tablet:text-sm">Tỷ lệ thu hồi</span>
                    </div>
                    <div className="text-3xl tablet-lg:text-2xl tablet:text-2xl font-bold">
                        {((chartData.totalPaid / (chartData.totalPaid + chartData.totalDebt)) * 100 || 0).toFixed(1)}%
                    </div>
                </div>

                <div className="bg-white p-6 tablet-lg:p-6 tablet:p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-teal-50 text-teal-700 rounded-lg">
                            <Users size={24} className="tablet-lg:w-6 tablet-lg:h-6 tablet:w-5 tablet:h-5" />
                        </div>
                        <span className="font-medium text-slate-600 text-sm tablet-lg:text-sm tablet:text-sm">Tổng khách hàng</span>
                    </div>
                    <div className="text-3xl tablet-lg:text-2xl tablet:text-2xl font-bold text-slate-900">{report.length}</div>
                </div>

                <div className="bg-white p-6 tablet-lg:p-6 tablet:p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                            <AlertCircle size={24} className="tablet-lg:w-6 tablet-lg:h-6 tablet:w-5 tablet:h-5" />
                        </div>
                        <span className="font-medium text-slate-600 text-sm tablet-lg:text-sm tablet:text-sm">Khách hàng còn nợ</span>
                    </div>
                    <div className="text-3xl tablet-lg:text-2xl tablet:text-2xl font-bold text-amber-600">
                        {chartData.countWithDebt}
                    </div>
                </div>

                <div className="bg-white p-6 tablet-lg:p-6 tablet:p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                            <TrendingUp size={24} className="tablet-lg:w-6 tablet-lg:h-6 tablet:w-5 tablet:h-5" />
                        </div>
                        <span className="font-medium text-slate-600 text-sm tablet-lg:text-sm tablet:text-sm">Trung bình nợ/KH</span>
                    </div>
                    <div className="text-3xl tablet-lg:text-2xl tablet:text-2xl font-bold text-slate-900">
                        {(chartData.totalDebt / report.length || 0).toLocaleString('vi-VN', { maximumFractionDigits: 0 })}
                        <span className="text-sm text-slate-400 ml-1">đ</span>
                    </div>
                </div>
            </div>

            {/* Charts Grid - Responsive: 2 cols (tablet-lg+), 1 col (tablet/mobile) */}
            <div className="grid grid-cols-1 tablet-lg:grid-cols-2 gap-6">
                {/* Line Chart - Số giao dịch theo tháng */}
                <div className="bg-white p-6 tablet-lg:p-6 tablet:p-5 rounded-2xl border border-slate-200 shadow-sm tablet-lg:col-span-2">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                        <h3 className="text-lg tablet-lg:text-lg tablet:text-base font-bold text-slate-800 flex items-center gap-2">
                            <div className="w-1 h-6 tablet-lg:h-6 tablet:h-5 bg-gradient-to-b from-cyan-500 to-teal-500 rounded-full" />
                            Số giao dịch theo tháng
                        </h3>
                        <div ref={yearRef} className="relative inline-flex">
                            <button
                                type="button"
                                onClick={() => setYearOpen((v) => !v)}
                                className={clsx(
                                    'w-fit py-2 px-3 text-sm font-semibold text-slate-800 flex items-center gap-1.5',
                                    'bg-white border border-slate-200 rounded-xl shadow-sm transition-colors cursor-pointer',
                                    'outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500',
                                    yearOpen && 'ring-2 ring-teal-500/50 border-teal-500'
                                )}
                            >
                                <span>{currentYear}</span>
                                <ChevronDown size={16} className={clsx('text-slate-400 shrink-0 transition-transform', yearOpen && 'rotate-180')} />
                            </button>
                            {yearOpen && (
                                <div className="absolute z-50 right-0 top-full mt-1.5 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                                    {YEAR_OPTIONS.map((y) => (
                                        <button
                                            key={y}
                                            type="button"
                                            onClick={() => { onChartYearChange?.(y); setYearOpen(false); }}
                                            className={clsx(
                                                'w-full px-3 py-2 text-left text-sm font-medium transition-colors',
                                                y === currentYear
                                                    ? 'bg-teal-50 text-teal-700'
                                                    : 'text-slate-700 hover:bg-slate-50'
                                            )}
                                        >
                                            {y}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    {monthlyLoading ? (
                        <div className="h-[300px] min-h-[250px] flex items-center justify-center text-slate-400">
                            <span className="text-sm font-medium">Đang tải...</span>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={300} minHeight={250}>
                            <LineChart data={monthlyData || []}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="label" style={{ fontSize: '11px' }} />
                                <YAxis allowDecimals={false} />
                                <Tooltip
                                    formatter={(value) => [value, 'Số giao dịch']}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="count"
                                    name="Số giao dịch"
                                    stroke="#0d9488"
                                    strokeWidth={2}
                                    dot={{ r: 4, fill: '#0d9488' }}
                                    activeDot={{ r: 6, fill: '#0f766e' }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Pie Chart - Debt Distribution (Donut + gradient + center + legend) */}
                <div className="bg-white p-6 tablet-lg:p-6 tablet:p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg tablet-lg:text-lg tablet:text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <div className="w-1 h-6 tablet-lg:h-6 tablet:h-5 bg-gradient-to-b from-teal-500 to-teal-600 rounded-full" />
                        Phân bổ công nợ
                    </h3>
                    <div className="relative">
                        <ResponsiveContainer width="100%" height={240}>
                            <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                                <defs>
                                    <linearGradient id="pieGradGreen" x1="0" y1="0" x2="1" y2="1">
                                        <stop offset="0%" stopColor="#059669" />
                                        <stop offset="100%" stopColor="#34d399" />
                                    </linearGradient>
                                    <linearGradient id="pieGradAmber" x1="0" y1="0" x2="1" y2="1">
                                        <stop offset="0%" stopColor="#d97706" />
                                        <stop offset="100%" stopColor="#fcd34d" />
                                    </linearGradient>
                                    <filter id="pieGreenShadow" x="-40%" y="-40%" width="180%" height="180%">
                                        <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#059669" floodOpacity="0.2" />
                                    </filter>
                                </defs>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={52}
                                    outerRadius={88}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="#fff"
                                    strokeWidth={2}
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.name === 'Đã thanh toán' ? 'url(#pieGradGreen)' : 'url(#pieGradAmber)'}
                                            filter={entry.name === 'Đã thanh toán' ? 'url(#pieGreenShadow)' : undefined}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v) => v.toLocaleString('vi-VN') + ' đ'} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="text-center">
                                <p className="text-xl font-bold text-slate-800">
                                    {(chartData.totalPaid + chartData.totalDebt).toLocaleString('vi-VN')}
                                </p>
                                <p className="text-[10px] uppercase tracking-wider text-slate-500 mt-0.5"></p>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-wrap justify-center gap-x-6 gap-y-1 mt-3 pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                            <span className="text-sm text-slate-600">Đã thanh toán</span>
                            <span className="text-sm font-semibold text-slate-800">
                                {chartData.totalPaid.toLocaleString('vi-VN')} đ
                            </span>
                            <span className="text-xs text-slate-400">
                                ({((chartData.totalPaid / (chartData.totalPaid + chartData.totalDebt)) * 100 || 0).toFixed(0)}%)
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                            <span className="text-sm text-slate-600">Còn nợ</span>
                            <span className="text-sm font-semibold text-slate-800">
                                {chartData.totalDebt.toLocaleString('vi-VN')} đ
                            </span>
                            <span className="text-xs text-slate-400">
                                ({((chartData.totalDebt / (chartData.totalPaid + chartData.totalDebt)) * 100 || 0).toFixed(0)}%)
                            </span>
                        </div>
                    </div>
                </div>

                {/* Bar Chart - Top Debtors */}
                <div className="bg-white p-6 tablet-lg:p-6 tablet:p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg tablet-lg:text-lg tablet:text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <div className="w-1 h-6 tablet-lg:h-6 tablet:h-5 bg-gradient-to-b from-amber-500 to-orange-500 rounded-full"></div>
                        Top 5 khách hàng nợ nhiều
                    </h3>
                    <ResponsiveContainer width="100%" height={300} minHeight={250}>
                        <BarChart data={topDebtors}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis
                                dataKey="name"
                                style={{ fontSize: '12px' }}
                                angle={-15}
                                textAnchor="end"
                                height={80}
                            />
                            <YAxis
                                tickFormatter={(value) => (value / 1000000).toFixed(1) + 'M'}
                            />
                            <Tooltip
                                formatter={(value) => [value.toLocaleString('vi-VN') + ' đ', 'Số nợ']}
                                labelFormatter={(label, payload) => payload[0]?.payload?.fullName || label}
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Bar dataKey="debt" name="Số nợ" fill="url(#colorDebt)" radius={[8, 8, 0, 0]} />
                            <defs>
                                <linearGradient id="colorDebt" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={1} />
                                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0.8} />
                                </linearGradient>
                            </defs>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Bar Chart - Transaction Volume */}
                <div className="bg-white p-6 tablet-lg:p-6 tablet:p-5 rounded-2xl border border-slate-200 shadow-sm tablet-lg:col-span-2">
                    <h3 className="text-lg tablet-lg:text-lg tablet:text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <div className="w-1 h-6 tablet-lg:h-6 tablet:h-5 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full"></div>
                        Hoạt động giao dịch (Top khách hàng)
                    </h3>
                    <ResponsiveContainer width="100%" height={300} minHeight={250}>
                        <BarChart data={txVolumeData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="name" style={{ fontSize: '12px' }} />
                            <YAxis />
                            <Tooltip
                                formatter={(value) => [value, 'Số lượng GD']}
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Bar dataKey="count" name="Số lượng GD" fill="url(#colorTx)" radius={[8, 8, 0, 0]} />
                            <defs>
                                <linearGradient id="colorTx" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#6366f1" stopOpacity={1} />
                                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.8} />
                                </linearGradient>
                            </defs>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
