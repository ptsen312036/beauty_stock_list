import { useState } from "react";
import { CATEGORIES, type Category } from "../types";

interface Props {
  count: number;
  subcategories: string[];
  initialCategory?: Category;
  initialSubcategory?: string;
  onClose: () => void;
  onConfirm: (target: { category: Category; subcategory: string }) => Promise<void>;
}

export function MoveItemsModal({
  count,
  subcategories,
  initialCategory,
  initialSubcategory,
  onClose,
  onConfirm,
}: Props) {
  const [category, setCategory] = useState<Category>(initialCategory ?? CATEGORIES[0]);
  const [subcategory, setSubcategory] = useState(initialSubcategory ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputClass =
    "w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-100";
  const labelClass = "mb-1 block text-xs font-semibold text-gray-500";

  async function handleConfirm() {
    setSaving(true);
    setError(null);
    try {
      await onConfirm({ category, subcategory: subcategory.trim() });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "移動失敗，請再試一次");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="w-full max-w-md rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">移動 {count} 件品項</h2>
          <button
            onClick={onClose}
            className="rounded-full bg-gray-50 px-2.5 py-1 text-gray-400 active:bg-gray-100"
            aria-label="關閉"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-2xl bg-gray-50 p-3">
          <div>
            <label className={labelClass}>分類</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className={inputClass}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>子分類（選填）</label>
            <input
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
              placeholder="例如：乳液"
              list="move-subcategory-options"
              className={inputClass}
            />
            <datalist id="move-subcategory-options">
              {subcategories.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>
        </div>

        {error && <p className="mt-2 text-xs text-red-500">{error}</p>}

        <button
          onClick={handleConfirm}
          disabled={saving}
          className="mt-4 w-full rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 py-3 text-sm font-semibold text-white shadow-md shadow-rose-600/20 disabled:opacity-50"
        >
          {saving ? "移動中…" : `移動到「${category}${subcategory.trim() ? " / " + subcategory.trim() : ""}」`}
        </button>
      </div>
    </div>
  );
}
