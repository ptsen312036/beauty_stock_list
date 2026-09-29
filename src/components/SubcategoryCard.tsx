import type { Category, StockItem } from "../types";
import { CATEGORY_THEME } from "../lib/categoryTheme";
import { ProductGroupCard } from "./ProductGroupCard";

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
  selectionMode?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (item: StockItem) => void;
  dragHandle?: React.ReactNode;
}

function productKey(item: StockItem) {
  return `${item.brand}|${item.name}|${item.packageType}|${item.capacity}`;
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
  selectionMode = false,
  selectedIds,
  onToggleSelect,
  dragHandle,
}: Props) {
  const theme = CATEGORY_THEME[category];

  const productGroups: { key: string; label: string; items: StockItem[] }[] = [];
  const groupIndex = new Map<string, number>();
  for (const item of items) {
    const key = productKey(item);
    const idx = groupIndex.get(key);
    if (idx === undefined) {
      groupIndex.set(key, productGroups.length);
      productGroups.push({ key, label: item.name, items: [item] });
    } else {
      productGroups[idx].items.push(item);
    }
  }

  const showExpanded = expanded || (selectionMode && items.length > 0);

  return (
    <div
      className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition-shadow ${
        expanded ? "border-gray-200 shadow-md" : "border-gray-100"
      }`}
    >
      <div className="flex w-full items-center gap-1 px-1.5 py-1.5">
        {dragHandle}
        <button
          onClick={onToggleExpand}
          className="flex flex-1 items-center justify-between rounded-xl px-2 py-1.5 active:bg-gray-50"
        >
          <span className="text-sm font-semibold text-gray-800">{label}</span>
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${theme.badge}`}>
              {items.length}
            </span>
            <span
              className={`text-gray-300 transition-transform duration-200 ${
                showExpanded ? "rotate-180" : ""
              }`}
            >
              ▾
            </span>
          </div>
        </button>
      </div>

      {showExpanded && (
        <ul className="space-y-2 border-t border-gray-100 bg-gray-50/50 p-2.5">
          {productGroups.map((group) => (
            <li key={group.key}>
              <ProductGroupCard
                category={category}
                label={group.label}
                items={group.items}
                forceExpanded={selectionMode}
                onToggleUsed={onToggleUsed}
                onDelete={onDelete}
                onEdit={onEdit}
                onDuplicate={onDuplicate}
                selectionMode={selectionMode}
                selectedIds={selectedIds}
                onToggleSelect={onToggleSelect}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
