import React, { useState, useEffect, useRef } from 'react';
import { formatNumber, formatPrice, getPriceTextColor } from '../../services/liveBoardService';

/**
 * Ô hiển thị Giá - Chuẩn Smart Board (Font 13px - 15px, Phân cấp thị giác rõ ràng)
 * Trạng thái tĩnh: Nền trong suốt, chỉ chữ đổi màu.
 * Khi giá thay đổi: Chớp sáng ô và fade-out trong 550ms.
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
  const [flash, setFlash] = useState('');
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

  const textColor = getPriceTextColor(price, refPrice, ceiling, floor);

  let flashBg = '';
  if (flash === 'flash-up') {
    flashBg = '!bg-emerald-500/40 text-white ring-1 ring-emerald-400';
  } else if (flash === 'flash-down') {
    flashBg = '!bg-rose-500/40 text-white ring-1 ring-rose-400';
  }

  return (
    <td
      className={`tabular-nums font-mono text-right transition-colors duration-500 ease-out select-none bg-transparent ${
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
 * Ô hiển thị Khối Lượng - Chuẩn Smart Board (Font 13px, Số căn lề phải rõ ràng)
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

  const textColor = getPriceTextColor(price, refPrice, ceiling, floor);
  const flashBg = flash ? '!bg-primary-500/30 text-white ring-1 ring-primary-400' : '';

  return (
    <td
      className={`tabular-nums font-mono text-right transition-colors duration-500 ease-out select-none bg-transparent ${
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
 * Ô hiển thị Biến động +/- và % - Chuẩn Smart Board (Font 13px bold, màu sắc tương phản cao)
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
