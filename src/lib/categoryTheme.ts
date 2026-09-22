import type { Category } from "../types";

interface CategoryTheme {
  chipActive: string;
  chipInactive: string;
  badge: string;
  accentBar: string;
}

export const CATEGORY_THEME: Record<Category, CategoryTheme> = {
  臉部保養: {
    chipActive: "bg-rose-600 text-white border-rose-600",
    chipInactive: "bg-rose-50 text-rose-700 border-rose-200",
    badge: "bg-rose-100 text-rose-700",
    accentBar: "bg-rose-400",
  },
  身體保養: {
    chipActive: "bg-amber-600 text-white border-amber-600",
    chipInactive: "bg-amber-50 text-amber-700 border-amber-200",
    badge: "bg-amber-100 text-amber-700",
    accentBar: "bg-amber-400",
  },
  頭髮護理: {
    chipActive: "bg-emerald-600 text-white border-emerald-600",
    chipInactive: "bg-emerald-50 text-emerald-700 border-emerald-200",
    badge: "bg-emerald-100 text-emerald-700",
    accentBar: "bg-emerald-400",
  },
  彩妝: {
    chipActive: "bg-fuchsia-600 text-white border-fuchsia-600",
    chipInactive: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200",
    badge: "bg-fuchsia-100 text-fuchsia-700",
    accentBar: "bg-fuchsia-400",
  },
  香氛: {
    chipActive: "bg-violet-600 text-white border-violet-600",
    chipInactive: "bg-violet-50 text-violet-700 border-violet-200",
    badge: "bg-violet-100 text-violet-700",
    accentBar: "bg-violet-400",
  },
  保健食品: {
    chipActive: "bg-sky-600 text-white border-sky-600",
    chipInactive: "bg-sky-50 text-sky-700 border-sky-200",
    badge: "bg-sky-100 text-sky-700",
    accentBar: "bg-sky-400",
  },
  其他: {
    chipActive: "bg-slate-600 text-white border-slate-600",
    chipInactive: "bg-slate-50 text-slate-700 border-slate-200",
    badge: "bg-slate-100 text-slate-700",
    accentBar: "bg-slate-400",
  },
};
