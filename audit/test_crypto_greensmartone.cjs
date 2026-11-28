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
  console.log('Launching Chrome to test GreenSmartOne with Crypto assets...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  page.on('response', resp => {
    if (resp.status() >= 400) {
      console.log(`Failed HTTP ${resp.status()}: ${resp.url()}`);
    }
  });

  console.log('1. Loading GreenSmartOne page...');
  await page.goto(TARGET_URL, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  // Dismiss disclaimer modal if open
  try {
    const accepted = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b =>
        b.textContent.includes('Tôi Đã Hiểu & Đồng Ý') || b.textContent.includes('Đồng ý')
      );
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    console.log('Dismissed disclaimer modal:', accepted);
    await new Promise(r => setTimeout(r, 1000));
  } catch (_) {}

  // Click on "Tài sản số / Vàng" mode
  console.log('2. Switching to "Tài sản số / Vàng" mode...');
  const clickedCryptoMode = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b =>
      b.textContent.includes('Tài sản số')
    );
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });
  console.log('Clicked "Tài sản số / Vàng":', clickedCryptoMode);
  await new Promise(r => setTimeout(r, 3500));

  // Check 5 assets
  const assetButtons = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim()).filter(t =>
      ['BTCUSD', 'ETHUSD', 'XRPUSD', 'XAUUSD', 'SOLUSD'].some(sym => t.includes(sym))
    );
  });
  console.log('Found crypto asset buttons:', assetButtons);

  // Check 6 timeframes
  const timeframes = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim()).filter(t =>
      ['M1', 'M5', 'M15', 'H1', 'H4', 'D1'].includes(t)
    );
  });
  console.log('Found timeframes:', timeframes);

  // Take screenshot of BTCUSD D1
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_crypto_BTCUSD_D1.png') });
  console.log('Captured 01_crypto_BTCUSD_D1.png');

  // Switch to M15 timeframe
  console.log('3. Testing M15 timeframe on BTCUSD...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'M15');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 3000));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_crypto_BTCUSD_M15.png') });
  console.log('Captured 02_crypto_BTCUSD_M15.png');

  // Switch to XAUUSD (Gold)
  console.log('4. Testing XAUUSD (Gold) H1...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('XAUUSD'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1500));
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'H1');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 3000));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_crypto_XAUUSD_H1.png') });
  console.log('Captured 03_crypto_XAUUSD_H1.png');

  // Switch to XRPUSD M5
  console.log('5. Testing XRPUSD M5...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('XRPUSD'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1500));
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'M5');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 3000));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_crypto_XRPUSD_M5.png') });
  console.log('Captured 04_crypto_XRPUSD_M5.png');

  // Check live header ticker and values
  const pageState = await page.evaluate(() => {
    return {
      text: document.body.innerText.slice(0, 800),
      hasBinanceLive: document.body.innerText.includes('BINANCE LIVE') || document.body.innerText.includes('LIVE'),
    };
  });
  console.log('Page has Binance Live indicator:', pageState.hasBinanceLive);
  console.log('Page errors captured:', errors);

  await browser.close();
  console.log('=== TEST COMPLETED SUCCESSFULLY ===');
}

run().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
