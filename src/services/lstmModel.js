import * as tf from '@tensorflow/tfjs';
import {
  normalize,
  denormalize,
  createWindows,
  trainTestSplit,
  calculateRMSE,
} from '../utils/dataProcessing';

/**
 * LSTMモデルを構築する
 */
function buildModel(windowSize, learningRate) {
  const model = tf.sequential();

  model.add(
    tf.layers.lstm({
      units: 50,
      returnSequences: true,
      inputShape: [windowSize, 1],
    })
  );
  model.add(tf.layers.dropout({ rate: 0.2 }));

  model.add(tf.layers.lstm({ units: 50, returnSequences: false }));
  model.add(tf.layers.dropout({ rate: 0.2 }));

  model.add(tf.layers.dense({ units: 1 }));

  model.compile({
    optimizer: tf.train.adam(learningRate),
    loss: 'meanSquaredError',
  });

  return model;
}

/**
 * 学習・評価・予測をまとめて実行する
 * onProgress: ({ currentEpoch, totalEpochs, loss, rmse, phase }) => void
 */
export async function trainAndPredict(
  closePrices,
  { windowSize, epochs, learningRate, batchSize, predictionDays },
  onProgress
) {
  // 1. 正規化
  const { normalized, min, max } = normalize(closePrices);

  // 2. ウィンドウ作成
  const { xs, ys } = createWindows(normalized, windowSize);
  if (xs.length === 0) {
    throw new Error('データが不足しています。ウィンドウサイズを小さくしてください。');
  }

  // 3. 訓練/テスト分割
  const { trainX, trainY, testX, testY } = trainTestSplit(xs, ys);
  if (trainX.length === 0 || testX.length === 0) {
    throw new Error('データが不足しています。');
  }

  // 4. テンソル化 (shape: [samples, windowSize, 1])
  const trainXTensor = tf.tensor3d(
    trainX.map((w) => w.map((v) => [v]))
  );
  const trainYTensor = tf.tensor2d(trainY.map((v) => [v]));
  const testXTensor = tf.tensor3d(
    testX.map((w) => w.map((v) => [v]))
  );

  // 5. モデル構築
  const model = buildModel(windowSize, learningRate);

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
  const testPredArray = Array.from(testPredNorm.dataSync());
  const testPredDenorm = testPredArray.map((v) => denormalize(v, min, max));
  const testActualDenorm = testY.map((v) => denormalize(v, min, max));
  const rmse = calculateRMSE(testActualDenorm, testPredDenorm);

  // 8. 逐次予測（1〜predictionDays営業日先）
  onProgress({
    currentEpoch: epochs,
    totalEpochs: epochs,
    loss: null,
    rmse,
    phase: '将来予測を計算中...',
  });

  const lastWindow = normalized.slice(-windowSize);
  const futurePredictions = [];

  let currentWindow = [...lastWindow];
  for (let i = 0; i < predictionDays; i++) {
    const inputTensor = tf.tensor3d([currentWindow.map((v) => [v])]);
    const predNorm = model.predict(inputTensor);
    const predValue = predNorm.dataSync()[0];
    futurePredictions.push(denormalize(predValue, min, max));

    // ウィンドウを1つスライド: 先頭を削除し、予測値を末尾に追加
    currentWindow = [...currentWindow.slice(1), predValue];

    inputTensor.dispose();
    predNorm.dispose();
  }

  // クリーンアップ
  trainXTensor.dispose();
  trainYTensor.dispose();
  testXTensor.dispose();
  testPredNorm.dispose();
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
