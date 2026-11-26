# API AUDIT REPORT — FINGREEN STOCK PANEL

**Audit Date:** 2026-11-26  
**Scope:** End-to-end audit of frontend API requests, static/serverless fallback routing, response schemas, and error handling.  

---

## 1. API Interception & Fallback Architecture

- **Static/Serverless Detection (`src/lib/api.ts`)**:
  - When deployed on Vercel (`vercel.app`), GitHub Pages, or Vite Preview without a FastAPI backend (`port !== '3011'`), `request<T>(path)` intercepts `/api/*` calls and routes them to `handleVietnamFallback(path)` in `src/lib/vietnamFallback.ts`.
- **SSE / EventSource Guard (`src/lib/useQuoteStream.ts`)**:
  - Prevents opening `new EventSource('/api/intraday/stream')` in static/serverless mode, eliminating the `MIME type ("text/html") is not "text/event-stream"` error and infinite reconnect loop.

---

## 2. Endpoint Audit Table

| Endpoint | Method | Status | Response Schema | Data Provider | Real Data? | Defects Found & Fixed | Result |
|---|---|---|---|---|---|---|---|
| `/api/overview/market` | GET | 200 | `OverviewMarket` | VPS Datafeed | **YES** | Fixed `radar` array shape, added `emotion` & `boards` objects, removed fake `Math.random()` & hardcoded values. | **PASS** |
| `/api/quote/status` | GET | 200 | `QuoteStatus` | VPS Datafeed | **YES** | Dynamic `is_trading_hours` in `Asia/Ho_Chi_Minh`, real `symbol_count`, honest `mode` (`polling`/`snapshot`). | **PASS** |
| `/api/intraday/status` | GET | 200 | `QuoteStatus` | VPS Datafeed | **YES** | Same as `/api/quote/status`. | **PASS** |
| `/api/screener/limit-ladder` | GET | 200 | `LimitLadderResponse` | VPS Datafeed | **YES** | Removed fake `VIX/DIG/CEO` consecutive tiers; filters strictly `price >= ceiling`. | **PASS** |
| `/api/screener/abnormal` | GET | 200 | `AbnormalOverview` | VPS Datafeed | **YES** | Filters real stocks moving `>= 3%` or `<= -3%`; fixed Chinese board labels. | **PASS** |
| `/api/screener/dragon-tiger` | GET | 200 | `ForeignTradingResponse` | VPS Datafeed | **YES** | Maps real `fBVol`, `fSVolume`, `fBValue`, `fSValue` from VPS Datafeed. | **PASS** |
| `/api/kline/daily` | GET | 200 | `{ symbol, rows }` | FinGreen Serverless `/api/stock-candles` | **YES** | Removed `generateKlineRows` (`Math.random()`); returns real OHLCV or empty array `[]`. | **PASS** |
| `/api/watchlist` | GET | 200 | `{ symbols: WatchlistEntry[] }` | VPS Datafeed | **YES** | Fixed schema to return `{ symbols }` instead of `{ items }`, preventing `.length` crash. | **PASS** |
| `/api/watchlist/enriched` | GET | 200 | `{ rows, as_of, elapsed_ms }` | VPS Datafeed | **YES** | Returns real live prices and changes for tracked watchlist symbols. | **PASS** |
| `/api/watchlist/groups` | GET | 200 | `{ groups: WatchlistGroup[] }` | Client State | N/A | Returns default `VN30 Tiêu biểu` group. | **PASS** |
| `/api/screener/summary` | GET | 200 | `{ as_of, today_ever_counts, results }` | Client Fallback | N/A | Added `results: {}` and guarded `Object.entries()` in `Screener.tsx`. | **PASS** |
| `/api/data/status` | GET | 200 | `DataStatus` | VPS Datafeed | **YES** | Added complete `DataStatus` schema (`daily`, `financials`, `storage`) preventing `toLocaleString()` crash. | **PASS** |
| `/api/pipeline/history` | GET | 200 | `{ jobs: [] }` | Client Fallback | N/A | Added `jobs: []` preventing `jobs.length` crash on `Data.tsx`. | **PASS** |
| `/api/capabilities` | GET | 200 | `CapabilitiesResponse` | Client Fallback | N/A | Wrapped in `{ label, capabilities: {...} }` preventing `Object.entries()` crash in `DataSources.tsx`. | **PASS** |
| `/api/settings/capability-matrix` | GET | 200 | `CapabilityMatrix` | Client Fallback | N/A | Added `candidates` and `pending` arrays preventing `.length` crash. | **PASS** |
| `/api/settings/data-sources` | GET | 200 | `DataSourcesResponse` | Client Fallback | N/A | Added `errors: []` and `config_dir`; listed real VPS & VNDirect sources. | **PASS** |
| `/api/engine/price-views` | GET | 200 | `EnginePriceChoice[]` | Client Fallback | N/A | Changed from `{}` to `[]` preventing `va.find is not a function` crash in `Backtest.tsx`. | **PASS** |
