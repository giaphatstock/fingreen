const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const TARGET_URL = 'https://fingreenvn.vercel.app/stock-panel/#/';
const SCREENSHOT_DIR = path.resolve(__dirname, 'screenshots/production');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function run() {
  console.log('Launching Chrome to verify PRODUCTION deployment at:', TARGET_URL);
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

  console.log('1. Loading Stock Panel on production...');
  await page.goto(TARGET_URL, { waitUntil: 'networkidle2', timeout: 45000 });
  await new Promise(r => setTimeout(r, 4000));

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_prod_dashboard.png'), fullPage: false });
  console.log('Captured 01_prod_dashboard.png');

  // Check 1: Data sources
  const dataSourcesText = await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('*')).find(e => e.textContent && e.textContent.includes('Nguồn dữ liệu'));
    return el ? el.textContent.trim() : 'NOT_FOUND';
  });
  console.log('Data sources badge text:', dataSourcesText);

  // Check 2: Price formatting (ensure no .00 on integer VND prices)
  const dashboardText = await page.evaluate(() => document.body.innerText);
  const hasDotZeroZeroPrice = /([1-9]\d{3,})\.00\b/.test(dashboardText);
  console.log('Has raw .00 VND prices on dashboard:', hasDotZeroZeroPrice);

  // Check 3: Check sector click modal
  console.log('2. Testing Sector Modal (Thủy sản & Nông nghiệp)...');
  const clickedSector = await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('span, div, p')).find(e => e.textContent && e.textContent.trim() === 'Thủy sản & Nông nghiệp');
    if (el) {
      el.click();
      return true;
    }
    return false;
  });
  console.log('Found and clicked sector:', clickedSector);
  await new Promise(r => setTimeout(r, 2000));

  const sectorModalHasFormatError = await page.evaluate(() => {
    return document.body.innerText.includes('扩展字段格式无效') || document.body.innerText.includes('Định dạng trường mở rộng không hợp lệ');
  });
  const sectorModalHasStocks = await page.evaluate(() => {
    // Check if dialog has stock cards/rows
    return document.querySelectorAll('[role="dialog"]').length > 0;
  });
  console.log('Sector modal has format error:', sectorModalHasFormatError);
  console.log('Sector modal is open:', sectorModalHasStocks);

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_prod_sector_modal.png'), fullPage: false });
  console.log('Captured 02_prod_sector_modal.png');

  // Close modal by pressing Escape
  await page.keyboard.press('Escape');
  await new Promise(r => setTimeout(r, 1000));

  // Check 4: Stock preview & Candlestick chart
  console.log('3. Testing Stock Preview & Candlestick chart...');
  // Click on a stock (e.g. DIC Corp or Chứng khoán VIX or search)
  const clickedStock = await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('span, div, td')).find(e => {
      const t = e.textContent ? e.textContent.trim() : '';
      return t === 'DIC Corp' || t === 'Chứng khoán VIX' || t === 'MSN' || t === 'VCB';
    });
    if (el) {
      el.click();
      return el.textContent.trim();
    }
    return null;
  });
  console.log('Clicked stock for preview:', clickedStock);
  await new Promise(r => setTimeout(r, 3000));

  const previewModalOpen = await page.evaluate(() => document.querySelectorAll('[role="dialog"]').length > 0);
  console.log('Preview modal open:', previewModalOpen);

  const previewModalText = await page.evaluate(() => {
    const d = document.querySelector('[role="dialog"]');
    return d ? d.innerText : '';
  });

  const hasChineseInPreview = /[一-龥]/.test(previewModalText);
  console.log('Has Chinese characters in preview dialog:', hasChineseInPreview);
  if (hasChineseInPreview) {
    const chineseChars = previewModalText.match(/[一-龥]+/g);
    console.log('Detected Chinese words in preview:', chineseChars);
  }

  const hasMinutePromptTranslated = previewModalText.includes('Tải dữ liệu nến phút') || previewModalText.includes('Xác nhận');
  console.log('Has Vietnamese intraday prompt:', hasMinutePromptTranslated);

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_prod_stock_preview.png'), fullPage: false });
  console.log('Captured 03_prod_stock_preview.png');

  await page.keyboard.press('Escape');
  await new Promise(r => setTimeout(r, 1000));

  // Check 5: Watchlist technical indicators
  console.log('4. Navigating to Watchlist (#/watchlist)...');
  await page.goto('https://fingreenvn.vercel.app/stock-panel/#/watchlist', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000));

  const watchlistText = await page.evaluate(() => document.body.innerText);
  console.log('Watchlist loaded, sample text includes VCB:', watchlistText.includes('VCB'));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_prod_watchlist.png'), fullPage: false });
  console.log('Captured 04_prod_watchlist.png');

  // Check 6: Stock Analysis extension route
  console.log('5. Navigating to Stock Analysis (#/stock-analysis)...');
  await page.goto('https://fingreenvn.vercel.app/stock-panel/#/stock-analysis', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000));

  const analysisHasError = await page.evaluate(() => {
    return document.body.innerText.includes('official.stock-analysis');
  });
  console.log('Stock Analysis route has extension error banner:', analysisHasError);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_prod_stock_analysis.png'), fullPage: false });
  console.log('Captured 05_prod_stock_analysis.png');

  await browser.close();
  console.log('=== PRODUCTION VERIFICATION COMPLETED ===');
}

run().catch(err => {
  console.error('Production verification failed:', err);
  process.exit(1);
});
