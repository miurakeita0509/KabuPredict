export default function ControlPanel({
  params,
  onParamsChange,
  onStartTraining,
  isTraining,
  hasData,
}) {
  const handleChange = (key, value) => {
    onParamsChange({ ...params, [key]: value });
  };

  const controls = [
    {
      key: 'windowSize',
      label: 'ウィンドウサイズ',
      min: 10,
      max: 60,
      step: 5,
    },
    { key: 'epochs', label: 'エポック数', min: 10, max: 200, step: 10 },
    {
      key: 'learningRate',
      label: '学習率',
      min: 0.0001,
      max: 0.01,
      step: 0.0001,
    },
    { key: 'batchSize', label: 'バッチサイズ', min: 16, max: 64, step: 8 },
    { key: 'predictionDays', label: '予測日数', min: 1, max: 5, step: 1 },
  ];

  return (
    <div className="space-y-3">
      {controls.map(({ key, label, min, max, step }) => (
        <div key={key}>
          <div className="flex justify-between text-sm mb-1">
            <label className="font-medium text-gray-700">{label}</label>
            <span className="text-gray-500">
              {key === 'learningRate' ? params[key].toFixed(4) : params[key]}
            </span>
          </div>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={params[key]}
            onChange={(e) =>
              handleChange(key, parseFloat(e.target.value))
            }
            className="w-full accent-blue-600"
          />
        </div>
      ))}

      <button
        onClick={onStartTraining}
        disabled={isTraining || !hasData}
        className="w-full mt-2 px-4 py-2.5 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        {isTraining ? '学習中...' : '学習開始'}
      </button>
    </div>
  );
}
