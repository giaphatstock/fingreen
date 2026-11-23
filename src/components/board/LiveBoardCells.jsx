import React, { useState, useEffect, useRef } from 'react';
import { formatNumber, formatPrice, getThemePriceStyle, getPriceTextColor } from '../../services/liveBoardService';

/**
 * Ô hiển thị Giá - Chỉ nháy flash tại cấp độ Cell (Cell-level Flashing)
 * Không làm giật hàng, có hiệu ứng fade-out mượt mà 500ms
 */
export const PriceCell = React.memo(function PriceCell({
  price,
  refPrice,
  ceiling,
  floor,
  boardTheme = 'MODERN',
  className = '',
  isBold = false
}) {
  const [flash, setFlash] = useState(''); // 'flash-up' | 'flash-down' | ''
  const prevPriceRef = useRef(price);

  useEffect(() => {
    if (prevPriceRef.current !== undefined && prevPriceRef.current !== price && price > 0) {
      const dir = price > prevPriceRef.current ? 'flash-up' : 'flash-down';
      setFlash(dir);
      const timer = setTimeout(() => setFlash(''), 550);
      prevPriceRef.current = price;
      return () => clearTimeout(timer);
    }
    prevPriceRef.current = price;
  }, [price]);

  const baseStyle = getThemePriceStyle(price, refPrice, ceiling, floor, boardTheme);

  // Hiệu ứng Fade-out khi giá thay đổi
  let flashStyle = '';
  if (flash === 'flash-up') {
    flashStyle = boardTheme === 'TRADITIONAL'
      ? '!bg-emerald-400 !text-white'
      : '!bg-emerald-500/40 !text-emerald-300 ring-1 ring-emerald-400';
  } else if (flash === 'flash-down') {
    flashStyle = boardTheme === 'TRADITIONAL'
      ? '!bg-rose-400 !text-white'
      : '!bg-rose-500/40 !text-rose-300 ring-1 ring-rose-400';
  }

  return (
    <td
      className={`tabular-nums font-mono text-right transition-all duration-500 ease-out select-none ${
        boardTheme === 'TRADITIONAL' ? 'px-2 py-1 border border-neutral-700/60' : 'px-2.5 py-2'
      } ${baseStyle} ${flashStyle} ${isBold ? 'font-black text-sm' : 'text-xs'} ${className}`}
    >
      {formatPrice(price)}
    </td>
  );
});

/**
 * Ô hiển thị Khối Lượng - Chỉ nháy flash ô này khi Khối lượng thay đổi
 */
export const VolumeCell = React.memo(function VolumeCell({
  volume,
  price,
  refPrice,
  ceiling,
  floor,
  boardTheme = 'MODERN',
  className = '',
  isDim = false
}) {
  const [flash, setFlash] = useState(false);
  const prevVolRef = useRef(volume);

  useEffect(() => {
    if (prevVolRef.current !== undefined && prevVolRef.current !== volume && volume > 0) {
      setFlash(true);
      const timer = setTimeout(() => setFlash(false), 550);
      prevVolRef.current = volume;
      return () => clearTimeout(timer);
    }
    prevVolRef.current = volume;
  }, [volume]);

  // Màu chữ tương đồng với bước giá tương ứng
  const textColor = getPriceTextColor(price, refPrice, ceiling, floor);

  const flashBg = flash
    ? (boardTheme === 'TRADITIONAL' ? '!bg-amber-400/80 !text-black' : '!bg-primary-500/30 text-white')
    : '';

  return (
    <td
      className={`tabular-nums font-mono text-right transition-all duration-500 ease-out select-none ${
        boardTheme === 'TRADITIONAL' ? 'px-2 py-1 border border-neutral-700/60 bg-neutral-900/60' : 'px-2 py-2'
      } ${flashBg} ${isDim ? 'text-[var(--text-muted)] text-[11px]' : `${textColor} text-xs font-semibold`} ${className}`}
    >
      {formatNumber(volume)}
    </td>
  );
});

/**
 * Ô hiển thị Biến động +/- và % (Single Source of Truth)
 */
export const ChangeCell = React.memo(function ChangeCell({
  change,
  changePercent,
  boardTheme = 'MODERN',
  type = 'change' // 'change' | 'percent'
}) {
  const isUp = change > 0;
  const isDown = change < 0;

  let colorClass = '';
  if (boardTheme === 'TRADITIONAL') {
    if (isUp) colorClass = 'bg-[#16a34a] text-white font-bold';
    else if (isDown) colorClass = 'bg-[#dc2626] text-white font-bold';
    else colorClass = 'bg-[#eab308] text-black font-extrabold';
  } else {
    if (isUp) colorClass = 'text-emerald-400 bg-emerald-500/15 font-bold';
    else if (isDown) colorClass = 'text-rose-400 bg-rose-500/15 font-bold';
    else colorClass = 'text-amber-300 bg-amber-500/15 font-semibold';
  }

  const sign = isUp ? '+' : '';
  const displayText = type === 'change'
    ? `${sign}${change.toFixed(2)}`
    : `${sign}${changePercent.toFixed(2)}%`;

  return (
    <td
      className={`tabular-nums font-mono text-right select-none ${
        boardTheme === 'TRADITIONAL' ? 'px-2 py-1 border border-neutral-700/60' : 'px-2.5 py-2'
      } ${colorClass} text-xs`}
    >
      {displayText}
    </td>
  );
});
