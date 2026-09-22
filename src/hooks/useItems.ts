import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../supabase";
import type { ItemFormValues, StockItem } from "../types";

interface ItemRow {
  id: string;
  list_id: string;
  brand: string;
  name: string;
  category: string;
  subcategory: string;
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
    brand: row.brand,
    name: row.name,
    category: row.category as StockItem["category"],
    subcategory: row.subcategory,
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

function distinctValues(items: StockItem[], pick: (item: StockItem) => string): string[] {
  const values = new Set<string>();
  for (const item of items) {
    const value = pick(item).trim();
    if (value) values.add(value);
  }
  return [...values].sort((a, b) => a.localeCompare(b, "zh-Hant"));
}

export function useItems(listId: string | null) {
  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const loadRef = useRef<() => Promise<void>>(async () => {});

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
    loadRef.current = load;

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
    const { error } = await supabase.from("items").insert({
      list_id: listId,
      brand: item.brand,
      name: item.name,
      category: item.category,
      subcategory: item.subcategory,
      expiry_date: item.expiryDate,
      quantity: item.quantity,
      note: item.note,
      status: item.status,
      added_by_email: item.addedByEmail,
      added_by_name: item.addedByName,
    });
    if (error) throw new Error(error.message);
    await loadRef.current();
  }

  async function updateItem(_listId: string, itemId: string, values: ItemFormValues) {
    const { error } = await supabase
      .from("items")
      .update({
        brand: values.brand,
        name: values.name,
        category: values.category,
        subcategory: values.subcategory,
        expiry_date: values.expiryDate,
        quantity: values.quantity,
        note: values.note,
      })
      .eq("id", itemId);
    if (error) throw new Error(error.message);
    await loadRef.current();
  }

  async function markUsed(_listId: string, itemId: string, used: boolean) {
    const { error } = await supabase
      .from("items")
      .update({ status: used ? "used" : "active", used_at: used ? new Date().toISOString() : null })
      .eq("id", itemId);
    if (error) throw new Error(error.message);
    await loadRef.current();
  }

  async function deleteItem(_listId: string, itemId: string) {
    const { error } = await supabase.from("items").delete().eq("id", itemId);
    if (error) throw new Error(error.message);
    await loadRef.current();
  }

  const brands = useMemo(() => distinctValues(items, (i) => i.brand), [items]);
  const subcategories = useMemo(() => distinctValues(items, (i) => i.subcategory), [items]);

  return { items, loading, addItem, updateItem, markUsed, deleteItem, brands, subcategories };
}
