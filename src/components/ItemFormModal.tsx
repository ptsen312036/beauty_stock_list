import { useRef, useState } from "react";
import { CATEGORIES, PACKAGE_TYPES, type Category, type ItemFormValues, type PackageType } from "../types";

interface Props {
  brands: string[];
  subcategories: string[];
  initialValues?: ItemFormValues;
  isEditing?: boolean;
  onClose: () => void;
  onSubmit: (values: ItemFormValues) => Promise<void>;
}

export function ItemFormModal({
  brands,
  subcategories,
  initialValues,
  isEditing = false,
  onClose,
  onSubmit,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [ocrRunning, setOcrRunning] = useState(false);
  const [ocrNotice, setOcrNotice] = useState<string | null>(null);

  const [brand, setBrand] = useState(initialValues?.brand ?? "");
  const [name, setName] = useState(initialValues?.name ?? "");
  const [category, setCategory] = useState<Category>(initialValues?.category ?? CATEGORIES[0]);
  const [subcategory, setSubcategory] = useState(initialValues?.subcategory ?? "");
  const [packageType, setPackageType] = useState<PackageType>(
    initialValues?.packageType ?? PACKAGE_TYPES[0],
  );
  const [capacity, setCapacity] = useState(initialValues?.capacity ?? "");
  const [expiryDate, setExpiryDate] = useState(initialValues?.expiryDate ?? "");
  const [note, setNote] = useState(initialValues?.note ?? "");
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
        packageType,
        capacity: capacity.trim(),
        expiryDate: expiryDate || null,
        note: note.trim(),
      });
      onClose();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "儲存失敗，請再試一次");
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-100";
  const labelClass = "mb-1 block text-xs font-semibold text-gray-500";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">{isEditing ? "編輯存貨" : "新增存貨"}</h2>
          <button
            onClick={onClose}
            className="rounded-full bg-gray-50 px-2.5 py-1 text-gray-400 active:bg-gray-100"
            aria-label="關閉"
          >
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
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-rose-200 bg-rose-50 py-4 text-sm font-medium text-rose-600 active:bg-rose-100"
          >
            {previewUrl && (
              <img src={previewUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />
            )}
            {ocrRunning ? "辨識中…" : "📷 拍照辨識效期"}
          </label>
          {ocrNotice && <p className="mt-1.5 text-xs text-gray-500">{ocrNotice}</p>}
          <p className="mt-1 text-[11px] text-gray-400">
            照片僅用於本機辨識效期，辨識後即捨棄、不會上傳或儲存
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-3 rounded-2xl bg-gray-50 p-3">
            <div>
              <label className={labelClass}>品牌（選填）</label>
              <input
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="例如：Chanel"
                list="brand-options"
                className={inputClass}
              />
              <datalist id="brand-options">
                {brands.map((b) => (
                  <option key={b} value={b} />
                ))}
              </datalist>
            </div>

            <div>
              <label className={labelClass}>品名</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：SK-II 青春露"
                required
                className={inputClass}
              />
            </div>
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
                placeholder="例如：精華液"
                list="subcategory-options"
                className={inputClass}
              />
              <datalist id="subcategory-options">
                {subcategories.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 rounded-2xl bg-gray-50 p-3">
            <div>
              <label className={labelClass}>正貨／小樣</label>
              <select
                value={packageType}
                onChange={(e) => setPackageType(e.target.value as PackageType)}
                className={inputClass}
              >
                {PACKAGE_TYPES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>容量（選填）</label>
              <input
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                placeholder="例如：30ml"
                className={inputClass}
              />
            </div>
          </div>

          <div className="space-y-3 rounded-2xl bg-gray-50 p-3">
            <div>
              <label className={labelClass}>有效期限</label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>備註（選填）</label>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="例如：媽媽周年慶買的"
                className={inputClass}
              />
            </div>
          </div>

          {saveError && <p className="text-xs text-red-500">{saveError}</p>}

          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="mt-2 w-full rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 py-3 text-sm font-semibold text-white shadow-md shadow-rose-600/20 disabled:opacity-50"
          >
            {saving ? "儲存中…" : isEditing ? "儲存修改" : "新增到清單"}
          </button>
        </form>
      </div>
    </div>
  );
}
