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
 * Muốn xếp lại bố cục thẻ mà không đụng tới thứ tự cột của bảng, dùng các cờ
 * cardTitle / cardAside / cardFullWidth / cardEmphasis; cardHidden và
 * tableHidden để một cột chỉ xuất hiện ở một trong hai hình thái.
 *
 * Dưới md: danh sách thẻ. Từ md: <table>. Việc ẩn/hiện cột priority 3 do
 * CSS làm nên đổi bề rộng không remount hàng nào.
 *
 * @param {Array<object>} rows
 * @param {Array<{id,header,cell,priority?,align?,cellClassName?,headerClassName?,cardHidden?,tableHidden?,cardTitle?,cardAside?,cardFullWidth?,cardEmphasis?}>} columns
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

    /* Bố cục thẻ (dưới md), theo thứ tự từ trên xuống:
         cardTitle  → dòng đầu, bên trái   (mặc định: cột priority 1 đầu tiên)
         cardAside  → dòng đầu, bên phải   (badge trạng thái)
         cardFullWidth → khối chạy hết bề ngang (nội dung dài)
         còn lại    → cặp nhãn–giá trị; cardEmphasis là dòng tổng, in đậm */
    const tableColumns = columns.filter((c) => !c.tableHidden);
    const cardColumns = columns.filter((c) => !c.cardHidden);
    const titleColumn =
        cardColumns.find((c) => c.cardTitle) ||
        cardColumns.find((c) => (c.priority ?? 1) === 1) ||
        cardColumns[0];
    const asideColumn = cardColumns.find((c) => c.cardAside && c !== titleColumn);
    const fullWidthColumns = cardColumns.filter(
        (c) => c.cardFullWidth && c !== titleColumn && c !== asideColumn
    );
    const pairColumns = cardColumns.filter(
        (c) => c !== titleColumn && c !== asideColumn && !fullWidthColumns.includes(c)
    );

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
            <ul className="divide-y-2 divide-slate-200 bg-white md:hidden">
                {rows.map((row, index) => {
                    const key = getRowKey ? getRowKey(row, index) : index;
                    const interactive = Boolean(onRowClick);
                    return (
                        <li key={key} className={rowClassName?.(row)}>
                            <div
                                className={clsx(
                                    'flex flex-col gap-2 px-4 py-3.5',
                                    interactive && 'cursor-pointer active:bg-slate-900/5'
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
                                {(titleColumn || asideColumn) && (
                                    <div className="flex items-start justify-between gap-3">
                                        {titleColumn && (
                                            <div className="min-w-0 flex-1 text-[15px] font-semibold leading-snug text-slate-900">
                                                {titleColumn.cell(row)}
                                            </div>
                                        )}
                                        {asideColumn && (
                                            <div className="shrink-0">{asideColumn.cell(row)}</div>
                                        )}
                                    </div>
                                )}

                                {/* Cột cardFullWidth: nội dung dài, cho chạy hết bề ngang thay vì
                                    ép vào nửa phải của cặp nhãn–giá trị */}
                                {fullWidthColumns.map((col) => (
                                    <div key={col.id} className="text-sm leading-snug text-slate-700">
                                        {col.cell(row)}
                                    </div>
                                ))}

                                {pairColumns.length > 0 && (
                                    <dl className="grid grid-cols-[minmax(0,auto)_minmax(0,1fr)] gap-x-3 gap-y-1.5">
                                        {pairColumns.map((col) => (
                                            <React.Fragment key={col.id}>
                                                {/* Kẻ ngang riêng, chiếm cả hai cột — nếu đặt border-t lên
                                                    dt và dd thì gap-x sẽ cắt đường kẻ làm đôi */}
                                                {col.cardEmphasis && (
                                                    <span aria-hidden className="col-span-2 mt-1 border-t border-slate-200" />
                                                )}
                                                <dt className={clsx(
                                                    'self-center text-[11px] font-semibold uppercase tracking-wide',
                                                    col.cardEmphasis ? 'text-slate-600' : 'text-slate-400'
                                                )}>
                                                    {col.header}
                                                </dt>
                                                <dd className={clsx(
                                                    'min-w-0 text-right',
                                                    col.cardEmphasis
                                                        ? 'text-base font-bold text-slate-900'
                                                        : 'text-sm text-slate-700'
                                                )}>
                                                    {col.cell(row)}
                                                </dd>
                                            </React.Fragment>
                                        ))}
                                    </dl>
                                )}
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
                            {tableColumns.map((col) => {
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
                                {tableColumns.map((col) => (
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
