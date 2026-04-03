import React, { useMemo } from 'react';
import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    ScatterChart,
    Scatter,
} from 'recharts';
import { BarChart3, PieChart as PieChartIcon, GitCompareArrows, Waypoints } from 'lucide-react';

function toNum(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
}

function shortName(name, max = 14) {
    const s = String(name ?? '');
    if (s.length <= max) return s;
    return `${s.slice(0, max - 1)}…`;
}

const COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ec4899', '#06b6d4', '#64748b'];

/** Biểu đồ trực quan trên trang Tổng quan (mọi vai trò đăng nhập) */
export default function ReportsAdminCharts({ report }) {
    const datasets = useMemo(() => {
        if (!Array.isArray(report) || report.length === 0) return null;

        const rows = report.map((item) => ({
            customer_id: item.customer_id,
            customer_name: item.customer_name ?? '—',
            transaction_count: toNum(item.transaction_count),
            total_principal: toNum(item.total_principal),
            total_interest: toNum(item.total_interest),
            total_collected: toNum(item.total_collected),
            total_debt: toNum(item.total_debt),
        }));

        const totalDebtAll = rows.reduce((s, r) => s + r.total_debt, 0);
        const sortedByDebt = [...rows].sort((a, b) => b.total_debt - a.total_debt);
        const top5Debt = sortedByDebt.filter((r) => r.total_debt > 0).slice(0, 5);
        const top5Sum = top5Debt.reduce((s, r) => s + r.total_debt, 0);
        const otherDebt = Math.max(0, totalDebtAll - top5Sum);

        const concentrationPie = [
            ...top5Debt.map((r, i) => ({
                name: shortName(r.customer_name, 12),
                fullName: r.customer_name,
                value: r.total_debt,
                color: COLORS[i % COLORS.length],
            })),
        ];
        if (otherDebt > 0) {
            concentrationPie.push({
                name: 'Khác',
                fullName: 'Các khách hàng còn lại',
                value: otherDebt,
                color: '#94a3b8',
            });
        }

        const horizontalTop10 = sortedByDebt
            .filter((r) => r.total_debt > 0)
            .slice(0, 10)
            .map((r) => ({
                name: shortName(r.customer_name, 18),
                fullName: r.customer_name,
                debt: r.total_debt,
            }));

        const stackedTop8 = sortedByDebt.slice(0, 8).map((r) => ({
            name: shortName(r.customer_name, 12),
            fullName: r.customer_name,
            daThu: r.total_collected,
            conNo: r.total_debt,
        }));

        const groupedPrincipalInterest = [...rows]
            .sort((a, b) => b.total_principal - a.total_principal)
            .slice(0, 6)
            .map((r) => ({
                name: shortName(r.customer_name, 10),
                fullName: r.customer_name,
                goc: r.total_principal,
                lai: r.total_interest,
            }));

        const scatter = rows
            .filter((r) => r.transaction_count > 0 || r.total_debt > 0)
            .map((r) => ({
                name: r.customer_name,
                tx: r.transaction_count,
                debt: r.total_debt,
            }));

        const top3Share =
            totalDebtAll > 0
                ? ((sortedByDebt.slice(0, 3).reduce((s, r) => s + r.total_debt, 0) / totalDebtAll) * 100).toFixed(1)
                : null;

        return {
            concentrationPie,
            horizontalTop10,
            stackedTop8,
            groupedPrincipalInterest,
            scatter,
            totalDebtAll,
            top3Share,
        };
    }, [report]);

    if (!datasets) {
        return (
            <div className="reports-chart-empty min-h-[140px] px-4 py-10 text-center text-sm">
                Chưa có dữ liệu khách hàng để vẽ biểu đồ.
            </div>
        );
    }

    const {
        concentrationPie,
        horizontalTop10,
        stackedTop8,
        groupedPrincipalInterest,
        scatter,
        totalDebtAll,
        top3Share,
    } = datasets;

    const fmtMoney = (v) => `${toNum(v).toLocaleString('vi-VN')} đ`;

    const pieHasData = concentrationPie.length > 0 && totalDebtAll > 0;

    return (
        <div className="reports-charts-root space-y-5">
            <div className="flex flex-col gap-2 border-b border-slate-100 pb-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0">
                    <h2 className="section-kicker text-slate-800">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 shadow-sm">
                            <BarChart3 size={17} />
                        </span>
                        Biểu đồ trực quan
                    </h2>
                    <p className="section-subtitle mt-1.5 max-w-3xl">
                        Tập trung nợ, top công nợ, cơ cấu thu / nợ và mối quan hệ số giao dịch.
                    </p>
                </div>
                {top3Share != null && (
                    <p className="shrink-0 rounded-lg border border-slate-200/80 bg-slate-50/80 px-3 py-2 text-xs font-semibold text-slate-600 tabular-nums shadow-sm">
                        Top 3 KH:{' '}
                        <span className="text-blue-700">{top3Share}%</span> tổng còn nợ
                    </p>
                )}
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {/* 1. Tập trung nợ */}
                <div className="reports-chart-card">
                    <h3 className="reports-chart-card__title">
                        <PieChartIcon size={16} className="text-blue-600" />
                        Tập trung còn nợ (Top 5 + khác)
                    </h3>
                    <p className="reports-chart-card__desc">Tỷ trọng nợ hiện tại theo nhóm khách hàng.</p>
                    {pieHasData ? (
                        <ResponsiveContainer width="100%" height={300} minHeight={260}>
                            <PieChart>
                                <Pie
                                    data={concentrationPie}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={56}
                                    outerRadius={88}
                                    paddingAngle={2}
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {concentrationPie.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} stroke="#fff" strokeWidth={1} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value) => fmtMoney(value)}
                                    labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName ?? ''}
                                />
                                <Legend wrapperStyle={{ fontSize: 12 }} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="reports-chart-empty h-[260px]">Không có dư nợ để phân tích tập trung.</div>
                    )}
                </div>

                {/* 2. Top 10 còn nợ — cột ngang */}
                <div className="reports-chart-card">
                    <h3 className="reports-chart-card__title">
                        <BarChart3 size={16} className="text-amber-600" />
                        Top 10 khách còn nợ lớn
                    </h3>
                    <p className="reports-chart-card__desc">Tên khách theo trục dọc — so sánh nhanh trên màn rộng.</p>
                    {horizontalTop10.length > 0 ? (
                        <ResponsiveContainer width="100%" height={320} minHeight={280}>
                            <BarChart data={horizontalTop10} layout="vertical" margin={{ left: 8, right: 16 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                                <XAxis type="number" tickFormatter={(v) => (v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : `${(v / 1e3).toFixed(0)}k`)} />
                                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                                <Tooltip
                                    formatter={(v) => fmtMoney(v)}
                                    labelFormatter={(_, p) => p?.[0]?.payload?.fullName ?? ''}
                                    contentStyle={{ borderRadius: 10, border: 'none', fontSize: 12 }}
                                />
                                <Bar dataKey="debt" name="Còn nợ" fill="#f59e0b" radius={[0, 6, 6, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="reports-chart-empty h-[280px]">Không có khoản nợ dương trong danh sách.</div>
                    )}
                </div>

                {/* 3. Đã thu + còn nợ chồng */}
                <div className="reports-chart-card">
                    <h3 className="reports-chart-card__title">
                        <GitCompareArrows size={16} className="text-emerald-600" />
                        Đã thu và còn nợ (Top 8 khách)
                    </h3>
                    <p className="reports-chart-card__desc">Cột chồng: đã thanh toán (xanh) và còn nợ (cam).</p>
                    <ResponsiveContainer width="100%" height={300} minHeight={260}>
                        <BarChart data={stackedTop8} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis
                                dataKey="name"
                                tick={{ fontSize: 9 }}
                                interval={0}
                                angle={-32}
                                textAnchor="end"
                                height={72}
                            />
                            <YAxis tickFormatter={(v) => (v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : `${(v / 1e3).toFixed(0)}k`)} />
                            <Tooltip
                                formatter={(value, name) => [fmtMoney(value), name]}
                                labelFormatter={(_, p) => p?.[0]?.payload?.fullName ?? ''}
                                contentStyle={{ borderRadius: 10, border: 'none', fontSize: 12 }}
                            />
                            <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />
                            <Bar dataKey="daThu" stackId="s" fill="#10b981" name="Đã thu" radius={[0, 0, 0, 0]} />
                            <Bar dataKey="conNo" stackId="s" fill="#f59e0b" name="Còn nợ" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* 4. Scatter: số GD vs còn nợ */}
                <div className="reports-chart-card">
                    <h3 className="reports-chart-card__title">
                        <Waypoints size={16} className="text-indigo-600" />
                        Số giao dịch và quy mô còn nợ
                    </h3>
                    <p className="reports-chart-card__desc">Mỗi điểm là một khách — trục X: số giao dịch, trục Y: còn nợ.</p>
                    {scatter.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300} minHeight={260}>
                            <ScatterChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis type="number" dataKey="tx" name="Số GD" tick={{ fontSize: 11 }} allowDecimals={false} />
                                <YAxis
                                    type="number"
                                    dataKey="debt"
                                    name="Còn nợ"
                                    tickFormatter={(v) => (v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : `${(v / 1e3).toFixed(0)}k`)}
                                />
                                <Tooltip
                                    cursor={{ strokeDasharray: '4 4' }}
                                    content={({ active, payload }) => {
                                        if (!active || !payload?.length) return null;
                                        const d = payload[0].payload;
                                        return (
                                            <div className="rounded-lg border border-slate-100 bg-white px-3 py-2 text-xs shadow-lg">
                                                <p className="font-semibold text-slate-800">{d.name}</p>
                                                <p className="text-slate-600">GD: {d.tx}</p>
                                                <p className="text-slate-600">Còn nợ: {fmtMoney(d.debt)}</p>
                                            </div>
                                        );
                                    }}
                                />
                                <Scatter name="Khách hàng" data={scatter} fill="#6366f1" fillOpacity={0.75} />
                            </ScatterChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="reports-chart-empty h-[260px]">Không đủ điểm dữ liệu.</div>
                    )}
                </div>
            </div>

            {/* Hàng 2: Gốc vs lãi nhóm — full width */}
            <div className="reports-chart-card">
                <h3 className="reports-chart-card__title">
                    <BarChart3 size={16} className="text-sky-600" />
                    Tổng gốc vay và tổng lãi (Top 6 theo gốc)
                </h3>
                <p className="reports-chart-card__desc">So sánh gốc (xanh dương) và lãi dự kiến (tím) theo khách.</p>
                <ResponsiveContainer width="100%" height={300} minHeight={260}>
                    <BarChart data={groupedPrincipalInterest} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tickFormatter={(v) => (v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : `${(v / 1e3).toFixed(0)}k`)} />
                        <Tooltip
                            formatter={(value, name) => [fmtMoney(value), name]}
                            labelFormatter={(_, p) => p?.[0]?.payload?.fullName ?? ''}
                            contentStyle={{ borderRadius: 10, border: 'none', fontSize: 12 }}
                        />
                        <Legend />
                        <Bar dataKey="goc" name="Tổng gốc vay" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="lai" name="Tổng lãi" fill="#a855f7" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
