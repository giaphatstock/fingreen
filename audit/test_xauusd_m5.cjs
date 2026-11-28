const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const TARGET_URL = 'http://localhost:4173/greensmartone';
const SCREENSHOT_DIR = path.resolve(__dirname, 'screenshots/greensmartone');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function run() {
  console.log('Launching Chrome to test XAUUSD M5 vs TradingView...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  page.on('response', resp => {
    if (resp.status() >= 400 && !resp.url().includes('favicon')) {
      console.log(`HTTP ${resp.status()}: ${resp.url()}`);
    }
  });

  await page.goto(TARGET_URL, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  // Dismiss disclaimer
  try {
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b =>
        b.textContent.includes('Tôi Đã Hiểu & Đồng Ý') || b.textContent.includes('Đồng ý')
      );
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 1000));
  } catch (_) {}

  // Click "Tài sản số / Vàng"
  console.log('Clicking "Tài sản số / Vàng"...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b =>
      b.textContent.includes('Tài sản số')
    );
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 2000));

  // Click XAUUSD
  console.log('Clicking XAUUSD tile...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b =>
      b.textContent.includes('XAUUSD')
    );
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // Click M5 timeframe
  console.log('Clicking M5 timeframe...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button')).filter(b => b.textContent.trim() === 'M5');
    if (btns.length > 0) btns[btns.length - 1].click();
  });
  await new Promise(r => setTimeout(r, 4000));

  // Extract displayed price and candle info
  const chartInfo = await page.evaluate(() => {
    const el = document.querySelector('.font-mono strong, .font-mono span');
    return {
      bodyText: document.body.innerText.slice(0, 1000),
    };
  });

  console.log('Sample text on page includes 3652:', chartInfo.bodyText.includes('3652') || chartInfo.bodyText.includes('3,652'));
  
  // Capture high-res screenshot
  const shotPath = path.join(SCREENSHOT_DIR, '05_verified_XAUUSD_M5.png');
  await page.screenshot({ path: shotPath });
  console.log('Captured screenshot at:', shotPath);

  await browser.close();
  console.log('=== XAUUSD M5 TEST COMPLETE ===');
}

run().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
