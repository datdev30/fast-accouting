import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Info, Siren, X } from 'lucide-react';
import { clsx } from 'clsx';
import { getActiveSystemNotifications } from '../services/api';

const HIDE_AFTER_MS = 30_000;
const EXIT_MS = 380;

const LEVEL_RANK = { critical: 3, warning: 2, info: 1 };

const LEVEL_META = {
    info: { label: 'Thông tin', Icon: Info },
    warning: { label: 'Cảnh báo', Icon: AlertTriangle },
    critical: { label: 'Khẩn', Icon: Siren },
};

function pickLevel(items) {
    return items.reduce((best, item) => {
        const level = item.level || 'info';
        return (LEVEL_RANK[level] || 0) > (LEVEL_RANK[best] || 0) ? level : best;
    }, 'info');
}

/**
 * Thẻ thông báo nổi trên cùng — load công khai khi mở trang (kể cả login).
 * Tự ẩn sau 30 giây; có thể đóng sớm nếu dismissible.
 */
export default function SystemNotificationBanner() {
    const [visible, setVisible] = useState(true);
    const [exiting, setExiting] = useState(false);
    const [index, setIndex] = useState(0);

    const { data: items = [] } = useQuery({
        queryKey: ['system-notifications-active'],
        queryFn: getActiveSystemNotifications,
        staleTime: 60_000,
        refetchOnWindowFocus: true,
        retry: 1,
    });

    const activeItems = useMemo(
        () => (Array.isArray(items) ? items.filter((n) => n?.title || n?.message) : []),
        [items]
    );

    const current = activeItems[Math.min(index, Math.max(activeItems.length - 1, 0))];
    const level = current?.level && LEVEL_RANK[current.level] ? current.level : pickLevel(activeItems);
    const meta = LEVEL_META[level] || LEVEL_META.info;
    const Icon = meta.Icon;
    const canDismiss = !current || current.dismissible !== false;

    useEffect(() => {
        setIndex(0);
    }, [activeItems.length]);

    useEffect(() => {
        if (!visible || activeItems.length < 2) return undefined;
        const rotate = setInterval(() => {
            setIndex((i) => (i + 1) % activeItems.length);
        }, 8_000);
        return () => clearInterval(rotate);
    }, [visible, activeItems.length]);

    useEffect(() => {
        if (!activeItems.length || !visible) return undefined;
        const hideTimer = setTimeout(() => setExiting(true), HIDE_AFTER_MS);
        return () => clearTimeout(hideTimer);
    }, [activeItems.length, visible]);

    useEffect(() => {
        if (!exiting) return undefined;
        const done = setTimeout(() => setVisible(false), EXIT_MS);
        return () => clearTimeout(done);
    }, [exiting]);

    useEffect(() => {
        document.documentElement.style.removeProperty('--sys-banner-h');
    }, []);

    if (!visible || !activeItems.length || !current) return null;

    const title = (current.title || '').trim() || 'Thông báo hệ thống';
    const message = (current.message || '').trim();

    return (
        <div className="sys-notice" aria-live="polite">
            <div
                className={clsx(
                    'sys-notice__card',
                    `sys-notice__card--${level}`,
                    exiting && 'sys-notice__card--exit'
                )}
                role="status"
            >
                <div className="sys-notice__leading">
                    <div className={clsx('sys-notice__icon', `sys-notice__icon--${level}`)}>
                        <Icon size={26} strokeWidth={2.25} />
                    </div>
                </div>

                <div className="sys-notice__body">
                    <div className="sys-notice__meta">
                        <span className={clsx('sys-notice__badge', `sys-notice__badge--${level}`)}>
                            {meta.label}
                        </span>
                        {activeItems.length > 1 && (
                            <span className="sys-notice__count">
                                {index + 1}/{activeItems.length}
                            </span>
                        )}
                    </div>
                    <p className="sys-notice__title">{title}</p>
                    {message && (
                        <p className="sys-notice__message">{message}</p>
                    )}
                </div>

                {canDismiss && (
                    <button
                        type="button"
                        className="sys-notice__close"
                        onClick={() => setExiting(true)}
                        aria-label="Đóng thông báo"
                    >
                        <X size={20} strokeWidth={2.5} />
                    </button>
                )}

                <div className="sys-notice__progress" aria-hidden>
                    <span className="sys-notice__progress-bar" />
                </div>
            </div>
        </div>
    );
}
