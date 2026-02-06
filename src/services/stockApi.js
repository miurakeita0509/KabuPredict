const YAHOO_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart';
const CORS_PROXIES = [
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
];

/**
 * CORSプロキシ経由でURLをフェッチ（フォールバック付き）
 */
async function fetchWithProxy(yahooUrl) {
  let res;
  let lastError;
  for (const makeUrl of CORS_PROXIES) {
    const url = makeUrl(yahooUrl);
    try {
      res = await fetch(url);
      if (res.ok) return res;
      lastError = new Error(`HTTP ${res.status}`);
      res = null;
    } catch (err) {
      lastError = err;
      res = null;
    }
  }
  throw lastError || new Error('All proxies failed');
}

/**
 * Yahoo Finance APIから指定期間のデータを取得
 * @param {string} symbol - 銘柄シンボル
 * @param {number} period1 - 開始Unixタイムスタンプ（秒）
 * @param {number} period2 - 終了Unixタイムスタンプ（秒）
 * @returns {Object|null} - パースしたチャンクデータ、またはnull
 */
async function fetchChunk(symbol, period1, period2) {
  const yahooUrl = `${YAHOO_BASE}/${encodeURIComponent(symbol)}?period1=${period1}&period2=${period2}&interval=1d`;

  const res = await fetchWithProxy(yahooUrl);

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error('銘柄が見つかりません。証券コードを確認してください。');
    }
    if (res.status === 400) {
      throw new Error('無効な証券コードです。正しい形式で入力してください。');
    }
    return null;
  }

  let json;
  try {
    json = await res.json();
  } catch {
    console.error('JSON parse error for chunk');
    return null;
  }

  const error = json?.chart?.error;
  if (error) {
    if (error.code === 'Not Found') {
      throw new Error('銘柄が見つかりません。証券コードを確認してください。');
    }
    return null;
  }

  return json?.chart?.result?.[0] || null;
}

/**
 * 3ヶ月ごとのチャンク期間を生成
 * @param {number} months - 取得する月数（デフォルト12）
 * @returns {Array<{period1: number, period2: number}>}
 */
function createChunkPeriods(months = 12) {
  const now = new Date();
  const chunks = [];
  const chunkSize = 3; // 3ヶ月ごと

  for (let i = months; i > 0; i -= chunkSize) {
    const startMonths = i;
    const endMonths = Math.max(i - chunkSize, 0);

    const start = new Date(now);
    start.setMonth(start.getMonth() - startMonths);
    start.setHours(0, 0, 0, 0);

    const end = new Date(now);
    end.setMonth(end.getMonth() - endMonths);
    end.setHours(23, 59, 59, 999);

    chunks.push({
      period1: Math.floor(start.getTime() / 1000),
      period2: Math.floor(end.getTime() / 1000),
    });
  }

  return chunks;
}

/**
 * Yahoo Finance API 経由で株価データを取得する（チャンク分割）
 * 3ヶ月×4回に分割してリクエストし、結合する
 */
export async function fetchStockCandles(stockCode) {
  if (!stockCode || stockCode.trim() === '') {
    throw new Error('証券コードを入力してください。');
  }

  const symbol = stockCode.includes('.')
    ? stockCode
    : `${stockCode}.T`;

  const chunks = createChunkPeriods(12);
  const allData = [];
  let companyName = symbol;
  let successCount = 0;

  // 3ヶ月ごとに順次取得
  for (const { period1, period2 } of chunks) {
    try {
      const result = await fetchChunk(symbol, period1, period2);
      if (!result) continue;

      // 企業名を取得（最初に見つかったものを使用）
      if (successCount === 0) {
        companyName = result.meta?.shortName || result.meta?.longName || symbol;
      }

      const timestamps = result.timestamp;
      const quote = result.indicators?.quote?.[0];

      if (!timestamps || !quote || !quote.close) continue;

      for (let i = 0; i < timestamps.length; i++) {
        if (quote.close[i] != null) {
          allData.push({
            date: formatDate(timestamps[i]),
            timestamp: timestamps[i],
            open: quote.open[i],
            high: quote.high[i],
            low: quote.low[i],
            close: quote.close[i],
            volume: quote.volume[i],
          });
        }
      }

      successCount++;
    } catch (err) {
      // Not Found等の致命的エラーはそのまま投げる
      if (err.message.includes('銘柄が見つかりません') || err.message.includes('無効な証券コード')) {
        throw err;
      }
      console.error('Chunk fetch error:', err.message);
    }
  }

  if (successCount === 0) {
    throw new Error(
      'ネットワークエラーが発生しました。インターネット接続を確認してください。'
    );
  }

  if (allData.length === 0) {
    throw new Error('この銘柄の株価データが取得できませんでした。');
  }

  // タイムスタンプで並び替え、重複を除去
  allData.sort((a, b) => a.timestamp - b.timestamp);
  const seen = new Set();
  const data = allData.filter((d) => {
    if (seen.has(d.date)) return false;
    seen.add(d.date);
    return true;
  }).map(({ timestamp, ...rest }) => rest);

  return { data, companyName };
}

function formatDate(unixTimestamp) {
  const d = new Date(unixTimestamp * 1000);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
}
