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
  console.log('Testing GreenSmartOne: XAUUSD (OANDA) & Cryptos (BITSTAMP)...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

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

  // 1. Click "Tài sản số / Vàng"
  console.log('1. Switching to "Tài sản số / Vàng"...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b =>
      b.textContent.includes('Tài sản số')
    );
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 2000));

  // Check badges for OANDA & BITSTAMP
  const badges = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()).filter(t =>
      t.includes('OANDA') || t.includes('BITSTAMP')
    );
  });
  console.log('Exchange badges found:', badges);

  // 2. Test XAUUSD (OANDA) Canvas
  console.log('2. Testing XAUUSD (OANDA) Canvas...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_xauusd_oanda_canvas.png') });
  console.log('Captured 06_xauusd_oanda_canvas.png');

  // 3. Switch to TradingView Mode for XAUUSD (OANDA)
  console.log('3. Switching to TradingView Mode...');
  const clickedTV = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b =>
      b.textContent.includes('TradingView')
    );
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });
  console.log('Clicked TradingView button:', clickedTV);
  await new Promise(r => setTimeout(r, 4500));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_xauusd_oanda_tradingview.png') });
  console.log('Captured 07_xauusd_oanda_tradingview.png');

  // 4. Click BTCUSD (BITSTAMP) in TradingView Mode
  console.log('4. Testing BTCUSD (BITSTAMP) TradingView...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b =>
      b.textContent.includes('BTCUSD')
    );
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 4500));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_btcusd_bitstamp_tradingview.png') });
  console.log('Captured 08_btcusd_bitstamp_tradingview.png');

  // 5. Switch back to Canvas Mode for BTCUSD (BITSTAMP)
  console.log('5. Testing BTCUSD (BITSTAMP) Canvas...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b =>
      b.textContent.includes('GreenSmartOne')
    );
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 3000));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09_btcusd_bitstamp_canvas.png') });
  console.log('Captured 09_btcusd_bitstamp_canvas.png');

  await browser.close();
  console.log('=== VERIFY COMPLETED SUCCESSFULLY ===');
}

run().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
