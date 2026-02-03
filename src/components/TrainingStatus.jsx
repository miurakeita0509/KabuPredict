export default function TrainingStatus({ status }) {
  if (!status) return null;

  const { currentEpoch, totalEpochs, loss, rmse, phase } = status;
  const progress =
    totalEpochs > 0 ? (currentEpoch / totalEpochs) * 100 : 0;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">学習状況</h3>

      <div className="mb-2">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>{phase || '学習中'}</span>
          <span>
            エポック: {currentEpoch} / {totalEpochs}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex gap-4 text-sm">
        {loss != null && (
          <div>
            <span className="text-gray-500">損失: </span>
            <span className="font-mono">{loss.toFixed(6)}</span>
          </div>
        )}
        {rmse != null && (
          <div>
            <span className="text-gray-500">RMSE: </span>
            <span className="font-mono">{rmse.toFixed(1)}円</span>
          </div>
        )}
      </div>
    </div>
  );
}
