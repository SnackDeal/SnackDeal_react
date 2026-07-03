// SnackDeal Vite dev 서버를 Playwright로 조작하며 각 단계마다
// shots/에 스크린샷 + 본문 텍스트 스니펫을 남긴다.
//
// 사용법:
//   node .claude/skills/run-snackdeal-frontend/driver.mjs [baseURL] [shotsDir]
//
// 아래 STEPS 배열을 수정해서 방문/클릭할 대상을 바꾼다.
// 각 단계는 이동(또는 클릭) → network idle 대기 → 스크린샷 →
// 본문 텍스트 스니펫 + 콘솔 에러 로깅 순서로 동작한다.

import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';

const baseURL = process.argv[2] || 'http://localhost:5173';
const shotsDir = process.argv[3] || 'shots';

fs.mkdirSync(shotsDir, { recursive: true });

const STEPS = [
  { name: '01-home', goto: '/' },
  { name: '02-products', goto: '/products' },
  { name: '03-product-detail', click: 'text=아몬드 초콜릿' },
  { name: '04-cart', goto: '/cart' },
  { name: '05-admin-products', goto: '/admin/products' },
  { name: '06-admin-orders', goto: '/admin/orders' },
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

const consoleErrors = [];
page.on('console', (msg) => {
  if (msg.type() === 'error') consoleErrors.push(msg.text());
});
page.on('pageerror', (err) => consoleErrors.push(`pageerror: ${err.message}`));

for (const step of STEPS) {
  consoleErrors.length = 0;
  if (step.goto) {
    await page.goto(new URL(step.goto, baseURL).toString());
  } else if (step.click) {
    await page.click(step.click);
  }
  await page.waitForLoadState('networkidle');

  const shotPath = path.join(shotsDir, `${step.name}.png`);
  await page.screenshot({ path: shotPath, fullPage: true });

  const text = (await page.locator('body').innerText()).replace(/\n+/g, ' ').slice(0, 200);
  console.log(`[${step.name}] url=${page.url()}`);
  console.log(`[${step.name}] text: ${text}`);
  if (consoleErrors.length) {
    console.log(`[${step.name}] console errors:`);
    for (const e of consoleErrors) console.log(`  - ${e}`);
  }
  console.log(`[${step.name}] screenshot: ${shotPath}`);
  console.log('');
}

await browser.close();
