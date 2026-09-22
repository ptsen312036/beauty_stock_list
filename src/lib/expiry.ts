import type { ExpiryLevel } from "../types";

/** Days remaining until expiry, negative if already expired. */
export function daysUntil(expiryDate: string | null): number | null {
  if (!expiryDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(expiryDate + "T00:00:00");
  const diffMs = target.getTime() - today.getTime();
  return Math.round(diffMs / 86_400_000);
}

export function getExpiryLevel(expiryDate: string | null): ExpiryLevel {
  const days = daysUntil(expiryDate);
  if (days === null) return "none";
  if (days < 0) return "expired";
  if (days <= 30) return "soon";
  if (days <= 90) return "later";
  return "ok";
}

export const EXPIRY_LABEL: Record<ExpiryLevel, string> = {
  expired: "已過期",
  soon: "即將過期",
  later: "3個月內",
  ok: "效期充足",
  none: "未標示效期",
};

export const EXPIRY_BADGE_CLASS: Record<ExpiryLevel, string> = {
  expired: "bg-red-100 text-red-700 border-red-200",
  soon: "bg-amber-100 text-amber-700 border-amber-200",
  later: "bg-yellow-50 text-yellow-700 border-yellow-200",
  ok: "bg-emerald-50 text-emerald-700 border-emerald-200",
  none: "bg-gray-100 text-gray-500 border-gray-200",
};

export function formatExpiryText(expiryDate: string | null): string {
  const days = daysUntil(expiryDate);
  if (days === null) return "未標示效期";
  if (days < 0) return `已過期 ${Math.abs(days)} 天`;
  if (days === 0) return "今天到期";
  return `剩 ${days} 天`;
}

/** Appends the ml unit, stripping any "ml" the user already typed to avoid "30mlml". */
export function formatCapacity(capacity: string): string {
  const trimmed = capacity.trim();
  if (!trimmed) return "";
  return `${trimmed.replace(/\s*ml$/i, "")}ml`;
}
