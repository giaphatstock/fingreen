import React, { useState, useEffect, useRef } from 'react';
import { formatNumber, formatPrice, getPriceTextColor } from '../../services/liveBoardService';

/**
 * Ô hiển thị Giá - Chuẩn Smart Board
 * Chớp sáng VIVID VÀ RÕ NÉT giống hệt VPS khi có biến động giá hoặc khớp lệnh!
 */
export const PriceCell = React.memo(function PriceCell({
  price,
  refPrice,
  ceiling,
  floor,
  boardTheme = 'MODERN',
  className = '',
  isBold = false,
  triggerVol = null // Dùng cho Khớp Giá: nếu khớp lệnh cùng giá nhưng có volume mới thì vẫn chớp!
}) {
  const [flash, setFlash] = useState('');
  const prevPriceRef = useRef(price);
  const prevVolRef = useRef(triggerVol);

  useEffect(() => {
    let triggered = false;
    let dir = '';

    // Biến động giá
    if (prevPriceRef.current !== undefined && prevPriceRef.current !== price && price > 0) {
      dir = price > prevPriceRef.current ? 'flash-up' : 'flash-down';
      triggered = true;
    } 
    // Hoặc khớp lệnh mới (khối lượng thay đổi)
    else if (triggerVol !== null && prevVolRef.current !== undefined && prevVolRef.current !== triggerVol && triggerVol > 0) {
      if (price > refPrice) dir = 'flash-up';
      else if (price < refPrice && price > 0) dir = 'flash-down';
      else dir = 'flash-ref';
      triggered = true;
    }

    if (triggered) {
      setFlash(dir);
      const timer = setTimeout(() => setFlash(''), 600);
      prevPriceRef.current = price;
      prevVolRef.current = triggerVol;
      return () => clearTimeout(timer);
    }

    prevPriceRef.current = price;
    prevVolRef.current = triggerVol;
  }, [price, triggerVol, refPrice]);

  const textColor = getPriceTextColor(price, refPrice, ceiling, floor);

  // Hiệu ứng chớp nền VIVID CHUẨN VPS (Rõ nét, nổi bật tức thì)
  let flashBg = '';
  if (flash === 'flash-up') {
    flashBg = '!bg-emerald-500 !text-black !font-black shadow-[0_0_12px_rgba(16,185,129,0.9)] animate-pulse';
  } else if (flash === 'flash-down') {
    flashBg = '!bg-rose-500 !text-white !font-black shadow-[0_0_12px_rgba(244,63,94,0.9)] animate-pulse';
  } else if (flash === 'flash-ref') {
    flashBg = '!bg-amber-400 !text-black !font-black shadow-[0_0_12px_rgba(245,158,11,0.9)] animate-pulse';
  }

  return (
    <td
      className={`tabular-nums font-mono text-right transition-all duration-300 ease-out select-none bg-transparent ${
        boardTheme === 'TRADITIONAL' ? 'px-2 py-2 border border-slate-800' : 'px-2 py-2 border-b border-slate-800/60'
      } ${textColor} ${flashBg} ${
        isBold ? 'font-black text-[14.5px] sm:text-[15px]' : 'text-[13px] font-semibold'
      } ${className}`}
    >
      {formatPrice(price)}
    </td>
  );
});

/**
 * Ô hiển thị Khối Lượng - Chuẩn Smart Board (Chớp sáng xanh/đỏ rực rỡ khi nhảy lệnh)
 */
export const VolumeCell = React.memo(function VolumeCell({
  volume,
  price,
  refPrice,
  ceiling,
  floor,
  boardTheme = 'MODERN',
  className = '',
  isDim = false,
  isBuySide = null
}) {
  const [flash, setFlash] = useState('');
  const prevVolRef = useRef(volume);

  useEffect(() => {
    if (prevVolRef.current !== undefined && prevVolRef.current !== volume && volume > 0) {
      const type = isBuySide === true ? 'flash-up' : isBuySide === false ? 'flash-down' : 'flash-vol';
      setFlash(type);
      const timer = setTimeout(() => setFlash(''), 600);
      prevVolRef.current = volume;
      return () => clearTimeout(timer);
    }
    prevVolRef.current = volume;
  }, [volume, isBuySide]);

  const textColor = getPriceTextColor(price, refPrice, ceiling, floor);

  let flashBg = '';
  if (flash === 'flash-up') {
    flashBg = '!bg-emerald-500 !text-black !font-black shadow-[0_0_10px_rgba(16,185,129,0.8)]';
  } else if (flash === 'flash-down') {
    flashBg = '!bg-rose-500 !text-white !font-black shadow-[0_0_10px_rgba(244,63,94,0.8)]';
  } else if (flash === 'flash-vol') {
    flashBg = '!bg-primary-500 !text-white !font-black shadow-[0_0_10px_rgba(99,102,241,0.8)]';
  }

  return (
    <td
      className={`tabular-nums font-mono text-right transition-all duration-300 ease-out select-none bg-transparent ${
        boardTheme === 'TRADITIONAL' ? 'px-2 py-2 border border-slate-800' : 'px-2 py-2 border-b border-slate-800/60'
      } ${flashBg} ${
        isDim ? 'text-slate-400 text-[12px] font-normal' : `${textColor} text-[13px] font-semibold`
      } ${className}`}
    >
      {formatNumber(volume)}
    </td>
  );
});

/**
 * Ô hiển thị Biến động +/- và %
 */
export const ChangeCell = React.memo(function ChangeCell({
  change,
  changePercent,
  boardTheme = 'MODERN',
  type = 'change'
}) {
  const isUp = change > 0;
  const isDown = change < 0;

  let colorClass = 'text-amber-300 font-bold';
  if (isUp) colorClass = 'text-emerald-400 font-black';
  else if (isDown) colorClass = 'text-rose-400 font-black';

  const sign = isUp ? '+' : '';
  const displayText = type === 'change'
    ? `${sign}${change.toFixed(2)}`
    : `${sign}${changePercent.toFixed(2)}%`;

  return (
    <td
      className={`tabular-nums font-mono text-right select-none bg-transparent ${
        boardTheme === 'TRADITIONAL' ? 'px-2 py-2 border border-slate-800' : 'px-2 py-2 border-b border-slate-800/60'
      } ${colorClass} text-[13px] font-bold`}
    >
      {displayText}
    </td>
  );
});
