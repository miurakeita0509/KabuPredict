const BASE_URL = 'https://finnhub.io/api/v1';

export async function fetchStockCandles(apiKey, stockCode) {
  const symbol = stockCode.includes('.') ? stockCode : `${stockCode}.T`;
  const now = Math.floor(Date.now() / 1000);
  const oneYearAgo = now - 365 * 24 * 60 * 60;

  const url = `${BASE_URL}/stock/candle?symbol=${encodeURIComponent(symbol)}&resolution=D&from=${oneYearAgo}&to=${now}&token=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url);

  if (res.status === 401) {
    throw new Error('APIキーが無効です。正しいキーを入力してください。');
  }
  if (res.status === 429) {
    throw new Error(
      'APIのレート制限に達しました。しばらく待ってから再試行してください。'
    );
  }
  if (!res.ok) {
    throw new Error(`データ取得に失敗しました (HTTP ${res.status})`);
  }

  const data = await res.json();

  if (data.s === 'no_data' || !data.c || data.c.length === 0) {
    throw new Error(
      '銘柄が見つかりません。証券コードを確認してください。'
    );
  }

  return data.t.map((timestamp, i) => ({
    date: formatDate(timestamp),
    open: data.o[i],
    high: data.h[i],
    low: data.l[i],
    close: data.c[i],
    volume: data.v[i],
  }));
}

export async function searchSymbol(apiKey, query) {
  const url = `${BASE_URL}/search?q=${encodeURIComponent(query)}&token=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error('銘柄検索に失敗しました');
  }

  const data = await res.json();
  return (data.result || []).filter((r) =>
    r.symbol.endsWith('.T')
  );
}

function formatDate(unixTimestamp) {
  const d = new Date(unixTimestamp * 1000);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
}
