import React, { useEffect, useRef } from 'react';

export default function TradingViewClassicWidget({ symbol = 'FPT', theme = 'dark' }) {
  const containerRef = useRef(null);

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
          symbol: `HOSE:${symbol}`,
          interval: 'D',
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
  }, [symbol, theme]);

  return (
    <div className="w-full h-full min-h-[560px] rounded-2xl overflow-hidden border border-[var(--border-color)]">
      <div id={`tv-widget-${symbol}`} ref={containerRef} className="w-full h-full min-h-[560px]" />
    </div>
  );
}
