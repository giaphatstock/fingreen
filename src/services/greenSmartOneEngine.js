/**
 * GREEN SMART ONE - SMARTADAPTIVE ENGINE
 * Bản chuyển đổi chính xác 100% từ Pine Script Strategy sang JavaScript
 * Dành cho nền tảng FinGreen & TradingView Charting
 */

// ================================================================== //
//                       1. LICENSE VALIDATION                        //
// ================================================================== //
export function validateLicense(key) {
  if (!key || typeof key !== 'string') return false;
  const trimmed = key.trim();
  // Định dạng: PSOL-YYYYMMDD-X (15 ký tự)
  const isFormat = trimmed.length === 15 && trimmed.startsWith('PSOL-') && trimmed[13] === '-';
  if (!isFormat) return false;

  const dateStr = trimmed.substring(5, 13);
  const checkDigitStr = trimmed.substring(14, 15);
  const y = parseInt(dateStr.substring(0, 4), 10);
  const m = parseInt(dateStr.substring(4, 6), 10);
  const d = parseInt(dateStr.substring(6, 8), 10);
  const checkDigit = parseInt(checkDigitStr, 10);

  if (isNaN(y) || isNaN(m) || isNaN(d) || isNaN(checkDigit)) return false;

  let sum = 0;
  for (let i = 0; i < 8; i++) {
    sum += parseInt(dateStr[i], 10) || 0;
  }
  const calcCheck = (sum * 137) % 10;
  const isCheckValid = calcCheck === checkDigit;

  // Hết hạn lúc 23:59:59 của ngày trong key
  const expTimestamp = new Date(y, m - 1, d, 23, 59, 59).getTime();
  const isNotExpired = Date.now() <= expTimestamp;

  return isCheckValid && isNotExpired;
}

// ================================================================== //
//                   2. BASIC MATH & TA HELPERS                       //
// ================================================================== //
export function calculateSMA(data, period) {
  const result = new Array(data.length).fill(null);
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum += data[i];
    if (i >= period) {
      sum -= data[i - period];
    }
    if (i >= period - 1) {
      result[i] = sum / period;
    }
  }
  return result;
}

export function calculateEMA(data, period) {
  const result = new Array(data.length).fill(null);
  const alpha = 2 / (period + 1);
  let prevEma = null;

  for (let i = 0; i < data.length; i++) {
    const val = data[i];
    if (val === null || val === undefined) {
      result[i] = null;
      continue;
    }
    if (prevEma === null) {
      // Tìm trung bình ban đầu nếu đủ period, hoặc lấy điểm đầu tiên
      prevEma = val;
      result[i] = val;
    } else {
      prevEma = alpha * val + (1 - alpha) * prevEma;
      result[i] = prevEma;
    }
  }
  return result;
}

// RMA (Wilder's Smoothing) - chuẩn TradingView ta.atr / ta.rma
export function calculateRMA(data, period) {
  const result = new Array(data.length).fill(null);
  const alpha = 1 / period;
  let sum = 0;
  let count = 0;
  let prevRma = null;

  for (let i = 0; i < data.length; i++) {
    const val = data[i];
    if (val === null || val === undefined) {
      result[i] = null;
      continue;
    }
    if (count < period) {
      sum += val;
      count++;
      if (count === period) {
        prevRma = sum / period;
        result[i] = prevRma;
      }
    } else {
      prevRma = alpha * val + (1 - alpha) * prevRma;
      result[i] = prevRma;
    }
  }
  return result;
}

// True Range: max(high - low, abs(high - prevClose), abs(low - prevClose))
export function calculateTR(bars) {
  const tr = new Array(bars.length).fill(0);
  for (let i = 0; i < bars.length; i++) {
    const { high, low } = bars[i];
    if (i === 0) {
      tr[i] = high - low;
    } else {
      const prevClose = bars[i - 1].close;
      tr[i] = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
    }
  }
  return tr;
}

