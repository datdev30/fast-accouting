import { calculateInterestAmount } from './interest.js';

const VN_OFFSET_MS = 7 * 60 * 60 * 1000;
const round2 = (n) => Math.round(n * 100) / 100;

/** Đầu tháng hiện tại theo giờ Việt Nam (server Vercel chạy UTC). */
function startOfVnMonth(now) {
    const vn = new Date(now.getTime() + VN_OFFSET_MS);
    return new Date(Date.UTC(vn.getUTCFullYear(), vn.getUTCMonth(), 1) - VN_OFFSET_MS);
}

/**
 * Số liệu cho màn Tổng quan.
 * @param {object[]} customers  bản ghi customer (lean)
 * @param {object[]} transactions  giao dịch của năm làm việc (lean)
 */
export function buildSummary(customers, transactions, now = new Date()) {
    const nameByKey = {};
    for (const c of customers) {
        const name = c.name;
        if (c.id) nameByKey[String(c.id).trim()] = name;
        if (c._id) nameByKey[String(c._id).trim()] = name;
    }

    const monthStart = startOfVnMonth(now);
    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    let openPrincipal = 0;
    let openInterest = 0;
    let collected = 0;
    let openCount = 0;
    let openOver6Months = 0;

    for (const tx of transactions) {
        const principal = Number(tx.amount || 0);
        if (tx.status === 'OPEN') {
            openCount += 1;
            openPrincipal += principal;
            openInterest += Number(calculateInterestAmount(principal, tx.interest_rate_snapshot, tx.transaction_date, now).rounded_interest || 0);
            if (new Date(tx.transaction_date) < sixMonthsAgo) openOver6Months += 1;
        } else if (tx.status === 'PAID') {
            collected += Number(tx.final_total ?? principal + Number(tx.final_interest || 0));
        }
    }

    const recent = [...transactions]
        .sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date))
        .slice(0, 5)
        .map((tx) => {
            const customerId = String(tx.customer_id ?? '').trim();
            return {
                _id: tx.id ?? tx._id,
                customer_id: customerId,
                customer_name: nameByKey[customerId] ?? 'Unknown',
                transaction_date: tx.transaction_date,
                type: tx.type,
                amount: Number(tx.amount || 0),
                status: tx.status,
            };
        });

    return {
        total_debt: round2(openPrincipal + openInterest),
        open_principal: round2(openPrincipal),
        open_interest: round2(openInterest),
        total_collected: round2(collected),
        customer_count: customers.length,
        new_customers_this_month: customers.filter((c) => c.created_at && new Date(c.created_at) >= monthStart).length,
        transaction_count: transactions.length,
        open_count: openCount,
        paid_count: transactions.filter((tx) => tx.status === 'PAID').length,
        open_over_6_months: openOver6Months,
        recent,
    };
}
