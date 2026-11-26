# DATA SOURCE AUDIT — FINGREEN STOCK PANEL

**Audit Date:** 2026-11-26  
**Scope:** Verification of live, historical, and fallback data providers for the Vietnam Stock Market (HOSE, HNX, UPCoM).  

---

## 1. Upstream Data Provider Inventory & Verification

| Data Dataset | Provider | Endpoint | HTTP Status | CORS Support (Browser) | Data Type | Update Frequency | Verification Status |
|---|---|---|---|---|---|---|---|
| **Market Indices (VNINDEX, VN30, HNX, UPCOM)** | VPS Datafeed | `https://bgapidatafeed.vps.com.vn/getlistindexdetail/10,11,02,03` | 200 OK | YES (`Access-Control-Allow-Origin: *`) | Real Exchange Index Points, Volume, Value, Advance/Decline/Flat | Live during session / Last close outside hours | **VERIFIED REAL** |
| **Live Stock Quotes (~120 Liquid VN Stocks)** | VPS Datafeed | `https://bgapidatafeed.vps.com.vn/getliststockdata/{symbols}` | 200 OK | YES (`Access-Control-Allow-Origin: *`) | Real Match Price, Ceiling, Floor, Ref, Volume, Foreign Buy/Sell | Live during session / Last close outside hours | **VERIFIED REAL** |
| **Historical OHLCV Daily Klines** | FinGreen Serverless Proxy -> DNSE/Entrade & VNDirect | `/api/stock-candles?symbol={sym}&resolution=1D` | 200 OK (on Vercel) | Same-origin on Vercel | Real Historical Daily OHLCV | Daily EOD / Intraday | **VERIFIED REAL (Vercel)** |
| **Direct VNDirect DChart** | VNDirect | `https://dchart-api.vndirect.com.vn/dchart/history` | 403 Access Denied (Browser) / 200 OK (Server) | NO (Requires Server Proxy) | Real Historical OHLCV | Daily / Intraday | **PROXY REQUIRED** |
| **24HMoney** | 24HMoney | `https://api.24hmoney.vn/...` | 404 / DNS Issues on undocumented paths | Restricted | Financial News / Quotes | N/A | **NOT INTEGRATED** |

---

## 2. Remediation of Fake / Mock Data

During the initial audit of `src/lib/vietnamFallback.ts`, the following synthetic data mechanisms were identified and **COMPLETELY REMOVED**:
1. **`Math.random()` Kline Generator (`generateKlineRows`)**: Removed completely. Replaced with real calls to `/api/stock-candles`. If unreachable (e.g., offline), returns `{ symbol, rows: [] }` honestly.
2. **Hardcoded Fake Stock List (`VIETNAM_STOCKS_SAMPLE`)**: Removed completely. Replaced with real live fetching from `bgapidatafeed.vps.com.vn`.
3. **Fake Limit-Up Tiers (`VIX: 4 boards`, `DIG: 3 boards`, `CEO: 3 boards`)**: Removed completely. Limit-up stocks are now strictly filtered from real VPS quotes (`price >= ceiling && ceiling > 0`). If 0 stocks are at ceiling, `tiers: []` is returned.
4. **Hardcoded Sentiment `72` & Breadth `2175`**: Removed completely. Breadth (`up`, `down`, `flat`) is parsed directly from VPS index `ot` field (`advances|declines|unchanged`), and sentiment score is computed transparently from the real advance/decline ratio.
5. **Fake Chinese Units (`亿`, `万`)**: Replaced in `src/lib/format.ts` with proper Vietnamese units (`tỷ`, `triệu`, `nghìn`).

---

## 3. Data Accuracy & Unit Normalization Rules

- **Price Normalization**: VPS Datafeed returns stock prices in thousands of VND (e.g., `29.8`). Normalized to exact VND (`Math.round(price * 1000)` -> `29,800 VND`).
- **Index Value Normalization**: VPS Datafeed returns index trading value in millions of VND. Normalized to VND (`value * 1_000_000`) so `fmtBigNum` displays exact `nghìn tỷ` / `tỷ` VND.
- **Volume Normalization**: VPS `lot` is in 10-share units. Normalized to exact shares (`lot * 10`).
- **Timezone Normalization**: All date/time formatting forced to `Asia/Ho_Chi_Minh` (ICT / UTC+7), replacing `Asia/Shanghai`.
