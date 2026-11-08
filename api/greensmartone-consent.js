/**
 * Vercel Serverless Function: Greensmartone Consent IP & Metadata Capture
 * Thu thập địa chỉ IP thực tế, User-Agent và dấu vết số của người dùng khi chấp thuận điều khoản
 */

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Lấy IP chuẩn từ Proxy Vercel / Cloudflare
  const forwarded = req.headers['x-forwarded-for'];
  let ip = '127.0.0.1';
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    ip = forwarded.split(',')[0].trim();
  } else if (req.headers['x-real-ip']) {
    ip = String(req.headers['x-real-ip']).trim();
  } else if (req.socket?.remoteAddress) {
    ip = req.socket.remoteAddress;
  }

  // Chuẩn hóa localhost IPv6
  if (ip === '::1' || ip === '::ffff:127.0.0.1') {
    ip = '127.0.0.1';
  }

  const userAgent = req.headers['user-agent'] || 'Unknown Browser';

  return res.status(200).json({
    success: true,
    ip,
    userAgent,
    timestamp: new Date().toISOString(),
    version: '11/2026'
  });
}
