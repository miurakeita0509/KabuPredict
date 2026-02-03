import { useState } from 'react';

export default function SettingsPanel({
  apiKey,
  onApiKeyChange,
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
          Finnhub API キー
        </label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => onApiKeyChange(e.target.value)}
          placeholder="APIキーを入力"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-400 mt-1">
          <a
            href="https://finnhub.io"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            finnhub.io
          </a>
          {' '}で無料取得できます
        </p>
      </div>

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
            disabled={isLoading || !apiKey || !stockCode}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? '取得中...' : 'データ取得'}
          </button>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </div>
      )}
    </div>
  );
}
