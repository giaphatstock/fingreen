# SYSTEM INVENTORY — FINGREEN STOCK PANEL AUDIT

**Audit Date:** 2026-11-24  
**Auditor Roles:** Principal Full-Stack Engineer, Financial Systems Architect, QA Lead, Localization Engineer  
**Repository:** `https://github.com/giaphatstock/fingreen.git`  
**Deployment Target:** `https://fingreenvn.vercel.app/stock-panel/index.html#/`  

---

## 1. Architecture Overview

The system consists of two primary codebases:
1. **FinGreen Main Application** (`/fingreen`):
   - Framework: React 18 with Vite 6, TailwindCSS, React Router 7.
   - Purpose: Comprehensive financial platform featuring AI assistant, news, community posts, interactive chart (Lightweight Charts), and financial tools.
   - Route `/stock-panel`: Hosts the embedded `tick-stock-panel` static terminal via an `<iframe>` or direct routing to `/public/stock-panel/index.html`.
   - Deployment: Hosted on Vercel (`fingreenvn.vercel.app`).
   - Configuration: `vercel.json` with static asset rewrites and SPA fallback.

2. **Tick Stock Panel Frontend** (`/tick-stock-panel/frontend`):
   - Framework: React 18 with Vite 5, TailwindCSS, ECharts 5, Lightweight Charts 5, TanStack Query 5, HashRouter.
   - Original Purpose: Quant and stock analytics dashboard originally designed for Chinese A-share markets (TickFlow/FastAPI backend).
   - Target Adaptation: Re-architected for Vietnam Stock Market (HOSE, HNX, UPCoM - 2,175 symbols) in Vietnamese localization.
   - Build Output: Compiled via `pnpm run build` into `dist/`, which is copied into `fingreen/public/stock-panel/`.

---

## 2. Component and Service Directory

| Component / Subsystem | Location | Technologies | Responsibilities |
|---|---|---|---|
| Main Host App | `fingreen/src` | React 18, Vite 6, Tailwind | User auth, community posts, news, live board, charts |
| Stock Panel Host Page | `fingreen/src/pages/StockPanelPage.jsx` | React 18, Lucide | Embeds `/stock-panel/index.html` with fullscreen toggle |
| Stock Panel App | `tick-stock-panel/frontend/src` | React 18, Vite 5, ECharts | Quant terminal, dashboard, factor discovery, backtest, screener |
| Static Build Target | `fingreen/public/stock-panel` | HTML, JS, CSS | Built bundle served directly by Vercel CDN |
| Fallback Data Engine | `tick-stock-panel/frontend/src/lib/vietnamFallback.ts` | TypeScript | Client-side provider serving Vietnam market data without Python backend |
| API Layer | `tick-stock-panel/frontend/src/lib/api.ts` | TypeScript, Fetch | HTTP requests, error handling, static deployment interception |
| Quote Stream | `tick-stock-panel/frontend/src/lib/useQuoteStream.ts` | React Hooks, SSE | Realtime quotes and status updates via SSE/EventSource |
| Vercel Deployment Config | `fingreen/vercel.json` | JSON | Rewrites for `/stock-panel/*`, `/api/*`, and SPA routing |

---

## 3. Data Providers and Flow

### 3.1. Upstream Data Sources
- **VPS Datafeed API** (`https://bgapidatafeed.vps.com.vn`):
  - `getlistindexdetail/10,11,02,03`: Real live index quotes (VN-Index, VN30, HNX-Index, UPCoM-Index), trading value, volume, advance/decline/unchanged counts.
  - `getliststockdata/{symbols}`: Real live stock quotes, price, ceiling, floor, ref, matched volume, foreign buy/sell, order books.
- **VNDirect DChart API** (`https://dchart-api.vndirect.com.vn`):
  - `dchart/history?resolution=D&symbol={symbol}&from={from}&to={to}`: Real historical daily and minute OHLCV bars.
- **DNSE / Entrade API** (`https://services.entrade.com.vn`):
  - Backup intraday and historical candle provider.

### 3.2. Data Flow Architecture
```
[VPS Datafeed / VNDirect / DNSE]
          │
          ▼
[vietnamFallback.ts Data Engine / Client Provider]
          │
          ▼
[api.ts Request Interceptor (Static/Serverless)]
          │
          ▼
[TanStack Query Cache (QK.*)]
          │
          ▼
[React Components & ECharts / Lightweight Charts]
```

---

## 4. Key Configuration Files

- `fingreen/vercel.json`: Defines serverless rewrite rules.
- `fingreen/package.json`: Dependencies and scripts for main app.
- `tick-stock-panel/frontend/package.json`: Dependencies and scripts for terminal.
- `tick-stock-panel/frontend/vite.config.ts`: Base `./`, proxy configuration, rollup manualChunks.
- `tick-stock-panel/frontend/src/router.tsx`: HashRouter routing setup.

---

## 5. Identified Structural Vulnerabilities

1. **Stale Asset Accumulation**: `fingreen/public/stock-panel/assets/` was never purged before new builds, resulting in dozens of conflicting chunk versions.
2. **SSE Crash on Static Deployments**: `useQuoteStream.ts` spawned `new EventSource('/api/intraday/stream')` unconditionally, which hit Vercel HTML rewrites and triggered continuous disconnect loops with Chinese toasts.
3. **Unsafe Array / Property Access**:
   - `DataSources.tsx`: `cap.candidates.length` throws if `candidates` is undefined.
   - `Screener.tsx`: `Object.entries(summaryQuery.data.results)` throws if `results` is undefined.
   - `Data.tsx`: `historicalShareRows.toLocaleString()` throws if `historicalShareRows` is undefined.
   - `Backtest.tsx`: `strategyList.find()` throws if `strategyList` is not an array.
4. **Hybrid Chinese/Vietnamese Strings**: Past automated string replacements produced corrupted terms like `Phiên trầnThế trận`, `个股涨 / 平 / 跌`, `暂无Phiên trầnDữ liệu`.
5. **Mock/Fake Data Hardcoding**: `vietnamFallback.ts` contained `Math.random()`, hardcoded Chinese currency units (`亿`), and unverified data.
