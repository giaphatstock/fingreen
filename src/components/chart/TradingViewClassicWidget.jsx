import React, { useEffect, useRef } from 'react';

/**
 * TradingViewClassicWidget
 * Hỗ trợ cả cổ phiếu VN (HOSE:FPT) và Crypto (BINANCE:BTCUSDT, OANDA:XAUUSD)
 * @param {string} symbol - Có thể là mã VN (FPT, HPG) hoặc TV full format (BINANCE:BTCUSDT)
 * @param {string} theme
 * @param {boolean} isCrypto - Nếu true, không thêm prefix HOSE:
 */
export default function TradingViewClassicWidget({ symbol = 'FPT', theme = 'dark', isCrypto = false }) {
  const containerRef = useRef(null);

  // Nếu là crypto, symbol đã được truyền vào dạng "BINANCE:BTCUSDT" hoặc "OANDA:XAUUSD"
  // Nếu là chứng khoán VN, thêm prefix HOSE:
  const tvSymbol = isCrypto ? symbol : `HOSE:${symbol}`;

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      if (typeof window.TradingView !== 'undefined' && containerRef.current) {
        new window.TradingView.widget({
          autosize: true,
          symbol: tvSymbol,
          interval: isCrypto ? '60' : 'D', // Mặc định 1H cho crypto, 1D cho cổ phiếu
          timezone: 'Asia/Ho_Chi_Minh',
          theme: theme === 'light' ? 'light' : 'dark',
          style: '1',
          locale: 'vi_VN',
          toolbar_bg: '#f1f3f6',
          enable_publishing: false,
          allow_symbol_change: true,
          container_id: containerRef.current.id,
        });
      }
    };
    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, [tvSymbol, theme, isCrypto]);

  const widgetId = `tv-widget-${symbol.replace(/[^a-zA-Z0-9]/g, '-')}`;

  return (
    <div className="w-full h-full min-h-[560px] rounded-2xl overflow-hidden border border-[var(--border-color)]">
      <div id={widgetId} ref={containerRef} className="w-full h-full min-h-[560px]" />
    </div>
  );
}
