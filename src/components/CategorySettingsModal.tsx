import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CATEGORIES, type Category, type StockItem } from "../types";
import { CATEGORY_THEME } from "../lib/categoryTheme";

const UNCATEGORIZED_LABEL = "未分類";
type SortMode = "custom" | "recent";

interface Props {
  items: StockItem[];
  sortMode: SortMode;
  onSortModeChange: (mode: SortMode) => void;
  subcategoryOrder: Record<string, string[]>;
  onReorderSubcategories: (category: Category, newOrder: string[]) => void;
  onRenameSubcategory: (category: Category, oldKey: string) => void;
  onMoveSubcategory: (category: Category, oldKey: string) => void;
  onMoveProduct: (items: StockItem[]) => void;
  onClose: () => void;
}

function SortableRow({ id, label }: { id: string; label: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-1 rounded-lg bg-white px-1 py-1 ${isDragging ? "z-10 opacity-90 shadow-md" : ""}`}
    >
      <button
        {...attributes}
        {...listeners}
        aria-label="拖曳排序"
        className="shrink-0 cursor-grab touch-none rounded-lg px-1.5 py-1.5 text-gray-300 active:cursor-grabbing"
      >
        ⠿
      </button>
      <span className="truncate text-sm text-gray-700">{label}</span>
    </li>
  );
}

export function CategorySettingsModal({
  items,
  sortMode,
  onSortModeChange,
  subcategoryOrder,
  onReorderSubcategories,
  onRenameSubcategory,
  onMoveSubcategory,
  onMoveProduct,
  onClose,
}: Props) {
  const dragSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const byCategory = new Map<Category, Map<string, StockItem[]>>();
  for (const item of items) {
    const bySub = byCategory.get(item.category) ?? new Map<string, StockItem[]>();
    const key = item.subcategory || UNCATEGORIZED_LABEL;
    const arr = bySub.get(key) ?? [];
    arr.push(item);
    bySub.set(key, arr);
    byCategory.set(item.category, bySub);
  }

  function subKeysFor(category: Category): string[] {
    return [...(byCategory.get(category)?.keys() ?? [])];
  }

  function orderedSubKeysFor(category: Category): string[] {
    const known = subKeysFor(category);
    const knownSet = new Set(known);
    const current = subcategoryOrder[category] ?? [];
    const ordered = current.filter((k) => knownSet.has(k));
    const rest = known
      .filter((k) => !current.includes(k))
      .sort((a, b) => a.localeCompare(b, "zh-Hant"));
    return [...ordered, ...rest];
  }

  function bucketsFor(category: Category) {
    const bySub = byCategory.get(category);
    if (!bySub) return [];
    return orderedSubKeysFor(category)
      .filter((key) => bySub.has(key))
      .map((key) => ({ key, items: bySub.get(key)! }));
  }

  function productsFor(subItems: StockItem[]) {
    const groups: { key: string; label: string; items: StockItem[] }[] = [];
    const index = new Map<string, number>();
    for (const item of subItems) {
      const key = `${item.brand}|${item.name}`;
      const idx = index.get(key);
      if (idx === undefined) {
        index.set(key, groups.length);
        groups.push({ key, label: item.name, items: [item] });
      } else {
        groups[idx].items.push(item);
      }
    }
    return groups;
  }

  function handleDragEnd(category: Category, orderedKeys: string[], event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = orderedKeys.indexOf(String(active.id));
    const newIndex = orderedKeys.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    onReorderSubcategories(category, arrayMove(orderedKeys, oldIndex, newIndex));
  }

  const categoriesWithSubs = CATEGORIES.filter((c) => subKeysFor(c).length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">類別設定</h2>
          <button
            onClick={onClose}
            className="rounded-full bg-gray-50 px-2.5 py-1 text-gray-400 active:bg-gray-100"
            aria-label="關閉"
          >
            ✕
          </button>
        </div>

        <section className="mb-6">
          <h3 className="mb-1.5 text-sm font-bold text-gray-800">排序</h3>
          <div className="mb-3 flex items-center gap-1 rounded-full bg-gray-100 p-0.5 text-xs font-medium">
            <button
              onClick={() => onSortModeChange("custom")}
              className={`flex-1 rounded-full px-2.5 py-1 transition-colors ${
                sortMode === "custom" ? "bg-white text-gray-800 shadow-sm" : "text-gray-400"
              }`}
            >
              自訂順序
            </button>
            <button
              onClick={() => onSortModeChange("recent")}
              className={`flex-1 rounded-full px-2.5 py-1 transition-colors ${
                sortMode === "recent" ? "bg-white text-gray-800 shadow-sm" : "text-gray-400"
              }`}
            >
              最新更新
            </button>
          </div>
          <p className="mb-3 text-xs text-gray-400">
            拖曳 ⠿ 可以調整次分類卡片在清單裡的順序；上面切到「最新更新」時清單會改用自動排序，但這裡排好的順序會保留，之後切回「自訂順序」就會用上。
          </p>
          <div className="space-y-3">
            {categoriesWithSubs.map((category) => {
              const orderedKeys = orderedSubKeysFor(category);
              const theme = CATEGORY_THEME[category];
              return (
                <div key={category}>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${theme.badge}`}
                  >
                    {category}
                  </span>
                  <DndContext
                    sensors={dragSensors}
                    collisionDetection={closestCenter}
                    onDragEnd={(event) => handleDragEnd(category, orderedKeys, event)}
                  >
                    <SortableContext items={orderedKeys} strategy={verticalListSortingStrategy}>
                      <ul className="mt-1.5 space-y-1 rounded-xl bg-gray-50 p-1.5">
                        {orderedKeys.map((key) => (
                          <SortableRow key={key} id={key} label={key} />
                        ))}
                      </ul>
                    </SortableContext>
                  </DndContext>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <h3 className="mb-1.5 text-sm font-bold text-gray-800">品項管理</h3>
          <p className="mb-3 text-xs text-gray-400">
            同商品只列一次。點商品旁的 ⇄ 可以把它整組換到別的分類；次分類旁的 ⇄
            會把底下所有品項整組換過去，✎ 只改次分類的名字。
          </p>

          <div className="space-y-5">
            {CATEGORIES.map((category) => {
              const buckets = bucketsFor(category);
              const theme = CATEGORY_THEME[category];
              return (
                <div key={category}>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${theme.badge}`}
                  >
                    {category}
                  </span>
                  {buckets.length > 0 ? (
                    <div className="mt-2 space-y-3">
                      {buckets.map((bucket) => (
                        <div key={bucket.key} className="rounded-xl bg-gray-50 p-2.5">
                          <div className="flex items-center justify-between">
                            <span className="truncate text-xs font-semibold text-gray-600">
                              {bucket.key}
                            </span>
                            <div className="flex shrink-0 items-center gap-1">
                              <button
                                onClick={() => onMoveSubcategory(category, bucket.key)}
                                aria-label={`搬移「${bucket.key}」底下的品項`}
                                className="rounded-lg px-1.5 py-0.5 text-gray-400 active:bg-gray-200 active:text-gray-600"
                              >
                                ⇄
                              </button>
                              <button
                                onClick={() => onRenameSubcategory(category, bucket.key)}
                                aria-label={`重新命名「${bucket.key}」`}
                                className="rounded-lg px-1.5 py-0.5 text-gray-400 active:bg-gray-200 active:text-gray-600"
                              >
                                ✎
                              </button>
                            </div>
                          </div>
                          <ul className="mt-1.5 space-y-1">
                            {productsFor(bucket.items).map((product) => (
                              <li
                                key={product.key}
                                className="flex items-center justify-between rounded-lg bg-white px-2.5 py-1.5"
                              >
                                <span className="min-w-0 flex-1 truncate text-sm text-gray-700">
                                  {product.items[0].brand && (
                                    <span className="text-gray-400">
                                      {product.items[0].brand} ·{" "}
                                    </span>
                                  )}
                                  {product.label}
                                  {product.items.length > 1 && (
                                    <span className="ml-1 text-xs text-gray-400">
                                      ×{product.items.length}
                                    </span>
                                  )}
                                </span>
                                <button
                                  onClick={() => onMoveProduct(product.items)}
                                  aria-label={`搬移「${product.label}」`}
                                  className="shrink-0 rounded-lg px-2 py-0.5 text-gray-400 active:bg-gray-100 active:text-gray-600"
                                >
                                  ⇄
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-gray-300">目前沒有品項</p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
