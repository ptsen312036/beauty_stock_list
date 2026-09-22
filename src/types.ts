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

export const PACKAGE_TYPES = ["正貨", "小樣"] as const;

export type PackageType = (typeof PACKAGE_TYPES)[number];

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
  packageType: PackageType;
  capacity: string;
  expiryDate: string | null; // ISO date string yyyy-mm-dd
  note: string;
  status: ItemStatus;
  addedByEmail: string;
  addedByName: string;
  createdAt: number;
  usedAt: number | null;
  usedByEmail: string | null;
  usedByName: string | null;
}

export type ItemFormValues = Pick<
  StockItem,
  | "brand"
  | "name"
  | "category"
  | "subcategory"
  | "packageType"
  | "capacity"
  | "expiryDate"
  | "note"
>;

export type ExpiryLevel = "expired" | "soon" | "later" | "ok" | "none";
