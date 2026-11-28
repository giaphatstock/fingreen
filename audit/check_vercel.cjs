const https = require('https');

function check() {
  https.get('https://fingreenvn.vercel.app/stock-panel/index.html?t=' + Date.now(), (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      const match = data.match(/src="([^"]+index-[^"]+\.js)"/);
      const script = match ? match[1] : 'unknown';
      console.log(`[${new Date().toISOString()}] Live remote script: ${script}`);
      if (script.includes('index-CFUnEQbm.js')) {
        console.log('SUCCESS! Vercel has deployed the new build (index-CFUnEQbm.js)!');
        process.exit(0);
      } else {
        console.log('Vercel still serving previous build. Waiting 10s...');
        setTimeout(check, 10000);
      }
    });
  }).on('error', err => {
    console.error('Error fetching:', err);
    setTimeout(check, 10000);
  });
}

check();
