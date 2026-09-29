import type { StockItem } from "../types";
import { EXPIRY_BADGE_CLASS, formatCapacity, formatExpiryText, getExpiryLevel } from "../lib/expiry";
import { CATEGORY_THEME } from "../lib/categoryTheme";

interface Props {
  item: StockItem;
  onToggleUsed: (used: boolean) => void;
  onDelete: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  selectionMode?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
}

export function ItemCard({
  item,
  onToggleUsed,
  onDelete,
  onEdit,
  onDuplicate,
  selectionMode = false,
  selected = false,
  onToggleSelect,
}: Props) {
  const level = getExpiryLevel(item.expiryDate);
  const used = item.status === "used";
  const theme = CATEGORY_THEME[item.category];

  return (
    <div
      className={`flex items-stretch gap-0 overflow-hidden rounded-2xl border bg-white shadow-sm transition-shadow ${
        selected ? "border-rose-300 ring-2 ring-rose-100" : "border-gray-100"
      } ${used ? "opacity-60" : selectionMode ? "" : "hover:shadow-md"}`}
    >
      <div className={`w-1.5 shrink-0 ${theme.accentBar}`} />

      <div className="flex flex-1 items-center gap-2.5 p-3">
        <button
          aria-label={selectionMode ? (selected ? "取消選取" : "選取") : used ? "標記為未使用" : "標記為已使用"}
          onClick={() => (selectionMode ? onToggleSelect?.() : onToggleUsed(!used))}
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
            selectionMode
              ? selected
                ? "border-rose-500 bg-rose-500 text-white"
                : "border-gray-300 active:border-rose-400"
              : used
                ? "border-rose-500 bg-rose-500 text-white"
                : "border-gray-300 active:border-rose-400"
          }`}
        >
          {(selectionMode ? selected : used) && "✓"}
        </button>

        <button
          onClick={selectionMode ? onToggleSelect : onEdit}
          className="min-w-0 flex-1 text-left"
          aria-label={selectionMode ? "選取品項" : "編輯品項"}
        >
          {item.brand && (
            <p className="truncate text-xs font-medium text-gray-400">{item.brand}</p>
          )}
          <p
            className={`truncate text-sm font-semibold text-gray-900 ${used ? "line-through" : ""}`}
          >
            {item.name}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {item.packageType === "小樣" && (
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${theme.badge}`}>
                小樣
              </span>
            )}
            {item.capacity && (
              <span className="rounded-full bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700">
                {formatCapacity(item.capacity)}
              </span>
            )}
            {!used && (
              <span
                className={`rounded-full border px-2 py-0.5 text-xs font-medium ${EXPIRY_BADGE_CLASS[level]}`}
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

        {!selectionMode && (
          <>
            <button
              aria-label="複製新增"
              onClick={onDuplicate}
              className="shrink-0 rounded-full bg-gray-50 p-2 text-gray-400 active:bg-rose-50 active:text-rose-500"
            >
              +
            </button>

            <button
              aria-label="刪除"
              onClick={onDelete}
              className="shrink-0 rounded-full bg-gray-50 p-2 text-gray-400 active:bg-red-50 active:text-red-500"
            >
              🗑
            </button>
          </>
        )}
      </div>
    </div>
  );
}
