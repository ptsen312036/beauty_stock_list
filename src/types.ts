export const CATEGORIES = [
  "臉部保養",
  "身體保養",
  "頭髮護理",
  "彩妝",
  "香氛",
  "保健食品",
  "其他",
] as const;

export type Category = (typeof CATEGORIES)[number];

export interface StockList {
  id: string;
  name: string;
  ownerEmail: string;
  memberEmails: string[];
  createdAt: number;
}

export type ItemStatus = "active" | "used";

export interface StockItem {
  id: string;
  brand: string;
  name: string;
  category: Category;
  subcategory: string;
  expiryDate: string | null; // ISO date string yyyy-mm-dd
  quantity: number;
  note: string;
  status: ItemStatus;
  addedByEmail: string;
  addedByName: string;
  createdAt: number;
  usedAt: number | null;
}

export type ExpiryLevel = "expired" | "soon" | "later" | "ok" | "none";
