const YAHOO_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart';
const CORS_PROXIES = [
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
];

/**
 * Yahoo Finance API 経由で株価データを取得する
 * CORS制限があるため公開プロキシを経由する（複数プロキシにフォールバック）
 */
export async function fetchStockCandles(stockCode) {
  // 空の証券コードをチェック
  if (!stockCode || stockCode.trim() === '') {
    throw new Error('証券コードを入力してください。');
  }

  const symbol = stockCode.includes('.')
    ? stockCode
    : `${stockCode}.T`;

  const yahooUrl = `${YAHOO_BASE}/${encodeURIComponent(symbol)}?range=1y&interval=1d`;

  let res;
  let lastError;
  for (const makeUrl of CORS_PROXIES) {
    const url = makeUrl(yahooUrl);
    try {
      res = await fetch(url);
      if (res.ok) break;
      lastError = new Error(`HTTP ${res.status}`);
      res = null;
    } catch (err) {
      lastError = err;
      res = null;
    }
  }

  if (!res) {
    console.error('Network error:', lastError);
    throw new Error(
      'ネットワークエラーが発生しました。インターネット接続を確認してください。'
    );
  }

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error('銘柄が見つかりません。証券コードを確認してください。');
    }
    if (res.status === 400) {
      throw new Error('無効な証券コードです。正しい形式で入力してください。');
    }
    console.error(`HTTP Error: ${res.status}`);
    throw new Error('データ取得に失敗しました。しばらく時間をおいて再度お試しください。');
  }

  let json;
  try {
    json = await res.json();
  } catch (parseError) {
    console.error('JSON parse error:', parseError);
    throw new Error('データの解析に失敗しました。しばらく時間をおいて再度お試しください。');
  }

  const result = json?.chart?.result?.[0];
  const error = json?.chart?.error;

  if (error) {
    console.error('Yahoo Finance API error:', error);
    if (error.code === 'Not Found') {
      throw new Error('銘柄が見つかりません。証券コードを確認してください。');
    }
    throw new Error('データ取得に失敗しました。証券コードを確認してください。');
  }

  if (!result) {
    throw new Error(
      '銘柄が見つかりません。証券コードを確認してください。'
    );
  }

  const timestamps = result.timestamp;
  const quote = result.indicators?.quote?.[0];

  if (!timestamps || !quote || !quote.close) {
    throw new Error('この銘柄の株価データが取得できませんでした。');
  }

  // null値を除外しつつデータを構築
  const data = [];
  for (let i = 0; i < timestamps.length; i++) {
    if (quote.close[i] != null) {
      data.push({
        date: formatDate(timestamps[i]),
        open: quote.open[i],
        high: quote.high[i],
        low: quote.low[i],
        close: quote.close[i],
        volume: quote.volume[i],
      });
    }
  }

  if (data.length === 0) {
    throw new Error('この銘柄の株価データが取得できませんでした。');
  }

  const companyName =
    result.meta?.shortName || result.meta?.longName || symbol;

  return { data, companyName };
}

function formatDate(unixTimestamp) {
  const d = new Date(unixTimestamp * 1000);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
}
