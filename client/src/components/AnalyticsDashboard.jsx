import React, { useMemo } from 'react';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, DollarSign, Users, Activity } from 'lucide-react';

export default function AnalyticsDashboard({ report }) {
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

        return { pieData, topDebtors, txVolumeData, totalDebt, totalPaid };
    }, [report]);

    if (!chartData) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                <Activity size={64} className="opacity-20 mb-4" />
                <p className="text-lg font-medium">Chưa có dữ liệu để phân tích</p>
            </div>
        );
    }

    const { pieData, topDebtors, txVolumeData } = chartData;

    return (
        <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 rounded-2xl text-white shadow-lg shadow-emerald-200">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                            <DollarSign size={24} />
                        </div>
                        <span className="font-medium text-emerald-100">Tỷ lệ thu hồi</span>
                    </div>
                    <div className="text-3xl font-bold">
                        {((chartData.totalPaid / (chartData.totalPaid + chartData.totalDebt)) * 100 || 0).toFixed(1)}%
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <Users size={24} />
                        </div>
                        <span className="font-medium text-slate-600">Tổng khách hàng</span>
                    </div>
                    <div className="text-3xl font-bold text-slate-900">{report.length}</div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                            <TrendingUp size={24} />
                        </div>
                        <span className="font-medium text-slate-600">Trung bình nợ/KH</span>
                    </div>
                    <div className="text-3xl font-bold text-slate-900">
                        {(chartData.totalDebt / report.length || 0).toLocaleString('vi-VN', { maximumFractionDigits: 0 })}
                        <span className="text-sm text-slate-400 ml-1">đ</span>
                    </div>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pie Chart - Debt Distribution */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full"></div>
                        Phân bổ công nợ
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value) => value.toLocaleString('vi-VN') + ' đ'} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Bar Chart - Top Debtors */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <div className="w-1 h-6 bg-gradient-to-b from-amber-500 to-orange-500 rounded-full"></div>
                        Top 5 khách hàng nợ nhiều
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
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
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <div className="w-1 h-6 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full"></div>
                        Hoạt động giao dịch (Top khách hàng)
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
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
