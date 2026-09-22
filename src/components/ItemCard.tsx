import type { StockItem } from "../types";
import { EXPIRY_BADGE_CLASS, formatExpiryText, getExpiryLevel } from "../lib/expiry";

interface Props {
  item: StockItem;
  onToggleUsed: (used: boolean) => void;
  onDelete: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
}

export function ItemCard({ item, onToggleUsed, onDelete, onEdit, onDuplicate }: Props) {
  const level = getExpiryLevel(item.expiryDate);
  const used = item.status === "used";

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border bg-white p-3 shadow-sm ${
        used ? "opacity-50" : ""
      }`}
    >
      <button
        aria-label={used ? "標記為未使用" : "標記為已使用"}
        onClick={() => onToggleUsed(!used)}
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
          used ? "border-rose-500 bg-rose-500 text-white" : "border-gray-300"
        }`}
      >
        {used && "✓"}
      </button>

      <button onClick={onEdit} className="min-w-0 flex-1 text-left" aria-label="編輯品項">
        {item.brand && <p className="truncate text-xs text-gray-400">{item.brand}</p>}
        <p className={`truncate text-sm font-medium text-gray-900 ${used ? "line-through" : ""}`}>
          {item.name}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {item.packageType === "小樣" && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
              小樣
            </span>
          )}
          {item.capacity && (
            <span className="text-xs text-gray-400">{item.capacity}</span>
          )}
          {!used && (
            <span
              className={`rounded-full border px-2 py-0.5 text-xs ${EXPIRY_BADGE_CLASS[level]}`}
            >
              {formatExpiryText(item.expiryDate)}
            </span>
          )}
        </div>
        {item.note && <p className="mt-1 truncate text-xs text-gray-400">{item.note}</p>}
        {used && item.usedByName && (
          <p className="mt-1 truncate text-xs text-gray-400">由 {item.usedByName} 標記已使用</p>
        )}
      </button>

      <button
        aria-label="複製新增"
        onClick={onDuplicate}
        className="shrink-0 rounded-full p-2 text-gray-300 active:bg-gray-100 active:text-gray-500"
      >
        +
      </button>

      <button
        aria-label="刪除"
        onClick={onDelete}
        className="shrink-0 rounded-full p-2 text-gray-300 active:bg-gray-100 active:text-gray-500"
      >
        🗑
      </button>
    </div>
  );
}
