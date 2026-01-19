import React from 'react';

/**
 * LoadingSkeleton Component
 * Provides skeleton loading states to prevent layout shift
 * Follows UX Guideline #11: "Show feedback during async operations"
 */

export const TableSkeleton = ({ rows = 5, columns = 5 }) => {
    return (
        <div className="card overflow-hidden">
            <div className="overflow-x-auto">
                <table className="table">
                    <thead className="table-head">
                        <tr>
                            {Array.from({ length: columns }).map((_, i) => (
                                <th key={i} className="table-th">
                                    <div className="skeleton-text w-20"></div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {Array.from({ length: rows }).map((_, rowIndex) => (
                            <tr key={rowIndex} className="border-b border-slate-100">
                                {Array.from({ length: columns }).map((_, colIndex) => (
                                    <td key={colIndex} className="table-td">
                                        <div className="skeleton-text w-full"></div>
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export const CardSkeleton = ({ count = 3 }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="skeleton-card">
                    <div className="skeleton-title w-3/4 mb-2"></div>
                    <div className="skeleton-text w-full mb-2"></div>
                    <div className="skeleton-text w-2/3"></div>
                </div>
            ))}
        </div>
    );
};

export const FormSkeleton = () => {
    return (
        <div className="space-y-6">
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                    <div className="skeleton-text w-24 h-5"></div>
                    <div className="skeleton h-11 w-full rounded-xl"></div>
                </div>
            ))}
            <div className="flex gap-3 justify-end">
                <div className="skeleton h-10 w-24 rounded-xl"></div>
                <div className="skeleton h-10 w-24 rounded-xl"></div>
            </div>
        </div>
    );
};

export const ListSkeleton = ({ items = 5 }) => {
    return (
        <div className="space-y-4">
            {Array.from({ length: items }).map((_, i) => (
                <div key={i} className="card p-4 flex items-center gap-4">
                    <div className="skeleton-circle w-12 h-12"></div>
                    <div className="flex-1 space-y-2">
                        <div className="skeleton-text w-1/3"></div>
                        <div className="skeleton-text w-1/2"></div>
                    </div>
                    <div className="skeleton w-20 h-8 rounded-lg"></div>
                </div>
            ))}
        </div>
    );
};

export const StatsSkeleton = ({ count = 4 }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="card p-6 space-y-3">
                    <div className="skeleton-text w-24"></div>
                    <div className="skeleton-title w-32"></div>
                    <div className="skeleton-text w-20"></div>
                </div>
            ))}
        </div>
    );
};

// Default export for convenience
const LoadingSkeleton = {
    Table: TableSkeleton,
    Card: CardSkeleton,
    Form: FormSkeleton,
    List: ListSkeleton,
    Stats: StatsSkeleton,
};

export default LoadingSkeleton;
