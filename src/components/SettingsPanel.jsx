export default function SettingsPanel({
  stockCode,
  onStockCodeChange,
  onFetchData,
  isLoading,
  error,
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          証券コード
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={stockCode}
            onChange={(e) => onStockCodeChange(e.target.value)}
            placeholder="例: 7203"
            className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={onFetchData}
            disabled={isLoading || !stockCode}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? '取得中...' : 'データ取得'}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          東証上場銘柄の証券コードを入力してください
        </p>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </div>
      )}
    </div>
  );
}
