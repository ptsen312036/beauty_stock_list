import { createWorker } from "tesseract.js";

export interface OcrResult {
  rawText: string;
  guessedDate: string | null; // ISO yyyy-mm-dd
}

/** Runs OCR fully in the browser. The image never leaves the device. */
export async function recognizeExpiry(image: Blob): Promise<OcrResult> {
  const worker = await createWorker("eng");
  try {
    const {
      data: { text },
    } = await worker.recognize(image);
    return { rawText: text, guessedDate: guessDateFromText(text) };
  } finally {
    await worker.terminate();
  }
}

const DATE_PATTERNS: RegExp[] = [
  // 2026-03-05 / 2026/03/05 / 2026.03.05 / 2026年3月5日
  /(20\d{2})[.\-/年](\d{1,2})[.\-/月](\d{1,2})日?/,
  // 2026-03 / 2026/03 / 2026年3月
  /(20\d{2})[.\-/年](\d{1,2})月?(?!\d)/,
  // 03/2026 or 03-2026 (month first, common on cosmetics: MM/YYYY)
  /(\d{1,2})[.\-/](20\d{2})/,
];

export function guessDateFromText(text: string): string | null {
  const cleaned = text.replace(/\s+/g, "");

  let m = cleaned.match(DATE_PATTERNS[0]);
  if (m) {
    return toIso(m[1], m[2], m[3]);
  }

  m = cleaned.match(DATE_PATTERNS[1]);
  if (m) {
    return toIso(m[1], m[2], "1");
  }

  m = cleaned.match(DATE_PATTERNS[2]);
  if (m) {
    return toIso(m[2], m[1], "1");
  }

  return null;
}

function toIso(year: string, month: string, day: string): string | null {
  const y = Number(year);
  const mo = Number(month);
  const d = Number(day);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
