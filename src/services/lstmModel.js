import * as tf from '@tensorflow/tfjs';
import {
  normalizeMultiFeature,
  denormalizePredictions,
  createMultiFeatureWindows,
  trainTestSplit,
  calculateMultiStepRMSE,
} from '../utils/dataProcessing';
import { addTechnicalIndicators } from '../utils/technicalIndicators';

/**
 * LSTMモデルを構築する（複数特徴量入力・直接マルチステップ出力）
 * @param {number} windowSize - 入力ウィンドウサイズ
 * @param {number} numFeatures - 入力特徴量の数
 * @param {number} predictionDays - 予測日数（出力ユニット数）
 * @param {number} learningRate - 学習率
 */
function buildModel(windowSize, numFeatures, predictionDays, learningRate) {
  const model = tf.sequential();

  // 第1 LSTMレイヤー
  model.add(
    tf.layers.lstm({
      units: 128,
      returnSequences: true,
      inputShape: [windowSize, numFeatures],
    })
  );
  model.add(tf.layers.dropout({ rate: 0.2 }));

  // 第2 LSTMレイヤー
  model.add(tf.layers.lstm({ units: 64, returnSequences: false }));
  model.add(tf.layers.dropout({ rate: 0.2 }));

  // 全結合層
  model.add(tf.layers.dense({ units: 32, activation: 'relu' }));

  // 出力層: predictionDays分の終値を一度に出力
  model.add(tf.layers.dense({ units: predictionDays }));

  model.compile({
    optimizer: tf.train.adam(learningRate),
    loss: 'meanSquaredError',
  });

  return model;
}

/**
 * 学習・評価・予測をまとめて実行する
 * @param {Array} ohlcvData - [{date, open, high, low, close, volume}, ...]
 * @param {Object} params - {windowSize, epochs, learningRate, batchSize, predictionDays}
 * @param {Function} onProgress - 進捗コールバック
 */
export async function trainAndPredict(
  ohlcvData,
  { windowSize, epochs, learningRate, batchSize, predictionDays },
  onProgress
) {
  // 1. テクニカル指標を追加
  const dataWithIndicators = addTechnicalIndicators(ohlcvData);

  // 2. 複数特徴量の正規化
  const { normalized, scalers, features } = normalizeMultiFeature(dataWithIndicators);
  const numFeatures = features.length;

  // 3. ウィンドウ作成（直接マルチステップ出力用）
  const { xs, ys } = createMultiFeatureWindows(normalized, windowSize, predictionDays, features);
  if (xs.length === 0) {
    throw new Error('データが不足しています。ウィンドウサイズまたは予測日数を小さくしてください。');
  }

  // 4. 訓練/テスト分割
  const { trainX, trainY, testX, testY } = trainTestSplit(xs, ys);
  if (trainX.length === 0 || testX.length === 0) {
    throw new Error('データが不足しています。');
  }

  // 5. テンソル化
  const trainXTensor = tf.tensor3d(trainX);
  const trainYTensor = tf.tensor2d(trainY);
  const testXTensor = tf.tensor3d(testX);

  // 6. モデル構築
  const model = buildModel(windowSize, numFeatures, predictionDays, learningRate);

  onProgress({
    currentEpoch: 0,
    totalEpochs: epochs,
    loss: null,
    rmse: null,
    phase: 'モデル学習中...',
  });

  // 6. 学習
  await model.fit(trainXTensor, trainYTensor, {
    epochs,
    batchSize,
    shuffle: true,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        onProgress({
          currentEpoch: epoch + 1,
          totalEpochs: epochs,
          loss: logs.loss,
          rmse: null,
          phase: 'モデル学習中...',
        });
      },
    },
  });

  // 7. テストデータで評価
  onProgress({
    currentEpoch: epochs,
    totalEpochs: epochs,
    loss: null,
    rmse: null,
    phase: 'テストデータ評価中...',
  });

  const testPredNorm = model.predict(testXTensor);
  const testPredArray = testPredNorm.arraySync(); // [samples, predictionDays]

  // 逆正規化してRMSE計算
  const testPredDenorm = testPredArray.map((pred) => denormalizePredictions(pred, scalers));
  const testActualDenorm = testY.map((actual) => denormalizePredictions(actual, scalers));
  const rmse = calculateMultiStepRMSE(testActualDenorm, testPredDenorm);

  // 8. 将来予測（直接マルチステップ出力）
  onProgress({
    currentEpoch: epochs,
    totalEpochs: epochs,
    loss: null,
    rmse,
    phase: '将来予測を計算中...',
  });

  // 最新のwindowSize日分のデータを入力
  const lastWindow = normalized.slice(-windowSize);
  const lastWindowFeatures = lastWindow.map((d) => features.map((f) => d[f]));

  const inputTensor = tf.tensor3d([lastWindowFeatures]);
  const predNorm = model.predict(inputTensor);
  const predArray = predNorm.dataSync(); // [predictionDays]

  // 逆正規化
  const futurePredictions = denormalizePredictions(Array.from(predArray), scalers);

  // クリーンアップ
  trainXTensor.dispose();
  trainYTensor.dispose();
  testXTensor.dispose();
  testPredNorm.dispose();
  inputTensor.dispose();
  predNorm.dispose();
  model.dispose();

  onProgress({
    currentEpoch: epochs,
    totalEpochs: epochs,
    loss: null,
    rmse,
    phase: '完了',
  });

  return { predictions: futurePredictions, rmse };
}
