import { clsx } from 'clsx';

export default function TxStatusBadge({ paid, className }) {
    return (
        <span
            className={clsx(
                'inline-flex shrink-0 rounded-md px-2 py-1 text-[13px] font-semibold',
                paid ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-100 text-amber-700',
                className
            )}
        >
            {paid ? 'Đã trả' : 'Chưa trả'}
        </span>
    );
}
