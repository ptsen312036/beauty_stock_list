import { useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useAuth } from "./hooks/useAuth";
import { useLists } from "./hooks/useLists";
import { useItems } from "./hooks/useItems";
import { Login } from "./components/Login";
import { SortableSubcategoryCard } from "./components/SortableSubcategoryCard";
import { ItemFormModal } from "./components/ItemFormModal";
import { ListsModal } from "./components/ListsModal";
import { MoveItemsModal } from "./components/MoveItemsModal";
import { CategorySettingsModal } from "./components/CategorySettingsModal";
import { CATEGORIES, type Category, type ItemFormValues, type StockItem } from "./types";
import { daysUntil } from "./lib/expiry";
import { CATEGORY_THEME } from "./lib/categoryTheme";

type FilterTab = "all" | "expired" | "soon";
type SortMode = "custom" | "recent";

const SELECTED_LIST_KEY = "beauty-stock-selected-list";
const SORT_MODE_KEY = "beauty-stock-sort-mode";
const UNCATEGORIZED_LABEL = "未分類";

function compareByExpiry(a: StockItem, b: StockItem) {
  if (a.status !== b.status) return a.status === "used" ? 1 : -1;
  const da = daysUntil(a.expiryDate);
  const db = daysUntil(b.expiryDate);
  if (da === null && db === null) return b.createdAt - a.createdAt;
  if (da === null) return 1;
  if (db === null) return -1;
  return da - db;
}

interface SubcategoryGroup {
  key: string;
  label: string;
  items: StockItem[];
  maxCreatedAt: number;
}

interface CategoryGroup {
  category: Category;
  subgroups: SubcategoryGroup[];
}

