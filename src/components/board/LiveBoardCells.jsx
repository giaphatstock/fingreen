import React, { useState, useEffect, useRef } from 'react';
import { formatNumber, formatPrice, getPriceTextColor } from '../../services/liveBoardService';

/**
 * Ô hiển thị Giá
 * CHUẨN SSI / FINTECH: Ở trạng thái tĩnh chỉ có CHỮ ĐỔI MÀU (nền trong suốt),
 * TUYỆT ĐỐI KHÔNG tô nền đỏ/xanh toàn bộ.
 * CHỈ KHI CÓ BIẾN ĐỘNG GIÁ MỚI CHỚP TÔ NỀN Ô ĐÓ VÀ FADE-OUT MỜ DẦN TRONG 550MS!
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

  // Chỉ lấy màu CHỮ theo bước giá (Trần: Tím, Sàn: Xanh lơ, Tăng: Xanh lá, Giảm: Đỏ, TC: Vàng)
  const textColor = getPriceTextColor(price, refPrice, ceiling, floor);

  // CHỈ KHI SỐ THAY ĐỔI MỚI CHỚP NỀN Ô NÀY!
  let flashBg = '';
  if (flash === 'flash-up') {
    flashBg = '!bg-emerald-500/40 text-white ring-1 ring-emerald-400';
  } else if (flash === 'flash-down') {
    flashBg = '!bg-rose-500/40 text-white ring-1 ring-rose-400';
  }

  return (
    <td
      className={`tabular-nums font-mono text-right transition-colors duration-500 ease-out select-none bg-transparent ${
        boardTheme === 'TRADITIONAL' ? 'px-2 py-1 border border-neutral-800' : 'px-2.5 py-1.5'
      } ${textColor} ${flashBg} ${isBold ? 'font-black text-sm' : 'text-xs font-medium'} ${className}`}
    >
      {formatPrice(price)}
    </td>
  );
});

/**
 * Ô hiển thị Khối Lượng
 * Bình thường: nền trong suốt, màu chữ nhẹ nhàng
 * Chỉ khi Khối lượng khớp nhảy số mới chớp sáng ô này
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

  const flashBg = flash ? '!bg-primary-500/30 text-white ring-1 ring-primary-400' : '';

  return (
    <td
      className={`tabular-nums font-mono text-right transition-colors duration-500 ease-out select-none bg-transparent ${
        boardTheme === 'TRADITIONAL' ? 'px-2 py-1 border border-neutral-800' : 'px-2 py-1.5'
      } ${flashBg} ${isDim ? 'text-[var(--text-muted)] text-[11px]' : `${textColor} text-xs font-semibold`} ${className}`}
    >
      {formatNumber(volume)}
    </td>
  );
});

/**
 * Ô hiển thị Biến động +/- và % (Single Source of Truth)
 * Nền trong suốt, chỉ chữ hiển thị màu đỏ/xanh/vàng
 */
export const ChangeCell = React.memo(function ChangeCell({
  change,
  changePercent,
  boardTheme = 'MODERN',
  type = 'change' // 'change' | 'percent'
}) {
  const isUp = change > 0;
  const isDown = change < 0;

  // CHỈ ĐỔI MÀU CHỮ, NỀN TRONG SUỐT (Không bao giờ tô nguyên ô đỏ chói)
  let colorClass = 'text-amber-300';
  if (isUp) colorClass = 'text-emerald-400 font-bold';
  else if (isDown) colorClass = 'text-rose-400 font-bold';

  const sign = isUp ? '+' : '';
  const displayText = type === 'change'
    ? `${sign}${change.toFixed(2)}`
    : `${sign}${changePercent.toFixed(2)}%`;

  return (
    <td
      className={`tabular-nums font-mono text-right select-none bg-transparent ${
        boardTheme === 'TRADITIONAL' ? 'px-2 py-1 border border-neutral-800' : 'px-2.5 py-1.5'
      } ${colorClass} text-xs`}
    >
      {displayText}
    </td>
  );
});
