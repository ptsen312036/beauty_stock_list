import { useEffect, useMemo, useState } from "react";
import { useAuth } from "./hooks/useAuth";
import { useLists } from "./hooks/useLists";
import { useItems } from "./hooks/useItems";
import { Login } from "./components/Login";
import { SubcategoryCard } from "./components/SubcategoryCard";
import { ItemFormModal } from "./components/ItemFormModal";
import { ListsModal } from "./components/ListsModal";
import { CATEGORIES, type Category, type StockItem } from "./types";
import { daysUntil } from "./lib/expiry";

type FilterTab = "all" | "expired" | "soon";

const SELECTED_LIST_KEY = "beauty-stock-selected-list";
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
  minDays: number | null;
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

  const { lists, loading: listsLoading, createList, addMember, removeMember, deleteList } =
    useLists(userEmail);

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
  const { items, addItem, updateItem, markUsed, deleteItem, brands, subcategories } =
    useItems(selectedListId);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const [showListsModal, setShowListsModal] = useState(false);
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [categoryFilter, setCategoryFilter] = useState<Category | "all">("all");
  const [showUsed, setShowUsed] = useState(false);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

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

  const categoryGroups = useMemo<CategoryGroup[]>(() => {
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
        const minDays = sortedItems.reduce<number | null>((min, item) => {
          const d = daysUntil(item.expiryDate);
          if (d === null) return min;
          return min === null ? d : Math.min(min, d);
        }, null);
        return { key, label: key, items: sortedItems, minDays };
      });

      subgroups.sort((a, b) => {
        if (a.minDays === null && b.minDays === null) {
          return a.label.localeCompare(b.label, "zh-Hant");
        }
        if (a.minDays === null) return 1;
        if (b.minDays === null) return -1;
        return a.minDays - b.minDays;
      });

      return { category, subgroups };
    });
  }, [visibleItems]);

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
    markUsed(selectedList.id, item.id, used, { email: userEmail ?? "", name: displayName }).catch(
      (err) => alert(err instanceof Error ? err.message : "更新失敗，請再試一次"),
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

  if (authLoading) {
    return <div className="flex min-h-dvh items-center justify-center text-gray-400">載入中…</div>;
  }

  if (!user) {
    return <Login onSignIn={signIn} />;
  }

  return (
    <div className="min-h-dvh bg-gray-50 pb-24">
      <header className="sticky top-0 z-10 border-b border-gray-100 bg-white/90 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <button
            onClick={() => setShowListsModal(true)}
            className="flex min-w-0 flex-col items-start text-left"
          >
            <span className="truncate text-base font-bold text-gray-900">
              {selectedList ? selectedList.name : listsLoading ? "載入中…" : "尚未選擇清單"}
            </span>
            <span className="text-xs text-gray-400">切換 / 管理清單 ▾</span>
          </button>
          <div className="flex items-center gap-2">
            {avatarUrl && (
              <img src={avatarUrl} alt="" className="h-8 w-8 rounded-full" referrerPolicy="no-referrer" />
            )}
            <button onClick={signOut} className="text-xs text-gray-400">
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
              className="mt-4 rounded-full bg-rose-600 px-5 py-2 text-sm font-medium text-white"
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
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${
                  categoryFilter === "all"
                    ? "bg-gray-800 text-white"
                    : "bg-white text-gray-500 border border-gray-200"
                }`}
              >
                全部分類
              </button>
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategoryFilter(c)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${
                    categoryFilter === c
                      ? "bg-gray-800 text-white"
                      : "bg-white text-gray-500 border border-gray-200"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            <div className="mt-2 flex justify-end">
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

            <div className="mt-2 space-y-4">
              {categoryGroups.map(({ category, subgroups }) => (
                <div key={category}>
                  <h2 className="mb-1.5 text-xs font-semibold text-gray-400">{category}</h2>
                  <div className="space-y-2">
                    {subgroups.map(({ key, label, items: subItems }) => {
                      const groupKey = `${category}::${key}`;
                      return (
                        <SubcategoryCard
                          key={groupKey}
                          label={label}
                          items={subItems}
                          expanded={expandedKeys.has(groupKey)}
                          onToggleExpand={() => toggleExpanded(groupKey)}
                          onToggleUsed={handleToggleUsed}
                          onDelete={handleDeleteItem}
                          onEdit={setEditingItem}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
              {categoryGroups.length === 0 && (
                <p className="py-12 text-center text-sm text-gray-400">這裡還沒有任何品項</p>
              )}
            </div>
          </>
        )}
      </main>

      {selectedList && (
        <button
          onClick={() => setShowAddModal(true)}
          aria-label="新增存貨"
          className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-rose-600 text-2xl text-white shadow-lg active:scale-95"
        >
          +
        </button>
      )}

      {showAddModal && selectedList && (
        <ItemFormModal
          brands={brands}
          subcategories={subcategories}
          onClose={() => setShowAddModal(false)}
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
            const id = await createList(name, user.email ?? "");
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
    </div>
  );
}

export default App;
