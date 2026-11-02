import { clsx } from 'clsx';
import { initialsOf } from '../utils/initials';

const TONES = [
    'bg-blue-100 text-blue-700',
    'bg-emerald-100 text-emerald-700',
    'bg-violet-100 text-violet-700',
    'bg-amber-100 text-amber-800',
    'bg-rose-100 text-rose-700',
    'bg-sky-100 text-sky-700',
];

/** Ô chữ cái đầu của tên, màu cố định theo tên. */
export default function Avatar({ name, className = 'h-10 w-10 rounded-full text-xs' }) {
    const hash = [...(name ?? '')].reduce((h, ch) => h + ch.charCodeAt(0), 0);
    return (
        <span
            className={clsx('flex shrink-0 items-center justify-center font-bold', TONES[hash % TONES.length], className)}
            aria-hidden
        >
            {initialsOf(name)}
        </span>
    );
}
