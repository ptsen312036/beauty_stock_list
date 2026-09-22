import type { Category, StockItem } from "../types";
import { CATEGORY_THEME } from "../lib/categoryTheme";
import { ItemCard } from "./ItemCard";

interface Props {
  category: Category;
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
  category,
  label,
  items,
  expanded,
  onToggleExpand,
  onToggleUsed,
  onDelete,
  onEdit,
  onDuplicate,
}: Props) {
  const theme = CATEGORY_THEME[category];

  return (
    <div
      className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition-shadow ${
        expanded ? "border-gray-200 shadow-md" : "border-gray-100"
      }`}
    >
      <button
        onClick={onToggleExpand}
        className="flex w-full items-center justify-between px-3.5 py-3 active:bg-gray-50"
      >
        <span className="text-sm font-semibold text-gray-800">{label}</span>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${theme.badge}`}>
            {items.length}
          </span>
          <span
            className={`text-gray-300 transition-transform duration-200 ${
              expanded ? "rotate-180" : ""
            }`}
          >
            ▾
          </span>
        </div>
      </button>

      {expanded && (
        <ul className="space-y-2 border-t border-gray-100 bg-gray-50/50 p-2.5">
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