function App() {
  const { user, loading: authLoading, signIn, signOut } = useAuth();
  const userEmail = user?.email ?? null;
  const displayName = (user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? "匿名";
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;

  const {
    lists,
    loading: listsLoading,
    createList,
    addMember,
    removeMember,
    deleteList,
    updateSubcategoryOrder,
  } = useLists(userEmail);

  const [selectedListId, setSelectedListId] = useState<string | null>(
    () => localStorage.getItem(SELECTED_LIST_KEY),
  );

  useEffect(() => {
    if (selectedListId && lists.some((l) => l.id === selectedListId)) return;
    if (lists.length > 0) {
      setSelectedListId(lists[0].id);
    } else {
      setSelectedListId(null);
    }
  }, [lists, selectedListId]);

  useEffect(() => {
    if (selectedListId) localStorage.setItem(SELECTED_LIST_KEY, selectedListId);
  }, [selectedListId]);

  const selectedList = lists.find((l) => l.id === selectedListId) ?? null;
  const {
    items,
    addItem,
    updateItem,
    markUsed,
    deleteItem,
    renameSubcategory,
    bulkMoveCategory,
    brands,
    subcategories,
  } = useItems(selectedListId);

  const [showAddModal, setShowAddModal] = useState(false);
  const [addInitialValues, setAddInitialValues] = useState<ItemFormValues | null>(null);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const [showListsModal, setShowListsModal] = useState(false);
  const [showCategorySettings, setShowCategorySettings] = useState(false);
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [categoryFilter, setCategoryFilter] = useState<Category | "all">("all");
  const [showUsed, setShowUsed] = useState(false);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  const [sortMode, setSortMode] = useState<SortMode>(
    () => (localStorage.getItem(SORT_MODE_KEY) as SortMode | null) ?? "custom",
  );
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [usedToast, setUsedToast] = useState<StockItem | null>(null);
  const usedToastTimerRef = useRef<number | null>(null);

  const dragSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  useEffect(() => {
    localStorage.setItem(SORT_MODE_KEY, sortMode);
  }, [sortMode]);

  const subcategoriesByCategory = useMemo(() => {
    const byCategory = new Map<Category, Set<string>>();
    for (const item of items) {
      const set = byCategory.get(item.category) ?? new Set<string>();
      set.add(item.subcategory || UNCATEGORIZED_LABEL);
      byCategory.set(item.category, set);
    }
    const result: Partial<Record<Category, string[]>> = {};
    for (const category of CATEGORIES) {
      const keys = byCategory.get(category);
      if (keys) {
        result[category] = [...keys].sort((a, b) => a.localeCompare(b, "zh-Hant"));
      }
    }
    return result;
  }, [items]);

  const visibleItems = useMemo(() => {
    let list = items.filter((i) => (showUsed ? true : i.status === "active"));

    if (categoryFilter !== "all") {
      list = list.filter((i) => i.category === categoryFilter);
    }
    if (filterTab === "expired") {
      list = list.filter((i) => {
        const d = daysUntil(i.expiryDate);
        return d !== null && d < 0;
      });
    } else if (filterTab === "soon") {
      list = list.filter((i) => {
        const d = daysUntil(i.expiryDate);
        return d !== null && d >= 0 && d <= 30;
      });
    }

    return list;
  }, [items, categoryFilter, filterTab, showUsed]);

  const subcategoryOrder = selectedList?.subcategoryOrder;

  const categoryGroups = useMemo<CategoryGroup[]>(() => {
    const customOrder = subcategoryOrder ?? {};
    const byCategory = new Map<Category, StockItem[]>();
    for (const item of visibleItems) {
      const arr = byCategory.get(item.category) ?? [];
      arr.push(item);
      byCategory.set(item.category, arr);
    }

    return CATEGORIES.filter((c) => byCategory.has(c)).map((category) => {
      const bySub = new Map<string, StockItem[]>();
      for (const item of byCategory.get(category)!) {
        const key = item.subcategory || UNCATEGORIZED_LABEL;
        const arr = bySub.get(key) ?? [];
        arr.push(item);
        bySub.set(key, arr);
      }

      const subgroups: SubcategoryGroup[] = [...bySub.entries()].map(([key, subItems]) => {
        const sortedItems = [...subItems].sort(compareByExpiry);
        const maxCreatedAt = subItems.reduce((max, item) => Math.max(max, item.createdAt), 0);
        return { key, label: key, items: sortedItems, maxCreatedAt };
      });

      if (sortMode === "recent") {
        subgroups.sort((a, b) => b.maxCreatedAt - a.maxCreatedAt);
      } else {
        const orderIndex = new Map(
          (customOrder[category] ?? []).map((key, idx) => [key, idx]),
        );
        subgroups.sort((a, b) => {
          const ia = orderIndex.get(a.key);
          const ib = orderIndex.get(b.key);
          if (ia !== undefined && ib !== undefined) return ia - ib;
          if (ia !== undefined) return -1;
          if (ib !== undefined) return 1;
          return a.label.localeCompare(b.label, "zh-Hant");
        });
      }

      return { category, subgroups };
    });
  }, [visibleItems, sortMode, subcategoryOrder]);

  function toggleExpanded(key: string) {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  function handleToggleUsed(item: StockItem, used: boolean) {
    if (!selectedList) return;
    markUsed(selectedList.id, item.id, used, { email: userEmail ?? "", name: displayName })
      .then(() => {
        if (usedToastTimerRef.current) window.clearTimeout(usedToastTimerRef.current);
        if (used) {
          setUsedToast(item);
          usedToastTimerRef.current = window.setTimeout(() => setUsedToast(null), 4000);
        } else if (usedToast?.id === item.id) {
          setUsedToast(null);
        }
      })
      .catch((err) => alert(err instanceof Error ? err.message : "更新失敗，請再試一次"));
  }

  function handleUndoUsed() {
    if (!selectedList || !usedToast) return;
    if (usedToastTimerRef.current) window.clearTimeout(usedToastTimerRef.current);
    const item = usedToast;
    setUsedToast(null);
    markUsed(selectedList.id, item.id, false, { email: userEmail ?? "", name: displayName }).catch(
      (err) => alert(err instanceof Error ? err.message : "復原失敗，請再試一次"),
    );
  }

  function handleDeleteItem(item: StockItem) {
    if (!selectedList) return;
    if (confirm(`確定要刪除「${item.name}」嗎？`)) {
      deleteItem(selectedList.id, item.id).catch((err) =>
        alert(err instanceof Error ? err.message : "刪除失敗，請再試一次"),
      );
    }
  }

  function handleDuplicate(item: StockItem) {
    setAddInitialValues({
      brand: item.brand,
      name: item.name,
      category: item.category,
      subcategory: item.subcategory,
      packageType: item.packageType,
      capacity: item.capacity,
      expiryDate: item.expiryDate,
      note: "",
    });
    setShowAddModal(true);
  }

  function toggleMultiSelectMode() {
    setMultiSelectMode((prev) => {
      if (prev) setSelectedItemIds(new Set());
      return !prev;
    });
  }

  function toggleSelectItem(item: StockItem) {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(item.id)) {
        next.delete(item.id);
      } else {
        next.add(item.id);
      }
      return next;
    });
  }

  async function handleBulkMove(target: { category: Category; subcategory: string }) {
    if (!selectedList) return;
    await bulkMoveCategory(selectedList.id, [...selectedItemIds], target);
    setSelectedItemIds(new Set());
    setMultiSelectMode(false);
  }

  async function handleRenameSubcategory(category: Category, oldKey: string) {
    if (!selectedList) return;
    const oldSubcategory = oldKey === UNCATEGORIZED_LABEL ? "" : oldKey;
    const input = prompt(`將「${oldKey}」重新命名為：`, oldSubcategory);
    if (input === null) return;
    const newSubcategory = input.trim();
    if (newSubcategory === oldSubcategory) return;

    try {
      await renameSubcategory(selectedList.id, category, oldSubcategory, newSubcategory);
      const newKey = newSubcategory || UNCATEGORIZED_LABEL;
      const currentOrder = selectedList.subcategoryOrder[category] ?? [];
      if (currentOrder.includes(oldKey)) {
        const newOrder = currentOrder.map((k) => (k === oldKey ? newKey : k));
        await updateSubcategoryOrder(selectedList.id, category, newOrder);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "重新命名失敗，請再試一次");
    }
  }

  function handleSubcategoryDragEnd(category: Category, subgroupKeys: string[], event: DragEndEvent) {
    if (!selectedList) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = subgroupKeys.indexOf(String(active.id));
    const newIndex = subgroupKeys.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    const newOrder = arrayMove(subgroupKeys, oldIndex, newIndex);
    updateSubcategoryOrder(selectedList.id, category, newOrder).catch((err) =>
      alert(err instanceof Error ? err.message : "排序更新失敗，請再試一次"),
    );
  }

  if (authLoading) {
    return <div className="flex min-h-dvh items-center justify-center text-gray-400">載入中…</div>;
  }

  if (!user) {
    return <Login onSignIn={signIn} />;
  }

  return (
    <div className="min-h-dvh bg-gradient-to-b from-rose-50/60 to-gray-50 pb-24">
      <header className="sticky top-0 z-10 border-b border-rose-100 bg-white/90 px-4 py-3 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <button
            onClick={() => setShowListsModal(true)}
            className="flex min-w-0 flex-col items-start text-left"
          >
            <span className="truncate text-base font-bold text-gray-900">
              {selectedList ? selectedList.name : listsLoading ? "載入中…" : "尚未選擇清單"}
            </span>
            <span className="text-xs font-medium text-rose-400">切換 / 管理清單 ▾</span>
          </button>
          <div className="flex items-center gap-2.5">
            {selectedList && (
              <button
                onClick={() => setShowCategorySettings(true)}
                aria-label="類別設定"
                className="rounded-full bg-gray-50 px-2.5 py-1.5 text-sm text-gray-400 active:bg-gray-100"
              >
                ⚙️
              </button>
            )}
            {avatarUrl && (
              <img
                src={avatarUrl}
                alt=""
                className="h-9 w-9 rounded-full ring-2 ring-rose-100"
                referrerPolicy="no-referrer"
              />
            )}
            <button
              onClick={signOut}
              className="rounded-full bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-400 active:bg-gray-100"
            >
              登出
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 pt-3">
        {!selectedList ? (
          <div className="mt-16 text-center text-sm text-gray-400">
            <p>還沒有清單，先建立一個吧！</p>
            <button
              onClick={() => setShowListsModal(true)}
              className="mt-4 rounded-full bg-gradient-to-br from-rose-500 to-rose-600 px-5 py-2 text-sm font-medium text-white shadow-md shadow-rose-600/20"
            >
              建立清單
            </button>
          </div>
        ) : (
          <>
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
              {(
                [
                  ["all", "全部"],
                  ["expired", "已過期"],
                  ["soon", "即將到期"],
                ] as [FilterTab, string][]
              ).map(([tab, label]) => (
                <button
                  key={tab}
                  onClick={() => setFilterTab(tab)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${
                    filterTab === tab
                      ? "bg-rose-600 text-white"
                      : "bg-white text-gray-500 border border-gray-200"
                  }`}
                >
                  {label}
                </button>
              ))}
              <span className="my-auto h-4 w-px shrink-0 bg-gray-200" />
              <button
                onClick={() => setCategoryFilter("all")}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  categoryFilter === "all"
                    ? "border-gray-800 bg-gray-800 text-white"
                    : "border-gray-200 bg-white text-gray-500"
                }`}
              >
                全部分類
              </button>
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategoryFilter(c)}
                  className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    categoryFilter === c ? CATEGORY_THEME[c].chipActive : CATEGORY_THEME[c].chipInactive
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            <div className="mt-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 rounded-full bg-gray-100 p-0.5 text-xs font-medium">
                <button
                  onClick={() => setSortMode("custom")}
                  className={`rounded-full px-2.5 py-1 transition-colors ${
                    sortMode === "custom" ? "bg-white text-gray-800 shadow-sm" : "text-gray-400"
                  }`}
                >
                  自訂順序
                </button>
                <button
                  onClick={() => setSortMode("recent")}
                  className={`rounded-full px-2.5 py-1 transition-colors ${
                    sortMode === "recent" ? "bg-white text-gray-800 shadow-sm" : "text-gray-400"
                  }`}
                >
                  最新更新
                </button>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleMultiSelectMode}
                  className={`text-xs font-medium ${multiSelectMode ? "text-rose-600" : "text-gray-400"}`}
                >
                  {multiSelectMode ? "取消多選" : "多選"}
                </button>
                <label className="flex items-center gap-1.5 text-xs text-gray-400">
                  <input
                    type="checkbox"
                    checked={showUsed}
                    onChange={(e) => setShowUsed(e.target.checked)}
                    className="accent-rose-600"
                  />
                  顯示已使用
                </label>
              </div>
            </div>

            <div className="mt-2 space-y-4">
              {categoryGroups.map(({ category, subgroups }) => {
                const subgroupKeys = subgroups.map((g) => g.key);
                return (
                  <div key={category}>
                    <div className="mb-1.5 flex items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${CATEGORY_THEME[category].badge}`}
                      >
                        {category}
                      </span>
                    </div>
                    <DndContext
                      sensors={dragSensors}
                      collisionDetection={closestCenter}
                      onDragEnd={(event) => handleSubcategoryDragEnd(category, subgroupKeys, event)}
                    >
                      <SortableContext items={subgroupKeys} strategy={verticalListSortingStrategy}>
                        <div className="space-y-2">
                          {subgroups.map(({ key, label, items: subItems }) => {
                            const groupKey = `${category}::${key}`;
                            return (
                              <SortableSubcategoryCard
                                key={groupKey}
                                id={key}
                                draggable={sortMode === "custom"}
                                category={category}
                                label={label}
                                items={subItems}
                                expanded={expandedKeys.has(groupKey)}
                                onToggleExpand={() => toggleExpanded(groupKey)}
                                onToggleUsed={handleToggleUsed}
                                onDelete={handleDeleteItem}
                                onEdit={setEditingItem}
                                onDuplicate={handleDuplicate}
                                onRename={() => handleRenameSubcategory(category, key)}
                                selectionMode={multiSelectMode}
                                selectedIds={selectedItemIds}
                                onToggleSelect={toggleSelectItem}
                              />
                            );
                          })}
                        </div>
                      </SortableContext>
                    </DndContext>
                  </div>
                );
              })}
              {categoryGroups.length === 0 && (
                <p className="py-12 text-center text-sm text-gray-400">這裡還沒有任何品項</p>
              )}
            </div>
          </>
        )}
      </main>

      {selectedList && !multiSelectMode && (
        <button
          onClick={() => {
            setAddInitialValues(null);
            setShowAddModal(true);
          }}
          aria-label="新增存貨"
          className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-rose-600 text-2xl text-white shadow-lg shadow-rose-600/30 transition-transform active:scale-95"
        >
          +
        </button>
      )}

      {usedToast && !multiSelectMode && (
        <div className="fixed inset-x-0 bottom-24 z-20 flex justify-center px-4">
          <div className="flex max-w-md items-center gap-3 rounded-full bg-gray-900/90 py-2.5 pl-4 pr-2 text-sm text-white shadow-lg backdrop-blur">
            <span className="truncate">已將「{usedToast.name}」標記為已使用</span>
            <button
              onClick={handleUndoUsed}
              className="shrink-0 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold active:bg-white/25"
            >
              復原
            </button>
          </div>
        </div>
      )}

      {multiSelectMode && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-gray-100 bg-white/95 px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] backdrop-blur">
          <div className="mx-auto flex max-w-md items-center justify-between gap-3">
            <span className="text-sm font-medium text-gray-600">已選 {selectedItemIds.size} 件</span>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMultiSelectMode}
                className="rounded-full bg-gray-50 px-3.5 py-2 text-xs font-medium text-gray-500 active:bg-gray-100"
              >
                取消
              </button>
              <button
                onClick={() => setShowMoveModal(true)}
                disabled={selectedItemIds.size === 0}
                className="rounded-full bg-gradient-to-br from-rose-500 to-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-rose-600/20 disabled:opacity-40"
              >
                移動到…
              </button>
            </div>
          </div>
        </div>
      )}

      {showMoveModal && (
        <MoveItemsModal
          count={selectedItemIds.size}
          subcategories={subcategories}
          onClose={() => setShowMoveModal(false)}
          onConfirm={handleBulkMove}
        />
      )}

      {showAddModal && selectedList && (
        <ItemFormModal
          brands={brands}
          subcategories={subcategories}
          initialValues={addInitialValues ?? undefined}
          onClose={() => {
            setShowAddModal(false);
            setAddInitialValues(null);
          }}
          onSubmit={(values) =>
            addItem(selectedList.id, {
              ...values,
              status: "active",
              addedByEmail: user.email ?? "",
              addedByName: displayName,
              createdAt: Date.now(),
              usedAt: null,
              usedByEmail: null,
              usedByName: null,
            })
          }
        />
      )}

      {editingItem && selectedList && (
        <ItemFormModal
          brands={brands}
          subcategories={subcategories}
          initialValues={editingItem}
          isEditing
          onClose={() => setEditingItem(null)}
          onSubmit={(values) => updateItem(selectedList.id, editingItem.id, values)}
        />
      )}

      {showListsModal && (
        <ListsModal
          lists={lists}
          selectedListId={selectedListId}
          currentUserEmail={user.email ?? ""}
          onSelect={setSelectedListId}
          onClose={() => setShowListsModal(false)}
          onCreate={async (name) => {
            const id = await createList(name);
            setSelectedListId(id);
          }}
          onAddMember={addMember}
          onRemoveMember={removeMember}
          onDeleteList={async (id) => {
            await deleteList(id);
            if (selectedListId === id) setSelectedListId(null);
          }}
        />
      )}

      {showCategorySettings && (
        <CategorySettingsModal
          subcategoriesByCategory={subcategoriesByCategory}
          onRenameSubcategory={handleRenameSubcategory}
          onClose={() => setShowCategorySettings(false)}
        />
      )}
    </div>
  );
}

export default App;
