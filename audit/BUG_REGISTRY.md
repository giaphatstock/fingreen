# BUG REGISTRY — FINGREEN STOCK PANEL AUDIT

**Audit Date:** 2026-11-24  
**Audit Scope:** Full system audit covering frontend, data layer, localization, routing, and deployment.  

---

## Bug Registry Table

| Bug ID | Severity | Page / Component | Defect Description | Root Cause | Affected File(s) | Fix Plan | Status |
|---|---|---|---|---|---|---|---|
| **BUG-001** | CRITICAL | `#/data` | Application Crash: `Cannot read properties of undefined (reading 'toLocaleString')` | `historicalShareRows` undefined in `Data.tsx:575` when financial metrics are missing. | `src/pages/Data.tsx` | Add nullish coalescing `(historicalShareRows ?? 0).toLocaleString()`. | OPEN |
| **BUG-002** | CRITICAL | `#/settings` | Application Crash: `Cannot read properties of undefined (reading 'length')` | `cap.candidates` or `cap.pending` is undefined in capability matrix card. | `src/pages/settings/DataSources.tsx` | Guard with `(cap.candidates ?? []).length` and `(cap.pending ?? []).length`. | OPEN |
| **BUG-003** | CRITICAL | `#/screener` | Application Crash: `Cannot convert undefined or null to object` | `summaryQuery.data.results` is undefined when summary returns `{}`. | `src/pages/Screener.tsx`, `src/lib/vietnamFallback.ts` | Guard with `Object.entries(data?.results ?? {})` and provide structured results in fallback. | OPEN |
| **BUG-004** | CRITICAL | `#/backtest` | Application Crash: `va.find is not a function` | `strategyList` or `enginePriceViews.data` returns an object instead of array. | `src/pages/backtest/StrategyBacktest.tsx`, `src/lib/vietnamFallback.ts` | Ensure API responses return arrays `[]` and guard with `Array.isArray(x) ? x : []`. | OPEN |
| **BUG-005** | CRITICAL | Global SSE | Continuous reconnect loops & Chinese toast: `Realtime连接已断开，正在重连…` | `useQuoteStream.ts` attempts SSE connection to `/api/intraday/stream` which returns HTML on Vercel. | `src/lib/useQuoteStream.ts` | Detect static deployment; disable SSE streaming fallback to periodic polling without error toasts. | OPEN |
| **BUG-006** | HIGH | Global | Stale build chunks accumulating in production bundle | Assets copied into `fingreen/public/stock-panel/assets/` without purging existing files. | Deployment workflow | Purge `fingreen/public/stock-panel/assets/` before copying fresh build output. | OPEN |
| **BUG-007** | HIGH | `#/` Dashboard | Hybrid Chinese/Vietnamese strings: `Phiên trầnThế trận`, `个股涨 / 平 / 跌`, `221.80亿`, `4板`, `广度` | Uncoordinated batch substring replacement scripts corrupted compound words and units. | `src/components/dashboard/*`, `src/lib/vietnamFallback.ts` | Comprehensive manual localization of all dashboard widgets, units, and registry. | OPEN |
| **BUG-008** | HIGH | Data Engine | Fake mock data using `Math.random()` and hardcoded Chinese market stats | `vietnamFallback.ts` previously generated synthetic market breadth, random klines, and fake limit ladders. | `src/lib/vietnamFallback.ts` | Integrate real live market data from VPS datafeed & VNDirect; show honest empty state if offline. | OPEN |
| **BUG-009** | MEDIUM | `index.html` | Chinese comments in theme bootstrap script | Inlined script in `index.html` contained untranslated Chinese comments. | `index.html` | Translate or clean bootstrap comments. | OPEN |
| **BUG-010** | MEDIUM | `#/watchlist` | 141 residual Chinese elements in columns, tooltips, and group filters | Substring translator missed column definitions and custom indicator manager strings. | `src/pages/Watchlist.tsx`, `src/lib/list-columns.ts` | Translate all column headers and tooltips into standard Vietnamese financial terms. | OPEN |
| **BUG-011** | MEDIUM | `#/custom/abnormal` | Chinese stock board filters: `主板`, `创业板`, `科创板`, `北交所` | China A-share market boards hardcoded in abnormal monitor component. | `src/custom/abnormal/Page.tsx` | Replace with Vietnam exchanges: `HOSE`, `HNX`, `UPCOM`, `VN30`. | OPEN |
| **BUG-012** | LOW | Layout | AI assistant button label: `Trợ lý AI (⌘K / Ctrl+K · 可拖动)` | Residual Chinese `可拖动` (Draggable) and `打开` in Layout.tsx. | `src/components/Layout.tsx` | Localize to `Trợ lý AI (⌘K / Ctrl+K · Có thể kéo thả)`. | OPEN |
