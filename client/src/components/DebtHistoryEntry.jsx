import TxStatusBadge from './TxStatusBadge';
import { formatDate } from '../utils/dateUtils';

export default function DebtHistoryEntry({ transaction: tx, typeName }) {
    const paid = tx.status === 'PAID';
    const principal = tx.amount || 0;
    const interest = tx.interest_calculation?.rounded_interest || 0;
    return (
        <li className="ledger-entry">
            <div className="ledger-entry-header">
                <div className="ledger-entry-title">
                    <p className="font-semibold text-slate-900">{typeName}</p>
                    <p className="mt-1 text-[13px] text-slate-600">
                        {formatDate(tx.transaction_date)}
                        {paid && tx.closed_at && ` · Thanh toán ${formatDate(tx.closed_at)}`}
                    </p>
                </div>
                <TxStatusBadge paid={paid} />
            </div>
            <dl className="ledger-breakdown">
                <div><dt>Nợ gốc</dt><dd>{principal.toLocaleString('vi-VN')} ₫</dd></div>
                <div><dt>Tiền lãi</dt><dd>{interest.toLocaleString('vi-VN')} ₫</dd></div>
                <div><dt>Tổng cộng</dt><dd className="text-blue-700">{(principal + interest).toLocaleString('vi-VN')} ₫</dd></div>
            </dl>
            <p className="mt-3 text-[13px] text-slate-600">
                Lãi suất {tx.interest_rate_snapshot}% · {(tx.interest_calculation?.months || 0).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} tháng
                {tx.image_drive_file_id && ' · Có chứng từ'}
            </p>
            {tx.content && <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700">{tx.content}</p>}
        </li>
    );
}
