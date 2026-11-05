/* Non-zero system-bar insets, synthetic API data only. */
const assert = require('node:assert/strict');
const path = require('node:path');
module.exports = async function reviewSafeAreas({ browser, context, intercept, base, output }) {
  const routes = ['/overview', '/transactions', '/customers', '/reports', '/settings',
    '/customers/demo/debt', '/interest-configs', '/users', '/backup-data',
    '/bank-account-config', '/system-notification-config', '/info', '/guide'];
  const errors = [];
  const touch = await browser.newContext({ hasTouch: true, isMobile: true, locale: 'vi-VN', storageState: await context.storageState() });
  touch.setDefaultTimeout(15000);
  await touch.route('**/*', intercept);
  const page = await touch.newPage();
  page.on('pageerror', e => errors.push(e.message));
  for (const [width, height, top] of (process.env.UI_OVERLAYS_ONLY ? [] : [[320, 812, 32], [412, 915, 36], [915, 412, 24], [1194, 834, 32]])) {
    await page.setViewportSize({ width, height });
    for (const route of ['/login', ...routes]) {
      await page.goto(base + route);
      await page.addStyleTag({ content: `:root { --safe-t: ${top}px !important; --safe-b: 24px !important; }` });
      const title = page.locator(route === '/login' ? 'h1' : '#main-content h1:visible, #main-content h2:visible').first();
      await title.waitFor();
      const box = await title.boundingBox();
      assert.ok(box.y >= top, `${route} title overlaps system bar: y=${box.y}, inset=${top}, width=${width}`);
      if (route !== '/login') {
        const scroller = page.locator('#app-scroll');
        assert.ok((await scroller.boundingBox()).y >= top, `${route} scroll surface must stay below system bar`);
        await scroller.evaluate(n => { n.scrollTop = n.scrollHeight; });
        assert.ok((await scroller.boundingBox()).y >= top, `${route} safe area disappears on scroll`);
        await scroller.evaluate(n => { n.scrollTop = 0; });
      }
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${route}: horizontal overflow`);
      if (['/transactions', '/customers', '/reports', '/settings', '/overview'].includes(route) && width === 412)
        await page.screenshot({path:path.join(output, `safe-${route.slice(1)}.png`)});
    }
    console.log(`PASS: 14 screens at ${width}x${height}, top inset ${top}px`);
  }
  // A short viewport simulates the space left when the keyboard is open.
  await page.setViewportSize({width:412, height:360});
  await page.goto(base + '/transactions');
  await page.addStyleTag({content: ':root { --safe-t: 36px !important; --safe-b: 24px !important; }'});
  await page.getByRole('button', {name:'Tạo giao dịch', exact:true}).click();
  const form = page.getByRole('dialog', {name:'Giao dịch mới', exact:true});
  assert.ok((await form.boundingBox()).y >= 36, 'Short-screen form overlaps system bar');
  await form.locator('input[type=file]').last().setInputFiles({name:'test.png', mimeType:'image/png', buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64')});
  const viewer = page.getByRole('dialog', {name:'Chi tiết ảnh', exact:true});
  await viewer.waitFor();
  for (const button of await viewer.getByRole('button').all()) {
    const box = await button.boundingBox();
    assert.ok(box.y >= 36 && box.x >= 0 && box.x + box.width <= 413, 'Image toolbar control is covered or clipped');
  }
  await page.screenshot({path:path.join(output, 'safe-image-viewer.png')});
  await viewer.getByRole('button', {name:'Đóng',exact:true}).click();
  await form.getByRole('button', {name:'Đóng',exact:true}).click();
  console.log('PASS: short-screen form and image toolbar stay below system bar');
  assert.deepEqual(errors, [], 'No uncaught errors on any screen');
  await touch.close();
};

