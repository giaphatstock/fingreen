# REALTIME VERIFICATION — FINGREEN STOCK PANEL

**Audit Date:** 2026-11-26  
**Scope:** Verification of Realtime quote capability, SSE/Polling behavior, and trading session accuracy.  

---

## 1. Previous Defect Analysis

Previously, the system exhibited two severe Realtime defects:
1. **Unconditional SSE Connection Failure**: `useQuoteStream.ts` unconditionally opened `new EventSource('/api/intraday/stream')`. On Vercel static/serverless deployments, this endpoint resolved to `index.html` (`text/html`), causing Chrome to abort the connection, log a console error on every page, and pop up a Chinese error toast (`Realtime连接已断开，正在重连…`).
2. **Fake Realtime Capabilities**: `vietnamFallback.ts` previously returned hardcoded `realtime_allowed: true`, `mode: 'full_market'`, `symbol_count: 2175`, and `quote_age_ms: 80` regardless of whether the Vietnam stock market was open or whether live data was actually flowing.

---

## 2. Remediation Implemented

1. **Static Deployment Guard in `useQuoteStream.ts`**:
   - Detects static/serverless runtime (`vercel.app`, `github.io`, or non-dev preview ports) and avoids opening invalid `/api/intraday/stream` SSE connections.
   - Eliminates the console MIME error and Chinese disconnect toast loop.
   - Localized any fallback toast message to Vietnamese: `"Mất kết nối dữ liệu thời gian thực, đang thử kết nối lại…"`.
2. **Dynamic Trading Session Status in `vietnamFallback.ts`**:
   - Calculates `isTradingHours` in `Asia/Ho_Chi_Minh` (Monday–Friday, 09:00–11:30 and 13:00–14:45 ICT).
   - Sets `mode: 'polling'` during active Vietnam trading sessions and `mode: 'snapshot'` when market is closed (serving official end-of-day/last-session closing prices from VPS Datafeed).
   - Sets `symbol_count` strictly to the actual number of tracked symbols returned by VPS Datafeed (`snap.stocks.length`), never hardcoded `2175`.
   - Sets `quote_age_ms` to `null` when market is closed instead of faking `80ms`.
