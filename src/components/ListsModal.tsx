import { useState } from "react";
import type { StockList } from "../types";

interface Props {
  lists: StockList[];
  selectedListId: string | null;
  currentUserEmail: string;
  onSelect: (listId: string) => void;
  onClose: () => void;
  onCreate: (name: string) => Promise<void>;
  onAddMember: (listId: string, email: string) => Promise<void>;
  onRemoveMember: (listId: string, email: string) => Promise<void>;
  onDeleteList: (listId: string) => Promise<void>;
}

export function ListsModal({
  lists,
  selectedListId,
  currentUserEmail,
  onSelect,
  onClose,
  onCreate,
  onAddMember,
  onRemoveMember,
  onDeleteList,
}: Props) {
  const [newListName, setNewListName] = useState("");
  const [creating, setCreating] = useState(false);
  const [managingId, setManagingId] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newListName.trim()) return;
    setCreating(true);
    setError(null);
    try {
      await onCreate(newListName.trim());
      setNewListName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "建立清單失敗，請稍後再試");
    } finally {
      setCreating(false);
    }
  }

  const managingList = lists.find((l) => l.id === managingId) ?? null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">我的清單</h2>
          <button
            onClick={onClose}
            className="rounded-full bg-gray-50 px-2.5 py-1 text-gray-400 active:bg-gray-100"
            aria-label="關閉"
          >
            ✕
          </button>
        </div>

        {!managingList ? (
          <>
            <ul className="space-y-2">
              {lists.map((list) => (
                <li
                  key={list.id}
                  className={`flex items-center justify-between rounded-2xl border p-3 shadow-sm ${
                    list.id === selectedListId
                      ? "border-rose-200 bg-rose-50"
                      : "border-gray-100 bg-white"
                  }`}
                >
                  <button
                    className="flex-1 text-left"
                    onClick={() => {
                      onSelect(list.id);
                      onClose();
                    }}
                  >
                    <p className="text-sm font-semibold text-gray-900">{list.name}</p>
                    <p className="text-xs text-gray-400">
                      {list.memberEmails.length} 位成員
                      {list.ownerEmail === currentUserEmail ? "・你是擁有者" : ""}
                    </p>
                  </button>
                  <button
                    className="ml-2 shrink-0 rounded-full bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-500 active:bg-gray-100"
                    onClick={() => setManagingId(list.id)}
                  >
                    管理
                  </button>
                </li>
              ))}
              {lists.length === 0 && (
                <p className="py-6 text-center text-sm text-gray-400">還沒有清單，建立一個吧</p>
              )}
            </ul>

            <form onSubmit={handleCreate} className="mt-4 flex gap-2">
              <input
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="新清單名稱，例如：新竹家裡保養品"
                className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-100"
              />
              <button
                type="submit"
                disabled={creating || !newListName.trim()}
                className="rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-rose-600/20 disabled:opacity-50"
              >
                建立
              </button>
            </form>
            {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
          </>
        ) : (
          <div>
            <button
              onClick={() => setManagingId(null)}
              className="mb-3 text-sm text-rose-600"
            >
              ← 返回清單
            </button>
            <h3 className="mb-2 text-sm font-semibold text-gray-900">{managingList.name}</h3>

            <p className="mb-1 text-xs font-medium text-gray-500">成員</p>
            <ul className="mb-3 space-y-1.5">
              {managingList.memberEmails.map((email) => (
                <li
                  key={email}
                  className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2 text-sm"
                >
                  <span className="truncate text-gray-700">
                    {email}
                    {email === managingList.ownerEmail && (
                      <span className="ml-1 text-xs text-gray-400">(擁有者)</span>
                    )}
                  </span>
                  {email !== managingList.ownerEmail &&
                    managingList.ownerEmail === currentUserEmail && (
                      <button
                        onClick={() => onRemoveMember(managingList.id, email)}
                        className="text-xs text-gray-400"
                      >
                        移除
                      </button>
                    )}
                </li>
              ))}
            </ul>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!inviteEmail.trim()) return;
                setError(null);
                try {
                  await onAddMember(managingList.id, inviteEmail);
                  setInviteEmail("");
                } catch (err) {
                  setError(err instanceof Error ? err.message : "邀請失敗，請稍後再試");
                }
              }}
              className="flex gap-2"
            >
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="家人的 Gmail 信箱"
                className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-100"
              />
              <button
                type="submit"
                className="rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-rose-600/20"
              >
                邀請
              </button>
            </form>
            <p className="mt-1 text-[11px] text-gray-400">
              對方需用該 Gmail 帳號登入才能看到這份清單
            </p>
            {error && <p className="mt-2 text-xs text-red-500">{error}</p>}

            {managingList.ownerEmail === currentUserEmail && (
              <button
                onClick={async () => {
                  if (confirm(`確定要刪除清單「${managingList.name}」嗎？`)) {
                    await onDeleteList(managingList.id);
                    setManagingId(null);
                  }
                }}
                className="mt-6 w-full rounded-xl border border-red-200 bg-red-50 py-2 text-sm font-medium text-red-500"
              >
                刪除整個清單
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
