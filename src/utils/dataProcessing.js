/**
 * Min-Max 正規化（0〜1の範囲に変換）- 単一配列用
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
 * 複数特徴量（OHLCV）の正規化
 * 各特徴量を独立してMin-Max正規化する
 * @param {Array} data - [{open, high, low, close, volume}, ...]
 * @returns {{normalized: Array, scalers: Object}} - 正規化データとスケーラー情報
 */
export function normalizeMultiFeature(data) {
  const features = ['open', 'high', 'low', 'close', 'volume'];
  const scalers = {};

  // 各特徴量のmin/maxを計算
  for (const feat of features) {
    const values = data.map((d) => d[feat]);
    const min = Math.min(...values);
    const max = Math.max(...values);
    scalers[feat] = { min, max, range: max - min || 1 };
  }

  // 正規化
  const normalized = data.map((d) => {
    const row = {};
    for (const feat of features) {
      const { min, range } = scalers[feat];
      row[feat] = (d[feat] - min) / range;
    }
    return row;
  });

  return { normalized, scalers };
}

/**
 * 正規化を逆変換して元のスケールに戻す
 */
export function denormalize(value, min, max) {
  return value * (max - min) + min;
}

/**
 * 複数特徴量の逆正規化（終値用）
 */
export function denormalizeClose(value, scalers) {
  const { min, max } = scalers.close;
  return value * (max - min) + min;
}

/**
 * 複数の予測値を逆正規化
 */
export function denormalizePredictions(predictions, scalers) {
  return predictions.map((v) => denormalizeClose(v, scalers));
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
 * 複数特徴量でスライディングウィンドウを作成（直接マルチステップ出力用）
 * @param {Array} normalizedData - 正規化された[{open, high, low, close, volume}, ...]
 * @param {number} windowSize - 入力ウィンドウサイズ
 * @param {number} predictionDays - 予測日数（出力サイズ）
 * @returns {{xs: Array, ys: Array}} - 入力(OHLCV配列)と出力(終値配列)
 */
export function createMultiFeatureWindows(normalizedData, windowSize, predictionDays) {
  const xs = [];
  const ys = [];
  const features = ['open', 'high', 'low', 'close', 'volume'];

  // 十分なデータがあるか確認
  const maxIndex = normalizedData.length - windowSize - predictionDays;

  for (let i = 0; i <= maxIndex; i++) {
    // 入力: windowSize日分の全特徴量
    const window = [];
    for (let j = i; j < i + windowSize; j++) {
      const dayFeatures = features.map((f) => normalizedData[j][f]);
      window.push(dayFeatures);
    }
    xs.push(window);

    // 出力: 次のpredictionDays日分の終値
    const futureCloses = [];
    for (let j = 0; j < predictionDays; j++) {
      futureCloses.push(normalizedData[i + windowSize + j].close);
    }
    ys.push(futureCloses);
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

/**
 * マルチステップ予測のRMSE計算（2次元配列対応）
 * @param {Array} actualArrays - [[day1, day2, ...], ...]
 * @param {Array} predictedArrays - [[day1, day2, ...], ...]
 */
export function calculateMultiStepRMSE(actualArrays, predictedArrays) {
  let sumSq = 0;
  let count = 0;

  for (let i = 0; i < actualArrays.length; i++) {
    for (let j = 0; j < actualArrays[i].length; j++) {
      sumSq += (actualArrays[i][j] - predictedArrays[i][j]) ** 2;
      count++;
    }
  }

  return Math.sqrt(sumSq / count);
}
