import { useRef, useState } from "react";
import { CATEGORIES, type Category, type StockItem } from "../types";

interface Props {
  addedByEmail: string;
  addedByName: string;
  brands: string[];
  subcategories: string[];
  onClose: () => void;
  onSubmit: (item: Omit<StockItem, "id">) => Promise<void>;
}

export function AddItemModal({
  addedByEmail,
  addedByName,
  brands,
  subcategories,
  onClose,
  onSubmit,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [ocrRunning, setOcrRunning] = useState(false);
  const [ocrNotice, setOcrNotice] = useState<string | null>(null);

  const [brand, setBrand] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category>(CATEGORIES[0]);
  const [subcategory, setSubcategory] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setOcrRunning(true);
    setOcrNotice(null);

    try {
      const { recognizeExpiry } = await import("../lib/ocr");
      const result = await recognizeExpiry(file);
      if (result.guessedDate) {
        setExpiryDate(result.guessedDate);
        setOcrNotice("已自動帶入辨識到的效期，請確認是否正確");
      } else {
        setOcrNotice("沒有自動辨識到效期，請手動輸入");
      }
    } catch {
      setOcrNotice("辨識失敗，請手動輸入效期");
    } finally {
      setOcrRunning(false);
      // Photo is only used locally for OCR — release it, nothing is uploaded.
      URL.revokeObjectURL(url);
      setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setSaveError(null);
    try {
      await onSubmit({
        brand: brand.trim(),
        name: name.trim(),
        category,
        subcategory: subcategory.trim(),
        expiryDate: expiryDate || null,
        quantity,
        note: note.trim(),
        status: "active",
        addedByEmail,
        addedByName,
        createdAt: Date.now(),
        usedAt: null,
      });
      onClose();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "新增失敗，請再試一次");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-5 sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">新增存貨</h2>
          <button onClick={onClose} className="text-gray-400" aria-label="關閉">
            ✕
          </button>
        </div>

        <div className="mb-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhoto}
            className="hidden"
            id="photo-input"
          />
          <label
            htmlFor="photo-input"
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-rose-200 bg-rose-50 py-4 text-sm font-medium text-rose-600 active:bg-rose-100"
          >
            {previewUrl && (
              <img src={previewUrl} alt="" className="h-10 w-10 rounded object-cover" />
            )}
            {ocrRunning ? "辨識中…" : "📷 拍照辨識效期"}
          </label>
          {ocrNotice && <p className="mt-1.5 text-xs text-gray-500">{ocrNotice}</p>}
          <p className="mt-1 text-[11px] text-gray-400">
            照片僅用於本機辨識效期，辨識後即捨棄、不會上傳或儲存
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">品牌（選填）</label>
            <input
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="例如：Chanel"
              list="brand-options"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-rose-400 focus:outline-none"
            />
            <datalist id="brand-options">
              {brands.map((b) => (
                <option key={b} value={b} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">品名</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：SK-II 青春露"
              required
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-rose-400 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">分類</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-rose-400 focus:outline-none"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">子分類（選填）</label>
              <input
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                placeholder="例如：精華液"
                list="subcategory-options"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-rose-400 focus:outline-none"
              />
              <datalist id="subcategory-options">
                {subcategories.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">數量</label>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-rose-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">有效期限</label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-rose-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">備註（選填）</label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="例如：媽媽周年慶買的"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-rose-400 focus:outline-none"
            />
          </div>

          {saveError && <p className="text-xs text-red-500">{saveError}</p>}

          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="mt-2 w-full rounded-xl bg-rose-600 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? "新增中…" : "新增到清單"}
          </button>
        </form>
      </div>
    </div>
  );
}
