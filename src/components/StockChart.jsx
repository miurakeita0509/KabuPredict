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

export default function StockChart({ historicalData, predictions }) {
  if (!historicalData || historicalData.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8 flex items-center justify-center text-gray-400 min-h-[300px]">
        証券コードを入力してデータを取得してください
      </div>
    );
  }

  const chartData = [
    ...historicalData.map((d) => ({
      date: d.date,
      actual: d.close,
      predicted: null,
    })),
  ];

  if (predictions && predictions.length > 0) {
    const lastActual = historicalData[historicalData.length - 1];
    // Bridge: last actual point also starts the prediction line
    chartData[chartData.length - 1].predicted = lastActual.close;

    predictions.forEach((p) => {
      chartData.push({
        date: p.date,
        actual: null,
        predicted: p.price,
      });
    });
  }

  const formatYen = (v) => `¥${v.toLocaleString()}`;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData}>
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
  );
}
