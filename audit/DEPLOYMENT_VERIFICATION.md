# DEPLOYMENT VERIFICATION — FINGREEN STOCK PANEL

**Audit Date:** 2026-11-26  
**Repository:** `https://github.com/giaphatstock/fingreen` (`main` branch)  
**Production URL:** `https://fingreenvn.vercel.app/stock-panel/index.html#/`  

---

## 1. Root Cause of Stale Production Deployments

During investigation of `fingreen/public/stock-panel/assets/`, it was discovered that:
1. Previous build deployments copied files from `tick-stock-panel/frontend/dist/` over `fingreen/public/stock-panel/` **without cleaning the destination directory**.
2. As a result, multiple conflicting hashed JS chunks (e.g., 7 distinct versions of `About-*.js`, `AI-*.js`, `Watchlist-*.js`, `SettingsModal-*.js`) accumulated inside `fingreen/public/stock-panel/assets/`.
3. A Chinese WeChat QR code (`donate-wechat.jpg`) remained in `fingreen/public/stock-panel/`.

## 2. Deployment Hygiene Fix

- Added mandatory purge step prior to asset copy:
  `Remove-Item "fingreen\public\stock-panel\assets\*" -Recurse -Force`
  `Remove-Item "fingreen\public\stock-panel\donate-wechat.jpg" -Force`
- Verified `vercel.json` rewrites cleanly serve `/stock-panel/index.html` and `/stock-panel/assets/(.*)` without falling back to the outer FinGreen SPA.
