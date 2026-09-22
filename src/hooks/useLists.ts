import { useCallback, useEffect, useState } from "react";
import { supabase } from "../supabase";
import type { StockList } from "../types";

interface ListRow {
  id: string;
  name: string;
  owner_email: string;
  created_at: string;
  list_members: { email: string }[];
}

function mapRow(row: ListRow): StockList {
  return {
    id: row.id,
    name: row.name,
    ownerEmail: row.owner_email,
    memberEmails: row.list_members.map((m) => m.email),
    createdAt: new Date(row.created_at).getTime(),
  };
}

export function useLists(userEmail: string | null) {
  const [lists, setLists] = useState<StockList[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userEmail) {
      setLists([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("lists")
      .select("id, name, owner_email, created_at, list_members(email)")
      .order("created_at", { ascending: true });
    if (!error && data) {
      setLists((data as unknown as ListRow[]).map(mapRow));
    }
    setLoading(false);
  }, [userEmail]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function createList(name: string, ownerEmail: string) {
    const { data, error } = await supabase
      .from("lists")
      .insert({ name, owner_email: ownerEmail })
      .select()
      .single();
    if (error || !data) {
      console.error("createList failed", { error, data });
      throw new Error(error?.message ?? "建立清單失敗：伺服器沒有回傳新清單資料");
    }
    await refresh();
    return data.id as string;
  }

  async function renameList(listId: string, name: string) {
    await supabase.from("lists").update({ name }).eq("id", listId);
    await refresh();
  }

  async function addMember(listId: string, email: string) {
    await supabase
      .from("list_members")
      .insert({ list_id: listId, email: email.trim().toLowerCase() });
    await refresh();
  }

  async function removeMember(listId: string, email: string) {
    await supabase.from("list_members").delete().eq("list_id", listId).eq("email", email);
    await refresh();
  }

  async function deleteList(listId: string) {
    await supabase.from("lists").delete().eq("id", listId);
    await refresh();
  }

  return { lists, loading, createList, renameList, addMember, removeMember, deleteList };
}
