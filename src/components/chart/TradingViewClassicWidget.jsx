import React, { useEffect, useRef } from 'react';

/**
 * TradingViewClassicWidget
 * Nhúng biểu đồ TradingView Advanced Real-Time Chart chính thức 100%
 * Hỗ trợ OANDA:XAUUSD, BINANCE:BTCUSDT, ETH, XRP, SOL và HOSE:Cổ phiếu VN
 * Đầy đủ công cụ vẽ, chỉ báo kỹ thuật, timeframe M1 - D1 chuẩn xác tuyệt đối không lệch 1 xu
 */
export default function TradingViewClassicWidget({
  symbol = 'FPT',
  interval = '5',
  theme = 'dark',
  isCrypto = false
}) {
  const containerRef = useRef(null);

  // Nếu là crypto, symbol đã được truyền vào dạng "OANDA:XAUUSD" hoặc "BINANCE:BTCUSDT"
  const tvSymbol = isCrypto ? symbol : `HOSE:${symbol}`;

  // Chuẩn hóa interval cho TradingView
  const tvInterval = String(interval || '5');

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';

    const containerId = `tv_chart_container_${Math.random().toString(36).substring(2, 9)}`;
    const innerDiv = document.createElement('div');
    innerDiv.id = containerId;
    innerDiv.style.width = '100%';
    innerDiv.style.height = '100%';
    innerDiv.style.minHeight = '640px';
    containerRef.current.appendChild(innerDiv);

    const initWidget = () => {
      if (typeof window.TradingView !== 'undefined') {
        new window.TradingView.widget({
          autosize: true,
          symbol: tvSymbol,
          interval: tvInterval,
          timezone: 'Asia/Ho_Chi_Minh',
          theme: theme === 'light' ? 'light' : 'dark',
          style: '1',
          locale: 'vi_VN',
          toolbar_bg: theme === 'light' ? '#f1f3f6' : '#131722',
          enable_publishing: false,
          allow_symbol_change: true,
          hide_side_toolbar: false,
          withdateranges: true,
          hide_volume: false,
          save_image: true,
          show_popup_button: true,
          popup_width: '1200',
          popup_height: '800',
          container_id: containerId,
        });
      }
    };

    if (typeof window.TradingView === 'undefined') {
      const existingScript = document.getElementById('tradingview-widget-script');
      if (!existingScript) {
        const script = document.createElement('script');
        script.id = 'tradingview-widget-script';
        script.src = 'https://s3.tradingview.com/tv.js';
        script.async = true;
        script.onload = initWidget;
        document.head.appendChild(script);
      } else {
        existingScript.addEventListener('load', initWidget);
      }
    } else {
      initWidget();
    }

    return () => {
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, [tvSymbol, tvInterval, theme]);

  return (
    <div className="w-full h-full min-h-[640px] rounded-2xl overflow-hidden border border-[var(--border-color)] bg-[#131722]">
      <div ref={containerRef} className="w-full h-full min-h-[640px]" />
    </div>
  );
}
