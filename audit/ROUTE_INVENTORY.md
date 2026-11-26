# ROUTE INVENTORY — FINGREEN STOCK PANEL

**Audit Date:** 2026-11-24  
**Audit Target:** `https://fingreenvn.vercel.app/stock-panel/index.html`  
**Test Method:** Headless Chrome Browser Automation with DOM Text Inspection and Console Error Tracking  

---

## 1. Route Table & Baseline State (Before Remediation)

| # | Route Hash | Route Name | Render Status | Unhandled Error | Chinese Elements | Console Errors | Primary Defect |
|---|---|---|---|---|---|---|---|
| 1 | `#/` | Tổng quan (Dashboard) | RENDERED | None | 35 | 1 | Residual Chinese units (`亿`), headers (`个股涨/平/跌`), SSE MIME error |
| 2 | `#/watchlist` | Theo dõi (Watchlist) | RENDERED | None | 141 | 1 | Extensive Chinese headers, tooltips, and table column names |
| 3 | `#/screener` | Lọc chiến lược (Screener) | CRASHED | `TypeError: Cannot convert undefined or null to object` | 2 | 3 | Crashed on `Object.entries(summaryQuery.data.results)` |
| 4 | `#/factors` | Nhân tố (Factors) | RENDERED | None | 62 | 1 | Chinese text in factor library and composite cards |
| 5 | `#/backtest` | Kiểm thử (Backtest) | CRASHED | `TypeError: va.find is not a function` | 2 | 4 | Crashed on non-array return from strategy/engine endpoints |
| 6 | `#/data` | Dữ liệu (Data) | CRASHED | `TypeError: Cannot read properties of undefined (reading 'toLocaleString')` | 2 | 5 | Crashed on `historicalShareRows.toLocaleString()` in Data.tsx |
| 7 | `#/indices` | Chỉ số (Indices) | RENDERED | None | 19 | 1 | Chinese units and labels in index comparison |
| 8 | `#/settings` | Cài đặt (Settings) | CRASHED | `TypeError: Cannot read properties of undefined (reading 'length')` | 2 | 13 | Crashed on `cap.candidates.length` in DataSources |
| 9 | `#/settings?tab=data-sources` | Nguồn dữ liệu (DataSources) | CRASHED | `TypeError: Cannot read properties of undefined (reading 'length')` | 2 | 13 | Same as above |
| 10 | `#/custom/limit-ladder` | Bảng kịch trần (Limit-Ladder) | RENDERED | None | 35 | 1 | Sidebar & header Chinese, hybrid text in empty states |
| 11 | `#/custom/abnormal` | Biến động bất thường (Abnormal) | RENDERED | None | 35 | 2 | Chinese board filters (`主板`, `创业板`, `科创板`, `北交所`) |
| 12 | `#/custom/market-regime` | Tâm lý & Chế độ TT | RENDERED | None | 35 | 1 | Chinese indicator labels and radar charts |
| 13 | `#/custom/dragon-tiger` | Khối ngoại / Long Hổ (Dragon Tiger) | RENDERED | None | 35 | 1 | Chinese institutional seat labels and residual terms |
| 14 | `#/custom/review` | Nhật ký thị trường (Review) | RENDERED | None | 35 | 1 | Residual Chinese in prompt generation and reports |
| 15 | `#/custom/paper` | Giao dịch ảo (Paper) | RENDERED | None | 35 | 1 | Chinese order placement terms, portfolio labels |

---

## 2. Global Shared Defects Identified Across Routes

1. **Theme Script in `index.html`**:
   - Chinese comments in initial bootstrap script:
     ```javascript
     // 预渲染主题脚本: 首屏前设置 html.dark, 避免亮暗闪烁 (FOUC)。
     // 默认暗色; 用户切过亮色后 (localStorage tf-theme=light) 保持亮色。
     ```
   - Present on every single page render.

2. **AI Copilot Floating Button & Modal**:
   - `Trợ lý AI (⌘K / Ctrl+K · 可拖动)`
   - `打开 Trợ lý AI`
   - Present in global Layout shell on every page.

3. **EventSource / SSE Failure**:
   - `EventSource's response has a MIME type ("text/html") that is not "text/event-stream". Aborting the connection.`
   - Fires on all pages due to `useQuoteStream.ts` attempting to connect to `/api/intraday/stream` against Vercel static rewrites.
   - Shows Chinese disconnect toast: `Realtime连接已断开，正在重连…`.