export function calculateATR(bars, period) {
  const tr = calculateTR(bars);
  return calculateRMA(tr, period);
}

export function calculateRSI(closes, period = 14) {
  const rsi = new Array(closes.length).fill(null);
  const gains = new Array(closes.length).fill(0);
  const losses = new Array(closes.length).fill(0);

  for (let i = 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    gains[i] = diff > 0 ? diff : 0;
    losses[i] = diff < 0 ? -diff : 0;
  }

  const rmaGain = calculateRMA(gains, period);
  const rmaLoss = calculateRMA(losses, period);

  for (let i = 0; i < closes.length; i++) {
    const g = rmaGain[i];
    const l = rmaLoss[i];
    if (g === null || l === null) continue;
    if (l === 0) {
      rsi[i] = 100;
    } else {
      const rs = g / l;
      rsi[i] = 100 - (100 / (1 + rs));
    }
  }
  return rsi;
}

// ================================================================== //
//        3. MAIN GREEN SMART ONE SMARTADAPTIVE ENGINE                //
// ================================================================== //
export function computeGreenSmartOne(bars, userConfig = {}) {
  const config = {
    licenseKey: 'PSOL-20261231-9',
    enSignals: true,
    sensManual: 2.0,
    smartAdaptive: true,
    learnRate: 0.90,
    evalBars: 10,
    recalibBars: 10,
    warmupBars: 20,
    enrev: true,       // Diamond Signals
    enrevser: true,    // Reversal QQE Signals
    RSI_Period: 14,
    SF: 5,
    KQE: 4.238,
    ThreshHold: 10,
    ensr: true,        // Support & Resistance Lines
    ensra: true,       // S&R Zones
    enCloud: true,     // Trend Ribbon
    volBands: true,    // Volatility Bands
    mal: false,        // Moving average line
    mals: 80,
    enLong: true,
    enShort: true,
    waitBars: 2,
    validBars: 10,
    useSL: true,
    ...userConfig
  };

  const isLicActive = validateLicense(config.licenseKey);
  const N = bars.length;
  if (N < 20) {
    return {
      isLicActive,
      bars,
      candSensTable: [],
      effSens: config.sensManual,
      bestSens: config.sensManual,
      recalibCount: 0,
      signals: [],
      trades: [],
      stats: { totalTrades: 0, winRate: 0, wins: 0, losses: 0 }
    };
  }

  const closes = bars.map(b => b.close);
  const highs = bars.map(b => b.high);
  const lows = bars.map(b => b.low);
  const opens = bars.map(b => b.open);
  const tr = calculateTR(bars);
  const atr11 = calculateRMA(tr, 11);
  const atr14 = calculateRMA(tr, 14);

  // ---------------------------------------------------------------- //
  // A. SmartAdaptive Multi-Sensitivity Evaluator
  // ---------------------------------------------------------------- //
  const candSens = [1.3, 1.6, 2.0, 2.4, 2.8, 3.2, 3.8];
  const nCand = candSens.length;

  const cPrevUp = new Array(nCand).fill(null);
  const cPrevDn = new Array(nCand).fill(null);
  const cPrevSt = new Array(nCand).fill(null);
  const cPrevClose = new Array(nCand).fill(null);
  const cPrevDir = new Array(nCand).fill(1);

  const cWins = new Array(nCand).fill(0);
  const cLosses = new Array(nCand).fill(0);
  const cPendDir = new Array(nCand).fill(0);
  const cPendBar = new Array(nCand).fill(0);
  const cPendPrice = new Array(nCand).fill(0.0);

  let bestSens = 1.6;
  let bestScore = 0.0;
  let bestIdx = 1;
  let recalibCnt = 0;

  // Mảng lưu lịch sử effSens từng nến
  const effSensArr = new Array(N).fill(config.sensManual);

  for (let barIdx = 0; barIdx < N; barIdx++) {
    const curClose = closes[barIdx];
    const curAtr11 = atr11[barIdx];

    if (curAtr11 !== null) {
      for (let i = 0; i < nCand; i++) {
        const c = candSens[i];
        const up_new = curClose + c * curAtr11;
        const dn_new = curClose - c * curAtr11;

        const pUp = cPrevUp[i];
        const pDn = cPrevDn[i];
        const pSt = cPrevSt[i];
        const pCl = cPrevClose[i];

        const up_cur = (pUp === null) ? up_new : (up_new < pUp || (pCl !== null && pCl > pUp) ? up_new : pUp);
        const dn_cur = (pDn === null) ? dn_new : (dn_new > pDn || (pCl !== null && pCl < pDn) ? dn_new : pDn);

        let dir_new = 0;
        if (pSt === null) {
          dir_new = 1;
        } else if (cPrevDir[i] === 1) {
          dir_new = curClose > up_cur ? -1 : 1;
        } else {
          dir_new = curClose < dn_cur ? 1 : -1;
        }

        const st_new = dir_new === -1 ? dn_cur : up_cur;
        const bull_v = pSt !== null && pCl !== null && pCl <= pSt && curClose > st_new;
        const bear_v = pSt !== null && pCl !== null && pCl >= pSt && curClose < st_new;

        cPrevUp[i] = up_cur;
        cPrevDn[i] = dn_cur;
        cPrevSt[i] = st_new;
        cPrevClose[i] = curClose;
        cPrevDir[i] = dir_new;

        // Quản lý lệnh ảo
        const pdir = cPendDir[i];
        if (pdir === 0) {
          if (bull_v) {
            cPendDir[i] = 1;
            cPendBar[i] = barIdx;
            cPendPrice[i] = curClose;
          } else if (bear_v) {
            cPendDir[i] = -1;
            cPendBar[i] = barIdx;
            cPendPrice[i] = curClose;
          }
        } else {
          const pbar = cPendBar[i];
          if ((barIdx - pbar) >= config.evalBars) {
            const ep = cPendPrice[i];
            const isWin = (pdir === 1 && curClose > ep) || (pdir === -1 && curClose < ep);
            if (isWin) {
              cWins[i]++;
            } else {
              cLosses[i]++;
            }
            cPendDir[i] = 0;
            cPendBar[i] = 0;
          }
        }
      }

      // Recalibrate
      if (barIdx > config.warmupBars && barIdx % config.recalibBars === 0) {
        let bs = -1.0;
        let bi = 0;
        for (let i = 0; i < nCand; i++) {
          const w = cWins[i];
          const l = cLosses[i];
          const tot = w + l;
          const wr = tot > 0 ? w / tot : 0.0;
          const sc = wr * Math.sqrt(tot);
          if (sc > bs) {
            bs = sc;
            bi = i;
          }
        }
        if (bs > 0) {
          bestSens = candSens[bi];
          bestScore = bs;
          bestIdx = bi;
          recalibCnt++;
          for (let i = 0; i < nCand; i++) {
            cWins[i] = Math.floor(cWins[i] * config.learnRate);
            cLosses[i] = Math.floor(cLosses[i] * config.learnRate);
          }
        }
      }
    }

    effSensArr[barIdx] = config.smartAdaptive ? bestSens : config.sensManual;
  }

  const finalEffSens = config.smartAdaptive ? bestSens : config.sensManual;

  // ---------------------------------------------------------------- //
  // B. Main SuperTrend (theo effSens)
  // ---------------------------------------------------------------- //
  const supertrend = new Array(N).fill(null);
  const direction = new Array(N).fill(1); // 1 = bear, -1 = bull
  const barColors = new Array(N).fill(null);

  let pDn_main = null;
  let pUp_main = null;
  let pSt_main = null;
  let prevDir_main = 1;

  for (let i = 0; i < N; i++) {
    const curAtr = atr11[i];
    const cClose = closes[i];
    const sens = effSensArr[i];

    if (curAtr === null) {
      direction[i] = 1;
      supertrend[i] = cClose;
      continue;
    }

    const up_raw = cClose + sens * curAtr;
    const dn_raw = cClose - sens * curAtr;

    const prevClose = i > 0 ? closes[i - 1] : cClose;
    let dn = (pDn_main === null || dn_raw > pDn_main || prevClose < pDn_main) ? dn_raw : pDn_main;
    let up = (pUp_main === null || up_raw < pUp_main || prevClose > pUp_main) ? up_raw : pUp_main;

    let dir = 1;
    if (i === 0 || atr11[i - 1] === null) {
      dir = 1;
    } else if (prevDir_main === 1) {
      dir = cClose > up ? -1 : 1;
    } else {
      dir = cClose < dn ? 1 : -1;
    }

    const st = dir === -1 ? dn : up;
    pDn_main = dn;
    pUp_main = up;
    pSt_main = st;
    prevDir_main = dir;

    supertrend[i] = st;
    direction[i] = dir;

    // Màu nến theo Pine Script:
    // bullST: #e7dc3b (Vàng chanh), bearST: #da1d15 (Đỏ thắm)
    const isBullST = dir === -1;
    barColors[i] = isLicActive ? (isBullST ? '#e7dc3b' : '#da1d15') : null;
  }

  // ---------------------------------------------------------------- //
  // C. Cloud (Trend Ribbon: SMA 7 & SMA 13)
  // ---------------------------------------------------------------- //
  const sma7 = calculateSMA(closes, 7);
  const sma13 = calculateSMA(closes, 13);
  const cloudFill = new Array(N).fill(null);
  for (let i = 0; i < N; i++) {
    if (sma7[i] !== null && sma13[i] !== null) {
      // candle > reach ? #00DBFF (Cyan neon) : #E93E63 (Đỏ hồng)
      cloudFill[i] = sma7[i] > sma13[i] ? '#00DBFF' : '#E93E63';
    }
  }

  // ---------------------------------------------------------------- //
  // D. Volatility Bands (Keltner Channels)
  // ---------------------------------------------------------------- //
  const kcBasis = calculateEMA(closes, 35);
  const kcSpan = calculateEMA(tr, 35);
  const upperKC1 = new Array(N).fill(null);
  const lowerKC1 = new Array(N).fill(null);
  const upperKC2 = new Array(N).fill(null);
  const lowerKC2 = new Array(N).fill(null);
  const upperKC3 = new Array(N).fill(null);
  const lowerKC3 = new Array(N).fill(null);

  for (let i = 0; i < N; i++) {
    const b = kcBasis[i];
    const s = kcSpan[i];
    if (b !== null && s !== null) {
      upperKC1[i] = b + s * 4.5;
      lowerKC1[i] = b - s * 4.5;
      upperKC2[i] = b + s * 6.4;
      lowerKC2[i] = b - s * 6.4;
      upperKC3[i] = b + s * 8.3;
      lowerKC3[i] = b - s * 8.3;
    }
  }

  // ---------------------------------------------------------------- //
  // E. Trend Moving Average Line (EMA 23, 200, 80)
  // ---------------------------------------------------------------- //
  const ema23 = calculateEMA(closes, 23);
  const ema200 = calculateEMA(closes, 200);
  const ema80 = calculateEMA(closes, config.mals || 80);
  const malColors = new Array(N).fill(null);
  for (let i = 0; i < N; i++) {
    if (ema23[i] !== null && ema200[i] !== null) {
      malColors[i] = ema23[i] > ema200[i] ? '#00DBFF' : '#E93E63';
    }
  }

  // ---------------------------------------------------------------- //
  // F. Diamond Signals (Gắn với SmartAdaptive)
  // ---------------------------------------------------------------- //
  const convLen = 5;
  const baseLen = 2;
  const lag2Len = 5;
  const disp = 6;

  function donchian(len, idx) {
    if (idx < len - 1) return null;
    let minL = Infinity;
    let maxH = -Infinity;
    for (let k = idx - len + 1; k <= idx; k++) {
      if (lows[k] < minL) minL = lows[k];
      if (highs[k] > maxH) maxH = highs[k];
    }
    return (minL + maxH) / 2;
  }

  const diamondUp = new Array(N).fill(false);
  const diamondDown = new Array(N).fill(false);

  // Buffer lưu lead1 & lead2
  const lead1Arr = new Array(N).fill(null);
  const lead2Arr = new Array(N).fill(null);

  for (let i = 0; i < N; i++) {
    const cLine = donchian(convLen, i);
    const bLine = donchian(baseLen, i);
    const l2 = donchian(lag2Len, i);

    if (cLine !== null && bLine !== null) {
      lead1Arr[i] = (cLine + bLine) / 2;
    }
    lead2Arr[i] = l2;
  }

  for (let i = disp; i < N; i++) {
    const lead1 = lead1Arr[i - (disp - 1)];
    const lead2 = lead2Arr[i - (disp - 1)];
    const prevLead2 = lead2Arr[i - disp];

    if (lead1 === null || lead2 === null || prevLead2 === null) continue;

    const curClose = closes[i];
    const prevClose = closes[i - 1];
    const curOpen = opens[i];
    const isGreenCandle = curClose > curOpen;
    const isRedCandle = curClose < curOpen;

    const crossup = prevClose <= prevLead2 && curClose > lead2;
    const crossdn = prevClose >= prevLead2 && curClose < lead2;

    const bullST = direction[i] === -1;
    const bearST = direction[i] === 1;
    const adaptFilterUp = !config.smartAdaptive || bullST;
    const adaptFilterDn = !config.smartAdaptive || bearST;

    if (lead2 > lead1 && isGreenCandle && crossup && adaptFilterUp) {
      diamondUp[i] = true;
    }

    if (lead2 < lead1 && isRedCandle && crossdn && adaptFilterDn) {
      diamondDown[i] = true;
    }
  }

  // ---------------------------------------------------------------- //
  // G. QQE Reversal Signals (❖ - Kim Cương Cấp 2 Màu Da)
  // ---------------------------------------------------------------- //
  const rsi = calculateRSI(closes, config.RSI_Period || 14);
  const rsiMa = calculateEMA(rsi, config.SF || 5);
  const wildersPeriod = (config.RSI_Period || 14) * 2 - 1; // 27

  const atrRsi = new Array(N).fill(0);
  for (let i = 1; i < N; i++) {
    if (rsiMa[i] !== null && rsiMa[i - 1] !== null) {
      atrRsi[i] = Math.abs(rsiMa[i - 1] - rsiMa[i]);
    }
  }
  const maAtrRsi = calculateEMA(atrRsi, wildersPeriod);
  const dar = calculateEMA(maAtrRsi, wildersPeriod);

  const qqeLong = new Array(N).fill(false);
  const qqeShort = new Array(N).fill(false);

  const qqeLongbandArr = new Array(N).fill(0.0);
  const qqeShortbandArr = new Array(N).fill(0.0);
  const qqeTrendArr = new Array(N).fill(0);
  const qqeExlong = new Array(N).fill(0);
  const qqeExshort = new Array(N).fill(0);

  for (let i = 1; i < N; i++) {
    const rIdx = rsiMa[i];
    const prevRIdx = rsiMa[i - 1];
    if (rIdx === null || prevRIdx === null || dar[i] === null) continue;

    const deltaFast = dar[i] * (config.KQE || 4.238);
    const newshortband = rIdx + deltaFast;
    const newlongband = rIdx - deltaFast;

    const pLong = qqeLongbandArr[i - 1];
    const pShort = qqeShortbandArr[i - 1];

    if (prevRIdx > pLong && rIdx > pLong) {
      qqeLongbandArr[i] = Math.max(pLong, newlongband);
    } else {
      qqeLongbandArr[i] = newlongband;
    }

    if (prevRIdx < pShort && rIdx < pShort) {
      qqeShortbandArr[i] = Math.min(pShort, newshortband);
    } else {
      qqeShortbandArr[i] = newshortband;
    }

    // cross_1 = ta.cross(longband[1], RSIndex)
    const x_curr = qqeLongbandArr[i - 1];
    const x_prev = i >= 2 ? qqeLongbandArr[i - 2] : x_curr;
    const y_curr = rIdx;
    const y_prev = prevRIdx;
    const cross_1 = (x_prev <= y_prev && x_curr > y_curr) || (x_prev >= y_prev && x_curr < y_curr);

    // cross(RSIndex, shortband[1])
    const sx_curr = qqeShortbandArr[i - 1];
    const sx_prev = i >= 2 ? qqeShortbandArr[i - 2] : sx_curr;
    const cross_short = (y_prev <= sx_prev && y_curr > sx_curr) || (y_prev >= sx_prev && y_curr < sx_curr);

    if (cross_short) {
      qqeTrendArr[i] = 1;
    } else if (cross_1) {
      qqeTrendArr[i] = -1;
    } else {
      qqeTrendArr[i] = qqeTrendArr[i - 1] !== 0 ? qqeTrendArr[i - 1] : 1;
    }

    const fastAtrRsiTL = qqeTrendArr[i] === 1 ? qqeLongbandArr[i] : qqeShortbandArr[i];

    if (fastAtrRsiTL < rIdx) {
      qqeExlong[i] = qqeExlong[i - 1] + 1;
      qqeExshort[i] = 0;
    } else if (fastAtrRsiTL > rIdx) {
      qqeExshort[i] = qqeExshort[i - 1] + 1;
      qqeExlong[i] = 0;
    } else {
      qqeExlong[i] = 0;
      qqeExshort[i] = 0;
    }

    if (qqeExlong[i] === 1) {
      qqeLong[i] = true;
    }
    if (qqeExshort[i] === 1) {
      qqeShort[i] = true;
    }
  }

  // ---------------------------------------------------------------- //
  // H. Support & Resistance Pivots (Levels 1 to 8)
  // ---------------------------------------------------------------- //
  const left = 50;
  const right = 25;
  const quick_right = 5;

  let level1 = null, level2 = null, level3 = null, level4 = null;
  let level5 = null, level6 = null, level7 = null, level8 = null;

  const srLevels = [];

  for (let i = left + right; i < N; i++) {
    // Quick Pivot
    const qCandidateIdx = i - quick_right;
    if (qCandidateIdx >= left) {
      let isQHigh = true;
      let isQLow = true;
      const qH = highs[qCandidateIdx];
      const qL = lows[qCandidateIdx];
      for (let k = qCandidateIdx - left; k <= i; k++) {
        if (k !== qCandidateIdx) {
          if (highs[k] >= qH) isQHigh = false;
          if (lows[k] <= qL) isQLow = false;
        }
      }
      if (isQHigh) level1 = qH;
      if (isQLow) level2 = qL;
    }

    // Normal Pivot
    const candidateIdx = i - right;
    if (candidateIdx >= left) {
      let isHigh = true;
      let isLow = true;
      const cH = highs[candidateIdx];
      const cL = lows[candidateIdx];
      for (let k = candidateIdx - left; k <= i; k++) {
        if (k !== candidateIdx) {
          if (highs[k] >= cH) isHigh = false;
          if (lows[k] <= cL) isLow = false;
        }
      }
      if (isHigh) {
        level7 = level5;
        level5 = level3;
        level3 = cH;
      }
      if (isLow) {
        level8 = level6;
        level6 = level4;
        level4 = cL;
      }
    }
  }

  const latestClose = closes[N - 1];
  const activeLevels = [
    { name: 'R1 (Quick High)', val: level1, isBull: latestClose >= level1 },
    { name: 'S1 (Quick Low)',  val: level2, isBull: latestClose >= level2 },
    { name: 'R2 (Major Pivot High 1)', val: level3, isBull: latestClose >= level3 },
    { name: 'S2 (Major Pivot Low 1)',  val: level4, isBull: latestClose >= level4 },
    { name: 'R3 (Major Pivot High 2)', val: level5, isBull: latestClose >= level5 },
    { name: 'S3 (Major Pivot Low 2)',  val: level6, isBull: latestClose >= level6 },
  ].filter(l => l.val !== null);

  // ---------------------------------------------------------------- //
  // I. Strategy Execution Simulator (Backtester)
  // ---------------------------------------------------------------- //
  const signals = [];
  const trades = [];

  let pendLongClose = null;
  let pendLongLow = null;
  let pendLongBar = null;

  let pendShortClose = null;
  let pendShortHigh = null;
  let pendShortBar = null;

  let activeSL_Long = null;
  let activeSL_Short = null;

  let currentPosition = 0; // 1 = long, -1 = short, 0 = none
  let currentEntryPrice = 0;
  let currentEntryBar = 0;

  for (let i = 0; i < N; i++) {
    const curClose = closes[i];
    const prevClose = i > 0 ? closes[i - 1] : curClose;
    const curLow = lows[i];
    const curHigh = highs[i];
    const isBullBar = direction[i] === -1;

    // Ghi nhớ nến kim cương
    if (diamondUp[i]) {
      pendLongClose = curClose;
      pendLongLow = curLow;
      pendLongBar = i;
    }
    if (diamondDown[i]) {
      pendShortClose = curClose;
      pendShortHigh = curHigh;
      pendShortBar = i;
    }

    // Hủy setup hết hạn
    if (pendLongBar !== null && (i - pendLongBar) > config.validBars) {
      pendLongBar = null;
      pendLongClose = null;
      pendLongLow = null;
    }
    if (pendShortBar !== null && (i - pendShortBar) > config.validBars) {
      pendShortBar = null;
      pendShortClose = null;
      pendShortHigh = null;
    }

    const longReady = pendLongBar !== null && (i - pendLongBar) >= config.waitBars;
    const shortReady = pendShortBar !== null && (i - pendShortBar) >= config.waitBars;

    // Vào lệnh khi nến sau đóng trên/dưới nến kim cương A và màu nến SuperTrend ủng hộ
    const longTrigger = longReady && currentPosition === 0 && curClose > pendLongClose && isBullBar;
    const shortTrigger = shortReady && currentPosition === 0 && curClose < pendShortClose && !isBullBar;

    // Thoát vị thế (Exit & SL)
    if (currentPosition > 0) {
      // SL: Nếu giá chạm hoặc nến đóng dưới đáy nến kim cương A
      if (config.useSL && activeSL_Long !== null && (curLow <= activeSL_Long || curClose < activeSL_Long)) {
        trades.push({
          type: 'Long',
          entryBar: currentEntryBar,
          entryPrice: currentEntryPrice,
          exitBar: i,
          exitPrice: Math.min(curClose, activeSL_Long),
          reason: 'SL',
          pnlPct: ((Math.min(curClose, activeSL_Long) - currentEntryPrice) / currentEntryPrice) * 100,
          time: bars[i].time
        });
        currentPosition = 0;
        activeSL_Long = null;
      } else if (!isBullBar) {
        // ColorFlip
        trades.push({
          type: 'Long',
          entryBar: currentEntryBar,
          entryPrice: currentEntryPrice,
          exitBar: i,
          exitPrice: curClose,
          reason: 'ColorFlip',
          pnlPct: ((curClose - currentEntryPrice) / currentEntryPrice) * 100,
          time: bars[i].time
        });
        currentPosition = 0;
        activeSL_Long = null;
      }
    } else if (currentPosition < 0) {
      // SL: Nếu giá chạm hoặc nến đóng trên đỉnh nến kim cương A
      if (config.useSL && activeSL_Short !== null && (curHigh >= activeSL_Short || curClose > activeSL_Short)) {
        trades.push({
          type: 'Short',
          entryBar: currentEntryBar,
          entryPrice: currentEntryPrice,
          exitBar: i,
          exitPrice: Math.max(curClose, activeSL_Short),
          reason: 'SL',
          pnlPct: ((currentEntryPrice - Math.max(curClose, activeSL_Short)) / currentEntryPrice) * 100,
          time: bars[i].time
        });
        currentPosition = 0;
        activeSL_Short = null;
      } else if (isBullBar) {
        // ColorFlip
        trades.push({
          type: 'Short',
          entryBar: currentEntryBar,
          entryPrice: currentEntryPrice,
          exitBar: i,
          exitPrice: curClose,
          reason: 'ColorFlip',
          pnlPct: ((currentEntryPrice - curClose) / currentEntryPrice) * 100,
          time: bars[i].time
        });
        currentPosition = 0;
        activeSL_Short = null;
      }
    }

    // Vào lệnh
    if (isLicActive && config.enLong && longTrigger) {
      currentPosition = 1;
      currentEntryPrice = curClose;
      currentEntryBar = i;
      activeSL_Long = pendLongLow;
      signals.push({
        barIndex: i,
        time: bars[i].time,
        type: 'BUY',
        text: 'MUA (Diamond L)',
        price: curClose,
        sl: pendLongLow
      });
      pendLongBar = null;
      pendLongClose = null;
      pendLongLow = null;
    } else if (isLicActive && config.enShort && shortTrigger) {
      currentPosition = -1;
      currentEntryPrice = curClose;
      currentEntryBar = i;
      activeSL_Short = pendShortHigh;
      signals.push({
        barIndex: i,
        time: bars[i].time,
        type: 'SELL',
        text: 'BÁN (Diamond S)',
        price: curClose,
        sl: pendShortHigh
      });
      pendShortBar = null;
      pendShortClose = null;
      pendShortHigh = null;
    }
  }

  // Tính thống kê Backtest
  let wins = 0;
  let losses = 0;
  let totalPnl = 0;
  trades.forEach(t => {
    if (t.pnlPct > 0) wins++;
    else losses++;
    totalPnl += t.pnlPct;
  });
  const totalTrades = trades.length;
  const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;

  // Bảng Candidate Sensitivities cho HUD table
  const candSensTable = candSens.map((sens, idx) => {
    const w = cWins[idx];
    const l = cLosses[idx];
    const tot = w + l;
    const wr = tot > 0 ? (w / tot) * 100 : 0;
    const sc = tot > 0 ? (w / tot) * Math.sqrt(tot) : 0;
    return {
      idx: idx + 1,
      sens,
      wins: w,
      losses: l,
      winRate: wr.toFixed(1),
      score: sc.toFixed(2),
      isBest: idx === bestIdx
    };
  });

  return {
    isLicActive,
    finalEffSens,
    bestSens,
    bestIdx,
    recalibCnt,
    candSensTable,
    supertrend,
    direction,
    barColors,
    cloud: { sma7, sma13, cloudFill },
    bands: { upperKC1, lowerKC1, upperKC2, lowerKC2, upperKC3, lowerKC3, kcBasis },
    movingAverage: { ema80, malColors },
    diamonds: { up: diamondUp, down: diamondDown },
    qqe: { long: qqeLong, short: qqeShort, atr14 },
    activeLevels,
    signals,
    trades,
    stats: {
      totalTrades,
      wins,
      losses,
      winRate: winRate.toFixed(1),
      totalPnl: totalPnl.toFixed(2),
      currentPosition: currentPosition === 1 ? 'LONG' : currentPosition === -1 ? 'SHORT' : 'TIỀN MẶT',
      currentEntryPrice
    }
  };
}
