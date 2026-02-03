export default function PredictionTable({ predictions }) {
  if (!predictions || predictions.length === 0) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">予測結果</h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-2 text-gray-500 font-medium">日付</th>
            <th className="text-right py-2 text-gray-500 font-medium">
              予測終値
            </th>
          </tr>
        </thead>
        <tbody>
          {predictions.map((p, i) => (
            <tr key={i} className="border-b border-gray-100 last:border-0">
              <td className="py-2">{p.date}</td>
              <td className="py-2 text-right font-mono">
                &yen;{p.price.toLocaleString('ja-JP', { maximumFractionDigits: 0 })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-gray-400 mt-3">
        ※ 逐次生成方式のため、予測日数が増えるほど誤差が累積します。3営業日以降は参考値としてご利用ください。
      </p>
    </div>
  );
}
