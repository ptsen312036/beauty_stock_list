import { useState } from "react";
import type { Category, StockItem } from "../types";
import { CATEGORY_THEME } from "../lib/categoryTheme";
import { EXPIRY_BADGE_CLASS, formatExpiryText, getExpiryLevel } from "../lib/expiry";
import { ItemCard } from "./ItemCard";

interface Props {
  category: Category;
  label: string;
  items: StockItem[];
  forceExpanded?: boolean;
  onToggleUsed: (item: StockItem, used: boolean) => void;
  onDelete: (item: StockItem) => void;
  onEdit: (item: StockItem) => void;
  onDuplicate: (item: StockItem) => void;
  selectionMode?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (item: StockItem) => void;
}

export function ProductGroupCard({
  category,
  label,
  items,
  forceExpanded = false,
  onToggleUsed,
  onDelete,
  onEdit,
  onDuplicate,
  selectionMode = false,
  selectedIds,
  onToggleSelect,
}: Props) {
  const [localExpanded, setLocalExpanded] = useState(false);
  const theme = CATEGORY_THEME[category];

  const cardFor = (item: StockItem) => (
    <ItemCard
      key={item.id}
      item={item}
      onToggleUsed={(used) => onToggleUsed(item, used)}
      onDelete={() => onDelete(item)}
      onEdit={() => onEdit(item)}
      onDuplicate={() => onDuplicate(item)}
      selectionMode={selectionMode}
      selected={selectedIds?.has(item.id) ?? false}
      onToggleSelect={() => onToggleSelect?.(item)}
    />
  );

  const expanded = forceExpanded || localExpanded;
  // items is already sorted active-first-by-soonest-expiry, so the first active
  // item is the one worth surfacing on the collapsed summary row.
  const nearest = items.find((i) => i.status !== "used") ?? null;
  const nearestLevel = nearest ? getExpiryLevel(nearest.expiryDate) : null;

  return (
    <div
      className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition-shadow ${
        expanded ? "border-gray-200" : "border-gray-100"
      }`}
    >
      <button
        onClick={() => setLocalExpanded((v) => !v)}
        className="flex w-full items-center gap-2.5 px-3 py-2.5 active:bg-gray-50"
      >
        <span className={`h-full w-1 shrink-0 self-stretch rounded-full ${theme.accentBar}`} />
        <span className="min-w-0 flex-1 truncate text-left text-sm font-medium text-gray-800">
          {label}
        </span>
        {nearest && nearestLevel ? (
          <span
            className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${EXPIRY_BADGE_CLASS[nearestLevel]}`}
          >
            {formatExpiryText(nearest.expiryDate)}
          </span>
        ) : (
          <span className="shrink-0 rounded-full border border-gray-200 bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
            已使用
          </span>
        )}
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${theme.badge}`}>
          {items.length} 件
        </span>
        <span
          className={`shrink-0 text-gray-300 transition-transform duration-200 ${
            expanded ? "rotate-180" : ""
          }`}
        >
          ▾
        </span>
      </button>

      {expanded && (
        <ul className="space-y-2 border-t border-gray-100 bg-gray-50/50 p-2">
          {items.map((item) => (
            <li key={item.id}>{cardFor(item)}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
