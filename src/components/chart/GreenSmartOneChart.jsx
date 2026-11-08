import React, { useEffect, useRef } from 'react';
import {
  createChart,
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
  createSeriesMarkers
} from 'lightweight-charts';

export default function GreenSmartOneChart({
  bars = [],
  symbol = 'FPT',
  indicators = {},
  theme = 'dark',
  toggles = {},
  onCrosshairMove
}) {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);
  const priceLinesRef = useRef([]);

  // Series chỉ báo (Cloud & Bands)
  const sma7SeriesRef = useRef(null);
  const sma13SeriesRef = useRef(null);
  const kcUpper1Ref = useRef(null);
  const kcLower1Ref = useRef(null);
  const kcUpper2Ref = useRef(null);
  const kcLower2Ref = useRef(null);
  const kcUpper3Ref = useRef(null);
  const kcLower3Ref = useRef(null);

  const isLight = theme === 'light';

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Màu nền chuẩn TradingView Dark (#131722)
    const bg = isLight ? '#ffffff' : '#131722';
    const textColor = isLight ? '#333333' : '#787b86';
    const gridColor = isLight ? 'rgba(0,0,0,0.04)' : 'rgba(42, 46, 57, 0.5)';
    const borderColor = isLight ? '#e2e8f0' : '#2a2e39';

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight || 580,
      layout: {
        background: { color: bg },
        textColor: textColor,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Trebuchet MS', Roboto, Ubuntu, sans-serif",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: gridColor },
        horzLines: { color: gridColor },
      },
      crosshair: {
        mode: 0,
        vertLine: {
          color: '#758696',
          width: 1,
          style: 3,
          labelBackgroundColor: '#2a2e39',
        },
        horzLine: {
          color: '#758696',
          width: 1,
          style: 3,
          labelBackgroundColor: '#2a2e39',
        },
      },
      rightPriceScale: {
        borderColor: borderColor,
        autoScale: true,
        scaleMargins: {
          top: 0.08,
          bottom: 0.18,
        },
      },
      timeScale: {
        borderColor: borderColor,
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 12,
        barSpacing: 9,
        minBarSpacing: 3,
      },
      watermark: {
        visible: false,
      },
      handleScale: {
        axisPressedMouseMove: true,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true,
      },
    });

    chartRef.current = chart;

    // 1. Candlestick Series: Màu vàng chanh (#e7dc3b) khi tăng, Đỏ thắm (#da1d15) khi giảm
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#e7dc3b',
      downColor: '#da1d15',
      borderVisible: true,
      borderColor: '#e7dc3b',
      borderUpColor: '#e7dc3b',
      borderDownColor: '#da1d15',
      wickUpColor: '#e7dc3b',
      wickDownColor: '#da1d15',
      priceFormat: {
        type: 'price',
        precision: 2,
        minMove: 0.01,
      },
    });
    candleSeriesRef.current = candleSeries;

    // 2. Volume Series phụ ở đáy
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: '#26a69a',
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });
    chart.priceScale('volume').applyOptions({
      scaleMargins: {
        top: 0.85,
        bottom: 0,
      },
    });
    volumeSeriesRef.current = volumeSeries;

    // 3. Volatility Bands (Keltner Channels)
    kcUpper3Ref.current = chart.addSeries(LineSeries, {
      color: 'rgba(233, 62, 99, 0.15)',
      lineWidth: 1,
      lineStyle: 0,
      crosshairMarkerVisible: false,
    });
    kcLower3Ref.current = chart.addSeries(LineSeries, {
      color: 'rgba(0, 219, 255, 0.15)',
      lineWidth: 1,
      lineStyle: 0,
      crosshairMarkerVisible: false,
    });
    kcUpper2Ref.current = chart.addSeries(LineSeries, {
      color: 'rgba(233, 62, 99, 0.25)',
      lineWidth: 1,
      lineStyle: 0,
      crosshairMarkerVisible: false,
    });
    kcLower2Ref.current = chart.addSeries(LineSeries, {
      color: 'rgba(0, 219, 255, 0.25)',
      lineWidth: 1,
      lineStyle: 0,
      crosshairMarkerVisible: false,
    });
    kcUpper1Ref.current = chart.addSeries(LineSeries, {
      color: 'rgba(233, 62, 99, 0.45)',
      lineWidth: 1,
      lineStyle: 0,
      crosshairMarkerVisible: false,
    });
    kcLower1Ref.current = chart.addSeries(LineSeries, {
      color: 'rgba(0, 219, 255, 0.45)',
      lineWidth: 1,
      lineStyle: 0,
      crosshairMarkerVisible: false,
    });

    // 4. Cloud Ribbon (SMA 7 & SMA 13)
    sma7SeriesRef.current = chart.addSeries(LineSeries, {
      color: 'rgba(0, 219, 255, 0.55)',
      lineWidth: 1,
      crosshairMarkerVisible: false,
    });
    sma13SeriesRef.current = chart.addSeries(LineSeries, {
      color: 'rgba(233, 62, 99, 0.55)',
      lineWidth: 1,
      crosshairMarkerVisible: false,
    });

    chart.subscribeCrosshairMove(param => {
      if (onCrosshairMove) {
        if (!param || !param.time || !param.seriesData) {
          onCrosshairMove(null);
          return;
        }
        const candle = param.seriesData.get(candleSeries);
        onCrosshairMove({
          time: param.time,
          candle,
          point: param.point,
        });
      }
    });

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight || 580,
        });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
    };
  }, [isLight]);

  // Cập nhật Dữ liệu & Tự động Căn Chỉnh Khung Giá (Auto-Align & Auto-Scale)
  useEffect(() => {
    if (!chartRef.current || !candleSeriesRef.current || !bars || bars.length === 0) return;

    const {
      barColors,
      cloud,
      bands,
      diamonds,
      qqe,
      activeLevels,
      finalEffSens = 3.8,
      isLicActive
    } = indicators;

    // 1. Gán Candlestick data
    const candleData = bars.map((b, idx) => {
      const col = (isLicActive && barColors && barColors[idx]) ? barColors[idx] : (b.close >= b.open ? '#e7dc3b' : '#da1d15');
      return {
        time: b.time,
        open: b.open,
        high: b.high,
        low: b.low,
        close: b.close,
        color: col,
        borderColor: col,
        wickColor: col,
      };
    });
    candleSeriesRef.current.setData(candleData);

    // 2. Volume
    if (volumeSeriesRef.current) {
      const volumeData = bars.map(b => ({
        time: b.time,
        value: b.volume,
        color: b.close >= b.open ? 'rgba(38, 166, 154, 0.4)' : 'rgba(239, 83, 80, 0.4)',
      }));
      volumeSeriesRef.current.setData(volumeData);
    }

    // 3. Volatility Bands (KC 1, 2, 3)
    if (kcUpper1Ref.current && kcLower1Ref.current) {
      if (toggles.bands && bands) {
        const u1 = bars.map((b, idx) => bands.upperKC1[idx] !== null ? { time: b.time, value: bands.upperKC1[idx] } : null).filter(Boolean);
        const l1 = bars.map((b, idx) => bands.lowerKC1[idx] !== null ? { time: b.time, value: bands.lowerKC1[idx] } : null).filter(Boolean);
        const u2 = bars.map((b, idx) => bands.upperKC2[idx] !== null ? { time: b.time, value: bands.upperKC2[idx] } : null).filter(Boolean);
        const l2 = bars.map((b, idx) => bands.lowerKC2[idx] !== null ? { time: b.time, value: bands.lowerKC2[idx] } : null).filter(Boolean);
        const u3 = bars.map((b, idx) => bands.upperKC3[idx] !== null ? { time: b.time, value: bands.upperKC3[idx] } : null).filter(Boolean);
        const l3 = bars.map((b, idx) => bands.lowerKC3[idx] !== null ? { time: b.time, value: bands.lowerKC3[idx] } : null).filter(Boolean);

        kcUpper1Ref.current.setData(u1);
        kcLower1Ref.current.setData(l1);
        kcUpper2Ref.current.setData(u2);
        kcLower2Ref.current.setData(l2);
        kcUpper3Ref.current.setData(u3);
        kcLower3Ref.current.setData(l3);
      } else {
        kcUpper1Ref.current.setData([]);
        kcLower1Ref.current.setData([]);
        kcUpper2Ref.current.setData([]);
        kcLower2Ref.current.setData([]);
        kcUpper3Ref.current.setData([]);
        kcLower3Ref.current.setData([]);
      }
    }

    // 4. Cloud Ribbon (SMA 7 & 13)
    if (sma7SeriesRef.current && sma13SeriesRef.current) {
      if (toggles.cloud && cloud) {
        const sma7Data = bars
          .map((b, idx) => (cloud.sma7[idx] !== null ? { time: b.time, value: cloud.sma7[idx] } : null))
          .filter(Boolean);
        const sma13Data = bars
          .map((b, idx) => (cloud.sma13[idx] !== null ? { time: b.time, value: cloud.sma13[idx] } : null))
          .filter(Boolean);
        sma7SeriesRef.current.setData(sma7Data);
        sma13SeriesRef.current.setData(sma13Data);
      } else {
        sma7SeriesRef.current.setData([]);
        sma13SeriesRef.current.setData([]);
      }
    }

    // 5. Markers: Kim Cương Cyan (💎) và QQE (❖)
    const markers = [];

    if (isLicActive) {
      if (toggles.diamonds && diamonds) {
        for (let i = 0; i < bars.length; i++) {
          if (diamonds.up[i]) {
            markers.push({
              time: bars[i].time,
              position: 'belowBar',
              color: '#16f2f9',
              shape: 'circle',
              size: 1,
            });
          }
          if (diamonds.down[i]) {
            markers.push({
              time: bars[i].time,
              position: 'aboveBar',
              color: '#16f2f9',
              shape: 'circle',
              size: 1,
            });
          }
        }
      }

      if (toggles.qqe && qqe) {
        for (let i = 0; i < bars.length; i++) {
          if (qqe.long[i]) {
            markers.push({
              time: bars[i].time,
              position: 'belowBar',
              color: '#e7bea8',
              shape: 'arrowUp',
              text: '❖',
              size: 1,
            });
          }
          if (qqe.short[i]) {
            markers.push({
              time: bars[i].time,
              position: 'aboveBar',
              color: '#e7bea8',
              shape: 'arrowDown',
              text: '❖',
              size: 1,
            });
          }
        }
      }

      if (bars.length > 0) {
        const lastBar = bars[bars.length - 1];
        markers.push({
          time: lastBar.time,
          position: 'aboveBar',
          color: '#00c853',
          shape: 'square',
          text: `⚡ ADAPT Sens = ${finalEffSens.toFixed(1)}`,
          size: 2,
        });
      }
    }

    markers.sort((a, b) => (a.time > b.time ? 1 : -1));
    createSeriesMarkers(candleSeriesRef.current, markers);

    // 6. Support & Resistance: Dải màu mờ nằm ngang
    if (priceLinesRef.current && priceLinesRef.current.length > 0) {
      priceLinesRef.current.forEach(pl => {
        try { candleSeriesRef.current.removePriceLine(pl); } catch (_) {}
      });
      priceLinesRef.current = [];
    }

    if (toggles.sr && isLicActive && activeLevels && activeLevels.length > 0) {
      activeLevels.slice(0, 4).forEach(lvl => {
        if (lvl.val) {
          const pLine = candleSeriesRef.current.createPriceLine({
            price: lvl.val,
            color: lvl.isBull ? 'rgba(0, 219, 255, 0.25)' : 'rgba(233, 62, 99, 0.25)',
            lineWidth: 3,
            lineStyle: 0,
            axisLabelVisible: false,
            title: '',
          });
          priceLinesRef.current.push(pLine);
        }
      });
    }

    // ⚡ TỰ ĐỘNG CĂN CHỈNH GIÁ & THỜI GIAN KHI ĐỔI MÃ (AUTO-ALIGN & AUTO-SCALE)
    const rightScale = chartRef.current.priceScale('right');
    rightScale.applyOptions({ autoScale: true });
    chartRef.current.timeScale().resetTimeScale();
    chartRef.current.timeScale().fitContent();

    // Nhịp thứ 2 sau 50ms để bảo đảm nến của mã mới luôn lấp đầy màn hình vừa vặn
    const timer = setTimeout(() => {
      if (chartRef.current) {
        chartRef.current.priceScale('right').applyOptions({ autoScale: true });
        chartRef.current.timeScale().fitContent();
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [symbol, bars, indicators, toggles]);

  return (
    <div className="relative w-full h-full flex flex-col min-h-[560px]">
      {/* Badge Bản Quyền Góc Phải */}
      <div className="absolute top-3 right-3 z-20 pointer-events-none">
        <span className="px-2.5 py-1 rounded-md bg-[#00c853] text-white font-bold text-[10px] shadow-lg tracking-wide flex items-center gap-1">
          ✅ LICENSE HỢP LỆ
        </span>
      </div>

      <div ref={chartContainerRef} className="w-full flex-1 rounded-2xl overflow-hidden" />
    </div>
  );
}
