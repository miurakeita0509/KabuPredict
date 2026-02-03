const STORAGE_KEY = 'kabupredict_watchlist';
const MAX_ITEMS = 20;

function loadWatchlist() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveWatchlist(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function addToWatchlist(code, name) {
  const list = loadWatchlist();
  if (list.some((item) => item.code === code)) return list;
  if (list.length >= MAX_ITEMS) return null;
  const updated = [...list, { code, name }];
  saveWatchlist(updated);
  return updated;
}

export function removeFromWatchlist(code) {
  const list = loadWatchlist();
  const updated = list.filter((item) => item.code !== code);
  saveWatchlist(updated);
  return updated;
}

export function getWatchlist() {
  return loadWatchlist();
}

export function isInWatchlist(code) {
  return loadWatchlist().some((item) => item.code === code);
}

export default function Watchlist({ items, onSelect, onRemove }) {
  if (!items || items.length === 0) {
    return (
      <div className="text-xs text-gray-400">
        銘柄を取得後「監視銘柄に追加」で登録できます
      </div>
    );
  }

  return (
    <ul className="space-y-1 max-h-64 overflow-y-auto">
      {items.map((item) => (
        <li
          key={item.code}
          className="flex items-center justify-between group text-sm hover:bg-gray-50 rounded px-2 py-1.5 cursor-pointer"
          onClick={() => onSelect(item.code)}
        >
          <div className="min-w-0">
            <span className="font-mono text-blue-600">{item.code}</span>
            <span className="text-gray-500 ml-2 truncate text-xs">
              {item.name}
            </span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(item.code);
            }}
            className="text-gray-300 hover:text-red-500 ml-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            &times;
          </button>
        </li>
      ))}
    </ul>
  );
}
