import { CATEGORIES, type Category, type StockItem } from "../types";
import { CATEGORY_THEME } from "../lib/categoryTheme";

const UNCATEGORIZED_LABEL = "未分類";

interface Props {
  items: StockItem[];
  onRenameSubcategory: (category: Category, oldKey: string) => void;
  onMoveSubcategory: (category: Category, oldKey: string) => void;
  onMoveItem: (item: StockItem) => void;
  onClose: () => void;
}

interface SubcategoryBucket {
  key: string;
  items: StockItem[];
}

export function CategorySettingsModal({
  items,
  onRenameSubcategory,
  onMoveSubcategory,
  onMoveItem,
  onClose,
}: Props) {
  const byCategory = new Map<Category, Map<string, StockItem[]>>();
  for (const item of items) {
    const bySub = byCategory.get(item.category) ?? new Map<string, StockItem[]>();
    const key = item.subcategory || UNCATEGORIZED_LABEL;
    const arr = bySub.get(key) ?? [];
    arr.push(item);
    bySub.set(key, arr);
    byCategory.set(item.category, bySub);
  }

  function bucketsFor(category: Category): SubcategoryBucket[] {
    const bySub = byCategory.get(category);
    if (!bySub) return [];
    return [...bySub.entries()]
      .map(([key, subItems]) => ({ key, items: subItems }))
      .sort((a, b) => a.key.localeCompare(b.key, "zh-Hant"));
  }

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
        <p className="mb-4 text-xs text-gray-400">
          點品項旁的 ⇄ 可以單獨把那一件換到別的分類；次分類旁的 ⇄
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
                          {bucket.items.map((item) => (
                            <li
                              key={item.id}
                              className="flex items-center justify-between rounded-lg bg-white px-2.5 py-1.5"
                            >
                              <span className="min-w-0 flex-1 truncate text-sm text-gray-700">
                                {item.brand && (
                                  <span className="text-gray-400">{item.brand} · </span>
                                )}
                                {item.name}
                              </span>
                              <button
                                onClick={() => onMoveItem(item)}
                                aria-label={`搬移「${item.name}」`}
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
      </div>
    </div>
  );
}
