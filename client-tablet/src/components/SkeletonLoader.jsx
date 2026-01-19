import React from 'react';
import { clsx } from 'clsx';

/**
 * Base Skeleton component
 */
export function Skeleton({ className, ...props }) {
    return (
        <div
            className={clsx(
                "animate-pulse bg-slate-200 rounded",
                className
            )}
            {...props}
        />
    );
}

/**
 * Skeleton for Customer Card
 */
export function SkeletonCard() {
    return (
        <div className="bg-white rounded-[2rem] border border-slate-100 p-5 shadow-sm">
            {/* Avatar and Name */}
            <div className="flex items-center gap-4 mb-5">
                <Skeleton className="w-14 h-14 rounded-2xl" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4 rounded-lg" />
                    <Skeleton className="h-3 w-1/2 rounded-lg" />
                </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-3 mb-6">
                <div className="flex items-start gap-2.5">
                    <Skeleton className="w-6 h-6 rounded-lg" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-3 w-full rounded-lg" />
                        <Skeleton className="h-3 w-2/3 rounded-lg" />
                    </div>
                </div>
            </div>

            {/* Action Button */}
            <div className="pt-4 border-t border-slate-50">
                <Skeleton className="h-10 w-full rounded-xl" />
            </div>
        </div>
    );
}

/**
 * Skeleton for Table Row
 */
export function SkeletonTableRow({ columns = 10 }) {
    return (
        <tr className="border-b border-slate-100">
            {Array.from({ length: columns }).map((_, i) => (
                <td key={i} className="px-6 py-4">
                    <Skeleton className="h-4 w-full rounded-lg" />
                </td>
            ))}
        </tr>
    );
}

/**
 * Skeleton for Transaction Table
 */
export function SkeletonTable({ rows = 5, columns = 10 }) {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                            {Array.from({ length: columns }).map((_, i) => (
                                <th key={i} className="px-6 py-4">
                                    <Skeleton className="h-3 w-20 rounded-lg" />
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {Array.from({ length: rows }).map((_, i) => (
                            <SkeletonTableRow key={i} columns={columns} />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

/**
 * Skeleton for Analytics Stat Card
 */
export function SkeletonStat() {
    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
                <Skeleton className="w-10 h-10 rounded-lg" />
                <Skeleton className="h-4 w-24 rounded-lg" />
            </div>
            <Skeleton className="h-8 w-32 rounded-lg mt-2" />
        </div>
    );
}

/**
 * Skeleton for Chart
 */
export function SkeletonChart({ height = 300 }) {
    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <Skeleton className="h-6 w-48 rounded-lg mb-4" />
            <Skeleton className={`w-full rounded-lg`} style={{ height: `${height}px` }} />
        </div>
    );
}
