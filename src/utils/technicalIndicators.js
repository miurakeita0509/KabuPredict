/**
 * テクニカル指標の計算ユーティリティ
 */

/**
 * 単純移動平均 (SMA)
 * @param {number[]} data - 価格データ
 * @param {number} period - 期間
 */
export function calculateSMA(data, period) {
  const result = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / period);
    }
  }
  return result;
}

/**
 * 指数移動平均 (EMA)
 * @param {number[]} data - 価格データ
 * @param {number} period - 期間
 */
export function calculateEMA(data, period) {
  const result = [];
  const multiplier = 2 / (period + 1);

  // 最初のEMAはSMAで初期化
  let ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period;

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else if (i === period - 1) {
      result.push(ema);
    } else {
      ema = (data[i] - ema) * multiplier + ema;
      result.push(ema);
    }
  }
  return result;
}

/**
 * RSI (Relative Strength Index)
 * @param {number[]} data - 価格データ
 * @param {number} period - 期間（通常14）
 */
export function calculateRSI(data, period = 14) {
  const result = [];
  const gains = [];
  const losses = [];

  // 価格変動を計算
  for (let i = 1; i < data.length; i++) {
    const change = data[i] - data[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }

  // 最初のperiod日分はnull
  for (let i = 0; i < period; i++) {
    result.push(null);
  }

  // 最初の平均
  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

  // RSI計算
  for (let i = period; i < data.length; i++) {
    if (i === period) {
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      result.push(100 - 100 / (1 + rs));
    } else {
      avgGain = (avgGain * (period - 1) + gains[i - 1]) / period;
      avgLoss = (avgLoss * (period - 1) + losses[i - 1]) / period;
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      result.push(100 - 100 / (1 + rs));
    }
  }

  return result;
}

/**
 * MACD (Moving Average Convergence Divergence)
 * @param {number[]} data - 価格データ
 * @param {number} fastPeriod - 短期EMA期間（通常12）
 * @param {number} slowPeriod - 長期EMA期間（通常26）
 * @param {number} signalPeriod - シグナル期間（通常9）
 */
export function calculateMACD(data, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
  const emaFast = calculateEMA(data, fastPeriod);
  const emaSlow = calculateEMA(data, slowPeriod);

  // MACDライン = 短期EMA - 長期EMA
  const macdLine = emaFast.map((fast, i) => {
    if (fast === null || emaSlow[i] === null) return null;
    return fast - emaSlow[i];
  });

  // シグナルライン = MACDラインのEMA
  const validMacd = macdLine.filter((v) => v !== null);
  const signalEma = calculateEMA(validMacd, signalPeriod);

  // シグナルラインを元の長さに合わせる
  const signalLine = [];
  let signalIdx = 0;
  for (let i = 0; i < macdLine.length; i++) {
    if (macdLine[i] === null) {
      signalLine.push(null);
    } else {
      signalLine.push(signalEma[signalIdx] || null);
      signalIdx++;
    }
  }

  // ヒストグラム = MACDライン - シグナルライン
  const histogram = macdLine.map((macd, i) => {
    if (macd === null || signalLine[i] === null) return null;
    return macd - signalLine[i];
  });

  return { macdLine, signalLine, histogram };
}

/**
 * ボリンジャーバンド
 * @param {number[]} data - 価格データ
 * @param {number} period - 期間（通常20）
 * @param {number} stdDev - 標準偏差の倍数（通常2）
 */
export function calculateBollingerBands(data, period = 20, stdDev = 2) {
  const sma = calculateSMA(data, period);
  const upper = [];
  const lower = [];

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      upper.push(null);
      lower.push(null);
    } else {
      const slice = data.slice(i - period + 1, i + 1);
      const mean = sma[i];
      const variance =
        slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / period;
      const std = Math.sqrt(variance);
      upper.push(mean + stdDev * std);
      lower.push(mean - stdDev * std);
    }
  }

  return { middle: sma, upper, lower };
}

/**
 * OHLCVデータにテクニカル指標を追加
 * @param {Array} ohlcvData - [{date, open, high, low, close, volume}, ...]
 */
export function addTechnicalIndicators(ohlcvData) {
  const closes = ohlcvData.map((d) => d.close);

  // 各指標を計算
  const sma5 = calculateSMA(closes, 5);
  const sma20 = calculateSMA(closes, 20);
  const rsi = calculateRSI(closes, 14);
  const { macdLine, signalLine, histogram } = calculateMACD(closes);
  const { upper: bbUpper, lower: bbLower } = calculateBollingerBands(closes, 20, 2);

  // データに指標を追加
  return ohlcvData.map((d, i) => ({
    ...d,
    sma5: sma5[i] ?? closes[i],         // nullの場合は終値で代替
    sma20: sma20[i] ?? closes[i],
    rsi: rsi[i] ?? 50,                   // nullの場合は中立値
    macd: macdLine[i] ?? 0,
    macdSignal: signalLine[i] ?? 0,
    macdHist: histogram[i] ?? 0,
    bbUpper: bbUpper[i] ?? closes[i],
    bbLower: bbLower[i] ?? closes[i],
  }));
}
