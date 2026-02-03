/**
 * Min-Max 正規化（0〜1の範囲に変換）
 */
export function normalize(data) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  return {
    normalized: data.map((v) => (v - min) / range),
    min,
    max,
  };
}

/**
 * 正規化を逆変換して元のスケールに戻す
 */
export function denormalize(value, min, max) {
  return value * (max - min) + min;
}

/**
 * スライディングウィンドウでデータセットを作成
 * 過去 windowSize 日分の終値 → 翌日の終値
 */
export function createWindows(data, windowSize) {
  const xs = [];
  const ys = [];
  for (let i = 0; i < data.length - windowSize; i++) {
    xs.push(data.slice(i, i + windowSize));
    ys.push(data[i + windowSize]);
  }
  return { xs, ys };
}

/**
 * 訓練/テストデータに分割（trainRatio: 0〜1）
 */
export function trainTestSplit(xs, ys, trainRatio = 0.8) {
  const splitIndex = Math.floor(xs.length * trainRatio);
  return {
    trainX: xs.slice(0, splitIndex),
    trainY: ys.slice(0, splitIndex),
    testX: xs.slice(splitIndex),
    testY: ys.slice(splitIndex),
  };
}

/**
 * RMSE（二乗平均平方根誤差）を計算
 */
export function calculateRMSE(actual, predicted) {
  const n = actual.length;
  const sumSq = actual.reduce(
    (sum, val, i) => sum + (val - predicted[i]) ** 2,
    0
  );
  return Math.sqrt(sumSq / n);
}
