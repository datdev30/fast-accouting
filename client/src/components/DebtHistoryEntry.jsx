import { clsx } from 'clsx';
import { Paperclip } from 'lucide-react';
import TxStatusBadge from './TxStatusBadge';
import { formatDate } from '../utils/dateUtils';

const money = (n) => n.toLocaleString('vi-VN');

export default function DebtHistoryEntry({ transaction: tx, typeName }) {
    const paid = tx.status === 'PAID';
    const principal = tx.amount || 0;
    const interest = tx.interest_calculation?.rounded_interest || 0;
    const months = (tx.interest_calculation?.months || 0).toLocaleString('vi-VN', { maximumFractionDigits: 1 });
    const date = new Date(tx.transaction_date);

    return (
        <li className="flex gap-3 py-3">
            <div
                className={clsx(
                    'flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl',
                    paid ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'
                )}
                aria-hidden
            >
                <span className="font-heading text-lg font-bold leading-none">{String(date.getDate()).padStart(2, '0')}</span>
                <span className="mt-0.5 text-[11px] font-medium leading-none">Th{date.getMonth() + 1}</span>
            </div>

            <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                    <p className="min-w-0 font-semibold text-slate-900">
                        {typeName}
                        <span className="font-normal text-slate-500"> · {tx.interest_rate_snapshot}% · {months} tháng</span>
                    </p>
                    <p className={clsx('shrink-0 font-mono font-bold tabular-nums', paid ? 'text-slate-500' : 'text-blue-700')}>
                        {money(principal + interest)}
                    </p>
                </div>
                <div className="mt-1 flex items-center justify-between gap-3">
                    <p className="min-w-0 font-mono text-[13px] tabular-nums text-slate-500">
                        Gốc {money(principal)} · Lãi {money(interest)}
                    </p>
                    <TxStatusBadge paid={paid} className="px-1.5 py-0.5 text-xs" />
                </div>

                {(tx.content || tx.image_drive_file_id || (paid && tx.closed_at)) && (
                    <div className="mt-1.5 space-y-1 text-[13px]">
                        {paid && tx.closed_at && <p className="text-emerald-700">Thanh toán ngày {formatDate(tx.closed_at)}</p>}
                        {tx.content && <p className="line-clamp-2 whitespace-pre-wrap break-words text-slate-700">{tx.content}</p>}
                        {tx.image_drive_file_id && (
                            <p className="inline-flex items-center gap-1 text-slate-500"><Paperclip size={12} /> Có chứng từ</p>
                        )}
                    </div>
                )}
            </div>
        </li>
    );
}
