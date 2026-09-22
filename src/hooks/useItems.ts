import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import type { StockItem } from "../types";

interface ItemRow {
  id: string;
  list_id: string;
  name: string;
  category: string;
  expiry_date: string | null;
  quantity: number;
  note: string;
  status: "active" | "used";
  added_by_email: string;
  added_by_name: string;
  created_at: string;
  used_at: string | null;
}

function mapRow(row: ItemRow): StockItem {
  return {
    id: row.id,
    name: row.name,
    category: row.category as StockItem["category"],
    expiryDate: row.expiry_date,
    quantity: row.quantity,
    note: row.note,
    status: row.status,
    addedByEmail: row.added_by_email,
    addedByName: row.added_by_name,
    createdAt: new Date(row.created_at).getTime(),
    usedAt: row.used_at ? new Date(row.used_at).getTime() : null,
  };
}

export function useItems(listId: string | null) {
  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!listId) {
      setItems([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    async function load() {
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .eq("list_id", listId)
        .order("created_at", { ascending: false });
      if (!cancelled && !error && data) {
        setItems((data as ItemRow[]).map(mapRow));
      }
      if (!cancelled) setLoading(false);
    }

    load();

    // Any family member's change (add / check off / delete) re-syncs everyone live.
    const channel = supabase
      .channel(`items-${listId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "items", filter: `list_id=eq.${listId}` },
        () => load(),
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [listId]);

  async function addItem(listId: string, item: Omit<StockItem, "id">) {
    await supabase.from("items").insert({
      list_id: listId,
      name: item.name,
      category: item.category,
      expiry_date: item.expiryDate,
      quantity: item.quantity,
      note: item.note,
      status: item.status,
      added_by_email: item.addedByEmail,
      added_by_name: item.addedByName,
    });
  }

  async function markUsed(_listId: string, itemId: string, used: boolean) {
    await supabase
      .from("items")
      .update({ status: used ? "used" : "active", used_at: used ? new Date().toISOString() : null })
      .eq("id", itemId);
  }

  async function deleteItem(_listId: string, itemId: string) {
    await supabase.from("items").delete().eq("id", itemId);
  }

  return { items, loading, addItem, markUsed, deleteItem };
}
