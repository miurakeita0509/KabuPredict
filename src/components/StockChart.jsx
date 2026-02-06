import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function StockChart({ historicalData, predictions, companyName }) {
  if (!historicalData || historicalData.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8 flex items-center justify-center text-gray-400 min-h-[300px]">
        証券コードを入力してデータを取得してください
      </div>
    );
  }

  const formatYen = (v) => `¥${v.toLocaleString()}`;

  // セクション1: 過去1年分の履歴データ
  const yearChartData = historicalData.map((d) => ({
    date: d.date,
    actual: d.close,
  }));

  // セクション2: 過去1ヶ月（約20営業日）+ 予測
  const DISPLAY_DAYS = 20;
  const recentData = historicalData.slice(-DISPLAY_DAYS);

  const predictionChartData = [
    ...recentData.map((d) => ({
      date: d.date,
      actual: d.close,
      predicted: null,
    })),
  ];

  if (predictions && predictions.length > 0) {
    const lastActual = recentData[recentData.length - 1];
    predictionChartData[predictionChartData.length - 1].predicted = lastActual.close;

    predictions.forEach((p) => {
      predictionChartData.push({
        date: p.date,
        actual: null,
        predicted: p.price,
      });
    });
  }

  return (
    <div className="space-y-6">
      {/* セクション1: 過去1年間の株価推移 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">
          {companyName ? `${companyName} - ` : ''}過去1年間の株価推移
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={yearChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10 }}
              interval="preserveStartEnd"
            />
            <YAxis
              tickFormatter={formatYen}
              tick={{ fontSize: 10 }}
              domain={['auto', 'auto']}
            />
            <Tooltip
              formatter={(value) => [formatYen(value), '終値']}
              labelStyle={{ fontWeight: 600 }}
            />
            <Line
              type="monotone"
              dataKey="actual"
              name="終値"
              stroke="#2563eb"
              dot={false}
              strokeWidth={1.5}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* セクション2: 直近1ヶ月と予測 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">
          直近1ヶ月と予測
        </h3>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={predictionChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11 }}
              interval="preserveStartEnd"
            />
            <YAxis
              tickFormatter={formatYen}
              tick={{ fontSize: 11 }}
              domain={['auto', 'auto']}
            />
            <Tooltip
              formatter={(value) => [formatYen(value)]}
              labelStyle={{ fontWeight: 600 }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="actual"
              name="実績終値"
              stroke="#2563eb"
              dot={false}
              strokeWidth={2}
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="predicted"
              name="予測終値"
              stroke="#dc2626"
              dot={{ r: 3 }}
              strokeWidth={2}
              strokeDasharray="6 3"
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
