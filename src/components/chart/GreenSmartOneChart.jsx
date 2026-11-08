import React, { useEffect, useRef, useState } from 'react';
import {
  createChart,
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
  createSeriesMarkers
} from 'lightweight-charts';

export default function GreenSmartOneChart({
  bars = [],
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

  // Các Series cho chỉ báo
  const supertrendSeriesRef = useRef(null);
  const sma7SeriesRef = useRef(null);
  const sma13SeriesRef = useRef(null);
  const ema80SeriesRef = useRef(null);
  const kcUpper1Ref = useRef(null);
  const kcLower1Ref = useRef(null);
  const kcUpper2Ref = useRef(null);
  const kcLower2Ref = useRef(null);
  const kcUpper3Ref = useRef(null);
  const kcLower3Ref = useRef(null);
  const kcBasisRef = useRef(null);

  const isLight = theme === 'light';

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Thiết lập màu sắc chuẩn TradingView Pro Terminal
    const bg = isLight ? '#ffffff' : '#0e131d';
    const textColor = isLight ? '#333333' : '#94a3b8';
    const gridColor = isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.04)';
    const borderColor = isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)';

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight || 560,
      layout: {
        background: { color: bg },
        textColor: textColor,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: gridColor },
        horzLines: { color: gridColor },
      },
      crosshair: {
        mode: 0,
        vertLine: {
          color: isLight ? '#64748b' : '#38bdf8',
          width: 1,
          style: 3,
          labelBackgroundColor: isLight ? '#0f172a' : '#0284c7',
        },
        horzLine: {
          color: isLight ? '#64748b' : '#38bdf8',
          width: 1,
          style: 3,
          labelBackgroundColor: isLight ? '#0f172a' : '#0284c7',
        },
      },
      rightPriceScale: {
        borderColor: borderColor,
        autoScale: true,
        scaleMargins: {
          top: 0.08,
          bottom: 0.22,
        },
      },
      timeScale: {
        borderColor: borderColor,
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 12,
        barSpacing: 9,
        minBarSpacing: 4,
      },
      watermark: {
        visible: true,
        fontSize: 48,
        horzAlign: 'center',
        vertAlign: 'center',
        color: isLight ? 'rgba(0, 0, 0, 0.03)' : 'rgba(255, 255, 255, 0.03)',
        text: 'FinGreen • GreenSmartOne',
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

    // 1. Candlestick Series chính
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#00c853',
      downColor: '#ef4444',
      borderVisible: true,
      borderColor: '#00c853',
      borderUpColor: '#00c853',
      borderDownColor: '#ef4444',
      wickUpColor: '#00c853',
      wickDownColor: '#ef4444',
      priceFormat: {
        type: 'price',
        precision: 2,
        minMove: 0.01,
      },
    });
    candleSeriesRef.current = candleSeries;

    // 2. Volume Series phụ ở đáy
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: '#3b82f6',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: 'volume',
    });
    chart.priceScale('volume').applyOptions({
      scaleMargins: {
        top: 0.82,
        bottom: 0,
      },
    });
    volumeSeriesRef.current = volumeSeries;

    // 3. Volatility Bands (KC 1, 2, 3)
    kcUpper3Ref.current = chart.addSeries(LineSeries, {
      color: 'rgba(233, 62, 99, 0.25)',
      lineWidth: 1,
      lineStyle: 2,
      crosshairMarkerVisible: false,
    });
    kcLower3Ref.current = chart.addSeries(LineSeries, {
      color: 'rgba(0, 219, 255, 0.25)',
      lineWidth: 1,
      lineStyle: 2,
      crosshairMarkerVisible: false,
    });
    kcUpper2Ref.current = chart.addSeries(LineSeries, {
      color: 'rgba(233, 62, 99, 0.45)',
      lineWidth: 1,
      lineStyle: 2,
      crosshairMarkerVisible: false,
    });
    kcLower2Ref.current = chart.addSeries(LineSeries, {
      color: 'rgba(0, 219, 255, 0.45)',
      lineWidth: 1,
      lineStyle: 2,
      crosshairMarkerVisible: false,
    });
    kcUpper1Ref.current = chart.addSeries(LineSeries, {
      color: 'rgba(233, 62, 99, 0.75)',
      lineWidth: 1,
      lineStyle: 0,
      crosshairMarkerVisible: false,
    });
    kcLower1Ref.current = chart.addSeries(LineSeries, {
      color: 'rgba(0, 219, 255, 0.75)',
      lineWidth: 1,
      lineStyle: 0,
      crosshairMarkerVisible: false,
    });
    kcBasisRef.current = chart.addSeries(LineSeries, {
      color: 'rgba(255, 255, 255, 0.35)',
      lineWidth: 1,
      lineStyle: 2,
      crosshairMarkerVisible: false,
    });

    // 4. Cloud (Trend Ribbon: SMA 7 & SMA 13)
    sma7SeriesRef.current = chart.addSeries(LineSeries, {
      color: '#00DBFF',
      lineWidth: 2,
      crosshairMarkerVisible: false,
    });
    sma13SeriesRef.current = chart.addSeries(LineSeries, {
      color: '#E93E63',
      lineWidth: 2,
      crosshairMarkerVisible: false,
    });

    // 5. Trend Moving Average Line (EMA 80)
    ema80SeriesRef.current = chart.addSeries(LineSeries, {
      color: '#00DBFF',
      lineWidth: 3,
      crosshairMarkerVisible: true,
    });

    // 6. SuperTrend Line
    supertrendSeriesRef.current = chart.addSeries(LineSeries, {
      color: '#00e676',
      lineWidth: 2,
      lineStyle: 0,
      crosshairMarkerVisible: true,
    });

    // Xử lý Crosshair Move để đẩy thông tin ra thanh trạng thái
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

    // Responsive Resize Observer
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight || 560,
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

  // Cập nhật Dữ liệu Nến, Khối lượng và Các Chỉ Báo
  useEffect(() => {
    if (!chartRef.current || !candleSeriesRef.current || !bars || bars.length === 0) return;

    const {
      barColors,
      supertrend,
      direction,
      cloud,
      bands,
      movingAverage,
      diamonds,
      qqe,
      signals,
      activeLevels,
      isLicActive
    } = indicators;

    // 1. Gán dữ liệu Candlestick kèm màu nến SuperTrend Adaptive
    const candleData = bars.map((b, idx) => {
      const customColor = (toggles.supertrend && barColors && barColors[idx]) ? barColors[idx] : null;
      if (customColor) {
        return {
          time: b.time,
          open: b.open,
          high: b.high,
          low: b.low,
          close: b.close,
          color: customColor,
          borderColor: customColor,
          wickColor: customColor,
        };
      }
      return {
        time: b.time,
        open: b.open,
        high: b.high,
        low: b.low,
        close: b.close,
      };
    });
    candleSeriesRef.current.setData(candleData);

    // 2. Gán dữ liệu Volume
    if (volumeSeriesRef.current) {
      const volumeData = bars.map(b => ({
        time: b.time,
        value: b.volume,
        color: b.close >= b.open ? 'rgba(0, 200, 83, 0.4)' : 'rgba(239, 68, 68, 0.4)',
      }));
      volumeSeriesRef.current.setData(volumeData);
    }

    // 3. SuperTrend Line
    if (supertrendSeriesRef.current) {
      if (toggles.supertrend && supertrend) {
        const stData = bars
          .map((b, idx) => {
            const val = supertrend[idx];
            return val !== null ? { time: b.time, value: val } : null;
          })
          .filter(Boolean);
        supertrendSeriesRef.current.setData(stData);
      } else {
        supertrendSeriesRef.current.setData([]);
      }
    }

    // 4. Cloud (Trend Ribbon SMA 7 & 13)
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

    // 5. Volatility Bands (KC 1, 2, 3)
    if (kcUpper1Ref.current && kcLower1Ref.current) {
      if (toggles.bands && bands) {
        const u1 = bars.map((b, idx) => bands.upperKC1[idx] !== null ? { time: b.time, value: bands.upperKC1[idx] } : null).filter(Boolean);
        const l1 = bars.map((b, idx) => bands.lowerKC1[idx] !== null ? { time: b.time, value: bands.lowerKC1[idx] } : null).filter(Boolean);
        const u2 = bars.map((b, idx) => bands.upperKC2[idx] !== null ? { time: b.time, value: bands.upperKC2[idx] } : null).filter(Boolean);
        const l2 = bars.map((b, idx) => bands.lowerKC2[idx] !== null ? { time: b.time, value: bands.lowerKC2[idx] } : null).filter(Boolean);
        const u3 = bars.map((b, idx) => bands.upperKC3[idx] !== null ? { time: b.time, value: bands.upperKC3[idx] } : null).filter(Boolean);
        const l3 = bars.map((b, idx) => bands.lowerKC3[idx] !== null ? { time: b.time, value: bands.lowerKC3[idx] } : null).filter(Boolean);
        const bas = bars.map((b, idx) => bands.kcBasis[idx] !== null ? { time: b.time, value: bands.kcBasis[idx] } : null).filter(Boolean);

        kcUpper1Ref.current.setData(u1);
        kcLower1Ref.current.setData(l1);
        kcUpper2Ref.current.setData(u2);
        kcLower2Ref.current.setData(l2);
        kcUpper3Ref.current.setData(u3);
        kcLower3Ref.current.setData(l3);
        kcBasisRef.current.setData(bas);
      } else {
        kcUpper1Ref.current.setData([]);
        kcLower1Ref.current.setData([]);
        kcUpper2Ref.current.setData([]);
        kcLower2Ref.current.setData([]);
        kcUpper3Ref.current.setData([]);
        kcLower3Ref.current.setData([]);
        kcBasisRef.current.setData([]);
      }
    }

    // 6. Trend MA Line (EMA 80)
    if (ema80SeriesRef.current) {
      if (toggles.ma && movingAverage) {
        const maData = bars
          .map((b, idx) => (movingAverage.ema80[idx] !== null ? { time: b.time, value: movingAverage.ema80[idx] } : null))
          .filter(Boolean);
        ema80SeriesRef.current.setData(maData);
      } else {
        ema80SeriesRef.current.setData([]);
      }
    }

    // 7. Tạo Markers cho Tín Hiệu (Kim Cương 💎, Đảo Chiều QQE ❖, Lệnh Mua/Bán Strategy)
    const markers = [];

    if (isLicActive) {
      // Tín hiệu Kim Cương (Diamond Signals)
      if (toggles.diamonds && diamonds) {
        for (let i = 0; i < bars.length; i++) {
          if (diamonds.up[i]) {
            markers.push({
              time: bars[i].time,
              position: 'belowBar',
              color: '#16f2f9',
              shape: 'circle',
              text: '💎 MUA',
              size: 2,
            });
          }
          if (diamonds.down[i]) {
            markers.push({
              time: bars[i].time,
              position: 'aboveBar',
              color: '#16f2f9',
              shape: 'circle',
              text: '💎 BÁN',
              size: 2,
            });
          }
        }
      }

      // Tín hiệu QQE Reversal (❖)
      if (toggles.qqe && qqe) {
        for (let i = 0; i < bars.length; i++) {
          if (qqe.long[i]) {
            markers.push({
              time: bars[i].time,
              position: 'belowBar',
              color: '#e7bea8',
              shape: 'arrowUp',
              text: '❖ ĐẢO CHIỀU TĂNG',
              size: 1,
            });
          }
          if (qqe.short[i]) {
            markers.push({
              time: bars[i].time,
              position: 'aboveBar',
              color: '#e7bea8',
              shape: 'arrowDown',
              text: '❖ ĐẢO CHIỀU GIẢM',
              size: 1,
            });
          }
        }
      }

      // Tín hiệu Strategy (Lệnh Mua/Bán xác nhận có điểm SL)
      if (toggles.strategy && signals && signals.length > 0) {
        signals.forEach(sig => {
          markers.push({
            time: sig.time,
            position: sig.type === 'BUY' ? 'belowBar' : 'aboveBar',
            color: sig.type === 'BUY' ? '#00e676' : '#ff1744',
            shape: sig.type === 'BUY' ? 'arrowUp' : 'arrowDown',
            text: sig.text,
            size: 2,
          });
        });
      }
    }

    // Sắp xếp markers theo thời gian (yêu cầu của lightweight-charts)
    markers.sort((a, b) => (a.time > b.time ? 1 : -1));
    createSeriesMarkers(candleSeriesRef.current, markers);

    // 8. Support & Resistance Price Lines (8 Levels)
    // Xóa các đường cũ trước khi vẽ lại
    if (priceLinesRef.current && priceLinesRef.current.length > 0) {
      priceLinesRef.current.forEach(pl => {
        try {
          candleSeriesRef.current.removePriceLine(pl);
        } catch (_) {}
      });
      priceLinesRef.current = [];
    }

    if (toggles.sr && isLicActive && activeLevels && activeLevels.length > 0) {
      activeLevels.forEach(lvl => {
        if (lvl.val) {
          const pLine = candleSeriesRef.current.createPriceLine({
            price: lvl.val,
            color: lvl.isBull ? '#0DBBFF' : '#E93E63',
            lineWidth: 1,
            lineStyle: 1, // Dotted/Dashed
            axisLabelVisible: true,
            title: lvl.name,
          });
          priceLinesRef.current.push(pLine);
        }
      });
    }

    // Fit nội dung nến vừa khung hình
    chartRef.current.timeScale().fitContent();
  }, [bars, indicators, toggles]);

  return (
    <div className="relative w-full h-full flex flex-col min-h-[520px]">
      <div ref={chartContainerRef} className="w-full flex-1 rounded-xl overflow-hidden" />
    </div>
  );
}
