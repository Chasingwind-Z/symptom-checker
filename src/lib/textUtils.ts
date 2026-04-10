const INTERNAL_PATTERNS = [
  /仅保留更值得.*?[。\n]/g,
  /帮助快速区分.*?[。\n]/g,
  /以下为系统.*?[。\n]/g,
  /\[内部指令\].*?\n/g,
  /\[DEBUG\].*?\n/g,
];

export function sanitizeForDisplay(text: string): string {
  let cleaned = text;
  for (const pattern of INTERNAL_PATTERNS) {
    cleaned = cleaned.replace(pattern, '');
  }
  return cleaned.trim();
}
