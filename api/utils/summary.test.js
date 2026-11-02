import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSummary } from './summary.js';

test('buildSummary: đếm trạng thái, khách mới theo giờ VN, khoản mở quá 6 tháng, gần đây', () => {
    // 01/11/2026 00:30 giờ VN = 31/10/2026 17:30 UTC
    const now = new Date('2026-10-31T17:30:00Z');
    const customers = [
        { id: 'KH001', name: 'An', created_at: new Date('2026-10-31T17:10:00Z') }, // 01/11 giờ VN → tháng này
        { _id: 'KH002', name: 'Bình', created_at: new Date('2026-10-31T16:50:00Z') }, // 31/10 giờ VN → tháng trước
    ];
    const transactions = [
        { id: 'GD1', customer_id: 'KH001', amount: 1000, status: 'OPEN', interest_rate_snapshot: 0, transaction_date: new Date('2026-10-20') },
        { id: 'GD2', customer_id: 'KH002', amount: 500, status: 'OPEN', interest_rate_snapshot: 0, transaction_date: new Date('2026-01-10') },
        { id: 'GD3', customer_id: 'KH002', amount: 300, status: 'PAID', final_total: 320, transaction_date: new Date('2026-09-01') },
    ];

    const s = buildSummary(customers, transactions, now);

    assert.equal(s.open_principal, 1500);
    assert.equal(s.total_debt, 1500);
    assert.equal(s.total_collected, 320);
    assert.equal(s.customer_count, 2);
    assert.equal(s.new_customers_this_month, 1);
    assert.deepEqual([s.transaction_count, s.open_count, s.paid_count, s.open_over_6_months], [3, 2, 1, 1]);
    assert.deepEqual(s.recent.map((r) => [r._id, r.customer_name]), [['GD1', 'An'], ['GD3', 'Bình'], ['GD2', 'Bình']]);
});
