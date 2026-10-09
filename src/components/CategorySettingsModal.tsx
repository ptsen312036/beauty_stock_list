import { CATEGORIES, type Category } from "../types";
import { CATEGORY_THEME } from "../lib/categoryTheme";

interface Props {
  subcategoriesByCategory: Partial<Record<Category, string[]>>;
  onRenameSubcategory: (category: Category, oldKey: string) => void;
  onMoveSubcategory: (category: Category, oldKey: string) => void;
  onClose: () => void;
}

export function CategorySettingsModal({
  subcategoriesByCategory,
  onRenameSubcategory,
  onMoveSubcategory,
  onClose,
}: Props) {
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
          這裡列出每個大分類底下目前有品項的子分類。✎ 重新命名只改名字，⇄
          搬移可以把底下所有品項整組換到別的大分類／子分類。
        </p>

        <div className="space-y-4">
          {CATEGORIES.map((category) => {
            const subcategories = subcategoriesByCategory[category];
            const theme = CATEGORY_THEME[category];
            return (
              <div key={category}>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${theme.badge}`}
                >
                  {category}
                </span>
                {subcategories ? (
                  <ul className="mt-2 space-y-1.5">
                    {subcategories.map((sub) => (
                      <li
                        key={sub}
                        className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2"
                      >
                        <span className="truncate text-sm text-gray-700">{sub}</span>
                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            onClick={() => onMoveSubcategory(category, sub)}
                            aria-label={`搬移「${sub}」底下的品項`}
                            className="rounded-lg px-2 py-1 text-gray-400 active:bg-gray-100 active:text-gray-600"
                          >
                            ⇄
                          </button>
                          <button
                            onClick={() => onRenameSubcategory(category, sub)}
                            aria-label={`重新命名「${sub}」`}
                            className="rounded-lg px-2 py-1 text-gray-400 active:bg-gray-100 active:text-gray-600"
                          >
                            ✎
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
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
