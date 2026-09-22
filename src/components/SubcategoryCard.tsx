import type { StockItem } from "../types";
import { ItemCard } from "./ItemCard";

interface Props {
  label: string;
  items: StockItem[];
  expanded: boolean;
  onToggleExpand: () => void;
  onToggleUsed: (item: StockItem, used: boolean) => void;
  onDelete: (item: StockItem) => void;
  onEdit: (item: StockItem) => void;
  onDuplicate: (item: StockItem) => void;
}

export function SubcategoryCard({
  label,
  items,
  expanded,
  onToggleExpand,
  onToggleUsed,
  onDelete,
  onEdit,
  onDuplicate,
}: Props) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white">
      <button
        onClick={onToggleExpand}
        className="flex w-full items-center justify-between px-3 py-2.5 active:bg-gray-50"
      >
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
            {items.length}
          </span>
          <span className={`text-gray-300 transition-transform ${expanded ? "rotate-180" : ""}`}>
            ▾
          </span>
        </div>
      </button>

      {expanded && (
        <ul className="space-y-2 border-t border-gray-100 p-2">
          {items.map((item) => (
            <li key={item.id}>
              <ItemCard
                item={item}
                onToggleUsed={(used) => onToggleUsed(item, used)}
                onDelete={() => onDelete(item)}
                onEdit={() => onEdit(item)}
                onDuplicate={() => onDuplicate(item)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
