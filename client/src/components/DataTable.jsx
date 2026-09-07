import React from 'react';
import { clsx } from 'clsx';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';

/**
 * Bảng dữ liệu tự đổi hình thái theo bề rộng.
 *
 * Bảng và thẻ sinh ra từ CÙNG một định nghĩa cột, nên không phải viết
 * markup hai lần như cách Transactions.jsx đang làm (F8).
 *
 *   priority 1 → dòng tiêu đề của thẻ; luôn là một cột trong bảng
 *   priority 2 → cặp nhãn–giá trị trong thẻ; luôn là một cột trong bảng
 *   priority 3 → cặp nhãn–giá trị trong thẻ; trong bảng chỉ hiện từ lg
 *
 * Dưới md: danh sách thẻ. Từ md: <table>. Việc ẩn/hiện cột priority 3 do
 * CSS làm nên đổi bề rộng không remount hàng nào.
 *
 * @param {Array<object>} rows
 * @param {Array<{id,header,cell,priority?,align?,cellClassName?,headerClassName?,cardHidden?}>} columns
 * @param {(row:object, index:number)=>string} getRowKey
 * @param {(row:object)=>void} [onRowClick]
 * @param {(row:object)=>string} [rowClassName]
 * @param {React.ReactNode} [empty] Hiển thị khi không có dòng nào
 * @param {string} [caption] Mô tả cho screen reader
 */
export default function DataTable({
    rows = [],
    columns = [],
    getRowKey,
    onRowClick,
    rowClassName,
    empty = null,
    caption,
    className,
    sort,
    onSort,
    tableMinWidth,
}) {
    const alignClass = (align) =>
        align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';

    const sortableColumns = onSort ? columns.filter((c) => c.sortable) : [];

    const sortIcon = (id) => {
        if (!sort || sort.key !== id) return <ArrowUpDown size={14} className="opacity-30" />;
        return sort.direction === 'asc'
            ? <ArrowUp size={14} className="text-blue-600" />
            : <ArrowDown size={14} className="text-blue-600" />;
    };

    const justifyClass = (align) =>
        align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start';

    // Cột priority 3 chỉ xuất hiện trong bảng từ lg trở lên
    const colVisibility = (priority) => (priority === 3 ? 'hidden lg:table-cell' : '');

    const titleColumn = columns.find((c) => (c.priority ?? 1) === 1) || columns[0];
    const bodyColumns = columns.filter((c) => c !== titleColumn && !c.cardHidden);

    if (!rows.length) {
        return empty;
    }

    return (
        <div className={className}>
            {/* Dưới md — thanh sắp xếp, vì header bảng không hiển thị */}
            {sortableColumns.length > 0 && (
                <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/60 px-4 py-2 md:hidden">
                    <label htmlFor="datatable-sort" className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Sắp xếp
                    </label>
                    <select
                        id="datatable-sort"
                        className="select min-w-0 flex-1 py-1.5"
                        value={sort?.key || ''}
                        onChange={(e) => onSort(e.target.value)}
                    >
                        <option value="">Mặc định</option>
                        {sortableColumns.map((col) => (
                            <option key={col.id} value={col.id}>{col.header}</option>
                        ))}
                    </select>
                    <button
                        type="button"
                        className="icon-btn shrink-0"
                        onClick={() => sort?.key && onSort(sort.key)}
                        disabled={!sort?.key}
                        aria-label={sort?.direction === 'asc' ? 'Đổi sang giảm dần' : 'Đổi sang tăng dần'}
                    >
                        {sort?.direction === 'desc' ? <ArrowDown size={16} /> : <ArrowUp size={16} />}
                    </button>
                </div>
            )}

            {/* Dưới md — thẻ */}
            <ul className="divide-y divide-slate-100 md:hidden">
                {rows.map((row, index) => {
                    const key = getRowKey ? getRowKey(row, index) : index;
                    const interactive = Boolean(onRowClick);
                    return (
                        <li key={key} className={clsx('bg-white', rowClassName?.(row))}>
                            <div
                                className={clsx(
                                    'flex flex-col gap-2 px-4 py-3.5',
                                    interactive && 'cursor-pointer active:bg-slate-50'
                                )}
                                role={interactive ? 'button' : undefined}
                                tabIndex={interactive ? 0 : undefined}
                                onClick={interactive ? () => onRowClick(row) : undefined}
                                onKeyDown={
                                    interactive
                                        ? (e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                onRowClick(row);
                                            }
                                        }
                                        : undefined
                                }
                            >
                                {titleColumn && (
                                    <div className="text-[15px] font-semibold leading-snug text-slate-900">
                                        {titleColumn.cell(row)}
                                    </div>
                                )}

                                <dl className="grid grid-cols-[minmax(0,auto)_minmax(0,1fr)] gap-x-3 gap-y-1.5">
                                    {bodyColumns.map((col) => (
                                        <React.Fragment key={col.id}>
                                            <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 self-center">
                                                {col.header}
                                            </dt>
                                            <dd className="min-w-0 text-right text-sm text-slate-700">
                                                {col.cell(row)}
                                            </dd>
                                        </React.Fragment>
                                    ))}
                                </dl>
                            </div>
                        </li>
                    );
                })}
            </ul>

            {/* Từ md — bảng */}
            <div className="hidden overflow-x-auto md:block">
                <table className={clsx('table w-full', tableMinWidth)}>
                    {caption && <caption className="sr-only">{caption}</caption>}
                    <thead className="table-head">
                        <tr>
                            {columns.map((col) => {
                                const isSortable = Boolean(onSort && col.sortable);
                                return (
                                    <th
                                        key={col.id}
                                        scope="col"
                                        className={clsx(
                                            'table-th',
                                            alignClass(col.align),
                                            colVisibility(col.priority ?? 1),
                                            isSortable && 'table-th-sortable',
                                            col.headerClassName
                                        )}
                                        onClick={isSortable ? () => onSort(col.id) : undefined}
                                        aria-sort={
                                            sort?.key === col.id
                                                ? (sort.direction === 'asc' ? 'ascending' : 'descending')
                                                : (isSortable ? 'none' : undefined)
                                        }
                                    >
                                        {isSortable ? (
                                            <span className={clsx('flex items-center gap-2', justifyClass(col.align))}>
                                                {col.header}
                                                {sortIcon(col.id)}
                                            </span>
                                        ) : col.header}
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, index) => (
                            <tr
                                key={getRowKey ? getRowKey(row, index) : index}
                                className={clsx(
                                    'table-row',
                                    onRowClick && 'table-row-clickable',
                                    rowClassName?.(row)
                                )}
                                onClick={onRowClick ? () => onRowClick(row) : undefined}
                            >
                                {columns.map((col) => (
                                    <td
                                        key={col.id}
                                        className={clsx(
                                            'table-td',
                                            alignClass(col.align),
                                            colVisibility(col.priority ?? 1),
                                            col.cellClassName
                                        )}
                                    >
                                        {col.cell(row)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
