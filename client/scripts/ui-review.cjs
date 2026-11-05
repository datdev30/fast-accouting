/* Run against a local Vite server. All API traffic uses synthetic fixtures. */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.UI_BASE_URL || 'http://127.0.0.1:5173';
const output = process.env.UI_OUTPUT || path.join(require('node:os').tmpdir(), 'fastaccounting-ui');
const customer = { id: 'demo', _id: 'demo', name: 'Nguyễn Thị Ánh Tuyết', contact_info: '0901 234 567 · Đại lý vật tư nông nghiệp', total_debt: 125450000, total_principal: 120000000, total_interest: 5450000 };
const transactions = [
  { _id: 'open', customer_id: 'demo', type: 'LOAN', amount: 120000000, status: 'OPEN', transaction_date: '2026-10-02', content: 'Tiền hàng phân bón vụ Đông Xuân — đối chiếu đầy đủ gốc và lãi.', interest_rate_snapshot: 1.5, interest_calculation: { rounded_interest: 5450000, months: 1 } },
  { _id: 'paid', customer_id: 'demo', type: 'LOAN', amount: 23450000, status: 'PAID', transaction_date: '2026-09-01', closed_at: '2026-10-01', content: 'Đã thanh toán qua ngân hàng.', interest_rate_snapshot: 0, interest_calculation: { rounded_interest: 0, months: 1 } },
];
async function main() {
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ locale: 'vi-VN' });
    const intercept = async route => {
      const url = new URL(route.request().url());
      if (url.origin !== base) return route.abort();
      if (!url.pathname.startsWith('/api/')) return route.continue();
      const endpoint = url.pathname.slice(4);
      let data = {};
      if (endpoint === '/auth/login') data = { token: 'synthetic-ui-test', username: 'demo', display_name: 'Công Phú', role: 'ADMIN' };
      else if (endpoint === '/auth/me') data = { username: 'demo', display_name: 'Công Phú', role: 'ADMIN' };
      else if (endpoint === '/working-year') data = { current_working_year: 2026, available_years: [2026] };
      else if (endpoint === '/customers') data = [customer];
      else if (endpoint === '/customers/demo') data = customer;
      else if (endpoint === '/interest-configs') data = [{ _id: 'loan', code: 'LOAN', name: 'Nợ tiền hàng', rate: 1.5, interest_rate: 1.5 }];
      else if (endpoint === '/transactions') data = transactions;
      else if (endpoint === '/transactions/reports/summary') data = { total_debt: 125450000, open_principal: 120000000, open_interest: 5450000, total_collected: 23450000, customer_count: 1, open_count: 1, recent: transactions.map(t => ({ ...t, id: t._id, customer_name: customer.name })) };
      else if (endpoint.includes('report')) data = [{ ...customer, customer_id: 'demo', customer_name: customer.name, transaction_count: 2 }];
      await route.fulfill({ json: data });
    };
    await context.route('**/*', intercept);
    context.setDefaultTimeout(15000);
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(`${base}/login`);
    await page.locator('#username').fill('demo');
    await page.locator('#password').fill('synthetic-password');
    await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
    await page.waitForURL('**/overview');
    for (const width of [320, 375, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 960 });
      for (const route of ['/overview', '/customers', '/transactions', '/customers/demo/debt']) {
        await page.goto(base + route);
        await page.getByRole('main').waitFor();
        await page.waitForTimeout(400);
        await page.evaluate(() => document.fonts.ready);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
        assert.ok(overflow <= 1, `${route} overflows at ${width}: ${overflow}`);
        const clippedMoney = await page.locator('.ledger-total, .ledger-breakdown dd, .transaction-amounts p').evaluateAll(nodes =>
          nodes.filter(n => n.getClientRects().length && n.scrollWidth > n.clientWidth + 1).map(n => n.textContent));
        assert.deepEqual(clippedMoney, [], `Money must remain readable: ${route} at ${width}`);
        if (route.endsWith('/debt')) {
          const paid = page.locator('li').filter({ hasText: 'Đã thanh toán qua ngân hàng.' });
          assert.match(await paid.innerText(), /23\.450\.000/, 'Paid entry must retain its amount');
          assert.match(await paid.innerText(), /Tổng cộng/, 'Paid entry must label its total');
        }
        if (width === 375 || width === 1440) await page.screenshot({ path: path.join(output, `${route.replaceAll('/', '-')}-${width}.png`) });
      }
    }
    await page.setViewportSize({ width: 1024, height: 960 });
    await page.goto(base + '/transactions');
    await page.getByRole('table').waitFor();
    assert.equal(await page.getByRole('dialog', { name: 'Chi tiết giao dịch' }).count(), 0);
    await page.getByRole('button', { name: `Xem giao dịch của ${customer.name}` }).first().click();
    await page.getByRole('dialog', { name: 'Chi tiết giao dịch' }).waitFor();
    await page.getByRole('dialog', { name: 'Chi tiết giao dịch' }).getByRole('button', { name: 'Đóng', exact: true }).click();
    assert.equal(await page.getByRole('dialog', { name: 'Chi tiết giao dịch' }).count(), 0);
    const touch = await browser.newContext({ locale: 'vi-VN', viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true, storageState: await context.storageState() });
    await touch.route('**/*', intercept);
    touch.setDefaultTimeout(15000);
    const phone = await touch.newPage();
    phone.on('pageerror', e => errors.push(e.message));
    const measurements = [];
    for (const width of [320, 375, 768, 1024, 1194]) {
      await phone.setViewportSize({ width, height: 900 });
      await phone.goto(base + '/login');
      await phone.locator('#username').fill('demo');
      await phone.locator('#password').fill('synthetic-password');
      assert.ok(await phone.locator('#password').evaluate(n => parseFloat(getComputedStyle(n).fontSize) >= 16));
      await phone.getByRole('button', {name:'Đăng nhập',exact:true}).click();
      await phone.waitForURL('**/overview');
      await phone.getByRole('navigation', {name:'Điều hướng nhanh'}).getByRole('link', {name:'Khách hàng',exact:true}).click();
      await phone.getByRole('link', {name:`Xem công nợ của ${customer.name}`}).click();
      await phone.waitForURL('**/customers/demo/debt');
      await phone.locator('.ledger-total').waitFor();
      assert.ok(await phone.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      for (const name of ['Khách hàng', 'Công nợ còn lại']) {
        const bounds = await phone.getByRole('region', {name, exact:true}).boundingBox();
        assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= width + 1, `${name} clipped at ${width}`);
      }
      measurements.push({width, ...(await phone.evaluate(() => ({tap:getComputedStyle(document.documentElement).getPropertyValue('--tap-min').trim(), total: getComputedStyle(document.querySelector('.ledger-total')).fontSize})))});
      await phone.screenshot({path:path.join(output, `flow-touch-${width}.png`)});
    }
    console.log('Touch flow measurements:', measurements);
    await phone.setViewportSize({width:375,height:812});
    await phone.goto(base + '/transactions');
    await phone.getByRole('button', { name: 'Tạo giao dịch', exact: true }).click();
    const amount = phone.locator('#tx-amount');
    await amount.fill('123456789012');
    assert.ok(await amount.evaluate(n => parseFloat(getComputedStyle(n).fontSize) >= 16));
    assert.ok(await phone.getByRole('button', { name: 'Nhân 1000', exact: true }).evaluate(n => n.getBoundingClientRect().height >= 48));
    assert.equal(await phone.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--tap-min').trim()), '48px');
    await phone.screenshot({ path: path.join(output, 'transaction-form-touch.png') });
    await phone.goto(base + '/customers/demo/debt');
    await phone.getByRole('button', { name: 'Phiếu nợ', exact: true }).click();
    const preview = phone.locator('.print-preview-frame__scale');
    await preview.waitFor();
    assert.ok(await preview.evaluate(n => Math.abs(n.offsetWidth - 794) <= 1), 'Print preview keeps its A4 width');
    await phone.route('**/api/transactions/reports/summary', route => route.fulfill({ status: 500, json: { message: 'Synthetic failure' } }));
    await phone.goto(base + '/overview');
    await phone.getByRole('button', { name: 'Thử lại', exact: true }).waitFor({ timeout: 15000 });
    assert.match(await phone.locator('.ledger-total').innerText(), /—/, 'Unavailable totals must not become zero');
    assert.deepEqual(errors, [], 'No uncaught browser errors');
    console.log(`PASS: 20 responsive checks, paid totals, detail open/close, touch form, A4 preview and summary failure. Screenshots: ${output}`);
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
